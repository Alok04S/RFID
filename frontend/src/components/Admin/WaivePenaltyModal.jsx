import React, { useState } from 'react';
import { X, ShieldAlert, Check, AlertTriangle } from 'lucide-react';

export function WaivePenaltyModal({ penalty, isOpen, onClose, onConfirm, isSubmitting }) {
  const [waiveReason, setWaiveReason] = useState('');
  const [adminName, setAdminName] = useState('Chief Warden Office');
  const [error, setError] = useState('');

  if (!isOpen || !penalty) return null;

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!waiveReason.trim() || waiveReason.trim().length < 5) {
      setError('Please provide a genuine justification reason (minimum 5 characters).');
      return;
    }
    setError('');
    onConfirm(penalty.id, waiveReason.trim(), adminName.trim());
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in duration-200">
      <div className="bg-white border border-slate-200 rounded-3xl max-w-lg w-full p-6 sm:p-8 shadow-2xl text-slate-900 relative">
        
        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-slate-200 mb-5">
          <div className="flex items-center space-x-3">
            <div className="p-2.5 rounded-2xl bg-amber-100 text-amber-800">
              <ShieldAlert className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-black text-lg text-slate-900 uppercase">Waive Disciplinary Penalty</h3>
              <p className="text-xs text-slate-500 font-medium">Forgive warning/fine with official audit record</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-500"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Penalty Summary Card */}
        <div className="bg-slate-50 border border-slate-200 rounded-2xl p-4 mb-5 text-xs space-y-2">
          <div className="flex justify-between items-center">
            <span className="text-slate-500">Resident:</span>
            <span className="font-bold text-slate-900 text-sm">{penalty.full_name} ({penalty.reg_number})</span>
          </div>
          <div className="flex justify-between items-center">
            <span className="text-slate-500">Room Number:</span>
            <span className="font-mono font-black text-amber-700">{penalty.room_number}</span>
          </div>
          <div className="flex justify-between items-center">
            <span className="text-slate-500">Incident Number:</span>
            <span className="font-mono font-bold text-slate-700">#{penalty.incident_number}</span>
          </div>
          <div className="flex justify-between items-center">
            <span className="text-slate-500">Penalty Tier:</span>
            <span className="font-bold text-rose-800 bg-rose-100 border border-rose-200 px-2 py-0.5 rounded">
              {penalty.tier} (₹{penalty.amount})
            </span>
          </div>
          <div className="pt-2 text-slate-600 border-t border-slate-200 mt-2">
            <span className="font-bold text-slate-500">Original Reason: </span>
            <span>{penalty.reason}</span>
          </div>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-4">
          
          {error && (
            <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs flex items-center space-x-2">
              <AlertTriangle className="w-4 h-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
              Genuine Justification Reason <span className="text-rose-500">*</span>
            </label>
            <textarea
              rows={3}
              required
              placeholder="e.g., Medical hospitalization slip submitted and verified by clinic; or outstation permission slip approved by Dean."
              value={waiveReason}
              onChange={(e) => setWaiveReason(e.target.value)}
              className="w-full bg-slate-50 border border-slate-300 rounded-xl p-3 text-xs text-slate-900 focus:outline-none focus:border-blue-500 placeholder:text-slate-400"
            ></textarea>
            <div className="text-[11px] text-slate-400 mt-1">
              This explanation is permanently logged in the official audit trail.
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
              Authorizing Warden / Admin Signature
            </label>
            <input
              type="text"
              required
              value={adminName}
              onChange={(e) => setAdminName(e.target.value)}
              className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3.5 py-2.5 text-xs text-slate-900 focus:outline-none focus:border-blue-500"
            />
          </div>

          <div className="flex items-center space-x-3 pt-3">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold py-3 px-4 rounded-xl text-xs transition"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="flex-1 bg-amber-500 hover:bg-amber-600 text-slate-950 font-black py-3 px-4 rounded-xl text-xs transition shadow-md flex items-center justify-center space-x-1.5"
            >
              <Check className="w-4 h-4" />
              <span>{isSubmitting ? 'Waiving...' : 'Confirm Waive Off'}</span>
            </button>
          </div>

        </form>

      </div>
    </div>
  );
}
