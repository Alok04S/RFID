import { get, run, query } from '../db.js';

// In-memory log of recent emails sent or simulated
export const emailLogs = [];

export const brevoEmailService = {
  async getApiKey() {
    if (process.env.BREVO_API_KEY && process.env.BREVO_API_KEY.trim() !== '') {
      return process.env.BREVO_API_KEY.trim();
    }
    const row = await get("SELECT value FROM settings WHERE key = 'brevo_api_key'");
    return row ? row.value : null;
  },

  async sendBufferNoticeEmail(student, deadlineTimeStr = '9:45 PM') {
    const apiKey = await this.getApiKey();
    const senderEmailRow = await get("SELECT value FROM settings WHERE key = 'brevo_sender_email'");
    const senderNameRow = await get("SELECT value FROM settings WHERE key = 'brevo_sender_name'");

    const senderEmail = senderEmailRow ? senderEmailRow.value : 'hostel-security@campus.edu';
    const senderName = senderNameRow ? senderNameRow.value : 'Hostel Security & Warden Office';

    const subject = `Urgent: Hostel Attendance Buffer Notice (15 Minutes Remaining)`;
    const htmlContent = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <style>
          body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; background-color: #0f172a; color: #f8fafc; margin: 0; padding: 24px; }
          .container { max-width: 580px; margin: 0 auto; background: #1e293b; border-radius: 12px; border: 1px solid #334155; padding: 28px; }
          .header { border-bottom: 2px solid #e11d48; padding-bottom: 16px; margin-bottom: 20px; }
          .badge { display: inline-block; background: #dc2626; color: #ffffff; font-weight: bold; font-size: 12px; padding: 4px 10px; border-radius: 9999px; text-transform: uppercase; letter-spacing: 0.05em; }
          .title { font-size: 20px; font-weight: 700; color: #ffffff; margin-top: 12px; margin-bottom: 4px; }
          .warning-box { background: #451a03; border-left: 4px solid #f59e0b; padding: 14px; border-radius: 6px; margin: 18px 0; }
          .info-table { width: 100%; border-collapse: collapse; margin: 16px 0; }
          .info-table td { padding: 8px 0; border-bottom: 1px solid #334155; }
          .label { color: #94a3b8; font-size: 13px; }
          .val { color: #f1f5f9; font-weight: 600; font-size: 14px; text-align: right; }
          .footer { margin-top: 24px; font-size: 12px; color: #64748b; text-align: center; border-top: 1px solid #334155; padding-top: 16px; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <span class="badge">Urgent Attendance Notice</span>
            <div class="title">Hostel Night Attendance Buffer Alert</div>
            <div style="color: #94a3b8; font-size: 13px;">Automated Security Notification • Action Required</div>
          </div>

          <p>Dear <strong>${student.full_name}</strong> (Room <strong>${student.room_number}</strong>),</p>
          
          <div class="warning-box">
            <strong style="color: #fbbf24;">⚠️ You have not recorded your attendance for tonight.</strong><br/>
            The primary attendance window (8:30 PM – 9:30 PM) has now closed.
          </div>

          <p>You have been granted a <strong>15-minute buffer grace window</strong> ending strictly at <strong>${deadlineTimeStr}</strong>. Please report to the Main Hostel Gate / Security Booth immediately with your RFID card.</p>

          <table class="info-table">
            <tr>
              <td class="label">Student Name:</td>
              <td class="val">${student.full_name}</td>
            </tr>
            <tr>
              <td class="label">Registration No:</td>
              <td class="val">${student.reg_number}</td>
            </tr>
            <tr>
              <td class="label">Room Number:</td>
              <td class="val">${student.room_number}</td>
            </tr>
            <tr>
              <td class="label">Grace Buffer Cutoff:</td>
              <td class="val" style="color: #f87171;">${deadlineTimeStr} Tonight</td>
            </tr>
          </table>

          <p style="font-size: 13px; color: #cbd5e1;">
            <strong>Notice of Disciplinary Escalation:</strong><br/>
            Failure to verify before ${deadlineTimeStr} will result in an unexcused absence, triggering progressive penalties:
            <ul style="font-size: 12px; color: #94a3b8; padding-left: 20px;">
              <li>1st Absence: Official Written Warning</li>
              <li>2nd Absence: ₹100 Fine</li>
              <li>3rd Absence: ₹500 Fine</li>
              <li>4th Absence: ₹1,000 Fine</li>
              <li>5th Absence: Hostel Expulsion Flag & Guardian Summon</li>
            </ul>
          </p>

          <div class="footer">
            Sent automatically by Hostel Gate Entry & Night Attendance Control System.<br/>
            If you are on approved leave or in the medical ward, please notify the warden immediately.
          </div>
        </div>
      </body>
      </html>
    `;

    const logEntry = {
      id: Date.now() + Math.random().toString(36).substring(2, 7),
      student_id: student.id,
      student_name: student.full_name,
      student_email: student.email,
      room_number: student.room_number,
      subject,
      timestamp: new Date().toISOString(),
      status: 'SIMULATED'
    };

    if (apiKey) {
      try {
        const response = await fetch('https://api.brevo.com/v3/smtp/email', {
          method: 'POST',
          headers: {
            'accept': 'application/json',
            'api-key': apiKey,
            'content-type': 'application/json'
          },
          body: JSON.stringify({
            sender: { name: senderName, email: senderEmail },
            to: [{ email: student.email, name: student.full_name }],
            subject: subject,
            htmlContent: htmlContent
          })
        });

        if (response.ok) {
          const resData = await response.json();
          logEntry.status = 'SENT_VIA_BREVO';
          logEntry.messageId = resData.messageId;
          console.log(`[Brevo API] Successfully sent buffer email to ${student.email} (MessageID: ${resData.messageId})`);
        } else {
          const errData = await response.text();
          logEntry.status = 'BREVO_API_ERROR';
          logEntry.error = errData;
          console.error(`[Brevo API Error] ${errData}`);
        }
      } catch (err) {
        logEntry.status = 'NETWORK_ERROR';
        logEntry.error = err.message;
        console.error(`[Brevo Network Error] ${err.message}`);
      }
    } else {
      console.log(`[Brevo Service - Mock/Sandbox] Buffer email logged for ${student.full_name} (${student.email}). (Configure BREVO_API_KEY in settings to send live email)`);
    }

    emailLogs.unshift(logEntry);
    if (emailLogs.length > 100) emailLogs.pop();

    return logEntry;
  },

  async sendEscalationNoticeEmail(student, penalty) {
    const apiKey = await this.getApiKey();
    const senderEmailRow = await get("SELECT value FROM settings WHERE key = 'brevo_sender_email'");
    const senderNameRow = await get("SELECT value FROM settings WHERE key = 'brevo_sender_name'");

    const senderEmail = senderEmailRow ? senderEmailRow.value : 'hostel-security@campus.edu';
    const senderName = senderNameRow ? senderNameRow.value : 'Hostel Security & Warden Office';

    const subject = `DISCIPLINARY ACTION: Incident #${penalty.incident_number} - ${penalty.tier}`;
    const htmlContent = `
      <div style="font-family: sans-serif; background: #0f172a; color: #f8fafc; padding: 24px;">
        <div style="background: #1e293b; padding: 24px; border-radius: 8px; border: 1px solid #ef4444;">
          <h2 style="color: #ef4444; margin-top: 0;">Disciplinary Escalation Notice</h2>
          <p>Dear ${student.full_name} (Room ${student.room_number}),</p>
          <p>You failed to record night attendance before the 9:45 PM deadline tonight.</p>
          <div style="background: #450a0a; padding: 12px; border-radius: 4px; margin: 12px 0;">
            <strong>Incident Number:</strong> #${penalty.incident_number}<br/>
            <strong>Applied Penalty Tier:</strong> ${penalty.tier}<br/>
            <strong>Monetary Fine:</strong> ₹${penalty.amount}<br/>
            <strong>Status:</strong> ${penalty.status}
          </div>
          <p>If you believe this penalty was applied in error or have verified hospital/leave documents, you may approach the Warden Office for waiver review.</p>
        </div>
      </div>
    `;

    const logEntry = {
      id: Date.now() + Math.random().toString(36).substring(2, 7),
      student_id: student.id,
      student_name: student.full_name,
      student_email: student.email,
      room_number: student.room_number,
      subject,
      timestamp: new Date().toISOString(),
      status: apiKey ? 'SENT_VIA_BREVO' : 'SIMULATED'
    };

    if (apiKey) {
      try {
        await fetch('https://api.brevo.com/v3/smtp/email', {
          method: 'POST',
          headers: {
            'accept': 'application/json',
            'api-key': apiKey,
            'content-type': 'application/json'
          },
          body: JSON.stringify({
            sender: { name: senderName, email: senderEmail },
            to: [{ email: student.email, name: student.full_name }],
            subject: subject,
            htmlContent: htmlContent
          })
        });
      } catch (e) {
        logEntry.error = e.message;
      }
    }

    emailLogs.unshift(logEntry);
    return logEntry;
  },

  getEmailLogs() {
    return emailLogs;
  }
};
