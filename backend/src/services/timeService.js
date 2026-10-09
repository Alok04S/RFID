// Time management service supporting real Indian Standard Time (IST - Asia/Kolkata), simulated time, and dynamic curfew windows

export const IST_TIMEZONE = 'Asia/Kolkata';

let simulatedTime = null; // null means use real system time, or a Date instance / ISO string
let timingConfig = {
  curfewStart: '20:30', // 8:30 PM IST
  curfewEnd: '21:30',   // 9:30 PM IST
  bufferEnd: '21:45'    // 9:45 PM IST
};

function timeStringToMinutes(timeStr) {
  if (!timeStr || !timeStr.includes(':')) return 0;
  const [h, m] = timeStr.split(':').map(Number);
  return (h || 0) * 60 + (m || 0);
}

function formatMinutesTo12Hour(minutes) {
  const h = Math.floor(minutes / 60) % 24;
  const m = minutes % 60;
  const period = h >= 12 ? 'PM' : 'AM';
  const displayH = h % 12 === 0 ? 12 : h % 12;
  return `${displayH}:${String(m).padStart(2, '0')} ${period}`;
}

export const timeService = {
  now() {
    if (simulatedTime) {
      return new Date(simulatedTime);
    }
    return new Date();
  },

  // Return Date parts computed specifically for Asia/Kolkata (IST)
  getIstParts(d = this.now()) {
    const parts = new Intl.DateTimeFormat('en-CA', {
      timeZone: IST_TIMEZONE,
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
      hour12: false
    }).formatToParts(d);
    
    const map = {};
    parts.forEach(p => {
      map[p.type] = p.value;
    });
    return map;
  },

  // Formatted IST datetime string for SQLite: 'YYYY-MM-DD HH:mm:ss'
  getIstSqliteDateTime(d = this.now()) {
    const p = this.getIstParts(d);
    return `${p.year}-${p.month}-${p.day} ${p.hour}:${p.minute}:${p.second}`;
  },

  // Standard ISO 8601 string with IST +05:30 offset
  getIstIsoString(d = this.now()) {
    const p = this.getIstParts(d);
    const ms = String(d.getMilliseconds()).padStart(3, '0');
    return `${p.year}-${p.month}-${p.day}T${p.hour}:${p.minute}:${p.second}.${ms}+05:30`;
  },

  // Formatted 12-hour IST time: e.g. '06:05:00 PM'
  getIstTimeString12h(d = this.now()) {
    return new Intl.DateTimeFormat('en-IN', {
      timeZone: IST_TIMEZONE,
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
      hour12: true
    }).format(d).toUpperCase();
  },

  setTimingConfig(newConfig) {
    timingConfig = {
      ...timingConfig,
      ...newConfig
    };
  },

  getTimingConfig() {
    return { ...timingConfig };
  },

  setSimulatedTime(timeStr) {
    if (!timeStr || timeStr === 'REALTIME') {
      simulatedTime = null;
      return { isSimulated: false, currentTime: this.getIstIsoString() };
    }

    const now = new Date();
    if (timeStr.includes(':') && !timeStr.includes('T')) {
      const [hours, minutes] = timeStr.split(':').map(Number);
      const newDate = new Date(now.getFullYear(), now.getMonth(), now.getDate(), hours, minutes, 0);
      simulatedTime = newDate;
    } else {
      simulatedTime = new Date(timeStr);
    }
    return { isSimulated: true, currentTime: this.getIstIsoString() };
  },

  getCurrentMode() {
    const p = this.getIstParts();
    const hours = parseInt(p.hour, 10);
    const minutes = parseInt(p.minute, 10);
    const totalMinutes = hours * 60 + minutes;

    const startMin = timeStringToMinutes(timingConfig.curfewStart); // e.g. 1230 (8:30 PM IST)
    const endMin = timeStringToMinutes(timingConfig.curfewEnd);     // e.g. 1290 (9:30 PM IST)
    const bufferMin = timeStringToMinutes(timingConfig.bufferEnd);  // e.g. 1305 (9:45 PM IST)

    const startLabel = formatMinutesTo12Hour(startMin);
    const endLabel = formatMinutesTo12Hour(endMin);
    const bufferLabel = formatMinutesTo12Hour(bufferMin);

    if (totalMinutes >= startMin && totalMinutes < endMin) {
      return {
        mode: 'NIGHT_ATTENDANCE',
        label: 'Night Attendance Active',
        description: `Attendance Window (${startLabel} – ${endLabel} IST)`,
        badgeColor: 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30',
        requiresVerification: true,
        minutesRemaining: endMin - totalMinutes,
        timings: { startLabel, endLabel, bufferLabel }
      };
    } else if (totalMinutes >= endMin && totalMinutes < bufferMin) {
      return {
        mode: 'BUFFER_WINDOW',
        label: 'Buffer Period Active',
        description: `Grace Buffer Window (${endLabel} – ${bufferLabel} IST)`,
        badgeColor: 'bg-amber-500/20 text-amber-400 border-amber-500/30 animate-pulse',
        requiresVerification: true,
        minutesRemaining: bufferMin - totalMinutes,
        timings: { startLabel, endLabel, bufferLabel }
      };
    } else if (totalMinutes >= bufferMin && totalMinutes < bufferMin + 30) {
      return {
        mode: 'POST_BUFFER',
        label: 'Attendance Locked / Post-Buffer',
        description: `Escalations Evaluated & Applied (Post ${bufferLabel} IST)`,
        badgeColor: 'bg-rose-500/20 text-rose-400 border-rose-500/30',
        requiresVerification: false,
        minutesRemaining: 0,
        timings: { startLabel, endLabel, bufferLabel }
      };
    } else {
      return {
        mode: 'DAY_ENTRY',
        label: 'Day Entry Mode',
        description: 'Standard Gate Security & Logging',
        badgeColor: 'bg-blue-500/20 text-blue-400 border-blue-500/30',
        requiresVerification: false,
        minutesRemaining: 0,
        timings: { startLabel, endLabel, bufferLabel }
      };
    }
  },

  getTodayString(d = this.now()) {
    const p = this.getIstParts(d);
    return `${p.year}-${p.month}-${p.day}`;
  }
};
