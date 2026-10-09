import React, { useState, useEffect } from 'react';
import {
  History,
  Search,
  RefreshCw
} from 'lucide-react';
import { api } from '../../services/api';
import { formatIstDateTime } from '../../utils/dateUtils';

export function AuditLogsViewer() {
  const [logs, setLogs] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedRole, setSelectedRole] = useState('ALL');
  const [selectedAction, setSelectedAction] = useState('ALL');

  const fetchLogs = async () => {
    try {
      setIsLoading(true);
      const params = new URLSearchParams();
      if (selectedRole !== 'ALL') params.append('role', selectedRole);
      if (selectedAction !== 'ALL') params.append('action', selectedAction);
      if (searchQuery.trim()) params.append('search', searchQuery.trim());

      const data = await api.getSystemAuditLogs(params.toString());
      setLogs(data || []);
    } catch (err) {
      console.error('Failed to fetch audit logs:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchLogs();
  }, [selectedRole, selectedAction]);

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    fetchLogs();
  };

  const getActionBadge = (action) => {
    if (action.includes('LOGIN')) {
      return { label: 'User Login', bg: 'bg-emerald-100 text-emerald-800 border-emerald-200' };
    }
    if (action.includes('WAIVE')) {
      return { label: 'Penalty Waived', bg: 'bg-indigo-100 text-indigo-800 border-indigo-200' };
    }
    if (action.includes('BULK_IMPORT') || action.includes('STUDENT')) {
      return { label: 'Student Update', bg: 'bg-blue-100 text-blue-800 border-blue-200' };
    }
    if (action.includes('ACADEMIC_YEAR')) {
      return { label: 'Session Batch', bg: 'bg-purple-100 text-purple-800 border-purple-200' };
    }
    if (action.includes('GATE') || action.includes('RFID')) {
      return { label: 'Gate Movement', bg: 'bg-amber-100 text-amber-800 border-amber-200' };
    }
    return { label: action, bg: 'bg-slate-100 text-slate-700 border-slate-200' };
  };

  return (
    <div className="space-y-5">
      {/* Header Banner */}
      <div className="bg-white border border-slate-200 rounded-2xl p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4 shadow-xs">
        <div>
          <div className="flex items-center gap-2">
            <span className="p-1.5 rounded-lg bg-blue-50 border border-blue-200 text-blue-700">
              <History className="w-5 h-5" />
            </span>
            <h1 className="text-lg font-bold text-slate-900">Activity & Audit Logs</h1>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            Immutable log of all platform activities: Staff logins, penalty waivers, student imports, and system adjustments.
          </p>
        </div>

        <button
          onClick={fetchLogs}
          disabled={isLoading}
          className="flex items-center gap-2 px-3.5 py-2 rounded-xl bg-slate-50 hover:bg-slate-100 text-slate-700 border border-slate-200 text-xs font-bold transition-colors shrink-0"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? 'animate-spin' : ''}`} />
          <span>Refresh Logs</span>
        </button>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-white border border-slate-200 rounded-2xl p-4 flex flex-col md:flex-row items-stretch md:items-center gap-3 shadow-xs">
        <form onSubmit={handleSearchSubmit} className="flex-1 relative">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search audit trail by performer name, student, or keyword..."
            className="w-full bg-slate-50 border border-slate-200 rounded-xl pl-10 pr-4 py-2 text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:border-blue-500"
          />
        </form>

        <div className="flex items-center gap-2">
          <span className="text-xs text-slate-500 shrink-0">Role:</span>
          <select
            value={selectedRole}
            onChange={(e) => setSelectedRole(e.target.value)}
            className="bg-slate-50 border border-slate-200 text-xs text-slate-800 rounded-xl px-3 py-2 focus:outline-none font-medium"
          >
            <option value="ALL">All Roles</option>
            <option value="ADMIN">Admin</option>
            <option value="WARDEN">Warden</option>
            <option value="GUARD">Guard</option>
            <option value="SYSTEM">System Automations</option>
          </select>
        </div>

        <div className="flex items-center gap-2">
          <span className="text-xs text-slate-500 shrink-0">Action:</span>
          <select
            value={selectedAction}
            onChange={(e) => setSelectedAction(e.target.value)}
            className="bg-slate-50 border border-slate-200 text-xs text-slate-800 rounded-xl px-3 py-2 focus:outline-none font-medium"
          >
            <option value="ALL">All Event Types</option>
            <option value="USER_LOGIN">User Logins</option>
            <option value="PENALTY_WAIVED">Penalty Waivers</option>
            <option value="STUDENTS_BULK_IMPORTED">Master CSV Imports</option>
            <option value="ACADEMIC_YEAR_ACTIVATED">Academic Batch Changes</option>
            <option value="SYSTEM_SETTINGS_UPDATED">System Settings Changed</option>
          </select>
        </div>
      </div>

      {/* Audit Log Table */}
      <div className="bg-white border border-slate-200 rounded-2xl overflow-hidden shadow-xs">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-slate-700">
            <thead className="bg-slate-50 text-slate-500 text-[10px] uppercase font-mono border-b border-slate-200">
              <tr>
                <th className="py-3 px-4">Timestamp</th>
                <th className="py-3 px-4">Action Type</th>
                <th className="py-3 px-4">Staff Member</th>
                <th className="py-3 px-4">Role & Device</th>
                <th className="py-3 px-4">Details & Justification</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 font-medium">
              {logs.length > 0 ? (
                logs.map((log) => {
                  const badge = getActionBadge(log.action);
                  const logTime = log.timestamp
                    ? formatIstDateTime(log.timestamp)
                    : '--';

                  return (
                    <tr key={log.id} className="hover:bg-slate-50/80 transition-colors">
                      <td className="py-3 px-4 whitespace-nowrap text-slate-500 font-mono text-[11px]">
                        {logTime}
                      </td>
                      <td className="py-3 px-4 whitespace-nowrap">
                        <span className={`text-[10px] font-bold px-2 py-0.5 rounded-md border ${badge.bg}`}>
                          {badge.label}
                        </span>
                      </td>
                      <td className="py-3 px-4 whitespace-nowrap">
                        <div className="font-bold text-slate-900">{log.performed_by || 'System'}</div>
                        {log.ip_address && (
                          <div className="text-[10px] text-slate-400 font-mono">
                            {log.ip_address}
                          </div>
                        )}
                      </td>
                      <td className="py-3 px-4 whitespace-nowrap">
                        <span className="text-[10px] px-1.5 py-0.5 rounded bg-slate-100 text-slate-700 font-bold uppercase border border-slate-200">
                          {log.role || 'STAFF'}
                        </span>
                        {log.device_info && (
                          <div className="text-[10px] text-slate-500 mt-0.5">
                            {log.device_info}
                          </div>
                        )}
                      </td>
                      <td className="py-3 px-4 text-slate-700 max-w-md">
                        {log.details}
                      </td>
                    </tr>
                  );
                })
              ) : (
                <tr>
                  <td colSpan={5} className="py-12 text-center text-xs text-slate-400">
                    No activity logs found.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
