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

/**
 * Plays a scripted scam call through the real alert pipeline, entirely on this phone.
 *
 * No server, no internet and no microphone: scoring is done by LocalScamDetector, and the
 * vibration and CUT CALL banner are the same ones a genuine call produces. This is what to
 * show on stage, because nothing about it can be broken by the venue's Wi-Fi.
 */
class DemoCallService : Service() {

    companion object {
        private const val TAG = "ScamShield.Demo"
        private const val CHANNEL_ID = "scamshield_guardian_channel"
        private const val NOTIFICATION_ID = 202
        const val ACTION_START = "START_DEMO"
        const val ACTION_STOP = "STOP_DEMO"
        private const val SECONDS_BETWEEN_LINES = 4L
    }

    private val scope = CoroutineScope(Dispatchers.Main + SupervisorJob())
    private var job: Job? = null

    override fun onStartCommand(intent: Intent?, flags: Int, startId: Int): Int {
        if (intent?.getStringExtra("action") == ACTION_STOP) {
            stopEverything()
            return START_NOT_STICKY
        }

        createChannel()
        startForeground(NOTIFICATION_ID, notification("Demo call in progress"))
        runDemo()
        return START_NOT_STICKY
    }

    private fun runDemo() {
        job?.cancel()
        job = scope.launch {
            val heard = mutableListOf<String>()
            for (line in LocalScamDetector.DEMO_SCRIPT) {
                heard += line
                val v = LocalScamDetector.evaluate(heard)
                Log.i(TAG, "\"$line\" -> score=${v.riskScore} tier=${v.tier} alert=${v.alertTriggered}")

                updateNotification("Demo - risk ${v.riskScore}%")

                if (v.tier == 2) vibrate(LocalScamDetector.hapticFor(2))

                if (v.alertTriggered) {
                    vibrate(LocalScamDetector.hapticFor(3))
                    startService(Intent(this@DemoCallService, StealthOverlayService::class.java).apply {
                        putExtra("session_id", "demo")
                        putExtra("alert_title", "🚨 CUT THE CALL! THIS IS A SCAMMER")
                        putExtra("alert_urdu", "فوراً کال کاٹ دیں! دوسری طرف بات کرنے والا فراڈیا ہے")
                        putExtra("evidence", v.detectedTactics.joinToString(" • "))
                        putExtra("demo", true)
                    })
                    break
                }
                delay(SECONDS_BETWEEN_LINES * 1000)
            }
            delay(1500)
            stopForeground(STOP_FOREGROUND_REMOVE)
            stopSelf()
        }
    }

    private fun vibrate(pattern: LongArray) {
        if (pattern.all { it == 0L }) return
        try {
            val vibrator = if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.S) {
                (getSystemService(Context.VIBRATOR_MANAGER_SERVICE) as VibratorManager).defaultVibrator
            } else {
                @Suppress("DEPRECATION") getSystemService(Context.VIBRATOR_SERVICE) as Vibrator
            }
            if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
                vibrator.vibrate(VibrationEffect.createWaveform(pattern, -1))
            } else {
                @Suppress("DEPRECATION") vibrator.vibrate(pattern, -1)
            }
        } catch (e: Exception) {
            Log.e(TAG, "Vibration failed: ${e.message}")
        }
    }

    private fun notification(text: String): Notification =
        NotificationCompat.Builder(this, CHANNEL_ID)
            .setContentTitle("ScamShield demo call")
            .setContentText(text)
            .setSmallIcon(R.drawable.ic_stat_shield)
            .setPriority(NotificationCompat.PRIORITY_LOW)
            .setSilent(true)
            .setOngoing(true)
            .build()

    private fun updateNotification(text: String) {
        try {
            (getSystemService(Context.NOTIFICATION_SERVICE) as NotificationManager)
                .notify(NOTIFICATION_ID, notification(text))
        } catch (e: Exception) {
            Log.w(TAG, "Could not update notification: ${e.message}")
        }
    }

    private fun createChannel() {
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
            val ch = NotificationChannel(CHANNEL_ID, "ScamShield Call Guardian",
                NotificationManager.IMPORTANCE_LOW).apply {
                setSound(null, null); enableVibration(false)
            }
            getSystemService(NotificationManager::class.java)?.createNotificationChannel(ch)
        }
    }

    private fun stopEverything() {
        job?.cancel()
        stopService(Intent(this, StealthOverlayService::class.java))
        stopForeground(STOP_FOREGROUND_REMOVE)
        stopSelf()
    }

    override fun onDestroy() {
        super.onDestroy()
        job?.cancel()
        scope.cancel()
    }

    override fun onBind(intent: Intent?): IBinder? = null
}
