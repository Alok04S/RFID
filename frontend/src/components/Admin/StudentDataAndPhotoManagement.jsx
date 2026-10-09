import React, { useState, useMemo } from 'react';
import {
  FileSpreadsheet,
  UploadCloud,
  CheckCircle2,
  AlertTriangle,
  Download,
  RefreshCw,
  FolderArchive,
  Image,
  AlertCircle,
  FileCheck,
  Check,
  ChevronRight,
  XCircle,
  Calendar,
  Users,
  Eye,
  Filter,
  ShieldCheck,
  ArrowRight
} from 'lucide-react';
import { api } from '../../services/api';
import { audioService } from '../../services/audioService';
import { formatAcademicYear } from '../../utils/academicYearUtils';

const EXACT_CSV_HEADERS = [
  'Sr. No.',
  'RFID No.',
  'Room No.',
  'Registration No.',
  'Branch',
  'Name of the Student',
  'Student Mobile No.',
  'Parents Contact No.',
  'Year',
  'Gender'
];

export function StudentDataAndPhotoManagement({
  activeAcademicYear,
  academicYears = [],
  currentUser,
  onImportComplete
}) {
  const [activeTab, setActiveTab] = useState('CSV'); // 'CSV' | 'PHOTO_ZIP'
  const [selectedYear, setSelectedYear] = useState(activeAcademicYear || '2024-2025');

  // ============================================================================
  // SECTION A: CSV IMPORT STATE
  // ============================================================================
  const [csvFile, setCsvFile] = useState(null);
  const [csvFileName, setCsvFileName] = useState('');
  const [isValidatingCsv, setIsValidatingCsv] = useState(false);
  const [csvValidationResult, setCsvValidationResult] = useState(null);
  const [csvValidationError, setCsvValidationError] = useState('');
  const [skipDuplicates, setSkipDuplicates] = useState(true);
  const [isImportingCsv, setIsImportingCsv] = useState(false);
  const [csvImportSummary, setCsvImportSummary] = useState(null);
  const [csvPreviewPage, setCsvPreviewPage] = useState(1);
  const csvPageSize = 25;

  // ============================================================================
  // SECTION B: PHOTO ZIP STATE
  // ============================================================================
  const [zipFile, setZipFile] = useState(null);
  const [zipFileName, setZipFileName] = useState('');
  const [isUploadingZip, setIsUploadingZip] = useState(false);
  const [zipUploadError, setZipUploadError] = useState('');
  const [zipPreviewResult, setZipPreviewResult] = useState(null);
  const [photoFilter, setPhotoFilter] = useState('ALL'); // 'ALL' | 'MATCHED' | 'UNMATCHED' | 'CONFLICT' | 'MISSING'
  const [isCommittingPhotos, setIsCommittingPhotos] = useState(false);
  const [photoCommitSummary, setPhotoCommitSummary] = useState(null);
  const [photoPreviewPage, setPhotoPreviewPage] = useState(1);
  const photoPageSize = 25;

  // ============================================================================
  // CSV HANDLERS
  // ============================================================================
  const handleDownloadTemplate = () => {
    window.location.href = '/api/students/csv-template';
  };

  const handleCsvFileSelect = async (file) => {
    if (!file) return;
    if (!file.name.toLowerCase().endsWith('.csv')) {
      setCsvValidationError('Please select a valid .csv file.');
      return;
    }

    setCsvFile(file);
    setCsvFileName(file.name);
    setCsvValidationError('');
    setCsvValidationResult(null);
    setCsvImportSummary(null);
    setIsValidatingCsv(true);

    try {
      const reader = new FileReader();
      reader.onload = async (e) => {
        try {
          const text = e.target.result;
          const result = await api.validateCsv(text);
          setCsvValidationResult(result);
          setCsvPreviewPage(1);
        } catch (err) {
          setCsvValidationError(err.message || 'CSV validation failed.');
        } finally {
          setIsValidatingCsv(false);
        }
      };
      reader.readAsText(file);
    } catch (err) {
      setCsvValidationError('Failed to read file: ' + err.message);
      setIsValidatingCsv(false);
    }
  };

  const handleCsvDrop = (e) => {
    e.preventDefault();
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleCsvFileSelect(e.dataTransfer.files[0]);
    }
  };

  const handleImportCsv = async () => {
    if (!csvValidationResult || !csvValidationResult.validRows?.length) {
      alert('No valid student rows to import.');
      return;
    }

    setIsImportingCsv(true);
    try {
      const res = await api.importCsv({
        students: csvValidationResult.validRows,
        skipDuplicates,
        academic_year: selectedYear,
        admin_name: currentUser?.name || 'Administrator'
      });

      setCsvImportSummary(res);
      audioService.playSuccess();
      if (onImportComplete) onImportComplete();
    } catch (err) {
      alert('Import failed: ' + err.message);
    } finally {
      setIsImportingCsv(false);
    }
  };

  const handleDownloadRejectedCsv = () => {
    if (!csvValidationResult && !csvImportSummary) return;

    const invalid = csvValidationResult?.invalidRows || [];
    const skipped = csvImportSummary?.skippedRecords || [];

    if (invalid.length === 0 && skipped.length === 0) {
      alert('No rejected or skipped records to export.');
      return;
    }

    let csvContent = '\uFEFFRow,Registration No,RFID Tag,Student Name,Reason / Errors\r\n';

    invalid.forEach((inv) => {
      const rowNum = inv.rowNumber;
      const errors = (inv.errors || []).join('; ');
      const rawData = (inv.row || []).join(' | ');
      csvContent += `"${rowNum}","N/A","N/A","${rawData.replace(/"/g, '""')}","${errors.replace(/"/g, '""')}"\r\n`;
    });

    skipped.forEach((sk) => {
      csvContent += `"${sk.rowNumber || 'N/A'}","${sk.reg_number || ''}","${sk.rfid_tag || ''}","${(sk.full_name || '').replace(/"/g, '""')}","${(sk.reason || 'Skipped duplicate').replace(/"/g, '""')}"\r\n`;
    });

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `rejected_students_${Date.now()}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // ============================================================================
  // PHOTO ZIP HANDLERS
  // ============================================================================
  const handleZipFileSelect = async (file) => {
    if (!file) return;
    if (!file.name.toLowerCase().endsWith('.zip')) {
      setZipUploadError('Please select a valid .zip archive.');
      return;
    }

    setZipFile(file);
    setZipFileName(file.name);
    setZipUploadError('');
    setZipPreviewResult(null);
    setPhotoCommitSummary(null);
    setIsUploadingZip(true);

    try {
      const res = await api.uploadPhotoZip(file);
      setZipPreviewResult(res);
      setPhotoPreviewPage(1);
    } catch (err) {
      setZipUploadError(err.message || 'Failed to upload and validate ZIP archive.');
    } finally {
      setIsUploadingZip(false);
    }
  };

  const handleZipDrop = (e) => {
    e.preventDefault();
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleZipFileSelect(e.dataTransfer.files[0]);
    }
  };

  const handleCommitPhotos = async () => {
    if (!zipPreviewResult || !zipPreviewResult.summary?.batchId) {
      alert('No active photo batch session found. Please re-upload the ZIP file.');
      return;
    }

    setIsCommittingPhotos(true);
    try {
      const res = await api.commitPhotoZip(
        zipPreviewResult.summary.batchId,
        currentUser?.name || 'Administrator'
      );
      setPhotoCommitSummary(res);
      audioService.playSuccess();
      if (onImportComplete) onImportComplete();
    } catch (err) {
      alert('Photo commit failed: ' + err.message);
    } finally {
      setIsCommittingPhotos(false);
    }
  };

  // Filtered Photo Items
  const filteredPhotoItems = useMemo(() => {
    if (!zipPreviewResult) return [];
    const items = zipPreviewResult.items || [];
    const missing = zipPreviewResult.missingStudents || [];

    if (photoFilter === 'ALL') {
      return items;
    }
    if (photoFilter === 'MATCHED') {
      return items.filter((i) => i.status === 'MATCHED' || i.status === 'MATCHED_REPLACEMENT');
    }
    if (photoFilter === 'UNMATCHED') {
      return items.filter((i) => i.status === 'UNMATCHED');
    }
    if (photoFilter === 'CONFLICT') {
      return items.filter((i) => i.status === 'DUPLICATE_IN_ZIP' || i.status === 'INVALID_PATH' || i.status === 'CORRUPTED_IMAGE' || i.status === 'INVALID_FILENAME_FORMAT' || i.status === 'UNSUPPORTED_FORMAT');
    }
    if (photoFilter === 'MISSING') {
      return missing;
    }
    return items;
  }, [zipPreviewResult, photoFilter]);

  return (
    <div className="space-y-6">
      {/* Page Title & Batch Header */}
      <div className="bg-white border border-slate-200 rounded-3xl p-6 shadow-xs flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-blue-600 font-bold text-xs uppercase tracking-wider mb-1">
            <Users className="w-4 h-4" />
            <span>Master Data Ingestion Engine</span>
          </div>
          <h1 className="text-2xl font-black text-slate-900 tracking-tight">
            Student Data & Photo Management
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            Bulk import student demographic records via standardized CSV and upload student photographs via ZIP archive.
          </p>
        </div>

        {/* Academic Year Selector */}
        <div className="flex items-center gap-2 bg-slate-50 border border-slate-200 rounded-2xl px-3.5 py-2 shrink-0">
          <Calendar className="w-4 h-4 text-blue-600" />
          <span className="text-xs font-bold text-slate-600">Academic Batch:</span>
          <select
            value={selectedYear}
            onChange={(e) => setSelectedYear(e.target.value)}
            className="bg-transparent text-xs text-slate-900 font-black focus:outline-none cursor-pointer"
          >
            {academicYears.map((ay) => (
              <option key={ay.year_name} value={ay.year_name}>
                {ay.year_name}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Primary Section Switcher Tabs */}
      <div className="flex items-center gap-3 border-b border-slate-200 pb-3">
        <button
          onClick={() => setActiveTab('CSV')}
          className={`flex items-center gap-2.5 px-5 py-3 rounded-2xl text-xs font-black transition-all ${
            activeTab === 'CSV'
              ? 'bg-blue-600 text-white shadow-md shadow-blue-500/20'
              : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200'
          }`}
        >
          <FileSpreadsheet className="w-4 h-4" />
          <span>Section A: Student Data Upload (CSV)</span>
        </button>

        <button
          onClick={() => setActiveTab('PHOTO_ZIP')}
          className={`flex items-center gap-2.5 px-5 py-3 rounded-2xl text-xs font-black transition-all ${
            activeTab === 'PHOTO_ZIP'
              ? 'bg-blue-600 text-white shadow-md shadow-blue-500/20'
              : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200'
          }`}
        >
          <FolderArchive className="w-4 h-4" />
          <span>Section B: Student Photo ZIP Upload</span>
        </button>
      </div>

      {/* ==================================================================== */}
      {/* SECTION A: STUDENT DATA UPLOAD (CSV)                                 */}
      {/* ==================================================================== */}
      {activeTab === 'CSV' && (
        <div className="space-y-6">
          {/* Section A Guidelines & Download Template Card */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
            {/* Template Card */}
            <div className="bg-linear-to-br from-blue-50 to-indigo-50/50 border border-blue-200 rounded-3xl p-6 flex flex-col justify-between">
              <div className="space-y-3">
                <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-blue-100 text-blue-700 text-[10px] font-black uppercase">
                  <FileCheck className="w-3.5 h-3.5" />
                  <span>Standard 10-Column Format</span>
                </div>
                <h3 className="text-base font-black text-slate-900">Official CSV Template</h3>
                <p className="text-xs text-slate-600 leading-relaxed">
                  Download the official SGGS Hostel CSV template. The file contains the exact 10 columns in proper order, includes sample data, and retains leading zeroes (e.g. RFID tag numbers).
                </p>

                {/* Column list pill badges */}
                <div className="pt-2">
                  <div className="text-[10px] font-bold text-slate-500 uppercase mb-1.5">Required Headers:</div>
                  <div className="flex flex-wrap gap-1">
                    {EXACT_CSV_HEADERS.map((col, idx) => (
                      <span key={col} className="text-[10px] bg-white border border-blue-200 text-slate-700 px-2 py-0.5 rounded font-mono font-bold">
                        {idx + 1}. {col}
                      </span>
                    ))}
                  </div>
                </div>
              </div>

              <div className="pt-5">
                <button
                  onClick={handleDownloadTemplate}
                  className="w-full flex items-center justify-center gap-2 px-4 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold shadow-xs transition-colors"
                >
                  <Download className="w-4 h-4" />
                  <span>Download CSV Template (.csv)</span>
                </button>
              </div>
            </div>

            {/* Drag & Drop Upload Zone */}
            <div className="lg:col-span-2 bg-white border border-slate-200 rounded-3xl p-6 flex flex-col justify-center">
              <div
                onDragOver={(e) => e.preventDefault()}
                onDrop={handleCsvDrop}
                className="border-2 border-dashed border-slate-300 hover:border-blue-500 rounded-2xl p-8 flex flex-col items-center justify-center text-center bg-slate-50/50 hover:bg-blue-50/30 transition-all cursor-pointer group"
                onClick={() => document.getElementById('csv-file-input')?.click()}
              >
                <input
                  id="csv-file-input"
                  type="file"
                  accept=".csv,text/csv"
                  className="hidden"
                  onChange={(e) => {
                    if (e.target.files && e.target.files[0]) {
                      handleCsvFileSelect(e.target.files[0]);
                    }
                  }}
                />

                <div className="w-14 h-14 rounded-2xl bg-blue-100 text-blue-600 flex items-center justify-center mb-3 group-hover:scale-110 transition-transform">
                  <UploadCloud className="w-7 h-7" />
                </div>

                <div className="font-black text-slate-800 text-sm mb-1">
                  {csvFileName ? `Selected: ${csvFileName}` : 'Click to Browse or Drag & Drop Student CSV'}
                </div>
                <p className="text-xs text-slate-500 max-w-md">
                  Upload the completed student dataset (.csv format, UTF-8 encoded). Validates all 10 headers and checks for duplicate student records instantly.
                </p>

                {isValidatingCsv && (
                  <div className="mt-4 flex items-center gap-2 text-xs font-bold text-blue-600">
                    <RefreshCw className="w-4 h-4 animate-spin" />
                    <span>Analyzing CSV structure & checking database duplicates...</span>
                  </div>
                )}
              </div>

              {csvValidationError && (
                <div className="mt-3 bg-rose-50 border border-rose-200 text-rose-700 text-xs p-3.5 rounded-xl flex items-start gap-2.5">
                  <AlertCircle className="w-4 h-4 shrink-0 mt-0.5 text-rose-600" />
                  <div>
                    <div className="font-bold">CSV Validation Error</div>
                    <div>{csvValidationError}</div>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Validation Report & Pre-Import Preview */}
          {csvValidationResult && (
            <div className="bg-white border border-slate-200 rounded-3xl p-6 space-y-6 shadow-xs">
              {/* Summary Cards */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                <div className="bg-slate-50 border border-slate-200 rounded-2xl p-4">
                  <div className="text-[11px] font-bold text-slate-500 uppercase">Total Rows Detected</div>
                  <div className="text-2xl font-black text-slate-900 mt-1">{csvValidationResult.totalRows}</div>
                  <div className="text-[10px] text-slate-500 mt-0.5">Records in file</div>
                </div>

                <div className="bg-emerald-50 border border-emerald-200 rounded-2xl p-4">
                  <div className="text-[11px] font-bold text-emerald-700 uppercase">Valid Student Rows</div>
                  <div className="text-2xl font-black text-emerald-800 mt-1">{csvValidationResult.validCount}</div>
                  <div className="text-[10px] text-emerald-600 mt-0.5">Ready for import</div>
                </div>

                <div className="bg-amber-50 border border-amber-200 rounded-2xl p-4">
                  <div className="text-[11px] font-bold text-amber-700 uppercase">Existing DB Duplicates</div>
                  <div className="text-2xl font-black text-amber-800 mt-1">{csvValidationResult.dbDuplicateCount}</div>
                  <div className="text-[10px] text-amber-600 mt-0.5">Found in database</div>
                </div>

                <div className="bg-rose-50 border border-rose-200 rounded-2xl p-4">
                  <div className="text-[11px] font-bold text-rose-700 uppercase">Format Errors</div>
                  <div className="text-2xl font-black text-rose-800 mt-1">{csvValidationResult.invalidCount}</div>
                  <div className="text-[10px] text-rose-600 mt-0.5">Missing required fields</div>
                </div>
              </div>

              {/* Duplicate Records Warning & Skip Toggle */}
              {csvValidationResult.dbDuplicateCount > 0 && (
                <div className="bg-amber-50 border-2 border-amber-300 rounded-2xl p-4 space-y-3">
                  <div className="flex items-start gap-2.5">
                    <AlertTriangle className="w-5 h-5 text-amber-700 shrink-0 mt-0.5" />
                    <div className="flex-1">
                      <div className="font-black text-amber-900 text-sm">
                        Duplicate Records Detected ({csvValidationResult.dbDuplicateCount})
                      </div>
                      <div className="text-xs text-amber-800 mt-0.5 leading-relaxed">
                        Some student registration numbers or RFID tags in this file already exist in the database.
                        Choose whether to skip existing duplicates and import only new students.
                      </div>
                    </div>
                  </div>

                  {/* Skip duplicates toggle */}
                  <div className="flex items-center gap-3 pt-1 border-t border-amber-200">
                    <label className="flex items-center gap-2 cursor-pointer text-xs font-bold text-amber-900">
                      <input
                        type="checkbox"
                        checked={skipDuplicates}
                        onChange={(e) => setSkipDuplicates(e.target.checked)}
                        className="w-4 h-4 text-amber-600 rounded border-amber-300 focus:ring-amber-500"
                      />
                      <span>Skip duplicate student records during import (Recommended)</span>
                    </label>
                  </div>
                </div>
              )}

              {/* Action Bar */}
              <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 pt-2 border-t border-slate-100">
                <div className="flex items-center gap-2">
                  {(csvValidationResult.invalidCount > 0 || csvValidationResult.dbDuplicateCount > 0) && (
                    <button
                      onClick={handleDownloadRejectedCsv}
                      className="flex items-center gap-1.5 px-3.5 py-2 text-xs font-bold text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-xl transition-colors"
                    >
                      <Download className="w-3.5 h-3.5" />
                      <span>Download Rejected Records Report</span>
                    </button>
                  )}
                </div>

                <button
                  onClick={handleImportCsv}
                  disabled={isImportingCsv || csvValidationResult.validCount === 0}
                  className="flex items-center justify-center gap-2 px-6 py-2.5 rounded-xl text-xs font-black text-white bg-blue-600 hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed shadow-md shadow-blue-500/20 transition-all"
                >
                  {isImportingCsv ? (
                    <>
                      <RefreshCw className="w-4 h-4 animate-spin" />
                      <span>Importing Student Records...</span>
                    </>
                  ) : (
                    <>
                      <Check className="w-4 h-4" />
                      <span>Import {csvValidationResult.validCount} Students to Database</span>
                    </>
                  )}
                </button>
              </div>

              {/* Import Success / Summary Banner */}
              {csvImportSummary && (
                <div className="bg-emerald-50 border-2 border-emerald-300 rounded-2xl p-5 space-y-2">
                  <div className="flex items-center gap-2 text-emerald-900 font-black text-sm">
                    <CheckCircle2 className="w-5 h-5 text-emerald-600" />
                    <span>CSV Import Completed Successfully!</span>
                  </div>
                  <div className="text-xs text-emerald-800 grid grid-cols-1 sm:grid-cols-3 gap-2 pt-1 font-medium">
                    <div>Imported Records: <span className="font-black font-mono">{csvImportSummary.importedCount}</span></div>
                    <div>Skipped Duplicates: <span className="font-black font-mono">{csvImportSummary.skippedCount}</span></div>
                    <div>Failed Records: <span className="font-black font-mono">{csvImportSummary.failedCount}</span></div>
                  </div>
                </div>
              )}

              {/* Preview Table */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <h4 className="text-xs font-black text-slate-800 uppercase tracking-wider">
                    Pre-Import Student Data Preview ({csvValidationResult.validRows.length} Valid Rows)
                  </h4>
                  <div className="text-[11px] text-slate-500 font-mono">
                    Showing page {csvPreviewPage} of {Math.ceil(csvValidationResult.validRows.length / csvPageSize) || 1}
                  </div>
                </div>

                <div className="overflow-x-auto border border-slate-200 rounded-2xl">
                  <table className="w-full text-left text-xs text-slate-700">
                    <thead className="bg-slate-50 text-slate-500 uppercase font-mono text-[10px] border-b border-slate-200">
                      <tr>
                        <th className="px-3 py-2.5">Row</th>
                        <th className="px-3 py-2.5">Sr. No.</th>
                        <th className="px-3 py-2.5">Reg No.</th>
                        <th className="px-3 py-2.5">Student Full Name</th>
                        <th className="px-3 py-2.5">RFID UID</th>
                        <th className="px-3 py-2.5">Room</th>
                        <th className="px-3 py-2.5">Branch</th>
                        <th className="px-3 py-2.5">Year</th>
                        <th className="px-3 py-2.5">Gender</th>
                        <th className="px-3 py-2.5">Status</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 font-medium">
                      {csvValidationResult.validRows
                        .slice((csvPreviewPage - 1) * csvPageSize, csvPreviewPage * csvPageSize)
                        .map((row, idx) => (
                          <tr key={idx} className="hover:bg-slate-50/80">
                            <td className="px-3 py-2 font-mono text-slate-400 text-[10px]">{row.rowNumber}</td>
                            <td className="px-3 py-2 font-mono text-slate-600">{row.sr_no}</td>
                            <td className="px-3 py-2 font-mono font-bold text-blue-700">{row.reg_number}</td>
                            <td className="px-3 py-2 font-bold text-slate-900">{row.full_name}</td>
                            <td className="px-3 py-2 font-mono text-slate-700">{row.rfid_tag}</td>
                            <td className="px-3 py-2 font-bold text-slate-800">{row.room_number}</td>
                            <td className="px-3 py-2 text-slate-600 truncate max-w-[140px]">{row.branch}</td>
                            <td className="px-3 py-2 text-blue-700 font-bold text-[11px] whitespace-nowrap">{formatAcademicYear(row.year, { includeCode: true })}</td>
                            <td className="px-3 py-2 text-slate-600">{row.gender}</td>
                            <td className="px-3 py-2">
                              {row.isDbDuplicate ? (
                                <span className="inline-flex items-center gap-1 text-[10px] px-2 py-0.5 rounded-full font-bold bg-amber-50 text-amber-700 border border-amber-200">
                                  Duplicate
                                </span>
                              ) : (
                                <span className="inline-flex items-center gap-1 text-[10px] px-2 py-0.5 rounded-full font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                                  Valid
                                </span>
                              )}
                            </td>
                          </tr>
                        ))}
                    </tbody>
                  </table>
                </div>

                {/* Pagination Controls */}
                {csvValidationResult.validRows.length > csvPageSize && (
                  <div className="flex items-center justify-between text-xs pt-2">
                    <span className="text-slate-500">
                      Showing {(csvPreviewPage - 1) * csvPageSize + 1} to{' '}
                      {Math.min(csvPreviewPage * csvPageSize, csvValidationResult.validRows.length)} of{' '}
                      {csvValidationResult.validRows.length} entries
                    </span>
                    <div className="flex items-center gap-1">
                      <button
                        onClick={() => setCsvPreviewPage((p) => Math.max(1, p - 1))}
                        disabled={csvPreviewPage === 1}
                        className="px-3 py-1.5 rounded-lg border border-slate-200 text-slate-700 disabled:opacity-40 hover:bg-slate-50"
                      >
                        Previous
                      </button>
                      <button
                        onClick={() =>
                          setCsvPreviewPage((p) =>
                            Math.min(Math.ceil(csvValidationResult.validRows.length / csvPageSize), p + 1)
                          )
                        }
                        disabled={csvPreviewPage >= Math.ceil(csvValidationResult.validRows.length / csvPageSize)}
                        className="px-3 py-1.5 rounded-lg border border-slate-200 text-slate-700 disabled:opacity-40 hover:bg-slate-50"
                      >
                        Next
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      )}

      {/* ==================================================================== */}
      {/* SECTION B: STUDENT PHOTO ZIP UPLOAD                                  */}
      {/* ==================================================================== */}
      {activeTab === 'PHOTO_ZIP' && (
        <div className="space-y-6">
          {/* Instructions and Upload Area */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
            {/* Guidelines Card */}
            <div className="bg-linear-to-br from-indigo-50 to-purple-50/50 border border-indigo-200 rounded-3xl p-6 flex flex-col justify-between">
              <div className="space-y-3">
                <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-indigo-100 text-indigo-700 text-[10px] font-black uppercase">
                  <ShieldCheck className="w-3.5 h-3.5" />
                  <span>Automated Photo Matching</span>
                </div>
                <h3 className="text-base font-black text-slate-900">Photo ZIP Requirements</h3>
                <ul className="text-xs text-slate-600 space-y-2 list-disc list-inside leading-relaxed">
                  <li className="bg-amber-50 text-amber-900 border border-amber-200 p-2.5 rounded-xl font-medium list-none -ml-4">
                    <span className="font-bold flex items-center gap-1.5 text-amber-800 mb-1">
                      <AlertTriangle className="w-3.5 h-3.5 shrink-0" />
                      Sequential Import Workflow:
                    </span>
                    1. Import student records via <span className="font-bold">Section A (Student Data CSV)</span> first.<br />
                    2. Upload this photo ZIP, review matches, and click <span className="font-bold">&quot;Confirm &amp; Commit Photos&quot;</span>.
                  </li>
                  <li>
                    Package all photographs inside a single <span className="font-bold text-slate-800">.zip</span> archive (archives up to <span className="font-bold text-indigo-700">1 GB</span> supported).
                  </li>
                  <li>
                    Filename convention: <span className="font-mono font-black text-indigo-700 bg-white px-1.5 py-0.5 rounded border border-indigo-200">SrNo_RegistrationNo.ext</span>
                  </li>
                  <li>
                    Examples: <span className="font-mono text-indigo-800 font-bold">10_2024BIT002.jpg</span>, <span className="font-mono text-indigo-800 font-bold">11_2024BIT003.png</span>, <span className="font-mono text-indigo-800 font-bold">125_2024BIT099.jpeg</span>
                  </li>
                  <li>
                    The system splits at the <span className="font-bold text-slate-800">first underscore (_)</span>: the Sr. No. is ignored, and everything after the underscore is matched against the student&apos;s Registration No.
                  </li>
                  <li>
                    Supported extensions: <span className="font-mono font-bold text-indigo-700">.jpg, .jpeg, .png, .webp</span>
                  </li>
                  <li>
                    Files not containing an underscore separator are reported as invalid.
                  </li>
                  <li>
                    Re-uploading for an existing student automatically replaces their previous photograph and unlinks obsolete disk files.
                  </li>
                </ul>
              </div>

              <div className="pt-4 text-[11px] text-slate-500 italic">
                * Built-in security: protects against path traversal / Zip Slip and validates genuine binary image signatures.
              </div>
            </div>

            {/* Drag & Drop ZIP Upload Zone */}
            <div className="lg:col-span-2 bg-white border border-slate-200 rounded-3xl p-6 flex flex-col justify-center">
              <div
                onDragOver={(e) => e.preventDefault()}
                onDrop={handleZipDrop}
                className="border-2 border-dashed border-slate-300 hover:border-indigo-500 rounded-2xl p-8 flex flex-col items-center justify-center text-center bg-slate-50/50 hover:bg-indigo-50/30 transition-all cursor-pointer group"
                onClick={() => document.getElementById('zip-file-input')?.click()}
              >
                <input
                  id="zip-file-input"
                  type="file"
                  accept=".zip,application/zip"
                  className="hidden"
                  onChange={(e) => {
                    if (e.target.files && e.target.files[0]) {
                      handleZipFileSelect(e.target.files[0]);
                    }
                  }}
                />

                <div className="w-14 h-14 rounded-2xl bg-indigo-100 text-indigo-600 flex items-center justify-center mb-3 group-hover:scale-110 transition-transform">
                  <FolderArchive className="w-7 h-7" />
                </div>

                <div className="font-black text-slate-800 text-sm mb-1">
                  {zipFileName ? `Selected: ${zipFileName}` : 'Click to Browse or Drag & Drop Student Photo ZIP'}
                </div>
                <p className="text-xs text-slate-500 max-w-md">
                  Upload a ZIP archive of student photos. The system unpacks the archive in memory, verifies image signatures, and correlates filenames to existing student accounts.
                </p>

                {isUploadingZip && (
                  <div className="mt-4 flex flex-col items-center gap-1 text-xs font-bold text-indigo-700 bg-indigo-50/90 px-4 py-3 rounded-2xl border border-indigo-200">
                    <div className="flex items-center gap-2">
                      <RefreshCw className="w-4 h-4 animate-spin text-indigo-600" />
                      <span>Uploading & Processing ZIP Archive...</span>
                    </div>
                    <span className="text-[11px] font-medium text-slate-500">
                      Unpacking images, verifying binary signatures, and matching student registration numbers.
                    </span>
                  </div>
                )}
              </div>

              {zipUploadError && (
                <div className="mt-3 bg-rose-50 border border-rose-200 text-rose-700 text-xs p-3.5 rounded-xl flex items-start gap-2.5">
                  <AlertCircle className="w-4 h-4 shrink-0 mt-0.5 text-rose-600" />
                  <div>
                    <div className="font-bold">Photo ZIP Error</div>
                    <div>{zipUploadError}</div>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Photo Extraction Preview & Match Report */}
          {zipPreviewResult && (
            <div className="bg-white border border-slate-200 rounded-3xl p-6 space-y-6 shadow-xs">
              {/* Summary Cards */}
              <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
                <div className="bg-slate-50 border border-slate-200 rounded-2xl p-4">
                  <div className="text-[11px] font-bold text-slate-500 uppercase">Images in ZIP</div>
                  <div className="text-2xl font-black text-slate-900 mt-1">{zipPreviewResult.summary.totalImagesFound}</div>
                  <div className="text-[10px] text-slate-500 mt-0.5">Discovered files</div>
                </div>

                <div className="bg-emerald-50 border border-emerald-200 rounded-2xl p-4">
                  <div className="text-[11px] font-bold text-emerald-700 uppercase">Matched Photos</div>
                  <div className="text-2xl font-black text-emerald-800 mt-1">{zipPreviewResult.summary.matchedCount}</div>
                  <div className="text-[10px] text-emerald-600 mt-0.5">Matched to students</div>
                </div>

                <div className="bg-amber-50 border border-amber-200 rounded-2xl p-4">
                  <div className="text-[11px] font-bold text-amber-700 uppercase">Unmatched Files</div>
                  <div className="text-2xl font-black text-amber-800 mt-1">{zipPreviewResult.summary.unmatchedCount}</div>
                  <div className="text-[10px] text-amber-600 mt-0.5">No student in DB</div>
                </div>

                <div className="bg-rose-50 border border-rose-200 rounded-2xl p-4">
                  <div className="text-[11px] font-bold text-rose-700 uppercase">Conflicts / Errors</div>
                  <div className="text-2xl font-black text-rose-800 mt-1">
                    {zipPreviewResult.summary.duplicateConflictCount + zipPreviewResult.summary.invalidCount}
                  </div>
                  <div className="text-[10px] text-rose-600 mt-0.5">Duplicate/invalid in ZIP</div>
                </div>

                <div className="bg-indigo-50 border border-indigo-200 rounded-2xl p-4">
                  <div className="text-[11px] font-bold text-indigo-700 uppercase">Missing Photos</div>
                  <div className="text-2xl font-black text-indigo-800 mt-1">{zipPreviewResult.summary.missingCount}</div>
                  <div className="text-[10px] text-indigo-600 mt-0.5">Students with no photo</div>
                </div>
              </div>

              {/* Zero-Match Warning Banner */}
              {zipPreviewResult.summary.matchedCount === 0 && zipPreviewResult.summary.unmatchedCount > 0 && (
                <div className="bg-amber-50 border-2 border-amber-300 rounded-2xl p-5 space-y-2">
                  <div className="flex items-center gap-2 text-amber-900 font-black text-sm">
                    <AlertTriangle className="w-5 h-5 text-amber-600" />
                    <span>0 Photos Matched to Students</span>
                  </div>
                  <p className="text-xs text-amber-800 leading-relaxed font-medium">
                    None of the registration numbers in the ZIP archive matched existing student profiles in the database.
                    If you haven&apos;t imported the student list yet, or if you recently cleared the database, please switch to 
                    <strong className="text-amber-950 font-bold"> &quot;Section A: Student Data CSV&quot;</strong>, import your student records first, and then return here to upload the photo ZIP.
                  </p>
                </div>
              )}

              {/* Action Bar & Filter Tabs */}
              <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 pt-2 border-t border-slate-100">
                {/* Filter Pills */}
                <div className="flex flex-wrap items-center gap-1.5">
                  <button
                    onClick={() => { setPhotoFilter('ALL'); setPhotoPreviewPage(1); }}
                    className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-colors ${
                      photoFilter === 'ALL'
                        ? 'bg-slate-900 text-white'
                        : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                    }`}
                  >
                    All Files ({zipPreviewResult.items?.length || 0})
                  </button>
                  <button
                    onClick={() => { setPhotoFilter('MATCHED'); setPhotoPreviewPage(1); }}
                    className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-colors ${
                      photoFilter === 'MATCHED'
                        ? 'bg-emerald-700 text-white'
                        : 'bg-emerald-50 text-emerald-700 hover:bg-emerald-100'
                    }`}
                  >
                    Matched ({zipPreviewResult.summary.matchedCount})
                  </button>
                  <button
                    onClick={() => { setPhotoFilter('UNMATCHED'); setPhotoPreviewPage(1); }}
                    className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-colors ${
                      photoFilter === 'UNMATCHED'
                        ? 'bg-amber-700 text-white'
                        : 'bg-amber-50 text-amber-700 hover:bg-amber-100'
                    }`}
                  >
                    Unmatched ({zipPreviewResult.summary.unmatchedCount})
                  </button>
                  <button
                    onClick={() => { setPhotoFilter('MISSING'); setPhotoPreviewPage(1); }}
                    className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-colors ${
                      photoFilter === 'MISSING'
                        ? 'bg-indigo-700 text-white'
                        : 'bg-indigo-50 text-indigo-700 hover:bg-indigo-100'
                    }`}
                  >
                    Missing Photos ({zipPreviewResult.summary.missingCount})
                  </button>
                </div>

                {/* Confirm Import Button */}
                <button
                  onClick={handleCommitPhotos}
                  disabled={isCommittingPhotos || zipPreviewResult.summary.matchedCount === 0}
                  className={`flex items-center justify-center gap-2 px-6 py-2.5 rounded-xl text-xs font-black text-white transition-all shrink-0 ${
                    zipPreviewResult.summary.matchedCount > 0 && !photoCommitSummary
                      ? 'bg-emerald-600 hover:bg-emerald-700 shadow-lg shadow-emerald-500/30 ring-2 ring-emerald-400 ring-offset-2'
                      : 'bg-indigo-600 hover:bg-indigo-700 shadow-md shadow-indigo-500/20'
                  } disabled:opacity-50 disabled:cursor-not-allowed`}
                >
                  {isCommittingPhotos ? (
                    <>
                      <RefreshCw className="w-4 h-4 animate-spin" />
                      <span>Linking Photos to Student Profiles...</span>
                    </>
                  ) : (
                    <>
                      <Check className="w-4 h-4" />
                      <span>Confirm & Commit {zipPreviewResult.summary.matchedCount} Photos</span>
                    </>
                  )}
                </button>
              </div>

              {/* Photo Commit Summary Banner */}
              {photoCommitSummary && (
                <div className="bg-emerald-50 border-2 border-emerald-300 rounded-2xl p-5 space-y-1">
                  <div className="flex items-center gap-2 text-emerald-900 font-black text-sm">
                    <CheckCircle2 className="w-5 h-5 text-emerald-600" />
                    <span>Photo Import Committed Successfully!</span>
                  </div>
                  <div className="text-xs text-emerald-800">
                    {photoCommitSummary.message || `Linked ${photoCommitSummary.updatedCount} photos to student profiles.`}
                  </div>
                </div>
              )}

              {/* Photo Preview Table */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <h4 className="text-xs font-black text-slate-800 uppercase tracking-wider">
                    Photo Matching Preview ({filteredPhotoItems.length} records)
                  </h4>
                  <div className="text-[11px] text-slate-500 font-mono">
                    Showing page {photoPreviewPage} of {Math.ceil(filteredPhotoItems.length / photoPageSize) || 1}
                  </div>
                </div>

                <div className="overflow-x-auto border border-slate-200 rounded-2xl">
                  <table className="w-full text-left text-xs text-slate-700">
                    <thead className="bg-slate-50 text-slate-500 uppercase font-mono text-[10px] border-b border-slate-200">
                      <tr>
                        <th className="px-3 py-2.5">Registration No.</th>
                        <th className="px-3 py-2.5">Student Name</th>
                        <th className="px-3 py-2.5">Image Filename</th>
                        <th className="px-3 py-2.5">Match Status</th>
                        <th className="px-3 py-2.5">Details</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 font-medium">
                      {filteredPhotoItems.length === 0 ? (
                        <tr>
                          <td colSpan={5} className="text-center py-6 text-slate-400">
                            No records matching selected filter.
                          </td>
                        </tr>
                      ) : (
                        filteredPhotoItems
                          .slice((photoPreviewPage - 1) * photoPageSize, photoPreviewPage * photoPageSize)
                          .map((item, idx) => (
                            <tr key={idx} className="hover:bg-slate-50/80">
                              <td className="px-3 py-2 font-mono font-bold text-blue-700">
                                {item.reg_number || 'N/A'}
                              </td>
                              <td className="px-3 py-2 font-bold text-slate-900">
                                {item.student_name || 'N/A'}
                              </td>
                              <td className="px-3 py-2 font-mono text-slate-600">
                                {item.filename}
                              </td>
                              <td className="px-3 py-2">
                                {item.status === 'MATCHED' && (
                                  <span className="inline-flex items-center gap-1 text-[10px] px-2 py-0.5 rounded-full font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                                    <Check className="w-3 h-3" /> Matched (New)
                                  </span>
                                )}
                                {item.status === 'MATCHED_REPLACEMENT' && (
                                  <span className="inline-flex items-center gap-1 text-[10px] px-2 py-0.5 rounded-full font-bold bg-indigo-50 text-indigo-700 border border-indigo-200">
                                    <RefreshCw className="w-3 h-3" /> Replaces Existing
                                  </span>
                                )}
                                {item.status === 'UNMATCHED' && (
                                  <span className="inline-flex items-center gap-1 text-[10px] px-2 py-0.5 rounded-full font-bold bg-amber-50 text-amber-700 border border-amber-200">
                                    <AlertTriangle className="w-3 h-3" /> Unmatched
                                  </span>
                                )}
                                {item.status === 'DUPLICATE_IN_ZIP' && (
                                  <span className="inline-flex items-center gap-1 text-[10px] px-2 py-0.5 rounded-full font-bold bg-rose-50 text-rose-700 border border-rose-200">
                                    <XCircle className="w-3 h-3" /> Duplicate in ZIP
                                  </span>
                                )}
                                {item.status === 'PHOTO_MISSING' && (
                                  <span className="inline-flex items-center gap-1 text-[10px] px-2 py-0.5 rounded-full font-bold bg-slate-100 text-slate-600 border border-slate-200">
                                    Missing Photo
                                  </span>
                                )}
                                {(item.status === 'UNSUPPORTED_FORMAT' || item.status === 'CORRUPTED_IMAGE' || item.status === 'INVALID_PATH' || item.status === 'INVALID_FILENAME_FORMAT') && (
                                  <span className="inline-flex items-center gap-1 text-[10px] px-2 py-0.5 rounded-full font-bold bg-rose-50 text-rose-700 border border-rose-200">
                                    <AlertCircle className="w-3 h-3" /> {item.status === 'INVALID_FILENAME_FORMAT' ? 'Invalid Format' : 'Invalid File'}
                                  </span>
                                )}
                              </td>
                              <td className="px-3 py-2 text-slate-500 text-[11px]">
                                {item.message}
                              </td>
                            </tr>
                          ))
                      )}
                    </tbody>
                  </table>
                </div>

                {/* Pagination Controls */}
                {filteredPhotoItems.length > photoPageSize && (
                  <div className="flex items-center justify-between text-xs pt-2">
                    <span className="text-slate-500">
                      Showing {(photoPreviewPage - 1) * photoPageSize + 1} to{' '}
                      {Math.min(photoPreviewPage * photoPageSize, filteredPhotoItems.length)} of{' '}
                      {filteredPhotoItems.length} entries
                    </span>
                    <div className="flex items-center gap-1">
                      <button
                        onClick={() => setPhotoPreviewPage((p) => Math.max(1, p - 1))}
                        disabled={photoPreviewPage === 1}
                        className="px-3 py-1.5 rounded-lg border border-slate-200 text-slate-700 disabled:opacity-40 hover:bg-slate-50"
                      >
                        Previous
                      </button>
                      <button
                        onClick={() =>
                          setPhotoPreviewPage((p) =>
                            Math.min(Math.ceil(filteredPhotoItems.length / photoPageSize), p + 1)
                          )
                        }
                        disabled={photoPreviewPage >= Math.ceil(filteredPhotoItems.length / photoPageSize)}
                        className="px-3 py-1.5 rounded-lg border border-slate-200 text-slate-700 disabled:opacity-40 hover:bg-slate-50"
                      >
                        Next
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
