/**
 * BRIXEL Extension - 03. Sensors
 * DHT11/DHT22, DS18B20, LM35, SHT30, HC-SR04, VL53L0X, BH1750, MQ-2, CCS811, PMS, etc.
 */

//% weight=1080 color=#FF6F00 icon="\uf0e7" block="03. Sensors"
//% groups="['초음파(HC-SR04)', '거리센서(VL53L0X)', '미세먼지(GP2Y0A21YK)', '초음파(US-100)', '온습도(DHT11/DHT22)', '물온도(DS18B20)', '온도(LM35)', '온습도(I2C-SHT30)', '무게(HX711)', 'Rotary Encoder', '가스(MQ-2)', '가스(MQ-135)', 'CO2센서(CCS811)', 'CO2센서(SGP30)', '미세먼지(PMS)', 'CO2센서(MHZ19)', '전기전도도(TDS)', 'pH', '탁도(Turbidity)', '조도(BH1750)', '빛(TEMT6000)', '조도(TSL2561)', 'UV Sensor', 'Joystick', 'Keypad', 'Button', 'Potentiometer', 'Other Sensors']"
namespace Sensors03 {


    /********** DHT11/DHT22 센서 **********/

    // DHT 센서 타입
    export enum DHTType {
        //% block="DHT11"
        DHT11 = 11,
        //% block="DHT22"
        DHT22 = 22
    }

    // DHT 읽기 타입
    export enum DHTReadType {
        //% block="humidity"
        Humidity = 0,
        //% block="temperature"
        Temperature = 1
    }

    // 온도 단위
    export enum TempUnit {
        //% block="Celsius (°C)"
        Celsius = 0,
        //% block="Fahrenheit (°F)"
        Fahrenheit = 1
    }

    // DHT 데이터 저장 변수
    let _dhtTemperature: number = 0
    let _dhtHumidity: number = 0
    let _dhtLastQuery: boolean = false
    let _dhtSensorResponding: boolean = false
    let _dhtTempUnit: TempUnit = TempUnit.Celsius

    //% block="Last query successful?"
    //% group="온습도(DHT11/DHT22)" weight=110
    export function dhtLastQuerySuccessful(): boolean {
        return _dhtLastQuery
    }

    //% block="Read %readType"
    //% group="온습도(DHT11/DHT22)" weight=109
    export function dhtRead(readType: DHTReadType): number {
        if (readType == DHTReadType.Temperature) {
            if (_dhtTempUnit == TempUnit.Fahrenheit) {
                return _dhtTemperature * 9 / 5 + 32
            }
            return _dhtTemperature
        } else {
            return _dhtHumidity
        }
    }

    //% block="Query %dhtType|Data pin %pin|Pin pull up %pullUp|Serial output %serialOut|Wait 2 sec after query %wait"
    //% pullUp.shadow="toggleYesNo" pullUp.defl=true
    //% serialOut.shadow="toggleYesNo" serialOut.defl=false
    //% wait.shadow="toggleYesNo" wait.defl=true
    //% group="온습도(DHT11/DHT22)" weight=108
    //% inlineInputMode=inline
    export function dhtQuery(dhtType: DHTType, pin: DigitalPin, pullUp: boolean, serialOut: boolean, wait: boolean): void {
        _dhtLastQuery = false
        _dhtSensorResponding = false

        // DHT 센서 읽기 시작 신호
        pins.digitalWritePin(pin, 0)
        if (dhtType == DHTType.DHT11) {
            basic.pause(18)
        } else {
            basic.pause(1)
        }
        pins.digitalWritePin(pin, 1)
        control.waitMicros(40)

        if (pullUp) {
            pins.setPull(pin, PinPullMode.PullUp)
        }
        pins.digitalReadPin(pin)

        // 응답 대기
        control.waitMicros(80)

        // 데이터 읽기 (40비트)
        let data: number[] = [0, 0, 0, 0, 0]
        for (let i = 0; i < 40; i++) {
            while (pins.digitalReadPin(pin) == 0);
            let t = control.micros()
            while (pins.digitalReadPin(pin) == 1);
            let elapsed = control.micros() - t

            let byteIndex = Math.floor(i / 8)
            data[byteIndex] = data[byteIndex] << 1
            if (elapsed > 40) {
                data[byteIndex] = data[byteIndex] | 1
            }
        }

        // 체크섬 확인
        let checksum = (data[0] + data[1] + data[2] + data[3]) & 0xFF
        if (checksum == data[4]) {
            _dhtLastQuery = true
            _dhtSensorResponding = true

            if (dhtType == DHTType.DHT11) {
                _dhtHumidity = data[0]
                _dhtTemperature = data[2]
            } else {
                _dhtHumidity = ((data[0] << 8) + data[1]) / 10
                _dhtTemperature = (((data[2] & 0x7F) << 8) + data[3]) / 10
                if (data[2] & 0x80) {
                    _dhtTemperature = -_dhtTemperature
                }
            }

            if (serialOut) {
                serial.writeLine("Humidity: " + _dhtHumidity + "%")
                serial.writeLine("Temperature: " + _dhtTemperature + "C")
            }
        }

        if (wait) {
            basic.pause(2000)
        }
    }

    //% block="Last query sensor responding?"
    //% group="온습도(DHT11/DHT22)" weight=107
    export function dhtSensorResponding(): boolean {
        return _dhtSensorResponding
    }

    //% block="Temperature type: %unit"
    //% group="온습도(DHT11/DHT22)" weight=106
    export function dhtSetTempUnit(unit: TempUnit): void {
        _dhtTempUnit = unit
    }


    /********** DS18B20 센서 **********/

    // 온도 단위 (DS18B20용)
    export enum DS18B20Unit {
        //% block="Celsius (°C)"
        Celsius = 0,
        //% block="Fahrenheit (°F)"
        Fahrenheit = 1
    }

    // DS18B20 데이터 저장 변수
    let _ds18b20Pin: DigitalPin = DigitalPin.P2
    let _ds18b20Temps: number[] = []
    let _ds18b20Count: number = 0

    //% block="DS18B20 set data pin %pin"
    //% group="물온도(DS18B20)" weight=104
    export function ds18b20SetPin(pin: DigitalPin): void {
        _ds18b20Pin = pin
    }

    //% block="DS18B20 start conversion"
    //% group="물온도(DS18B20)" weight=103
    export function ds18b20StartConversion(): void {
        // 1-Wire 리셋
        pins.digitalWritePin(_ds18b20Pin, 0)
        control.waitMicros(480)
        pins.digitalWritePin(_ds18b20Pin, 1)
        control.waitMicros(70)

        // 프레즌스 펄스 확인
        let presence = pins.digitalReadPin(_ds18b20Pin)
        control.waitMicros(410)

        if (presence == 0) {
            // Skip ROM (0xCC) - 모든 센서에 명령
            ds18b20WriteByte(0xCC)
            // Convert T (0x44) - 온도 변환 시작
            ds18b20WriteByte(0x44)

            // 변환 대기 (750ms for 12-bit)
            basic.pause(750)

            _ds18b20Count = 1  // 기본 1개 센서
        }
    }

    //% block="DS18B20 read sensor %index temperature (unit %unit)"
    //% index.min=0 index.max=7 index.defl=0
    //% group="물온도(DS18B20)" weight=102
    export function ds18b20ReadTemp(index: number, unit: DS18B20Unit): number {
        // 1-Wire 리셋
        pins.digitalWritePin(_ds18b20Pin, 0)
        control.waitMicros(480)
        pins.digitalWritePin(_ds18b20Pin, 1)
        control.waitMicros(70)
        pins.digitalReadPin(_ds18b20Pin)
        control.waitMicros(410)

        // Skip ROM
        ds18b20WriteByte(0xCC)
        // Read Scratchpad (0xBE)
        ds18b20WriteByte(0xBE)

        // 9바이트 스크래치패드 읽기 (처음 2바이트만 온도)
        let tempLSB = ds18b20ReadByte()
        let tempMSB = ds18b20ReadByte()

        // 온도 계산
        let temp = (tempMSB << 8) | tempLSB
        if (temp & 0x8000) {
            temp = ((~temp) + 1) & 0xFFFF
            temp = -temp
        }
        let tempC = temp / 16.0

        if (unit == DS18B20Unit.Fahrenheit) {
            return tempC * 9 / 5 + 32
        }
        return tempC
    }

    //% block="DS18B20 connected sensor count"
    //% group="물온도(DS18B20)" weight=101
    export function ds18b20GetCount(): number {
        return _ds18b20Count
    }

    // 1-Wire 바이트 쓰기 (내부 함수)
    function ds18b20WriteByte(byte: number): void {
        for (let i = 0; i < 8; i++) {
            if (byte & (1 << i)) {
                // Write 1
                pins.digitalWritePin(_ds18b20Pin, 0)
                control.waitMicros(6)
                pins.digitalWritePin(_ds18b20Pin, 1)
                control.waitMicros(64)
            } else {
                // Write 0
                pins.digitalWritePin(_ds18b20Pin, 0)
                control.waitMicros(60)
                pins.digitalWritePin(_ds18b20Pin, 1)
                control.waitMicros(10)
            }
        }
    }

