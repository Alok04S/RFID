# SGGS Hostel ERP & RFID Gate Entry Security System

An intelligent, real-time Web & RFID-based Student Management, Gate Entry, and Curfew Attendance Management System built for **SGGSIE&T (Shri Guru Gobind Singhji Institute of Engineering and Technology, Nanded)**.

---

## 🌟 Key Features

1. **Gate Entry & Real-Time IST Verification**:
   - High-throughput gate check-in monitor with real-time WebSocket instant updates (<100ms).
   - Accurate IST (`Asia/Kolkata`) timestamps with 12-hour AM/PM formatting.
   - 50/50 responsive screen layout with full resident photo display.

2. **Automated Academic Year & Hostel Mapping**:
   - **Academic Year**: `FYBT` (First Year B.Tech), `SNBT` (Second Year B.Tech), `TYBT` (Third Year B.Tech), `FNBT` (Final Year B.Tech).
   - **Hostel Facility**: `SH` (Sahyadri), `K` (Krishna), `NA` (Nandgiri), `D` (Devgiri), `G` (Godavari).

3. **Curfew & Night Attendance System**:
   - Curfew start (8:30 PM), curfew lockdown (9:30 PM), buffer window (9:45 PM).
   - Tiered penalty escalation (Warning $\rightarrow$ ₹100 $\rightarrow$ ₹500 $\rightarrow$ ₹1,000 $\rightarrow$ Expulsion Flag).

4. **Multi-Role Role-Based Access**:
   - **Security Guard**: Gate Entry Monitor, Night Attendance scanner, instant verification.
   - **Hostel Warden**: Curfew controls, absence escalations, parent notifications, fine management.
   - **System Administrator**: CSV Master Importer, ZIP Photo batch processor, audit logs, student database.

---

## 🚀 Getting Started

### 1. Prerequisites
- **Node.js**: v18.0.0 or higher
- **npm**: v9.0.0 or higher

### 2. Backend Setup
```bash
cd backend
npm install
npm run dev
```
Backend runs on `http://localhost:5000`.

### 3. Frontend Setup
```bash
cd frontend
npm install
npm run dev
```
Frontend runs on `http://localhost:5173`.

---

## 🛠️ Technology Stack
- **Frontend**: React 18, Vite, Tailwind CSS, Lucide Icons, Canvas-Confetti, Howler Audio.
- **Backend**: Node.js, Express, SQLite3 (better-sqlite3), WebSockets (ws), Multer, Brevo SDK.
- **Hardware Integration**: Arduino Uno / ESP32, RC522 RFID / NFC Reader (13.56MHz & 125KHz).
