package com.scamshield.guardian

import android.Manifest
import android.app.Activity
import android.app.AlertDialog
import android.app.role.RoleManager
import android.content.Context
import android.content.Intent
import android.graphics.Color
import android.net.Uri
import android.os.Build
import android.os.Bundle
import android.provider.Settings
import android.text.Editable
import android.text.TextWatcher
import android.view.View
import android.widget.Button
import android.widget.CheckBox
import android.widget.EditText
import android.widget.LinearLayout
import android.widget.ProgressBar
import android.widget.Switch
import android.widget.TextView
import androidx.core.app.ActivityCompat
import kotlinx.coroutines.CoroutineScope
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.launch
import kotlinx.coroutines.withContext

/**
 * Setup screen. Its job is to make the phone's readiness obvious: every requirement is listed
 * with a tick or a cross and a one-tap fix, and the server test always reports what happened.
 */
class MainActivity : Activity() {

    private lateinit var switchGuardian: Switch
    private lateinit var etServerUrl: EditText
    private lateinit var btnSaveSettings: Button
    private lateinit var btnRecheck: Button
    private lateinit var tvStatus: TextView
    private lateinit var tvReadiness: TextView
    private lateinit var cbBankingApp: CheckBox
    private lateinit var checklist: LinearLayout
    private lateinit var progress: ProgressBar

    private val prefs by lazy { getSharedPreferences("scamshield_prefs", Context.MODE_PRIVATE) }

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
        btnRecheck = findViewById(R.id.btnRecheck)
        tvStatus = findViewById(R.id.tvStatus)
        tvReadiness = findViewById(R.id.tvReadiness)
        cbBankingApp = findViewById(R.id.cbBankingApp)
        checklist = findViewById(R.id.checklist)
        progress = findViewById(R.id.progress)

        switchGuardian.isChecked = prefs.getBoolean("guardian_enabled", true)
        cbBankingApp.isChecked = prefs.getBoolean("banking_app_open", false)
        etServerUrl.setText(prefs.getString("server_url", GuardianApi.DEFAULT_SERVER))

        switchGuardian.setOnCheckedChangeListener { _, isChecked ->
            prefs.edit().putBoolean("guardian_enabled", isChecked).apply()
            refresh()
        }
        cbBankingApp.setOnCheckedChangeListener { _, isChecked ->
            prefs.edit().putBoolean("banking_app_open", isChecked).apply()
        }

        // A result for the old address must not linger once the address is edited
        etServerUrl.addTextChangedListener(object : TextWatcher {
            override fun afterTextChanged(s: Editable?) {
                if (tvStatus.text.isNotEmpty()) tvStatus.text = ""
            }
            override fun beforeTextChanged(s: CharSequence?, a: Int, b: Int, c: Int) {}
            override fun onTextChanged(s: CharSequence?, a: Int, b: Int, c: Int) {}
        })

        btnSaveSettings.setOnClickListener { saveAndTest() }
        btnRecheck.setOnClickListener { requestMissingPermissions(); refresh() }

