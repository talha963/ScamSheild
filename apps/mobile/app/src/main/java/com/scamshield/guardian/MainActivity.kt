package com.scamshield.guardian

import android.Manifest
import android.annotation.SuppressLint
import android.app.Activity
import android.app.AlertDialog
import android.app.role.RoleManager
import android.content.Context
import android.content.Intent
import android.graphics.Color
import android.net.Uri
import android.os.Build
import android.os.Bundle
import android.os.VibrationEffect
import android.os.Vibrator
import android.provider.Settings
import android.text.Editable
import android.text.TextWatcher
import android.view.LayoutInflater
import android.view.View
import android.webkit.JavascriptInterface
import android.webkit.PermissionRequest
import android.webkit.ValueCallback
import android.webkit.WebChromeClient
import android.webkit.WebSettings
import android.webkit.WebResourceRequest
import android.webkit.WebResourceResponse
import android.webkit.WebView
import android.webkit.WebViewClient
import androidx.webkit.WebViewAssetLoader
import android.widget.Button
import android.widget.CheckBox
import android.widget.EditText
import android.widget.LinearLayout
import android.widget.ProgressBar
import android.widget.Switch
import android.widget.TextView
import android.widget.Toast
import androidx.core.app.ActivityCompat
import kotlinx.coroutines.CoroutineScope
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.launch
import kotlinx.coroutines.withContext

/**
 * Main Activity: Hosts the full ScamShield Web App interface identically to the web version
 * (navbar, dark mode, Uncle Tariq scam demo, live call guardian, hero features) while running
 * the native background call interceptor services for real incoming phone calls.
 */
class MainActivity : Activity() {

    private lateinit var webView: WebView
    private lateinit var btnFloatingShield: LinearLayout
    private lateinit var pillDot: View
    private lateinit var tvPillText: TextView
    private var fileUploadCallback: ValueCallback<Array<Uri>>? = null

    private val prefs by lazy { getSharedPreferences("scamshield_prefs", Context.MODE_PRIVATE) }

    companion object {
        private const val PERMISSION_REQ_CODE = 2001
        private const val OVERLAY_REQ_CODE = 2002
        private const val CALL_SCREEN_REQ_CODE = 2003
        private const val FILE_CHOOSER_REQ_CODE = 3001
    }

    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        setContentView(R.layout.activity_main)

        webView = findViewById(R.id.webView)
        btnFloatingShield = findViewById(R.id.btnFloatingShield)
        pillDot = findViewById(R.id.pillDot)
        tvPillText = findViewById(R.id.tvPillText)

        setupWebView()
        setupFloatingPill()

