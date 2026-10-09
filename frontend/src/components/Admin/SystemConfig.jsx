import React, { useState, useEffect } from 'react';
import {
  Settings,
  Clock,
  Scale,
  Building,
  Save,
  RefreshCw,
  CheckCircle2
} from 'lucide-react';
import { api } from '../../services/api';
import { audioService } from '../../services/audioService';

export function SystemConfig({ currentUser }) {
  const [config, setConfig] = useState({
    hostel_name: 'Shivaji Hostel',
    curfew_start_time: '20:30',
    curfew_end_time: '21:30',
    buffer_end_time: '21:45',
    fine_tier_2_amount: '100',
    fine_tier_3_amount: '500',
    fine_tier_4_amount: '1000',
    brevo_sender_email: 'hostel-security@sggs.ac.in',
    brevo_sender_name: 'Hostel Security & Warden Office',
    brevo_api_key: ''
  });

  const [isLoading, setIsLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [savedSuccess, setSavedSuccess] = useState(false);

  const fetchConfig = async () => {
    try {
      setIsLoading(true);
      const settings = await api.getSettings();
      setConfig(prev => ({
        ...prev,
        ...settings
      }));
    } catch (err) {
      console.error('Failed to load settings:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchConfig();
  }, []);

  const handleSave = async (e) => {
    e.preventDefault();
    try {
      setIsSaving(true);
      setSavedSuccess(false);

      const res = await api.saveSettings({
        ...config,
        performer_name: currentUser?.name || 'Administrator',
        performer_role: currentUser?.role || 'ADMIN'
      });

      audioService.playSuccess();
      setSavedSuccess(true);
      setTimeout(() => setSavedSuccess(false), 4000);
      alert(res.message);
    } catch (err) {
      audioService.playError();
      alert('Save failed: ' + err.message);
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="space-y-5">
      {/* Header Banner */}
      <div className="bg-white border border-slate-200 rounded-2xl p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4 shadow-xs">
        <div>
          <div className="flex items-center gap-2">
            <span className="p-1.5 rounded-lg bg-blue-50 border border-blue-200 text-blue-700">
              <Settings className="w-5 h-5" />
            </span>
            <h1 className="text-lg font-bold text-slate-900">System Configuration</h1>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            Dynamic settings. Authorities can change curfew timings, fine tiers, and hostel properties live without code changes.
          </p>
        </div>

        <button
          onClick={fetchConfig}
          disabled={isLoading}
          className="flex items-center gap-2 px-3.5 py-2 rounded-xl bg-slate-50 hover:bg-slate-100 text-slate-700 border border-slate-200 text-xs font-bold transition-colors shrink-0"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? 'animate-spin' : ''}`} />
          <span>Reload Config</span>
        </button>
      </div>

      <form onSubmit={handleSave} className="space-y-5">
        {/* Curfew Timings */}
        <div className="bg-white border border-slate-200 rounded-2xl p-5 space-y-4 shadow-xs">
          <div className="flex items-center gap-2 pb-3 border-b border-slate-100">
            <Clock className="w-4 h-4 text-blue-600" />
            <h3 className="text-sm font-bold text-slate-900">Curfew & Gate Schedule</h3>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label className="text-xs font-bold text-slate-700 block mb-1">
                Night Attendance Window Start
              </label>
              <input
                type="time"
                value={config.curfew_start_time}
                onChange={(e) => setConfig({ ...config, curfew_start_time: e.target.value })}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-800 focus:outline-none focus:border-blue-500 font-mono font-bold"
              />
              <span className="text-[10px] text-slate-500 mt-1 block">Default: 20:30 (8:30 PM)</span>
            </div>

            <div>
              <label className="text-xs font-bold text-slate-700 block mb-1">
                Grace Buffer Window Start
              </label>
              <input
                type="time"
                value={config.curfew_end_time}
                onChange={(e) => setConfig({ ...config, curfew_end_time: e.target.value })}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-800 focus:outline-none focus:border-blue-500 font-mono font-bold"
              />
              <span className="text-[10px] text-slate-500 mt-1 block">Default: 21:30 (9:30 PM)</span>
            </div>

            <div>
              <label className="text-xs font-bold text-slate-700 block mb-1">
                Lockout & Fine Escalation Deadline
              </label>
              <input
                type="time"
                value={config.buffer_end_time}
                onChange={(e) => setConfig({ ...config, buffer_end_time: e.target.value })}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-800 focus:outline-none focus:border-blue-500 font-mono font-bold"
              />
              <span className="text-[10px] text-slate-500 mt-1 block">Default: 21:45 (9:45 PM)</span>
            </div>
          </div>
        </div>

        {/* Fine Amounts */}
        <div className="bg-white border border-slate-200 rounded-2xl p-5 space-y-4 shadow-xs">
          <div className="flex items-center gap-2 pb-3 border-b border-slate-100">
            <Scale className="w-4 h-4 text-amber-600" />
            <h3 className="text-sm font-bold text-slate-900">Disciplinary Fine Tiers</h3>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label className="text-xs font-bold text-slate-700 block mb-1">
                2nd Offense Fine (₹)
              </label>
              <input
                type="number"
                value={config.fine_tier_2_amount}
                onChange={(e) => setConfig({ ...config, fine_tier_2_amount: e.target.value })}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-800 focus:outline-none focus:border-blue-500 font-bold"
              />
              <span className="text-[10px] text-slate-500 mt-1 block">Standard: ₹100 fine</span>
            </div>

            <div>
              <label className="text-xs font-bold text-slate-700 block mb-1">
                3rd Offense Fine (₹)
              </label>
              <input
                type="number"
                value={config.fine_tier_3_amount}
                onChange={(e) => setConfig({ ...config, fine_tier_3_amount: e.target.value })}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-800 focus:outline-none focus:border-blue-500 font-bold"
              />
              <span className="text-[10px] text-slate-500 mt-1 block">Standard: ₹500 fine</span>
            </div>

            <div>
              <label className="text-xs font-bold text-slate-700 block mb-1">
                4th Offense Fine (₹)
              </label>
              <input
                type="number"
                value={config.fine_tier_4_amount}
                onChange={(e) => setConfig({ ...config, fine_tier_4_amount: e.target.value })}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-800 focus:outline-none focus:border-blue-500 font-bold"
              />
              <span className="text-[10px] text-slate-500 mt-1 block">Standard: ₹1000 fine</span>
            </div>
          </div>
        </div>

        {/* Hostel Properties */}
        <div className="bg-white border border-slate-200 rounded-2xl p-5 space-y-4 shadow-xs">
          <div className="flex items-center gap-2 pb-3 border-b border-slate-100">
            <Building className="w-4 h-4 text-emerald-600" />
            <h3 className="text-sm font-bold text-slate-900">Hostel Properties & Notifications</h3>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="text-xs font-bold text-slate-700 block mb-1">
                Hostel Hall Name
              </label>
              <input
                type="text"
                value={config.hostel_name}
                onChange={(e) => setConfig({ ...config, hostel_name: e.target.value })}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-800 focus:outline-none focus:border-blue-500 font-medium"
              />
            </div>

            <div>
              <label className="text-xs font-bold text-slate-700 block mb-1">
                Security Office Sender Name
              </label>
              <input
                type="text"
                value={config.brevo_sender_name}
                onChange={(e) => setConfig({ ...config, brevo_sender_name: e.target.value })}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-800 focus:outline-none focus:border-blue-500 font-medium"
              />
            </div>

            <div>
              <label className="text-xs font-bold text-slate-700 block mb-1">
                Sender Email Address
              </label>
              <input
                type="email"
                value={config.brevo_sender_email}
                onChange={(e) => setConfig({ ...config, brevo_sender_email: e.target.value })}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-800 focus:outline-none focus:border-blue-500 font-medium"
              />
            </div>

            <div>
              <label className="text-xs font-bold text-slate-700 block mb-1">
                Brevo Email API Key (Optional)
              </label>
              <input
                type="password"
                value={config.brevo_api_key}
                onChange={(e) => setConfig({ ...config, brevo_api_key: e.target.value })}
                placeholder="Leave blank for Sandbox Mock simulation mode"
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-800 focus:outline-none focus:border-blue-500 font-mono"
              />
            </div>
          </div>
        </div>

        {/* Submit */}
        <div className="flex items-center justify-end gap-3 pt-2">
          {savedSuccess && (
            <span className="text-xs text-emerald-700 font-bold flex items-center gap-1">
              <CheckCircle2 className="w-4 h-4" /> Changes Applied Live
            </span>
          )}

          <button
            type="submit"
            disabled={isSaving}
            className="flex items-center gap-1.5 px-6 py-2.5 rounded-xl text-xs font-bold text-white bg-blue-600 hover:bg-blue-700 disabled:opacity-50 shadow-sm transition-all"
          >
            {isSaving ? (
              <>
                <RefreshCw className="w-4 h-4 animate-spin" />
                <span>Saving Changes...</span>
              </>
            ) : (
              <>
                <Save className="w-4 h-4" />
                <span>Save System Settings</span>
              </>
            )}
          </button>
        </div>
      </form>
    </div>
  );
}
