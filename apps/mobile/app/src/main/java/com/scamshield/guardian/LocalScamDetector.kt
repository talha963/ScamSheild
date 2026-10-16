package com.scamshield.guardian

/**
 * On-device scam scoring. A direct port of the backend's evaluate_scammer_tactics so the app
 * can protect a call, and run a demo, with no server and no internet at all.
 *
 * The server (with Gemini) is still better: it transcribes real speech and understands context.
 * This exists so ScamShield degrades to "works offline" instead of "does nothing".
 */
object LocalScamDetector {

    data class Verdict(
        val riskScore: Int,
        val tier: Int,
        val alertTriggered: Boolean,
        val detectedTactics: List<String>,
        val evidencePhrases: List<String>
    )

    private val AUTHORITY = listOf(
        "state bank", "sbp", "bank officer", "security", "manager", "head office",
        "fia", "police", "customs", "pta", "officer", "inspector",
        "hbl", "meezan", "ubl", "court", "اسٹیٹ بینک", "پولیس", "ایف آئی اے"
    )
    private val URGENCY = listOf(
        "block", "blocked", "freeze", "band", "jail", "arrest", "raid", "foran", "jaldi",
        "urgent", "immediately", "fauran", "minutes", "minute", "بلاک", "فوری", "گرفتار"
    )
    private val SECRECY = listOf(
        "kisi ko mat batana", "do not tell", "don't tell", "secret", "confidential",
        "stay on line", "call mat katna", "don't hang up", "line pe raho", "کسی کو نہ بتانا"
    )
    private val CREDENTIAL = listOf(
        "otp", "pin", "password", "code", "cvv", "sms code", "whatsapp code",
        "او ٹی پی", "کوڈ", "پاسورڈ"
    )
    private val PAYMENT = listOf(
        "transfer", "bhejo", "jazzcash", "easypaisa", "account", "paisa", "rupay", "wire",
        "anydesk", "teamviewer", "download", "link", "ٹرانسفر", "پیسے"
    )

    /** Whole-word match for Latin terms so "pin" does not fire inside "shopping". */
    private fun contains(text: String, keyword: String): Boolean {
        if (keyword.all { it.code < 128 }) {
            return Regex("(?<![a-z0-9])${Regex.escape(keyword)}(?![a-z0-9])").containsMatchIn(text)
        }
        return text.contains(keyword)
    }

    private fun firstHit(text: String, keywords: List<String>): String? =
        keywords.firstOrNull { contains(text, it) }

    /**
     * Scores everything the CALLER has said so far. The phone owner's own words are never
     * passed in, so talking about your own OTP can never trigger an alarm.
     */
    fun evaluate(callerSpeechSoFar: List<String>): Verdict {
        val text = callerSpeechSoFar.joinToString(" ").lowercase()
        val tactics = mutableListOf<String>()
        val evidence = mutableListOf<String>()
        var score = 15   // unknown caller baseline

        firstHit(text, AUTHORITY)?.let {
            tactics += "Authority Impersonation"; evidence += "Claimed official status: '$it'"; score += 25
        }
        firstHit(text, URGENCY)?.let {
            tactics += "Manufactured Urgency"; evidence += "Imposed deadline/threat: '$it'"; score += 25
        }
        firstHit(text, SECRECY)?.let {
            tactics += "Secrecy & Isolation"; evidence += "Demanded secrecy: '$it'"; score += 20
        }
        firstHit(text, CREDENTIAL)?.let {
            tactics += "Credential & OTP Extraction"; evidence += "Demanded secret code: '$it'"; score += 40
        }
        firstHit(text, PAYMENT)?.let {
            tactics += "Payment Redirection / Remote Tool"; evidence += "Directed money movement: '$it'"; score += 25
        }

        var risk = score.coerceIn(15, 99)

        // An OTP demand, or a full authority + urgency play, is a scam on its own
        if (tactics.contains("Credential & OTP Extraction") ||
            (tactics.contains("Authority Impersonation") &&
             tactics.contains("Manufactured Urgency") && tactics.size >= 3)
        ) {
            risk = 98
        }

        val tier = when {
            risk >= 85 -> 3
            risk >= 60 -> 2
            risk >= 30 -> 1
            else -> 0
        }

        return Verdict(risk, tier, risk >= 85, tactics, evidence)
    }

    fun hapticFor(tier: Int): LongArray = when {
        tier >= 3 -> longArrayOf(0, 500, 150, 500, 150, 800)
        tier == 2 -> longArrayOf(0, 250, 150, 250)
        else -> longArrayOf(0)
    }

    /** A realistic fake-bank-officer call, used by the offline demo. */
    val DEMO_SCRIPT: List<String> = listOf(
        "Assalam-o-Alaikum, I am calling from State Bank security department.",
        "Sir, there is suspicious activity on your account and it will be blocked in 10 minutes.",
        "To stop the block I need to verify you. Do not tell anyone about this call.",
        "You have received a 6 digit OTP code by SMS. Read it to me right now."
    )
}
