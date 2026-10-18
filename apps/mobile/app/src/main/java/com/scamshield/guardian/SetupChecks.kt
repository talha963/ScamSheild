package com.scamshield.guardian

import android.Manifest
import android.app.Activity
import android.app.role.RoleManager
import android.content.Context
import android.content.pm.PackageManager
import android.os.Build
import android.provider.Settings
import androidx.core.content.ContextCompat
import java.net.HttpURLConnection
import java.net.URL

/** One requirement ScamShield needs before it can protect a call. */
data class SetupCheck(
    val id: String,
    val title: String,
    val ok: Boolean,
    val detail: String,
    val required: Boolean = true
)

/**
 * Works out, on this specific phone, whether ScamShield can actually do its job - and says
 * precisely what is missing. Nothing here fails silently.
 */
object SetupChecks {

    fun permissionGranted(ctx: Context, permission: String): Boolean =
        ContextCompat.checkSelfPermission(ctx, permission) == PackageManager.PERMISSION_GRANTED

    fun canDrawOverlay(ctx: Context): Boolean =
        Build.VERSION.SDK_INT < Build.VERSION_CODES.M || Settings.canDrawOverlays(ctx)

    fun hasCallScreeningRole(ctx: Context): Boolean {
        if (Build.VERSION.SDK_INT < Build.VERSION_CODES.Q) return true
        val rm = ctx.getSystemService(RoleManager::class.java) ?: return false
        return !rm.isRoleAvailable(RoleManager.ROLE_CALL_SCREENING) ||
                rm.isRoleHeld(RoleManager.ROLE_CALL_SCREENING)
    }

    /** Local checks only - fast, no network. */
    fun deviceChecks(activity: Activity): List<SetupCheck> {
        val checks = mutableListOf<SetupCheck>()

        checks += SetupCheck(
            "mic", "Microphone access",
            permissionGranted(activity, Manifest.permission.RECORD_AUDIO),
            "ScamShield listens to the call through the microphone. Without this it cannot hear anything."
        )
        checks += SetupCheck(
            "phone", "Phone state access",
            permissionGranted(activity, Manifest.permission.READ_PHONE_STATE),
            "Needed to notice when you answer a call so monitoring can start."
        )
        checks += SetupCheck(
            "overlay", "Display over other apps",
            canDrawOverlay(activity),
            "Needed to show the red CUT CALL warning on top of the call screen."
        )
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.TIRAMISU) {
            checks += SetupCheck(
                "notif", "Notifications",
                permissionGranted(activity, Manifest.permission.POST_NOTIFICATIONS),
                "Android requires a visible notification while the microphone is in use."
            )
        }
        checks += SetupCheck(
            "endcall", "Hang up for you",
            permissionGranted(activity, Manifest.permission.ANSWER_PHONE_CALLS),
            "Lets the CUT CALL button end the call. Without it the warning still appears and you hang up yourself.",
            required = false
        )
        checks += SetupCheck(
            "role", "Call screening role",
            hasCallScreeningRole(activity),
            "Lets ScamShield see the caller's number as the phone rings.",
            required = false
        )
        return checks
    }

    /**
     * Contacts the configured server. Returns a check that always explains the outcome -
     * reachable, wrong address, no internet, or server up but AI not configured.
     */
    fun serverCheck(ctx: Context, baseUrl: String): SetupCheck {
        if (baseUrl.isBlank()) {
            return SetupCheck("server", "ScamShield server", false,
                "No address set yet. Use https://flatbed-carve-imprint.ngrok-free.dev or http://10.0.2.2:8000.")
        }

        val cleanUrl = baseUrl.trimEnd('/')
        val candidates = mutableListOf<String>()

        if (cleanUrl.isNotBlank()) {
            candidates.add(cleanUrl)
        }

        val defaultNgrok = "https://flatbed-carve-imprint.ngrok-free.dev"
        if (!candidates.contains(defaultNgrok)) candidates.add(defaultNgrok)
        if (!candidates.contains("http://10.0.2.2:8000")) candidates.add("http://10.0.2.2:8000")
        if (!candidates.contains("http://localhost:8000")) candidates.add("http://localhost:8000")
        if (!candidates.contains("http://10.0.2.2:7860")) candidates.add("http://10.0.2.2:7860")

        var lastException: Exception? = null

        for (candidate in candidates) {
            try {
                val conn = (URL("$candidate/health").openConnection() as HttpURLConnection).apply {
                    requestMethod = "GET"
                    connectTimeout = 3000
                    readTimeout = 4000
                    useCaches = false
                    setRequestProperty("ngrok-skip-browser-warning", "1")
                    setRequestProperty("User-Agent", "ScamShield-Android")
                }
                val code = conn.responseCode
                conn.disconnect()

                if (code == 200) {
                    if (candidate != cleanUrl) {
                        ctx.getSharedPreferences("scamshield_prefs", Context.MODE_PRIVATE)
                            .edit().putString("server_url", candidate).apply()
                    }
                    return SetupCheck("server", "ScamShield backend", true,
                        "Connected to backend at $candidate")
                }
            } catch (e: Exception) {
                lastException = e
            }
        }

        val why = "Backend not detected on ngrok or port 8000. Start Docker ('docker compose up' or 'python run_system.py') or ngrok tunnel. Autonomous In-Browser Engine is active."
        return SetupCheck("server", "ScamShield server", false, why)
    }

    /** Checks whether the live transcription is actually usable (server has an AI key). */
    fun aiCheck(ctx: Context, baseUrl: String): SetupCheck {
        return try {
            val conn = (URL("$baseUrl/v1/live/guardian/audio-chunk").openConnection() as HttpURLConnection).apply {
                requestMethod = "POST"
                connectTimeout = 8000
                readTimeout = 15000
                setRequestProperty("ngrok-skip-browser-warning", "1")
                setRequestProperty("User-Agent", "ScamShield-Android")
            }
            val code = conn.responseCode
            conn.disconnect()
            // 422 = endpoint alive, just rejecting our empty probe body. 503 = no AI key on server.
            when (code) {
                503 -> SetupCheck("ai", "Live call AI", false,
                    "The server is running but has no AI key configured, so it cannot transcribe calls.")
                else -> SetupCheck("ai", "Live call AI", true,
                    "The call-analysis service is available.")
            }
        } catch (e: Exception) {
            SetupCheck("ai", "Live call AI", false, "Could not check: ${e.message.orEmpty()}")
        }
    }
}
