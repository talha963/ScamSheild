package com.scamshield.guardian

import android.annotation.SuppressLint
import android.app.Notification
import android.app.NotificationChannel
import android.app.NotificationManager
import android.app.PendingIntent
import android.app.Service
import android.content.Context
import android.content.Intent
import android.content.pm.PackageManager
import android.media.AudioDeviceInfo
import android.media.AudioFormat
import android.media.AudioManager
import android.media.AudioRecord
import android.media.MediaRecorder
import android.os.Build
import android.os.IBinder
import android.os.VibrationEffect
import android.os.Vibrator
import android.os.VibratorManager
import android.util.Log
import androidx.core.app.NotificationCompat
import androidx.core.content.ContextCompat
import kotlinx.coroutines.*
import java.io.ByteArrayOutputStream

/**
 * Listens to the live call and scores the caller's speech.
 *
 * IMPORTANT PLATFORM NOTE
 * Since Android 10, only pre-installed system apps may read the telephony audio stream
 * (VOICE_CALL / VOICE_DOWNLINK need the privileged CAPTURE_AUDIO_OUTPUT permission). A normal
 * installed app therefore captures the call through the MICROPHONE, which hears the remote
 * caller only while the call is on SPEAKERPHONE. The service turns the speaker on when it
 * starts so the caller's voice reaches the mic.
 *
 * What stays hidden is the WARNING, not the app: the alert is a vibration plus an on-screen
 * banner, and nothing is ever played into the call, so the caller hears no cue at any point.
 * Android requires a visible ongoing notification whenever an app uses the microphone, so the
 * phone's owner can always see and stop the monitoring.
 */
class CallAudioListenerService : Service() {

    companion object {
        private const val TAG = "ScamShield.Listener"
        private const val CHANNEL_ID = "scamshield_guardian_channel"
        private const val NOTIFICATION_ID = 101

        const val ACTION_START = "START_STEALTH_MONITORING"
        const val ACTION_STOP = "STOP_MONITORING"

        private const val SAMPLE_RATE = 16000
        private const val CHUNK_SECONDS = 6
        private const val BYTES_PER_CHUNK = SAMPLE_RATE * CHUNK_SECONDS * 2  // 16-bit mono
        private const val SILENCE_RMS = 0.001                                // lower threshold catches phone speakerphone clearly
        private const val MAX_CARRY_CHUNKS = 3                               // cap on audio kept after failures
    }

    private val serviceScope = CoroutineScope(Dispatchers.IO + SupervisorJob())
    private var recordJob: Job? = null
    private var audioRecord: AudioRecord? = null
    @Volatile private var isMonitoring = false
    private var sessionId: String = ""
    private var alertShown = false

    override fun onCreate() {
        super.onCreate()
        createNotificationChannel()
    }

    override fun onStartCommand(intent: Intent?, flags: Int, startId: Int): Int {
        when (intent?.getStringExtra("action")) {
            ACTION_STOP -> {
                stopMonitoring()
                stopSelf()
                return START_NOT_STICKY
            }
            ACTION_START -> {
                val number = intent.getStringExtra("incoming_number") ?: "Unknown"
                startForeground(NOTIFICATION_ID, buildNotification("Checking this call for scam tactics"))
                startMonitoring(number)
            }
        }
        return START_NOT_STICKY
    }

    private fun startMonitoring(callerNumber: String) {
        if (isMonitoring) return
        if (ContextCompat.checkSelfPermission(this, android.Manifest.permission.RECORD_AUDIO)
            != PackageManager.PERMISSION_GRANTED
        ) {
            Log.w(TAG, "RECORD_AUDIO not granted; cannot monitor this call.")
            stopSelf()
            return
        }
        isMonitoring = true
        alertShown = false

        recordJob = serviceScope.launch {
            val prefs = getSharedPreferences("scamshield_prefs", Context.MODE_PRIVATE)
            val bankingAppOpen = prefs.getBoolean("banking_app_open", false)

            val registered = GuardianApi.startSession(this@CallAudioListenerService, callerNumber, bankingAppOpen)
            if (registered == null) {
                // No server means no analysis. Say so rather than let the user believe
                // this call is being checked.
                Log.w(TAG, "Could not reach the ScamShield server; not monitoring this call.")
                reportUnreachable()
                stopSelf()
                return@launch
            }
            sessionId = registered
            Log.i(TAG, "Guardian session: $sessionId")

            routeAudioToSpeaker()
            recordLoop(bankingAppOpen)
        }
    }

