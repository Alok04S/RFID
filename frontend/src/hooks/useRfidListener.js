import { useEffect, useRef } from 'react';

/**
 * Global Keyboard Listener for USB RFID Card Readers in HID Keyboard Emulation Mode.
 * Captures card scans from anywhere on the page without requiring manual cursor focus.
 */
export function useRfidListener(onScan, enabled = true) {
  const bufferRef = useRef('');
  const lastKeyTimeRef = useRef(0);
  const onScanRef = useRef(onScan);

  useEffect(() => {
    onScanRef.current = onScan;
  }, [onScan]);

  useEffect(() => {
    if (!enabled) return;

    function handleKeyDown(e) {
      // If a modal with dedicated RFID capture is open, let that modal handle the scan
      if (document.querySelector('[data-rfid-capture="true"]')) {
        bufferRef.current = '';
        return;
      }

      // If user is actively typing in a standard text input/textarea that is not an RFID input,
      // allow normal typing unless it's a superfast RFID scan burst.
      const target = e.target;
      const isInput = target && (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA');

      const currentTime = Date.now();
      const timeDiff = currentTime - lastKeyTimeRef.current;
      lastKeyTimeRef.current = currentTime;

      // Enter key marks end of card scan
      if (e.key === 'Enter') {
        const scannedCode = bufferRef.current.trim();
        bufferRef.current = '';

        if (scannedCode.length >= 3) {
          // If in an input, prevent submitting parent form
          e.preventDefault();
          console.log('[RFID Listener] Captured HID Scan:', scannedCode);
          if (onScanRef.current) {
            onScanRef.current(scannedCode);
          }
        }
        return;
      }

      // Ignore single modifier keys (Shift, Ctrl, Alt, etc.)
      if (e.key.length > 1) {
        return;
      }

      // If more than 600ms passed since last keystroke and not in an input, reset buffer
      if (timeDiff > 600) {
        bufferRef.current = '';
      }

      // If user is focused on an input and typing slowly (manual typing > 80ms/char), let standard input handle it
      if (isInput && timeDiff > 100 && bufferRef.current.length === 0) {
        return;
      }

      bufferRef.current += e.key;

      // Auto-clear buffer if it gets abnormally long without Enter
      if (bufferRef.current.length > 50) {
        bufferRef.current = '';
      }
    }

    window.addEventListener('keydown', handleKeyDown, true);
    return () => {
      window.removeEventListener('keydown', handleKeyDown, true);
    };
  }, [enabled]);
}
