import React, { useState, useEffect } from 'react';
import { Shield, FileText, CheckCircle2, RotateCcw, AlertTriangle, Save, KeyRound } from 'lucide-react';
import { api } from '../../services/api';
import { formatIstDateTime } from '../../utils/dateUtils';

export function AuditLogs() {
  const [logs, setLogs] = useState([]);

  useEffect(() => {
    loadLogs();
  }, []);

  const loadLogs = async () => {
    try {
      const data = await api.getAuditLogs();
      setLogs(data);
    } catch (e) {
      console.error('Failed to load audit logs:', e);
    }
  };

  return (
    <div className="bg-white border border-slate-200 rounded-3xl p-6 shadow-sm">
      <div className="flex items-center space-x-2 pb-4 border-b border-slate-200 mb-4 text-xs uppercase font-black text-slate-700">
        <Shield className="w-4 h-4 text-amber-600" />
        <span>Official Immutable Audit Trail & Penalty Waiver History</span>
      </div>

      {logs.length === 0 ? (
        <div className="py-12 text-center text-slate-400 text-xs">No audit entries logged yet.</div>
      ) : (
        <div className="space-y-3 max-h-[550px] overflow-y-auto pr-1">
          {logs.map((log) => (
            <div
              key={log.id}
              className="p-4 rounded-2xl bg-slate-50 border border-slate-200 text-xs space-y-1.5"
            >
              <div className="flex items-center justify-between">
                <span className="font-mono font-bold text-amber-800 bg-amber-100 border border-amber-200 px-2.5 py-0.5 rounded text-[11px]">
                  {log.action}
                </span>
                <span className="text-[11px] text-slate-500 font-mono">
                  {formatIstDateTime(log.timestamp)}
                </span>
              </div>
              <p className="text-slate-800 text-xs leading-relaxed font-medium">{log.details}</p>
              <div className="text-[11px] text-slate-500">
                Authorized By: <span className="text-slate-900 font-bold">{log.performed_by}</span>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export function EmailLogsViewer() {
  const [emails, setEmails] = useState([]);

  useEffect(() => {
    loadEmails();
    const interval = setInterval(loadEmails, 3000);
    return () => clearInterval(interval);
  }, []);

  const loadEmails = async () => {
    try {
      const data = await api.getEmailLogs();
      setEmails(data);
    } catch (e) {
      console.error('Failed to load email logs:', e);
    }
  };

  return (
    <div className="bg-white border border-slate-200 rounded-3xl p-6 shadow-sm">
      <div className="flex items-center justify-between pb-4 border-b border-slate-200 mb-4">
        <div className="flex items-center space-x-2 text-xs uppercase font-black text-slate-700">
          <FileText className="w-4 h-4 text-blue-600" />
          <span>Brevo Transactional Email Dispatch Logs</span>
        </div>
        <span className="text-[11px] font-mono text-slate-500 bg-slate-100 px-2 py-0.5 rounded">Auto-refreshing</span>
      </div>

      {emails.length === 0 ? (
        <div className="py-12 text-center text-slate-400 text-xs">
          No automated emails dispatched yet. At 9:30 PM (or when triggered), buffer grace notice emails are sent to unverified students.
        </div>
      ) : (
        <div className="space-y-3 max-h-[550px] overflow-y-auto pr-1">
          {emails.map((m) => (
            <div
              key={m.id}
              className="p-4 rounded-2xl bg-slate-50 border border-slate-200 text-xs space-y-1.5"
            >
              <div className="flex items-center justify-between">
                <span className="font-bold text-slate-900 text-xs">{m.student_name} (Room {m.room_number})</span>
                <span className={`px-2.5 py-0.5 rounded text-[10px] font-bold font-mono ${
                  m.status === 'SENT_VIA_BREVO' 
                    ? 'bg-emerald-100 text-emerald-800 border border-emerald-200' 
                    : 'bg-blue-100 text-blue-800 border border-blue-200'
                }`}>
                  {m.status}
                </span>
              </div>
              <div className="text-slate-800 font-medium">{m.subject}</div>
              <div className="flex items-center justify-between text-[11px] text-slate-500 font-mono">
                <span>To: {m.student_email}</span>
                <span>{new Date(m.timestamp).toLocaleTimeString()}</span>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export function SettingsView() {
  const [settings, setSettings] = useState({
    brevo_api_key: '',
    brevo_sender_email: 'hostel-security@sggs.ac.in',
    brevo_sender_name: 'Hostel Security & Warden Office',
    hostel_name: 'Shivaji Hostel'
  });
  const [savedMessage, setSavedMessage] = useState('');

  useEffect(() => {
    api.getSettings().then((s) => {
      setSettings((prev) => ({ ...prev, ...s }));
    });
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      await api.saveSettings(settings);
      setSavedMessage('Settings saved successfully!');
      setTimeout(() => setSavedMessage(''), 3000);
    } catch (err) {
      alert('Failed to save settings: ' + err.message);
    }
  };

  return (
    <div className="bg-white border border-slate-200 rounded-3xl p-6 sm:p-8 shadow-sm max-w-xl">
      <h3 className="font-black text-base text-slate-900 uppercase mb-1">System & Brevo Email Configuration</h3>
      <p className="text-xs text-slate-500 mb-6 font-medium">
        Configure Brevo API credentials for sending live automated buffer warning emails.
      </p>

      {savedMessage && (
        <div className="p-3 bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs rounded-xl mb-4 font-bold">
          {savedMessage}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-4 text-xs">
        <div>
          <label className="block font-bold text-slate-700 uppercase mb-1">
            Brevo API Key (v3)
          </label>
          <input
            type="password"
            value={settings.brevo_api_key || ''}
            onChange={(e) => setSettings({ ...settings, brevo_api_key: e.target.value })}
            placeholder="xkeysib-..."
            className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3.5 py-2.5 text-slate-900 font-mono focus:outline-none focus:border-blue-500"
          />
          <span className="text-[11px] text-slate-400 mt-1 block font-normal">
            Optional: If left blank, automated buffer emails are still logged and viewable in the Brevo Email Logs tab.
          </span>
        </div>

        <div>
          <label className="block font-bold text-slate-700 uppercase mb-1">
            Sender Email Address
          </label>
          <input
            type="email"
            value={settings.brevo_sender_email || ''}
            onChange={(e) => setSettings({ ...settings, brevo_sender_email: e.target.value })}
            className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3.5 py-2.5 text-slate-900 focus:outline-none focus:border-blue-500"
          />
        </div>

        <div>
          <label className="block font-bold text-slate-700 uppercase mb-1">
            Sender Display Name
          </label>
          <input
            type="text"
            value={settings.brevo_sender_name || ''}
            onChange={(e) => setSettings({ ...settings, brevo_sender_name: e.target.value })}
            className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3.5 py-2.5 text-slate-900 focus:outline-none focus:border-blue-500"
          />
        </div>

        <div>
          <label className="block font-bold text-slate-700 uppercase mb-1">
            Hostel Residence Name
          </label>
          <input
            type="text"
            value={settings.hostel_name || ''}
            onChange={(e) => setSettings({ ...settings, hostel_name: e.target.value })}
            className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3.5 py-2.5 text-slate-900 focus:outline-none focus:border-blue-500"
          />
        </div>

        <button
          type="submit"
          className="bg-blue-600 hover:bg-blue-700 text-white font-bold py-2.5 px-6 rounded-xl transition text-xs shadow mt-2"
        >
          Save Configuration
        </button>
      </form>
    </div>
  );
}
