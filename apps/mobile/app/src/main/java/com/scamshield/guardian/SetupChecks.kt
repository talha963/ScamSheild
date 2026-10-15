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
                "No address set yet. Enter the server address given to you, for example https://scamshield.example.app")
        }
        if (!baseUrl.startsWith("http://") && !baseUrl.startsWith("https://")) {
            return SetupCheck("server", "ScamShield server", false,
                "The address must start with http:// or https://")
        }

        return try {
            val conn = (URL("$baseUrl/health").openConnection() as HttpURLConnection).apply {
                requestMethod = "GET"
                connectTimeout = 8000
                readTimeout = 8000
            }
            val code = conn.responseCode
            val body = try {
                conn.inputStream.bufferedReader().use { it.readText() }
            } catch (e: Exception) {
                ""
            }
            conn.disconnect()

            when {
                code == 200 -> SetupCheck("server", "ScamShield server", true,
                    "Connected. The server answered normally.")
                else -> SetupCheck("server", "ScamShield server", false,
                    "The server answered with error $code. ${body.take(120)}")
            }
        } catch (e: Exception) {
            val why = when {
                e.message?.contains("ENETUNREACH") == true ||
                e.message?.contains("Unable to resolve host") == true ->
                    "Could not reach that address. Check the phone's internet connection and that the address is spelt correctly."
                e.message?.contains("ECONNREFUSED") == true ->
                    "The address was found but nothing is listening on that port. Is the server running?"
                e.message?.contains("timed out") == true || e is java.net.SocketTimeoutException ->
                    "The server did not answer in time. If it is on your own Wi-Fi, make sure the phone is on that same Wi-Fi."
                e.message?.contains("CLEARTEXT") == true ->
                    "Android blocked an unencrypted http:// address. Use an https:// address."
                else -> "Could not connect: ${e.javaClass.simpleName} ${e.message.orEmpty()}"
            }
            SetupCheck("server", "ScamShield server", false, why)
        }
    }

    /** Checks whether the live transcription is actually usable (server has an AI key). */
    fun aiCheck(ctx: Context, baseUrl: String): SetupCheck {
        return try {
            val conn = (URL("$baseUrl/v1/live/guardian/audio-chunk").openConnection() as HttpURLConnection).apply {
                requestMethod = "POST"
                connectTimeout = 8000
                readTimeout = 15000
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
