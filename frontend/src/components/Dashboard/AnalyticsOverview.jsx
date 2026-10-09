import React from 'react';
import {
  Users,
  DoorOpen,
  Radio,
  Calendar,
  ArrowRight,
  ShieldCheck,
  FileSpreadsheet,
  CheckCircle2,
  ShieldAlert,
  UserPlus
} from 'lucide-react';

export function AnalyticsOverview({
  students = [],
  todayData,
  activeAcademicYear,
  effectiveTime,
  onNavigate
}) {
  const totalStudents = students.length;
  const activeCards = students.filter(s => !s.rfid_status || s.rfid_status === 'ACTIVE').length;
  const deactivatedCards = students.filter(s => s.rfid_status === 'DEACTIVATED').length;
  const lostCards = students.filter(s => s.rfid_status === 'LOST').length;

  return (
    <div className="space-y-5">
      {/* College Banner & Welcome Card */}
      <div className="bg-white border border-slate-200 rounded-3xl p-6 sm:p-7 shadow-xs">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-100 pb-5 mb-5">
          <div className="flex items-center gap-4">
            <img
              src="/sggs_banner.png"
              alt="Shri Guru Gobind Singhji Institute of Engineering & Technology, Nanded"
              className="h-14 sm:h-16 object-contain"
            />
          </div>
          <div className="flex items-center gap-2">
            <span className="text-xs text-slate-500 font-medium">Active Batch:</span>
            <span className="font-bold text-blue-700 bg-blue-50 border border-blue-200 px-3 py-1 rounded-xl text-xs">
              {activeAcademicYear || '2024-2025'}
            </span>
          </div>
        </div>

        <div>
          <h1 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">
            Hostel Gate Entry Management Portal
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-1 leading-relaxed max-w-2xl">
            Streamlined system for Shri Guru Gobind Singhji Institute of Engineering & Technology college hostel. Pure RFID Gate Entry authentication and resident database management.
          </p>

          <div className="flex flex-wrap items-center gap-2.5 mt-4">
            <button
              onClick={() => onNavigate('RESIDENTS')}
              className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold shadow-xs transition-all"
            >
              <Users className="w-4 h-4" />
              <span>Student Database & RFID</span>
            </button>
            <button
              onClick={() => onNavigate('MASTER_IMPORT')}
              className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-slate-50 hover:bg-slate-100 text-slate-700 border border-slate-200 text-xs font-bold transition-colors"
            >
              <FileSpreadsheet className="w-4 h-4 text-blue-600" />
              <span>Student Data & Photo Management</span>
            </button>
            <button
              onClick={() => onNavigate('GATE_IN_OUT')}
              className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border border-emerald-200 text-xs font-bold transition-colors"
            >
              <DoorOpen className="w-4 h-4 text-emerald-600" />
              <span>View Entry History</span>
            </button>
          </div>
        </div>
      </div>

      {/* 4 Minimal KPI Cards (No Gate OUT, No Curfew) */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        {/* Total Students */}
        <div className="bg-white border border-slate-200 rounded-2xl p-4 sm:p-5 shadow-xs">
          <div className="flex items-center justify-between text-slate-500 mb-1">
            <span className="text-xs font-bold uppercase tracking-wider">Total Students</span>
            <Users className="w-4 h-4 text-blue-600" />
          </div>
          <div className="text-2xl font-black text-slate-900">{totalStudents}</div>
          <div className="text-[11px] text-slate-500 mt-1">
            Registered for Batch {activeAcademicYear}
          </div>
        </div>

        {/* Active RFID Cards */}
        <div className="bg-white border border-slate-200 rounded-2xl p-4 sm:p-5 shadow-xs">
          <div className="flex items-center justify-between text-slate-500 mb-1">
            <span className="text-xs font-bold uppercase tracking-wider">Active RFID Cards</span>
            <Radio className="w-4 h-4 text-emerald-600" />
          </div>
          <div className="text-2xl font-black text-emerald-700">{activeCards}</div>
          <div className="text-[11px] text-slate-500 mt-1">
            Authorized for gate entry
          </div>
        </div>

        {/* Deactivated / Lost Cards */}
        <div className="bg-white border border-slate-200 rounded-2xl p-4 sm:p-5 shadow-xs">
          <div className="flex items-center justify-between text-slate-500 mb-1">
            <span className="text-xs font-bold uppercase tracking-wider">Blocked / Lost Cards</span>
            <ShieldAlert className="w-4 h-4 text-rose-600" />
          </div>
          <div className="text-2xl font-black text-rose-700">
            {deactivatedCards + lostCards}
          </div>
          <div className="text-[11px] text-slate-500 mt-1">
            {deactivatedCards} Deactivated • {lostCards} Lost
          </div>
        </div>

        {/* Academic Batches */}
        <div className="bg-white border border-slate-200 rounded-2xl p-4 sm:p-5 shadow-xs">
          <div className="flex items-center justify-between text-slate-500 mb-1">
            <span className="text-xs font-bold uppercase tracking-wider">Active Batch</span>
            <Calendar className="w-4 h-4 text-purple-600" />
          </div>
          <div className="text-xl font-black text-purple-700 truncate">{activeAcademicYear || '2024-2025'}</div>
          <div className="text-[11px] text-slate-500 mt-1">
            Academic Session
          </div>
        </div>
      </div>

      {/* Minimal Feature Cards (Strictly the 5 expected functions) */}
      <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-xs">
        <h3 className="text-sm font-bold text-slate-900 mb-3 flex items-center gap-2">
          <ShieldCheck className="w-4 h-4 text-blue-600" />
          <span>Core Administrative Functions</span>
        </h3>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
          {/* 1. View & Manage Student Database */}
          <div 
            onClick={() => onNavigate('RESIDENTS')}
            className="p-4 rounded-xl bg-slate-50 hover:bg-blue-50/60 border border-slate-200 cursor-pointer transition-all group flex flex-col justify-between"
          >
            <div>
              <div className="flex items-center justify-between mb-2">
                <div className="w-8 h-8 rounded-lg bg-blue-100 text-blue-700 flex items-center justify-center font-bold">
                  <Users className="w-4 h-4" />
                </div>
                <ArrowRight className="w-4 h-4 text-slate-400 group-hover:text-blue-600 transition-colors" />
              </div>
              <h4 className="text-xs font-bold text-slate-900 group-hover:text-blue-700">
                View & Manage Student Database
              </h4>
              <p className="text-[11px] text-slate-500 mt-1">
                Browse residents, search by roll no or room, and edit student details.
              </p>
            </div>
            <span className="text-[10px] font-bold text-blue-600 mt-3 flex items-center gap-1">
              Open Directory →
            </span>
          </div>

          {/* 2. Student Data & Photo Management */}
          <div 
            onClick={() => onNavigate('MASTER_IMPORT')}
            className="p-4 rounded-xl bg-slate-50 hover:bg-indigo-50/60 border border-slate-200 cursor-pointer transition-all group flex flex-col justify-between"
          >
            <div>
              <div className="flex items-center justify-between mb-2">
                <div className="w-8 h-8 rounded-lg bg-indigo-100 text-indigo-700 flex items-center justify-center font-bold">
                  <FileSpreadsheet className="w-4 h-4" />
                </div>
                <ArrowRight className="w-4 h-4 text-slate-400 group-hover:text-indigo-600 transition-colors" />
              </div>
              <h4 className="text-xs font-bold text-slate-900 group-hover:text-indigo-700">
                Data & Photo Ingestion
              </h4>
              <p className="text-[11px] text-slate-500 mt-1">
                Upload CSV roster & bulk import student photo ZIP archive.
              </p>
            </div>
            <span className="text-[10px] font-bold text-indigo-600 mt-3 flex items-center gap-1">
              Ingest Data →
            </span>
          </div>

          {/* 3. Register Individual Students */}
          <div 
            onClick={() => onNavigate('RESIDENTS')}
            className="p-4 rounded-xl bg-slate-50 hover:bg-emerald-50/60 border border-slate-200 cursor-pointer transition-all group flex flex-col justify-between"
          >
            <div>
              <div className="flex items-center justify-between mb-2">
                <div className="w-8 h-8 rounded-lg bg-emerald-100 text-emerald-700 flex items-center justify-center font-bold">
                  <UserPlus className="w-4 h-4" />
                </div>
                <ArrowRight className="w-4 h-4 text-slate-400 group-hover:text-emerald-600 transition-colors" />
              </div>
              <h4 className="text-xs font-bold text-slate-900 group-hover:text-emerald-700">
                Register Individual Student
              </h4>
              <p className="text-[11px] text-slate-500 mt-1">
                Add single new residents and assign their physical RFID card UID directly.
              </p>
            </div>
            <span className="text-[10px] font-bold text-emerald-600 mt-3 flex items-center gap-1">
              + Add Resident →
            </span>
          </div>

          {/* 4. Deactivate Lost / Invalid RFID Cards */}
          <div 
            onClick={() => onNavigate('RESIDENTS')}
            className="p-4 rounded-xl bg-slate-50 hover:bg-rose-50/60 border border-slate-200 cursor-pointer transition-all group flex flex-col justify-between"
          >
            <div>
              <div className="flex items-center justify-between mb-2">
                <div className="w-8 h-8 rounded-lg bg-rose-100 text-rose-700 flex items-center justify-center font-bold">
                  <ShieldAlert className="w-4 h-4" />
                </div>
                <ArrowRight className="w-4 h-4 text-slate-400 group-hover:text-rose-600 transition-colors" />
              </div>
              <h4 className="text-xs font-bold text-slate-900 group-hover:text-rose-700">
                Deactivate Lost / Invalid RFID Cards
              </h4>
              <p className="text-[11px] text-slate-500 mt-1">
                Instantly revoke gate access for lost or damaged cards. Blocks entry with alarm.
              </p>
            </div>
            <span className="text-[10px] font-bold text-rose-600 mt-3 flex items-center gap-1">
              Manage RFID Cards →
            </span>
          </div>

          {/* 5. View Gate Entry History */}
          <div 
            onClick={() => onNavigate('GATE_IN_OUT')}
            className="p-4 rounded-xl bg-slate-50 hover:bg-blue-50/60 border border-slate-200 cursor-pointer transition-all group flex flex-col justify-between"
          >
            <div>
              <div className="flex items-center justify-between mb-2">
                <div className="w-8 h-8 rounded-lg bg-blue-100 text-blue-700 flex items-center justify-center font-bold">
                  <DoorOpen className="w-4 h-4" />
                </div>
                <ArrowRight className="w-4 h-4 text-slate-400 group-hover:text-blue-600 transition-colors" />
              </div>
              <h4 className="text-xs font-bold text-slate-900 group-hover:text-blue-700">
                View Gate Entry History
              </h4>
              <p className="text-[11px] text-slate-500 mt-1">
                Timestamped records of every resident card tap at the gate with verification logs.
              </p>
            </div>
            <span className="text-[10px] font-bold text-blue-600 mt-3 flex items-center gap-1">
              View History Logs →
            </span>
          </div>

          {/* 6. Academic Years */}
          <div 
            onClick={() => onNavigate('ACADEMIC_YEARS')}
            className="p-4 rounded-xl bg-slate-50 hover:bg-amber-50/60 border border-slate-200 cursor-pointer transition-all group flex flex-col justify-between"
          >
            <div>
              <div className="flex items-center justify-between mb-2">
                <div className="w-8 h-8 rounded-lg bg-amber-100 text-amber-700 flex items-center justify-center font-bold">
                  <Calendar className="w-4 h-4" />
                </div>
                <ArrowRight className="w-4 h-4 text-slate-400 group-hover:text-amber-600 transition-colors" />
              </div>
              <h4 className="text-xs font-bold text-slate-900 group-hover:text-amber-700">
                Academic Years Management
              </h4>
              <p className="text-[11px] text-slate-500 mt-1">
                Configure academic batches, switch active sessions, and rollover cohorts.
              </p>
            </div>
            <span className="text-[10px] font-bold text-amber-600 mt-3 flex items-center gap-1">
              Manage Batches →
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
