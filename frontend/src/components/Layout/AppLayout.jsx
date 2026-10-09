import React, { useState } from 'react';
import { Sidebar } from './Sidebar';
import { TopHeader } from './TopHeader';

export function AppLayout({
  children,
  currentView,
  onSelectView,
  currentUser,
  activeAcademicYear,
  academicYears,
  onSwitchAcademicYear,
  effectiveTime,
  currentMode,
  onOpenSimulator,
  onLogout
}) {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  return (
    <div className="min-h-screen bg-slate-100 text-slate-800 flex flex-col font-sans">
      {/* Responsive Left-Side Navigation Sidebar */}
      <Sidebar
        currentView={currentView}
        onSelectView={onSelectView}
        currentUser={currentUser}
        isOpen={isSidebarOpen}
        onClose={() => setIsSidebarOpen(false)}
        activeAcademicYear={activeAcademicYear}
        onLogout={onLogout}
      />

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col lg:pl-64 transition-all duration-300">
        {/* Top Header with prominent top-right role indicator */}
        <TopHeader
          onToggleSidebar={() => setIsSidebarOpen(!isSidebarOpen)}
          currentUser={currentUser}
          activeAcademicYear={activeAcademicYear}
          academicYears={academicYears}
          onSwitchAcademicYear={onSwitchAcademicYear}
          effectiveTime={effectiveTime}
          currentMode={currentMode}
          onOpenSimulator={onOpenSimulator}
          onLogout={onLogout}
        />

        {/* Page Content View */}
        <main className="flex-1 p-4 sm:p-6 max-w-7xl w-full mx-auto">
          {children}
        </main>
      </div>
    </div>
  );
}
