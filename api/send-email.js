const nodemailer = require('nodemailer');

function generateAlertHtml({ holdId, amount, recipientName, accountNumber, guardianName }) {
  const formattedAmount = Number(amount || 85000).toLocaleString();
  const safeRecipient = recipientName || 'Ali Raza (Unverified Account)';
  const safeAccount = accountNumber || 'PK44MBL00098472910';
  const reverseUrl = `https://scam-sheild-six.vercel.app/?action=reverse&hold_id=${encodeURIComponent(holdId || 'TXN-8291')}`;
  const approveUrl = `https://scam-sheild-six.vercel.app/?action=approve&hold_id=${encodeURIComponent(holdId || 'TXN-8291')}`;

  return `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>ScamShield Urgent Banking Alert</title>
</head>
<body style="margin:0;padding:0;background-color:#0f172a;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif;color:#ffffff;">
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background-color:#0f172a;padding:24px 12px;">
    <tr>
      <td align="center">
        <table role="presentation" width="100%" style="max-width:580px;background:#1e293b;border-radius:20px;border:2px solid #ef4444;box-shadow:0 20px 40px rgba(0,0,0,0.5);overflow:hidden;text-align:left;">
          <!-- Top Header Banner -->
          <tr>
            <td style="background:linear-gradient(135deg,#b91c1c 0%,#dc2626 50%,#991b1b 100%);padding:20px 24px;text-align:center;">
              <div style="display:inline-block;background:rgba(0,0,0,0.3);padding:6px 14px;border-radius:30px;font-size:12px;font-weight:800;letter-spacing:1px;color:#fecaca;text-transform:uppercase;margin-bottom:8px;">
                🚨 Emergency Fraud Interception
              </div>
              <h1 style="margin:0;font-size:22px;font-weight:900;color:#ffffff;letter-spacing:-0.5px;">
                ScamShield Banking Circuit-Breaker
              </h1>
              <p style="margin:4px 0 0;font-size:13px;color:#fee2e2;">
                15-Minute Safety Escrow Activated by AI Telephony Listener
              </p>
            </td>
          </tr>

          <!-- Main Body -->
          <tr>
            <td style="padding:28px 24px;">
              <p style="margin:0 0 16px;font-size:15px;line-height:1.5;color:#e2e8f0;">
                Dear Family Guardian ${guardianName ? `(${guardianName})` : ''},
              </p>
              <p style="margin:0 0 20px;font-size:14px;line-height:1.6;color:#cbd5e1;">
                ScamShield detected that your family member <strong>Tariq Mahmood</strong> was on an active, suspicious phone call with an unknown caller using <strong>coercion and urgency tactics</strong> while attempting to transfer money:
              </p>

              <!-- Transaction Summary Card -->
              <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#0f172a;border-radius:14px;border:1px solid #334155;margin-bottom:24px;overflow:hidden;">
                <tr>
                  <td style="padding:14px 18px;border-bottom:1px solid #1e293b;font-size:13px;color:#94a3b8;">
                    Attempted Amount:
                  </td>
                  <td align="right" style="padding:14px 18px;border-bottom:1px solid #1e293b;font-size:18px;font-weight:900;color:#f87171;font-family:monospace;">
                    PKR ${formattedAmount}
                  </td>
                </tr>
                <tr>
                  <td style="padding:12px 18px;border-bottom:1px solid #1e293b;font-size:13px;color:#94a3b8;">
                    Intended Recipient:
                  </td>
                  <td align="right" style="padding:12px 18px;border-bottom:1px solid #1e293b;font-size:13px;font-weight:700;color:#ffffff;">
                    ${safeRecipient}
                  </td>
                </tr>
                <tr>
                  <td style="padding:12px 18px;border-bottom:1px solid #1e293b;font-size:13px;color:#94a3b8;">
                    Destination Account:
                  </td>
                  <td align="right" style="padding:12px 18px;border-bottom:1px solid #1e293b;font-size:12px;font-family:monospace;color:#93c5fd;">
                    ${safeAccount}
                  </td>
                </tr>
                <tr>
                  <td style="padding:12px 18px;border-bottom:1px solid #1e293b;font-size:13px;color:#94a3b8;">
                    Current Status:
                  </td>
                  <td align="right" style="padding:12px 18px;border-bottom:1px solid #1e293b;font-size:12px;font-weight:800;color:#fbbf24;">
                    ⏸️ FROZEN IN BANK ESCROW (15 MIN)
                  </td>
                </tr>
                <tr>
                  <td style="padding:12px 18px;font-size:13px;color:#94a3b8;">
                    Transaction Ref:
                  </td>
                  <td align="right" style="padding:12px 18px;font-size:12px;font-family:monospace;color:#94a3b8;">
                    ${holdId || 'TXN-8291'}
                  </td>
                </tr>
              </table>

              <!-- Big Warning Box -->
              <div style="background:#450a0a;border:1px solid #b91c1c;border-radius:12px;padding:14px 16px;margin-bottom:24px;">
                <p style="margin:0;font-size:13px;line-height:1.5;color:#fecaca;">
                  ⚠️ <strong>Action Required Immediately:</strong> The funds have <em>NOT</em> been delivered to the caller. They are locked safely in cooling-off escrow. Tap the button below to permanently cancel this transfer and return the funds to the account.
                </p>
              </div>

              <!-- 1-Tap Action CTA Buttons -->
              <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin-bottom:20px;">
                <tr>
                  <td align="center" style="padding-bottom:12px;">
                    <a href="${reverseUrl}" target="_blank" style="display:block;width:100%;max-width:380px;background:#dc2626;color:#ffffff;text-align:center;padding:16px 24px;border-radius:14px;font-size:15px;font-weight:900;text-decoration:none;letter-spacing:0.5px;box-shadow:0 8px 20px rgba(220,38,38,0.4);box-sizing:border-box;">
                      🛑 1-TAP REVERSE &amp; REFUND MONEY
                    </a>
                  </td>
                </tr>
                <tr>
                  <td align="center">
                    <a href="${approveUrl}" target="_blank" style="display:inline-block;color:#94a3b8;font-size:12px;text-decoration:underline;padding:6px 12px;">
                      Approve transfer (I know this recipient is legitimate)
                    </a>
                  </td>
                </tr>
              </table>

              <p style="margin:20px 0 0;font-size:12px;color:#64748b;line-height:1.5;text-align:center;">
                If no action is taken within 15 minutes, standard bank review protocols apply.<br/>
                Need immediate help? Call SBP Helpline at <strong>111-727-273</strong> or FIA Cybercrime at <strong>1991</strong>.
              </p>
            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="background:#0f172a;padding:16px 24px;border-top:1px solid #1e293b;text-align:center;">
              <p style="margin:0;font-size:11px;color:#64748b;">
                ScamShield AI &bull; Google Cloud AI Builder Cup 2026 Submission &bull; Team CogniFlow (Talha Habib)<br/>
                Autonomous AI Defense for Under-Protected Telephony &amp; Digital Banking
              </p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;
}

module.exports = async function handler(req, res) {
  // CORS setup
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method === 'GET') {
    return res.status(200).json({
      status: 'online',
      service: 'ScamShield Real-Time Email Gateway',
      version: '2.0.0',
      timestamp: new Date().toISOString(),
    });
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ success: false, error: 'Method Not Allowed' });
  }

  try {
    let body = req.body;
    if (typeof body === 'string') {
      try {
        body = JSON.parse(body);
      } catch (e) {
        body = {};
      }
    }
    body = body || {};

    const host = (body.smtp_host || body.host || 'smtp.gmail.com').trim();
    let port = parseInt(body.smtp_port || body.port || 587, 10);
    const user = (body.smtp_user || body.user || body.email || '').trim();
    const rawPass = (body.smtp_password || body.password || body.pass || '').trim();
    const pass = rawPass.replace(/\s+/g, ''); // strip any spaces from app password
    const to = (body.to || body.recipient || body.guardian_email || user).trim();
    const subject = body.subject || `🚨 URGENT: High-Risk Transfer Intercepted for Tariq Mahmood (PKR ${Number(body.amount || 85000).toLocaleString()})`;
    const holdId = body.hold_id || body.holdId || `TXN-${Math.floor(1000 + Math.random() * 9000)}`;
    const amount = body.amount || 85000;
    const recipientName = body.payee_name || body.recipientName || 'Ali Raza (Unverified Account)';
    const accountNumber = body.payee_account || body.accountNumber || 'PK44MBL00098472910';
    const guardianName = body.guardian_name || body.guardianName || 'Hamza Tariq (Son)';

    if (!user) {
      return res.status(400).json({
        success: false,
        error: 'Missing sender email / username. Please enter your Gmail address.',
      });
    }

    if (!to) {
      return res.status(400).json({
        success: false,
        error: 'Missing recipient email address.',
      });
    }

    if (!pass) {
      return res.status(400).json({
        success: false,
        error: 'Missing Google App Password. Please enter your 16-character Google App Password in Gateway Settings.',
        help_url: 'https://myaccount.google.com/apppasswords',
      });
    }

    // Determine security based on port or host
    // Gmail supports 465 (SSL) and 587 (STARTTLS)
    // In serverless environments, port 465 with direct TLS is exceptionally reliable
    const isSecure = port === 465;

    const htmlBody = body.html || generateAlertHtml({
      holdId,
      amount,
      recipientName,
      accountNumber,
      guardianName,
    });

    const mailOptions = {
      from: `"ScamShield AI Guardian" <${user}>`,
      to: to,
      subject: subject,
      html: htmlBody,
      text: `SCAMSHIELD URGENT ALERT: Transfer of PKR ${Number(amount).toLocaleString()} initiated during unknown caller pressure. Funds are FROZEN in 15-minute escrow. Tap here to reverse: https://scam-sheild-six.vercel.app/?action=reverse&hold_id=${holdId}`,
    };

    // Attempt 1: Using provided port
    let transportConfig = {
      host: host,
      port: port,
      secure: isSecure,
      auth: {
        user: user,
        pass: pass,
      },
      connectionTimeout: 12000,
      greetingTimeout: 8000,
      socketTimeout: 15000,
      tls: {
        rejectUnauthorized: false, // Prevents self-signed cert or proxy handshake issues
      },
    };

    let transporter = nodemailer.createTransport(transportConfig);

    let info;
    try {
      info = await transporter.sendMail(mailOptions);
    } catch (primaryErr) {
      // If port was 587 and failed, attempt port 465 (or vice-versa for Gmail)
      if (host.includes('gmail.com')) {
        const altPort = port === 587 ? 465 : 587;
        try {
          transporter = nodemailer.createTransport({
            ...transportConfig,
            port: altPort,
            secure: altPort === 465,
          });
          info = await transporter.sendMail(mailOptions);
        } catch (secondaryErr) {
          throw primaryErr; // throw original or clearer error
        }
      } else {
        throw primaryErr;
      }
    }

    return res.status(200).json({
      success: true,
      message: `✓ Real alert email delivered successfully to ${to} via SMTP!`,
      messageId: info.messageId,
      response: info.response,
      recipient: to,
      hold_id: holdId,
      timestamp: new Date().toISOString(),
    });
  } catch (err) {
    let friendlyMessage = err.message || 'SMTP transmission error';
    if (err.code === 'EAUTH' || (err.response && err.response.includes('535'))) {
      friendlyMessage = 'Gmail Authentication Failed: Google rejected the username or app password. Please ensure you are using a 16-character Google App Password (from https://myaccount.google.com/apppasswords), NOT your normal Gmail login password.';
    } else if (err.code === 'ETIMEDOUT' || err.code === 'ESOCKETTIMEDOUT') {
      friendlyMessage = 'Connection timed out connecting to SMTP server. Please verify your host and port settings.';
    }

    return res.status(200).json({
      success: false,
      error: friendlyMessage,
      code: err.code || 'SMTP_ERROR',
      details: err.message,
    });
  }
};
