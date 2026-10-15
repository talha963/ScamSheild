package com.scamshield.guardian

import android.telecom.Call
import android.telecom.CallScreeningService
import android.util.Log

/**
 * Sees incoming calls as they arrive and records the caller's number for the guardian.
 *
 * The call is always allowed to ring normally - ScamShield never blocks or silences a call,
 * it only judges what is said once the user answers (see CallStateReceiver).
 */
class CallGuardianScreeningService : CallScreeningService() {

    companion object {
        private const val TAG = "ScamShield.Screening"
    }

    override fun onScreenCall(callDetails: Call.Details) {
        if (callDetails.callDirection == Call.Details.DIRECTION_INCOMING) {
            val number = callDetails.handle?.schemeSpecificPart ?: "Unknown"
            Log.i(TAG, "Incoming call from $number")

            getSharedPreferences("scamshield_prefs", MODE_PRIVATE)
                .edit()
                .putString("last_incoming_number", number)
                .apply()
        }

        // Let every call through untouched; monitoring begins only if the user answers.
        respondToCall(
            callDetails,
            CallResponse.Builder()
                .setDisallowCall(false)
                .setRejectCall(false)
                .setSilenceCall(false)
                .build()
        )
    }
}
