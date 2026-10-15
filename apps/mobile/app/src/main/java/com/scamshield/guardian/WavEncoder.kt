package com.scamshield.guardian

import java.io.ByteArrayOutputStream

/** Wraps raw 16-bit PCM in a WAV container so the backend can hand it straight to Gemini. */
object WavEncoder {

    fun pcmToWav(pcm: ByteArray, sampleRate: Int = 16000, channels: Int = 1, bitsPerSample: Int = 16): ByteArray {
        val out = ByteArrayOutputStream(44 + pcm.size)
        val byteRate = sampleRate * channels * bitsPerSample / 8
        val blockAlign = channels * bitsPerSample / 8

        out.write("RIFF".toByteArray())
        out.writeIntLE(36 + pcm.size)
        out.write("WAVE".toByteArray())

        out.write("fmt ".toByteArray())
        out.writeIntLE(16)                 // PCM header size
        out.writeShortLE(1)                // format = PCM
        out.writeShortLE(channels)
        out.writeIntLE(sampleRate)
        out.writeIntLE(byteRate)
        out.writeShortLE(blockAlign)
        out.writeShortLE(bitsPerSample)

        out.write("data".toByteArray())
        out.writeIntLE(pcm.size)
        out.write(pcm)
        return out.toByteArray()
    }

    /**
     * Rough loudness of a PCM buffer (0..1). Used to skip uploading silence so the
     * phone does not burn battery and API quota on an empty room.
     */
    fun rmsLevel(pcm: ByteArray): Double {
        if (pcm.size < 2) return 0.0
        var sum = 0.0
        var samples = 0
        var i = 0
        while (i + 1 < pcm.size) {
            val value = ((pcm[i + 1].toInt() shl 8) or (pcm[i].toInt() and 0xFF)).toShort().toInt()
            sum += value.toDouble() * value.toDouble()
            samples++
            i += 2
        }
        if (samples == 0) return 0.0
        return Math.sqrt(sum / samples) / 32768.0
    }

    private fun ByteArrayOutputStream.writeIntLE(value: Int) {
        write(value and 0xFF); write((value shr 8) and 0xFF)
        write((value shr 16) and 0xFF); write((value shr 24) and 0xFF)
    }

    private fun ByteArrayOutputStream.writeShortLE(value: Int) {
        write(value and 0xFF); write((value shr 8) and 0xFF)
    }
}
