import { get, query, run } from '../db.js';
import { timeService } from './timeService.js';
import { brevoEmailService } from './brevoEmailService.js';
import { broadcast } from './websocketService.js';

export const escalationService = {
  // Get or create today's session
  async getOrCreateTodaySession() {
    const todayStr = timeService.getTodayString();
    let session = await get('SELECT * FROM attendance_sessions WHERE session_date = ?', [todayStr]);

    if (!session) {
      const result = await run(
        'INSERT INTO attendance_sessions (session_date, status) VALUES (?, ?)',
        [todayStr, 'ACTIVE']
      );
      session = await get('SELECT * FROM attendance_sessions WHERE id = ?', [result.lastID]);
    }
    return session;
  },

  // Get all active students who are unverified/pending for today's session
  async getDefaultersForToday() {
    const session = await this.getOrCreateTodaySession();
    const defaulters = await query(`
      SELECT s.*
      FROM students s
      WHERE s.status != 'EXPELLED'
      AND s.id NOT IN (
        SELECT student_id
        FROM attendance_records
        WHERE session_id = ? AND status = 'PRESENT'
      )
      ORDER BY s.room_number ASC
    `, [session.id]);

    return defaulters;
  },

  // 9:30 PM: Trigger buffer notice emails & update session
  async runBufferWindowAutomation() {
    console.log('[Escalation Service] Running 9:30 PM Buffer Window Automation...');
    const session = await this.getOrCreateTodaySession();
    const defaulters = await this.getDefaultersForToday();

    console.log(`[Escalation Service] Found ${defaulters.length} unverified students. Dispatching Brevo buffer notices.`);

    const emailResults = [];
    for (const student of defaulters) {
      const res = await brevoEmailService.sendBufferNoticeEmail(student, '9:45 PM');
      emailResults.push(res);
    }

    await run(`
      UPDATE attendance_sessions
      SET status = 'BUFFER', buffer_triggered_at = CURRENT_TIMESTAMP
      WHERE id = ?
    `, [session.id]);

    await run(`
      INSERT INTO audit_logs (action, details, performed_by, target_id)
      VALUES ('BUFFER_AUTOMATION_TRIGGERED', ?, 'SYSTEM_SCHEDULER', ?)
    `, [`Sent 15-minute buffer alerts to ${defaulters.length} unverified students.`, session.id]);

    broadcast('BUFFER_TRIGGERED', {
      session_id: session.id,
      session_date: session.session_date,
      defaulter_count: defaulters.length,
      defaulters: defaulters.map(d => ({ id: d.id, full_name: d.full_name, room_number: d.room_number, contact_number: d.contact_number, photo_url: d.photo_url })),
      email_dispatches: emailResults.length
    });

    return {
      success: true,
      defaulter_count: defaulters.length,
      emails_sent: emailResults.length
    };
  },

  // 9:45 PM: Progressive Disciplinary Escalation Engine
  async runDisciplinaryEscalation() {
    console.log('[Escalation Service] Running 9:45 PM Disciplinary Escalation Engine...');
    const session = await this.getOrCreateTodaySession();
    const unverifiedStudents = await this.getDefaultersForToday();

    console.log(`[Escalation Service] Evaluating ${unverifiedStudents.length} absent students for progressive penalties.`);
    const appliedPenalties = [];

    for (const student of unverifiedStudents) {
      // 1. Mark ABSENT in attendance records if not already marked
      await run(`
        INSERT OR IGNORE INTO attendance_records (session_id, student_id, status, verified_at, verified_by)
        VALUES (?, ?, 'ABSENT', CURRENT_TIMESTAMP, 'SYSTEM_CUTOFF')
      `, [session.id, student.id]);

      // 2. Count active historical penalties (ignoring WAIVED ones)
      const countRow = await get(`
        SELECT COUNT(*) as incident_count
        FROM penalties
        WHERE student_id = ? AND status != 'WAIVED'
      `, [student.id]);

      const incidentNumber = (countRow ? countRow.incident_count : 0) + 1;

      // 3. Determine progressive tier
      let tier = 'WARNING';
      let amount = 0;
      let reason = `Unexcused absence on ${session.session_date} (Missed 9:45 PM cutoff). Incident #${incidentNumber}`;

      if (incidentNumber === 1) {
        tier = 'WARNING';
        amount = 0;
      } else if (incidentNumber === 2) {
        tier = 'FINE_100';
        amount = 100;
      } else if (incidentNumber === 3) {
        tier = 'FINE_500';
        amount = 500;
      } else if (incidentNumber === 4) {
        tier = 'FINE_1000';
        amount = 1000;
      } else { // 5 or more
        tier = 'EXPULSION_FLAG';
        amount = 1000;
        reason = `CRITICAL: Cumulative ${incidentNumber} unexcused absences. Hostel admission revoked / expulsion recommendation.`;
      }

      // 4. Insert penalty record
      const penaltyResult = await run(`
        INSERT INTO penalties (student_id, session_id, incident_number, tier, amount, status, reason)
        VALUES (?, ?, ?, ?, ?, 'ACTIVE', ?)
      `, [student.id, session.id, incidentNumber, tier, amount, reason]);

      // 5. If expulsion flag, update student table status
      if (incidentNumber >= 5) {
        await run(`
          UPDATE students
          SET status = 'EXPELLED_FLAGGED'
          WHERE id = ?
        `, [student.id]);
      }

      const penaltyObj = {
        id: penaltyResult.lastID,
        student_id: student.id,
        student_name: student.full_name,
        room_number: student.room_number,
        incident_number: incidentNumber,
        tier,
        amount,
        status: 'ACTIVE'
      };

      // 6. Dispatch email notification
      await brevoEmailService.sendEscalationNoticeEmail(student, penaltyObj);

      // 7. Audit log
      await run(`
        INSERT INTO audit_logs (action, details, performed_by, target_id)
        VALUES ('PENALTY_APPLIED', ?, 'ESCALATION_ENGINE', ?)
      `, [`Applied ${tier} (₹${amount}) to ${student.full_name} (${student.reg_number}) for Incident #${incidentNumber}`, student.id]);

      appliedPenalties.push(penaltyObj);
    }

    // Mark session as CLOSED
    await run(`
      UPDATE attendance_sessions
      SET status = 'CLOSED', escalation_triggered_at = CURRENT_TIMESTAMP
      WHERE id = ?
    `, [session.id]);

    broadcast('ESCALATION_TRIGGERED', {
      session_id: session.id,
      session_date: session.session_date,
      penalties_applied: appliedPenalties.length,
      penalties: appliedPenalties
    });

    return {
      success: true,
      session_id: session.id,
      penalties_applied: appliedPenalties
    };
  }
};
