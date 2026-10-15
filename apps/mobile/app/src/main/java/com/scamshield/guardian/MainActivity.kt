package com.scamshield.guardian

import android.Manifest
import android.app.Activity
import android.app.role.RoleManager
import android.content.Context
import android.content.Intent
import android.content.pm.PackageManager
import android.net.Uri
import android.os.Build
import android.os.Bundle
import android.provider.Settings
import android.widget.Button
import android.widget.EditText
import android.widget.Switch
import android.widget.TextView
import android.widget.Toast
import androidx.core.app.ActivityCompat
import androidx.core.content.ContextCompat

class MainActivity : Activity() {

    private lateinit var switchGuardian: Switch
    private lateinit var etServerUrl: EditText
    private lateinit var btnSaveSettings: Button
    private lateinit var tvStatus: TextView

    companion object {
        private const val PERMISSION_REQ_CODE = 2001
        private const val OVERLAY_REQ_CODE = 2002
        private const val CALL_SCREEN_REQ_CODE = 2003
    }

    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        setContentView(R.layout.activity_main)

        switchGuardian = findViewById(R.id.switchGuardian)
        etServerUrl = findViewById(R.id.etServerUrl)
        btnSaveSettings = findViewById(R.id.btnSaveSettings)
        tvStatus = findViewById(R.id.tvStatus)

        val prefs = getSharedPreferences("scamshield_prefs", Context.MODE_PRIVATE)
        val isEnabled = prefs.getBoolean("guardian_enabled", true)
        val serverUrl = prefs.getString("server_url", "http://192.168.100.109:8000")

        switchGuardian.isChecked = isEnabled
        etServerUrl.setText(serverUrl)
        updateStatusText(isEnabled)

        switchGuardian.setOnCheckedChangeListener { _, isChecked ->
            prefs.edit().putBoolean("guardian_enabled", isChecked).apply()
            updateStatusText(isChecked)
            if (isChecked) {
                checkAndRequestPermissions()
            }
        }

        btnSaveSettings.setOnClickListener {
            val url = etServerUrl.text.toString().trim()
            prefs.edit().putString("server_url", url).apply()
            Toast.makeText(this, "Settings Saved! ScamShield Guardian Active.", Toast.LENGTH_SHORT).show()
        }

        checkAndRequestPermissions()
    }

    private fun updateStatusText(enabled: Boolean) {
        if (enabled) {
            tvStatus.text = "🛡️ ScamShield Active • Silently monitoring incoming unknown calls."
            tvStatus.setTextColor(0xFF059669.toInt())
        } else {
            tvStatus.text = "⚠️ Guardian Paused • Unknown calls will not be monitored."
            tvStatus.setTextColor(0xFFDC2626.toInt())
        }
    }

    private fun checkAndRequestPermissions() {
        val permissions = mutableListOf(
            Manifest.permission.READ_PHONE_STATE,
            Manifest.permission.RECORD_AUDIO,
            Manifest.permission.VIBRATE
        )

        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.TIRAMISU) {
            permissions.add(Manifest.permission.POST_NOTIFICATIONS)
        }

        val needed = permissions.filter {
            ContextCompat.checkSelfPermission(this, it) != PackageManager.PERMISSION_GRANTED
        }

        if (needed.isNotEmpty()) {
            ActivityCompat.requestPermissions(this, needed.toTypedArray(), PERMISSION_REQ_CODE)
        }

        // Overlay permission for drawing secret alert banner over call
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.M && !Settings.canDrawOverlays(this)) {
            val intent = Intent(
                Settings.ACTION_MANAGE_OVERLAY_PERMISSION,
                Uri.parse("package:$packageName")
            )
            startActivityForResult(intent, OVERLAY_REQ_CODE)
        }

        // Call screening role
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.Q) {
            val roleManager = getSystemService(RoleManager::class.java)
            if (roleManager != null && roleManager.isRoleAvailable(RoleManager.ROLE_CALL_SCREENING)) {
                if (!roleManager.isRoleHeld(RoleManager.ROLE_CALL_SCREENING)) {
                    val intent = roleManager.createRequestRoleIntent(RoleManager.ROLE_CALL_SCREENING)
                    startActivityForResult(intent, CALL_SCREEN_REQ_CODE)
                }
            }
        }
    }
}
