package com.scamshield.guardian

import android.app.Notification
import android.app.NotificationChannel
import android.app.NotificationManager
import android.app.Service
import android.content.Context
import android.content.Intent
import android.os.Build
import android.os.IBinder
import android.os.VibrationEffect
import android.os.Vibrator
import android.os.VibratorManager
import android.util.Log
import androidx.core.app.NotificationCompat
import kotlinx.coroutines.*
import org.json.JSONObject
import java.io.OutputStreamWriter
import java.net.HttpURLConnection
import java.net.URL

/**
 * ScamShield Silent Background Audio Listener Service
 * Listens to the opponent's speech in background, streams to ScamShield AI API,
 * and triggers secret physical haptic vibration and floating alerts when fraud is confirmed.
 */
class CallAudioListenerService : Service() {

    companion object {
        private const val TAG = "ScamShield.Listener"
        private const val CHANNEL_ID = "scamshield_guardian_channel"
        private const val NOTIFICATION_ID = 101
    }

    private val serviceScope = CoroutineScope(Dispatchers.IO + SupervisorJob())
    private var isMonitoring = false
    private var currentSessionId: String = ""

    override fun onCreate() {
        super.onCreate()
        createNotificationChannel()
    }

    override fun onStartCommand(intent: Intent?, flags: Int, startId: Int): Int {
        val incomingNumber = intent?.getStringExtra("incoming_number") ?: "+92 301 9845120"
        val action = intent?.getStringExtra("action")

        if (action == "START_STEALTH_MONITORING") {
            startForegroundNotification()
            startSilentMonitoring(incomingNumber)
        } else if (action == "STOP_MONITORING") {
            stopSelf()
        }

        return START_NOT_STICKY
    }

    private fun startForegroundNotification() {
        val notification: Notification = NotificationCompat.Builder(this, CHANNEL_ID)
            .setContentTitle("ScamShield Silent Guardian")
            .setContentText("Actively protecting call from unknown caller. Opponent unaware.")
            .setSmallIcon(android.R.drawable.ic_lock_idle_charging)
            .setPriority(NotificationCompat.PRIORITY_LOW)
            .setOngoing(true)
            .build()

        startForeground(NOTIFICATION_ID, notification)
    }

    private fun startSilentMonitoring(callerNumber: String) {
        if (isMonitoring) return
        isMonitoring = true

        serviceScope.launch {
            try {
                val prefs = getSharedPreferences("scamshield_prefs", Context.MODE_PRIVATE)
                val serverBaseUrl = prefs.getString("server_url", "http://192.168.100.109:8000") ?: "http://192.168.100.109:8000"

                // 1. Register Session with ScamShield Backend
                val startUrl = URL("$serverBaseUrl/v1/live/guardian/session/start")
                val startConn = startUrl.openConnection() as HttpURLConnection
                startConn.requestMethod = "POST"
                startConn.setRequestProperty("Content-Type", "application/json")
                startConn.doOutput = true

                val payload = JSONObject().apply {
                    put("caller_number", callerNumber)
                    put("is_unknown_number", true)
                    put("banking_app_open", true)
                }

                OutputStreamWriter(startConn.outputStream).use { it.write(payload.toString()) }
                if (startConn.responseCode == 200) {
                    val respStr = startConn.inputStream.bufferedReader().use { it.readText() }
                    val jsonResp = JSONObject(respStr)
                    currentSessionId = jsonResp.optString("session_id", "guard_session_mobile")
                    Log.i(TAG, "Guardian session initialized: $currentSessionId")
                }

                // In actual deployment, SpeechRecognizer or AudioRecord captures caller audio.
                // When words like 'OTP', 'bank block', 'police raid' are detected, send chunks:
                Log.i(TAG, "Silent speech listener streaming active on caller channel...")

            } catch (e: Exception) {
                Log.e(TAG, "Error initializing guardian session: ${e.message}")
            }
        }
    }

    /**
     * Triggered when AI detects that the opponent is a scammer.
     * Silent physical haptics are generated; ZERO audio is outputted into the call.
     */
    fun onFraudDetected(pattern: LongArray, alertTitle: String, alertUrdu: String) {
        // 1. Silent Physical Device Vibration
        triggerSilentVibration(pattern)

        // 2. Launch Floating Stealth Overlay Banner on Screen
        val overlayIntent = Intent(this, StealthOverlayService::class.java).apply {
            putExtra("session_id", currentSessionId)
            putExtra("alert_title", alertTitle)
            putExtra("alert_urdu", alertUrdu)
        }
        startService(overlayIntent)
    }

    private fun triggerSilentVibration(pattern: LongArray) {
        try {
            if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.S) {
                val vibratorManager = getSystemService(Context.VIBRATOR_MANAGER_SERVICE) as VibratorManager
                val vibrator = vibratorManager.defaultVibrator
                vibrator.vibrate(VibrationEffect.createWaveform(pattern, -1))
            } else {
                @Suppress("DEPRECATION")
                val vibrator = getSystemService(Context.VIBRATOR_SERVICE) as Vibrator
                if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
                    vibrator.vibrate(VibrationEffect.createWaveform(pattern, -1))
                } else {
                    vibrator.vibrate(pattern, -1)
                }
            }
            Log.i(TAG, "Silent physical haptic alert pulsed successfully.")
        } catch (e: Exception) {
            Log.e(TAG, "Vibration error: ${e.message}")
        }
    }

    private fun createNotificationChannel() {
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
            val channel = NotificationChannel(
                CHANNEL_ID,
                "ScamShield Silent Guardian",
                NotificationManager.IMPORTANCE_LOW
            ).apply {
                description = "Silent background call protection"
                setSound(null, null)
                enableVibration(false)
            }
            val manager = getSystemService(NotificationManager::class.java)
            manager?.createNotificationChannel(channel)
        }
    }

    override fun onDestroy() {
        super.onDestroy()
        isMonitoring = false
        serviceScope.cancel()
    }

    override fun onBind(intent: Intent?): IBinder? = null
}