    // 1-Wire 바이트 읽기 (내부 함수)
    function ds18b20ReadByte(): number {
        let byte = 0
        for (let i = 0; i < 8; i++) {
            pins.digitalWritePin(_ds18b20Pin, 0)
            control.waitMicros(6)
            pins.digitalWritePin(_ds18b20Pin, 1)
            control.waitMicros(9)
            if (pins.digitalReadPin(_ds18b20Pin)) {
                byte |= (1 << i)
            }
            control.waitMicros(55)
        }
        return byte
    }


    /********** LM35 센서 **********/

    //% block="LM35 read temperature pin %pin unit %unit"
    //% group="온도(LM35)" weight=97
    export function lm35Read(pin: AnalogPin, unit: TempUnit): number {
        let tempC = pins.analogReadPin(pin) * 0.48828125
        if (unit == TempUnit.Fahrenheit) {
            return tempC * 9 / 5 + 32
        }
        return tempC
    }


    /********** SHT30 센서 **********/

    // SHT30 데이터 저장 변수
    let _sht30Temperature: number = 0
    let _sht30Humidity: number = 0
    let _sht30Addr: number = 0x44

    //% block="SHT30 init address %addr"
    //% addr.defl=0x44
    //% group="온습도(I2C-SHT30)" weight=96
    export function sht30Init(addr: number): void {
        _sht30Addr = addr
    }

    //% block="SHT30 start measurement"
    //% group="온습도(I2C-SHT30)" weight=95
    export function sht30Query(): void {
        // 측정 명령 전송 (Single Shot, High Repeatability)
        pins.i2cWriteNumber(_sht30Addr, 0x2400, NumberFormat.UInt16BE)

        // 측정 대기 (15ms)
        basic.pause(15)

        // 6바이트 읽기 (온도2 + CRC + 습도2 + CRC)
        let buf = pins.i2cReadBuffer(_sht30Addr, 6)

        // 온도 계산
        let tempRaw = (buf[0] << 8) | buf[1]
        _sht30Temperature = -45 + (175 * tempRaw / 65535)

        // 습도 계산
        let humRaw = (buf[3] << 8) | buf[4]
        _sht30Humidity = 100 * humRaw / 65535
    }

    //% block="SHT30 read temperature (unit %unit)"
    //% group="온습도(I2C-SHT30)" weight=94
    export function sht30ReadTemp(unit: TempUnit): number {
        if (unit == TempUnit.Fahrenheit) {
            return _sht30Temperature * 9 / 5 + 32
        }
        return _sht30Temperature
    }

    //% block="SHT30 read humidity"
    //% group="온습도(I2C-SHT30)" weight=93
    export function sht30ReadHumidity(): number {
        return _sht30Humidity
    }


    /********** HC-SR04 초음파 센서 **********/

    // 거리 단위
    export enum DistanceUnit {
        //% block="cm"
        Centimeter = 0,
        //% block="inch"
        Inch = 1
    }

    // HC-SR04 핀 저장 변수
    let _hcsr04Trig: DigitalPin = DigitalPin.P7
    let _hcsr04Echo: DigitalPin = DigitalPin.P8

    //% block="HC-SR04 set trigger pin %trig echo pin %echo"
    //% trig.defl=DigitalPin.P7 echo.defl=DigitalPin.P8
    //% group="초음파(HC-SR04)" weight=92
    export function hcsr04SetPins(trig: DigitalPin, echo: DigitalPin): void {
        _hcsr04Trig = trig
        _hcsr04Echo = echo
    }

    //% block="HC-SR04 read distance unit %unit"
    //% group="초음파(HC-SR04)" weight=91
    export function hcsr04Read(unit: DistanceUnit): number {
        pins.digitalWritePin(_hcsr04Trig, 0)
        control.waitMicros(2)
        pins.digitalWritePin(_hcsr04Trig, 1)
        control.waitMicros(10)
        pins.digitalWritePin(_hcsr04Trig, 0)
        let d = pins.pulseIn(_hcsr04Echo, PulseValue.High, 30000)
        let cm = Math.floor(d / 58)

        if (unit == DistanceUnit.Inch) {
            return Math.floor(cm / 2.54)
        }
        return cm
    }


    /********** VL53L0X 레이저 거리 센서 **********/

    // VL53L0X 측정 모드
    export enum VL53L0XMode {
        //% block="Single (eSingle)"
        Single = 0,
        //% block="Continuous (eContinuous)"
        Continuous = 1
    }

    // VL53L0X 정밀도
    export enum VL53L0XPrecision {
        //% block="High precision (eHigh)"
        High = 0,
        //% block="Low precision (eLow)"
        Low = 1
    }

    // VL53L0X 제어
    export enum VL53L0XControl {
        //% block="Start"
        Start = 0,
        //% block="Stop"
        Stop = 1
    }

    // VL53L0X 읽기 타입
    export enum VL53L0XReadType {
        //% block="Distance (mm)"
        Distance = 0,
        //% block="Ambient (Lux)"
        Ambient = 1
    }

    // VL53L0X 데이터 저장 변수
    let _vl53l0xAddr: number = 0x29
    let _vl53l0xDistance: number = 0
    let _vl53l0xAmbient: number = 0
    let _vl53l0xMode: VL53L0XMode = VL53L0XMode.Single
    let _vl53l0xPrecision: VL53L0XPrecision = VL53L0XPrecision.High

    //% block="VL53L0X init I2C address %addr"
    //% addr.defl=41
    //% group="거리센서(VL53L0X)" weight=89
    export function vl53l0xInit(addr: number): void {
        _vl53l0xAddr = addr
    }

    //% block="VL53L0X set mode | mode %mode | precision %precision"
    //% group="거리센서(VL53L0X)" weight=88
    export function vl53l0xSetMode(mode: VL53L0XMode, precision: VL53L0XPrecision): void {
        _vl53l0xMode = mode
        _vl53l0xPrecision = precision

        // 정밀도에 따른 타이밍 설정
        let timingBudget = _vl53l0xPrecision == VL53L0XPrecision.High ? 200000 : 20000

        // I2C로 설정 전송
        pins.i2cWriteNumber(_vl53l0xAddr, 0x01, NumberFormat.UInt8BE)
    }

    //% block="VL53L0X control %control"
    //% group="거리센서(VL53L0X)" weight=87
    export function vl53l0xControl(control: VL53L0XControl): void {
        if (control == VL53L0XControl.Start) {
            // 측정 시작 명령
            pins.i2cWriteNumber(_vl53l0xAddr, 0x00, NumberFormat.UInt8BE)

            // 측정 대기
            basic.pause(_vl53l0xPrecision == VL53L0XPrecision.High ? 200 : 20)

            // 결과 읽기 (간소화된 구현)
            let buf = pins.i2cReadBuffer(_vl53l0xAddr, 2)
            _vl53l0xDistance = (buf[0] << 8) | buf[1]
        }
    }

    //% block="VL53L0X read %readType"
    //% group="거리센서(VL53L0X)" weight=86
    export function vl53l0xRead(readType: VL53L0XReadType): number {
        if (readType == VL53L0XReadType.Distance) {
            return _vl53l0xDistance
        }
        return _vl53l0xAmbient
    }


    /********** GP2Y0A21YK 적외선 거리 센서 **********/

    //% block="GP2Y0A21YK read distance pin %pin unit %unit"
    //% group="미세먼지(GP2Y0A21YK)" weight=85
    export function gp2y0a21ykRead(pin: AnalogPin, unit: DistanceUnit): number {
        let v = pins.analogReadPin(pin)
        let cm = Math.floor(12343.85 / (v - 0.42))
        if (unit == DistanceUnit.Inch) {
            return Math.floor(cm / 2.54)
        }
        return cm
    }


    /********** US-100 초음파 센서 **********/

    // US-100 핀 저장 변수
    let _us100Trig: DigitalPin = DigitalPin.P1
    let _us100Echo: DigitalPin = DigitalPin.P2

    //% block="US-100 set trigger pin %trig echo pin %echo"
    //% trig.defl=DigitalPin.P1 echo.defl=DigitalPin.P2
    //% group="초음파(US-100)" weight=84
    export function us100SetPins(trig: DigitalPin, echo: DigitalPin): void {
        _us100Trig = trig
        _us100Echo = echo
    }

    //% block="US-100 distance measure unit %unit"
    //% group="초음파(US-100)" weight=83
    export function us100Read(unit: DistanceUnit): number {
        pins.digitalWritePin(_us100Trig, 0)
        control.waitMicros(2)
        pins.digitalWritePin(_us100Trig, 1)
        control.waitMicros(10)
        pins.digitalWritePin(_us100Trig, 0)
        let d = pins.pulseIn(_us100Echo, PulseValue.High, 30000)
        let cm = Math.floor(d / 58)

        if (unit == DistanceUnit.Inch) {
            return Math.floor(cm / 2.54)
        }
        return cm
    }


    /********** BH1750 조도 센서 **********/

    // BH1750 데이터 저장 변수
    let _bh1750Addr: number = 0x23

