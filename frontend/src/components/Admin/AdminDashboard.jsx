import React, { useState } from 'react';
import { 
  ShieldAlert, 
  Users, 
  Calendar, 
  FileText, 
  Mail, 
  Settings as SettingsIcon,
  Shield,
  RotateCcw,
  LogOut,
  Sliders,
  CreditCard
} from 'lucide-react';
import { PenaltiesManagement } from './PenaltiesManagement';
import { StudentManagement } from './StudentManagement';
import { AttendanceLogs } from './AttendanceLogs';
import { AuditLogs, EmailLogsViewer, SettingsView } from './AuditLogs';

export function AdminDashboard({ 
  user,
  students, 
  penalties, 
  penaltyMetrics, 
  onWaivePenalty, 
  onSaveStudent, 
  onDeleteStudent, 
  onReassignRfid,
  onOpenSimulator,
  onLogout,
  isWaiving,
  isSaving 
}) {
  const [activeTab, setActiveTab] = useState('penalties');

  const tabs = [
    { id: 'penalties', label: 'Disciplinary & Penalties', icon: ShieldAlert, count: penaltyMetrics?.active_count },
    { id: 'students', label: 'Resident Directory', icon: Users, count: students?.length },
    { id: 'attendance', label: 'Attendance Sessions', icon: Calendar },
    { id: 'audit', label: 'Waiver Audit Trail', icon: Shield },
    { id: 'emails', label: 'Brevo Email Logs', icon: Mail },
    { id: 'settings', label: 'System Settings', icon: SettingsIcon },
  ];

  return (
    <div className="min-h-screen bg-slate-100 flex flex-col justify-between">
      
      {/* Admin Top Header */}
      <header className="bg-white border-b border-slate-200 px-6 py-4 shadow-sm sticky top-0 z-30">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-xl bg-slate-900 text-white flex items-center justify-center shadow-md">
              <Shield className="w-5 h-5" />
            </div>
            <div>
              <h1 className="text-base sm:text-lg font-black text-slate-900 tracking-tight uppercase">
                WARDEN & DISCIPLINARY CONTROL PORTAL
              </h1>
              <p className="text-xs text-slate-500 font-medium">
                Hostel Administration • Penalty Forgiveness Audit & Student Directory
              </p>
            </div>
          </div>

          <div className="flex items-center space-x-3">
            {/* Simulator Launcher for Admin Testing */}
            <button
              onClick={onOpenSimulator}
              className="flex items-center space-x-1.5 bg-blue-50 hover:bg-blue-100 text-blue-700 border border-blue-200 px-3.5 py-2 rounded-xl text-xs font-bold transition shadow-sm"
              title="Open Card Tap & Cron Automation Tester"
            >
              <CreditCard className="w-3.5 h-3.5" />
              <span>RFID Hardware Test Pad</span>
            </button>

            {/* Logout */}
            <button
              onClick={onLogout}
              className="flex items-center space-x-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 px-3.5 py-2 rounded-xl text-xs font-bold transition border border-slate-200"
            >
              <LogOut className="w-3.5 h-3.5 text-slate-500" />
              <span>Log Out</span>
            </button>
          </div>

        </div>
      </header>

      {/* Main Container */}
      <main className="max-w-7xl mx-auto w-full px-4 sm:px-6 py-6 flex-1 space-y-6">
        
        {/* Navigation Tabs */}
        <div className="flex items-center space-x-2 border-b border-slate-200 overflow-x-auto pb-2 scrollbar-none">
          {tabs.map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center space-x-2 px-4 py-2.5 rounded-xl text-xs font-bold transition shrink-0 ${
                  isActive
                    ? 'bg-blue-600 text-white shadow-md shadow-blue-500/20'
                    : 'bg-white text-slate-600 hover:text-slate-900 hover:bg-slate-50 border border-slate-200'
                }`}
              >
                <Icon className="w-4 h-4" />
                <span>{tab.label}</span>
                {tab.count !== undefined && (
                  <span className={`px-1.5 py-0.2 rounded-full text-[10px] font-mono ${
                    isActive ? 'bg-blue-700 text-white' : 'bg-slate-100 text-slate-700'
                  }`}>
                    {tab.count}
                  </span>
                )}
              </button>
            );
          })}
        </div>

        {/* Tab Views */}
        <div>
          {activeTab === 'penalties' && (
            <PenaltiesManagement
              penalties={penalties}
              metrics={penaltyMetrics}
              onWaivePenalty={onWaivePenalty}
              isWaiving={isWaiving}
            />
          )}

          {activeTab === 'students' && (
            <StudentManagement
              students={students}
              onSaveStudent={onSaveStudent}
              onDeleteStudent={onDeleteStudent}
              onReassignRfid={onReassignRfid}
              isSaving={isSaving}
            />
          )}

          {activeTab === 'attendance' && <AttendanceLogs />}

          {activeTab === 'audit' && <AuditLogs />}

          {activeTab === 'emails' && <EmailLogsViewer />}

          {activeTab === 'settings' && <SettingsView />}
        </div>

      </main>

      {/* Footer */}
      <footer className="bg-white border-t border-slate-200 py-3.5 px-6 text-center text-xs text-slate-400 font-medium">
        Hostel Administration Portal • Shivaji & Himalaya Residence Hall
      </footer>

    </div>
  );
}
