package com.scamshield.guardian

import android.content.Intent
import android.os.Build
import android.telecom.Call
import android.telecom.CallScreeningService
import android.util.Log

/**
 * ScamShield Background Call Screening Service
 * Automatically intercepts incoming calls from unverified / unknown phone numbers.
 * Activates silent background acoustic & linguistic guardian without alerting the caller.
 */
class CallGuardianScreeningService : CallScreeningService() {

    companion object {
        private const val TAG = "ScamShield.Screening"
    }

    override fun onScreenCall(callDetails: Call.Details) {
        if (callDetails.callDirection == Call.Details.DIRECTION_INCOMING) {
            val handle = callDetails.handle
            val incomingNumber = handle?.schemeSpecificPart ?: "Unknown"

            Log.i(TAG, "Incoming call detected from: $incomingNumber")

            // Check if user has enabled ScamShield Silent Guardian in settings
            val prefs = getSharedPreferences("scamshield_prefs", MODE_PRIVATE)
            val isGuardianEnabled = prefs.getBoolean("guardian_enabled", true)

            if (isGuardianEnabled) {
                // Launch Silent Audio Listener Service in background
                val listenerIntent = Intent(this, CallAudioListenerService::class.java).apply {
                    putExtra("incoming_number", incomingNumber)
                    putExtra("action", "START_STEALTH_MONITORING")
                }

                if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
                    startForegroundService(listenerIntent)
                } else {
                    startService(listenerIntent)
                }
            }

            // Allow call to ring naturally on phone (do not block immediately, monitor first)
            val response = CallResponse.Builder()
                .setDisallowCall(false)
                .setRejectCall(false)
                .setSilenceCall(false)
                .build()

            respondToCall(callDetails, response)
        }
    }
}
