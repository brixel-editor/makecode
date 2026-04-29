# BRIXEL Extension for MakeCode

> 🎯 **Comprehensive MakeCode Extension** supporting **100+ devices** across **9 categories**  
> 🌏 **Multi-language Support**: English (en) & Korean (ko)

## 📋 Table of Contents

- [Overview](#overview)
- [Features](#features)
- [Supported Categories](#supported-categories)
- [Device List by Category](#device-list-by-category)
- [Language Support](#language-support)
- [Installation](#installation)
- [File Structure](#file-structure)
- [License](#license)

---

## 🎯 Overview

BRIXEL Extension is a comprehensive MakeCode extension for micro:bit that provides easy-to-use blocks for controlling various sensors, actuators, displays, and communication devices. With support for 100+ devices organized into 9 intuitive categories, it's perfect for education, prototyping, and IoT projects.

## ✨ Features

- 🔌 **100+ Device Support** - Extensive library of sensors, actuators, and displays
- 🌐 **Bilingual Interface** - Full English and Korean language support
- 📦 **9 Organized Categories** - Easy navigation and discovery
- 🎨 **Color-Coded Blocks** - Visual distinction between categories
- 📝 **Complete Localization** - All blocks and parameters translated
- 🔧 **Easy Integration** - Simple installation via GitHub URL

---

## 📊 Supported Categories

| # | Category | Korean | Devices | Color | Icon |
|---|----------|--------|---------|-------|------|
| 01 | **Displays** | 디스플레이 | 3 types | 🟡 Yellow | 📺 |
| 02 | **Adv Displays** | 고급 디스플레이 | 6 types | 🟡 Yellow | 📺 |
| 03 | **Sensors** | 센서 | 29 types | 🟠 Orange | ⚡ |
| 04 | **Adv Sensors** | 고급센서 | 12 types | 🔵 Blue | ⚡ |
| 05 | **Actuators** | 모터장치 | 7 types | 🟢 Green | ⚙️ |
| 06 | **Output Device** | 출력장치 | 4 types | 🟢 Green | 🔊 |
| 07 | **Communications** | 통신장치 | 6 types | 🟣 Purple | 📡 |
| 08 | **WiFi** | 와이파이 | 1 type | 🔵 Blue | 📶 |
| 09 | **USB Serial** | 시리얼 | 1 type | 🔵 Blue | 🔌 |

**Total: 92+ devices across 9 categories**

---

## 🔧 Device List by Category

### 01. Displays (디스플레이)

**LCD Displays**
- LCD1602 (16x2 Character LCD)
- LCD2004 (20x4 Character LCD)

**7-Segment Display**
- TM1637 (4-digit 7-segment display)

**LED Strip**
- WS2812B / NeoPixel (Addressable RGB LED strip)

---

### 02. Adv Displays (고급 디스플레이)

**OLED Displays**
- SSD1306 (128x64, 128x32 OLED)
- SH1106 (128x64 OLED)

**LED Matrix**
- MAX7219 (8x8 LED matrix)
- HT16K33 (8x8, 8x16 LED matrix, bicolor)

**Shift Register**
- 74HC595 (8-bit shift register for LED control)

**TFT Displays**
- ST7735 (1.8" TFT LCD)
- ILI9341 (2.4" TFT LCD)

---

### 03. Sensors (센서)

**Temperature & Humidity**
- DHT11, DHT22 (Temperature & Humidity)
- DS18B20 (Waterproof temperature sensor)
- LM35 (Analog temperature sensor)
- SHT30 (High-precision temperature & humidity)

**Distance Sensors**
- HC-SR04 (Ultrasonic distance sensor)
- VL53L0X (Laser distance sensor)
- GP2Y0A21YK (Sharp IR distance sensor)
- US-100 (Ultrasonic distance sensor)

**Light Sensors**
- BH1750 (Digital light sensor)
- TEMT6000 (Analog light sensor)
- TSL2561 (Digital light sensor)
- UV Sensor (ML8511 UV sensor)

**Gas & Air Quality**
- MQ-2 (Combustible gas sensor)
- MQ-135 (Air quality sensor)
- CCS811 (CO2 & TVOC sensor)
- SGP30 (Air quality sensor)
- PMS-X003 (PM2.5 dust sensor)
- MH-Z19 (CO2 sensor)

**Weight & Force**
- HX711 (Load cell amplifier)

**Water Quality**
- TDS Sensor (Water quality sensor)
- pH Sensor (pH meter)
- Turbidity Sensor (Water clarity sensor)

**Motion & Position**
- PIR (Motion detector)
- Joystick (Analog joystick)
- Rotary Encoder (Rotation sensor)

**Input Devices**
- Keypad (4x4, 4x3 matrix keypad)
- Button (Digital button)
- Potentiometer (Variable resistor)

**Environmental**
- Soil Moisture Sensor
- Water Level Sensor
- Sound Sensor
- Vibration Sensor
- Flame Sensor
- Touch Sensor

---

### 04. Adv Sensors (고급센서)

**Gesture & Color**
- APDS9960 (Gesture, proximity, RGB, ambient light)
- TCS34725 (RGB color sensor)

**Motion & Orientation**
- MPU6050 (6-axis gyroscope & accelerometer)
- ADXL345 (3-axis accelerometer)

**Pressure & Environment**
- BMP280 (Barometric pressure & temperature)
- BME280 (Pressure, temperature & humidity)

**Biometric**
- MAX30102 (Heart rate & SpO2 sensor)
- Fingerprint Sensor (AS608)

**Time & Power**
- DS1307 (Real-time clock)
- INA219 (Current & voltage sensor)
- ACS712 (Current sensor)
- Voltage Sensor
- Battery Level Sensor

**Other**
- Laser Module
- Reed Switch
- Tilt Sensor

---

### 05. Actuators (모터장치)

**DC Motor Drivers**
- L298N (Dual H-bridge motor driver)
- L293D (Dual H-bridge motor driver)
- TB6612FNG (Dual motor driver)
- DRV8833 (Dual motor driver)

**Stepper Motors**
- A4988 / ULN2003 (Stepper motor driver)

**Servo Motors**
- Standard Servo (0-180°)
- Continuous Rotation Servo

**Relays**
- 1-Channel Relay
- 2-Channel Relay
- 4-Channel Relay

**Other Actuators**
- Solenoid Valve
- DC Fan
- Water Pump

---

### 06. Output Device (출력장치)

**Audio**
- Passive Buzzer (Tone generator)
- Active Buzzer (Simple beeper)
- DFPlayer Mini (MP3 player module)
- Microphone (Sound input)

**Storage**
- SD Card Module (File storage)
- EEPROM (I2C memory)

---

### 07. Communications (통신장치)

**Wireless**
- nRF24L01 (2.4GHz wireless transceiver)
- LoRa (Long-range radio)

**RFID/NFC**
- MFRC522 (RFID reader)
- PN532 (NFC/RFID reader)

**GPS**
- GPS Module (NEO-6M, NEO-7M)

**Infrared**
- IR Remote Receiver
- IR Transmitter

---

### 08. WiFi (와이파이)

**WiFi Modules**
- ESP8266 / ESP32 (WiFi & WebSocket)

---

### 09. USB Serial (시리얼)

**Serial Communication**
- USB Serial (Hardware/Software serial communication)

---

## 🌐 Language Support

This extension provides **complete bilingual support**:

### Supported Languages

| Language | Code | Status | Coverage |
|----------|------|--------|----------|
| English | `en` | ✅ Complete | 100% |
| Korean | `ko` | ✅ Complete | 100% |

### Translation Features

- ✅ **Category Names** - All 9 categories translated
- ✅ **Block Descriptions** - All block text translated
- ✅ **Enum Values** - All dropdown options translated
- ✅ **Parameter Labels** - UI labels translated (parameter names remain in English for compatibility)
- ✅ **Synchronized Files** - Both locale files maintain identical structure

### Locale Files

```
_locales/
├── en/
│   └── brixel-ext-strings.json  (737 lines)
└── ko/
    └── brixel-ext-strings.json  (736 lines)
```

**Important Note**: Parameter names (e.g., `%pin`, `%value`, `%channel`) are **never translated** to ensure proper block-to-code mapping in MakeCode.

---

## 📥 Installation

### Method 1: Via GitHub URL (Recommended)

1. Open [MakeCode Editor](https://makecode.microbit.org/)
2. Click **Extensions** (or **Advanced** → **Extensions**)
3. Enter the GitHub repository URL:
   ```
   https://github.com/YOUR_USERNAME/brixel-ext
   ```
4. Click **Import**
5. The BRIXEL Extension will be added to your project!

### Method 2: Local Development

1. Clone this repository:
   ```bash
   git clone https://github.com/YOUR_USERNAME/brixel-ext.git
   cd brixel-ext
   ```

2. Open in MakeCode:
   - Go to MakeCode Editor
   - Click **Import**
   - Select **Import File**
   - Choose the cloned directory

---

## 📁 File Structure

```
brixel-ext/
├── 01_displays.ts           # LCD, TM1637, NeoPixel
├── 02_adv_displays.ts       # OLED, MAX7219, HT16K33, 74HC595, TFT
├── 03_sensors.ts            # Basic sensors (29 types)
├── 04_adv_sensors.ts        # Advanced sensors (12 types)
├── 05_actuators.ts          # Motors, servos, relays
├── 06_output_device.ts      # Buzzer, MP3, SD card, EEPROM
├── 07_communications.ts     # nRF24L01, LoRa, RFID, GPS, IR
├── 08_wifi.ts               # ESP8266/ESP32 WiFi
├── 09_usb_serial.ts         # Serial communication
├── main.ts                  # Main entry point
├── pxt.json                 # Extension configuration
├── README.md                # This file
└── _locales/                # Localization files
    ├── en/
    │   └── brixel-ext-strings.json
    └── ko/
        └── brixel-ext-strings.json
```

---

## 🎨 Category Color Scheme

Each category uses a distinct color for easy visual identification:

- 🟡 **Displays & Adv Displays**: Yellow (`#FAC907`)
- 🟠 **Sensors**: Orange (`#FF6F00`)
- 🔵 **Adv Sensors**: Blue (`#4D68EC`)
- 🟢 **Actuators & Output Device**: Green (`#50B91A`)
- 🟣 **Communications**: Purple (`#F75ACF`)
- 🔵 **WiFi & USB Serial**: Blue (`#4285F4`)

---

## 🛠️ Development

### Adding New Devices

1. Choose the appropriate category file (e.g., `03_sensors.ts`)
2. Add device-specific enums and functions
3. Add block annotations with `//% block="..."`
4. Update locale files in `_locales/en/` and `_locales/ko/`
5. Test in MakeCode editor

### Translation Guidelines

- **DO translate**: Block descriptions, enum values, UI text
- **DO NOT translate**: Parameter names (anything with `%`)
- Keep both locale files synchronized (same number of entries)
- Use the provided scripts for batch translation updates

---

## 📄 License

MIT License

Copyright (c) 2026 BRIXEL

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all
copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
SOFTWARE.

---

## 🤝 Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

---

## 📞 Support

For issues, questions, or suggestions:
- 📧 Email: support@brixel.com
- 🐛 Issues: [GitHub Issues](https://github.com/YOUR_USERNAME/brixel-ext/issues)
- 📖 Documentation: [Wiki](https://github.com/YOUR_USERNAME/brixel-ext/wiki)

---

**Made with ❤️ for MakeCode Community**
