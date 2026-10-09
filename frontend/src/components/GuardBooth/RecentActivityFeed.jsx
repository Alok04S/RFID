import React from 'react';
import { History, CheckCircle, ShieldCheck, AlertOctagon } from 'lucide-react';
import { formatIstTime } from '../../utils/dateUtils';

export function RecentActivityFeed({ logs }) {
  return (
    <div className="bg-[#0f172a] border border-slate-800 rounded-2xl p-4 sm:p-5">
      <div className="flex items-center space-x-2 pb-3 border-b border-slate-800 mb-3">
        <History className="w-4 h-4 text-blue-400" />
        <h3 className="font-extrabold text-sm sm:text-base text-white">LIVE GATE & SCAN ACTIVITY</h3>
      </div>

      {logs.length === 0 ? (
        <div className="py-6 text-center text-slate-500 text-xs">
          No card scans recorded yet today.
        </div>
      ) : (
        <div className="space-y-2 max-h-[380px] overflow-y-auto pr-1">
          {logs.map((log) => {
            const isUnregistered = log.scan_type === 'UNREGISTERED';
            const isAttendance = log.scan_type === 'NIGHT_ATTENDANCE';

            return (
              <div
                key={log.id || Math.random()}
                className={`p-2.5 rounded-xl border text-xs flex items-center justify-between ${
                  isUnregistered 
                    ? 'bg-red-950/20 border-red-800/40 text-red-200' 
                    : isAttendance 
                      ? 'bg-emerald-950/20 border-emerald-800/40 text-emerald-200' 
                      : 'bg-slate-900/80 border-slate-800 text-slate-200'
                }`}
              >
                <div className="flex items-center space-x-2.5 min-w-0">
                  {isUnregistered ? (
                    <AlertOctagon className="w-4 h-4 text-red-400 shrink-0" />
                  ) : isAttendance ? (
                    <ShieldCheck className="w-4 h-4 text-emerald-400 shrink-0" />
                  ) : (
                    <CheckCircle className="w-4 h-4 text-blue-400 shrink-0" />
                  )}

                  <div className="min-w-0">
                    <div className="font-bold truncate">
                      {isUnregistered ? (
                        <span className="text-red-300 font-mono">Unregistered Card ({log.rfid_tag})</span>
                      ) : (
                        <span>{log.full_name} <span className="font-mono text-amber-300 font-extrabold">[{log.room_number}]</span></span>
                      )}
                    </div>
                    <div className="text-[10px] text-slate-400">
                      {isUnregistered ? 'Access Blocked' : `${log.scan_type.replace('_', ' ')} • ${log.reg_number || ''}`}
                    </div>
                  </div>
                </div>

                <div className="text-[11px] font-mono text-slate-400 shrink-0 ml-2">
                  {formatIstTime(log.timestamp)}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
