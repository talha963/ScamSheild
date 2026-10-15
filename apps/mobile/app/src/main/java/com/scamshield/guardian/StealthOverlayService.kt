package com.scamshield.guardian

import android.app.Service
import android.content.Context
import android.content.Intent
import android.content.pm.PackageManager
import android.graphics.PixelFormat
import android.os.Build
import android.os.IBinder
import android.provider.Settings
import android.telecom.TelecomManager
import android.util.Log
import android.view.Gravity
import android.view.LayoutInflater
import android.view.View
import android.view.WindowManager
import android.widget.Button
import android.widget.TextView
import androidx.core.content.ContextCompat
import kotlinx.coroutines.CoroutineScope
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.launch

/**
 * Draws the warning over the call screen with a one-tap "Cut Call" button.
 *
 * The banner is visual only. Nothing is played into the call audio, so the person on the
 * other end gets no cue that the user has been warned.
 */
class StealthOverlayService : Service() {

    companion object {
        private const val TAG = "ScamShield.Overlay"
    }

    private var windowManager: WindowManager? = null
    private var overlayView: View? = null
    private var sessionId: String = ""

    override fun onStartCommand(intent: Intent?, flags: Int, startId: Int): Int {
        sessionId = intent?.getStringExtra("session_id") ?: ""
        val title = intent?.getStringExtra("alert_title") ?: "CUT THE CALL! THIS IS A SCAMMER"
        val urdu = intent?.getStringExtra("alert_urdu")
            ?: "فوراً کال کاٹ دیں! دوسری طرف بات کرنے والا فراڈیا ہے"
        val evidence = intent?.getStringExtra("evidence").orEmpty()
        // "warning" = an app problem to report (amber, no hang-up); default = a scam alert (red)
        val isWarning = intent?.getStringExtra("mode") == "warning"

        if (!canDrawOverlay()) {
            Log.w(TAG, "Overlay permission missing; cannot show the warning banner.")
            stopSelf()
            return START_NOT_STICKY
        }

        showBanner(title, urdu, evidence, isWarning)
        return START_NOT_STICKY
    }

    private fun canDrawOverlay(): Boolean =
        Build.VERSION.SDK_INT < Build.VERSION_CODES.M || Settings.canDrawOverlays(this)

    private fun showBanner(title: String, urdu: String, evidence: String, isWarning: Boolean) {
        if (overlayView != null) return
        windowManager = getSystemService(Context.WINDOW_SERVICE) as WindowManager

        val layoutFlag = if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
            WindowManager.LayoutParams.TYPE_APPLICATION_OVERLAY
        } else {
            @Suppress("DEPRECATION")
            WindowManager.LayoutParams.TYPE_PHONE
        }

        val params = WindowManager.LayoutParams(
            WindowManager.LayoutParams.MATCH_PARENT,
            WindowManager.LayoutParams.WRAP_CONTENT,
            layoutFlag,
            // Focusable so the buttons receive taps, but it never steals the call's audio
            WindowManager.LayoutParams.FLAG_LAYOUT_IN_SCREEN,
            PixelFormat.TRANSLUCENT
        ).apply {
            gravity = Gravity.TOP or Gravity.CENTER_HORIZONTAL
            y = 80
        }

        val inflater = getSystemService(Context.LAYOUT_INFLATER_SERVICE) as LayoutInflater
        val view = inflater.inflate(R.layout.stealth_alert_overlay, null)

        view.findViewById<TextView>(R.id.tvAlertTitle)?.text = title
        view.findViewById<TextView>(R.id.tvAlertUrdu)?.apply {
            if (urdu.isBlank()) visibility = View.GONE else text = urdu
        }
        view.findViewById<TextView>(R.id.tvEvidence)?.apply {
            if (evidence.isBlank()) visibility = View.GONE else text = evidence
        }

        if (isWarning) {
            // A problem report, not a scam alert: amber, and no "cut the call" advice.
            view.setBackgroundColor(0xFFB45309.toInt())
            view.findViewById<TextView>(R.id.tvStealthNote)?.visibility = View.GONE
            view.findViewById<Button>(R.id.btnCutCall)?.visibility = View.GONE
            view.findViewById<Button>(R.id.btnDismiss)?.text = "Got it"
        }

        view.findViewById<Button>(R.id.btnCutCall)?.setOnClickListener {
            Log.i(TAG, "User chose to cut the call.")
            hangUpCall()
            CoroutineScope(Dispatchers.IO).launch {
                GuardianApi.notifyCutCall(this@StealthOverlayService, sessionId)
            }
            removeOverlay()
            stopSelf()
        }

        view.findViewById<Button>(R.id.btnDismiss)?.setOnClickListener {
            removeOverlay()
            stopSelf()
        }

        overlayView = view
        try {
            windowManager?.addView(view, params)
        } catch (e: Exception) {
            Log.e(TAG, "Could not show the banner: ${e.message}")
            overlayView = null
            stopSelf()
        }
    }

    private fun hangUpCall() {
        if (Build.VERSION.SDK_INT < Build.VERSION_CODES.P) {
            Log.w(TAG, "Ending a call programmatically needs Android 9 or newer.")
            return
        }
        if (ContextCompat.checkSelfPermission(this, android.Manifest.permission.ANSWER_PHONE_CALLS)
            != PackageManager.PERMISSION_GRANTED
        ) {
            Log.w(TAG, "ANSWER_PHONE_CALLS not granted; the user must hang up manually.")
            return
        }
        try {
            @Suppress("DEPRECATION")
            (getSystemService(Context.TELECOM_SERVICE) as TelecomManager).endCall()
        } catch (e: Exception) {
            Log.e(TAG, "Could not end the call: ${e.message}")
        }
    }

    private fun removeOverlay() {
        val view = overlayView ?: return
        try {
            windowManager?.removeView(view)
        } catch (e: Exception) {
            Log.e(TAG, "Could not remove the banner: ${e.message}")
        }
        overlayView = null
    }

    override fun onDestroy() {
        super.onDestroy()
        removeOverlay()
    }

    override fun onBind(intent: Intent?): IBinder? = null
}
