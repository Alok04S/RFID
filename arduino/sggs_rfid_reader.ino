/*
 * ============================================================================
 * Shri Guru Gobind Singhji Institute of Engineering & Technology, Nanded
 * SGGS Hostel RFID Gate Entry System
 * Arduino Uno/Nano + RC522 (MFRC522) RFID Reader Sketch
 * ============================================================================
 * 
 * HARDWARE CONNECTIONS:
 * ----------------------------------------------------------------------------
 * RC522 Pin  ->  Arduino Uno / Nano Pin   | Notes
 * ----------------------------------------------------------------------------
 * 1. VCC     ->  3.3V                     | CRITICAL: DO NOT CONNECT TO 5V!
 * 2. RST     ->  Pin 9 (D9)               | Reset line
 * 3. GND     ->  GND                      | Ground
 * 4. IRQ     ->  (Leave unconnected)      | Not needed
 * 5. MISO    ->  Pin 12 (D12)             | SPI Master-In-Slave-Out
 * 6. MOSI    ->  Pin 11 (D11)             | SPI Master-Out-Slave-In
 * 7. SCK     ->  Pin 13 (D13)             | SPI Clock
 * 8. SDA(SS) ->  Pin 10 (D10)             | SPI Slave Select
 * ----------------------------------------------------------------------------
 * 
 * LIBRARIES REQUIRED:
 * In Arduino IDE -> Sketch -> Include Library -> Manage Libraries...
 * Search for "MFRC522" by GithubCommunity and click Install.
 * ============================================================================
 */

#include <SPI.h>
#include <MFRC522.h>

#define SS_PIN 10
#define RST_PIN 9

MFRC522 rfid(SS_PIN, RST_PIN);

unsigned long lastScanTime = 0;
String lastScannedUID = "";

void setup() {
  Serial.begin(9600);
  SPI.begin();
  rfid.PCD_Init();
  delay(100);
  
  Serial.println(F("--- SGGS RFID Gate Reader Ready ---"));
}

void loop() {
  // Check if a new RFID card is near antenna
  if (!rfid.PICC_IsNewCardPresent()) {
    return;
  }

  // Read card serial UID
  if (!rfid.PICC_ReadCardSerial()) {
    return;
  }

  // Convert UID bytes to clean Hex String (e.g. 04A3B17F2E8190 or 1356A1B2)
  String uidString = "";
  for (byte i = 0; i < rfid.uid.size; i++) {
    if (rfid.uid.uidByte[i] < 0x10) {
      uidString += "0";
    }
    uidString += String(rfid.uid.uidByte[i], HEX);
  }
  uidString.toUpperCase();

  // Debounce filter: avoid repeated triggering if card is held on reader
  unsigned long now = millis();
  if (uidString != lastScannedUID || (now - lastScanTime > 2500)) {
    lastScannedUID = uidString;
    lastScanTime = now;
    
    // Output UID to Serial Port
    Serial.println(uidString);
  }

  // Halt card communication so it doesn't spam reads
  rfid.PICC_HaltA();
  rfid.PCD_StopCrypto1();
}
