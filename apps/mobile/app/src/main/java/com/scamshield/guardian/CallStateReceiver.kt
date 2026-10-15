package com.scamshield.guardian

import android.content.BroadcastReceiver
import android.content.Context
import android.content.Intent
import android.telephony.TelephonyManager
import android.util.Log

/**
 * Starts listening when a call is actually answered (OFFHOOK) and stops the moment it ends (IDLE).
 *
 * The CallScreeningService only runs while the phone is still ringing, so it cannot capture the
 * conversation itself; this receiver covers the part of the call where people actually talk.
 */
class CallStateReceiver : BroadcastReceiver() {

    companion object {
        private const val TAG = "ScamShield.CallState"
        private var lastNumber: String = "Unknown"
        private var monitoring = false
    }

    override fun onReceive(context: Context, intent: Intent) {
        if (intent.action != TelephonyManager.ACTION_PHONE_STATE_CHANGED) return

        val prefs = context.getSharedPreferences("scamshield_prefs", Context.MODE_PRIVATE)
        if (!prefs.getBoolean("guardian_enabled", true)) return

        // EXTRA_INCOMING_NUMBER is empty without READ_CALL_LOG on Android 9+, so fall back to
        // the number the call-screening service recorded while the phone was ringing.
        intent.getStringExtra(TelephonyManager.EXTRA_INCOMING_NUMBER)?.let {
            if (it.isNotBlank()) lastNumber = it
        }
        if (lastNumber.isBlank() || lastNumber == "Unknown") {
            lastNumber = prefs.getString("last_incoming_number", "Unknown") ?: "Unknown"
        }

        when (intent.getStringExtra(TelephonyManager.EXTRA_STATE)) {
            TelephonyManager.EXTRA_STATE_OFFHOOK -> {
                if (!monitoring) {
                    monitoring = true
                    Log.i(TAG, "Call answered; starting guardian for $lastNumber")
                    // Must go through the launcher activity: a mic service started straight
                    // from this broadcast is denied the microphone on Android 14.
                    CallGuardActivity.start(context, lastNumber)
                }
            }
            TelephonyManager.EXTRA_STATE_IDLE -> {
                if (monitoring) {
                    monitoring = false
                    Log.i(TAG, "Call ended; stopping guardian")
                    context.startService(Intent(context, CallAudioListenerService::class.java)
                        .putExtra("action", CallAudioListenerService.ACTION_STOP))
                    context.stopService(Intent(context, StealthOverlayService::class.java))
                }
            }
        }
    }

}