        requestMissingPermissions()
        refresh()
    }

    override fun onResume() {
        super.onResume()
        refresh()   // permissions may have been granted in Settings while we were away
    }

    override fun onRequestPermissionsResult(code: Int, perms: Array<out String>, results: IntArray) {
        super.onRequestPermissionsResult(code, perms, results)
        refresh()
    }

    /** Saves the address, then reports the outcome in a dialog that cannot be missed. */
    private fun saveAndTest() {
        val url = etServerUrl.text.toString().trim().trimEnd('/')
        prefs.edit().putString("server_url", url).apply()

        progress.visibility = View.VISIBLE
        btnSaveSettings.isEnabled = false
        tvStatus.text = "Contacting $url ..."
        tvStatus.setTextColor(Color.parseColor("#475569"))

        CoroutineScope(Dispatchers.Main).launch {
            val server = withContext(Dispatchers.IO) { SetupChecks.serverCheck(this@MainActivity, url) }
            val ai = if (server.ok) {
                withContext(Dispatchers.IO) { SetupChecks.aiCheck(this@MainActivity, url) }
            } else null

            progress.visibility = View.GONE
            btnSaveSettings.isEnabled = true

            val title: String
            val message: String
            if (!server.ok) {
                title = "Cannot reach the server"
                message = "${server.detail}\n\nAddress tried:\n$url/health"
            } else if (ai != null && !ai.ok) {
                title = "Server reached, AI not ready"
                message = "${ai.detail}\n\nScamShield will connect, but it cannot analyse a live call until this is fixed."
            } else {
                title = "Connected"
                message = "The server answered and the call-analysis service is available.\n\nScamShield is ready to check your calls."
            }

            tvStatus.text = if (server.ok && (ai?.ok != false)) "Server connected." else title
            tvStatus.setTextColor(Color.parseColor(if (server.ok && (ai?.ok != false)) "#059669" else "#DC2626"))

            AlertDialog.Builder(this@MainActivity)
                .setTitle(title)
                .setMessage(message)
                .setPositiveButton("OK", null)
                .show()

            refresh()
        }
    }

    /** Rebuilds the readiness checklist from the device's current state. */
    private fun refresh() {
        val checks = SetupChecks.deviceChecks(this)
        checklist.removeAllViews()
        checks.forEach { checklist.addView(buildRow(it)) }

        val missingRequired = checks.filter { it.required && !it.ok }
        val enabled = switchGuardian.isChecked

        when {
            !enabled -> {
                tvReadiness.text = "ScamShield is switched off"
                tvReadiness.setTextColor(Color.parseColor("#DC2626"))
            }
            missingRequired.isEmpty() -> {
                tvReadiness.text = "Ready - ScamShield will check your next call"
                tvReadiness.setTextColor(Color.parseColor("#059669"))
            }
            else -> {
                tvReadiness.text = "Not ready - ${missingRequired.size} permission(s) still needed"
                tvReadiness.setTextColor(Color.parseColor("#D97706"))
            }
        }
    }

    /** One checklist line: tick/cross, title, and a Fix button that opens the right screen. */
    private fun buildRow(check: SetupCheck): View {
        val row = LinearLayout(this).apply {
            orientation = LinearLayout.HORIZONTAL
            setPadding(0, 12, 0, 12)
            gravity = android.view.Gravity.CENTER_VERTICAL
        }

        row.addView(TextView(this).apply {
            text = if (check.ok) "✓" else if (check.required) "✕" else "!"
            setTextColor(Color.parseColor(if (check.ok) "#059669" else if (check.required) "#DC2626" else "#D97706"))
            textSize = 18f
            setPadding(0, 0, 20, 0)
        })

        val textCol = LinearLayout(this).apply {
            orientation = LinearLayout.VERTICAL
            layoutParams = LinearLayout.LayoutParams(0, LinearLayout.LayoutParams.WRAP_CONTENT, 1f)
        }
        textCol.addView(TextView(this).apply {
            text = check.title + if (!check.required) " (optional)" else ""
            setTextColor(Color.parseColor("#0F172A"))
            textSize = 14f
        })
        textCol.addView(TextView(this).apply {
            text = check.detail
            setTextColor(Color.parseColor("#64748B"))
            textSize = 11f
        })
        row.addView(textCol)

        if (!check.ok) {
            row.addView(Button(this).apply {
                text = "Fix"
                textSize = 12f
                setOnClickListener { fix(check.id) }
            })
        }
        return row
    }

    /** Sends the user straight to the screen that grants the missing thing. */
    private fun fix(id: String) {
        when (id) {
            "mic" -> ask(Manifest.permission.RECORD_AUDIO)
            "phone" -> ask(Manifest.permission.READ_PHONE_STATE)
            "endcall" -> ask(Manifest.permission.ANSWER_PHONE_CALLS)
            "notif" -> if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.TIRAMISU) {
                ask(Manifest.permission.POST_NOTIFICATIONS)
            }
            "overlay" -> if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.M) {
                startActivityForResult(
                    Intent(Settings.ACTION_MANAGE_OVERLAY_PERMISSION, Uri.parse("package:$packageName")),
                    OVERLAY_REQ_CODE
                )
            }
            "role" -> requestCallScreeningRole()
        }
    }

    private fun ask(vararg permissions: String) {
        val needed = permissions.filterNot { SetupChecks.permissionGranted(this, it) }
        if (needed.isEmpty()) { refresh(); return }

        // If the user ticked "don't ask again", the system dialog never appears - send them to Settings.
        val canPrompt = needed.any { ActivityCompat.shouldShowRequestPermissionRationale(this, it) }
        val neverAsked = prefs.getBoolean("asked_${needed.first()}", false).not()
        if (canPrompt || neverAsked) {
            needed.forEach { prefs.edit().putBoolean("asked_$it", true).apply() }
            ActivityCompat.requestPermissions(this, needed.toTypedArray(), PERMISSION_REQ_CODE)
        } else {
            AlertDialog.Builder(this)
                .setTitle("Permission blocked")
                .setMessage("Android will not ask again for this permission. Open App info > Permissions and allow it there.")
                .setPositiveButton("Open settings") { _, _ ->
                    startActivity(Intent(Settings.ACTION_APPLICATION_DETAILS_SETTINGS,
                        Uri.parse("package:$packageName")))
                }
                .setNegativeButton("Cancel", null)
                .show()
        }
    }

    private fun requestCallScreeningRole() {
        if (Build.VERSION.SDK_INT < Build.VERSION_CODES.Q) return
        val rm = getSystemService(RoleManager::class.java) ?: return
        if (rm.isRoleAvailable(RoleManager.ROLE_CALL_SCREENING) && !rm.isRoleHeld(RoleManager.ROLE_CALL_SCREENING)) {
            startActivityForResult(rm.createRequestRoleIntent(RoleManager.ROLE_CALL_SCREENING), CALL_SCREEN_REQ_CODE)
        }
    }

    private fun requestMissingPermissions() {
        val wanted = mutableListOf(
            Manifest.permission.RECORD_AUDIO,
            Manifest.permission.READ_PHONE_STATE,
            Manifest.permission.ANSWER_PHONE_CALLS
        )
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.TIRAMISU) {
            wanted.add(Manifest.permission.POST_NOTIFICATIONS)
        }
        val needed = wanted.filterNot { SetupChecks.permissionGranted(this, it) }
        if (needed.isNotEmpty()) {
            needed.forEach { prefs.edit().putBoolean("asked_$it", true).apply() }
            ActivityCompat.requestPermissions(this, needed.toTypedArray(), PERMISSION_REQ_CODE)
        }
    }

    override fun onActivityResult(requestCode: Int, resultCode: Int, data: Intent?) {
        super.onActivityResult(requestCode, resultCode, data)
        refresh()
    }
}