    //% block="BH1750 init address %addr"
    //% addr.defl=0x23
    //% group="조도(BH1750)" weight=80
    export function bh1750Init(addr: number): void {
        _bh1750Addr = addr
        // Power On
        pins.i2cWriteNumber(_bh1750Addr, 0x01, NumberFormat.UInt8BE)
        // 연속 고해상도 모드 (1 lux)
        pins.i2cWriteNumber(_bh1750Addr, 0x10, NumberFormat.UInt8BE)
        basic.pause(180)
    }

    //% block="BH1750 light intensity read (lux)"
    //% group="조도(BH1750)" weight=79
    export function bh1750Read(): number {
        let buf = pins.i2cReadBuffer(_bh1750Addr, 2)
        let raw = (buf[0] << 8) | buf[1]
        return Math.floor(raw / 1.2)
    }


    /********** TEMT6000 조도 센서 **********/

    //% block="TEMT6000 light intensity read pin %pin"
    //% group="빛(TEMT6000)" weight=78
    export function temt6000Read(pin: AnalogPin): number {
        return pins.analogReadPin(pin)
    }


    /********** TSL2561 조도 센서 **********/

    // TSL2561 데이터 저장 변수
    let _tsl2561Addr: number = 0x39

    //% block="TSL2561 init address %addr"
    //% addr.defl=0x39
    //% group="조도(TSL2561)" weight=77
    export function tsl2561Init(addr: number): void {
        _tsl2561Addr = addr
        // Power On (Command + Control Register)
        pins.i2cWriteNumber(_tsl2561Addr, 0x80, NumberFormat.UInt8BE)
        pins.i2cWriteNumber(_tsl2561Addr, 0x03, NumberFormat.UInt8BE)
        basic.pause(400)
    }

    //% block="TSL2561 light intensity read (lux)"
    //% group="조도(TSL2561)" weight=76
    export function tsl2561Read(): number {
        // CH0 읽기 (Command + Word + CH0 Data)
        pins.i2cWriteNumber(_tsl2561Addr, 0xAC, NumberFormat.UInt8BE)
        let ch0 = pins.i2cReadNumber(_tsl2561Addr, NumberFormat.UInt16LE)

        // CH1 읽기 (Command + Word + CH1 Data)
        pins.i2cWriteNumber(_tsl2561Addr, 0xAE, NumberFormat.UInt8BE)
        let ch1 = pins.i2cReadNumber(_tsl2561Addr, NumberFormat.UInt16LE)

        // 간단한 Lux 계산
        if (ch0 == 0) return 0
        let ratio = ch1 / ch0
        let lux = 0
        if (ratio <= 0.5) {
            lux = 0.0304 * ch0 - 0.062 * ch0 * Math.pow(ratio, 1.4)
        } else if (ratio <= 0.61) {
            lux = 0.0224 * ch0 - 0.031 * ch1
        } else if (ratio <= 0.80) {
            lux = 0.0128 * ch0 - 0.0153 * ch1
        } else if (ratio <= 1.30) {
            lux = 0.00146 * ch0 - 0.00112 * ch1
        }
        return Math.floor(lux)
    }


    /********** 자외선(UV) 센서 **********/

    // 자외선 센서는 UV 지수를 측정합니다.
    // ML8511, GUVA-S12SD 등 아날로그 UV 센서 지원

    // UV 데이터 타입
    export enum UVDataType {
        //% block="UV index"
        UVIndex = 0,
        //% block="voltage(mV)"
        Voltage = 1,
        //% block="intensity(mW/cm²)"
        Intensity = 2
    }

    // UV 보정 타입
    export enum UVCalibration {
        //% block="indoor (zero adjust)"
        Indoor = 0,
        //% block="outdoor (sunlight)"
        Outdoor = 1
    }

    // UV 센서 상태 변수
    let _uvPin: AnalogPin = AnalogPin.P0
    let _uvRefVoltage: number = 3300  // mV
    let _uvOffsetVoltage: number = 990  // 실내 기준 전압 (mV)

    //% block="UV sensor setup: analog pin %pin"
    //% pin.defl=AnalogPin.P0
    //% group="UV Sensor" weight=69
    export function uvInit(pin: AnalogPin): void {
        _uvPin = pin
        _uvRefVoltage = 3300
        _uvOffsetVoltage = 990
    }

    //% block="UV sensor calibrate %calType, ref voltage: %voltage mV"
    //% calType.defl=UVCalibration.Indoor
    //% voltage.defl=990 voltage.min=0 voltage.max=3300
    //% group="UV Sensor" weight=68
    //% inlineInputMode=inline
    export function uvCalibrate(calType: UVCalibration, voltage: number): void {
        if (calType == UVCalibration.Indoor) {
            // 실내에서 현재 전압을 영점으로 설정
            if (voltage > 0) {
                _uvOffsetVoltage = voltage
            } else {
                // 자동 측정
                let analogSum = 0
                for (let i = 0; i < 10; i++) {
                    analogSum += pins.analogReadPin(_uvPin)
                    basic.pause(10)
                }
                _uvOffsetVoltage = (analogSum / 10) * _uvRefVoltage / 1023
            }
        }
    }

    //% block="UV sensor read: %dtype"
    //% dtype.defl=UVDataType.UVIndex
    //% group="UV Sensor" weight=67
    export function uvRead(dtype: UVDataType): number {
        // 아날로그 값 읽기 (여러 번 읽어서 평균)
        let analogSum = 0
        for (let i = 0; i < 10; i++) {
            analogSum += pins.analogReadPin(_uvPin)
            basic.pause(10)
        }
        let analogValue = analogSum / 10

        // 전압 계산 (mV)
        let voltage = analogValue * _uvRefVoltage / 1023

        if (dtype == UVDataType.Voltage) {
            return Math.round(voltage)
        }

        // UV 강도 계산 (mW/cm²)
        // ML8511 기준: 출력 전압 1V = 0 mW/cm², 2.8V = 15 mW/cm²
        let intensity = (voltage - _uvOffsetVoltage) / 120  // 약 120mV per mW/cm²
        if (intensity < 0) intensity = 0

        if (dtype == UVDataType.Intensity) {
            return Math.round(intensity * 100) / 100
        }

        // UV 지수 계산 (0-11+)
        // UV Index = Intensity / 0.25 (대략적인 변환)
        let uvIndex = intensity / 0.25
        if (uvIndex < 0) uvIndex = 0
        if (uvIndex > 15) uvIndex = 15

        return Math.round(uvIndex * 10) / 10
    }


    /********** MQ-2 가스 센서 **********/

    //% block="MQ-2 gas concentration read pin %pin"
    //% group="가스(MQ-2)" weight=50
    export function mq2Read(pin: AnalogPin): number {
        return pins.analogReadPin(pin)
    }


    /********** MQ-135 공기질 센서 **********/

    //% block="MQ-135 air quality read pin %pin"
    //% group="가스(MQ-135)" weight=49
    export function mq135Read(pin: AnalogPin): number {
        return pins.analogReadPin(pin)
    }


    /********** CCS811 CO2/VOC 센서 **********/

    // CCS811 측정 타입
    export enum CCS811Type {
        //% block="CO2(ppm)"
        CO2 = 0,
        //% block="TVOC(ppb)"
        TVOC = 1
    }

    // CCS811 데이터 저장 변수
    let _ccs811Addr: number = 0x5A
    let _ccs811CO2: number = 0
    let _ccs811TVOC: number = 0

    //% block="CCS811 init"
    //% group="CO2센서(CCS811)" weight=48
    export function ccs811Init(): void {
        // 앱 시작 명령
        pins.i2cWriteNumber(_ccs811Addr, 0xF4, NumberFormat.UInt8BE)
        basic.pause(100)
        // 측정 모드 설정 (1초 간격)
        pins.i2cWriteNumber(_ccs811Addr, 0x0110, NumberFormat.UInt16BE)
        basic.pause(100)
    }

    //% block="CCS811 read %ctype"
    //% group="CO2센서(CCS811)" weight=47
    export function ccs811Read(ctype: CCS811Type): number {
        // 결과 레지스터 읽기
        pins.i2cWriteNumber(_ccs811Addr, 0x02, NumberFormat.UInt8BE)
        let buf = pins.i2cReadBuffer(_ccs811Addr, 4)

        _ccs811CO2 = (buf[0] << 8) | buf[1]
        _ccs811TVOC = (buf[2] << 8) | buf[3]

        if (ctype == CCS811Type.CO2) {
            return _ccs811CO2
        }
        return _ccs811TVOC
    }


    /********** SGP30 TVOC 센서 **********/

    // SGP30 측정 타입
    export enum SGP30Type {
        //% block="eCO2(ppm)"
        eCO2 = 0,
        //% block="TVOC(ppb)"
        TVOC = 1
    }

    // SGP30 데이터 저장 변수
    let _sgp30Addr: number = 0x58
    let _sgp30eCO2: number = 0
    let _sgp30TVOC: number = 0

    //% block="SGP30 init"
    //% group="CO2센서(SGP30)" weight=46
    export function sgp30Init(): void {
        // IAQ 초기화 명령
        pins.i2cWriteNumber(_sgp30Addr, 0x2003, NumberFormat.UInt16BE)
        basic.pause(10)
    }

