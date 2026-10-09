import React, { useState, useEffect, useCallback } from 'react';
import {
  DoorOpen,
  Search,
  Calendar,
  Clock,
  Radio,
  CheckCircle2,
  XCircle,
  ShieldAlert,
  RefreshCw,
  User,
  Filter
} from 'lucide-react';
import { api } from '../../services/api';
import { formatIstTime, formatIstDate } from '../../utils/dateUtils';

export function GateEntryHistory({
  activeAcademicYear,
  academicYears = [],
  latestScan
}) {
  const [logs, setLogs] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedYear, setSelectedYear] = useState(activeAcademicYear || 'ALL');
  const [statusFilter, setStatusFilter] = useState('ALL'); // 'ALL' | 'VERIFIED' | 'BLOCKED'
  const [isLoading, setIsLoading] = useState(false);

  const loadHistory = useCallback(async () => {
    try {
      setIsLoading(true);
      const yearParam = selectedYear && selectedYear !== 'ALL' ? `&academic_year=${selectedYear}` : '';
      const data = await api.getGateHistory(`limit=100${yearParam}`);
      setLogs(data || []);
    } catch (err) {
      console.error('Failed to load gate history:', err);
    } finally {
      setIsLoading(false);
    }
  }, [selectedYear]);

  useEffect(() => {
    loadHistory();
  }, [loadHistory]);

  // Refresh if a live scan arrives
  useEffect(() => {
    if (latestScan) {
      loadHistory();
    }
  }, [latestScan, loadHistory]);

  const filteredLogs = logs.filter((log) => {
    const q = searchQuery.toLowerCase();
    const matchesSearch = (
      log.full_name?.toLowerCase().includes(q) ||
      log.reg_number?.toLowerCase().includes(q) ||
      log.room_number?.toLowerCase().includes(q) ||
      log.rfid_tag?.toLowerCase().includes(q)
    );

    const isBlocked = log.scan_type === 'BLOCKED_CARD' || log.scan_type === 'UNREGISTERED';
    const matchesStatus = (
      statusFilter === 'ALL' ||
      (statusFilter === 'VERIFIED' && !isBlocked) ||
      (statusFilter === 'BLOCKED' && isBlocked)
    );

    return matchesSearch && matchesStatus;
  });

  const verifiedCount = logs.filter(l => l.scan_type === 'GATE_ENTRY' || l.verified_by_guard).length;
  const blockedCount = logs.filter(l => l.scan_type === 'BLOCKED_CARD' || l.scan_type === 'UNREGISTERED').length;

  return (
    <div className="space-y-4">
      {/* Top Banner / Metrics */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        <div className="bg-white border border-slate-200 rounded-2xl p-4 shadow-xs">
          <div className="flex items-center justify-between text-slate-500 mb-1">
            <span className="text-xs font-bold uppercase tracking-wider">Total Gate Entries</span>
            <DoorOpen className="w-4 h-4 text-blue-600" />
          </div>
          <div className="text-2xl font-black text-slate-900">{logs.length}</div>
          <div className="text-[11px] text-slate-500 mt-1">Logged gate scans</div>
        </div>

        <div className="bg-white border border-slate-200 rounded-2xl p-4 shadow-xs">
          <div className="flex items-center justify-between text-slate-500 mb-1">
            <span className="text-xs font-bold uppercase tracking-wider">Verified Entries</span>
            <CheckCircle2 className="w-4 h-4 text-emerald-600" />
          </div>
          <div className="text-2xl font-black text-emerald-700">{verifiedCount}</div>
          <div className="text-[11px] text-slate-500 mt-1">Authorized resident taps</div>
        </div>

        <div className="bg-white border border-slate-200 rounded-2xl p-4 shadow-xs">
          <div className="flex items-center justify-between text-slate-500 mb-1">
            <span className="text-xs font-bold uppercase tracking-wider">Blocked / Invalid</span>
            <ShieldAlert className="w-4 h-4 text-rose-600" />
          </div>
          <div className="text-2xl font-black text-rose-700">{blockedCount}</div>
          <div className="text-[11px] text-slate-500 mt-1">Deactivated or lost cards</div>
        </div>
      </div>

      {/* Filter & Search Bar */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 bg-white border border-slate-200 rounded-2xl p-4 shadow-xs">
        <div className="flex flex-1 items-center gap-2">
          {/* Search Input */}
          <div className="flex items-center space-x-2 flex-1 bg-slate-50 border border-slate-200 rounded-xl px-3 py-2">
            <Search className="w-4 h-4 text-slate-400" />
            <input
              type="text"
              placeholder="Search history by Student Name, Roll No, Room, or RFID UID..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="bg-transparent text-xs text-slate-800 focus:outline-none w-full placeholder-slate-400"
            />
          </div>

          {/* Academic Batch Filter */}
          <div className="flex items-center gap-1.5 bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 shrink-0">
            <Calendar className="w-3.5 h-3.5 text-blue-600" />
            <select
              value={selectedYear}
              onChange={(e) => setSelectedYear(e.target.value)}
              className="bg-transparent text-xs text-slate-700 font-bold focus:outline-none"
            >
              <option value="ALL">All Batches</option>
              {academicYears.map((ay) => (
                <option key={ay.year_name} value={ay.year_name}>
                  {ay.year_name}
                </option>
              ))}
            </select>
          </div>

          {/* Status Filter */}
          <div className="flex items-center gap-1.5 bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 shrink-0">
            <Filter className="w-3.5 h-3.5 text-slate-500" />
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="bg-transparent text-xs text-slate-700 font-bold focus:outline-none"
            >
              <option value="ALL">All Status</option>
              <option value="VERIFIED">Verified Only</option>
              <option value="BLOCKED">Blocked Only</option>
            </select>
          </div>
        </div>

        {/* Refresh Button */}
        <button
          onClick={loadHistory}
          disabled={isLoading}
          className="flex items-center justify-center gap-1.5 px-3 py-2 rounded-xl text-xs font-bold text-slate-700 bg-slate-50 hover:bg-slate-100 border border-slate-200 transition-colors shrink-0"
          title="Refresh History"
        >
          <RefreshCw className={`w-3.5 h-3.5 text-slate-500 ${isLoading ? 'animate-spin' : ''}`} />
          <span className="hidden sm:inline">Refresh</span>
        </button>
      </div>

      {/* Gate Entry History Table */}
      <div className="bg-white border border-slate-200 rounded-2xl overflow-hidden shadow-xs">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-slate-700">
            <thead className="bg-slate-50 text-slate-500 uppercase font-mono text-[11px] border-b border-slate-200">
              <tr>
                <th className="px-4 py-3">Timestamp</th>
                <th className="px-4 py-3">Student Resident</th>
                <th className="px-4 py-3">Room</th>
                <th className="px-4 py-3">RFID Card UID</th>
                <th className="px-4 py-3">Gate Action</th>
                <th className="px-4 py-3 text-right">Verification Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 font-medium">
              {filteredLogs.length === 0 ? (
                <tr>
                  <td colSpan={6} className="text-center py-10 text-slate-400">
                    No gate entry records found matching criteria.
                  </td>
                </tr>
              ) : (
                filteredLogs.map((log) => {
                  const isBlocked = log.scan_type === 'BLOCKED_CARD' || log.scan_type === 'UNREGISTERED';
                  const dateStr = log.timestamp ? formatIstDate(log.timestamp) : '';
                  const timeStr = log.timestamp ? formatIstTime(log.timestamp) : '';

                  return (
                    <tr key={log.id} className="hover:bg-slate-50 transition-colors">
                      {/* Timestamp */}
                      <td className="px-4 py-3 whitespace-nowrap">
                        <div className="flex items-center gap-1.5 text-slate-900 font-bold">
                          <Clock className="w-3.5 h-3.5 text-slate-400" />
                          <span>{timeStr}</span>
                        </div>
                        <div className="text-[10px] text-slate-500 ml-5 font-mono">{dateStr}</div>
                      </td>

                      {/* Student Info */}
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2.5">
                          {log.photo_url ? (
                            <img
                              src={log.photo_url}
                              alt={log.full_name || 'Resident'}
                              className="w-8 h-8 rounded-full object-cover object-center border border-slate-200 shrink-0"
                              style={{ objectPosition: 'center' }}
                              onError={(e) => {
                                e.target.src = 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=600&q=80';
                              }}
                            />
                          ) : (
                            <div className="w-8 h-8 rounded-full bg-slate-100 text-slate-500 flex items-center justify-center shrink-0">
                              <User className="w-4 h-4" />
                            </div>
                          )}
                          <div>
                            <div className="font-bold text-slate-900">
                              {log.full_name || log.notes || 'Unregistered Card'}
                            </div>
                            <div className="text-[10px] text-slate-500 font-mono">
                              {log.reg_number || 'N/A'} • {log.branch || 'Resident'}
                            </div>
                          </div>
                        </div>
                      </td>

                      {/* Room Number */}
                      <td className="px-4 py-3">
                        {log.room_number ? (
                          <span className="font-bold text-blue-700 bg-blue-50 border border-blue-200 px-2 py-0.5 rounded text-[11px]">
                            {log.room_number}
                          </span>
                        ) : (
                          <span className="text-slate-400 text-[11px]">—</span>
                        )}
                      </td>

                      {/* RFID Tag */}
                      <td className="px-4 py-3 font-mono text-[11px] text-slate-800 font-bold">
                        {log.rfid_tag}
                      </td>

                      {/* Gate Action */}
                      <td className="px-4 py-3">
                        <span className="inline-flex items-center gap-1 text-[10px] px-2 py-0.5 rounded-full font-bold uppercase bg-blue-50 text-blue-700 border border-blue-200">
                          <DoorOpen className="w-3 h-3 text-blue-600" /> Gate Entry
                        </span>
                      </td>

                      {/* Status */}
                      <td className="px-4 py-3 text-right">
                        {!isBlocked ? (
                          <span className="inline-flex items-center gap-1 text-[10px] px-2.5 py-0.5 rounded-full font-bold uppercase bg-emerald-50 text-emerald-700 border border-emerald-200">
                            <CheckCircle2 className="w-3 h-3 text-emerald-600" /> Access Granted
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 text-[10px] px-2.5 py-0.5 rounded-full font-bold uppercase bg-rose-50 text-rose-700 border border-rose-200">
                            <XCircle className="w-3 h-3 text-rose-600" /> Access Blocked
                          </span>
                        )}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
