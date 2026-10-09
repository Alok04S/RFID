import React, { useState, useMemo, useEffect } from 'react';
import { 
  Users, 
  UserPlus, 
  Search, 
  Edit, 
  Trash2, 
  Radio, 
  Phone, 
  Mail, 
  ShieldAlert,
  CheckCircle2,
  FileSpreadsheet,
  Calendar,
  Eye,
  AlertTriangle,
  X,
  CreditCard,
  ChevronLeft,
  ChevronRight,
  FolderArchive,
  Download,
  Loader2
} from 'lucide-react';
import { StudentModal, ReassignRfidModal } from './StudentModal';
import { StudentDetailModal } from './StudentDetailModal';
import { api } from '../../services/api';
import { formatAcademicYear } from '../../utils/academicYearUtils';
import { formatHostelDisplayName } from '../../utils/hostelUtils';

export function StudentManagement({ 
  students = [], 
  onSaveStudent, 
  onDeleteStudent, 
  onBulkDelete,
  onClearAll,
  onReassignRfid, 
  onSetRfidStatus,
  isSaving,
  activeAcademicYear,
  academicYears = [],
  onOpenMasterImport,
  currentUser,
  initialSubTab = 'STUDENTS'
}) {
  const [activeSubTab, setActiveSubTab] = useState(initialSubTab || 'STUDENTS');
  const [isDownloadingStudentData, setIsDownloadingStudentData] = useState(false);
  const [isDownloadingRfidData, setIsDownloadingRfidData] = useState(false);
  const [downloadError, setDownloadError] = useState(null);

  useEffect(() => {
    if (initialSubTab) {
      setActiveSubTab(initialSubTab);
    }
  }, [initialSubTab]);

  const handleDownloadStudentData = async () => {
    if (isDownloadingStudentData) return;
    setIsDownloadingStudentData(true);
    setDownloadError(null);
    try {
      await api.downloadAllStudentData();
    } catch (err) {
      console.error('Failed to download student data:', err);
      setDownloadError(err.message || 'Failed to download student database CSV');
      alert('Error downloading student data: ' + err.message);
    } finally {
      setIsDownloadingStudentData(false);
    }
  };

  const handleDownloadRfidData = async () => {
    if (isDownloadingRfidData) return;
    setIsDownloadingRfidData(true);
    setDownloadError(null);
    try {
      await api.downloadAllRfidData();
    } catch (err) {
      console.error('Failed to download RFID data:', err);
      setDownloadError(err.message || 'Failed to download RFID dataset CSV');
      alert('Error downloading RFID data: ' + err.message);
    } finally {
      setIsDownloadingRfidData(false);
    }
  };

  const [searchQuery, setSearchQuery] = useState('');
  const [selectedYearFilter, setSelectedYearFilter] = useState('ALL');
  const [isStudentModalOpen, setIsStudentModalOpen] = useState(false);
  const [editingStudent, setEditingStudent] = useState(null);
  const [reassignStudent, setReassignStudent] = useState(null);
  const [selectedDetailStudent, setSelectedDetailStudent] = useState(null);
  const [initialModalTab, setInitialModalTab] = useState('PROFILE'); // 'PROFILE' | 'ID_CARD'

  // ============================================================================
  // BULK SELECTION STATE
  // ============================================================================
  const [selectedStudentIds, setSelectedStudentIds] = useState(new Set());
  const [isBulkDeleteModalOpen, setIsBulkDeleteModalOpen] = useState(false);
  const [isBulkDeleting, setIsBulkDeleting] = useState(false);

  // ============================================================================
  // CLEAR ALL STATE
  // ============================================================================
  const [isClearAllModalOpen, setIsClearAllModalOpen] = useState(false);
  const [clearAllConfirmText, setClearAllConfirmText] = useState('');
  const [isClearingAll, setIsClearingAll] = useState(false);

  // ============================================================================
  // PAGINATION STATE
  // ============================================================================
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(25);

  const canEdit = currentUser?.role === 'ADMIN';
  const canDelete = currentUser?.role === 'ADMIN';

  // Filter students based on search query and academic year
  const filteredStudents = useMemo(() => {
    return students.filter((s) => {
      const q = searchQuery.toLowerCase().trim();
      const matchesSearch = !q || (
        s.full_name?.toLowerCase().includes(q) ||
        s.reg_number?.toLowerCase().includes(q) ||
        s.room_number?.toLowerCase().includes(q) ||
        s.rfid_tag?.toLowerCase().includes(q) ||
        s.branch?.toLowerCase().includes(q) ||
        s.contact_number?.toLowerCase().includes(q)
      );

      const matchesYear = selectedYearFilter === 'ALL' || s.academic_year === selectedYearFilter;
      return matchesSearch && matchesYear;
    });
  }, [students, searchQuery, selectedYearFilter]);

  // Paginated students for the current view
  const totalPages = pageSize === 'ALL' ? 1 : Math.max(1, Math.ceil(filteredStudents.length / pageSize));
  
  const paginatedStudents = useMemo(() => {
    if (pageSize === 'ALL') return filteredStudents;
    const start = (currentPage - 1) * pageSize;
    return filteredStudents.slice(start, start + pageSize);
  }, [filteredStudents, currentPage, pageSize]);

  // Adjust page if out of bounds after filtering
  React.useEffect(() => {
    if (currentPage > totalPages) {
      setCurrentPage(1);
    }
  }, [totalPages, currentPage]);

  // Checkbox Selection Logic
  const isAllCurrentPageSelected = 
    paginatedStudents.length > 0 && 
    paginatedStudents.every((s) => selectedStudentIds.has(s.id));

  const isSomeCurrentPageSelected = 
    paginatedStudents.some((s) => selectedStudentIds.has(s.id)) && 
    !isAllCurrentPageSelected;

  const handleToggleSelectAllCurrentPage = () => {
    const next = new Set(selectedStudentIds);
    if (isAllCurrentPageSelected) {
      // Deselect all on current page
      paginatedStudents.forEach((s) => next.delete(s.id));
    } else {
      // Select all on current page
      paginatedStudents.forEach((s) => next.add(s.id));
    }
    setSelectedStudentIds(next);
  };

  const handleToggleStudentSelect = (id) => {
    const next = new Set(selectedStudentIds);
    if (next.has(id)) {
      next.delete(id);
    } else {
      next.add(id);
    }
    setSelectedStudentIds(next);
  };

  const handleClearSelection = () => {
    setSelectedStudentIds(new Set());
  };

  // Bulk Deletion Execution
  const handleExecuteBulkDelete = async () => {
    if (selectedStudentIds.size === 0) return;
    setIsBulkDeleting(true);
    try {
      if (onBulkDelete) {
        await onBulkDelete(Array.from(selectedStudentIds));
      }
      setSelectedStudentIds(new Set());
      setIsBulkDeleteModalOpen(false);
    } catch (err) {
      alert('Bulk deletion failed: ' + err.message);
    } finally {
      setIsBulkDeleting(false);
    }
  };

  // Clear All Execution
  const handleExecuteClearAll = async () => {
    if (clearAllConfirmText !== 'CLEAR_ALL') {
      alert('Please type CLEAR_ALL exactly to confirm.');
      return;
    }
    setIsClearingAll(true);
    try {
      if (onClearAll) {
        await onClearAll();
      }
      setSelectedStudentIds(new Set());
      setClearAllConfirmText('');
      setIsClearAllModalOpen(false);
    } catch (err) {
      alert('Clear all failed: ' + err.message);
    } finally {
      setIsClearingAll(false);
    }
  };

  const handleOpenAdd = () => {
    setEditingStudent(null);
    setIsStudentModalOpen(true);
  };

  const handleOpenEdit = (student) => {
    setEditingStudent(student);
    setIsStudentModalOpen(true);
  };

  const handleOpenDetailModal = (student, tab = 'PROFILE') => {
    setSelectedDetailStudent(student);
    setInitialModalTab(tab);
  };

  return (
    <div className="space-y-4">
      {/* Top View Selector: Student Database vs RFID Management */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white border border-slate-200 rounded-3xl p-3 shadow-xs">
        <div className="flex items-center gap-2 p-1 bg-slate-100 rounded-2xl border border-slate-200/80">
          <button
            onClick={() => {
              setActiveSubTab('STUDENTS');
              setCurrentPage(1);
            }}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
              activeSubTab === 'STUDENTS'
                ? 'bg-white text-blue-700 shadow-sm'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <Users className="w-4 h-4 text-blue-600" />
            <span>Student Database</span>
            <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-slate-200/70 text-slate-700 font-mono">
              {students.length}
            </span>
          </button>

          <button
            onClick={() => {
              setActiveSubTab('RFID');
              setCurrentPage(1);
            }}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
              activeSubTab === 'RFID'
                ? 'bg-white text-indigo-700 shadow-sm'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <Radio className="w-4 h-4 text-indigo-600" />
            <span>RFID Management</span>
            <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-indigo-100 text-indigo-800 font-mono">
              {students.filter(s => s.rfid_tag).length} Cards
            </span>
          </button>
        </div>

        {/* Tab-Specific Prominent Download Button */}
        <div className="flex items-center gap-2">
          {activeSubTab === 'STUDENTS' ? (
            <button
              onClick={handleDownloadStudentData}
              disabled={isDownloadingStudentData}
              className="flex items-center gap-2 px-4 py-2 rounded-2xl text-xs font-bold text-emerald-800 bg-emerald-50 hover:bg-emerald-100 border border-emerald-300 transition-all cursor-pointer disabled:opacity-50 shadow-xs"
              title="Download all student records into a CSV containing all 10 required columns"
            >
              {isDownloadingStudentData ? (
                <Loader2 className="w-4 h-4 text-emerald-600 animate-spin" />
              ) : (
                <Download className="w-4 h-4 text-emerald-600" />
              )}
              <span>Download All Student Data</span>
            </button>
          ) : (
            <button
              onClick={handleDownloadRfidData}
              disabled={isDownloadingRfidData}
              className="flex items-center gap-2 px-4 py-2 rounded-2xl text-xs font-bold text-indigo-800 bg-indigo-50 hover:bg-indigo-100 border border-indigo-300 transition-all cursor-pointer disabled:opacity-50 shadow-xs"
              title="Download complete RFID cards and gate movement dataset as CSV"
            >
              {isDownloadingRfidData ? (
                <Loader2 className="w-4 h-4 text-indigo-600 animate-spin" />
              ) : (
                <Download className="w-4 h-4 text-indigo-600" />
              )}
              <span>Download RFID Data</span>
            </button>
          )}
        </div>
      </div>

      {/* Search & Actions Toolbar */}
      <div className="flex flex-col lg:flex-row items-stretch lg:items-center justify-between gap-3 bg-white border border-slate-200 rounded-3xl p-4 shadow-xs">
        <div className="flex flex-1 items-center gap-2">
          {/* Search bar */}
          <div className="flex items-center space-x-2 flex-1 bg-slate-50 border border-slate-200 rounded-2xl px-3.5 py-2.5">
            <Search className="w-4 h-4 text-slate-400 shrink-0" />
            <input
              type="text"
              placeholder={activeSubTab === 'RFID' ? "Search by RFID UID, Student Name, Room, Roll No..." : "Search by Student Name, Room, Roll No, RFID, or Branch..."}
              value={searchQuery}
              onChange={(e) => {
                setSearchQuery(e.target.value);
                setCurrentPage(1);
              }}
              className="bg-transparent text-xs text-slate-800 focus:outline-none w-full placeholder-slate-400"
            />
            {searchQuery && (
              <button 
                onClick={() => setSearchQuery('')}
                className="text-slate-400 hover:text-slate-600 text-xs"
              >
                Clear
              </button>
            )}
          </div>

          {/* Academic Year filter */}
          <div className="flex items-center gap-1.5 bg-slate-50 border border-slate-200 rounded-2xl px-3 py-2.5 shrink-0">
            <Calendar className="w-3.5 h-3.5 text-blue-600" />
            <select
              value={selectedYearFilter}
              onChange={(e) => {
                setSelectedYearFilter(e.target.value);
                setCurrentPage(1);
              }}
              className="bg-transparent text-xs text-slate-700 font-bold focus:outline-none cursor-pointer"
            >
              <option value="ALL">All Batches</option>
              {academicYears.map((ay) => (
                <option key={ay.year_name} value={ay.year_name}>
                  {ay.year_name}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Action Buttons Toolbar */}
        {canEdit && (
          <div className="flex flex-wrap items-center gap-2 shrink-0">
            {/* Clear All Student Data (Admin Only) */}
            <button
              onClick={() => {
                setClearAllConfirmText('');
                setIsClearAllModalOpen(true);
              }}
              className="flex items-center gap-1.5 px-3.5 py-2.5 rounded-2xl text-xs font-bold text-rose-700 bg-rose-50 hover:bg-rose-100 border border-rose-200 transition-colors"
              title="Permanently remove all student records and associated photos"
            >
              <Trash2 className="w-4 h-4 text-rose-600" />
              <span>Clear All Data</span>
            </button>

            {/* Student Data & Photo Management Link */}
            {currentUser?.role === 'ADMIN' && onOpenMasterImport && (
              <button
                onClick={onOpenMasterImport}
                className="flex items-center gap-1.5 px-3.5 py-2.5 rounded-2xl text-xs font-bold text-blue-700 bg-blue-50 hover:bg-blue-100 border border-blue-200 transition-colors"
                title="Open Student CSV & Photo ZIP Management"
              >
                <FileSpreadsheet className="w-4 h-4 text-blue-600" />
                <span className="hidden sm:inline">Data & Photo Ingestion</span>
                <span className="sm:hidden">CSV / Photos</span>
              </button>
            )}

            {/* Add Resident */}
            <button
              onClick={handleOpenAdd}
              className="flex items-center gap-1.5 px-4 py-2.5 rounded-2xl text-xs font-bold text-white bg-blue-600 hover:bg-blue-700 shadow-md shadow-blue-500/20 transition-all"
              title="Register Single New Resident"
            >
              <UserPlus className="w-4 h-4" />
              <span>+ Add Resident</span>
            </button>
          </div>
        )}
      </div>

      {/* Bulk Selection Notification Banner */}
      {selectedStudentIds.size > 0 && (
        <div className="bg-blue-50 border border-blue-200 rounded-2xl px-4 py-3 flex flex-wrap items-center justify-between gap-3 animate-in fade-in duration-150">
          <div className="flex items-center gap-2.5">
            <div className="w-6 h-6 rounded-lg bg-blue-600 text-white flex items-center justify-center text-xs font-mono font-bold">
              {selectedStudentIds.size}
            </div>
            <span className="text-xs font-bold text-blue-900">
              {selectedStudentIds.size} student{selectedStudentIds.size > 1 ? 's' : ''} selected
            </span>
            <span className="text-[11px] text-blue-600">
              (out of {filteredStudents.length} total)
            </span>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handleClearSelection}
              className="px-3 py-1.5 text-xs font-bold text-slate-600 hover:text-slate-900 bg-white border border-slate-200 rounded-xl transition-colors"
            >
              Deselect All
            </button>

            {canDelete && (
              <button
                onClick={() => setIsBulkDeleteModalOpen(true)}
                className="flex items-center gap-1.5 px-4 py-1.5 text-xs font-black text-white bg-rose-600 hover:bg-rose-700 rounded-xl shadow-xs transition-colors"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>Delete Selected ({selectedStudentIds.size})</span>
              </button>
            )}
          </div>
        </div>
      )}

      {/* Residents Table */}
      <div className="bg-white border border-slate-200 rounded-3xl overflow-hidden shadow-xs">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-slate-700">
            <thead className="bg-slate-50 text-slate-500 uppercase font-mono text-[10px] border-b border-slate-200">
              <tr>
                {/* Select All Checkbox */}
                <th className="px-3 py-3 w-10 text-center">
                  <input
                    type="checkbox"
                    checked={isAllCurrentPageSelected}
                    ref={(el) => {
                      if (el) el.indeterminate = isSomeCurrentPageSelected;
                    }}
                    onChange={handleToggleSelectAllCurrentPage}
                    className="w-4 h-4 text-blue-600 rounded border-slate-300 focus:ring-blue-500 cursor-pointer"
                    title="Select all students on current page"
                  />
                </th>
                {activeSubTab === 'RFID' ? (
                  <>
                    <th className="px-3 py-3">RFID Card UID</th>
                    <th className="px-3 py-3">Resident (Click for details)</th>
                    <th className="px-3 py-3">Room & Batch</th>
                    <th className="px-3 py-3">Card Protocol</th>
                    <th className="px-3 py-3">Gate Presence</th>
                    <th className="px-3 py-3">Card Status</th>
                  </>
                ) : (
                  <>
                    <th className="px-3 py-3">Resident (Click for details)</th>
                    <th className="px-3 py-3">RFID Card UID</th>
                    <th className="px-3 py-3">Room & Batch</th>
                    <th className="px-3 py-3">Branch & Year</th>
                    <th className="px-3 py-3">Gender</th>
                    <th className="px-3 py-3">RFID Card Status</th>
                  </>
                )}
                <th className="px-3 py-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 font-medium">
              {filteredStudents.length === 0 ? (
                <tr>
                  <td colSpan={8} className="text-center py-12 text-slate-400">
                    <Users className="w-8 h-8 mx-auto mb-2 text-slate-300" />
                    <div>No resident records found matching criteria.</div>
                    {students.length === 0 && (
                      <div className="text-[11px] text-slate-400 mt-1">
                        The student database is currently empty. Use &quot;Data & Photo Ingestion&quot; to import students.
                      </div>
                    )}
                  </td>
                </tr>
              ) : (
                paginatedStudents.map((student) => {
                  const cardStatus = student.rfid_status || 'ACTIVE';
                  const isSelected = selectedStudentIds.has(student.id);

                  return (
                    <tr 
                      key={student.id} 
                      onClick={() => handleOpenDetailModal(student, 'PROFILE')}
                      className={`hover:bg-blue-50/50 transition-colors cursor-pointer group ${
                        isSelected ? 'bg-blue-50/30' : ''
                      }`}
                      title="Click to view full resident profile & ID card"
                    >
                      {/* Row Checkbox */}
                      <td 
                        className="px-3 py-3 text-center"
                        onClick={(e) => e.stopPropagation()}
                      >
                        <input
                          type="checkbox"
                          checked={isSelected}
                          onChange={() => handleToggleStudentSelect(student.id)}
                          className="w-4 h-4 text-blue-600 rounded border-slate-300 focus:ring-blue-500 cursor-pointer"
                        />
                      </td>

                      {activeSubTab === 'RFID' ? (
                        <>
                          {/* RFID Tag UID */}
                          <td className="px-3 py-3 font-mono text-[11px] font-bold">
                            <span className="inline-block bg-indigo-50 border border-indigo-200 text-indigo-800 px-2.5 py-1 rounded-xl font-mono shadow-2xs">
                              {student.rfid_tag || 'Unassigned'}
                            </span>
                          </td>

                          {/* Resident Name & Photo */}
                          <td className="px-3 py-3">
                            <div className="flex items-center gap-3">
                              <img
                                src={student.photo_url}
                                alt={student.full_name}
                                className="w-8 h-8 rounded-full object-cover object-center border border-slate-200 shrink-0 group-hover:ring-2 group-hover:ring-blue-500 transition-all bg-slate-100"
                                style={{ objectPosition: 'center' }}
                                onError={(e) => {
                                  e.target.src = `https://api.dicebear.com/7.x/initials/svg?seed=${encodeURIComponent(student.full_name)}&backgroundColor=0284c7,0d9488,4f46e5`;
                                }}
                              />
                              <div>
                                <div className="font-bold text-slate-900 group-hover:text-blue-700 transition-colors flex items-center gap-1.5">
                                  <span>{student.full_name}</span>
                                </div>
                                <div className="text-[11px] text-slate-500 font-mono">
                                  {student.reg_number}
                                </div>
                              </div>
                            </div>
                          </td>

                          {/* Room & Batch */}
                          <td className="px-3 py-3">
                            <span className="font-bold text-blue-700 bg-blue-50 border border-blue-200 px-2 py-0.5 rounded text-[11px]">
                              {student.room_number}
                            </span>
                            <div className="text-[10px] text-slate-500 mt-0.5">
                              {student.academic_year || '2024-2025'}
                            </div>
                          </td>

                          {/* Card Protocol */}
                          <td className="px-3 py-3">
                            <div className="text-slate-800 font-medium text-[11px]">
                              {student.card_type || '125 KHz (EM4100)'}
                            </div>
                          </td>

                          {/* Gate Presence */}
                          <td className="px-3 py-3">
                            <span className={`inline-flex items-center gap-1 text-[10px] px-2 py-0.5 rounded-full font-bold ${
                              student.current_status === 'OUTSIDE' 
                                ? 'bg-amber-50 text-amber-700 border border-amber-200' 
                                : 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                            }`}>
                              ● {student.current_status || 'INSIDE'}
                            </span>
                          </td>

                          {/* RFID Card Status */}
                          <td className="px-3 py-3">
                            {cardStatus === 'ACTIVE' && (
                              <span className="inline-flex items-center gap-1 text-[10px] px-2 py-0.5 rounded-full font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                                <Radio className="w-3 h-3 text-emerald-600" /> Active Card
                              </span>
                            )}
                            {cardStatus === 'LOST' && (
                              <span className="inline-flex items-center gap-1 text-[10px] px-2 py-0.5 rounded-full font-bold bg-amber-50 text-amber-700 border border-amber-200">
                                <ShieldAlert className="w-3 h-3 text-amber-600" /> Lost Card
                              </span>
                            )}
                            {cardStatus === 'DEACTIVATED' && (
                              <span className="inline-flex items-center gap-1 text-[10px] px-2 py-0.5 rounded-full font-bold bg-rose-50 text-rose-700 border border-rose-200">
                                <ShieldAlert className="w-3 h-3 text-rose-600" /> Deactivated
                              </span>
                            )}
                          </td>
                        </>
                      ) : (
                        <>
                          {/* Resident Name & Photo */}
                          <td className="px-3 py-3">
                            <div className="flex items-center gap-3">
                              <img
                                src={student.photo_url}
                                alt={student.full_name}
                                className="w-9 h-9 rounded-full object-cover object-center border border-slate-200 shrink-0 group-hover:ring-2 group-hover:ring-blue-500 transition-all bg-slate-100"
                                style={{ objectPosition: 'center' }}
                                onError={(e) => {
                                  e.target.src = `https://api.dicebear.com/7.x/initials/svg?seed=${encodeURIComponent(student.full_name)}&backgroundColor=0284c7,0d9488,4f46e5`;
                                }}
                              />
                              <div>
                                <div className="font-bold text-slate-900 group-hover:text-blue-700 transition-colors flex items-center gap-1.5">
                                  <span>{student.full_name}</span>
                                </div>
                                <div className="text-[11px] text-slate-500 font-mono">
                                  {student.reg_number}
                                </div>
                              </div>
                            </div>
                          </td>

                          {/* RFID Tag */}
                          <td className="px-3 py-3 font-mono text-slate-800 text-[11px] font-bold">
                            {student.rfid_tag}
                          </td>

                          {/* Room & Hostel */}
                          <td className="px-3 py-3">
                            <span className="font-bold text-blue-700 bg-blue-50 border border-blue-200 px-2 py-0.5 rounded text-[11px]">
                              {student.room_number}
                            </span>
                            <div className="text-[10px] text-slate-500 font-medium mt-0.5">
                              {formatHostelDisplayName(student.hostel_name, student.room_number)}
                            </div>
                          </td>

                          {/* Branch & Year */}
                          <td className="px-3 py-3">
                            <div className="text-slate-800 font-medium truncate max-w-[160px]">{student.branch}</div>
                            <div className="text-[11px] font-bold text-blue-700">
                              {formatAcademicYear(student.year || student.academic_year, { includeCode: true })}
                            </div>
                          </td>

                          {/* Gender */}
                          <td className="px-3 py-3 text-slate-600 text-[11px]">
                            {student.gender || 'Not Specified'}
                          </td>

                          {/* RFID Card Status */}
                          <td className="px-3 py-3">
                            {cardStatus === 'ACTIVE' && (
                              <span className="inline-flex items-center gap-1 text-[10px] px-2 py-0.5 rounded-full font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                                <Radio className="w-3 h-3 text-emerald-600" /> Active Card
                              </span>
                            )}
                            {cardStatus === 'LOST' && (
                              <span className="inline-flex items-center gap-1 text-[10px] px-2 py-0.5 rounded-full font-bold bg-amber-50 text-amber-700 border border-amber-200">
                                <ShieldAlert className="w-3 h-3 text-amber-600" /> Lost Card
                              </span>
                            )}
                            {cardStatus === 'DEACTIVATED' && (
                              <span className="inline-flex items-center gap-1 text-[10px] px-2 py-0.5 rounded-full font-bold bg-rose-50 text-rose-700 border border-rose-200">
                                <ShieldAlert className="w-3 h-3 text-rose-600" /> Deactivated
                              </span>
                            )}
                          </td>
                        </>
                      )}

                      {/* Action buttons */}
                      <td className="px-3 py-3 text-right whitespace-nowrap">
                        <div className="flex items-center justify-end gap-1">
                          {/* Student ID Card Badge View */}
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              handleOpenDetailModal(student, 'ID_CARD');
                            }}
                            className="p-1.5 rounded-lg text-slate-500 hover:text-indigo-600 hover:bg-indigo-50 transition-colors"
                            title="View Official Student ID Card"
                          >
                            <CreditCard className="w-3.5 h-3.5" />
                          </button>

                          {/* Quick View Profile Details Button */}
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              handleOpenDetailModal(student, 'PROFILE');
                            }}
                            className="p-1.5 rounded-lg text-slate-500 hover:text-blue-600 hover:bg-slate-100 transition-colors"
                            title="View Full Profile Details"
                          >
                            <Eye className="w-3.5 h-3.5" />
                          </button>

                          {canEdit && (
                            <>
                              {/* Reassign RFID Card */}
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setReassignStudent(student);
                                }}
                                className="p-1.5 rounded-lg text-slate-500 hover:text-blue-600 hover:bg-slate-100 transition-colors"
                                title="Reassign RFID Card UID"
                              >
                                <Radio className="w-3.5 h-3.5" />
                              </button>

                              {/* Deactivate or Reactivate RFID Card */}
                              {onSetRfidStatus && (
                                cardStatus === 'ACTIVE' ? (
                                  <button
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      const reason = window.prompt(`Deactivate RFID card for ${student.full_name}? Enter reason:`, 'Card lost / invalid');
                                      if (reason !== null) {
                                        onSetRfidStatus(student.id, 'DEACTIVATED', reason);
                                      }
                                    }}
                                    className="p-1.5 rounded-lg text-slate-500 hover:text-rose-600 hover:bg-rose-50 transition-colors"
                                    title="Deactivate / Block RFID Card"
                                  >
                                    <ShieldAlert className="w-3.5 h-3.5" />
                                  </button>
                                ) : (
                                  <button
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      if (window.confirm(`Reactivate RFID card (${student.rfid_tag}) for ${student.full_name}?`)) {
                                        onSetRfidStatus(student.id, 'ACTIVE', 'Reactivated by Admin');
                                      }
                                    }}
                                    className="p-1.5 rounded-lg text-slate-500 hover:text-emerald-600 hover:bg-emerald-50 transition-colors"
                                    title="Reactivate RFID Card"
                                  >
                                    <CheckCircle2 className="w-3.5 h-3.5" />
                                  </button>
                                )
                              )}

                              {/* Edit Resident Record */}
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleOpenEdit(student);
                                }}
                                className="p-1.5 rounded-lg text-slate-500 hover:text-blue-600 hover:bg-slate-100 transition-colors"
                                title="Edit Resident Record"
                              >
                                <Edit className="w-3.5 h-3.5" />
                              </button>
                            </>
                          )}

                          {canDelete && (
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                if (window.confirm(`Are you sure you want to delete ${student.full_name} (${student.reg_number})?`)) {
                                  onDeleteStudent(student.id);
                                }
                              }}
                              className="p-1.5 rounded-lg text-slate-500 hover:text-rose-600 hover:bg-rose-50 transition-colors"
                              title="Delete Resident Record"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination & Counter Footer */}
        {filteredStudents.length > 0 && (
          <div className="px-4 py-3 border-t border-slate-200 bg-slate-50 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-slate-600">
            <div className="flex items-center gap-3">
              <span>
                Showing{' '}
                <span className="font-bold text-slate-900">
                  {pageSize === 'ALL' ? 1 : (currentPage - 1) * pageSize + 1}
                </span>{' '}
                to{' '}
                <span className="font-bold text-slate-900">
                  {pageSize === 'ALL' ? filteredStudents.length : Math.min(currentPage * pageSize, filteredStudents.length)}
                </span>{' '}
                of <span className="font-bold text-slate-900">{filteredStudents.length}</span> students
              </span>

              {/* Page size dropdown */}
              <div className="flex items-center gap-1.5 pl-2 border-l border-slate-200">
                <span className="text-[11px] text-slate-500">Per page:</span>
                <select
                  value={pageSize}
                  onChange={(e) => {
                    const val = e.target.value === 'ALL' ? 'ALL' : parseInt(e.target.value, 10);
                    setPageSize(val);
                    setCurrentPage(1);
                  }}
                  className="bg-white border border-slate-200 rounded-lg px-2 py-1 text-xs font-bold text-slate-700 focus:outline-none"
                >
                  <option value={25}>25</option>
                  <option value={50}>50</option>
                  <option value={100}>100</option>
                  <option value="ALL">All ({filteredStudents.length})</option>
                </select>
              </div>
            </div>

            {/* Page navigation buttons */}
            {pageSize !== 'ALL' && totalPages > 1 && (
              <div className="flex items-center gap-1">
                <button
                  onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                  disabled={currentPage === 1}
                  className="flex items-center gap-1 px-3 py-1.5 rounded-xl border border-slate-200 bg-white hover:bg-slate-100 disabled:opacity-40 disabled:cursor-not-allowed font-medium transition-colors"
                >
                  <ChevronLeft className="w-3.5 h-3.5" />
                  <span>Prev</span>
                </button>

                <div className="px-2 font-mono font-bold text-slate-700">
                  {currentPage} / {totalPages}
                </div>

                <button
                  onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                  disabled={currentPage >= totalPages}
                  className="flex items-center gap-1 px-3 py-1.5 rounded-xl border border-slate-200 bg-white hover:bg-slate-100 disabled:opacity-40 disabled:cursor-not-allowed font-medium transition-colors"
                >
                  <span>Next</span>
                  <ChevronRight className="w-3.5 h-3.5" />
                </button>
              </div>
            )}
          </div>
        )}
      </div>

      {/* ==================================================================== */}
      {/* BULK DELETE CONFIRMATION MODAL                                       */}
      {/* ==================================================================== */}
      {isBulkDeleteModalOpen && (
        <div 
          className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in duration-150"
          onClick={(e) => {
            if (e.target === e.currentTarget && !isBulkDeleting) setIsBulkDeleteModalOpen(false);
          }}
        >
          <div className="bg-white border border-slate-200 rounded-3xl max-w-md w-full shadow-2xl p-6 space-y-4">
            <div className="flex items-center gap-3 text-rose-600">
              <div className="w-10 h-10 rounded-2xl bg-rose-100 flex items-center justify-center shrink-0">
                <Trash2 className="w-5 h-5 text-rose-600" />
              </div>
              <div>
                <h3 className="text-base font-black text-slate-900">
                  Delete {selectedStudentIds.size} Selected Students?
                </h3>
                <p className="text-xs text-slate-500">Irreversible deletion operation</p>
              </div>
            </div>

            <p className="text-xs text-slate-600 leading-relaxed">
              Are you sure you want to delete <span className="font-bold text-slate-900">{selectedStudentIds.size} selected student records</span>? 
              This will permanently delete their records, gate movement history, and remove their local photographs. This action cannot be undone.
            </p>

            <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setIsBulkDeleteModalOpen(false)}
                disabled={isBulkDeleting}
                className="px-4 py-2 text-xs font-bold text-slate-700 bg-white hover:bg-slate-100 border border-slate-200 rounded-xl transition-colors"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleExecuteBulkDelete}
                disabled={isBulkDeleting}
                className="flex items-center gap-1.5 px-5 py-2 text-xs font-black text-white bg-rose-600 hover:bg-rose-700 rounded-xl shadow-md shadow-rose-500/20 transition-all disabled:opacity-50"
              >
                {isBulkDeleting ? 'Deleting...' : `Delete ${selectedStudentIds.size} Students`}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ==================================================================== */}
      {/* CLEAR ALL STUDENT DATA CONFIRMATION MODAL                            */}
      {/* ==================================================================== */}
      {isClearAllModalOpen && (
        <div 
          className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in duration-150"
          onClick={(e) => {
            if (e.target === e.currentTarget && !isClearingAll) setIsClearAllModalOpen(false);
          }}
        >
          <div className="bg-white border border-rose-200 rounded-3xl max-w-lg w-full shadow-2xl p-6 space-y-5">
            <div className="flex items-start gap-3.5">
              <div className="w-12 h-12 rounded-2xl bg-rose-100 text-rose-600 flex items-center justify-center shrink-0">
                <AlertTriangle className="w-6 h-6" />
              </div>
              <div className="flex-1">
                <h3 className="text-base font-black text-slate-900">
                  Reset & Clear All Student Data
                </h3>
                <p className="text-xs text-rose-700 font-bold mt-0.5">
                  WARNING: High-impact destructive administrator action
                </p>
              </div>
            </div>

            <div className="bg-rose-50/70 border border-rose-200 rounded-2xl p-4 text-xs text-rose-900 space-y-2">
              <p className="font-bold">
                This operation will completely erase:
              </p>
              <ul className="list-disc list-inside space-y-1 text-slate-700">
                <li>All student profile records ({students.length} existing residents)</li>
                <li>All gate movement logs and attendance session history</li>
                <li>All disciplinary penalty records</li>
                <li>All uploaded student photo files on server disk</li>
              </ul>
              <div className="pt-2 border-t border-rose-200/80 text-[11px] text-emerald-800 font-bold">
                ✓ Administrator credentials, system settings, and academic years will remain safely intact.
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-xs font-bold text-slate-700 block">
                Type <span className="font-mono bg-slate-100 px-1.5 py-0.5 rounded text-rose-600 font-black">CLEAR_ALL</span> below to confirm:
              </label>
              <input
                type="text"
                value={clearAllConfirmText}
                onChange={(e) => setClearAllConfirmText(e.target.value)}
                placeholder="CLEAR_ALL"
                className="w-full px-3.5 py-2.5 border border-slate-300 rounded-xl text-xs font-mono font-bold text-slate-900 focus:outline-none focus:ring-2 focus:ring-rose-500"
              />
            </div>

            <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setIsClearAllModalOpen(false)}
                disabled={isClearingAll}
                className="px-4 py-2 text-xs font-bold text-slate-700 bg-white hover:bg-slate-100 border border-slate-200 rounded-xl transition-colors"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleExecuteClearAll}
                disabled={isClearingAll || clearAllConfirmText !== 'CLEAR_ALL'}
                className="flex items-center gap-1.5 px-5 py-2.5 text-xs font-black text-white bg-rose-600 hover:bg-rose-700 rounded-xl shadow-md shadow-rose-500/20 transition-all disabled:opacity-40 disabled:cursor-not-allowed"
              >
                {isClearingAll ? 'Clearing All Data...' : 'Permanently Clear All Students'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Edit / Register Modal */}
      {isStudentModalOpen && (
        <StudentModal
          isOpen={isStudentModalOpen}
          onClose={() => setIsStudentModalOpen(false)}
          onSave={(data) => {
            onSaveStudent(data, editingStudent?.id);
            setIsStudentModalOpen(false);
          }}
          student={editingStudent}
          isSaving={isSaving}
        />
      )}

      {/* Reassign RFID Card Modal */}
      {reassignStudent && (
        <ReassignRfidModal
          isOpen={!!reassignStudent}
          onClose={() => setReassignStudent(null)}
          student={reassignStudent}
          onReassign={(id, newTag, reason) => {
            onReassignRfid(id, newTag, reason);
            setReassignStudent(null);
          }}
          isSaving={isSaving}
        />
      )}

      {/* Comprehensive Student Profile Detail & ID Card Modal */}
      {selectedDetailStudent && (
        <StudentDetailModal
          isOpen={!!selectedDetailStudent}
          onClose={() => setSelectedDetailStudent(null)}
          student={selectedDetailStudent}
          initialTab={initialModalTab}
          canEdit={canEdit}
          canDelete={canDelete}
          onEdit={(st) => handleOpenEdit(st)}
          onReassignRfid={(st) => setReassignStudent(st)}
          onSetRfidStatus={onSetRfidStatus}
          onDelete={(id, name) => {
            if (window.confirm(`Are you sure you want to delete ${name}?`)) {
              onDeleteStudent(id);
            }
          }}
        />
      )}
    </div>
  );
}