    //% block="SGP30 measure run"
    //% group="CO2센서(SGP30)" weight=45
    export function sgp30Measure(): void {
        // IAQ 측정 명령
        pins.i2cWriteNumber(_sgp30Addr, 0x2008, NumberFormat.UInt16BE)
        basic.pause(12)

        // 결과 읽기 (6바이트: eCO2 + CRC + TVOC + CRC)
        let buf = pins.i2cReadBuffer(_sgp30Addr, 6)

        _sgp30eCO2 = (buf[0] << 8) | buf[1]
        _sgp30TVOC = (buf[3] << 8) | buf[4]
    }

    //% block="SGP30 read %stype"
    //% group="CO2센서(SGP30)" weight=44
    export function sgp30Read(stype: SGP30Type): number {
        if (stype == SGP30Type.eCO2) {
            return _sgp30eCO2
        }
        return _sgp30TVOC
    }


    /********** PMS 미세먼지 센서 (PMS5003, PMS7003 등) **********/

    // PMS-X003 시리즈는 레이저 산란 방식의 미세먼지 센서입니다.
    // PM1.0, PM2.5, PM10 농도를 측정합니다.

    // PMS 시리얼 포트 타입
    export enum PMSSerial {
        //% block="SoftwareSerial"
        Software = 0,
        //% block="HardwareSerial"
        Hardware = 1
    }

    // PMS 데이터 타입
    export enum PMSDataType {
        //% block="PM1.0 (std)"
        PM1_0_STD = 0,
        //% block="PM2.5 (std)"
        PM2_5_STD = 1,
        //% block="PM10 (std)"
        PM10_STD = 2,
        //% block="PM1.0 (atm)"
        PM1_0_ATM = 3,
        //% block="PM2.5 (atm)"
        PM2_5_ATM = 4,
        //% block="PM10 (atm)"
        PM10_ATM = 5
    }

    // PMS 모드
    export enum PMSMode {
        //% block="active"
        Active = 0,
        //% block="passive"
        Passive = 1
    }

    // PMS 전원 상태
    export enum PMSPower {
        //% block="wakeup"
        Wakeup = 0,
        //% block="sleep"
        Sleep = 1
    }

    // PMS 상태 변수
    let _pmsTx: SerialPin = SerialPin.P1
    let _pmsRx: SerialPin = SerialPin.P2
    let _pmsData: number[] = [0, 0, 0, 0, 0, 0]  // PM1.0_STD, PM2.5_STD, PM10_STD, PM1.0_ATM, PM2.5_ATM, PM10_ATM
    let _pmsReady: boolean = false
    let _pmsBuffer: number[] = []

    //% block="PM sensor(PMS-X003): serial %serialType, RX %rx, TX %tx, baud %baud setup"
    //% serialType.defl=PMSSerial.Software
    //% rx.defl=SerialPin.P2
    //% tx.defl=SerialPin.P1
    //% baud.defl=9600
    //% group="미세먼지(PMS)" weight=50
    //% inlineInputMode=inline
    export function pmsInit(serialType: PMSSerial, rx: SerialPin, tx: SerialPin, baud: number): void {
        _pmsRx = rx
        _pmsTx = tx
        serial.redirect(tx, rx, baud)
        _pmsReady = false
        _pmsBuffer = []
        basic.pause(1000)  // 센서 안정화 대기
    }

    //% block="PMS PM sensor power %power"
    //% power.defl=PMSPower.Wakeup
    //% group="미세먼지(PMS)" weight=49
    export function pmsPower(power: PMSPower): void {
        if (power == PMSPower.Sleep) {
            // 슬립 명령: 42 4D E4 00 00 01 73
            let cmd = pins.createBuffer(7)
            cmd[0] = 0x42
            cmd[1] = 0x4D
            cmd[2] = 0xE4
            cmd[3] = 0x00
            cmd[4] = 0x00
            cmd[5] = 0x01
            cmd[6] = 0x73
            serial.writeBuffer(cmd)
        } else {
            // 깨우기 명령: 42 4D E4 00 01 01 74
            let cmd = pins.createBuffer(7)
            cmd[0] = 0x42
            cmd[1] = 0x4D
            cmd[2] = 0xE4
            cmd[3] = 0x00
            cmd[4] = 0x01
            cmd[5] = 0x01
            cmd[6] = 0x74
            serial.writeBuffer(cmd)
            basic.pause(1000)  // 깨우기 후 안정화
        }
    }

    //% block="PMS PM sensor mode %mode"
    //% mode.defl=PMSMode.Active
    //% group="미세먼지(PMS)" weight=48
    export function pmsSetMode(mode: PMSMode): void {
        if (mode == PMSMode.Passive) {
            // 패시브 모드: 42 4D E1 00 00 01 70
            let cmd = pins.createBuffer(7)
            cmd[0] = 0x42
            cmd[1] = 0x4D
            cmd[2] = 0xE1
            cmd[3] = 0x00
            cmd[4] = 0x00
            cmd[5] = 0x01
            cmd[6] = 0x70
            serial.writeBuffer(cmd)
        } else {
            // 활성 모드: 42 4D E1 00 01 01 71
            let cmd = pins.createBuffer(7)
            cmd[0] = 0x42
            cmd[1] = 0x4D
            cmd[2] = 0xE1
            cmd[3] = 0x00
            cmd[4] = 0x01
            cmd[5] = 0x01
            cmd[6] = 0x71
            serial.writeBuffer(cmd)
        }
    }

    //% block="PMS PM sensor read %dtype"
    //% dtype.defl=PMSDataType.PM2_5_STD
    //% group="미세먼지(PMS)" weight=47
    export function pmsRead(dtype: PMSDataType): number {
        pmsParseData()
        return _pmsData[dtype]
    }

    //% block="PMS PM sensor request read"
    //% group="미세먼지(PMS)" weight=46
    export function pmsRequestRead(): void {
        // 수동 읽기 요청: 42 4D E2 00 00 01 71
        let cmd = pins.createBuffer(7)
        cmd[0] = 0x42
        cmd[1] = 0x4D
        cmd[2] = 0xE2
        cmd[3] = 0x00
        cmd[4] = 0x00
        cmd[5] = 0x01
        cmd[6] = 0x71
        serial.writeBuffer(cmd)
    }

    //% block="PMS PM sensor data ready"
    //% group="미세먼지(PMS)" weight=45
    export function pmsDataReady(): boolean {
        pmsParseData()
        return _pmsReady
    }

    // PMS 데이터 파싱 (내부 함수)
    function pmsParseData(): void {
        _pmsReady = false

        // 시리얼 버퍼에서 데이터 읽기
        let available = serial.readBuffer(32)
        if (available.length < 32) return

        // 시작 바이트 찾기 (0x42 0x4D)
        let startIndex = -1
        for (let i = 0; i < available.length - 1; i++) {
            if (available[i] == 0x42 && available[i + 1] == 0x4D) {
                startIndex = i
                break
            }
        }

        if (startIndex < 0 || startIndex + 32 > available.length) return

        // 프레임 길이 확인
        let frameLen = (available[startIndex + 2] << 8) | available[startIndex + 3]
        if (frameLen != 28) return

        // 체크섬 계산
        let checksum = 0
        for (let i = 0; i < 30; i++) {
            checksum += available[startIndex + i]
        }
        let receivedChecksum = (available[startIndex + 30] << 8) | available[startIndex + 31]

        if (checksum != receivedChecksum) return

        // 데이터 추출
        _pmsData[0] = (available[startIndex + 4] << 8) | available[startIndex + 5]   // PM1.0 표준
        _pmsData[1] = (available[startIndex + 6] << 8) | available[startIndex + 7]   // PM2.5 표준
        _pmsData[2] = (available[startIndex + 8] << 8) | available[startIndex + 9]   // PM10 표준
        _pmsData[3] = (available[startIndex + 10] << 8) | available[startIndex + 11] // PM1.0 대기
        _pmsData[4] = (available[startIndex + 12] << 8) | available[startIndex + 13] // PM2.5 대기
        _pmsData[5] = (available[startIndex + 14] << 8) | available[startIndex + 15] // PM10 대기

        _pmsReady = true
    }


    /********** MHZ19 이산화탄소 센서 **********/

    // MHZ19는 NDIR(비분산 적외선) 방식의 CO2 센서입니다.
    // 측정 범위: 0-2000ppm, 0-5000ppm, 0-10000ppm

    // MHZ19 시리얼 포트 타입
    export enum MHZ19Serial {
        //% block="software serial"
        Software = 0,
        //% block="hardware serial"
        Hardware = 1
    }

    // MHZ19 데이터 타입
    export enum MHZ19DataType {
        //% block="CO2(ppm)"
        CO2 = 0,
        //% block="temperature(°C)"
        Temperature = 1
    }

    // MHZ19 측정 범위
    export enum MHZ19Range {
        //% block="2000 ppm"
        Range2000 = 2000,
        //% block="5000 ppm"
        Range5000 = 5000,
        //% block="10000 ppm"
        Range10000 = 10000
    }

    // MHZ19 필터 모드
    export enum MHZ19Filter {
        //% block="on"
        On = 1,
        //% block="off"
        Off = 0
    }

