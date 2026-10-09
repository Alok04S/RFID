import React, { useState, useEffect, useRef } from 'react';
import {
  DoorOpen,
  DoorClosed,
  ArrowRightLeft,
  Search,
  Radio,
  Clock,
  User,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  Smartphone,
  Laptop,
  Building,
  RefreshCw,
  Sliders,
  Sparkles,
  Phone,
  Mail,
  CreditCard,
  ShieldCheck,
  Calendar
} from 'lucide-react';
import { api } from '../../services/api';
import { formatAcademicYear } from '../../utils/academicYearUtils';
import { formatHostelDisplayName } from '../../utils/hostelUtils';
import { audioService } from '../../services/audioService';
import { formatIstTime } from '../../utils/dateUtils';

export function GateInOutSystem({
  currentUser,
  activeAcademicYear,
  effectiveTime,
  currentMode,
  latestScan,
  onSimulateScan
}) {
  // Movement Direction: 'AUTO' | 'IN' | 'OUT'
  const [selectedDirection, setSelectedDirection] = useState('AUTO');

  // Search / Manual Entry query
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [isSearching, setIsSearching] = useState(false);

  // Live Presence Headcount
  const [presenceStats, setPresenceStats] = useState({
    totalStudents: 0,
    insideCount: 0,
    outsideCount: 0,
    todayInScans: 0,
    todayOutScans: 0
  });

  // Recent Gate Logs
  const [recentLogs, setRecentLogs] = useState([]);
  const [isLoadingLogs, setIsLoadingLogs] = useState(false);

  // Active Scan Card details
  const [activeScan, setActiveScan] = useState(null);
  const [countdown, setCountdown] = useState(5);
  const timerRef = useRef(null);

  // Quick notes tag (optional pass/reason)
  const [notes, setNotes] = useState('');

  // Device type detection (can also be toggled)
  const [deviceType, setDeviceType] = useState(() => {
    return window.innerWidth < 768 ? 'MOBILE' : 'DESKTOP';
  });

  // Load Presence Stats & Recent Logs
  const loadGateData = async () => {
    try {
      setIsLoadingLogs(true);
      const [statsRes, logsRes] = await Promise.all([
        api.getPresenceStats(activeAcademicYear),
        api.getGateHistory(`limit=25&academic_year=${activeAcademicYear || ''}`)
      ]);
      setPresenceStats(statsRes);
      setRecentLogs(logsRes || []);
    } catch (err) {
      console.error('Failed to load gate data:', err);
    } finally {
      setIsLoadingLogs(false);
    }
  };

  useEffect(() => {
    loadGateData();
  }, [activeAcademicYear]);

  // Sync with incoming WebSocket scan events
  useEffect(() => {
    if (latestScan) {
      setActiveScan(latestScan);
      loadGateData();

      // Countdown auto-dismiss after 6 seconds
      if (timerRef.current) clearInterval(timerRef.current);
      setCountdown(6);
      timerRef.current = setInterval(() => {
        setCountdown((prev) => {
          if (prev <= 1) {
            clearInterval(timerRef.current);
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    }
  }, [latestScan]);

  // Execute manual scan or quick card click
  const handlePerformScan = async (rfidTag, directionOverride = null) => {
    try {
      const dir = directionOverride || selectedDirection;
      const payload = {
        rfid_tag: rfidTag,
        direction: dir,
        guard_name: currentUser?.name || 'Security Guard',
        device_type: deviceType,
        notes: notes || undefined
      };

      const res = await api.scanGate(payload);
      setActiveScan(res);

      if (res.audio === 'SUCCESS' || res.audio === 'SCAN_SUCCESS') {
        audioService.playSuccess();
      } else {
        audioService.playError();
      }

      setSearchQuery('');
      setSearchResults([]);
      setNotes('');
      loadGateData();
    } catch (err) {
      audioService.playError();
      setActiveScan({
        success: false,
        status: 'UNREGISTERED',
        rfid_tag: rfidTag,
        message: err.message || 'RFID Scan Error'
      });
    }
  };

  // Search students for manual gate entry/exit fallback
  useEffect(() => {
    if (!searchQuery.trim()) {
      setSearchResults([]);
      return;
    }

    const timer = setTimeout(async () => {
      try {
        setIsSearching(true);
        const results = await api.getStudents(activeAcademicYear, searchQuery.trim());
        setSearchResults(results.slice(0, 5));
      } catch (err) {
        console.error('Search error:', err);
      } finally {
        setIsSearching(false);
      }
    }, 250);

    return () => clearTimeout(timer);
  }, [searchQuery, activeAcademicYear]);

  const formattedTime = effectiveTime
    ? new Date(effectiveTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: true })
    : '--:--:--';

  return (
    <div className="space-y-5">
      {/* Top Banner: Presence Stats & Device Sync Status */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-3.5 flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-blue-500/10 border border-blue-500/20 flex items-center justify-center text-blue-400 shrink-0">
            <Building className="w-5 h-5" />
          </div>
          <div>
            <div className="text-[11px] text-slate-400 font-medium">Inside Hostel</div>
            <div className="text-xl font-bold text-white flex items-center gap-1.5">
              {presenceStats.insideCount}
              <span className="text-xs font-normal text-slate-400">/ {presenceStats.totalStudents}</span>
            </div>
          </div>
        </div>

        <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-3.5 flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-400 shrink-0">
            <DoorOpen className="w-5 h-5" />
          </div>
          <div>
            <div className="text-[11px] text-slate-400 font-medium">Outside Campus</div>
            <div className="text-xl font-bold text-amber-300">
              {presenceStats.outsideCount}
            </div>
          </div>
        </div>

        <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-3.5 flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400 shrink-0">
            <DoorClosed className="w-5 h-5" />
          </div>
          <div>
            <div className="text-[11px] text-slate-400 font-medium">Today Entries (IN)</div>
            <div className="text-xl font-bold text-emerald-400">
              {presenceStats.todayInScans}
            </div>
          </div>
        </div>

        <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-3.5 flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-rose-500/10 border border-rose-500/20 flex items-center justify-center text-rose-400 shrink-0">
            <ArrowRightLeft className="w-5 h-5" />
          </div>
          <div>
            <div className="text-[11px] text-slate-400 font-medium">Today Exits (OUT)</div>
            <div className="text-xl font-bold text-rose-400">
              {presenceStats.todayOutScans}
            </div>
          </div>
        </div>
      </div>

      {/* Main Operating Panel */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
        {/* Left Column: Scanner, Direction Selector & Active Scan Card (7 cols) */}
        <div className="lg:col-span-7 space-y-4">
          {/* Movement Direction Toggle Bar */}
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-3 sm:p-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-3">
              <div>
                <h2 className="text-sm font-bold text-white flex items-center gap-2">
                  <Radio className="w-4 h-4 text-sky-400 animate-pulse" />
                  <span>Gate Movement Mode</span>
                </h2>
                <p className="text-[11px] text-slate-400">
                  Select movement direction or let system auto-detect based on student state
                </p>
              </div>

              {/* Device Selector indicator */}
              <div className="flex items-center gap-1 bg-slate-950 p-1 rounded-xl border border-slate-800 text-xs">
                <button
                  onClick={() => setDeviceType('DESKTOP')}
                  className={`flex items-center gap-1 px-2 py-1 rounded-lg transition-colors ${
                    deviceType === 'DESKTOP' ? 'bg-sky-600 text-white font-medium' : 'text-slate-400 hover:text-white'
                  }`}
                  title="Desktop View"
                >
                  <Laptop className="w-3.5 h-3.5" />
                  <span className="text-[10px]">PC</span>
                </button>
                <button
                  onClick={() => setDeviceType('MOBILE')}
                  className={`flex items-center gap-1 px-2 py-1 rounded-lg transition-colors ${
                    deviceType === 'MOBILE' ? 'bg-sky-600 text-white font-medium' : 'text-slate-400 hover:text-white'
                  }`}
                  title="Mobile View"
                >
                  <Smartphone className="w-3.5 h-3.5" />
                  <span className="text-[10px]">Mobile</span>
                </button>
              </div>
            </div>

            {/* Three Big Direction Buttons */}
            <div className="grid grid-cols-3 gap-2">
              <button
                onClick={() => setSelectedDirection('AUTO')}
                className={`py-3 px-2 rounded-xl text-xs font-bold transition-all flex flex-col items-center justify-center gap-1 border ${
                  selectedDirection === 'AUTO'
                    ? 'bg-sky-600 text-white border-sky-400 shadow-lg shadow-sky-600/30'
                    : 'bg-slate-950 text-slate-300 border-slate-800 hover:bg-slate-800'
                }`}
              >
                <ArrowRightLeft className="w-4 h-4" />
                <span>AUTO-TOGGLE</span>
                <span className="text-[9px] font-normal opacity-80">Smart In / Out</span>
              </button>

              <button
                onClick={() => setSelectedDirection('IN')}
                className={`py-3 px-2 rounded-xl text-xs font-bold transition-all flex flex-col items-center justify-center gap-1 border ${
                  selectedDirection === 'IN'
                    ? 'bg-emerald-600 text-white border-emerald-400 shadow-lg shadow-emerald-600/30'
                    : 'bg-slate-950 text-emerald-400 border-slate-800 hover:bg-emerald-950/30'
                }`}
              >
                <DoorClosed className="w-4 h-4" />
                <span>GATE IN (ENTRY)</span>
                <span className="text-[9px] font-normal opacity-80">Entering Hostel</span>
              </button>

              <button
                onClick={() => setSelectedDirection('OUT')}
                className={`py-3 px-2 rounded-xl text-xs font-bold transition-all flex flex-col items-center justify-center gap-1 border ${
                  selectedDirection === 'OUT'
                    ? 'bg-amber-600 text-white border-amber-400 shadow-lg shadow-amber-600/30'
                    : 'bg-slate-950 text-amber-400 border-slate-800 hover:bg-amber-950/30'
                }`}
              >
                <DoorOpen className="w-4 h-4" />
                <span>GATE OUT (EXIT)</span>
                <span className="text-[9px] font-normal opacity-80">Leaving Campus</span>
              </button>
            </div>

            {/* Quick Notes Input (Optional for Late Return / Leave / Pass) */}
            <div className="mt-3 pt-3 border-t border-slate-800/80 flex items-center gap-2">
              <span className="text-[11px] text-slate-400 shrink-0">Pass Note:</span>
              <input
                type="text"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Optional remark (e.g. Market Pass, Medical, Library)"
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-1.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-sky-500"
              />
            </div>
          </div>

          {/* Quick Manual Search & Tap Fallback for Guards */}
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-3 sm:p-4">
            <div className="relative">
              <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Tap to search resident by Name, Roll No, Room, or RFID..."
                className="w-full bg-slate-950 border border-slate-800 rounded-xl pl-10 pr-4 py-2.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-sky-500"
              />
              {isSearching && (
                <RefreshCw className="absolute right-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-sky-400 animate-spin" />
              )}
            </div>

            {/* Dropdown search results */}
            {searchResults.length > 0 && (
              <div className="mt-2 divide-y divide-slate-800 bg-slate-950 rounded-xl border border-slate-800 overflow-hidden">
                {searchResults.map((s) => (
                  <div
                    key={s.id}
                    className="p-2.5 flex items-center justify-between hover:bg-slate-900 transition-colors"
                  >
                    <div className="flex items-center gap-2.5">
                      <img
                        src={s.photo_url}
                        alt={s.full_name}
                        className="w-8 h-8 rounded-full object-cover border border-slate-700"
                      />
                      <div>
                        <div className="text-xs font-semibold text-white">{s.full_name}</div>
                        <div className="text-[10px] text-slate-400">
                          Room {s.room_number} • {s.reg_number} • Currently {s.current_status || 'INSIDE'}
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <button
                        onClick={() => handlePerformScan(s.rfid_tag, 'IN')}
                        className="px-2.5 py-1 rounded-lg text-[11px] font-semibold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 hover:bg-emerald-500/30 transition-colors"
                      >
                        Check IN
                      </button>
                      <button
                        onClick={() => handlePerformScan(s.rfid_tag, 'OUT')}
                        className="px-2.5 py-1 rounded-lg text-[11px] font-semibold bg-amber-500/20 text-amber-300 border border-amber-500/30 hover:bg-amber-500/30 transition-colors"
                      >
                        Check OUT
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* ACTIVE SCAN VERIFICATION CARD (High Impact Real-Time Feedback) */}
          {activeScan ? (
            <div
              className={`rounded-2xl border p-4 sm:p-5 transition-all shadow-xl ${
                activeScan.status === 'UNREGISTERED'
                  ? 'bg-rose-950/40 border-rose-500/50 shadow-rose-950/40'
                  : activeScan.direction === 'IN'
                  ? 'bg-emerald-950/30 border-emerald-500/40 shadow-emerald-950/30'
                  : 'bg-amber-950/30 border-amber-500/40 shadow-amber-950/30'
              }`}
            >
              <div className="flex items-start justify-between gap-3 mb-4">
                <div className="flex items-center gap-2.5">
                  <div
                    className={`w-9 h-9 rounded-xl flex items-center justify-center font-bold text-white shadow ${
                      activeScan.status === 'UNREGISTERED'
                        ? 'bg-rose-600'
                        : activeScan.direction === 'IN'
                        ? 'bg-emerald-600'
                        : 'bg-amber-600'
                    }`}
                  >
                    {activeScan.status === 'UNREGISTERED' ? (
                      <XCircle className="w-5 h-5" />
                    ) : activeScan.direction === 'IN' ? (
                      <DoorClosed className="w-5 h-5" />
                    ) : (
                      <DoorOpen className="w-5 h-5" />
                    )}
                  </div>
                  <div>
                    <span
                      className={`text-[10px] font-bold px-2 py-0.5 rounded-full border uppercase ${
                        activeScan.status === 'UNREGISTERED'
                          ? 'bg-rose-500/20 text-rose-300 border-rose-500/40'
                          : activeScan.direction === 'IN'
                          ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40'
                          : 'bg-amber-500/20 text-amber-300 border-amber-500/40'
                      }`}
                    >
                      {activeScan.status === 'UNREGISTERED'
                        ? 'SECURITY ALERT'
                        : `GATE ${activeScan.direction} CONFIRMED`}
                    </span>
                    <div className="text-sm font-bold text-white mt-0.5">
                      {activeScan.message}
                    </div>
                  </div>
                </div>

                {countdown > 0 && (
                  <span className="text-[10px] font-mono text-slate-400 bg-slate-900/80 px-2 py-1 rounded-lg border border-slate-800">
                    Reset in {countdown}s
                  </span>
                )}
              </div>

              {activeScan.student ? (
                <div className="flex flex-col sm:flex-row gap-4 bg-slate-950/70 p-4 rounded-xl border border-slate-800/80">
                  <div className="w-24 h-24 sm:w-28 sm:h-28 rounded-xl bg-slate-900 border-2 border-slate-700 shadow-md shrink-0 mx-auto sm:mx-0 flex items-center justify-center p-1 overflow-hidden">
                    <img
                      src={activeScan.student.photo_url}
                      alt={activeScan.student.full_name}
                      className="max-w-full max-h-full w-auto h-auto object-contain rounded-lg"
                      style={{ objectFit: 'contain', objectPosition: 'center' }}
                    />
                  </div>
                  <div className="flex-1 space-y-2">
                    <div>
                      <h3 className="text-base font-bold text-white">
                        {activeScan.student.full_name}
                      </h3>
                      <p className="text-xs text-slate-400">
                        {formatHostelDisplayName(activeScan.student.hostel_name, activeScan.student.room_number)} Room: <span className="text-sky-300 font-semibold">{activeScan.student.room_number}</span> • {activeScan.student.branch} ({formatAcademicYear(activeScan.student.year || activeScan.student.academic_year, { includeCode: true })})
                      </p>
                    </div>

                    <div className="grid grid-cols-2 gap-2 text-[11px] pt-1 border-t border-slate-800">
                      <div>
                        <span className="text-slate-400">Registration:</span>
                        <div className="font-mono text-slate-200">{activeScan.student.reg_number}</div>
                      </div>
                      <div>
                        <span className="text-slate-400">Current Location:</span>
                        <div className={`font-bold ${activeScan.student.current_status === 'INSIDE' ? 'text-emerald-400' : 'text-amber-400'}`}>
                          {activeScan.student.current_status === 'INSIDE' ? 'INSIDE HOSTEL' : 'OUTSIDE CAMPUS'}
                        </div>
                      </div>
                      <div>
                        <span className="text-slate-400">Contact:</span>
                        <div className="text-slate-200">{activeScan.student.contact_number}</div>
                      </div>
                      <div>
                        <span className="text-slate-400">Guardian Contact:</span>
                        <div className="text-slate-200">{activeScan.student.parent_contact_number}</div>
                      </div>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="p-3 bg-rose-950/60 rounded-xl border border-rose-900 text-xs text-rose-200">
                  Card UID: <span className="font-mono font-bold text-white">{activeScan.rfid_tag}</span> is not registered in the system. Gate barrier remains locked.
                </div>
              )}
            </div>
          ) : (
            <div className="rounded-2xl border border-slate-800/80 bg-slate-900/40 p-8 text-center flex flex-col items-center justify-center">
              <div className="w-12 h-12 rounded-2xl bg-sky-500/10 border border-sky-500/20 flex items-center justify-center text-sky-400 mb-3 animate-pulse">
                <Radio className="w-6 h-6" />
              </div>
              <h3 className="text-sm font-bold text-white">Awaiting RFID Card Tap</h3>
              <p className="text-xs text-slate-400 max-w-sm mt-1">
                Tap physical RFID card on USB/NFC reader, scan barcode, or search resident above.
              </p>
            </div>
          )}
        </div>

        {/* Right Column: Live Synchronized Movement Activity Feed (5 cols) */}
        <div className="lg:col-span-5 bg-slate-900 border border-slate-800 rounded-2xl p-4 flex flex-col">
          <div className="flex items-center justify-between pb-3 border-b border-slate-800">
            <div>
              <h3 className="text-xs font-bold text-white flex items-center gap-2">
                <ArrowRightLeft className="w-4 h-4 text-sky-400" />
                <span>Live Gate Feed (PC & Mobile Synced)</span>
              </h3>
              <p className="text-[10px] text-slate-400">Real-time dual-device updates</p>
            </div>
            <button
              onClick={loadGateData}
              className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white text-xs transition-colors"
              title="Refresh Activity Feed"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${isLoadingLogs ? 'animate-spin' : ''}`} />
            </button>
          </div>

          {/* Activity List */}
          <div className="flex-1 overflow-y-auto mt-3 space-y-2 max-h-[460px] pr-1 scrollbar-thin">
            {recentLogs.length > 0 ? (
              recentLogs.map((log) => {
                const isEntry = log.direction === 'IN' || log.scan_type === 'DAY_ENTRY';
                const logTime = log.timestamp
                  ? formatIstTime(log.timestamp)
                  : '--:--';

                return (
                  <div
                    key={log.id}
                    className="p-2.5 rounded-xl bg-slate-950/80 border border-slate-800/80 flex items-center justify-between hover:bg-slate-950 transition-colors"
                  >
                    <div className="flex items-center gap-2.5 min-w-0">
                      <div
                        className={`w-7 h-7 rounded-lg flex items-center justify-center shrink-0 text-xs font-bold ${
                          isEntry
                            ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                            : 'bg-amber-500/20 text-amber-400 border border-amber-500/30'
                        }`}
                      >
                        {isEntry ? 'IN' : 'OUT'}
                      </div>
                      <div className="min-w-0">
                        <div className="text-xs font-semibold text-white truncate">
                          {log.full_name || 'Unregistered Card'}
                        </div>
                        <div className="text-[10px] text-slate-400 truncate">
                          {log.room_number ? `Room ${log.room_number}` : log.rfid_tag} • {log.guard_name || 'Guard'} ({log.device_type || 'PC'})
                        </div>
                      </div>
                    </div>
                    <div className="text-right shrink-0">
                      <span className="text-[10px] font-mono text-slate-400">{logTime}</span>
                      {log.notes && (
                        <div className="text-[9px] text-sky-400 truncate max-w-[80px]">
                          {log.notes}
                        </div>
                      )}
                    </div>
                  </div>
                );
              })
            ) : (
              <div className="py-12 text-center text-xs text-slate-500">
                No gate movements recorded yet today.
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
