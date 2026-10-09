import React, { useState, useMemo } from 'react';
import {
  FileSpreadsheet,
  UploadCloud,
  CheckCircle2,
  AlertTriangle,
  ArrowRight,
  Download,
  RefreshCw,
  Sparkles,
  Check,
  Calendar,
  Eye
} from 'lucide-react';
import { api } from '../../services/api';
import { audioService } from '../../services/audioService';
import { formatAcademicYear } from '../../utils/academicYearUtils';

const SYSTEM_FIELDS = [
  { key: 'full_name', label: 'Full Name *', required: true, aliases: ['name', 'full_name', 'fullname', 'student_name', 'studentname', 'candidate_name', 'resident_name', 'student'] },
  { key: 'room_number', label: 'Room Number *', required: true, aliases: ['room', 'room_no', 'roomno', 'room_number', 'roomnumber', 'hostel_room', 'room#'] },
  { key: 'reg_number', label: 'Registration / Roll No', required: false, aliases: ['reg', 'reg_no', 'regno', 'reg_number', 'roll', 'roll_no', 'rollno', 'enrollment', 'enrollment_no', 'student_id', 'prn'] },
  { key: 'rfid_tag', label: 'RFID Card Tag / UID', required: false, aliases: ['rfid', 'rfid_tag', 'rfidtag', 'card_id', 'cardid', 'tag', 'tag_no', 'uid', 'nfc_id', 'nfc'] },
  { key: 'photo_url', label: 'Photo URL / Image', required: false, aliases: ['photo', 'photo_url', 'photourl', 'image', 'image_url', 'imageurl', 'avatar', 'picture', 'pic'] },
  { key: 'branch', label: 'Branch / Department', required: false, aliases: ['branch', 'dept', 'department', 'course', 'stream', 'discipline'] },
  { key: 'year', label: 'Class Year (1-4)', required: false, aliases: ['year', 'study_year', 'academic_year_level', 'class_year', 'sem', 'semester'] },
  { key: 'contact_number', label: 'Student Phone', required: false, aliases: ['phone', 'contact', 'mobile', 'cell', 'student_phone', 'student_mobile', 'contact_number', 'phone_number'] },
  { key: 'parent_name', label: 'Parent / Guardian Name', required: false, aliases: ['parent', 'parent_name', 'father_name', 'guardian', 'guardian_name', 'father'] },
  { key: 'parent_contact_number', label: 'Guardian Phone', required: false, aliases: ['parent_phone', 'parent_mobile', 'parent_contact', 'guardian_phone', 'guardian_mobile', 'emergency_contact'] },
  { key: 'email', label: 'Student Email', required: false, aliases: ['email', 'e_mail', 'mail', 'student_email'] },
  { key: 'hostel_name', label: 'Hostel Wing / Name', required: false, aliases: ['hostel', 'hostel_name', 'block', 'wing'] }
];

