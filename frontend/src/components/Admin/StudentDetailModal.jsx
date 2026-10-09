import React, { useState, useEffect } from 'react';
import { 
  X, 
  DoorClosed, 
  DoorOpen, 
  Phone, 
  Mail, 
  User, 
  Building2, 
  GraduationCap, 
  CreditCard, 
  Radio, 
  Calendar, 
  ShieldAlert, 
  CheckCircle2, 
  Edit, 
  Trash2,
  Printer,
  Sparkles,
  QrCode
} from 'lucide-react';
import { formatAcademicYear } from '../../utils/academicYearUtils';
import { formatHostelDisplayName } from '../../utils/hostelUtils';

export function StudentDetailModal({
  isOpen,
  onClose,
  student,
  initialTab = 'PROFILE', // 'PROFILE' | 'ID_CARD'
  canEdit,
  canDelete,
  onEdit,
  onReassignRfid,
  onSetRfidStatus,
  onDelete
}) {
  const [activeTab, setActiveTab] = useState(initialTab);

  useEffect(() => {
    if (initialTab) {
      setActiveTab(initialTab);
    }
  }, [initialTab]);

  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') onClose();
    };
    if (isOpen) {
      window.addEventListener('keydown', handleKeyDown);
    }
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen || !student) return null;

  const isInside = student.current_status === 'INSIDE' || !student.current_status;

  const formatUid = (uid) => {
    if (!uid) return '04 A3 B1 7F 2E';
    const clean = String(uid).replace(/[^a-zA-Z0-9]/g, '');
    return clean.match(/.{1,2}/g)?.join(' ').toUpperCase() || uid;
  };

  const fallbackPhoto = `https://api.dicebear.com/7.x/initials/svg?seed=${encodeURIComponent(student.full_name)}&backgroundColor=0284c7,0d9488,4f46e5`;

  const handlePrintIdCard = () => {
    window.print();
  };

  return (
    <div 
      className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4 animate-in fade-in duration-150"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div className="bg-white border border-slate-200 rounded-3xl max-w-2xl w-full shadow-2xl overflow-hidden max-h-[94vh] flex flex-col">
        
        {/* Modal Header & Tab Navigation */}
        <div className="px-6 py-4 border-b border-slate-200 flex items-center justify-between bg-slate-50">
          <div className="flex items-center space-x-3">
            <div className="w-8 h-8 rounded-xl bg-blue-100 text-blue-700 flex items-center justify-center font-bold">
              {activeTab === 'ID_CARD' ? <CreditCard className="w-4 h-4" /> : <User className="w-4 h-4" />}
            </div>
            <div>
              <h3 className="text-base font-black text-slate-900 uppercase tracking-tight">
                {activeTab === 'ID_CARD' ? 'Official Student ID Card' : 'Resident Profile Details'}
              </h3>
              <p className="text-[11px] text-slate-500 font-medium">
                {student.full_name} ({student.reg_number})
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {/* View Switcher Tabs */}
            <div className="flex items-center bg-white border border-slate-200 rounded-xl p-1">
              <button
                onClick={() => setActiveTab('PROFILE')}
                className={`px-3 py-1 rounded-lg text-xs font-bold transition-colors ${
                  activeTab === 'PROFILE'
                    ? 'bg-blue-600 text-white shadow-xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                Profile
              </button>
              <button
                onClick={() => setActiveTab('ID_CARD')}
                className={`flex items-center gap-1 px-3 py-1 rounded-lg text-xs font-bold transition-colors ${
                  activeTab === 'ID_CARD'
                    ? 'bg-indigo-600 text-white shadow-xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                <CreditCard className="w-3.5 h-3.5" />
                <span>ID Card</span>
              </button>
            </div>

            <button
              onClick={onClose}
              className="p-1.5 rounded-xl bg-white hover:bg-slate-100 text-slate-400 hover:text-slate-700 border border-slate-200 transition-colors"
              title="Close (Esc)"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Modal Body */}
        <div className="p-6 overflow-y-auto space-y-6">
          
          {/* ================================================================ */}
          {/* TAB 1: OFFICIAL STUDENT ID CARD BADGE                            */}
          {/* ================================================================ */}
          {activeTab === 'ID_CARD' && (
            <div className="space-y-4">
              {/* ID Card Outer Container (Standard CR80 Aspect Ratio Feel) */}
              <div 
                id="printable-student-id-card"
                className="bg-gradient-to-br from-slate-900 via-slate-800 to-indigo-950 text-white rounded-3xl p-6 sm:p-7 shadow-2xl border-2 border-indigo-400/30 relative overflow-hidden"
              >
                {/* Decorative background holographic watermark & grid */}
                <div className="absolute -right-16 -top-16 w-56 h-56 bg-blue-500/10 rounded-full blur-3xl pointer-events-none" />
                <div className="absolute -left-16 -bottom-16 w-56 h-56 bg-purple-500/10 rounded-full blur-3xl pointer-events-none" />

                {/* College Branding Header */}
                <div className="border-b border-white/10 pb-4 mb-5 flex items-center justify-between gap-3">
                  <div className="flex items-center gap-3">
                    <img
                      src="/sggs_banner.png"
                      alt="SGGS IE&T"
                      className="h-10 max-w-[130px] object-contain brightness-0 invert"
                      onError={(e) => { e.target.style.display = 'none'; }}
                    />
                    <div>
                      <div className="text-[11px] font-black tracking-wider uppercase text-blue-300">
                        SGGS INSTITUTE OF ENGINEERING & TECHNOLOGY
                      </div>
                      <div className="text-[10px] text-slate-300 font-medium">
                        Vishnupuri, Nanded • Resident RFID Smart Card
                      </div>
                    </div>
                  </div>

                  {/* RFID Wave / Contactless Badge */}
                  <div className="flex flex-col items-end">
                    <div className="flex items-center gap-1 text-[10px] font-mono text-emerald-400 bg-emerald-950/60 border border-emerald-500/30 px-2 py-0.5 rounded-full">
                      <Radio className="w-3 h-3 animate-pulse" />
                      <span>125 KHz LF</span>
                    </div>
                    <div className="text-[9px] text-slate-400 font-mono mt-0.5">
                      Sr. #{student.sr_no || '1'}
                    </div>
                  </div>
                </div>

                {/* ID Card Main Grid: Photo + 10 Student Data Fields */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-5 items-start">
                  {/* Photo Column */}
                  <div className="flex flex-col items-center sm:items-start space-y-3">
                    <div className="w-32 h-40 sm:w-36 sm:h-44 rounded-2xl overflow-hidden bg-slate-800/90 border-2 border-white/30 shadow-lg relative shrink-0 flex items-center justify-center p-1">
                      <img
                        src={student.photo_url || fallbackPhoto}
                        alt={student.full_name}
                        className="max-w-full max-h-full w-auto h-auto object-contain rounded-xl"
                        style={{ objectFit: 'contain', objectPosition: 'center' }}
                        onError={(e) => {
                          e.target.src = fallbackPhoto;
                        }}
                      />
                    </div>

                    {/* Room Badge */}
                    <div className="w-32 sm:w-36 bg-amber-400 text-slate-950 font-black rounded-xl py-1 px-2 text-center shadow-md">
                      <div className="text-[9px] uppercase tracking-wider text-amber-950">HOSTEL ROOM</div>
                      <div className="text-xl font-mono leading-tight">{student.room_number || 'TBD'}</div>
                    </div>
                  </div>

                  {/* Information Details (2 Columns on right) */}
                  <div className="sm:col-span-2 space-y-3">
                    <div>
                      <div className="text-[10px] font-black uppercase tracking-wider text-blue-400">
                        FULL NAME
                      </div>
                      <div className="text-xl sm:text-2xl font-black text-white uppercase tracking-tight leading-tight break-words">
                        {student.full_name}
                      </div>
                    </div>

                    {/* All 10 Data Fields Grid */}
                    <div className="grid grid-cols-2 gap-2.5 text-xs pt-1">
                      {/* Registration No */}
                      <div className="bg-white/5 border border-white/10 rounded-xl p-2">
                        <div className="text-[9px] uppercase tracking-wider text-slate-400">Registration / Roll No.</div>
                        <div className="font-mono font-black text-blue-300 text-sm">{student.reg_number}</div>
                      </div>

                      {/* RFID Tag UID */}
                      <div className="bg-white/5 border border-white/10 rounded-xl p-2">
                        <div className="text-[9px] uppercase tracking-wider text-slate-400">RFID Smart UID</div>
                        <div className="font-mono font-black text-emerald-400 text-xs truncate">{formatUid(student.rfid_tag)}</div>
                      </div>

                      {/* Branch */}
                      <div className="bg-white/5 border border-white/10 rounded-xl p-2">
                        <div className="text-[9px] uppercase tracking-wider text-slate-400">Branch / Dept</div>
                        <div className="font-bold text-white truncate">{student.branch || 'Engg'}</div>
                      </div>

                      {/* Academic Year & Class */}
                      <div className="bg-white/5 border border-white/10 rounded-xl p-2">
                        <div className="text-[9px] uppercase tracking-wider text-slate-400">Academic Year</div>
                        <div className="font-bold text-white text-[11px] truncate">{formatAcademicYear(student.year || student.academic_year, { includeCode: true })}</div>
                      </div>

                      {/* Gender */}
                      <div className="bg-white/5 border border-white/10 rounded-xl p-2">
                        <div className="text-[9px] uppercase tracking-wider text-slate-400">Gender</div>
                        <div className="font-bold text-white">{student.gender || 'Not Specified'}</div>
                      </div>

                      {/* Student Mobile No */}
                      <div className="bg-white/5 border border-white/10 rounded-xl p-2">
                        <div className="text-[9px] uppercase tracking-wider text-slate-400">Student Phone</div>
                        <div className="font-mono font-bold text-slate-200">{student.contact_number || 'N/A'}</div>
                      </div>

                      {/* Parents Contact No */}
                      <div className="col-span-2 bg-white/5 border border-white/10 rounded-xl p-2">
                        <div className="text-[9px] uppercase tracking-wider text-slate-400">Parents / Guardian Contact</div>
                        <div className="font-mono font-bold text-slate-200">{student.parent_contact_number || 'N/A'}</div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* ID Card Footer with Microchip graphic and Barcode representation */}
                <div className="mt-5 pt-3 border-t border-white/10 flex items-center justify-between text-[10px] text-slate-400 font-mono">
                  <div className="flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-emerald-400 inline-block animate-ping" />
                    <span>STATUS: {(student.rfid_status || 'ACTIVE').toUpperCase()}</span>
                  </div>
                  <div className="text-right">
                    VALID FOR ACADEMIC SESSION {student.academic_year || '2024-2025'}
                  </div>
                </div>
              </div>

              {/* Print ID Card Button */}
              <div className="flex justify-end">
                <button
                  type="button"
                  onClick={handlePrintIdCard}
                  className="flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold text-slate-700 bg-slate-100 hover:bg-slate-200 border border-slate-300 transition-colors shadow-xs"
                >
                  <Printer className="w-4 h-4 text-slate-600" />
                  <span>Print ID Card</span>
                </button>
              </div>
            </div>
          )}

          {/* ================================================================ */}
          {/* TAB 2: RESIDENT PROFILE OVERVIEW                                 */}
          {/* ================================================================ */}
          {activeTab === 'PROFILE' && (
            <>
              {/* Hero Profile Section */}
              <div className="flex flex-col sm:flex-row items-center sm:items-start gap-5 bg-slate-50 border border-slate-200 rounded-2xl p-5">
                {/* Photo & Room */}
                <div className="flex flex-col items-center shrink-0">
                  <div className="w-32 h-36 sm:w-36 sm:h-44 rounded-2xl overflow-hidden bg-slate-100 border-2 border-slate-300 shadow-sm flex items-center justify-center p-1">
                    <img
                      src={student.photo_url || fallbackPhoto}
                      alt={student.full_name}
                      className="max-w-full max-h-full w-auto h-auto object-contain rounded-xl"
                      style={{ objectFit: 'contain', objectPosition: 'center' }}
                      onError={(e) => {
                        e.target.src = fallbackPhoto;
                      }}
                    />
                  </div>

                  {/* Bold Room Badge directly below photo */}
                  <div className="w-full bg-amber-50 border-2 border-amber-300 text-amber-900 rounded-xl px-3 py-1.5 text-center mt-2 shadow-xs">
                    <div className="text-[10px] font-black uppercase tracking-wider text-amber-700">ROOM</div>
                    <div className="text-2xl font-black font-mono leading-tight">{student.room_number}</div>
                  </div>
                </div>

                {/* Profile Identity Details */}
                <div className="flex-1 text-center sm:text-left space-y-2 min-w-0">
                  <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2">
                    <span
                      className={`inline-flex items-center gap-1 text-[11px] px-2.5 py-0.5 rounded-full font-bold uppercase border ${
                        (student.rfid_status || 'ACTIVE') === 'ACTIVE'
                          ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                          : student.rfid_status === 'LOST'
                          ? 'bg-amber-50 text-amber-700 border-amber-200'
                          : 'bg-rose-50 text-rose-700 border-rose-200'
                      }`}
                    >
                      <Radio className="w-3 h-3" />
                      RFID: {student.rfid_status || 'ACTIVE'}
                    </span>

                    <span className="text-[11px] px-2.5 py-0.5 rounded-full font-bold bg-blue-50 text-blue-700 border border-blue-200">
                      Batch: {student.academic_year || '2024-2025'}
                    </span>

                    <span className="text-[11px] px-2.5 py-0.5 rounded-full font-bold bg-slate-100 text-slate-700 border border-slate-200">
                      Gender: {student.gender || 'Not Specified'}
                    </span>
                  </div>

                  <h2 className="text-2xl sm:text-3xl font-black text-slate-900 uppercase tracking-tight">
                    {student.full_name}
                  </h2>

                  <div className="text-xs font-mono font-bold text-slate-600">
                    Registration / Roll No: <span className="text-blue-700 font-black">{student.reg_number}</span>
                  </div>

                  <div className="pt-2 grid grid-cols-2 gap-2 text-xs">
                    <div className="bg-white border border-slate-200 rounded-xl p-2.5">
                      <div className="text-[10px] text-slate-500 font-medium">Department & Academic Year</div>
                      <div className="font-bold text-slate-800 truncate">{student.branch}</div>
                      <div className="text-[11px] text-blue-700 font-bold">{formatAcademicYear(student.year || student.academic_year, { includeCode: true })}</div>
                    </div>

                    <div className="bg-white border border-slate-200 rounded-xl p-2.5">
                      <div className="text-[10px] text-slate-500 font-medium">Hostel Facility & Room</div>
                      <div className="font-bold text-slate-800 truncate">{formatHostelDisplayName(student.hostel_name, student.room_number)}</div>
                      <div className="text-[11px] text-amber-700 font-semibold font-mono">Room {student.room_number}</div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Contact & Parent Information */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                {/* Student Contact */}
                <div className="bg-white border border-slate-200 rounded-2xl p-4 space-y-2.5 shadow-xs">
                  <div className="text-[11px] font-black uppercase tracking-wider text-slate-500 border-b border-slate-100 pb-1.5 flex items-center gap-1.5">
                    <User className="w-3.5 h-3.5 text-blue-600" />
                    <span>Student Contact</span>
                  </div>

                  <div className="flex items-center justify-between py-1">
                    <span className="text-slate-500 flex items-center gap-1.5">
                      <Phone className="w-3.5 h-3.5 text-slate-400" />
                      <span>Phone</span>
                    </span>
                    <a 
                      href={`tel:${student.contact_number}`} 
                      className="font-mono font-bold text-blue-600 hover:underline"
                    >
                      {student.contact_number || 'N/A'}
                    </a>
                  </div>

                  <div className="flex items-center justify-between py-1">
                    <span className="text-slate-500 flex items-center gap-1.5">
                      <Mail className="w-3.5 h-3.5 text-slate-400" />
                      <span>Email</span>
                    </span>
                    <a 
                      href={`mailto:${student.email}`} 
                      className="font-mono text-slate-800 hover:text-blue-600 truncate max-w-[160px]"
                    >
                      {student.email || 'N/A'}
                    </a>
                  </div>
                </div>

                {/* Parent / Guardian Contact */}
                <div className="bg-white border border-slate-200 rounded-2xl p-4 space-y-2.5 shadow-xs">
                  <div className="text-[11px] font-black uppercase tracking-wider text-slate-500 border-b border-slate-100 pb-1.5 flex items-center gap-1.5">
                    <Building2 className="w-3.5 h-3.5 text-indigo-600" />
                    <span>Parent / Emergency Guardian</span>
                  </div>

                  <div className="flex items-center justify-between py-1">
                    <span className="text-slate-500 flex items-center gap-1.5">
                      <User className="w-3.5 h-3.5 text-slate-400" />
                      <span>Guardian</span>
                    </span>
                    <span className="font-bold text-slate-800">{student.parent_name || 'Guardian'}</span>
                  </div>

                  <div className="flex items-center justify-between py-1">
                    <span className="text-slate-500 flex items-center gap-1.5">
                      <Phone className="w-3.5 h-3.5 text-slate-400" />
                      <span>Phone</span>
                    </span>
                    <a 
                      href={`tel:${student.parent_contact_number}`} 
                      className="font-mono font-bold text-blue-600 hover:underline"
                    >
                      {student.parent_contact_number || 'N/A'}
                    </a>
                  </div>
                </div>
              </div>

              {/* RFID Smart Card Details */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                {/* RFID Card Details */}
                <div className="bg-white border border-slate-200 rounded-2xl p-4 space-y-2 shadow-xs">
                  <div className="text-[11px] font-black uppercase tracking-wider text-slate-500 border-b border-slate-100 pb-1.5 flex items-center gap-1.5">
                    <CreditCard className="w-3.5 h-3.5 text-emerald-600" />
                    <span>RFID Smart Card</span>
                  </div>

                  <div className="flex items-center justify-between py-1">
                    <span className="text-slate-500">Card UID</span>
                    <span className="font-mono font-bold text-slate-900 bg-slate-100 px-2 py-0.5 rounded text-[11px]">
                      {formatUid(student.rfid_tag)}
                    </span>
                  </div>

                  <div className="flex items-center justify-between py-1">
                    <span className="text-slate-500">Frequency / Protocol</span>
                    <span className="font-medium text-slate-700">{student.card_type || '125 KHz (EM4100)'}</span>
                  </div>
                </div>

                {/* RFID Card Status & Security Controls */}
                <div className="bg-white border border-slate-200 rounded-2xl p-4 space-y-2.5 shadow-xs">
                  <div className="text-[11px] font-black uppercase tracking-wider text-slate-500 border-b border-slate-100 pb-1.5 flex items-center justify-between">
                    <div className="flex items-center gap-1.5">
                      <Radio className="w-3.5 h-3.5 text-blue-600" />
                      <span>RFID Card Status</span>
                    </div>
                    <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold uppercase border ${
                      (student.rfid_status || 'ACTIVE') === 'ACTIVE'
                        ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                        : student.rfid_status === 'LOST'
                        ? 'bg-amber-50 text-amber-700 border-amber-200'
                        : 'bg-rose-50 text-rose-700 border-rose-200'
                    }`}>
                      {student.rfid_status || 'ACTIVE'}
                    </span>
                  </div>

                  <div className="flex items-center justify-between text-xs py-1">
                    <span className="text-slate-500">Gate IN Permission:</span>
                    <span className={`font-bold ${(student.rfid_status || 'ACTIVE') === 'ACTIVE' ? 'text-emerald-700' : 'text-rose-700'}`}>
                      {(student.rfid_status || 'ACTIVE') === 'ACTIVE' ? '✓ Authorized Access' : '✕ Blocked at Gate'}
                    </span>
                  </div>

                  {canEdit && onSetRfidStatus && (
                    <div className="pt-2 flex flex-wrap gap-2">
                      {(student.rfid_status || 'ACTIVE') === 'ACTIVE' ? (
                        <>
                          <button
                            onClick={() => {
                              const reason = window.prompt(`Reason for deactivating ${student.full_name}'s RFID card:`, 'Card damaged / invalid');
                              if (reason !== null) {
                                onSetRfidStatus(student.id, 'DEACTIVATED', reason);
                                onClose();
                              }
                            }}
                            className="flex-1 px-2.5 py-1.5 rounded-xl text-xs font-bold text-rose-700 bg-rose-50 hover:bg-rose-100 border border-rose-200 transition-colors"
                          >
                            Deactivate Card
                          </button>
                          <button
                            onClick={() => {
                              const reason = window.prompt(`Reason for marking ${student.full_name}'s card as lost:`, 'Resident reported lost card');
                              if (reason !== null) {
                                onSetRfidStatus(student.id, 'LOST', reason);
                                onClose();
                              }
                            }}
                            className="flex-1 px-2.5 py-1.5 rounded-xl text-xs font-bold text-amber-700 bg-amber-50 hover:bg-amber-100 border border-amber-200 transition-colors"
                          >
                            Mark Lost
                          </button>
                        </>
                      ) : (
                        <button
                          onClick={() => {
                            if (window.confirm(`Reactivate RFID card (${student.rfid_tag}) for ${student.full_name}?`)) {
                              onSetRfidStatus(student.id, 'ACTIVE', 'Reactivated by Admin');
                              onClose();
                            }
                          }}
                          className="w-full px-2.5 py-1.5 rounded-xl text-xs font-bold text-emerald-700 bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 transition-colors"
                        >
                          ✓ Reactivate RFID Card
                        </button>
                      )}
                    </div>
                  )}
                </div>
              </div>
            </>
          )}

        </div>

        {/* Modal Footer with Actions */}
        <div className="px-6 py-3.5 border-t border-slate-200 bg-slate-50 flex flex-wrap items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            {canEdit && (
              <>
                <button
                  onClick={() => {
                    onClose();
                    if (onEdit) onEdit(student);
                  }}
                  className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-bold text-slate-700 bg-white hover:bg-slate-100 border border-slate-200 shadow-xs transition-colors"
                >
                  <Edit className="w-3.5 h-3.5 text-slate-500" />
                  <span>Edit Profile</span>
                </button>

                <button
                  onClick={() => {
                    onClose();
                    if (onReassignRfid) onReassignRfid(student);
                  }}
                  className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-bold text-blue-700 bg-blue-50 hover:bg-blue-100 border border-blue-200 shadow-xs transition-colors"
                >
                  <Radio className="w-3.5 h-3.5 text-blue-600" />
                  <span>Reassign RFID Card</span>
                </button>
              </>
            )}

            {canDelete && (
              <button
                onClick={() => {
                  onClose();
                  if (onDelete) onDelete(student.id, student.full_name);
                }}
                className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-bold text-rose-700 hover:bg-rose-50 border border-rose-200 transition-colors"
              >
                <Trash2 className="w-3.5 h-3.5 text-rose-600" />
                <span>Delete</span>
              </button>
            )}
          </div>

          <button
            onClick={onClose}
            className="px-4 py-2 rounded-xl text-xs font-bold text-slate-700 bg-white hover:bg-slate-100 border border-slate-200 transition-colors"
          >
            Close
          </button>
        </div>

      </div>
    </div>
  );
}
