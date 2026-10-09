import React, { useState, useEffect } from 'react';
import { Calendar, UserCheck, UserX, Clock, ChevronRight } from 'lucide-react';
import { api } from '../../services/api';

export function AttendanceLogs() {
  const [sessions, setSessions] = useState([]);
  const [selectedSession, setSelectedSession] = useState(null);
  const [sessionRecords, setSessionRecords] = useState([]);
  const [isLoadingRecords, setIsLoadingRecords] = useState(false);

  useEffect(() => {
    loadSessions();
  }, []);

  const loadSessions = async () => {
    try {
      const data = await api.getAttendanceHistory();
      setSessions(data);
    } catch (e) {
      console.error('Failed to load sessions:', e);
    }
  };

  const handleSelectSession = async (session) => {
    try {
      setSelectedSession(session);
      setIsLoadingRecords(true);
      const records = await api.getSessionRecords(session.id);
      setSessionRecords(records);
    } catch (e) {
      console.error('Failed to load session records:', e);
    } finally {
      setIsLoadingRecords(false);
    }
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
      
      {/* Left: List of Sessions */}
      <div className="lg:col-span-5 bg-white border border-slate-200 rounded-3xl p-5 shadow-sm">
        <div className="flex items-center space-x-2 pb-3.5 border-b border-slate-200 mb-3 text-xs uppercase font-black text-slate-700">
          <Calendar className="w-4 h-4 text-blue-600" />
          <span>Attendance Sessions History</span>
        </div>

        {sessions.length === 0 ? (
          <div className="py-8 text-center text-slate-400 text-xs">No past attendance sessions found.</div>
        ) : (
          <div className="space-y-2 max-h-[500px] overflow-y-auto pr-1">
            {sessions.map((s) => {
              const isSelected = selectedSession?.id === s.id;
              return (
                <button
                  key={s.id}
                  onClick={() => handleSelectSession(s)}
                  className={`w-full p-3.5 rounded-2xl border text-left transition flex items-center justify-between ${
                    isSelected 
                      ? 'bg-blue-50 border-blue-400 text-slate-900 shadow-sm' 
                      : 'bg-slate-50 border-slate-200 hover:border-slate-300 text-slate-700'
                  }`}
                >
                  <div>
                    <div className="font-mono font-bold text-sm text-slate-900">{s.session_date}</div>
                    <div className="flex items-center space-x-2 text-[11px] text-slate-500 mt-1">
                      <span className="text-emerald-700 font-bold">{s.present_count || 0} Present</span>
                      <span>•</span>
                      <span className="text-rose-700 font-bold">{s.absent_count || 0} Absent</span>
                      <span>•</span>
                      <span className="uppercase text-[10px] bg-slate-200 px-1.5 rounded">{s.status}</span>
                    </div>
                  </div>
                  <ChevronRight className="w-4 h-4 text-slate-400" />
                </button>
              );
            })}
          </div>
        )}
      </div>

      {/* Right: Session Records View */}
      <div className="lg:col-span-7 bg-white border border-slate-200 rounded-3xl p-5 shadow-sm">
        <div className="flex items-center justify-between pb-3.5 border-b border-slate-200 mb-3">
          <div className="text-xs uppercase font-black text-slate-700 flex items-center space-x-2">
            <UserCheck className="w-4 h-4 text-emerald-600" />
            <span>
              {selectedSession ? `Resident Records for ${selectedSession.session_date}` : 'Select a date session'}
            </span>
          </div>
        </div>

        {!selectedSession ? (
          <div className="py-16 text-center text-slate-400 text-xs">
            Click on any date session on the left to inspect resident verification records.
          </div>
        ) : isLoadingRecords ? (
          <div className="py-16 text-center text-slate-400 text-xs">Loading records...</div>
        ) : (
          <div className="space-y-2.5 max-h-[500px] overflow-y-auto pr-1">
            {sessionRecords.map((r) => {
              const isPresent = r.status === 'PRESENT';
              return (
                <div
                  key={r.id}
                  className={`p-3 rounded-2xl border text-xs flex items-center justify-between ${
                    isPresent 
                      ? 'bg-slate-50 border-slate-200 text-slate-800' 
                      : 'bg-rose-50 border-rose-200 text-rose-900'
                  }`}
                >
                  <div className="flex items-center space-x-3">
                    <div className="w-10 h-10 rounded-xl bg-slate-900 border border-slate-200 shrink-0 flex items-center justify-center p-0.5 overflow-hidden">
                      <img
                        src={r.photo_url}
                        alt={r.full_name}
                        className="max-w-full max-h-full w-auto h-auto object-contain rounded-lg"
                        style={{ objectFit: 'contain', objectPosition: 'center' }}
                        onError={(e) => {
                          e.target.src = 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=600&q=80';
                        }}
                      />
                    </div>
                    <div>
                      <div className="font-bold text-slate-900">{r.full_name} <span className="text-amber-700 font-mono font-bold">[{r.room_number}]</span></div>
                      <div className="text-[11px] text-slate-500 font-mono">{r.reg_number} • {r.branch}</div>
                    </div>
                  </div>

                  <div className="text-right">
                    <span className={`px-2.5 py-0.5 rounded font-bold text-[10px] ${
                      isPresent ? 'bg-emerald-100 text-emerald-800 border border-emerald-200' : 'bg-rose-100 text-rose-800 border border-rose-200'
                    }`}>
                      {r.status}
                    </span>
                    <div className="text-[10px] text-slate-400 font-mono mt-0.5">
                      {r.verified_at ? new Date(r.verified_at).toLocaleTimeString() : 'Cutoff Absent'}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

    </div>
  );
}
