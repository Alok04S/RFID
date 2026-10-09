import React, { useState, useEffect } from 'react';
import { 
  Users, 
  UserCheck, 
  Clock, 
  AlertCircle, 
  Radio, 
  Zap, 
  Shield, 
  CheckCircle2,
  PhoneCall,
  Search
} from 'lucide-react';
import { ScanModal } from './ScanModal';
import { DefaultersList } from './DefaultersList';
import { RecentActivityFeed } from './RecentActivityFeed';
import { api } from '../../services/api';
import { audioService } from '../../services/audioService';

export function GuardDashboard({ 
  currentMode, 
  todayData, 
  recentLogs, 
  scanResult, 
  setScanResult, 
  onVerifyStudent, 
  isVerifying,
  onRefreshData,
  onOpenSimulator
}) {
  const [manualRfidInput, setManualRfidInput] = useState('');
  const [isProcessingManual, setIsProcessingManual] = useState(false);
  const [isVerifyingDefaulterId, setIsVerifyingDefaulterId] = useState(null);

  const isBufferActive = currentMode?.mode === 'BUFFER_WINDOW';
  const isNightActive = currentMode?.mode === 'NIGHT_ATTENDANCE';

  // Handle Manual RFID Submission
  const handleManualScanSubmit = async (e) => {
    e.preventDefault();
    if (!manualRfidInput.trim()) return;

    try {
      setIsProcessingManual(true);
      const res = await api.scanCard(manualRfidInput.trim());
      if (res.audio === 'SUCCESS' || res.audio === 'SCAN_SUCCESS') {
        audioService.playSuccess();
      } else if (res.audio === 'ERROR') {
        audioService.playError();
      }
      setScanResult(res);
      setManualRfidInput('');
      onRefreshData();
    } catch (err) {
      audioService.playError();
      setScanResult({
        status: 'UNREGISTERED',
        rfid_tag: manualRfidInput.trim(),
        message: 'Card not recognized in database'
      });
      setManualRfidInput('');
    } finally {
      setIsProcessingManual(false);
    }
  };

  // Quick verify from defaulters list
  const handleQuickVerifyDefaulter = async (studentId) => {
    try {
      setIsVerifyingDefaulterId(studentId);
      await onVerifyStudent(studentId);
    } finally {
      setIsVerifyingDefaulterId(null);
    }
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      
      {/* Active Mode Alert / Buffer Notice Banner */}
      {isBufferActive && (
        <div className="bg-gradient-to-r from-amber-950/80 via-amber-900/60 to-amber-950/80 border-2 border-amber-500/80 rounded-2xl p-4 sm:p-5 shadow-xl shadow-amber-950/40 flex flex-col md:flex-row items-center justify-between gap-4 animate-pulse">
          <div className="flex items-center space-x-3.5">
            <div className="w-12 h-12 rounded-xl bg-amber-500/20 text-amber-400 flex items-center justify-center border border-amber-500/40 shrink-0">
              <Clock className="w-6 h-6 animate-spin" />
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <span className="text-xs font-black uppercase tracking-wider bg-amber-500 text-slate-950 px-2 py-0.5 rounded">
                  Grace Period Active
                </span>
                <h2 className="text-lg font-black text-amber-100">
                  15-Minute Attendance Buffer Window (9:30 PM – 9:45 PM)
                </h2>
              </div>
              <p className="text-xs text-amber-200/90 mt-0.5">
                Automated Brevo warning emails have been dispatched to all pending residents. Review defaulters below for phone outreach before 9:45 PM escalation cutoff.
              </p>
            </div>
          </div>

          <div className="flex items-center space-x-3 shrink-0">
            <div className="text-right">
              <div className="text-[11px] text-amber-300 uppercase font-mono">Cutoff Deadline</div>
              <div className="text-xl font-black text-amber-100 font-mono">9:45:00 PM</div>
            </div>
          </div>
        </div>
      )}

      {/* Top Metrics Row */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        
        {/* Total Residents */}
        <div className="bg-[#0e1424] border border-slate-800 rounded-2xl p-4 sm:p-5 shadow-lg">
          <div className="flex items-center justify-between text-slate-400 mb-2">
            <span className="text-xs font-bold uppercase tracking-wider">Hostel Residents</span>
            <Users className="w-4 h-4 text-blue-400" />
          </div>
          <div className="text-2xl sm:text-3xl font-black text-white font-mono">
            {todayData?.stats?.totalStudents || 0}
          </div>
          <div className="text-[11px] text-slate-400 mt-1">Active registered students</div>
        </div>

        {/* Present Today */}
        <div className="bg-[#0e1424] border border-slate-800 rounded-2xl p-4 sm:p-5 shadow-lg">
          <div className="flex items-center justify-between text-emerald-400 mb-2">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-400">Present Tonight</span>
            <UserCheck className="w-4 h-4 text-emerald-400" />
          </div>
          <div className="text-2xl sm:text-3xl font-black text-emerald-400 font-mono">
            {todayData?.stats?.presentCount || 0}
          </div>
          <div className="text-[11px] text-emerald-400/80 mt-1 font-medium">
            {todayData?.stats?.attendanceRate || 0}% verified attendance
          </div>
        </div>

        {/* Pending / Defaulters */}
        <div className="bg-[#0e1424] border border-slate-800 rounded-2xl p-4 sm:p-5 shadow-lg">
          <div className="flex items-center justify-between text-amber-400 mb-2">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-400">Pending Attendance</span>
            <Clock className="w-4 h-4 text-amber-400" />
          </div>
          <div className="text-2xl sm:text-3xl font-black text-amber-400 font-mono">
            {todayData?.stats?.pendingCount || 0}
          </div>
          <div className="text-[11px] text-slate-400 mt-1">Yet to swipe card</div>
        </div>

        {/* Real-time Hardware Listener Status */}
        <div className="bg-[#0e1424] border border-slate-800 rounded-2xl p-4 sm:p-5 shadow-lg flex flex-col justify-between">
          <div className="flex items-center justify-between text-slate-400 mb-2">
            <span className="text-xs font-bold uppercase tracking-wider">RFID Reader</span>
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-ping"></span>
          </div>
          <div className="text-sm font-extrabold text-white flex items-center space-x-2">
            <Radio className="w-4 h-4 text-emerald-400" />
            <span>USB HID LISTENER ON</span>
          </div>
          <div className="text-[11px] text-slate-400 mt-1">Global keystroke capture active</div>
        </div>

      </div>

      {/* Center Quick Scan / Manual Input Bar for Guard */}
      <div className="bg-[#0e1424] border-2 border-slate-800 rounded-2xl p-4 sm:p-5 shadow-xl flex flex-col md:flex-row items-center justify-between gap-4">
        
        {/* Left: Keyboard shortcuts hint */}
        <div className="flex items-center space-x-3 text-xs text-slate-300">
          <div className="w-8 h-8 rounded-lg bg-blue-500/20 text-blue-400 flex items-center justify-center border border-blue-500/30 font-mono font-bold">
            ⌨️
          </div>
          <div>
            <div className="font-bold text-white">Guard Booth Keyboard Shortcuts:</div>
            <div className="text-slate-400 font-mono text-[11px]">
              Tap Card (Anytime) • <span className="text-emerald-400 font-bold">[Enter/Space]</span> Verify • <span className="text-slate-300">[Esc]</span> Dismiss
            </div>
          </div>
        </div>

        {/* Right: Manual RFID Search/Scan Form */}
        <form onSubmit={handleManualScanSubmit} className="flex items-center space-x-2 w-full md:w-auto">
          <div className="relative flex-1 md:w-64">
            <input
              type="text"
              placeholder="Or type RFID Tag (e.g. RFID-1001)..."
              value={manualRfidInput}
              onChange={(e) => setManualRfidInput(e.target.value)}
              className="w-full bg-slate-950 border border-slate-700 text-slate-100 rounded-xl px-3 py-2 text-xs font-mono focus:outline-none focus:border-blue-500 transition"
            />
          </div>
          <button
            type="submit"
            disabled={isProcessingManual || !manualRfidInput.trim()}
            className="bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold px-4 py-2 rounded-xl transition shadow disabled:opacity-50"
          >
            {isProcessingManual ? '...' : 'Scan'}
          </button>
        </form>

      </div>

      {/* Main Dual View: Defaulters List vs Recent Gate Activity */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* Left Column (7 cols): Defaulters / Buffer Watchlist */}
        <div className="lg:col-span-7">
          <DefaultersList
            defaulters={todayData?.defaulters || []}
            onQuickVerify={handleQuickVerifyDefaulter}
            isVerifyingId={isVerifyingDefaulterId}
            isBufferActive={isBufferActive}
          />
        </div>

        {/* Right Column (5 cols): Live Gate Logs & Scans */}
        <div className="lg:col-span-5">
          <RecentActivityFeed logs={recentLogs} />
        </div>

      </div>

      {/* Active Full Screen / Prominent Scan Modal */}
      {scanResult && (
        <ScanModal
          scanResult={scanResult}
          onVerify={onVerifyStudent}
          onDismiss={() => setScanResult(null)}
          isVerifying={isVerifying}
        />
      )}

    </div>
  );
}
