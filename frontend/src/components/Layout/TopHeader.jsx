import React, { useState, useEffect, useRef } from 'react';
import {
  Menu,
  Shield,
  Clock,
  ChevronDown,
  LogOut,
  Calendar,
  SlidersHorizontal,
  Sparkles
} from 'lucide-react';
import { formatIstTime } from '../../utils/dateUtils';

export function TopHeader({
  onToggleSidebar,
  currentUser,
  activeAcademicYear,
  academicYears = [],
  onSwitchAcademicYear,
  effectiveTime,
  currentMode,
  onOpenSimulator,
  onLogout
}) {
  const [showRoleDropdown, setShowRoleDropdown] = useState(false);
  const [showYearDropdown, setShowYearDropdown] = useState(false);

  const roleDropdownRef = useRef(null);
  const yearDropdownRef = useRef(null);

  // Close dropdowns when clicking outside
  useEffect(() => {
    function handleClickOutside(event) {
      if (roleDropdownRef.current && !roleDropdownRef.current.contains(event.target)) {
        setShowRoleDropdown(false);
      }
      if (yearDropdownRef.current && !yearDropdownRef.current.contains(event.target)) {
        setShowYearDropdown(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  const role = 'ADMIN';

  const roleConfig = {
    title: 'Super Admin',
    badge: 'bg-purple-50 text-purple-800 border-purple-200',
    dot: 'bg-purple-500'
  };

  const formattedTime = formatIstTime(effectiveTime || new Date());

  return (
    <header className="sticky top-0 z-30 h-16 bg-white border-b border-slate-200 px-4 sm:px-6 flex items-center justify-between shadow-xs">
      {/* Left side: Hamburger + College Emblem + Time */}
      <div className="flex items-center gap-3">
        <button
          onClick={onToggleSidebar}
          className="p-1.5 rounded-xl text-slate-600 hover:text-slate-900 hover:bg-slate-100 border border-slate-200 lg:hidden transition-colors"
          title="Toggle Navigation Menu"
          aria-label="Open menu"
        >
          <Menu className="w-5 h-5" />
        </button>

        <div className="flex items-center gap-2">
          <img
            src="/sggs_banner.png"
            alt="SGGS IE&T Nanded"
            className="h-8 max-w-[150px] sm:max-w-[200px] object-contain hidden sm:block"
          />
          <div className="h-4 w-px bg-slate-200 hidden sm:block" />
          <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-50 border border-slate-200 text-xs">
            <Clock className="w-3.5 h-3.5 text-blue-600" />
            <span className="font-mono font-bold text-slate-800">{formattedTime}</span>
          </div>
        </div>
      </div>

      {/* Right side: Academic Year Selector + PROMINENT ROLE REPRESENTATION IN TOP RIGHT CORNER */}
      <div className="flex items-center gap-2.5 sm:gap-3">
        {/* Hardware Simulator Toggle */}
        <button
          onClick={onOpenSimulator}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-50 hover:bg-slate-100 border border-slate-200 text-xs font-semibold text-slate-700 transition-colors shadow-xs"
          title="Hardware Simulator & Curfew Time Fast-Forward"
        >
          <SlidersHorizontal className="w-3.5 h-3.5 text-blue-600" />
          <span className="hidden md:inline">Simulator</span>
        </button>

        {/* Academic Year Switcher Dropdown */}
        <div className="relative" ref={yearDropdownRef}>
          <button
            onClick={() => {
              setShowYearDropdown(!showYearDropdown);
              setShowRoleDropdown(false);
            }}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-50 hover:bg-slate-100 border border-slate-200 text-xs font-bold text-slate-800 transition-colors"
            title="Switch Academic Session"
          >
            <Calendar className="w-3.5 h-3.5 text-blue-600" />
            <span>{activeAcademicYear || '2024-2025'}</span>
            <ChevronDown className="w-3 h-3 text-slate-400" />
          </button>

          {showYearDropdown && (
            <div className="absolute right-0 mt-2 w-48 bg-white border border-slate-200 rounded-xl shadow-lg py-1 z-50 animate-in fade-in zoom-in-95 duration-100">
              <div className="px-3 py-1 text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                Select Academic Session
              </div>
              {academicYears.map((ay) => (
                <button
                  key={ay.year_name}
                  onClick={() => {
                    if (onSwitchAcademicYear) onSwitchAcademicYear(ay.year_name);
                    setShowYearDropdown(false);
                  }}
                  className={`w-full text-left px-3 py-2 text-xs flex items-center justify-between hover:bg-slate-50 ${
                    ay.year_name === activeAcademicYear ? 'text-blue-700 font-bold bg-blue-50/60' : 'text-slate-700'
                  }`}
                >
                  <span>{ay.year_name}</span>
                  {ay.year_name === activeAcademicYear && (
                    <span className="text-[10px] px-1.5 py-0.2 rounded bg-blue-100 text-blue-800 font-bold">
                      Active
                    </span>
                  )}
                </button>
              ))}
            </div>
          )}
        </div>

        {/* PROMINENT TOP-RIGHT CORNER ROLE BADGE */}
        <div className="relative" ref={roleDropdownRef}>
          <button
            onClick={() => {
              setShowRoleDropdown(!showRoleDropdown);
              setShowYearDropdown(false);
            }}
            className={`flex items-center gap-2 px-3 py-1.5 rounded-xl border transition-all ${roleConfig.badge}`}
            title="User Profile & Role"
          >
            <span className={`w-2 h-2 rounded-full ${roleConfig.dot} animate-pulse`} />
            <div className="text-left">
              <div className="text-xs font-black tracking-wider uppercase leading-none">
                ROLE: {roleConfig.title}
              </div>
              <div className="text-[10px] opacity-75 truncate max-w-[120px] hidden sm:block">
                {currentUser?.name?.split(' ')[0] || 'Officer'}
              </div>
            </div>
            <ChevronDown className="w-3 h-3 opacity-60 ml-0.5" />
          </button>

          {showRoleDropdown && (
            <div className="absolute right-0 mt-2 w-56 bg-white border border-slate-200 rounded-2xl shadow-xl p-2.5 z-50 animate-in fade-in zoom-in-95 duration-100">
              <div className="p-2.5 bg-slate-50 rounded-xl border border-slate-100 mb-2">
                <div className="text-xs font-bold text-slate-800 truncate">
                  {currentUser?.name || 'Staff User'}
                </div>
                <div className="text-[11px] text-slate-500 truncate mt-0.5">
                  {currentUser?.office || 'Administration Office'}
                </div>
              </div>

              <button
                onClick={() => {
                  setShowRoleDropdown(false);
                  if (onLogout) onLogout();
                }}
                className="w-full flex items-center justify-center gap-1.5 px-3 py-2 rounded-xl text-xs font-bold text-rose-700 hover:bg-rose-50 border border-rose-200 transition-colors"
              >
                <LogOut className="w-3.5 h-3.5" />
                <span>Sign Out</span>
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