    /** The mic can only hear the remote caller when the call is on the loudspeaker. */
    private fun routeAudioToSpeaker() {
        try {
            val am = getSystemService(Context.AUDIO_SERVICE) as AudioManager
            if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.S) {
                val devices = am.availableCommunicationDevices
                val speaker = devices.firstOrNull { it.type == AudioDeviceInfo.TYPE_BUILTIN_SPEAKER }
                if (speaker != null) {
                    val res = am.setCommunicationDevice(speaker)
                    Log.i(TAG, "setCommunicationDevice(SPEAKER) returned $res on Android 12+")
                }
            }
            @Suppress("DEPRECATION")
            am.isSpeakerphoneOn = true
        } catch (e: Exception) {
            Log.w(TAG, "Could not enable speakerphone: ${e.message}")
        }
    }

    @SuppressLint("MissingPermission")  // checked in startMonitoring before this runs
    private suspend fun recordLoop(bankingAppOpen: Boolean) {
        val minBuffer = AudioRecord.getMinBufferSize(
            SAMPLE_RATE, AudioFormat.CHANNEL_IN_MONO, AudioFormat.ENCODING_PCM_16BIT
        )
        if (minBuffer <= 0) {
            Log.e(TAG, "AudioRecord unavailable on this device.")
            return
        }

        // Try raw MIC first so phone hardware echo-cancellation does not mute the speakerphone caller audio
        val recorder = try {
            val rec = AudioRecord(
                MediaRecorder.AudioSource.MIC,
                SAMPLE_RATE,
                AudioFormat.CHANNEL_IN_MONO,
                AudioFormat.ENCODING_PCM_16BIT,
                maxOf(minBuffer * 2, BYTES_PER_CHUNK)
            )
            if (rec.state == AudioRecord.STATE_INITIALIZED) rec else throw IllegalStateException("MIC not initialized")
        } catch (e: Exception) {
            try {
                AudioRecord(
                    MediaRecorder.AudioSource.VOICE_RECOGNITION,
                    SAMPLE_RATE,
                    AudioFormat.CHANNEL_IN_MONO,
                    AudioFormat.ENCODING_PCM_16BIT,
                    maxOf(minBuffer * 2, BYTES_PER_CHUNK)
                )
            } catch (e2: Exception) {
                Log.e(TAG, "Could not open microphone: ${e2.message}")
                return
            }
        }

        if (recorder.state != AudioRecord.STATE_INITIALIZED) {
            Log.e(TAG, "Microphone busy; another app may hold it.")
            recorder.release()
            return
        }

        audioRecord = recorder
        recorder.startRecording()
        Log.i(TAG, "Listening to the call (speakerphone, ${CHUNK_SECONDS}s chunks).")

        val buffer = ByteArray(minBuffer)
        val chunk = ByteArrayOutputStream(BYTES_PER_CHUNK)
        var carried = ByteArray(0)   // audio from chunks the server could not score yet
        var offsetSeconds = 0
        var silentChunks = 0         // some phones mute the mic during calls - detect that
        var heardSomething = false

        try {
            while (isMonitoring && currentCoroutineContext().isActive) {
                val read = recorder.read(buffer, 0, buffer.size)
                if (read > 0) chunk.write(buffer, 0, read)
                if (chunk.size() < BYTES_PER_CHUNK) continue

                val pcm = chunk.toByteArray()
                chunk.reset()
                offsetSeconds += CHUNK_SECONDS

                val level = WavEncoder.rmsLevel(pcm)
                if (level < SILENCE_RMS) {
                    silentChunks++
                    // Alert only if 15 consecutive chunks (90s) are completely silent
                    if (!heardSomething && silentChunks == 15) reportDeaf()
                    if (carried.isEmpty() && silentChunks > 1) continue
                } else {
                    heardSomething = true
                    silentChunks = 0
                }

                val payload = carried + pcm
                val verdict = GuardianApi.uploadAudioChunk(
                    this@CallAudioListenerService,
                    sessionId,
                    WavEncoder.pcmToWav(payload),
                    bankingAppOpen,
                    offsetSeconds
                )

                if (verdict == null) {
                    // Server busy or offline: keep this audio and send it with the next chunk,
                    // but never let the backlog grow without bound.
                    carried = payload.takeLast(BYTES_PER_CHUNK * MAX_CARRY_CHUNKS).toByteArray()
                    continue
                }
                carried = ByteArray(0)
                onVerdict(verdict)
            }
        } catch (e: CancellationException) {
            // normal shutdown
        } catch (e: Exception) {
            Log.e(TAG, "Listening stopped: ${e.message}")
        } finally {
            runCatching { recorder.stop() }
            runCatching { recorder.release() }
            audioRecord = null
        }
    }

    private fun onVerdict(v: GuardianVerdict) {
        Log.i(TAG, "score=${v.riskScore} tier=${v.tier} alert=${v.alertTriggered} tactics=${v.detectedTactics}")
        updateNotification(
            if (v.alertTriggered) "Scam tactics detected - check your screen"
            else "Listening - risk ${v.riskScore}%"
        )

        if (v.tier >= 2 && !v.alertTriggered) {
            // Early, gentler nudge so the user is warned before the hard alert
            vibrate(v.hapticPattern)
        }

        if (v.alertTriggered && !alertShown) {
            alertShown = true
            vibrate(v.hapticPattern)
            val overlay = Intent(this, StealthOverlayService::class.java).apply {
                putExtra("session_id", sessionId)
                putExtra("alert_title", v.alertTitle)
                putExtra("alert_urdu", v.alertUrdu)
                putExtra("evidence", v.detectedTactics.joinToString(" • "))
            }
            startService(overlay)
        }
    }

    /** The server could not be reached, so this call is not being checked at all. */
    private fun reportUnreachable() {
        updateNotification("Not protected - cannot reach the ScamShield server")
        startService(Intent(this, StealthOverlayService::class.java).apply {
            putExtra("mode", "warning")
            putExtra("alert_title", "ScamShield is not protecting this call")
            putExtra("alert_urdu", "")
            putExtra("evidence", "Could not reach the ScamShield server. Open the app and tap Save and test.")
        })
    }

    /**
     * Tells the user that this handset is not giving the app any call audio, so they do not
     * rely on protection that is not actually running.
     */
    private fun reportDeaf() {
        Log.w(TAG, "No audio from the microphone during this call; the device may mute it.")
        updateNotification("Cannot hear this call on this phone - tap for help")
        val overlay = Intent(this, StealthOverlayService::class.java).apply {
            putExtra("session_id", sessionId)
            putExtra("mode", "warning")
            putExtra("alert_title", "ScamShield cannot hear this call")
            putExtra("alert_urdu", "")
            putExtra(
                "evidence",
                "This phone is not giving apps any call audio. Try turning the speakerphone on. " +
                    "Some manufacturers block this entirely."
            )
        }
        startService(overlay)
    }

    /** Vibration only - no sound is ever produced, so the caller notices nothing. */
    private fun vibrate(pattern: LongArray) {
        if (pattern.isEmpty() || pattern.all { it == 0L }) return
        try {
            val vibrator = if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.S) {
                (getSystemService(Context.VIBRATOR_MANAGER_SERVICE) as VibratorManager).defaultVibrator
            } else {
                @Suppress("DEPRECATION")
                getSystemService(Context.VIBRATOR_SERVICE) as Vibrator
            }
            if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
                vibrator.vibrate(VibrationEffect.createWaveform(pattern, -1))
            } else {
                @Suppress("DEPRECATION")
                vibrator.vibrate(pattern, -1)
            }
        } catch (e: Exception) {
            Log.e(TAG, "Vibration failed: ${e.message}")
        }
    }

    private fun buildNotification(text: String): Notification {
        val open = PendingIntent.getActivity(
            this, 0, Intent(this, MainActivity::class.java),
            PendingIntent.FLAG_IMMUTABLE or PendingIntent.FLAG_UPDATE_CURRENT
        )
        return NotificationCompat.Builder(this, CHANNEL_ID)
            .setContentTitle("ScamShield is checking this call")
            .setContentText(text)
            .setSmallIcon(R.drawable.ic_stat_shield)
            .setPriority(NotificationCompat.PRIORITY_LOW)
            .setSilent(true)
            .setOngoing(true)
            .setContentIntent(open)
            .build()
    }

    private fun updateNotification(text: String) {
        try {
            (getSystemService(Context.NOTIFICATION_SERVICE) as NotificationManager)
                .notify(NOTIFICATION_ID, buildNotification(text))
        } catch (e: Exception) {
            Log.w(TAG, "Could not update notification: ${e.message}")
        }
    }

    private fun createNotificationChannel() {
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
            val channel = NotificationChannel(
                CHANNEL_ID, "ScamShield Call Guardian", NotificationManager.IMPORTANCE_LOW
            ).apply {
                description = "Shows while ScamShield is checking a call"
                setSound(null, null)
                enableVibration(false)
            }
            getSystemService(NotificationManager::class.java)?.createNotificationChannel(channel)
        }
    }

    private fun stopMonitoring() {
        isMonitoring = false
        recordJob?.cancel()
        runCatching { audioRecord?.stop() }
        runCatching { audioRecord?.release() }
        audioRecord = null
        try {
            val am = getSystemService(Context.AUDIO_SERVICE) as AudioManager
            if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.S) {
                am.clearCommunicationDevice()
            }
            @Suppress("DEPRECATION")
            am.isSpeakerphoneOn = false
        } catch (e: Exception) {
            Log.w(TAG, "Could not reset speakerphone: ${e.message}")
        }
    }

    override fun onDestroy() {
        super.onDestroy()
        stopMonitoring()
        serviceScope.cancel()
    }

    override fun onBind(intent: Intent?): IBinder? = null
}