    // MHZ19 필터 타입
    export enum MHZ19FilterType {
        //% block="clear"
        Clear = 0,
        //% block="kalman"
        Kalman = 1
    }

    // MHZ19 자동 보정
    export enum MHZ19AutoCal {
        //% block="auto cal on"
        On = 1,
        //% block="auto cal off"
        Off = 0
    }

    // MHZ19 상태 타입
    export enum MHZ19Status {
        //% block="range"
        Range = 0,
        //% block="auto cal"
        AutoCal = 1
    }

    // MHZ19 상태 변수
    let _mhz19Tx: SerialPin = SerialPin.P1
    let _mhz19Rx: SerialPin = SerialPin.P2
    let _mhz19CO2: number = 0
    let _mhz19Temp: number = 0
    let _mhz19Range: number = 2000
    let _mhz19AutoCal: boolean = true

    //% block="MHZ19 CO2 sensor setup: serial %serialType, RX %rx, TX %tx, baud %baud"
    //% serialType.defl=MHZ19Serial.Software
    //% rx.defl=SerialPin.P2
    //% tx.defl=SerialPin.P1
    //% baud.defl=9600
    //% group="CO2센서(MHZ19)" weight=38
    //% inlineInputMode=inline
    export function mhz19Init(serialType: MHZ19Serial, rx: SerialPin, tx: SerialPin, baud: number): void {
        _mhz19Rx = rx
        _mhz19Tx = tx
        serial.redirect(tx, rx, baud)
        basic.pause(500)  // 센서 안정화 대기
    }

    //% block="MHZ19 set range: %range ppm"
    //% range.defl=MHZ19Range.Range2000
    //% group="CO2센서(MHZ19)" weight=37
    export function mhz19SetRange(range: MHZ19Range): void {
        _mhz19Range = range
        // 범위 설정 명령: FF 01 99 00 00 00 [범위H] [범위L] [체크섬]
        let cmd = pins.createBuffer(9)
        cmd[0] = 0xFF
        cmd[1] = 0x01
        cmd[2] = 0x99
        cmd[3] = 0x00
        cmd[4] = 0x00
        cmd[5] = 0x00
        cmd[6] = (range >> 8) & 0xFF
        cmd[7] = range & 0xFF
        cmd[8] = mhz19Checksum(cmd)
        serial.writeBuffer(cmd)
        basic.pause(100)
    }

    //% block="MHZ19 filter mode %filter, type %filterType"
    //% filter.defl=MHZ19Filter.On
    //% filterType.defl=MHZ19FilterType.Clear
    //% group="CO2센서(MHZ19)" weight=36
    //% inlineInputMode=inline
    export function mhz19SetFilter(filter: MHZ19Filter, filterType: MHZ19FilterType): void {
        // 필터 설정은 소프트웨어적으로 처리 (MHZ19B에서는 직접 지원 안함)
        // 이 블록은 호환성을 위해 제공
    }

    //% block="MHZ19 read: %dtype"
    //% dtype.defl=MHZ19DataType.CO2
    //% group="CO2센서(MHZ19)" weight=35
    export function mhz19Read(dtype: MHZ19DataType): number {
        // CO2 읽기 명령: FF 01 86 00 00 00 00 00 79
        let cmd = pins.createBuffer(9)
        cmd[0] = 0xFF
        cmd[1] = 0x01
        cmd[2] = 0x86
        cmd[3] = 0x00
        cmd[4] = 0x00
        cmd[5] = 0x00
        cmd[6] = 0x00
        cmd[7] = 0x00
        cmd[8] = 0x79
        serial.writeBuffer(cmd)

        basic.pause(100)

        // 응답 읽기 (9바이트)
        let response = serial.readBuffer(9)
        if (response.length >= 9 && response[0] == 0xFF && response[1] == 0x86) {
            // 체크섬 확인
            let checksum = mhz19Checksum(response)
            if (checksum == response[8]) {
                _mhz19CO2 = (response[2] << 8) | response[3]
                _mhz19Temp = response[4] - 40  // 온도는 40을 빼야 함
            }
        }

        if (dtype == MHZ19DataType.CO2) {
            return _mhz19CO2
        }
        return _mhz19Temp
    }

    //% block="MHZ19 %autoCal period(hour): %hours"
    //% autoCal.defl=MHZ19AutoCal.On
    //% hours.defl=24 hours.min=0 hours.max=720
    //% group="CO2센서(MHZ19)" weight=34
    //% inlineInputMode=inline
    export function mhz19SetAutoCal(autoCal: MHZ19AutoCal, hours: number): void {
        _mhz19AutoCal = (autoCal == MHZ19AutoCal.On)
        // 자동 보정 ON: FF 01 79 A0 00 00 00 00 E6
        // 자동 보정 OFF: FF 01 79 00 00 00 00 00 86
        let cmd = pins.createBuffer(9)
        cmd[0] = 0xFF
        cmd[1] = 0x01
        cmd[2] = 0x79
        cmd[3] = _mhz19AutoCal ? 0xA0 : 0x00
        cmd[4] = 0x00
        cmd[5] = 0x00
        cmd[6] = 0x00
        cmd[7] = 0x00
        cmd[8] = mhz19Checksum(cmd)
        serial.writeBuffer(cmd)
        basic.pause(100)
    }

    //% block="MHZ19 status read: %status"
    //% status.defl=MHZ19Status.Range
    //% group="CO2센서(MHZ19)" weight=33
    export function mhz19GetStatus(status: MHZ19Status): number {
        if (status == MHZ19Status.Range) {
            return _mhz19Range
        }
        return _mhz19AutoCal ? 1 : 0
    }

    // MHZ19 체크섬 계산 (내부 함수)
    function mhz19Checksum(buf: Buffer): number {
        let sum = 0
        for (let i = 1; i < 8; i++) {
            sum += buf[i]
        }
        return (0xFF - (sum & 0xFF) + 1) & 0xFF
    }


    /********** HX711 무게 센서 (로드셀) **********/

    // HX711은 24비트 ADC로 로드셀과 함께 사용하는 무게 센서입니다.
    // 게인: 128(채널A), 64(채널A), 32(채널B)

    // HX711 게인 설정
    export enum HX711Gain {
        //% block="128 (ch A)"
        Gain128 = 1,
        //% block="64 (ch A)"
        Gain64 = 3,
        //% block="32 (ch B)"
        Gain32 = 2
    }

    // HX711 데이터 타입
    export enum HX711DataType {
        //% block="raw"
        Raw = 0,
        //% block="weight"
        Weight = 1
    }

    // HX711 상태 변수
    let _hx711Dout: DigitalPin = DigitalPin.P0
    let _hx711Clk: DigitalPin = DigitalPin.P1
    let _hx711Gain: HX711Gain = HX711Gain.Gain128
    let _hx711Offset: number = 0
    let _hx711Scale: number = 1

    //% block="Weight sensor(HX711): DOUT %dout, CLK %clk, gain %gain setup"
    //% dout.defl=DigitalPin.P0
    //% clk.defl=DigitalPin.P1
    //% gain.defl=HX711Gain.Gain128
    //% group="무게(HX711)" weight=43
    //% inlineInputMode=inline
    export function hx711Init(dout: DigitalPin, clk: DigitalPin, gain: HX711Gain): void {
        _hx711Dout = dout
        _hx711Clk = clk
        _hx711Gain = gain
        _hx711Offset = 0
        _hx711Scale = 1

        pins.digitalWritePin(_hx711Clk, 0)
        pins.setPull(_hx711Dout, PinPullMode.PullUp)

        // 첫 번째 읽기로 게인 설정
        hx711ReadRaw()
    }

    //% block="HX711 weight sensor read weight"
    //% group="무게(HX711)" weight=42
    export function hx711ReadWeight(): number {
        let raw = hx711ReadRaw()
        return (raw - _hx711Offset) / _hx711Scale
    }

    //% block="HX711 weight sensor tare %times times"
    //% times.defl=10 times.min=1 times.max=50
    //% group="무게(HX711)" weight=41
    export function hx711Tare(times: number): void {
        let sum = 0
        for (let i = 0; i < times; i++) {
            sum += hx711ReadRaw()
            basic.pause(10)
        }
        _hx711Offset = sum / times
    }

    //% block="HX711 weight sensor set scale %scale"
    //% scale.defl=1
    //% group="무게(HX711)" weight=40
    export function hx711SetScale(scale: number): void {
        if (scale != 0) {
            _hx711Scale = scale
        }
    }

    //% block="HX711 weight sensor is ready"
    //% group="무게(HX711)" weight=39
    export function hx711IsReady(): boolean {
        return pins.digitalReadPin(_hx711Dout) == 0
    }

    //% block="HX711 weight sensor power %state"
    //% state.shadow="toggleOnOff"
    //% group="무게(HX711)" weight=38
    export function hx711Power(state: boolean): void {
        if (state) {
            // 전원 켜기
            pins.digitalWritePin(_hx711Clk, 0)
        } else {
            // 전원 끄기 (CLK를 60us 이상 HIGH)
            pins.digitalWritePin(_hx711Clk, 1)
            control.waitMicros(100)
        }
    }

