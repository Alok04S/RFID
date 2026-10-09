import React, { createContext, useContext, useState } from 'react';

const translations = {
  EN: {
    appTitle: 'HOSTEL GATE ENTRY & ATTENDANCE SYSTEM',
    appSubtitle: 'RFID Security Terminal',
    guardBooth: 'Guard Booth 1',
    securityGuard: 'Security Guard on Duty',
    logout: 'Log Out',
    backToHub: 'Back to Hub',
    readerConnected: 'RFID READER READY',
    readerSubtitle: 'USB RFID Scanner Active',
    
    // Hub
    selectMode: 'SELECT OPERATION MODE',
    selectModeSubtitle: 'Choose the active security system based on operational time',
    gateEntryTitle: 'GATE ENTRY SYSTEM',
    gateEntryTag: 'ALL-DAY ACTIVE',
    gateEntryDesc: 'Continuous all-day resident access. Student taps card -> Large Photo & Room appear -> Auto-resets in 4s. Interrupted by next student tap.',
    openGateEntry: 'OPEN GATE ENTRY MONITOR →',
    gateBullet1: 'Large photo & high-visibility Room badge appear on screen',
    gateBullet2: 'Hands-free: 4-second auto-reset for next student',
    gateBullet3: 'Instant green chime for valid cards & red buzzer for unknown',

    nightAttendanceTitle: 'NIGHT ATTENDANCE',
    nightAttendanceTag: 'EVENING SESSION',
    nightAttendanceDesc: 'Evening session (8:30 PM - 9:30 PM & Buffer). Face review + Guard presses ENTER to verify attendance.',
    openNightAttendance: 'OPEN NIGHT ATTENDANCE PORTAL →',
    nightBullet1: 'Review resident face against photo & press [ENTER]',
    nightBullet2: 'Automated 9:30 PM buffer warning emails via Brevo',
    nightBullet3: 'Direct call outreach & CSV export for Defaulters',

    // Monitor Instructions
    allDayGateEntry: 'GATE ENTRY MONITOR',
    zeroTouchSubtitle: 'Zero-Touch Resident Gate Access',
    cardDetected: 'RFID CARD DETECTED',
    scannedAt: 'Scanned At',
    entryRecorded: 'GATE ENTRY RECORDED',
    welcomeBack: 'Welcome Back! Guard verified resident face.',
    autoResetIn: 'Screen will auto-reset in',
    nextStudent: 'Next Student (Esc)',
    readyForScan: 'READY FOR RFID CARD TAP',
    readyForScanDesc: 'Ask resident to tap their ID card against the USB BlissKiss RFID reader. Student photo, credentials, and room number will automatically appear.',
    demoTapButton: '⚡ Tap Kartik\'s ID (Demo)',
    simulateCardTap: 'Simulate Card Tap (No Hardware Needed)',

    // Night Attendance Instructions
    nightAttendancePortal: 'NIGHT ATTENDANCE PORTAL',
    nightSubtitle: 'Face Review + Press ENTER to Verify Attendance',
    liveScannerTab: 'Live Card Scanner',
    defaultersTab: 'Defaulters Call List',
    faceReviewRequired: 'FACE REVIEW & VERIFICATION REQUIRED',
    attendanceVerified: 'ATTENDANCE VERIFIED PRESENT',
    alreadyPresent: 'ALREADY MARKED PRESENT TONIGHT',
    guardActionTitle: 'ACTION FOR SECURITY GUARD:',
    guardActionDesc: 'Inspect student\'s physical face against the displayed high-resolution photo. If verified, press ENTER key or click the green button below.',
    verifyButton: '✓ VERIFY & MARK PRESENT (PRESS ENTER)',
    verifying: 'MARKING ATTENDANCE...',
    attendanceRecordedMsg: 'Attendance Successfully Recorded for Tonight',
    nightScannerReady: 'NIGHT ATTENDANCE SCANNER READY',
    nightScannerDesc: 'Resident taps ID card on reader -> Photo appears -> Guard presses ENTER to confirm and mark Present.',
    defaultersTitle: 'DEFAULTER RESIDENTS • CALL LIST',
    defaultersSubtitle: 'Students who missed attendance. Guard can call directly or export the list.',
    exportCsv: 'Export CSV / Excel',
    printList: 'Print Call Sheet',
    callNow: 'Call',
    unregisteredTitle: 'UNREGISTERED RFID CARD',
    unregisteredDesc: 'This card is not in the hostel database. Do not allow entry.',
    dismiss: 'Dismiss (Esc)'
  },

  HI: {
    appTitle: 'HOSTEL GATE ENTRY & ATTENDANCE SYSTEM',
    appSubtitle: 'छात्रावास सुरक्षा डैशबोर्ड',
    guardBooth: 'Guard Booth 1',
    securityGuard: 'Security Guard on Duty',
    logout: 'Log Out',
    backToHub: 'Back to Hub',
    readerConnected: 'RFID READER READY',
    readerSubtitle: 'कार्ड रीडर तैयार है',
    
    // Hub
    selectMode: 'SELECT OPERATION MODE',
    selectModeSubtitle: 'कार्य प्रणाली चुनें (दिन भर का प्रवेश या रात्रि उपस्थिति)',
    gateEntryTitle: 'GATE ENTRY SYSTEM',
    gateEntryTag: 'ALL-DAY ACTIVE',
    gateEntryDesc: 'दिन भर छात्रों का प्रवेश। छात्र कार्ड स्वाइप करेगा ➔ बड़ा फोटो और कमरा नंबर दिखेगा ➔ 4 सेकंड में स्क्रीन रीसेट होगी।',
    openGateEntry: 'OPEN GATE ENTRY MONITOR →',
    gateBullet1: 'बड़ा फोटो और कमरा नंबर स्क्रीन पर दिखेगा',
    gateBullet2: '4 सेकंड में स्क्रीन अपने आप रीसेट होगी',
    gateBullet3: 'वैध कार्ड पर हरी ध्वनि और अवैध पर लाल बजर बजेगा',

    nightAttendanceTitle: 'NIGHT ATTENDANCE',
    nightAttendanceTag: 'EVENING SESSION',
    nightAttendanceDesc: 'शाम की उपस्थिति। छात्र कार्ड स्वाइप करेगा ➔ चेहरा फोटो से मिलाएं ➔ ENTER दबाकर उपस्थिति दर्ज करें।',
    openNightAttendance: 'OPEN NIGHT ATTENDANCE PORTAL →',
    nightBullet1: 'चेहरा फोटो से मिलाएं और [ENTER] दबाएं',
    nightBullet2: '9:30 बजे स्वचालित बफर ईमेल सूचना भेजी जाएगी',
    nightBullet3: 'अनुपस्थित छात्रों की कॉल सूची से सीधे फोन करें',

    // Monitor Instructions
    allDayGateEntry: 'GATE ENTRY MONITOR',
    zeroTouchSubtitle: 'Zero-Touch Resident Gate Access',
    cardDetected: 'RFID CARD DETECTED',
    scannedAt: 'Scanned At',
    entryRecorded: 'GATE ENTRY RECORDED',
    welcomeBack: 'प्रवेश की अनुमति है। चेहरा सत्यापित हुआ।',
    autoResetIn: 'Screen resets in',
    nextStudent: 'Next Student (Esc)',
    readyForScan: 'READY FOR RFID CARD TAP',
    readyForScanDesc: 'कार्ड स्वाइप के लिए तैयार। छात्र से कार्ड रीडर पर लगाने को कहें।',
    demoTapButton: '⚡ Tap Kartik\'s ID (Demo)',
    simulateCardTap: 'Simulate Card Tap (No Hardware Needed)',

    // Night Attendance Instructions
    nightAttendancePortal: 'NIGHT ATTENDANCE PORTAL',
    nightSubtitle: 'Face Review + Press ENTER to Verify Attendance',
    liveScannerTab: 'Live Card Scanner',
    defaultersTab: 'Defaulters Call List',
    faceReviewRequired: 'FACE REVIEW & VERIFICATION REQUIRED',
    attendanceVerified: 'ATTENDANCE VERIFIED PRESENT',
    alreadyPresent: 'ALREADY MARKED PRESENT TONIGHT',
    guardActionTitle: 'ACTION FOR SECURITY GUARD:',
    guardActionDesc: 'छात्र का असली चेहरा स्क्रीन पर दिख रही बड़ी फोटो से मिलाएं। सही होने पर ENTER दबाएं या हरा बटन दबाएं।',
    verifyButton: '✓ VERIFY & MARK PRESENT (PRESS ENTER)',
    verifying: 'MARKING ATTENDANCE...',
    attendanceRecordedMsg: 'Attendance Successfully Recorded for Tonight',
    nightScannerReady: 'NIGHT ATTENDANCE SCANNER READY',
    nightScannerDesc: 'छात्र कार्ड स्वाइप करेगा ➔ फोटो दिखेगा ➔ गार्ड ENTER दबाकर प्रेजेंट लगाएगा।',
    defaultersTitle: 'DEFAULTER RESIDENTS • CALL LIST',
    defaultersSubtitle: 'अनुपस्थित छात्रों की सूची। सीधे फोन करें या लिस्ट डाउनलोड करें।',
    exportCsv: 'Export CSV / Excel',
    printList: 'Print Call Sheet',
    callNow: 'Call',
    unregisteredTitle: 'UNREGISTERED RFID CARD',
    unregisteredDesc: 'यह कार्ड डेटाबेस में नहीं है। छात्र को अंदर न जाने दें।',
    dismiss: 'Dismiss (Esc)'
  },

  MR: {
    appTitle: 'HOSTEL GATE ENTRY & ATTENDANCE SYSTEM',
    appSubtitle: 'वसतिगृह सुरक्षा डॅशबोर्ड',
    guardBooth: 'Guard Booth 1',
    securityGuard: 'Security Guard on Duty',
    logout: 'Log Out',
    backToHub: 'Back to Hub',
    readerConnected: 'RFID READER READY',
    readerSubtitle: 'कार्ड रीडर तयार आहे',
    
    // Hub
    selectMode: 'SELECT OPERATION MODE',
    selectModeSubtitle: 'कार्यप्रणाली निवडा (दिवसभराचा प्रवेश किंवा रात्रीची हजेरी)',
    gateEntryTitle: 'GATE ENTRY SYSTEM',
    gateEntryTag: 'ALL-DAY ACTIVE',
    gateEntryDesc: 'दिवसभर विद्यार्थ्यांचा प्रवेश. विद्यार्थ्याने कार्ड टॅप केले ➔ फोटो व खोली क्रमांक दिसेल ➔ 4 सेकंदात आपोआप रीसेट होईल.',
    openGateEntry: 'OPEN GATE ENTRY MONITOR →',
    gateBullet1: 'मोठा फोटो आणि खोली क्रमांक स्क्रीनवर दिसेल',
    gateBullet2: '4 सेकंदात स्क्रीन आपोआप रीसेट होईल',
    gateBullet3: 'वैध कार्डवर हिरवा आवाज आणि अवैधवर लाल बजर वाजेल',

    nightAttendanceTitle: 'NIGHT ATTENDANCE',
    nightAttendanceTag: 'EVENING SESSION',
    nightAttendanceDesc: 'संध्याकाळची हजेरी. विद्यार्थ्याने कार्ड टॅप केले ➔ चेहरा फोटोशी पडताळा ➔ ENTER दाबून हजेरी नोंदवा.',
    openNightAttendance: 'OPEN NIGHT ATTENDANCE PORTAL →',
    nightBullet1: 'चेहरा फोटोशी पडताळा आणि [ENTER] दाबा',
    nightBullet2: '9:30 वाजता आपोआप बफर ईमेल सूचना पाठवली जाईल',
    nightBullet3: 'अनुपस्थित विद्यार्थ्यांची कॉल यादी व थेट फोन',

    // Monitor Instructions
    allDayGateEntry: 'GATE ENTRY MONITOR',
    zeroTouchSubtitle: 'Zero-Touch Resident Gate Access',
    cardDetected: 'RFID CARD DETECTED',
    scannedAt: 'Scanned At',
    entryRecorded: 'GATE ENTRY RECORDED',
    welcomeBack: 'प्रवेशास परवानगी आहे. चेहरा पडताळला गेला.',
    autoResetIn: 'Screen resets in',
    nextStudent: 'Next Student (Esc)',
    readyForScan: 'READY FOR RFID CARD TAP',
    readyForScanDesc: 'कार्ड स्कॅनसाठी तयार. विद्यार्थ्याला कार्ड रीडरवर लावण्यास सांगा.',
    demoTapButton: '⚡ Tap Kartik\'s ID (Demo)',
    simulateCardTap: 'Simulate Card Tap (No Hardware Needed)',

    // Night Attendance Instructions
    nightAttendancePortal: 'NIGHT ATTENDANCE PORTAL',
    nightSubtitle: 'Face Review + Press ENTER to Verify Attendance',
    liveScannerTab: 'Live Card Scanner',
    defaultersTab: 'Defaulters Call List',
    faceReviewRequired: 'FACE REVIEW & VERIFICATION REQUIRED',
    attendanceVerified: 'ATTENDANCE VERIFIED PRESENT',
    alreadyPresent: 'ALREADY MARKED PRESENT TONIGHT',
    guardActionTitle: 'ACTION FOR SECURITY GUARD:',
    guardActionDesc: 'स्क्रीनवरील मोठ्या फोटोशी विद्यार्थ्याचा चेहरा पडताळा. बरोबर असल्यास ENTER दाबा किंवा हिरवे बटण दाबा.',
    verifyButton: '✓ VERIFY & MARK PRESENT (PRESS ENTER)',
    verifying: 'MARKING ATTENDANCE...',
    attendanceRecordedMsg: 'Attendance Successfully Recorded for Tonight',
    nightScannerReady: 'NIGHT ATTENDANCE SCANNER READY',
    nightScannerDesc: 'विद्यार्थी कार्ड टॅप करेल ➔ फोटो दिसेल ➔ गार्ड ENTER दाबून प्रेझेंट लावेल.',
    defaultersTitle: 'DEFAULTER RESIDENTS • CALL LIST',
    defaultersSubtitle: 'अनुपस्थित विद्यार्थ्यांची यादी. फोन करा किंवा यादी डाउनलोड करा.',
    exportCsv: 'Export CSV / Excel',
    printList: 'Print Call Sheet',
    callNow: 'Call',
    unregisteredTitle: 'UNREGISTERED RFID CARD',
    unregisteredDesc: 'हे कार्ड डेटाबेसमध्ये नाही. आत जाऊ देऊ नका.',
    dismiss: 'Dismiss (Esc)'
  }
};

const LanguageContext = createContext();

export function LanguageProvider({ children }) {
  const [lang, setLang] = useState(() => {
    try {
      return localStorage.getItem('rfid_guard_lang') || 'EN';
    } catch (e) {
      return 'EN';
    }
  });

  const changeLanguage = (newLang) => {
    setLang(newLang);
    try {
      localStorage.setItem('rfid_guard_lang', newLang);
    } catch (e) {}
  };

  const t = translations[lang] || translations.EN;

  return (
    <LanguageContext.Provider value={{ lang, changeLanguage, t }}>
      {children}
    </LanguageContext.Provider>
  );
}

export function useLanguage() {
  return useContext(LanguageContext);
}
