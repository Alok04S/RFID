import React, { useState } from 'react';
import {
  Calendar,
  Plus,
  CheckCircle2,
  Users,
  ArrowRight,
  Sparkles
} from 'lucide-react';
import { api } from '../../services/api';
import { audioService } from '../../services/audioService';

export function AcademicYearManager({
  academicYears = [],
  activeAcademicYear,
  currentUser,
  onRefreshYears
}) {
  const [isCreating, setIsCreating] = useState(false);
  const [newYearName, setNewYearName] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [isActivating, setIsActivating] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleActivateYear = async (year) => {
    if (year.year_name === activeAcademicYear) return;
    try {
      setIsActivating(true);
      const res = await api.activateAcademicYear(year.id, currentUser?.name || 'Administrator');
      audioService.playSuccess();
      if (onRefreshYears) onRefreshYears();
      alert(res.message);
    } catch (err) {
      audioService.playError();
      alert('Activation failed: ' + err.message);
    } finally {
      setIsActivating(false);
    }
  };

  const handleCreateYear = async (e) => {
    e.preventDefault();
    if (!newYearName.trim()) {
      alert('Please enter a valid academic year name, e.g. 2026-2027');
      return;
    }

    try {
      setIsSubmitting(true);
      const res = await api.createAcademicYear({
        year_name: newYearName.trim(),
        start_date: startDate || undefined,
        end_date: endDate || undefined,
        is_active: false,
        admin_name: currentUser?.name || 'Administrator'
      });

      audioService.playSuccess();
      setNewYearName('');
      setStartDate('');
      setEndDate('');
      setIsCreating(false);
      if (onRefreshYears) onRefreshYears();
      alert(res.message);
    } catch (err) {
      audioService.playError();
      alert('Creation failed: ' + err.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="space-y-5">
      {/* Header Banner */}
      <div className="bg-white border border-slate-200 rounded-2xl p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4 shadow-xs">
        <div>
          <div className="flex items-center gap-2">
            <span className="p-1.5 rounded-lg bg-blue-50 border border-blue-200 text-blue-700">
              <Calendar className="w-5 h-5" />
            </span>
            <h1 className="text-lg font-bold text-slate-900">Academic Year & Session Lifecycle</h1>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            Hostel residents change each academic year. Switch active sessions to manage fresh batches while preserving historical records.
          </p>
        </div>

        {currentUser?.role === 'ADMIN' && (
          <button
            onClick={() => setIsCreating(true)}
            className="flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold text-white bg-blue-600 hover:bg-blue-700 shadow-sm transition-all shrink-0"
          >
            <Plus className="w-4 h-4" />
            <span>New Academic Year</span>
          </button>
        )}
      </div>

      {/* Creation Modal / Inline Drawer */}
      {isCreating && (
        <form onSubmit={handleCreateYear} className="bg-white border border-blue-200 rounded-2xl p-5 space-y-4 shadow-sm">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100">
            <h3 className="text-sm font-bold text-slate-900">Register New Academic Year</h3>
            <button
              type="button"
              onClick={() => setIsCreating(false)}
              className="text-xs text-slate-500 hover:text-slate-800"
            >
              Cancel
            </button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div>
              <label className="text-xs font-bold text-slate-700 block mb-1">
                Academic Year *
              </label>
              <input
                type="text"
                required
                value={newYearName}
                onChange={(e) => setNewYearName(e.target.value)}
                placeholder="e.g. 2026-2027"
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-800 focus:outline-none focus:border-blue-500"
              />
            </div>
            <div>
              <label className="text-xs font-bold text-slate-700 block mb-1">
                Start Date
              </label>
              <input
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-800 focus:outline-none focus:border-blue-500"
              />
            </div>
            <div>
              <label className="text-xs font-bold text-slate-700 block mb-1">
                End Date
              </label>
              <input
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-800 focus:outline-none focus:border-blue-500"
              />
            </div>
          </div>

          <div className="flex justify-end gap-2 pt-2">
            <button
              type="button"
              onClick={() => setIsCreating(false)}
              className="px-4 py-2 rounded-xl text-xs text-slate-600 bg-slate-100 font-semibold"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="px-5 py-2 rounded-xl text-xs font-bold text-white bg-blue-600 hover:bg-blue-700 disabled:opacity-50 transition-all shadow-sm"
            >
              {isSubmitting ? 'Registering...' : 'Register Session'}
            </button>
          </div>
        </form>
      )}

      {/* Academic Years Card Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {academicYears.map((ay) => {
          const isActive = ay.year_name === activeAcademicYear;

          return (
            <div
              key={ay.id || ay.year_name}
              className={`p-5 rounded-2xl border transition-all ${
                isActive
                  ? 'bg-blue-50/40 border-blue-300 shadow-sm'
                  : 'bg-white border-slate-200 hover:border-slate-300'
              }`}
            >
              <div className="flex items-start justify-between mb-3">
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="text-base font-bold text-slate-900">{ay.year_name}</h3>
                    {isActive && (
                      <span className="text-[10px] px-2 py-0.5 rounded-full font-bold uppercase bg-blue-100 text-blue-800 border border-blue-200">
                        Active Batch
                      </span>
                    )}
                  </div>
                  <div className="text-[11px] text-slate-500 mt-0.5">
                    {ay.start_date ? `${ay.start_date} to ${ay.end_date || 'Ongoing'}` : 'Annual Session'}
                  </div>
                </div>

                <div className="w-8 h-8 rounded-xl bg-slate-100 flex items-center justify-center text-slate-600 shrink-0">
                  <Calendar className="w-4 h-4 text-blue-600" />
                </div>
              </div>

              {/* Resident Count Stat */}
              <div className="my-4 p-3 bg-slate-50 rounded-xl border border-slate-200 flex items-center justify-between">
                <div className="flex items-center gap-2 text-xs text-slate-600">
                  <Users className="w-4 h-4 text-slate-400" />
                  <span>Enrolled Residents:</span>
                </div>
                <span className="text-sm font-bold text-slate-900 font-mono">
                  {ay.resident_count || 0} Students
                </span>
              </div>

              {/* Action Button */}
              {isActive ? (
                <div className="w-full py-2 px-3 rounded-xl bg-blue-100/60 border border-blue-200 text-blue-800 text-xs font-bold text-center flex items-center justify-center gap-1.5">
                  <CheckCircle2 className="w-4 h-4" />
                  <span>Currently Active Session</span>
                </div>
              ) : (
                <button
                  onClick={() => handleActivateYear(ay)}
                  disabled={isActivating}
                  className="w-full py-2 px-3 rounded-xl bg-white hover:bg-slate-50 text-slate-700 border border-slate-300 text-xs font-bold text-center transition-all flex items-center justify-center gap-1.5 shadow-xs"
                >
                  <span>Switch to this Session</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