    //% block="HX711 weight sensor read %dtype"
    //% dtype.defl=HX711DataType.Weight
    //% group="무게(HX711)" weight=37
    export function hx711Read(dtype: HX711DataType): number {
        if (dtype == HX711DataType.Raw) {
            return hx711ReadRaw()
        }
        return hx711ReadWeight()
    }

    // HX711 원본 데이터 읽기 (내부 함수)
    function hx711ReadRaw(): number {
        // 데이터 준비 대기
        while (pins.digitalReadPin(_hx711Dout) == 1) {
            basic.pause(1)
        }

        let value: number = 0

        // 24비트 데이터 읽기
        for (let i = 0; i < 24; i++) {
            pins.digitalWritePin(_hx711Clk, 1)
            control.waitMicros(1)
            value = value << 1
            if (pins.digitalReadPin(_hx711Dout) == 1) {
                value++
            }
            pins.digitalWritePin(_hx711Clk, 0)
            control.waitMicros(1)
        }

        // 게인 설정을 위한 추가 펄스
        for (let i = 0; i < _hx711Gain; i++) {
            pins.digitalWritePin(_hx711Clk, 1)
            control.waitMicros(1)
            pins.digitalWritePin(_hx711Clk, 0)
            control.waitMicros(1)
        }

        // 24비트 2의 보수 처리
        if (value & 0x800000) {
            value = value - 0x1000000
        }

        return value
    }


    /********** TDS 수질 센서 (GravityTDS) **********/

    // TDS(Total Dissolved Solids)는 물에 녹아있는 총 용존 고형물을 측정합니다.
    // 수질 측정에 사용되며, ppm 단위로 표시됩니다.

    // TDS 데이터 타입
    export enum TDSDataType {
        //% block="TDS(ppm)"
        TDS = 0,
        //% block="voltage(V)"
        Voltage = 1,
        //% block="EC(μS/cm)"
        EC = 2
    }

    // TDS 고급 설정 타입
    export enum TDSAdvanced {
        //% block="ADC ref voltage(V)"
        RefVoltage = 0,
        //% block="ADC resolution"
        ADCResolution = 1,
        //% block="K value"
        KValue = 2
    }

    // TDS 상태 변수
    let _tdsPin: AnalogPin = AnalogPin.P0
    let _tdsTemperature: number = 25
    let _tdsRefVoltage: number = 3.3
    let _tdsADCResolution: number = 1023
    let _tdsKValue: number = 1.0
    let _tdsVoltage: number = 0
    let _tdsTDSValue: number = 0
    let _tdsECValue: number = 0

    //% block="TDS sensor(GravityTDS) setup: pin %pin"
    //% pin.defl=AnalogPin.P0
    //% group="전기전도도(TDS)" weight=32
    export function tdsInit(pin: AnalogPin): void {
        _tdsPin = pin
        _tdsTemperature = 25
        _tdsRefVoltage = 3.3
        _tdsADCResolution = 1023
        _tdsKValue = 1.0
    }

    //% block="TDS sensor temp compensation: %temperature °C"
    //% temperature.defl=25 temperature.min=0 temperature.max=50
    //% group="전기전도도(TDS)" weight=31
    export function tdsSetTemperature(temperature: number): void {
        _tdsTemperature = temperature
    }

    //% block="TDS sensor update"
    //% group="전기전도도(TDS)" weight=30
    export function tdsUpdate(): void {
        // 아날로그 값 읽기 (여러 번 읽어서 평균)
        let analogSum = 0
        for (let i = 0; i < 10; i++) {
            analogSum += pins.analogReadPin(_tdsPin)
            basic.pause(10)
        }
        let analogValue = analogSum / 10

        // 전압 계산
        _tdsVoltage = analogValue * _tdsRefVoltage / _tdsADCResolution

        // 온도 보상 계수 계산
        let compensationCoefficient = 1.0 + 0.02 * (_tdsTemperature - 25.0)

        // 온도 보상된 전압
        let compensatedVoltage = _tdsVoltage / compensationCoefficient

        // TDS 계산 (ppm) - GravityTDS 공식
        // TDS = (133.42 * V^3 - 255.86 * V^2 + 857.39 * V) * K
        _tdsTDSValue = (133.42 * compensatedVoltage * compensatedVoltage * compensatedVoltage
            - 255.86 * compensatedVoltage * compensatedVoltage
            + 857.39 * compensatedVoltage) * _tdsKValue

        if (_tdsTDSValue < 0) _tdsTDSValue = 0

        // EC 계산 (μS/cm) - TDS의 약 2배
        _tdsECValue = _tdsTDSValue * 2
    }

    //% block="TDS sensor read: %dtype"
    //% dtype.defl=TDSDataType.TDS
    //% group="전기전도도(TDS)" weight=29
    export function tdsRead(dtype: TDSDataType): number {
        if (dtype == TDSDataType.TDS) {
            return Math.round(_tdsTDSValue)
        } else if (dtype == TDSDataType.Voltage) {
            return Math.round(_tdsVoltage * 100) / 100
        }
        return Math.round(_tdsECValue)
    }

    //% block="TDS sensor advanced %setting value: %value"
    //% setting.defl=TDSAdvanced.RefVoltage
    //% value.defl=3.3
    //% group="전기전도도(TDS)" weight=28
    //% inlineInputMode=inline
    export function tdsSetAdvanced(setting: TDSAdvanced, value: number): void {
        if (setting == TDSAdvanced.RefVoltage) {
            _tdsRefVoltage = value
        } else if (setting == TDSAdvanced.ADCResolution) {
            _tdsADCResolution = value
        } else {
            _tdsKValue = value
        }
    }


    /********** pH 센서 **********/

    // pH 센서는 용액의 산성/알칼리성을 측정합니다.
    // 측정 범위: 0-14 pH

    // pH 보정 명령
    export enum PHCalibration {
        //% block="enter cal mode"
        EnterCal = 0,
        //% block="exit cal mode"
        ExitCal = 1,
        //% block="cal mid (pH 7)"
        CalMid = 2,
        //% block="cal low (pH 4)"
        CalLow = 3,
        //% block="cal high (pH 10)"
        CalHigh = 4
    }

    // pH 상태 변수
    let _phPin: AnalogPin = AnalogPin.P0
    let _phRefVoltage: number = 3.3
    let _phOffset: number = 0.0
    let _phSlope: number = 1.0
    let _phNeutralVoltage: number = 1.5  // pH 7일 때 전압 (약 1.5V)
    let _phAcidVoltage: number = 2.0     // pH 4일 때 전압

    //% block="pH sensor setup pin %pin"
    //% pin.defl=AnalogPin.P0
    //% group="pH" weight=27
    export function phInit(pin: AnalogPin): void {
        _phPin = pin
        _phRefVoltage = 3.3
        _phOffset = 0.0
        _phSlope = 1.0
        _phNeutralVoltage = 1.5
        _phAcidVoltage = 2.0
    }

    //% block="pH read at %temperature °C"
    //% temperature.defl=25 temperature.min=0 temperature.max=50
    //% group="pH" weight=26
    export function phRead(temperature: number): number {
        // 아날로그 값 읽기 (여러 번 읽어서 평균)
        let analogSum = 0
        for (let i = 0; i < 10; i++) {
            analogSum += pins.analogReadPin(_phPin)
            basic.pause(10)
        }
        let analogValue = analogSum / 10

        // 전압 계산
        let voltage = analogValue * _phRefVoltage / 1023

        // pH 계산 (2점 보정 기반)
        // pH = 7 + (neutralVoltage - voltage) / slope
        let slope = (_phNeutralVoltage - _phAcidVoltage) / 3.0  // pH 7과 pH 4의 차이는 3
        let ph = 7.0 + (_phNeutralVoltage - voltage) / slope + _phOffset

        // 온도 보상 (Nernst 방정식 기반, 간소화)
        let tempCompensation = (temperature - 25.0) * 0.003
        ph = ph - tempCompensation

        // 범위 제한
        if (ph < 0) ph = 0
        if (ph > 14) ph = 14

        return Math.round(ph * 100) / 100
    }

    //% block="pH sensor read voltage"
    //% group="pH" weight=25
    export function phReadVoltage(): number {
        // 아날로그 값 읽기 (여러 번 읽어서 평균)
        let analogSum = 0
        for (let i = 0; i < 10; i++) {
            analogSum += pins.analogReadPin(_phPin)
            basic.pause(10)
        }
        let analogValue = analogSum / 10

        // 전압 계산
        let voltage = analogValue * _phRefVoltage / 1023
        return Math.round(voltage * 1000) / 1000
    }

    //% block="pH calibration %cmd"
    //% cmd.defl=PHCalibration.EnterCal
    //% group="pH" weight=24
    export function phCalibrate(cmd: PHCalibration): void {
        let currentVoltage = phReadVoltage()

        if (cmd == PHCalibration.CalMid) {
            // 중성 보정 (pH 7)
            _phNeutralVoltage = currentVoltage
        } else if (cmd == PHCalibration.CalLow) {
            // 산성 보정 (pH 4)
            _phAcidVoltage = currentVoltage
        } else if (cmd == PHCalibration.CalHigh) {
            // 알칼리 보정 (pH 10) - 기울기 조정
            let highVoltage = currentVoltage
            // pH 10과 pH 7의 차이로 기울기 보정
            if (_phNeutralVoltage != highVoltage) {
                _phSlope = (_phNeutralVoltage - highVoltage) / 3.0
            }
        }
        // EnterCal, ExitCal은 상태 표시용 (실제 동작 없음)
    }


