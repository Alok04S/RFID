"""
============================================================================
Shri Guru Gobind Singhji Institute of Engineering & Technology, Nanded
SGGS Hostel RFID Gate Entry - Arduino to Web Bridge
============================================================================
Reads RFID card UIDs from Arduino Serial COM Port and forwards them directly
to the SGGS Hostel Gate API (http://localhost:5000/api/rfid/scan).

Requires: pip install pyserial
Usage:    python arduino_bridge.py
============================================================================
"""

import sys
import time
import json
import urllib.request
import urllib.error

try:
    import serial
    import serial.tools.list_ports
except ImportError:
    print("\n" + "=" * 60)
    print(" [ERROR] 'pyserial' library is not installed!")
    print(" Please install it using this command in your terminal:")
    print("     pip install pyserial")
    print("=" * 60 + "\n")
    sys.exit(1)

API_ENDPOINT = "http://localhost:5000/api/rfid/scan"

def select_port():
    ports = list(serial.tools.list_ports.comports())
    if not ports:
        print("\n[!] No serial COM ports found!")
        print("    Please connect your Arduino via USB and re-run this script.\n")
        return None
    
    print("\n--- Available COM Ports ---")
    default_idx = 0
    for i, p in enumerate(ports):
        is_arduino = any(k in p.description.lower() for k in ["arduino", "ch340", "usb-serial", "ftdi", "cp210"])
        tag = "  <-- (Likely Arduino)" if is_arduino else ""
        print(f"  [{i + 1}] {p.device} : {p.description}{tag}")
        if is_arduino:
            default_idx = i
            
    if len(ports) == 1:
        print(f"\nAuto-selecting sole detected port: {ports[0].device}")
        return ports[0].device
        
    choice = input(f"\nSelect port [1-{len(ports)}] (Press Enter for [{default_idx + 1}]): ").strip()
    if not choice:
        return ports[default_idx].device
    try:
        idx = int(choice) - 1
        if 0 <= idx < len(ports):
            return ports[idx].device
    except ValueError:
        pass
    return ports[default_idx].device

def forward_scan_to_website(rfid_tag):
    payload = json.dumps({
        "rfid_tag": rfid_tag,
        "direction": "IN",
        "device_type": "ARDUINO_RC522",
        "guard_name": "Gate Security Guard"
    }).encode("utf-8")
    
    req = urllib.request.Request(
        API_ENDPOINT,
        data=payload,
        headers={"Content-Type": "application/json"}
    )
    
    try:
        with urllib.request.urlopen(req) as resp:
            data = json.loads(resp.read().decode("utf-8"))
            st = data.get("student", {})
            name = st.get("full_name", "Resident")
            room = st.get("room_number", "N/A")
            reg = st.get("reg_number", "N/A")
            print("=" * 60)
            print(f" [✓] GATE ACCESS GRANTED!")
            print(f"     Student: {name} (Roll: {reg})")
            print(f"     Room:    {room}")
            print(f"     UID:     {rfid_tag}")
            print("=" * 60 + "\n")
    except urllib.error.HTTPError as e:
        body = e.read().decode("utf-8")
        try:
            data = json.loads(body)
            msg = data.get("message", "Access Denied")
            status = data.get("status", "DENIED")
            print("!" * 60)
            print(f" [✕] GATE ACCESS BLOCKED ({status})")
            print(f"     Message: {msg}")
            print(f"     UID:     {rfid_tag}")
            print("!" * 60 + "\n")
        except Exception:
            print(f"\n[ALERT] HTTP {e.code}: {body}\n")
    except Exception as e:
        print(f"\n[!] Network Error: {e}")
        print(f"    Ensure the backend is running at {API_ENDPOINT}\n")

def main():
    print("\n" + "=" * 65)
    print("  SGGS IE&T NANDED - HOSTEL RFID GATE ENTRY DEMO BRIDGE")
    print("=" * 65)
    
    port = select_port()
    if not port:
        return
        
    baud = 9600
    print(f"\nOpening connection to Arduino on {port} (Baud {baud})...")
    
    try:
        ser = serial.Serial(port, baud, timeout=1)
        time.sleep(2)  # Allow Arduino to finish auto-reset
        ser.reset_input_buffer()
        print(f"[READY] Successfully connected to Arduino on {port}!")
        print(">> Open http://localhost:5173 on your browser (Guard Monitor)")
        print(">> Tap any of your 5 RFID cards on the RC522 sensor now...\n")
        
        while True:
            if ser.in_waiting > 0:
                line = ser.readline().decode("utf-8", errors="ignore").strip()
                # Ignore initial startup banner strings
                if line and not line.startswith("---") and len(line) >= 4:
                    print(f"--> Card Scanned on Sensor: {line}")
                    forward_scan_to_website(line)
            time.sleep(0.04)
            
    except serial.SerialException as e:
        print(f"\n[ERROR] Could not open port {port}: {e}")
        print("Tip: If the Arduino IDE Serial Monitor is open, CLOSE IT first so this script can connect.\n")
    except KeyboardInterrupt:
        print("\nBridge stopped by user. Goodbye!")

if __name__ == "__main__":
    main()