export function CsvMasterImporter({
  activeAcademicYear,
  academicYears = [],
  currentUser,
  onImportComplete
}) {
  const [selectedYear, setSelectedYear] = useState(activeAcademicYear || '2024-2025');
  const [step, setStep] = useState(1); // 1: Upload, 2: Map Columns, 3: Preview & Commit, 4: Done
  const [fileName, setFileName] = useState('');
  const [rawHeaders, setRawHeaders] = useState([]);
  const [rawRows, setRawRows] = useState([]);
  const [columnMapping, setColumnMapping] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [importResult, setImportResult] = useState(null);

  const normalizeText = (text) => {
    return String(text || '').toLowerCase().replace(/[^a-z0-9]/g, '');
  };

  const parseCsvText = (csvText) => {
    const lines = csvText
      .split(/\r?\n/)
      .map(line => line.trim())
      .filter(line => line.length > 0);

    if (lines.length < 2) {
      alert('CSV file must contain a header row and at least one student data row.');
      return;
    }

    const parseLine = (line) => {
      const result = [];
      let current = '';
      let inQuotes = false;
      const delimiter = line.includes('\t') ? '\t' : ',';

      for (let i = 0; i < line.length; i++) {
        const char = line[i];
        if (char === '"' || char === "'") {
          inQuotes = !inQuotes;
        } else if (char === delimiter && !inQuotes) {
          result.push(current.trim());
          current = '';
        } else {
          current += char;
        }
      }
      result.push(current.trim());
      return result;
    };

    const headers = parseLine(lines[0]);
    const rows = lines.slice(1).map(parseLine).filter(row => row.some(cell => cell.length > 0));

    setRawHeaders(headers);
    setRawRows(rows);

    // Automatic Sequence-Independent Column Detection
    const detectedMapping = {};
    headers.forEach((header, colIndex) => {
      const cleanHeader = normalizeText(header);

      for (const field of SYSTEM_FIELDS) {
        if (field.aliases.some(alias => cleanHeader === normalizeText(alias) || cleanHeader.includes(normalizeText(alias)))) {
          if (!Object.values(detectedMapping).includes(field.key)) {
            detectedMapping[colIndex] = field.key;
            break;
          }
        }
      }
    });

    setColumnMapping(detectedMapping);
    setStep(2);
  };

  const handleFileSelect = (file) => {
    if (!file) return;
    setFileName(file.name);
    const reader = new FileReader();
    reader.onload = (e) => {
      parseCsvText(e.target.result);
    };
    reader.readAsText(file);
  };

  const mappedStudents = useMemo(() => {
    return rawRows.map((row, rowIndex) => {
      const student = { _rawRowIndex: rowIndex + 1 };
      Object.entries(columnMapping).forEach(([colIndexStr, systemKey]) => {
        const colIndex = parseInt(colIndexStr, 10);
        if (systemKey && systemKey !== 'IGNORE' && row[colIndex] !== undefined) {
          student[systemKey] = row[colIndex].trim();
        }
      });

      if (!student.photo_url && student.full_name) {
        student.photo_url = `https://api.dicebear.com/7.x/initials/svg?seed=${encodeURIComponent(student.full_name)}&backgroundColor=0284c7,0d9488,4f46e5`;
      }

      return student;
    });
  }, [rawRows, columnMapping]);

  const handleCommitImport = async () => {
    try {
      setIsSubmitting(true);
      const res = await api.bulkImportStudents({
        students: mappedStudents,
        academic_year: selectedYear,
        admin_name: currentUser?.name || 'Administrator'
      });

      audioService.playSuccess();
      setImportResult(res);
      setStep(4);
      if (onImportComplete) onImportComplete();
    } catch (err) {
      audioService.playError();
      alert('Import failed: ' + err.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDownloadSample = () => {
    const sampleHeaders = 'Room Number,Full Name,Photo URL,Roll Number,RFID Tag,Branch,Class Year,Mobile,Guardian Mobile,Email';
    const sampleRow1 = 'A-101,Aarav Sharma,https://images.unsplash.com/photo-1539571696357-5a69c17a67c6,24CS1001,TAG-240101,Computer Science,1,+91 98765 00001,+91 98765 00002,aarav.sharma@hostel.edu';
    const sampleRow2 = 'B-205,Neha Verma,,24IT1002,,Information Tech,2,+91 98765 00003,+91 98765 00004,neha.verma@hostel.edu';
    const sampleCsv = `${sampleHeaders}\n${sampleRow1}\n${sampleRow2}\n`;

    const blob = new Blob([sampleCsv], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `Hostel_Master_Students_Template_${selectedYear}.csv`;
    a.click();
    window.URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-5">
      {/* Header Banner */}
      <div className="bg-white border border-slate-200 rounded-2xl p-5 flex flex-col md:flex-row md:items-center justify-between gap-4 shadow-xs">
        <div>
          <div className="flex items-center gap-2">
            <span className="p-1.5 rounded-lg bg-blue-50 border border-blue-200 text-blue-700">
              <FileSpreadsheet className="w-5 h-5" />
            </span>
            <h1 className="text-lg font-bold text-slate-900">Master Student CSV Import</h1>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            Upload student records in any column order. Columns are automatically mapped by intelligent header recognition.
          </p>
        </div>

        {/* Target Academic Year */}
        <div className="flex items-center gap-2 bg-slate-50 px-3 py-2 rounded-xl border border-slate-200 shrink-0">
          <Calendar className="w-4 h-4 text-blue-600" />
          <span className="text-xs text-slate-600">Target Session:</span>
          <select
            value={selectedYear}
            onChange={(e) => setSelectedYear(e.target.value)}
            className="bg-white border border-slate-200 text-slate-800 font-bold text-xs rounded-lg px-2 py-1 focus:outline-none"
          >
            {academicYears.map((ay) => (
              <option key={ay.year_name} value={ay.year_name}>
                {ay.year_name}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Steps Breadcrumbs */}
      <div className="grid grid-cols-3 gap-2">
        <div className={`p-2.5 rounded-xl border text-center transition-all ${step >= 1 ? 'bg-blue-50 border-blue-200 text-blue-800 font-bold' : 'bg-white border-slate-200 text-slate-400'}`}>
          <span className="text-xs">1. Choose File</span>
        </div>
        <div className={`p-2.5 rounded-xl border text-center transition-all ${step >= 2 ? 'bg-blue-50 border-blue-200 text-blue-800 font-bold' : 'bg-white border-slate-200 text-slate-400'}`}>
          <span className="text-xs">2. Verify Mapping</span>
        </div>
        <div className={`p-2.5 rounded-xl border text-center transition-all ${step >= 3 ? 'bg-blue-50 border-blue-200 text-blue-800 font-bold' : 'bg-white border-slate-200 text-slate-400'}`}>
          <span className="text-xs">3. Review & Import</span>
        </div>
      </div>

      {/* STEP 1: Upload */}
      {step === 1 && (
        <div className="space-y-4">
          <div
            onDragOver={(e) => e.preventDefault()}
            onDrop={(e) => {
              e.preventDefault();
              if (e.dataTransfer.files?.[0]) handleFileSelect(e.dataTransfer.files[0]);
            }}
            onClick={() => document.getElementById('csvFileInput')?.click()}
            className="border-2 border-dashed border-slate-300 hover:border-blue-500 bg-white rounded-3xl p-10 text-center transition-all flex flex-col items-center justify-center cursor-pointer shadow-xs"
          >
            <input
              id="csvFileInput"
              type="file"
              accept=".csv,.txt,.tsv"
              className="hidden"
              onChange={(e) => {
                if (e.target.files?.[0]) handleFileSelect(e.target.files[0]);
              }}
            />
            <div className="w-14 h-14 rounded-2xl bg-blue-50 text-blue-600 flex items-center justify-center mb-3">
              <UploadCloud className="w-8 h-8" />
            </div>
            <h3 className="text-base font-bold text-slate-900 mb-1">
              Select or Drag & Drop Student Master CSV File
            </h3>
            <p className="text-xs text-slate-500 max-w-md mb-4">
              Columns can appear in any order. The system automatically identifies headers (Name, Room, Roll, Photo, RFID, etc.).
            </p>
            <span className="px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs transition-all shadow-sm">
              Browse CSV File
            </span>
          </div>

          <div className="flex items-center justify-between p-4 bg-white border border-slate-200 rounded-2xl shadow-xs">
            <div>
              <div className="text-xs font-bold text-slate-800">Download Template File</div>
              <div className="text-[11px] text-slate-500">Need a sample structure to populate?</div>
            </div>
            <button
              onClick={handleDownloadSample}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-50 hover:bg-slate-100 text-slate-700 border border-slate-200 text-xs font-semibold transition-colors"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Download Sample CSV</span>
            </button>
          </div>
        </div>
      )}

      {/* STEP 2: Column Mapping */}
      {step === 2 && (
        <div className="bg-white border border-slate-200 rounded-2xl p-5 space-y-4 shadow-xs">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100">
            <div>
              <h3 className="text-sm font-bold text-slate-900">Detected Column Mappings</h3>
              <p className="text-xs text-slate-500 mt-0.5">
                From file <span className="font-bold text-slate-800">{fileName}</span> ({rawRows.length} rows detected)
              </p>
            </div>
            <button onClick={() => setStep(1)} className="text-xs text-slate-500 hover:text-slate-800 font-semibold">
              Cancel
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
            {rawHeaders.map((header, colIndex) => {
              const matchedKey = columnMapping[colIndex];
              const matchedField = SYSTEM_FIELDS.find(f => f.key === matchedKey);

              return (
                <div key={colIndex} className="p-3 bg-slate-50 rounded-xl border border-slate-200 space-y-1">
                  <div className="flex items-center justify-between">
                    <span className="text-[11px] font-bold text-slate-700">CSV Header:</span>
                    <span className="text-[10px] px-1.5 py-0.2 rounded bg-slate-200 text-slate-600 font-mono">
                      Col #{colIndex + 1}
                    </span>
                  </div>
                  <div className="text-xs font-bold text-blue-700 truncate">
                    "{header}"
                  </div>

                  <div className="pt-1">
                    <select
                      value={matchedKey || 'IGNORE'}
                      onChange={(e) => {
                        setColumnMapping({
                          ...columnMapping,
                          [colIndex]: e.target.value === 'IGNORE' ? null : e.target.value
                        });
                      }}
                      className="w-full bg-white border border-slate-300 text-slate-800 text-xs rounded-lg px-2.5 py-1.5 focus:outline-none focus:border-blue-500 font-medium"
                    >
                      <option value="IGNORE">-- Ignore Column --</option>
                      {SYSTEM_FIELDS.map((field) => (
                        <option key={field.key} value={field.key}>
                          {field.label}
                        </option>
                      ))}
                    </select>
                  </div>

                  {matchedField && (
                    <div className="flex items-center gap-1 text-[10px] text-emerald-700 font-bold">
                      <Check className="w-3 h-3" /> Auto-Matched
                    </div>
                  )}
                </div>
              );
            })}
          </div>

          <div className="flex items-center justify-between pt-3 border-t border-slate-100">
            <button
              onClick={() => setStep(1)}
              className="px-4 py-2 rounded-xl text-xs text-slate-600 hover:text-slate-900 bg-slate-100 font-semibold"
            >
              Back
            </button>
            <button
              onClick={() => setStep(3)}
              disabled={!Object.values(columnMapping).includes('full_name')}
              className="flex items-center gap-1.5 px-5 py-2 rounded-xl text-xs font-bold text-white bg-blue-600 hover:bg-blue-700 disabled:opacity-50 transition-all shadow-sm"
            >
              <span>Review Data</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {/* STEP 3: Preview */}
      {step === 3 && (
        <div className="bg-white border border-slate-200 rounded-2xl p-5 space-y-4 shadow-xs">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100">
            <div>
              <h3 className="text-sm font-bold text-slate-900">Preview Parsed Data ({mappedStudents.length} Students)</h3>
              <p className="text-xs text-slate-500 mt-0.5">
                Targeting Academic Year: <strong className="text-blue-700">{selectedYear}</strong>
              </p>
            </div>
            <button onClick={() => setStep(2)} className="text-xs text-slate-500 hover:text-slate-800 font-semibold">
              Adjust Mapping
            </button>
          </div>

          <div className="overflow-x-auto rounded-xl border border-slate-200 max-h-[350px]">
            <table className="w-full text-left text-xs text-slate-700">
              <thead className="bg-slate-50 text-slate-500 text-[10px] uppercase font-mono border-b border-slate-200">
                <tr>
                  <th className="py-2.5 px-3">#</th>
                  <th className="py-2.5 px-3">Resident</th>
                  <th className="py-2.5 px-3">Room</th>
                  <th className="py-2.5 px-3">Roll / Reg</th>
                  <th className="py-2.5 px-3">RFID Tag</th>
                  <th className="py-2.5 px-3">Branch & Year</th>
                  <th className="py-2.5 px-3">Phone</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 font-medium">
                {mappedStudents.slice(0, 15).map((s, idx) => (
                  <tr key={idx} className="hover:bg-slate-50/80">
                    <td className="py-2 px-3 text-slate-400 font-mono text-[10px]">{idx + 1}</td>
                    <td className="py-2 px-3">
                      <div className="flex items-center gap-2">
                        <img
                          src={s.photo_url}
                          alt={s.full_name}
                          className="w-6 h-6 rounded-full object-cover object-center border border-slate-200 shrink-0"
                          style={{ objectPosition: 'center' }}
                        />
                        <span className="font-bold text-slate-900">{s.full_name}</span>
                      </div>
                    </td>
                    <td className="py-2 px-3">
                      <span className="px-2 py-0.5 rounded bg-blue-50 text-blue-700 border border-blue-200 font-bold text-[11px]">
                        {s.room_number || 'TBD'}
                      </span>
                    </td>
                    <td className="py-2 px-3 font-mono text-[11px] text-slate-600">
                      {s.reg_number || 'Auto-Gen'}
                    </td>
                    <td className="py-2 px-3 font-mono text-[11px] text-slate-800 font-bold">
                      {s.rfid_tag || 'Auto-Gen'}
                    </td>
                    <td className="py-2 px-3 text-slate-600">
                      {s.branch || 'Engineering'} ({formatAcademicYear(s.year, { includeCode: true })})
                    </td>
                    <td className="py-2 px-3 text-slate-600 font-mono">
                      {s.contact_number || '-'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="flex items-center justify-between pt-3 border-t border-slate-100">
            <button
              onClick={() => setStep(2)}
              className="px-4 py-2 rounded-xl text-xs text-slate-600 hover:text-slate-900 bg-slate-100 font-semibold"
            >
              Back
            </button>
            <button
              onClick={handleCommitImport}
              disabled={isSubmitting}
              className="flex items-center gap-2 px-6 py-2.5 rounded-xl text-xs font-bold text-white bg-blue-600 hover:bg-blue-700 disabled:opacity-50 transition-all shadow-sm"
            >
              {isSubmitting ? (
                <>
                  <RefreshCw className="w-4 h-4 animate-spin" />
                  <span>Importing Batch Records...</span>
                </>
              ) : (
                <>
                  <CheckCircle2 className="w-4 h-4" />
                  <span>Commit Import into {selectedYear}</span>
                </>
              )}
            </button>
          </div>
        </div>
      )}

      {/* STEP 4: Done */}
      {step === 4 && importResult && (
        <div className="bg-white border border-slate-200 rounded-2xl p-6 text-center space-y-4 shadow-xs">
          <div className="w-12 h-12 rounded-2xl bg-emerald-100 text-emerald-700 flex items-center justify-center mx-auto">
            <CheckCircle2 className="w-7 h-7" />
          </div>
          <h2 className="text-lg font-bold text-slate-900">Master Import Succeeded!</h2>
          <p className="text-xs text-slate-600 max-w-md mx-auto">
            {importResult.message}
          </p>

          <div className="grid grid-cols-2 max-w-xs mx-auto gap-3 pt-2">
            <div className="p-3 bg-slate-50 rounded-xl border border-slate-200">
              <div className="text-[10px] text-slate-500 font-bold uppercase">Enrolled</div>
              <div className="text-xl font-bold text-emerald-700">{importResult.importedCount}</div>
            </div>
            <div className="p-3 bg-slate-50 rounded-xl border border-slate-200">
              <div className="text-[10px] text-slate-500 font-bold uppercase">Updated</div>
              <div className="text-xl font-bold text-blue-700">{importResult.updatedCount}</div>
            </div>
          </div>

          <div className="pt-2">
            <button
              onClick={() => {
                setStep(1);
                setRawHeaders([]);
                setRawRows([]);
                setColumnMapping({});
                setImportResult(null);
              }}
              className="px-4 py-2 rounded-xl text-xs font-bold bg-slate-100 hover:bg-slate-200 text-slate-700"
            >
              Import Another File
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
