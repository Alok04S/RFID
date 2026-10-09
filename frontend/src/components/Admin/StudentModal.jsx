import React, { useState, useEffect, useRef } from 'react';
import { 
  X, 
  UserPlus, 
  Save, 
  AlertTriangle, 
  Radio, 
  CheckCircle2, 
  User, 
  Image as ImageIcon,
  Check
} from 'lucide-react';
import { getHostelNameFromRoom } from '../../utils/hostelUtils';
import { ACADEMIC_YEAR_OPTIONS, parseYearToNumber } from '../../utils/academicYearUtils';

export function StudentModal({ isOpen, onClose, onSave, student, isSaving }) {
  const [formData, setFormData] = useState({
    sr_no: '',
    rfid_tag: '',
    reg_number: '',
    full_name: '',
    branch: 'Information Technology',
    year: 1,
    gender: 'Not Specified',
    room_number: '',
    photo_url: '',
    contact_number: '',
    parent_name: 'Guardian',
    parent_contact_number: '',
    email: '',
    hostel_name: 'Shivaji Hostel',
    card_type: '125 KHz (EM4100)',
    status: 'Active'
  });

  const [error, setError] = useState('');
  
  // Dual RFID Entry State
  const [isListeningRfid, setIsListeningRfid] = useState(false);
  const [rfidScanSuccess, setRfidScanSuccess] = useState(false);
  const rfidBufferRef = useRef('');
  const lastKeyTimeRef = useRef(0);
  const rfidInputRef = useRef(null);

  useEffect(() => {
    if (student) {
      setFormData({
        sr_no: student.sr_no || '',
        rfid_tag: student.rfid_tag || '',
        reg_number: student.reg_number || '',
        full_name: student.full_name || '',
        branch: student.branch || 'Information Technology',
        year: parseYearToNumber(student.year),
        gender: student.gender || 'Not Specified',
        room_number: student.room_number || '',
        photo_url: student.photo_url || '',
        contact_number: student.contact_number || '',
        parent_name: student.parent_name || 'Guardian',
        parent_contact_number: student.parent_contact_number || '',
        email: student.email || '',
        hostel_name: student.hostel_name || 'Shivaji Hostel',
        card_type: student.card_type || '125 KHz (EM4100)',
        status: student.status || 'Active'
      });
      setRfidScanSuccess(false);
    } else {
      setFormData({
        sr_no: '',
        rfid_tag: '',
        reg_number: `2024BIT${Math.floor(100 + Math.random() * 900)}`,
        full_name: '',
        branch: 'Information Technology',
        year: 1,
        gender: 'Male',
        room_number: '',
        photo_url: '',
        contact_number: '+91 98765 00000',
        parent_name: 'Guardian',
        parent_contact_number: '+91 87654 00000',
        email: '',
        hostel_name: 'Shivaji Hostel',
        card_type: '125 KHz (EM4100)',
        status: 'Active'
      });
      setRfidScanSuccess(false);
    }
    setIsListeningRfid(false);
    setError('');
  }, [student, isOpen]);

  // ============================================================================
  // NATIVE USB HID KEYBOARD RFID SCAN LISTENER
  // ============================================================================
  useEffect(() => {
    if (!isOpen) return;

    const handleHidKeyDown = (e) => {
      const now = Date.now();
      const timeDiff = now - lastKeyTimeRef.current;
      lastKeyTimeRef.current = now;

      if (e.key === 'Enter') {
        const candidate = rfidBufferRef.current.trim();
        rfidBufferRef.current = '';

        if (candidate.length >= 4) {
          e.preventDefault();
          e.stopPropagation();

          setFormData((prev) => ({ ...prev, rfid_tag: candidate }));
          setRfidScanSuccess(true);
          setIsListeningRfid(false);

          if (rfidInputRef.current) {
            rfidInputRef.current.blur();
          }
          return;
        }
      }

      if (e.key.length > 1) return;

      if (timeDiff > 250) {
        rfidBufferRef.current = '';
      }

      rfidBufferRef.current += e.key;

      if (rfidBufferRef.current.length > 40) {
        rfidBufferRef.current = '';
      }
    };

    window.addEventListener('keydown', handleHidKeyDown, true);
    return () => window.removeEventListener('keydown', handleHidKeyDown, true);
  }, [isOpen]);

  if (!isOpen) return null;

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!formData.full_name || !formData.reg_number || !formData.rfid_tag || !formData.room_number) {
      setError('Please fill in all mandatory fields (Name, Roll No, RFID Tag, and Room Number).');
      return;
    }
    setError('');
    onSave(formData);
  };

  const displayPhotoUrl = formData.photo_url || (
    formData.full_name 
      ? `https://api.dicebear.com/7.x/initials/svg?seed=${encodeURIComponent(formData.full_name)}&backgroundColor=0284c7,0d9488,4f46e5`
      : null
  );

  return (
    <div 
      data-rfid-capture="true"
      className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4 animate-in fade-in duration-200"
    >
      <div className="bg-white border border-slate-200 rounded-3xl max-w-2xl w-full p-5 sm:p-8 shadow-2xl text-slate-900 max-h-[92vh] overflow-y-auto">
        
        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-slate-200 mb-5">
          <div className="flex items-center space-x-3">
            <div className="p-2.5 rounded-2xl bg-blue-100 text-blue-700">
              <UserPlus className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-black text-lg text-slate-900 uppercase">
                {student ? 'Edit Resident Profile' : 'Register New Resident'}
              </h3>
              <p className="text-xs text-slate-500 font-medium">
                Link RFID badge and resident information
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-500 cursor-pointer transition"
            title="Close (Esc)"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {error && (
          <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs flex items-center space-x-2 mb-4 animate-in fade-in">
            <AlertTriangle className="w-4 h-4 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4 text-xs">
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            
            {/* Full Name */}
            <div>
              <label className="block font-bold text-slate-700 uppercase tracking-wider mb-1">
                Name of the Student <span className="text-rose-500">*</span>
              </label>
              <input
                type="text"
                required
                value={formData.full_name}
                onChange={(e) => setFormData({ ...formData, full_name: e.target.value })}
                className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3.5 py-2.5 text-slate-900 focus:outline-none focus:border-blue-500 font-medium"
                placeholder="e.g., Kartik Pratap Singh"
              />
            </div>

            {/* Registration Number */}
            <div>
              <label className="block font-bold text-slate-700 uppercase tracking-wider mb-1">
                Registration No. <span className="text-rose-500">*</span>
              </label>
              <input
                type="text"
                required
                value={formData.reg_number}
                onChange={(e) => setFormData({ ...formData, reg_number: e.target.value })}
                className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3.5 py-2.5 text-slate-900 font-mono font-bold focus:outline-none focus:border-blue-500"
                placeholder="e.g., 2024BIT001"
              />
            </div>

            {/* RFID Card UID */}
            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="block font-bold text-slate-700 uppercase tracking-wider">
                  RFID No. <span className="text-rose-500">*</span>
                </label>
                <button
                  type="button"
                  onClick={() => {
                    setIsListeningRfid(true);
                    setRfidScanSuccess(false);
                    if (rfidInputRef.current) rfidInputRef.current.focus();
                  }}
                  className={`text-[11px] font-bold px-2.5 py-1 rounded-lg flex items-center gap-1 transition cursor-pointer ${
                    isListeningRfid 
                      ? 'bg-emerald-600 text-white shadow-xs animate-pulse' 
                      : 'bg-blue-50 text-blue-700 hover:bg-blue-100 border border-blue-200'
                  }`}
                  title="Click and tap card on 125 kHz USB Reader"
                >
                  <Radio className="w-3 h-3" />
                  <span>{isListeningRfid ? '📡 Ready! Tap 125 kHz Card' : '📡 Tap / Scan RFID Card'}</span>
                </button>
              </div>

              <div className="relative">
                <input
                  ref={rfidInputRef}
                  type="text"
                  required
                  value={formData.rfid_tag}
                  onChange={(e) => {
                    setFormData({ ...formData, rfid_tag: e.target.value });
                    setRfidScanSuccess(false);
                  }}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      e.preventDefault();
                      if (formData.rfid_tag.trim().length >= 4) {
                        setRfidScanSuccess(true);
                        setIsListeningRfid(false);
                      }
                    }
                  }}
                  className={`w-full bg-slate-50 border rounded-xl px-3.5 py-2.5 text-slate-900 font-mono font-bold tracking-wide focus:outline-none transition ${
                    rfidScanSuccess 
                      ? 'border-emerald-500 bg-emerald-50/50 text-emerald-900 ring-2 ring-emerald-400/30' 
                      : 'border-slate-300 focus:border-blue-500'
                  }`}
                  placeholder="e.g., 0008456123 (or tap card on USB reader)"
                />
              </div>

              {rfidScanSuccess && (
                <div className="mt-1.5 flex items-center gap-1.5 text-emerald-700 bg-emerald-50 border border-emerald-200 px-2.5 py-1 rounded-lg text-[11px] font-bold animate-in fade-in">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                  <span>Card Scanned Successfully! UID: <span className="font-mono">{formData.rfid_tag}</span></span>
                </div>
              )}
            </div>

            {/* Room Number */}
            <div>
              <label className="block font-bold text-slate-700 uppercase tracking-wider mb-1">
                Room No. <span className="text-rose-500">*</span>
              </label>
              <input
                type="text"
                required
                value={formData.room_number}
                onChange={(e) => {
                  const newRoom = e.target.value;
                  setFormData({
                    ...formData,
                    room_number: newRoom,
                    hostel_name: getHostelNameFromRoom(newRoom)
                  });
                }}
                className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3.5 py-2.5 text-slate-900 font-mono font-bold text-amber-700 focus:outline-none focus:border-blue-500"
                placeholder="e.g., SHGA01, K101, NA101, D101, G101"
              />
            </div>

            {/* Branch */}
            <div>
              <label className="block font-bold text-slate-700 uppercase tracking-wider mb-1">
                Branch
              </label>
              <input
                type="text"
                value={formData.branch}
                onChange={(e) => setFormData({ ...formData, branch: e.target.value })}
                className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3.5 py-2.5 text-slate-900 focus:outline-none focus:border-blue-500 font-medium"
                placeholder="e.g., Information Technology"
              />
            </div>

            {/* Year */}
            <div>
              <label className="block font-bold text-slate-700 uppercase tracking-wider mb-1">
                Academic Year
              </label>
              <select
                value={formData.year}
                onChange={(e) => setFormData({ ...formData, year: parseYearToNumber(e.target.value) })}
                className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3.5 py-2.5 text-slate-900 font-bold focus:outline-none focus:border-blue-500 cursor-pointer"
              >
                {ACADEMIC_YEAR_OPTIONS.map((opt) => (
                  <option key={opt.value} value={opt.value}>
                    {opt.label}
                  </option>
                ))}
              </select>
            </div>

            {/* Gender */}
            <div>
              <label className="block font-bold text-slate-700 uppercase tracking-wider mb-1">
                Gender
              </label>
              <select
                value={formData.gender}
                onChange={(e) => setFormData({ ...formData, gender: e.target.value })}
                className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3.5 py-2.5 text-slate-900 font-bold focus:outline-none focus:border-blue-500 cursor-pointer"
              >
                <option value="Male">Male</option>
                <option value="Female">Female</option>
                <option value="Other">Other</option>
                <option value="Not Specified">Not Specified</option>
              </select>
            </div>

            {/* Student Mobile No. */}
            <div>
              <label className="block font-bold text-slate-700 uppercase tracking-wider mb-1">
                Student Mobile No.
              </label>
              <input
                type="text"
                value={formData.contact_number}
                onChange={(e) => setFormData({ ...formData, contact_number: e.target.value })}
                className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3.5 py-2.5 text-slate-900 font-mono focus:outline-none focus:border-blue-500"
                placeholder="e.g., +91 98765 43210"
              />
            </div>

            {/* Parents Contact No. */}
            <div>
              <label className="block font-bold text-slate-700 uppercase tracking-wider mb-1">
                Parents Contact No.
              </label>
              <input
                type="text"
                value={formData.parent_contact_number}
                onChange={(e) => setFormData({ ...formData, parent_contact_number: e.target.value })}
                className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3.5 py-2.5 text-slate-900 font-mono focus:outline-none focus:border-blue-500"
                placeholder="e.g., +91 87654 32109"
              />
            </div>

            {/* Sr. No. */}
            <div>
              <label className="block font-bold text-slate-700 uppercase tracking-wider mb-1">
                Sr. No. (Optional)
              </label>
              <input
                type="number"
                value={formData.sr_no}
                onChange={(e) => setFormData({ ...formData, sr_no: e.target.value })}
                className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3.5 py-2.5 text-slate-900 font-mono focus:outline-none focus:border-blue-500"
                placeholder="e.g., 1"
              />
            </div>

          </div>

          {/* Photograph Information & Preview (No Obsolete Photo Link/URL) */}
          <div className="pt-3 border-t border-slate-200">
            <div className="flex items-center gap-4 bg-slate-50 border border-slate-200 rounded-2xl p-3.5">
              <div className="w-20 h-24 rounded-2xl overflow-hidden border-2 border-slate-300 shadow-sm bg-slate-100 flex items-center justify-center shrink-0 p-1">
                {displayPhotoUrl ? (
                  <img
                    src={displayPhotoUrl}
                    alt="Resident"
                    className="max-w-full max-h-full w-auto h-auto object-contain rounded-xl"
                    style={{ objectFit: 'contain', objectPosition: 'center' }}
                    onError={(e) => {
                      e.target.src = 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=600&q=80';
                    }}
                  />
                ) : (
                  <User className="w-8 h-8 text-slate-400" />
                )}
              </div>
              <div className="flex-1">
                <div className="text-xs font-bold text-slate-800">Student Photograph</div>
                <p className="text-[11px] text-slate-500 mt-0.5">
                  Photographs are matched automatically via ZIP upload using Registration No. (e.g. <span className="font-mono font-bold text-blue-700">{formData.reg_number || '2024BIT001'}.jpg</span>).
                </p>
                <div className="mt-2 inline-flex items-center gap-1.5 text-[10px] text-slate-600 bg-white border border-slate-200 px-2.5 py-1 rounded-lg">
                  <Check className="w-3 h-3 text-emerald-600" />
                  <span>Integrated with Student ID Card & Gate Monitor</span>
                </div>
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex items-center space-x-3 pt-4 border-t border-slate-200">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold py-3 px-4 rounded-xl transition cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSaving}
              className="flex-1 bg-blue-600 hover:bg-blue-700 text-white font-black py-3 px-4 rounded-xl transition shadow-md flex items-center justify-center space-x-1.5 cursor-pointer active:scale-95 disabled:opacity-50"
            >
              <Save className="w-4 h-4" />
              <span>{isSaving ? 'Saving Resident...' : 'Save Resident'}</span>
            </button>
          </div>

        </form>

      </div>
    </div>
  );
}

