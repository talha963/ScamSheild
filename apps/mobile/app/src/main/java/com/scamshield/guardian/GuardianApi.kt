package com.scamshield.guardian

import android.content.Context
import org.json.JSONArray
import org.json.JSONObject
import java.io.DataOutputStream
import java.io.OutputStreamWriter
import java.net.HttpURLConnection
import java.net.URL

/** Result of scoring one chunk of call audio on the ScamShield backend. */
data class GuardianVerdict(
    val riskScore: Int,
    val tier: Int,
    val alertTriggered: Boolean,
    val hapticPattern: LongArray,
    val alertTitle: String,
    val alertUrdu: String,
    val callerTranscript: List<String>,
    val detectedTactics: List<String>
)

/**
 * Thin HTTP client for the /v1/live/guardian endpoints. Uses HttpURLConnection so the app
 * needs no third-party networking dependency.
 */
object GuardianApi {

    private const val PREFS = "scamshield_prefs"

    /** Baked in at build time with -Pscamshield.serverUrl=... ; empty means ask the user. */
    val DEFAULT_SERVER: String = BuildConfig.DEFAULT_SERVER_URL.ifEmpty { "http://10.0.2.2:8000" }

    fun serverUrl(context: Context): String {
        val saved = context.getSharedPreferences(PREFS, Context.MODE_PRIVATE)
            .getString("server_url", null)
            ?.trimEnd('/')
        if (saved.isNullOrEmpty() || saved.contains("flatbed-carve-imprint.ngrok-free.dev") || saved.contains("ngrok")) {
            return DEFAULT_SERVER
        }
        return saved
    }

    /**
     * Registers a new monitoring session. Returns the session id, or null if the server is
     * unreachable. Retries briefly: a call is in progress, so one dropped packet must not
     * cost the user their protection.
     */
    fun startSession(context: Context, callerNumber: String, bankingAppOpen: Boolean): String? {
        repeat(3) { attempt ->
            startSessionOnce(context, callerNumber, bankingAppOpen)?.let { return it }
            if (attempt < 2) Thread.sleep(1000)
        }
        return null
    }

    private fun startSessionOnce(context: Context, callerNumber: String, bankingAppOpen: Boolean): String? {
        val conn = (URL("${serverUrl(context)}/v1/live/guardian/session/start").openConnection() as HttpURLConnection).apply {
            requestMethod = "POST"
            setRequestProperty("Content-Type", "application/json")
            setRequestProperty("ngrok-skip-browser-warning", "1")
            setRequestProperty("User-Agent", "ScamShield-Android")
            connectTimeout = 8000
            readTimeout = 15000
            doOutput = true
        }
        return try {
            val payload = JSONObject().apply {
                put("caller_number", callerNumber)
                put("is_unknown_number", true)
                put("banking_app_open", bankingAppOpen)
            }
            OutputStreamWriter(conn.outputStream).use { it.write(payload.toString()) }
            if (conn.responseCode == 200) {
                val body = conn.inputStream.bufferedReader().use { it.readText() }
                JSONObject(body).optString("session_id").ifEmpty { null }
            } else null
        } catch (e: Exception) {
            null
        } finally {
            conn.disconnect()
        }
    }

    /**
     * Uploads one WAV chunk of call audio for transcription and scam scoring.
     * Returns null when the chunk could not be scored (server busy, offline, no API key);
     * the caller should keep the audio and retry it with the next chunk.
     */
    fun uploadAudioChunk(
        context: Context,
        sessionId: String,
        wav: ByteArray,
        bankingAppOpen: Boolean,
        offsetSeconds: Int
    ): GuardianVerdict? {
        val boundary = "----ScamShield${System.currentTimeMillis()}"
        val conn = (URL("${serverUrl(context)}/v1/live/guardian/audio-chunk").openConnection() as HttpURLConnection).apply {
            requestMethod = "POST"
            setRequestProperty("Content-Type", "multipart/form-data; boundary=$boundary")
            setRequestProperty("ngrok-skip-browser-warning", "1")
            setRequestProperty("User-Agent", "ScamShield-Android")
            connectTimeout = 8000
            readTimeout = 60000   // transcription of a chunk can take a few seconds
            doOutput = true
        }

        return try {
            DataOutputStream(conn.outputStream).use { out ->
                fun field(name: String, value: String) {
                    out.writeBytes("--$boundary\r\n")
                    out.writeBytes("Content-Disposition: form-data; name=\"$name\"\r\n\r\n")
                    out.writeBytes("$value\r\n")
                }
                field("session_id", sessionId)
                field("banking_app_open", bankingAppOpen.toString())
                field("t_offset_s", offsetSeconds.toString())

                out.writeBytes("--$boundary\r\n")
                out.writeBytes("Content-Disposition: form-data; name=\"audio\"; filename=\"chunk.wav\"\r\n")
                out.writeBytes("Content-Type: audio/wav\r\n\r\n")
                out.write(wav)
                out.writeBytes("\r\n--$boundary--\r\n")
            }

            if (conn.responseCode != 200) return null
            parseVerdict(conn.inputStream.bufferedReader().use { it.readText() })
        } catch (e: Exception) {
            null
        } finally {
            conn.disconnect()
        }
    }

    fun notifyCutCall(context: Context, sessionId: String): Boolean = try {
        val conn = (URL("${serverUrl(context)}/v1/live/guardian/cut-call").openConnection() as HttpURLConnection).apply {
            requestMethod = "POST"
            setRequestProperty("Content-Type", "application/json")
            setRequestProperty("ngrok-skip-browser-warning", "1")
            setRequestProperty("User-Agent", "ScamShield-Android")
            connectTimeout = 8000
            doOutput = true
        }
        val payload = JSONObject().apply {
            put("session_id", sessionId)
            put("reason", "User cut call via ScamShield stealth alert")
        }
        OutputStreamWriter(conn.outputStream).use { it.write(payload.toString()) }
        val ok = conn.responseCode == 200
        conn.disconnect()
        ok
    } catch (e: Exception) {
        false
    }

    private fun parseVerdict(body: String): GuardianVerdict {
        val json = JSONObject(body)
        return GuardianVerdict(
            riskScore = json.optInt("risk_score", 0),
            tier = json.optInt("tier", 0),
            alertTriggered = json.optBoolean("alert_triggered", false),
            hapticPattern = json.optJSONArray("secret_haptic_pattern").toLongArray(),
            alertTitle = json.optString("alert_title", "CUT THE CALL! THIS IS A SCAMMER"),
            alertUrdu = json.optString("alert_message_ur", ""),
            callerTranscript = json.optJSONArray("caller_transcript").toStringList(),
            detectedTactics = json.optJSONArray("detected_tactics").toStringList()
        )
    }

    private fun JSONArray?.toLongArray(): LongArray {
        if (this == null) return longArrayOf(0)
        return LongArray(length()) { optLong(it) }
    }

    private fun JSONArray?.toStringList(): List<String> {
        if (this == null) return emptyList()
        return (0 until length()).map { optString(it) }.filter { it.isNotBlank() }
    }
}