    /********** 탁도 센서 (Turbidity Sensor) **********/

    // 탁도 센서는 물의 혼탁도를 측정합니다.
    // 단위: NTU (Nephelometric Turbidity Units)

    // 탁도 데이터 타입
    export enum TurbidityDataType {
        //% block="turbidity(NTU)"
        NTU = 0,
        //% block="voltage(V)"
        Voltage = 1
    }

    // 탁도 센서 상태 변수
    let _turbidityPin: AnalogPin = AnalogPin.P0
    let _turbidityRefVoltage: number = 3.3
    let _turbidityClearVoltage: number = 2.5  // 맑은 물일 때 전압 (보정용)

    //% block="Turbidity sensor setup: analog pin %pin"
    //% pin.defl=AnalogPin.P0
    //% group="탁도(Turbidity)" weight=23
    export function turbidityInit(pin: AnalogPin): void {
        _turbidityPin = pin
        _turbidityRefVoltage = 3.3
        _turbidityClearVoltage = 2.5
    }

    //% block="Turbidity sensor calibrate (clear water)"
    //% group="탁도(Turbidity)" weight=22
    export function turbidityCalibrate(): void {
        // 맑은 물에서 전압 측정하여 보정값 저장
        let analogSum = 0
        for (let i = 0; i < 10; i++) {
            analogSum += pins.analogReadPin(_turbidityPin)
            basic.pause(10)
        }
        let analogValue = analogSum / 10
        _turbidityClearVoltage = analogValue * _turbidityRefVoltage / 1023
    }

    //% block="Turbidity sensor update"
    //% group="탁도(Turbidity)" weight=21
    export function turbidityUpdate(): void {
        // 값 읽기는 turbidityRead에서 직접 수행
        // 이 블록은 호환성을 위해 제공
    }

    //% block="Turbidity sensor read: %dtype"
    //% dtype.defl=TurbidityDataType.NTU
    //% group="탁도(Turbidity)" weight=20
    export function turbidityRead(dtype: TurbidityDataType): number {
        // 아날로그 값 읽기 (여러 번 읽어서 평균)
        let analogSum = 0
        for (let i = 0; i < 10; i++) {
            analogSum += pins.analogReadPin(_turbidityPin)
            basic.pause(10)
        }
        let analogValue = analogSum / 10

        // 전압 계산
        let voltage = analogValue * _turbidityRefVoltage / 1023

        if (dtype == TurbidityDataType.Voltage) {
            return Math.round(voltage * 1000) / 1000
        }

        // NTU 계산
        // 전압이 낮을수록 탁도가 높음
        // 일반적인 변환 공식: NTU = -1120.4 * V^2 + 5742.3 * V - 4353.8
        let ntu: number

        if (voltage >= _turbidityClearVoltage) {
            ntu = 0  // 맑은 물
        } else if (voltage < 0.5) {
            ntu = 3000  // 매우 탁함 (최대값)
        } else {
            // 선형 근사: 전압 감소에 따라 NTU 증가
            ntu = (_turbidityClearVoltage - voltage) / _turbidityClearVoltage * 3000
        }

        if (ntu < 0) ntu = 0
        if (ntu > 3000) ntu = 3000

        return Math.round(ntu)
    }


    /********** PIR 모션 센서 **********/

    //% block="PIR motion detected pin %pin"
    //% group="Other Sensors" weight=40
    export function pirRead(pin: DigitalPin): boolean {
        return pins.digitalReadPin(pin) == 1
    }


    /********** 토양 수분 센서 **********/

    //% block="soil moisture read pin %pin"
    //% group="Other Sensors" weight=39
    export function soilMoistureRead(pin: AnalogPin): number {
        return pins.analogReadPin(pin)
    }


    /********** 수위 센서 **********/

    //% block="water level read pin %pin"
    //% group="Other Sensors" weight=38
    export function waterLevelRead(pin: AnalogPin): number {
        return pins.analogReadPin(pin)
    }


    /********** 사운드 센서 **********/

    //% block="sound level read pin %pin"
    //% group="Other Sensors" weight=37
    export function soundRead(pin: AnalogPin): number {
        return pins.analogReadPin(pin)
    }


    /********** 진동 센서 **********/

    //% block="vibration detected pin %pin"
    //% group="Other Sensors" weight=36
    export function vibrationRead(pin: DigitalPin): boolean {
        return pins.digitalReadPin(pin) == 1
    }


    /********** 불꽃 센서 **********/

    //% block="flame detected read pin %pin"
    //% group="Other Sensors" weight=35
    export function flameRead(pin: AnalogPin): number {
        return pins.analogReadPin(pin)
    }


    /********** 터치 센서 **********/

    //% block="touch detected pin %pin"
    //% group="Other Sensors" weight=34
    export function touchRead(pin: DigitalPin): boolean {
        return pins.digitalReadPin(pin) == 1
    }


    /********** 조이스틱 **********/

    // 아날로그 조이스틱 (KY-023 등)
    // X축, Y축 아날로그 값 (0~1023)과 버튼 지원

    // 조이스틱 방향
    export enum JoystickDir {
        //% block="center"
        Center = 0,
        //% block="up"
        Up = 1,
        //% block="down"
        Down = 2,
        //% block="left"
        Left = 3,
        //% block="right"
        Right = 4,
        //% block="left up"
        UpLeft = 5,
        //% block="right up"
        UpRight = 6,
        //% block="left down"
        DownLeft = 7,
        //% block="right down"
        DownRight = 8
    }

    // 조이스틱 상태 변수
    let _joyXPin: AnalogPin = AnalogPin.P0
    let _joyYPin: AnalogPin = AnalogPin.P1
    let _joyBtnPin: DigitalPin = DigitalPin.P2
    let _joyCenterX: number = 512
    let _joyCenterY: number = 512
    let _joyDeadzone: number = 100

    //% block="joystick set|Xaxis pin %xPin|Yaxis pin %yPin|button pin %btnPin"
    //% xPin.defl=AnalogPin.P0
    //% yPin.defl=AnalogPin.P1
    //% btnPin.defl=DigitalPin.P2
    //% group="Joystick" weight=90
    //% inlineInputMode=inline
    export function joystickInit(xPin: AnalogPin, yPin: AnalogPin, btnPin: DigitalPin): void {
        _joyXPin = xPin
        _joyYPin = yPin
        _joyBtnPin = btnPin
        pins.setPull(btnPin, PinPullMode.PullUp)

        // 중앙값 자동 보정
        _joyCenterX = pins.analogReadPin(xPin)
        _joyCenterY = pins.analogReadPin(yPin)
    }

    //% block="joystick Xaxis value"
    //% group="Joystick" weight=89
    export function joystickX(): number {
        return pins.analogReadPin(_joyXPin)
    }

    //% block="joystick Yaxis value"
    //% group="Joystick" weight=88
    export function joystickY(): number {
        return pins.analogReadPin(_joyYPin)
    }

    //% block="joystick Xaxis value (-100 ~ 100)"
    //% group="Joystick" weight=87
    export function joystickXPercent(): number {
        let raw = pins.analogReadPin(_joyXPin)
        let percent = Math.floor((raw - _joyCenterX) / 5.12)
        return Math.clamp(-100, 100, percent)
    }

    //% block="joystick Yaxis value (-100 ~ 100)"
    //% group="Joystick" weight=86
    export function joystickYPercent(): number {
        let raw = pins.analogReadPin(_joyYPin)
        let percent = Math.floor((raw - _joyCenterY) / 5.12)
        return Math.clamp(-100, 100, percent)
    }

    //% block="joystick button pressed?"
    //% group="Joystick" weight=85
    export function joystickButton(): boolean {
        return pins.digitalReadPin(_joyBtnPin) == 0
    }

    //% block="joystick direction"
    //% group="Joystick" weight=84
    export function joystickDirection(): JoystickDir {
        let x = pins.analogReadPin(_joyXPin)
        let y = pins.analogReadPin(_joyYPin)

        let dx = x - _joyCenterX
        let dy = y - _joyCenterY

        // 데드존 체크
        let isLeft = dx < -_joyDeadzone
        let isRight = dx > _joyDeadzone
        let isUp = dy < -_joyDeadzone
        let isDown = dy > _joyDeadzone

        if (isUp && isLeft) return JoystickDir.UpLeft
        if (isUp && isRight) return JoystickDir.UpRight
        if (isDown && isLeft) return JoystickDir.DownLeft
        if (isDown && isRight) return JoystickDir.DownRight
        if (isUp) return JoystickDir.Up
        if (isDown) return JoystickDir.Down
        if (isLeft) return JoystickDir.Left
        if (isRight) return JoystickDir.Right

        return JoystickDir.Center
    }