        // Prompt for essential permissions on first start so background interception is active
        requestMissingPermissions()
        updatePillStatus()
    }

    @SuppressLint("SetJavaScriptEnabled")
    private fun setupWebView() {
        val settings = webView.settings
        settings.javaScriptEnabled = true
        settings.domStorageEnabled = true
        settings.allowFileAccess = true
        settings.allowContentAccess = true
        settings.databaseEnabled = true
        settings.mediaPlaybackRequiresUserGesture = false
        settings.cacheMode = WebSettings.LOAD_DEFAULT
        settings.userAgentString = (settings.userAgentString ?: "") + " ScamShield-Android/1.0"

        // The bundled React app is loaded as an ES module, and a module fetched over file://
        // is blocked by CORS ("origin null"), which leaves the page blank. WebViewAssetLoader
        // serves the same files over https://appassets.androidplatform.net/ so they load.
        val assetLoader = WebViewAssetLoader.Builder()
            .addPathHandler("/assets/", WebViewAssetLoader.AssetsPathHandler(this))
            .build()

        webView.webViewClient = object : WebViewClient() {
            override fun shouldInterceptRequest(
                view: WebView,
                request: WebResourceRequest
            ): WebResourceResponse? {
                val intercepted = assetLoader.shouldInterceptRequest(request.url)
                if (intercepted != null) return intercepted

                // Fallback for root-relative assets (e.g. /family-safety-portrait.jpg)
                val rawPath = request.url.path.orEmpty().trimStart('/')
                return try {
                    val stream = assets.open("web/$rawPath")
                    val mimeType = when {
                        rawPath.endsWith(".jpg") || rawPath.endsWith(".jpeg") -> "image/jpeg"
                        rawPath.endsWith(".png") -> "image/png"
                        rawPath.endsWith(".svg") -> "image/svg+xml"
                        rawPath.endsWith(".css") -> "text/css"
                        rawPath.endsWith(".js") -> "application/javascript"
                        else -> "application/octet-stream"
                    }
                    WebResourceResponse(mimeType, "UTF-8", stream)
                } catch (e: Exception) {
                    null
                }
            }

            override fun shouldOverrideUrlLoading(view: WebView?, url: String?): Boolean {
                // Keep in-app navigation inside the WebView
                return false
            }
        }

        webView.webChromeClient = object : WebChromeClient() {
            override fun onPermissionRequest(request: PermissionRequest?) {
                // Grant microphone or media permissions requested by the web view (for in-app demo)
                request?.grant(request.resources)
            }

            override fun onShowFileChooser(
                webView: WebView?,
                filePathCallback: ValueCallback<Array<Uri>>?,
                fileChooserParams: FileChooserParams?
            ): Boolean {
                fileUploadCallback?.onReceiveValue(null)
                fileUploadCallback = filePathCallback

                val intent = fileChooserParams?.createIntent() ?: Intent(Intent.ACTION_GET_CONTENT).apply {
                    type = "image/*"
                    addCategory(Intent.CATEGORY_OPENABLE)
                }

                return try {
                    startActivityForResult(intent, FILE_CHOOSER_REQ_CODE)
                    true
                } catch (e: Exception) {
                    fileUploadCallback?.onReceiveValue(null)
                    fileUploadCallback = null
                    false
                }
            }
        }

        // Bridge native Android capabilities to the web frontend
        webView.addJavascriptInterface(AndroidWebInterface(), "ScamShieldAndroid")

        // Load the bundled React web application through the asset loader (https origin)
        webView.loadUrl("https://appassets.androidplatform.net/assets/web/index.html")
    }

    private fun setupFloatingPill() {
        btnFloatingShield.setOnClickListener {
            showSettingsDialog()
        }
    }

    /** Updates the floating status pill in the bottom right corner */
    private fun updatePillStatus() {
        val enabled = prefs.getBoolean("guardian_enabled", true)
        val checks = SetupChecks.deviceChecks(this)
        val missingRequired = checks.filter { it.required && !it.ok }

        when {
            !enabled -> {
                pillDot.setBackgroundResource(R.drawable.dot_red)
                tvPillText.text = "Shield Off"
            }
            missingRequired.isNotEmpty() -> {
                pillDot.setBackgroundResource(R.drawable.dot_amber)
                tvPillText.text = "Setup (${missingRequired.size})"
            }
            else -> {
                pillDot.setBackgroundResource(R.drawable.dot_green)
                tvPillText.text = "Shield Active"
            }
        }
    }

    override fun onResume() {
        super.onResume()
        updatePillStatus()
    }

    override fun onBackPressed() {
        if (webView.canGoBack()) {
            webView.goBack()
        } else {
            super.onBackPressed()
        }
    }

    /** Opens the modal dialog containing real-time permission status and server configuration */
    private fun showSettingsDialog() {
        val dialogView = LayoutInflater.from(this).inflate(R.layout.dialog_shield_settings, null)
        val dialog = AlertDialog.Builder(this)
            .setView(dialogView)
            .create()

        val switchGuardian = dialogView.findViewById<Switch>(R.id.switchGuardian)
        val cbBankingApp = dialogView.findViewById<CheckBox>(R.id.cbBankingApp)
        val checklist = dialogView.findViewById<LinearLayout>(R.id.checklist)
        val btnRecheck = dialogView.findViewById<Button>(R.id.btnRecheck)
        val etServerUrl = dialogView.findViewById<EditText>(R.id.etServerUrl)
        val btnSaveSettings = dialogView.findViewById<Button>(R.id.btnSaveSettings)
        val progress = dialogView.findViewById<ProgressBar>(R.id.progress)
        val tvStatus = dialogView.findViewById<TextView>(R.id.tvStatus)
        val tvReadiness = dialogView.findViewById<TextView>(R.id.tvReadiness)
        val btnClose = dialogView.findViewById<Button>(R.id.btnCloseDialog)

        switchGuardian.isChecked = prefs.getBoolean("guardian_enabled", true)
        cbBankingApp.isChecked = prefs.getBoolean("banking_app_open", false)
        etServerUrl.setText(prefs.getString("server_url", GuardianApi.DEFAULT_SERVER))

        fun refreshList() {
            val checks = SetupChecks.deviceChecks(this)
            checklist.removeAllViews()
            checks.forEach { check ->
                val row = LinearLayout(this).apply {
                    orientation = LinearLayout.HORIZONTAL
                    setPadding(0, 10, 0, 10)
                    gravity = android.view.Gravity.CENTER_VERTICAL
                }

                row.addView(TextView(this).apply {
                    text = if (check.ok) "✓" else if (check.required) "✕" else "!"
                    setTextColor(Color.parseColor(if (check.ok) "#059669" else if (check.required) "#DC2626" else "#D97706"))
                    textSize = 16f
                    setPadding(0, 0, 16, 0)
                })

                val textCol = LinearLayout(this).apply {
                    orientation = LinearLayout.VERTICAL
                    layoutParams = LinearLayout.LayoutParams(0, LinearLayout.LayoutParams.WRAP_CONTENT, 1f)
                }
                textCol.addView(TextView(this).apply {
                    text = check.title + if (!check.required) " (optional)" else ""
                    setTextColor(Color.parseColor("#0F172A"))
                    textSize = 13f
                })
                textCol.addView(TextView(this).apply {
                    text = check.detail
                    setTextColor(Color.parseColor("#64748B"))
                    textSize = 10f
                })
                row.addView(textCol)

                if (!check.ok) {
                    row.addView(Button(this).apply {
                        text = "Fix"
                        textSize = 11f
                        setOnClickListener {
                            fixPermission(check.id)
                            dialog.dismiss()
                        }
                    })
                }
                checklist.addView(row)
            }

            val missingRequired = checks.filter { it.required && !it.ok }
            val enabled = switchGuardian.isChecked

            when {
                !enabled -> {
                    tvReadiness.text = "ScamShield is switched off"
                    tvReadiness.setTextColor(Color.parseColor("#DC2626"))
                }
                missingRequired.isEmpty() -> {
                    tvReadiness.text = "Ready — ScamShield will guard your next phone call"
                    tvReadiness.setTextColor(Color.parseColor("#059669"))
                }
                else -> {
                    tvReadiness.text = "Setup needed: ${missingRequired.size} permission(s) missing"
                    tvReadiness.setTextColor(Color.parseColor("#D97706"))
                }
            }
            updatePillStatus()
        }

        switchGuardian.setOnCheckedChangeListener { _, isChecked ->
            prefs.edit().putBoolean("guardian_enabled", isChecked).apply()
            refreshList()
        }
        cbBankingApp.setOnCheckedChangeListener { _, isChecked ->
            prefs.edit().putBoolean("banking_app_open", isChecked).apply()
        }

        btnRecheck.setOnClickListener {
            requestMissingPermissions()
            refreshList()
        }

        btnSaveSettings.setOnClickListener {
            val url = etServerUrl.text.toString().trim().trimEnd('/')
            prefs.edit().putString("server_url", url).apply()

            progress.visibility = View.VISIBLE
            btnSaveSettings.isEnabled = false
            tvStatus.text = "Testing connection to $url..."
            tvStatus.setTextColor(Color.parseColor("#475569"))

            CoroutineScope(Dispatchers.Main).launch {
                val server = withContext(Dispatchers.IO) { SetupChecks.serverCheck(this@MainActivity, url) }
                val ai = if (server.ok) {
                    withContext(Dispatchers.IO) { SetupChecks.aiCheck(this@MainActivity, url) }
                } else null

                progress.visibility = View.GONE
                btnSaveSettings.isEnabled = true

                val success = server.ok && (ai?.ok != false)
                tvStatus.text = if (success) "✓ Connected to ScamShield Backend" else "✕ ${server.detail}"
                tvStatus.setTextColor(Color.parseColor(if (success) "#059669" else "#DC2626"))

                // The status line sits below the button and is easily off-screen, so always
                // report the outcome somewhere that cannot be missed.
                if (success) {
                    Toast.makeText(this@MainActivity,
                        "Connected to the ScamShield server", Toast.LENGTH_LONG).show()
                } else {
                    val detail = if (ai != null && !ai.ok) ai.detail else server.detail
                    AlertDialog.Builder(this@MainActivity)
                        .setTitle(if (server.ok) "Server reached, AI not ready" else "Cannot reach the server")
                        .setMessage("$detail\n\nAddress tried:\n$url/health")
                        .setPositiveButton("OK", null)
                        .show()
                }

                refreshList()
            }
        }

        dialogView.findViewById<Button>(R.id.btnRunDemo)?.setOnClickListener {
            if (!SetupChecks.canDrawOverlay(this)) {
                AlertDialog.Builder(this)
                    .setTitle("One permission needed")
                    .setMessage("The demo shows a banner over other apps, so ScamShield needs \"Display over other apps\".")
                    .setPositiveButton("Open settings") { _, _ -> fixPermission("overlay") }
                    .setNegativeButton("Cancel", null)
                    .show()
                return@setOnClickListener
            }
            dialog.dismiss()
            Toast.makeText(this, "Demo call starting - watch for the vibration", Toast.LENGTH_LONG).show()
            val svc = Intent(this, DemoCallService::class.java).putExtra("action", DemoCallService.ACTION_START)
            if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) startForegroundService(svc) else startService(svc)
        }

        btnClose.setOnClickListener {
            dialog.dismiss()
        }

        refreshList()
        dialog.show()
    }

    private fun fixPermission(id: String) {
        when (id) {
            "mic" -> askPermission(Manifest.permission.RECORD_AUDIO)
            "phone" -> askPermission(Manifest.permission.READ_PHONE_STATE)
            "endcall" -> askPermission(Manifest.permission.ANSWER_PHONE_CALLS)
            "notif" -> if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.TIRAMISU) {
                askPermission(Manifest.permission.POST_NOTIFICATIONS)
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

    private fun askPermission(vararg permissions: String) {
        val needed = permissions.filterNot { SetupChecks.permissionGranted(this, it) }
        if (needed.isEmpty()) {
            updatePillStatus()
            return
        }

        val canPrompt = needed.any { ActivityCompat.shouldShowRequestPermissionRationale(this, it) }
        val neverAsked = prefs.getBoolean("asked_${needed.first()}", false).not()
        if (canPrompt || neverAsked) {
            needed.forEach { prefs.edit().putBoolean("asked_$it", true).apply() }
            ActivityCompat.requestPermissions(this, needed.toTypedArray(), PERMISSION_REQ_CODE)
        } else {
            AlertDialog.Builder(this)
                .setTitle("Permission required")
                .setMessage("To guard your calls in background, please enable this permission in Android App Settings.")
                .setPositiveButton("Open Settings") { _, _ ->
                    startActivity(Intent(Settings.ACTION_APPLICATION_DETAILS_SETTINGS, Uri.parse("package:$packageName")))
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

    override fun onRequestPermissionsResult(code: Int, perms: Array<out String>, results: IntArray) {
        super.onRequestPermissionsResult(code, perms, results)
        updatePillStatus()
    }

    override fun onActivityResult(requestCode: Int, resultCode: Int, data: Intent?) {
        super.onActivityResult(requestCode, resultCode, data)
        if (requestCode == FILE_CHOOSER_REQ_CODE) {
            val results: Array<Uri>? = if (resultCode == Activity.RESULT_OK && data != null) {
                val clipData = data.clipData
                if (clipData != null && clipData.itemCount > 0) {
                    Array(clipData.itemCount) { i -> clipData.getItemAt(i).uri }
                } else {
                    data.data?.let { arrayOf(it) }
                }
            } else {
                null
            }
            fileUploadCallback?.onReceiveValue(results)
            fileUploadCallback = null
        }
        updatePillStatus()
    }

    /** JavaScript Interface exposed to the embedded React Web App */
    inner class AndroidWebInterface {
        @JavascriptInterface
        fun isNativeApp(): Boolean = true

        @JavascriptInterface
        fun getServerUrl(): String =
            prefs.getString("server_url", GuardianApi.DEFAULT_SERVER) ?: GuardianApi.DEFAULT_SERVER

        @JavascriptInterface
        fun isGuardianEnabled(): Boolean =
            prefs.getBoolean("guardian_enabled", true)

        @JavascriptInterface
        fun openShieldSettings() {
            runOnUiThread { showSettingsDialog() }
        }

        @JavascriptInterface
        fun triggerVibration(durationMs: Long) {
            val vibrator = getSystemService(Context.VIBRATOR_SERVICE) as? Vibrator
            if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
                vibrator?.vibrate(VibrationEffect.createOneShot(durationMs, VibrationEffect.DEFAULT_AMPLITUDE))
            } else {
                vibrator?.vibrate(durationMs)
            }
        }
    }
}
