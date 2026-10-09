// API client for communication with backend server

const BASE_URL = '/api';

export async function request(endpoint, options = {}) {
  const url = `${BASE_URL}${endpoint}`;
  const headers = {
    'Content-Type': 'application/json',
    ...(options.headers || {})
  };

  const config = {
    ...options,
    headers
  };

  if (options.body && typeof options.body === 'object') {
    config.body = JSON.stringify(options.body);
  }

  const response = await fetch(url, config);
  const data = await response.json().catch(() => ({}));

  if (!response.ok) {
    const error = new Error(data.error || data.message || `HTTP ${response.status}`);
    error.status = response.status;
    error.data = data;
    throw error;
  }

  return data;
}

export const api = {
  // Auth
  login: (credentials) => request('/auth/login', { method: 'POST', body: credentials }),

  // RFID & Gate In/Out
  scanCard: (rfid_tag) => request('/rfid/scan', { method: 'POST', body: { rfid_tag } }),
  scanGate: (payload) => request('/rfid/scan', { method: 'POST', body: payload }),
  getGateHistory: (queryStr = '') => request(`/rfid/history${queryStr ? '?' + queryStr : ''}`),
  getPresenceStats: (academic_year = '') => request(`/rfid/presence${academic_year ? '?academic_year=' + academic_year : ''}`),

  // Academic Years
  getAcademicYears: () => request('/academic-years'),
  createAcademicYear: (yearData) => request('/academic-years', { method: 'POST', body: yearData }),
  activateAcademicYear: (id, admin_name) => request(`/academic-years/${id}/activate`, { method: 'POST', body: { admin_name } }),

  // Attendance
  getTodayAttendance: () => request('/attendance/today'),
  getDefaulters: () => request('/attendance/defaulters'),
  verifyAttendance: (student_id, notes) => request('/attendance/verify', { method: 'POST', body: { student_id, notes } }),
  getAttendanceHistory: () => request('/attendance/history'),
  getSessionRecords: (sessionId) => request(`/attendance/sessions/${sessionId}/records`),

  // Penalties
  getPenalties: (status = 'ALL', academic_year = '') => {
    let url = `/penalties?status=${status}`;
    if (academic_year && academic_year !== 'ALL') url += `&academic_year=${encodeURIComponent(academic_year)}`;
    return request(url);
  },
  waivePenalty: (id, waive_reason, admin_name, role) => request(`/penalties/${id}/waive`, { method: 'POST', body: { waive_reason, admin_name, role } }),
  getAuditLogs: () => request('/penalties/audit-logs'),

  // Students
  getStudents: (academic_year = '', search = '', status = '') => {
    const params = new URLSearchParams();
    if (academic_year && academic_year !== 'ALL') params.append('academic_year', academic_year);
    if (search) params.append('search', search);
    if (status && status !== 'ALL') params.append('status', status);
    const qs = params.toString();
    return request(`/students${qs ? '?' + qs : ''}`);
  },
  getStudent: (id) => request(`/students/${id}`),
  createStudent: (studentData) => request('/students', { method: 'POST', body: studentData }),
  updateStudent: (id, studentData) => request(`/students/${id}`, { method: 'PUT', body: studentData }),
  deleteStudent: (id, admin_name) => request(`/students/${id}${admin_name ? '?admin_name=' + encodeURIComponent(admin_name) : ''}`, { method: 'DELETE' }),
  reassignRfid: (id, new_rfid_tag, reason, performer_name, performer_role) =>
    request(`/students/${id}/reassign-rfid`, { method: 'POST', body: { new_rfid_tag, reason, performer_name, performer_role } }),
  setRfidStatus: (id, rfid_status, reason, performer_name, performer_role) =>
    request(`/students/${id}/rfid-status`, { method: 'POST', body: { rfid_status, reason, performer_name, performer_role } }),
  bulkImportStudents: (data) => request('/students/bulk-import', { method: 'POST', body: data }),

  // Student Data & Photo Management APIs
  validateCsv: (csv_text) => request('/students/validate-csv', { method: 'POST', body: { csv_text } }),
  importCsv: (data) => request('/students/import-csv', { method: 'POST', body: data }),
  clearAllStudents: (admin_name, role) =>
    request('/students/clear-all', { method: 'POST', body: { confirm: 'CLEAR_ALL_STUDENT_DATA', admin_name, role } }),
  bulkDeleteStudents: (student_ids, admin_name, role) =>
    request('/students/bulk-delete', { method: 'POST', body: { student_ids, admin_name, role } }),
  uploadPhotoZip: async (file) => {
    const formData = new FormData();
    formData.append('zip_file', file);
    const res = await fetch('/api/students/upload-photo-zip', {
      method: 'POST',
      body: formData
    });
    let data = {};
    try {
      data = await res.json();
    } catch (e) {
      data = {};
    }
    if (!res.ok) {
      throw new Error(data.error || data.message || `Server Error (${res.status}): Failed to upload and validate ZIP archive.`);
    }
    return data;
  },
  commitPhotoZip: (batchId, admin_name) =>
    request('/students/commit-photo-zip', { method: 'POST', body: { batchId, admin_name } }),
  downloadAllStudentData: async () => {
    const res = await fetch('/api/students/download-all');
    if (!res.ok) {
      const errData = await res.json().catch(() => ({}));
      throw new Error(errData.error || `HTTP ${res.status}: Failed to download student data`);
    }
    const blob = await res.blob();
    const disposition = res.headers.get('content-disposition');
    let filename = `student_database_${new Date().toISOString().split('T')[0]}.csv`;
    if (disposition && disposition.includes('filename=')) {
      const match = disposition.match(/filename=["']?([^"';]+)["']?/);
      if (match && match[1]) filename = match[1];
    }
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    a.remove();
    window.URL.revokeObjectURL(url);
    return { success: true, filename };
  },
  downloadAllRfidData: async () => {
    const res = await fetch('/api/rfid/download-all');
    if (!res.ok) {
      const errData = await res.json().catch(() => ({}));
      throw new Error(errData.error || `HTTP ${res.status}: Failed to download RFID data`);
    }
    const blob = await res.blob();
    const disposition = res.headers.get('content-disposition');
    let filename = `rfid_data_${new Date().toISOString().split('T')[0]}.csv`;
    if (disposition && disposition.includes('filename=')) {
      const match = disposition.match(/filename=["']?([^"';]+)["']?/);
      if (match && match[1]) filename = match[1];
    }
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    a.remove();
    window.URL.revokeObjectURL(url);
    return { success: true, filename };
  },

  // System, Settings & Logs
  getSystemTime: () => request('/system/time'),
  setSystemTime: (time) => request('/system/time', { method: 'POST', body: { time } }),
  triggerBufferAutomation: () => request('/system/trigger-buffer', { method: 'POST' }),
  triggerEscalationEngine: () => request('/system/trigger-escalation', { method: 'POST' }),
  getEmailLogs: () => request('/system/emails'),
  getSettings: () => request('/system/settings'),
  saveSettings: (settings) => request('/system/settings', { method: 'POST', body: settings }),
  getSystemAuditLogs: (queryStr = '') => request(`/system/audit-logs${queryStr ? '?' + queryStr : ''}`),

  // Dashboard Stats
  getDashboardStats: () => request('/stats/dashboard')
};