    //% block="joystick direction %dir ?"
    //% dir.defl=JoystickDir.Up
    //% group="Joystick" weight=83
    export function joystickIs(dir: JoystickDir): boolean {
        return joystickDirection() == dir
    }


    /********** 매트릭스 키패드 (4x4, 4x3) **********/

    // 매트릭스 키패드는 행/열 스캔 방식으로 동작합니다.
    // 4x4: 16키 (0-9, A-D, *, #)
    // 4x3: 12키 (0-9, *, #)

    // 키패드 타입
    export enum KeypadType {
        //% block="4x4 (16key)"
        Keypad4x4 = 0,
        //% block="4x3 (12key)"
        Keypad4x3 = 1
    }

    // 키패드 상태 변수
    let _kpType: KeypadType = KeypadType.Keypad4x4
    let _kpRows: DigitalPin[] = [DigitalPin.P0, DigitalPin.P1, DigitalPin.P2, DigitalPin.P3]
    let _kpCols: DigitalPin[] = [DigitalPin.P4, DigitalPin.P5, DigitalPin.P6, DigitalPin.P7]
    let _kpLastKey: string = ""

    // 4x4 키패드 키 매핑
    const KEYPAD_4X4: string[] = [
        "1", "2", "3", "A",
        "4", "5", "6", "B",
        "7", "8", "9", "C",
        "*", "0", "#", "D"
    ]

    // 4x3 키패드 키 매핑
    const KEYPAD_4X3: string[] = [
        "1", "2", "3",
        "4", "5", "6",
        "7", "8", "9",
        "*", "0", "#"
    ]

    //% block="keypad set type %kpType|row pin %r1 %r2 %r3 %r4|column pin %c1 %c2 %c3 %c4"
    //% kpType.defl=KeypadType.Keypad4x4
    //% r1.defl=DigitalPin.P0 r2.defl=DigitalPin.P1 r3.defl=DigitalPin.P2 r4.defl=DigitalPin.P3
    //% c1.defl=DigitalPin.P4 c2.defl=DigitalPin.P5 c3.defl=DigitalPin.P6 c4.defl=DigitalPin.P7
    //% group="Keypad" weight=82
    //% inlineInputMode=inline
    export function keypadInit(kpType: KeypadType, r1: DigitalPin, r2: DigitalPin, r3: DigitalPin, r4: DigitalPin, c1: DigitalPin, c2: DigitalPin, c3: DigitalPin, c4: DigitalPin): void {
        _kpType = kpType
        _kpRows = [r1, r2, r3, r4]

        if (kpType == KeypadType.Keypad4x4) {
            _kpCols = [c1, c2, c3, c4]
        } else {
            _kpCols = [c1, c2, c3]
        }

        // 행 핀: 출력, 열 핀: 입력 (풀업)
        for (let row of _kpRows) {
            pins.digitalWritePin(row, 1)
        }
        for (let col of _kpCols) {
            pins.setPull(col, PinPullMode.PullUp)
        }
    }

    //% block="keypad key read"
    //% group="Keypad" weight=81
    export function keypadRead(): string {
        let numCols = _kpType == KeypadType.Keypad4x4 ? 4 : 3
        let keys = _kpType == KeypadType.Keypad4x4 ? KEYPAD_4X4 : KEYPAD_4X3

        for (let r = 0; r < 4; r++) {
            // 현재 행만 LOW로 설정
            for (let i = 0; i < 4; i++) {
                pins.digitalWritePin(_kpRows[i], i == r ? 0 : 1)
            }
            control.waitMicros(10)

            // 열 스캔
            for (let c = 0; c < numCols; c++) {
                if (pins.digitalReadPin(_kpCols[c]) == 0) {
                    // 키 눌림 감지
                    _kpLastKey = keys[r * numCols + c]

                    // 모든 행 HIGH로 복원
                    for (let i = 0; i < 4; i++) {
                        pins.digitalWritePin(_kpRows[i], 1)
                    }

                    // 디바운스
                    basic.pause(50)
                    return _kpLastKey
                }
            }
        }

        // 모든 행 HIGH로 복원
        for (let i = 0; i < 4; i++) {
            pins.digitalWritePin(_kpRows[i], 1)
        }

        return ""
    }

    //% block="keypad key pressed?"
    //% group="Keypad" weight=80
    export function keypadPressed(): boolean {
        return keypadRead() != ""
    }

    //% block="keypad last key"
    //% group="Keypad" weight=79
    export function keypadLastKey(): string {
        return _kpLastKey
    }

    //% block="keypad key %key ?"
    //% key.defl="1"
    //% group="Keypad" weight=78
    export function keypadIs(key: string): boolean {
        let pressed = keypadRead()
        return pressed == key
    }

    //% block="keypad number key pressed? (0-9)"
    //% group="Keypad" weight=77
    export function keypadIsNumber(): boolean {
        let key = keypadRead()
        return key >= "0" && key <= "9"
    }

    //% block="keypad pressed key number to"
    //% group="Keypad" weight=76
    export function keypadNumber(): number {
        let key = _kpLastKey
        if (key >= "0" && key <= "9") {
            return parseInt(key)
        }
        return -1
    }


    /********** 로터리 엔코더 **********/

    // 로터리 엔코더 (KY-040 등)
    // 회전 방향 감지, 누적 카운터 지원

    // 회전 방향
    export enum RotaryDir {
        //% block="stop"
        None = 0,
        //% block="clockwise"
        CW = 1,
        //% block="counter-clockwise"
        CCW = -1
    }

    // 로터리 엔코더 상태 변수
    let _rotaryDT: DigitalPin = DigitalPin.P2
    let _rotaryCLK: DigitalPin = DigitalPin.P3
    let _rotaryCounter: number = 0
    let _rotaryLastCLK: number = 0
    let _rotaryDirection: RotaryDir = RotaryDir.None

    //% block="rotary encoder: DT pin %dt|CLK pin %clk|set"
    //% dt.defl=DigitalPin.P2
    //% clk.defl=DigitalPin.P3
    //% group="Rotary Encoder" weight=75
    //% inlineInputMode=inline
    export function rotaryInit(dt: DigitalPin, clk: DigitalPin): void {
        _rotaryDT = dt
        _rotaryCLK = clk
        _rotaryCounter = 0
        _rotaryLastCLK = pins.digitalReadPin(clk)
        _rotaryDirection = RotaryDir.None
    }

    //% block="rotary encoder rotate value"
    //% group="Rotary Encoder" weight=74
    export function rotaryRead(): number {
        let currentCLK = pins.digitalReadPin(_rotaryCLK)
        let change = 0

        // CLK이 변했을 때만 감지
        if (currentCLK != _rotaryLastCLK && currentCLK == 0) {
            // DT 값으로 방향 판단
            if (pins.digitalReadPin(_rotaryDT) != currentCLK) {
                _rotaryCounter++
                _rotaryDirection = RotaryDir.CW
                change = 1
            } else {
                _rotaryCounter--
                _rotaryDirection = RotaryDir.CCW
                change = -1
            }
        }

        _rotaryLastCLK = currentCLK
        return change
    }

    //% block="rotary encoder rotate direction"
    //% group="Rotary Encoder" weight=73
    export function rotaryDirection(): RotaryDir {
        rotaryRead()  // 상태 업데이트
        let dir = _rotaryDirection
        _rotaryDirection = RotaryDir.None  // 읽은 후 리셋
        return dir
    }

    //% block="rotary encoder counter"
    //% group="Rotary Encoder" weight=72
    export function rotaryCounter(): number {
        rotaryRead()  // 상태 업데이트
        return _rotaryCounter
    }

    //% block="rotary encoder counter reset"
    //% group="Rotary Encoder" weight=71
    export function rotaryReset(): void {
        _rotaryCounter = 0
        _rotaryDirection = RotaryDir.None
    }


    /********** 버튼 **********/

    //% block="button pressed? (digital pin %pin)"
    //% pin.defl=DigitalPin.P0
    //% group="Button" weight=70
    export function buttonRead(pin: DigitalPin): boolean {
        pins.setPull(pin, PinPullMode.PullUp)
        return pins.digitalReadPin(pin) == 0
    }

    //% block="button pressed wait (digital pin %pin)"
    //% pin.defl=DigitalPin.P0
    //% group="Button" weight=69
    export function buttonWait(pin: DigitalPin): void {
        pins.setPull(pin, PinPullMode.PullUp)
        while (pins.digitalReadPin(pin) == 1) {
            basic.pause(10)
        }
        basic.pause(50)  // 디바운스
    }


    /********** 가변저항 **********/

    //% block="potentiometer value (analog pin %pin)"
    //% pin.defl=AnalogPin.P0
    //% group="Potentiometer" weight=68
    export function potentiometerRead(pin: AnalogPin): number {
        return pins.analogReadPin(pin)
    }

    //% block="potentiometer value 0~100 (analog pin %pin)"
    //% pin.defl=AnalogPin.P0
    //% group="Potentiometer" weight=67
    export function potentiometerPercent(pin: AnalogPin): number {
        return Math.floor(pins.analogReadPin(pin) / 10.23)
    }
}
