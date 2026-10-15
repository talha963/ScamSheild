package com.scamshield.guardian

import android.app.Service
import android.content.Context
import android.content.Intent
import android.graphics.PixelFormat
import android.os.Build
import android.os.IBinder
import android.telecom.TelecomManager
import android.util.Log
import android.view.Gravity
import android.view.LayoutInflater
import android.view.View
import android.view.WindowManager
import android.widget.Button
import android.widget.TextView
import kotlinx.coroutines.CoroutineScope
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.launch
import org.json.JSONObject
import java.io.OutputStreamWriter
import java.net.HttpURLConnection
import java.net.URL

/**
 * Stealth Floating Overlay Service
 * Renders a discreet heads-up warning banner over the native call screen
 * allowing the user to hang up / cut the call immediately with one tap.
 */
class StealthOverlayService : Service() {

    companion object {
        private const val TAG = "ScamShield.Overlay"
    }

    private var windowManager: WindowManager? = null
    private var overlayView: View? = null

    override fun onStartCommand(intent: Intent?, flags: Int, startId: Int): Int {
        val sessionId = intent?.getStringExtra("session_id") ?: ""
        val alertTitle = intent?.getStringExtra("alert_title") ?: "🚨 CUT THE CALL! THIS IS A SCAMMER"
        val alertUrdu = intent?.getStringExtra("alert_urdu") ?: "فوراً کال کاٹ دیں! دوسری طرف بات کرنے والا فراڈیا ہے"

        showStealthBanner(sessionId, alertTitle, alertUrdu)
        return START_NOT_STICKY
    }

    private fun showStealthBanner(sessionId: String, title: String, urdu: String) {
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
            WindowManager.LayoutParams.FLAG_NOT_FOCUSABLE or WindowManager.LayoutParams.FLAG_LAYOUT_IN_SCREEN,
            PixelFormat.TRANSLUCENT
        ).apply {
            gravity = Gravity.TOP or Gravity.CENTER_HORIZONTAL
            y = 80
        }

        val inflater = getSystemService(Context.LAYOUT_INFLATER_SERVICE) as LayoutInflater
        overlayView = inflater.inflate(R.layout.stealth_alert_overlay, null)

        overlayView?.findViewById<TextView>(R.id.tvAlertTitle)?.text = title
        overlayView?.findViewById<TextView>(R.id.tvAlertUrdu)?.text = urdu

        // Cut Call Button
        overlayView?.findViewById<Button>(R.id.btnCutCall)?.setOnClickListener {
            Log.i(TAG, "User tapped CUT CALL. Hanging up phone call immediately...")
            hangUpCall()
            notifyBackendCutCall(sessionId)
            removeOverlay()
            stopSelf()
        }

        try {
            windowManager?.addView(overlayView, params)
            Log.i(TAG, "Stealth alert overlay rendered on screen.")
        } catch (e: Exception) {
            Log.e(TAG, "Failed to render overlay: ${e.message}")
        }
    }

    private fun hangUpCall() {
        try {
            if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.P) {
                val telecomManager = getSystemService(Context.TELECOM_SERVICE) as TelecomManager
                telecomManager.endCall()
            }
        } catch (e: Exception) {
            Log.e(TAG, "Could not end call via TelecomManager: ${e.message}")
        }
    }

    private fun notifyBackendCutCall(sessionId: String) {
        CoroutineScope(Dispatchers.IO).launch {
            try {
                val prefs = getSharedPreferences("scamshield_prefs", Context.MODE_PRIVATE)
                val serverBaseUrl = prefs.getString("server_url", "http://192.168.100.109:8000") ?: "http://192.168.100.109:8000"

                val cutUrl = URL("$serverBaseUrl/v1/live/guardian/cut-call")
                val conn = cutUrl.openConnection() as HttpURLConnection
                conn.requestMethod = "POST"
                conn.setRequestProperty("Content-Type", "application/json")
                conn.doOutput = true

                val payload = JSONObject().apply {
                    put("session_id", sessionId)
                    put("reason", "User cut call via ScamShield stealth overlay button")
                }

                OutputStreamWriter(conn.outputStream).use { it.write(payload.toString()) }
                val code = conn.responseCode
                Log.i(TAG, "Backend cut-call notified. Response code: $code")
            } catch (e: Exception) {
                Log.e(TAG, "Error notifying backend of cut call: ${e.message}")
            }
        }
    }

    private fun removeOverlay() {
        if (overlayView != null && windowManager != null) {
            try {
                windowManager?.removeView(overlayView)
                overlayView = null
            } catch (e: Exception) {
                Log.e(TAG, "Error removing overlay: ${e.message}")
            }
        }
    }

    override fun onDestroy() {
        super.onDestroy()
        removeOverlay()
    }

    override fun onBind(intent: Intent?): IBinder? = null
}
