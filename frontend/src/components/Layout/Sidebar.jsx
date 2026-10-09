import React from 'react';
import {
  LayoutDashboard,
  DoorOpen,
  Moon,
  Users,
  FileSpreadsheet,
  Scale,
  Calendar,
  History,
  Settings,
  LogOut,
  Radio,
  X,
  ChevronRight,
  User
} from 'lucide-react';

export function Sidebar({
  currentView,
  onSelectView,
  currentUser,
  isOpen,
  onClose,
  activeAcademicYear,
  onLogout
}) {
  const role = currentUser?.role || 'ADMIN';

  const menuItems = [
    {
      id: 'DASHBOARD',
      label: 'Admin Overview',
      icon: LayoutDashboard,
      roles: ['ADMIN']
    },
    {
      id: 'RESIDENTS',
      label: 'Student Database',
      icon: Users,
      roles: ['ADMIN']
    },
    {
      id: 'RFID_TAB',
      label: 'RFID Management',
      icon: Radio,
      roles: ['ADMIN']
    },
    {
      id: 'MASTER_IMPORT',
      label: 'Student Data & Photo Management',
      icon: FileSpreadsheet,
      roles: ['ADMIN'],
      badge: 'CSV & ZIP',
      badgeColor: 'bg-blue-100 text-blue-700 border border-blue-200'
    },
    {
      id: 'GATE_IN_OUT',
      label: 'Gate Entry History',
      icon: DoorOpen,
      roles: ['ADMIN']
    },
    {
      id: 'ACADEMIC_YEARS',
      label: 'Academic Years',
      icon: Calendar,
      roles: ['ADMIN']
    }
  ];

  const visibleItems = menuItems.filter(item => item.roles.includes(role));

  const roleBadge = role === 'ADMIN'
    ? 'bg-purple-100 text-purple-800 border-purple-200'
    : 'bg-blue-100 text-blue-800 border-blue-200';

  return (
    <>
      {/* Mobile backdrop */}
      {isOpen && (
        <div
          onClick={onClose}
          className="fixed inset-0 z-40 bg-slate-900/40 backdrop-blur-xs lg:hidden transition-opacity"
        />
      )}

      {/* Sidebar container (Clean Crisp Light Theme) */}
      <aside
        className={`fixed top-0 bottom-0 left-0 z-50 w-64 bg-white border-r border-slate-200 flex flex-col transition-transform duration-300 ease-in-out lg:translate-x-0 shadow-sm ${
          isOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        {/* Brand header */}
        <div className="h-16 px-4 border-b border-slate-200 flex items-center justify-between bg-white">
          <div className="flex items-center gap-2 overflow-hidden">
            <img
              src="/sggs_banner.png"
              alt="SGGS IE&T Nanded"
              className="h-9 max-w-[170px] object-contain"
            />
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 lg:hidden"
            aria-label="Close menu"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Academic Year Indicator */}
        <div className="px-4 py-2.5 bg-slate-50 border-b border-slate-200 flex items-center justify-between text-xs">
          <span className="text-slate-500 font-medium">Batch Session:</span>
          <span className="font-bold text-blue-700 bg-blue-50 border border-blue-200 px-2 py-0.5 rounded">
            {activeAcademicYear || '2024-2025'}
          </span>
        </div>

        {/* Navigation Links */}
        <nav className="flex-1 overflow-y-auto px-3 py-3 space-y-1">
          <div className="px-3 pb-1.5 text-[10px] font-bold text-slate-400 uppercase tracking-wider">
            Menu Navigation
          </div>

          {visibleItems.map((item) => {
            const Icon = item.icon;
            const isActive = currentView === item.id;
            return (
              <button
                key={item.id}
                onClick={() => {
                  onSelectView(item.id);
                  if (onClose) onClose();
                }}
                className={`w-full flex items-center justify-between px-3 py-2 rounded-xl text-xs font-semibold transition-all ${
                  isActive
                    ? 'bg-blue-600 text-white shadow-sm font-bold'
                    : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
                }`}
              >
                <div className="flex items-center gap-2.5">
                  <Icon className={`w-4 h-4 ${isActive ? 'text-white' : 'text-slate-500'}`} />
                  <span>{item.label}</span>
                </div>
                {item.badge ? (
                  <span className={`text-[10px] px-1.5 py-0.5 rounded font-bold ${item.badgeColor}`}>
                    {item.badge}
                  </span>
                ) : (
                  isActive && <ChevronRight className="w-3.5 h-3.5 opacity-80" />
                )}
              </button>
            );
          })}
        </nav>

        {/* Bottom User Card */}
        <div className="p-3 border-t border-slate-200 bg-slate-50">
          <div className="p-2.5 rounded-xl bg-white border border-slate-200 flex items-center justify-between mb-2">
            <div className="flex items-center gap-2 min-w-0">
              <div className="w-7 h-7 rounded-lg bg-slate-100 flex items-center justify-center text-slate-600 shrink-0">
                <User className="w-3.5 h-3.5" />
              </div>
              <div className="min-w-0">
                <div className="text-xs font-bold text-slate-800 truncate">
                  {currentUser?.name || 'Authorized Staff'}
                </div>
                <div className="text-[10px] text-slate-500 truncate">
                  {currentUser?.office || 'Campus Authority'}
                </div>
              </div>
            </div>
            <span className={`text-[10px] px-1.5 py-0.5 rounded font-bold uppercase border ${roleBadge}`}>
              {role}
            </span>
          </div>

          <button
            onClick={onLogout}
            className="w-full flex items-center justify-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold text-rose-700 hover:bg-rose-50 border border-rose-200 transition-colors"
          >
            <LogOut className="w-3.5 h-3.5" />
            <span>Sign Out Session</span>
          </button>
        </div>
      </aside>
    </>
  );
}
