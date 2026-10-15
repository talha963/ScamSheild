package com.scamshield.guardian

import android.app.Activity
import android.content.Context
import android.content.Intent
import android.os.Build
import android.os.Bundle
import android.util.Log

/**
 * An invisible activity whose only job is to start the listening service from the foreground.
 *
 * Android 14 refuses microphone access to a foreground service that was started from the
 * background - a PHONE_STATE broadcast counts as background, and the service is killed with
 * a SecurityException. Launching this activity first puts the app in a foreground state, so
 * the service starts with the microphone grant it needs. It closes itself immediately and
 * never appears to the user; the dialler stays on screen throughout.
 *
 * Launching an activity from the background needs the "Display over other apps" permission,
 * which ScamShield already requires for its warning banner.
 */
class CallGuardActivity : Activity() {

    companion object {
        private const val TAG = "ScamShield.Launcher"

        fun start(context: Context, number: String) {
            val intent = Intent(context, CallGuardActivity::class.java).apply {
                addFlags(Intent.FLAG_ACTIVITY_NEW_TASK or Intent.FLAG_ACTIVITY_NO_ANIMATION)
                putExtra("incoming_number", number)
            }
            context.startActivity(intent)
        }
    }

    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        overridePendingTransition(0, 0)

        val number = intent?.getStringExtra("incoming_number") ?: "Unknown"
        val service = Intent(this, CallAudioListenerService::class.java).apply {
            putExtra("action", CallAudioListenerService.ACTION_START)
            putExtra("incoming_number", number)
        }

        try {
            if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
                startForegroundService(service)
            } else {
                startService(service)
            }
            Log.i(TAG, "Listening service started from the foreground for $number")
        } catch (e: Exception) {
            Log.e(TAG, "Could not start the listening service: ${e.message}")
        }

        finish()
        overridePendingTransition(0, 0)
    }
}