/**
 * ReassignRfidModal with 125 kHz USB HID Scanner Auto-Fill & Manual Typing
 */
export function ReassignRfidModal({ student, isOpen, onClose, onReassign, onConfirm, isSaving }) {
  const [newRfid, setNewRfid] = useState('');
  const [reason, setReason] = useState('Lost card replacement');
  const [isListeningRfid, setIsListeningRfid] = useState(false);
  const [rfidScanSuccess, setRfidScanSuccess] = useState(false);
  const rfidBufferRef = useRef('');
  const lastKeyTimeRef = useRef(0);
  const inputRef = useRef(null);

  useEffect(() => {
    setNewRfid('');
    setIsListeningRfid(false);
    setRfidScanSuccess(false);
  }, [student, isOpen]);

  useEffect(() => {
    if (!isOpen) return;

    const handleHidKey = (e) => {
      const now = Date.now();
      const diff = now - lastKeyTimeRef.current;
      lastKeyTimeRef.current = now;

      if (e.key === 'Enter') {
        const candidate = rfidBufferRef.current.trim();
        rfidBufferRef.current = '';

        if (candidate.length >= 4) {
          e.preventDefault();
          e.stopPropagation();
          setNewRfid(candidate);
          setRfidScanSuccess(true);
          setIsListeningRfid(false);
          return;
        }
      }

      if (e.key.length > 1) return;
      if (diff > 250) rfidBufferRef.current = '';
      rfidBufferRef.current += e.key;
      if (rfidBufferRef.current.length > 40) rfidBufferRef.current = '';
    };

    window.addEventListener('keydown', handleHidKey, true);
    return () => window.removeEventListener('keydown', handleHidKey, true);
  }, [isOpen]);

  if (!isOpen || !student) return null;

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!newRfid.trim()) return;
    const handler = onReassign || onConfirm;
    if (handler) handler(student.id, newRfid.trim(), reason);
  };

  return (
    <div 
      data-rfid-capture="true"
      className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in duration-200"
    >
      <div className="bg-white border border-slate-200 rounded-3xl max-w-md w-full p-6 sm:p-8 shadow-2xl text-slate-900">
        <div className="flex items-center justify-between pb-3.5 border-b border-slate-200 mb-4">
          <h3 className="font-black text-base text-slate-900 uppercase">Reassign RFID Card</h3>
          <button onClick={onClose} className="p-1.5 rounded-xl bg-slate-100 text-slate-500 cursor-pointer">
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="bg-slate-50 p-3.5 rounded-2xl mb-4 text-xs space-y-1 border border-slate-200">
          <div className="font-bold text-slate-900">{student.full_name} ({student.reg_number})</div>
          <div className="text-slate-500">Current RFID: <span className="font-mono text-amber-700 font-bold">{student.rfid_tag}</span></div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4 text-xs">
          <div>
            <div className="flex items-center justify-between mb-1">
              <label className="block font-bold text-slate-700 uppercase">New RFID Card UID</label>
              <button
                type="button"
                onClick={() => {
                  setIsListeningRfid(true);
                  setRfidScanSuccess(false);
                  if (inputRef.current) inputRef.current.focus();
                }}
                className={`text-[11px] font-bold px-2 py-0.5 rounded-lg flex items-center gap-1 transition ${
                  isListeningRfid 
                    ? 'bg-emerald-600 text-white animate-pulse' 
                    : 'bg-blue-50 text-blue-700 hover:bg-blue-100 border border-blue-200'
                }`}
              >
                <Radio className="w-3 h-3" />
                <span>{isListeningRfid ? '📡 Waiting for Tap...' : '📡 Tap Card'}</span>
              </button>
            </div>

            <input
              ref={inputRef}
              type="text"
              required
              placeholder="e.g., 0008456123 or tap on USB reader"
              value={newRfid}
              onChange={(e) => {
                setNewRfid(e.target.value);
                setRfidScanSuccess(false);
              }}
              className={`w-full bg-slate-50 border rounded-xl px-3.5 py-2.5 text-slate-900 font-mono font-bold focus:outline-none transition ${
                rfidScanSuccess ? 'border-emerald-500 bg-emerald-50/50 text-emerald-900' : 'border-slate-300 focus:border-blue-500'
              }`}
            />

            {rfidScanSuccess && (
              <div className="mt-1.5 flex items-center gap-1.5 text-emerald-700 bg-emerald-50 border border-emerald-200 px-2.5 py-1 rounded-lg text-[11px] font-bold">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                <span>Card Scanned Successfully! UID: <span className="font-mono">{newRfid}</span></span>
              </div>
            )}
          </div>

          <div>
            <label className="block font-bold text-slate-700 uppercase mb-1">Reason for Reassignment</label>
            <input
              type="text"
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3.5 py-2.5 text-slate-900 focus:outline-none focus:border-blue-500"
            />
          </div>

          <div className="flex items-center space-x-2 pt-3">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 bg-slate-100 text-slate-700 py-3 rounded-xl font-bold cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSaving || !newRfid.trim()}
              className="flex-1 bg-blue-600 hover:bg-blue-700 text-white py-3 rounded-xl font-bold transition shadow-md cursor-pointer disabled:opacity-50"
            >
              {isSaving ? 'Updating...' : 'Confirm Reassignment'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
