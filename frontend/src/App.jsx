import React, { useState, useEffect, useCallback } from 'react';
import { LoginPage } from './components/Auth/LoginPage';
import { GateEntryMonitor } from './components/Guard/GateEntryMonitor';
import { GateEntryHistory } from './components/Admin/GateEntryHistory';
import { AppLayout } from './components/Layout/AppLayout';
import { AnalyticsOverview } from './components/Dashboard/AnalyticsOverview';
import { StudentManagement } from './components/Admin/StudentManagement';
import { StudentDataAndPhotoManagement } from './components/Admin/StudentDataAndPhotoManagement';
import { AcademicYearManager } from './components/Admin/AcademicYearManager';
import { SimulatorDrawer } from './components/SimulatorDrawer';
import { ThemeProvider } from './context/ThemeContext';
import { LanguageProvider } from './context/LanguageContext';
import { useRfidListener } from './hooks/useRfidListener';
import { api } from './services/api';
import { audioService } from './services/audioService';

function AppContent() {
  // Authentication State (Role: 'GUARD' | 'ADMIN')
  const [currentUser, setCurrentUser] = useState(() => {
    try {
      const saved = localStorage.getItem('rfid_auth_user');
      const parsed = saved ? JSON.parse(saved) : null;
      return (parsed && parsed.role) ? parsed : null;
    } catch (e) {
      return null;
    }
  });

  // Admin navigation
  const [currentView, setCurrentView] = useState('DASHBOARD');

  // Academic Year State
  const [activeAcademicYear, setActiveAcademicYear] = useState('2024-2025');
  const [academicYears, setAcademicYears] = useState([]);

  // System State
  const [effectiveTime, setEffectiveTime] = useState(null);
  const [currentMode, setCurrentMode] = useState(null);
  const [todayData, setTodayData] = useState(null);
  const [students, setStudents] = useState([]);
  const [scanResult, setScanResult] = useState(null);
  const [isSimulatorOpen, setIsSimulatorOpen] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  // Load Academic Years
  const loadAcademicYears = useCallback(async () => {
    try {
      const res = await api.getAcademicYears();
      if (res.academicYears) setAcademicYears(res.academicYears);
      if (res.activeYear) setActiveAcademicYear(res.activeYear);
    } catch (err) {
      console.error('Failed to load academic years:', err);
    }
  }, []);

  // Load core system state
  const loadSystemState = useCallback(async () => {
    try {
      const [timeRes, todayRes, studentsRes] = await Promise.all([
        api.getSystemTime(),
        api.getTodayAttendance(),
        api.getStudents()
      ]);

      setEffectiveTime(timeRes.effectiveTime);
      setCurrentMode(timeRes.currentMode);
      setTodayData(todayRes);
      setStudents(studentsRes || []);
    } catch (err) {
      console.error('Failed to load system state:', err);
    }
  }, [activeAcademicYear]);

  useEffect(() => {
    loadAcademicYears();
  }, [loadAcademicYears]);

  useEffect(() => {
    loadSystemState();

    const timer = setInterval(() => {
      setEffectiveTime((prev) => {
        if (!prev) return new Date().toISOString();
        const d = new Date(prev);
        d.setSeconds(d.getSeconds() + 1);
        return d.toISOString();
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [loadSystemState]);

  // WebSocket Live Updates
  useEffect(() => {
    const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
    const wsUrl = `${protocol}//${window.location.host}/ws`;
    let ws;

    try {
      ws = new WebSocket(wsUrl);

      ws.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data);

          if (data.type === 'RFID_SCANNED' || data.type === 'GATE_MOVEMENT') {
            setScanResult(data.payload);
            if (data.payload.audio === 'SUCCESS' || data.payload.audio === 'SCAN_SUCCESS') {
              audioService.playSuccess();
            } else if (data.payload.audio === 'ERROR') {
              audioService.playError();
            }
            loadSystemState();
          } else if (data.type === 'ATTENDANCE_VERIFIED') {
            audioService.playVerified();
            loadSystemState();
          } else if (data.type === 'ACADEMIC_YEAR_CHANGED') {
            loadAcademicYears();
            loadSystemState();
          } else if (data.type === 'STUDENT_UPDATED' || data.type === 'PENALTY_WAIVED' || data.type === 'SETTINGS_UPDATED') {
            loadSystemState();
          } else if (data.type === 'TIME_CHANGED') {
            setEffectiveTime(data.payload.effectiveTime);
            setCurrentMode(data.payload.currentMode);
          }
        } catch (e) {
          console.error('Error parsing WS event:', e);
        }
      };
    } catch (e) {
      console.error('WebSocket error:', e);
    }

    return () => {
      if (ws) ws.close();
    };
  }, [loadSystemState, loadAcademicYears]);

  // Hardware RFID USB Scan Handler
  const handleHardwareScan = useCallback(async (rfidTag) => {
    const scanId = Date.now();
    try {
      const res = await api.scanCard(rfidTag);
      setScanResult({
        ...res,
        _scanId: scanId
      });

      if (res.audio === 'SUCCESS' || res.audio === 'SCAN_SUCCESS') {
        audioService.playSuccess();
      } else if (res.audio === 'ERROR') {
        audioService.playError();
      }
      loadSystemState();
    } catch (err) {
      audioService.playError();
      setScanResult({
        status: 'UNREGISTERED',
        rfid_tag: rfidTag,
        _scanId: scanId,
        mode: currentMode?.mode || 'DAY_ENTRY',
        audio: 'ERROR',
        message: 'Unregistered RFID card'
      });
    }
  }, [currentMode, loadSystemState]);

  useRfidListener(handleHardwareScan, true);

  // Keyboard Shortcuts
  useEffect(() => {
    const handleGlobalShortcuts = (e) => {
      if (e.key === 'Escape') {
        if (scanResult) setScanResult(null);
        if (isSimulatorOpen) setIsSimulatorOpen(false);
      }
    };
    window.addEventListener('keydown', handleGlobalShortcuts);
    return () => window.removeEventListener('keydown', handleGlobalShortcuts);
  }, [scanResult, isSimulatorOpen]);

  const handleLoginSuccess = (userData) => {
    setCurrentUser(userData);
    try {
      localStorage.setItem('rfid_auth_user', JSON.stringify(userData));
    } catch (e) {}

    if (userData.role === 'ADMIN') setCurrentView('DASHBOARD');
  };

  const handleLogout = () => {
    setCurrentUser(null);
    setScanResult(null);
    try {
      localStorage.removeItem('rfid_auth_user');
    } catch (e) {}
  };

  // RFID Card Status toggle (Active, Deactivated, Lost)
  const handleSetRfidStatus = async (studentId, status, reason) => {
    try {
      setIsSaving(true);
      const res = await api.setRfidStatus(studentId, status, reason, currentUser?.name, currentUser?.role);
      audioService.playSuccess();
      await loadSystemState();
      alert(res.message || 'RFID card status updated successfully');
    } catch (err) {
      alert('RFID Status error: ' + err.message);
    } finally {
      setIsSaving(false);
    }
  };

  // 1. If not logged in, render LoginPage (Clean Light Theme)
  if (!currentUser || !currentUser.role) {
    return <LoginPage onLoginSuccess={handleLoginSuccess} />;
  }

  // 2. IF LOGGED IN AS GUARD -> DIRECTLY OPEN FULLSCREEN GATE ENTRY MONITOR
  if (currentUser.role === 'GUARD') {
    return (
      <GateEntryMonitor
        scanResult={scanResult}
        effectiveTime={effectiveTime}
        onSimulateScan={handleHardwareScan}
        onDismissScan={() => setScanResult(null)}
        onLogout={handleLogout}
      />
    );
  }

  // 3. IF LOGGED IN AS ADMIN -> FULL FEATURED LIGHT PORTAL
  return (
    <AppLayout
      currentView={currentView}
      onSelectView={setCurrentView}
      currentUser={currentUser}
      activeAcademicYear={activeAcademicYear}
      academicYears={academicYears}
      onSwitchAcademicYear={(yr) => setActiveAcademicYear(yr)}
      effectiveTime={effectiveTime}
      currentMode={currentMode}
      onOpenSimulator={() => setIsSimulatorOpen(true)}
      onLogout={handleLogout}
    >
      {/* 3A. Overview */}
      {currentView === 'DASHBOARD' && (
        <AnalyticsOverview
          students={students}
          todayData={todayData}
          activeAcademicYear={activeAcademicYear}
          effectiveTime={effectiveTime}
          currentMode={currentMode}
          onNavigate={setCurrentView}
        />
      )}

      {/* 3B. Resident Directory & RFID Management */}
      {(currentView === 'RESIDENTS' || currentView === 'RFID_TAB') && (
        <StudentManagement
          students={students}
          activeAcademicYear={activeAcademicYear}
          academicYears={academicYears}
          currentUser={currentUser}
          initialSubTab={currentView === 'RFID_TAB' ? 'RFID' : 'STUDENTS'}
          onOpenMasterImport={() => setCurrentView('MASTER_IMPORT')}
          onSaveStudent={async (data, id) => {
            try {
              setIsSaving(true);
              if (id) await api.updateStudent(id, { ...data, performer_name: currentUser.name, performer_role: currentUser.role });
              else await api.createStudent({ ...data, academic_year: activeAcademicYear, performer_name: currentUser.name, performer_role: currentUser.role });
              audioService.playSuccess();
              loadSystemState();
            } catch (err) {
              alert('Save error: ' + err.message);
            } finally {
              setIsSaving(false);
            }
          }}
          onDeleteStudent={async (id) => {
            try {
              await api.deleteStudent(id, currentUser.name);
              audioService.playSuccess();
              loadSystemState();
            } catch (err) {
              alert('Delete error: ' + err.message);
            }
          }}
          onBulkDelete={async (studentIds) => {
            try {
              setIsSaving(true);
              const res = await api.bulkDeleteStudents(studentIds, currentUser.name, currentUser.role);
              audioService.playSuccess();
              await loadSystemState();
              alert(res.message || `Successfully deleted ${studentIds.length} student(s)`);
            } catch (err) {
              alert('Bulk delete error: ' + err.message);
            } finally {
              setIsSaving(false);
            }
          }}
          onClearAll={async () => {
            try {
              setIsSaving(true);
              const res = await api.clearAllStudents(currentUser.name, currentUser.role);
              audioService.playSuccess();
              await loadSystemState();
              alert(res.message || 'All student records have been cleared.');
            } catch (err) {
              alert('Clear all error: ' + err.message);
            } finally {
              setIsSaving(false);
            }
          }}
          onReassignRfid={async (id, newTag, reason) => {
            try {
              setIsSaving(true);
              const res = await api.reassignRfid(id, newTag, reason, currentUser.name, currentUser.role);
              audioService.playSuccess();
              loadSystemState();
              alert(res.message);
            } catch (err) {
              alert('Reassign error: ' + err.message);
            } finally {
              setIsSaving(false);
            }
          }}
          onSetRfidStatus={handleSetRfidStatus}
          isSaving={isSaving}
        />
      )}

      {/* 3C. Student Data & Photo Management (CSV & ZIP) */}
      {currentView === 'MASTER_IMPORT' && (
        <StudentDataAndPhotoManagement
          activeAcademicYear={activeAcademicYear}
          academicYears={academicYears}
          currentUser={currentUser}
          onImportComplete={() => {
            loadSystemState();
            loadAcademicYears();
          }}
        />
      )}

      {/* 3D. Gate Entry History */}
      {currentView === 'GATE_IN_OUT' && (
        <GateEntryHistory
          activeAcademicYear={activeAcademicYear}
          academicYears={academicYears}
          latestScan={scanResult}
        />
      )}

      {/* 3E. Academic Years Lifecycle */}
      {currentView === 'ACADEMIC_YEARS' && (
        <AcademicYearManager
          academicYears={academicYears}
          activeAcademicYear={activeAcademicYear}
          currentUser={currentUser}
          onRefreshYears={() => {
            loadAcademicYears();
            loadSystemState();
          }}
        />
      )}

      {/* Hardware RFID Simulator Drawer */}
      <SimulatorDrawer
        isOpen={isSimulatorOpen}
        onClose={() => setIsSimulatorOpen(false)}
        students={students}
        onSimulateScan={handleHardwareScan}
      />
    </AppLayout>
  );
}

export default function App() {
  return (
    <ThemeProvider>
      <LanguageProvider>
        <AppContent />
      </LanguageProvider>
    </ThemeProvider>
  );
}
