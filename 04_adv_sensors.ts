/**
 * BRIXEL Extension - 04. Advanced Sensors
 * RTC, BMP280, MPU6050, SGP30, VL53L0X, SHT30, TCS34725, CCS811, I2C Weight Sensor, etc.
 */

//% weight=1070 color=#4D68EC icon="\uf0e7" block="04. Adv Sensors"
//% groups="['실시간(RTC)', '대기압(BMP280)', '6축 가속도(MPU6050)', 'CO2센서(SGP30)', '거리센서(VL53L0X)', '온습도(I2C-SHT30)', '색상감지(TCS34725)', '비접촉온도(MLX90614)', '제스처(APDS9960)', '심박(MAX30102)', '온습도(Si7021)', '조도(BH1750)', '조도(TSL2561)', 'CO2센서(CCS811)', '3축 가속도(ADXL345)', '대기압(BME280)', 'Fingerprint', '전류/전압/전력 측정(INA219)', 'I2C 무게센서']"
namespace AdvSensors {


    /********** RTC 모듈 (DS1302, DS1307, DS3231) **********/

    // RTC(Real Time Clock)는 전원이 꺼져도 시간을 유지하는 모듈입니다.
    // DS1307, DS3231: I2C 통신 (주소 0x68)
    // DS1302: 3선 통신 (CLK, DAT, RST)

    // RTC 시간 데이터
    export enum RTCData {
        //% block="year"
        Year = 0,
        //% block="month"
        Month = 1,
        //% block="day"
        Day = 2,
        //% block="hour"
        Hour = 3,
        //% block="minute"
        Minute = 4,
        //% block="second"
        Second = 5,
        //% block="day of week"
        DayOfWeek = 6
    }

    // RTC 시간 문자열 형식
    export enum RTCFormat {
        //% block="year/month/day hour:minute:second"
        Full = 0,
        //% block="year/month/day"
        DateOnly = 1,
        //% block="hour:minute:second"
        TimeOnly = 2,
        //% block="hour:minute"
        HourMinute = 3
    }

    // RTC SQW 출력 주파수
    export enum RTCSqwFreq {
        //% block="none"
        Off = 0,
        //% block="1Hz"
        Freq1Hz = 1,
        //% block="4.096kHz"
        Freq4kHz = 2,
        //% block="8.192kHz"
        Freq8kHz = 3,
        //% block="32.768kHz"
        Freq32kHz = 4
    }

    // RTC 상태 변수
    let _rtcAddr: number = 0x68  // DS1307/DS3231 I2C 주소
    let _rtcYear: number = 2024
    let _rtcMonth: number = 1
    let _rtcDay: number = 1
    let _rtcHour: number = 0
    let _rtcMinute: number = 0
    let _rtcSecond: number = 0
    let _rtcDayOfWeek: number = 1

    //% block="RTC(DS1307) set %addr"
    //% addr.defl=0x68
    //% group="실시간(RTC)" weight=180
    export function rtcInit(addr: number): void {
        _rtcAddr = addr
        // DS1307/DS3231 초기화 - 오실레이터 활성화
        let buf = pins.createBuffer(2)
        buf[0] = 0x00  // 초 레지스터
        buf[1] = 0x00  // CH 비트 = 0 (오실레이터 활성화)
        pins.i2cWriteBuffer(_rtcAddr, buf)
    }

    //% block="RTC %addr|time set year %year|month %month|day %day|hour %hour|minute %minute|second %second"
    //% addr.defl=1
    //% year.defl=2024 year.min=2000 year.max=2099
    //% month.defl=1 month.min=1 month.max=12
    //% day.defl=1 day.min=1 day.max=31
    //% hour.defl=12 hour.min=0 hour.max=23
    //% minute.defl=0 minute.min=0 minute.max=59
    //% second.defl=0 second.min=0 second.max=59
    //% group="실시간(RTC)" weight=179
    //% inlineInputMode=inline
    export function rtcSetTime(addr: number, year: number, month: number, day: number, hour: number, minute: number, second: number): void {
        let buf = pins.createBuffer(8)
        buf[0] = 0x00  // 시작 레지스터
        buf[1] = decToBcd(second)
        buf[2] = decToBcd(minute)
        buf[3] = decToBcd(hour)
        buf[4] = 0x01  // 요일 (1-7)
        buf[5] = decToBcd(day)
        buf[6] = decToBcd(month)
        buf[7] = decToBcd(year - 2000)

        pins.i2cWriteBuffer(_rtcAddr, buf)

        // 내부 변수 업데이트
        _rtcYear = year
        _rtcMonth = month
        _rtcDay = day
        _rtcHour = hour
        _rtcMinute = minute
        _rtcSecond = second
    }

    //% block="RTC %addr|get %data"
    //% addr.defl=1
    //% group="실시간(RTC)" weight=178
    export function rtcGet(addr: number, data: RTCData): number {
        rtcReadAll()

        switch (data) {
            case RTCData.Year: return _rtcYear
            case RTCData.Month: return _rtcMonth
            case RTCData.Day: return _rtcDay
            case RTCData.Hour: return _rtcHour
            case RTCData.Minute: return _rtcMinute
            case RTCData.Second: return _rtcSecond
            case RTCData.DayOfWeek: return _rtcDayOfWeek
            default: return 0
        }
    }

    //% block="RTC %addr|clock %action"
    //% addr.defl=1
    //% action.shadow="toggleOnOff" action.defl=true
    //% group="실시간(RTC)" weight=177
    export function rtcStart(addr: number, action: boolean): void {
        // 초 레지스터의 CH 비트로 시계 시작/정지
        pins.i2cWriteNumber(_rtcAddr, 0x00, NumberFormat.UInt8BE)
        let seconds = pins.i2cReadNumber(_rtcAddr, NumberFormat.UInt8BE)

        if (action) {
            seconds &= 0x7F  // CH = 0 (시작)
        } else {
            seconds |= 0x80  // CH = 1 (정지)
        }

        let buf = pins.createBuffer(2)
        buf[0] = 0x00
        buf[1] = seconds
        pins.i2cWriteBuffer(_rtcAddr, buf)
    }

    //% block="RTC %addr|SQW output %freq"
    //% addr.defl=1
    //% group="실시간(RTC)" weight=176
    export function rtcSetSqw(addr: number, freq: RTCSqwFreq): void {
        let control = 0x00

        switch (freq) {
            case RTCSqwFreq.Off:
                control = 0x00
                break
            case RTCSqwFreq.Freq1Hz:
                control = 0x10
                break
            case RTCSqwFreq.Freq4kHz:
                control = 0x11
                break
            case RTCSqwFreq.Freq8kHz:
                control = 0x12
                break
            case RTCSqwFreq.Freq32kHz:
                control = 0x13
                break
        }

        let buf = pins.createBuffer(2)
        buf[0] = 0x07  // 컨트롤 레지스터
        buf[1] = control
        pins.i2cWriteBuffer(_rtcAddr, buf)
    }

    //% block="RTC %addr|time string get format %format"
    //% addr.defl=1
    //% group="실시간(RTC)" weight=175
    export function rtcGetString(addr: number, format: RTCFormat): string {
        rtcReadAll()

        let dateStr = _rtcYear + "/" + padZero(_rtcMonth) + "/" + padZero(_rtcDay)
        let timeStr = padZero(_rtcHour) + ":" + padZero(_rtcMinute) + ":" + padZero(_rtcSecond)

        switch (format) {
            case RTCFormat.Full:
                return dateStr + " " + timeStr
            case RTCFormat.DateOnly:
                return dateStr
            case RTCFormat.TimeOnly:
                return timeStr
            case RTCFormat.HourMinute:
                return padZero(_rtcHour) + ":" + padZero(_rtcMinute)
            default:
                return dateStr + " " + timeStr
        }
    }

    // RTC 전체 읽기 (내부 함수)
    function rtcReadAll(): void {
        pins.i2cWriteNumber(_rtcAddr, 0x00, NumberFormat.UInt8BE)
        let buf = pins.i2cReadBuffer(_rtcAddr, 7)

        _rtcSecond = bcdToDec(buf[0] & 0x7F)
        _rtcMinute = bcdToDec(buf[1])
        _rtcHour = bcdToDec(buf[2] & 0x3F)
        _rtcDayOfWeek = buf[3]
        _rtcDay = bcdToDec(buf[4])
        _rtcMonth = bcdToDec(buf[5])
        _rtcYear = 2000 + bcdToDec(buf[6])
    }

    // BCD ↔ 10진수 변환 (내부 함수)
    function decToBcd(dec: number): number {
        return Math.floor(dec / 10) * 16 + (dec % 10)
    }

    function bcdToDec(bcd: number): number {
        return Math.floor(bcd / 16) * 10 + (bcd % 16)
    }

    function padZero(num: number): string {
        return num < 10 ? "0" + num : "" + num
    }


    /********** BMP280 기압/온도 센서 **********/

    // BMP280 측정 타입
    export enum BMP280Type {
        //% block="pressure(hPa)"
        Pressure = 0,
        //% block="temperature(°C)"
        Temperature = 1
    }

    // BMP280 데이터 저장 변수
    let _bmp280Addr: number = 0x76
    let _bmp280Pressure: number = 0
    let _bmp280Temp: number = 0

    //% block="BMP280 init address %addr"
    //% addr.defl=0x76
    //% group="대기압(BMP280)" weight=170
    export function bmp280Init(addr: number): void {
        _bmp280Addr = addr
        // 컨트롤 레지스터 설정 (Normal mode, oversampling x1)
        pins.i2cWriteNumber(_bmp280Addr, 0xF427, NumberFormat.UInt16BE)
        basic.pause(100)
    }

    //% block="BMP280 read %btype"
    //% group="대기압(BMP280)" weight=169
    export function bmp280Read(btype: BMP280Type): number {
        // 기압 데이터 읽기 (0xF7~0xF9)
        pins.i2cWriteNumber(_bmp280Addr, 0xF7, NumberFormat.UInt8BE)
        let buf = pins.i2cReadBuffer(_bmp280Addr, 6)

        let pressRaw = (buf[0] << 12) | (buf[1] << 4) | (buf[2] >> 4)
        let tempRaw = (buf[3] << 12) | (buf[4] << 4) | (buf[5] >> 4)

        // 간소화된 계산 (실제로는 보정 계수 필요)
        _bmp280Temp = tempRaw / 5120.0
        _bmp280Pressure = pressRaw / 256.0 / 100.0

        if (btype == BMP280Type.Temperature) {
            return _bmp280Temp
        }
        return _bmp280Pressure
    }


    /********** MPU6050 가속도/자이로 센서 **********/

    // 축 선택
    export enum Axis {
        //% block="X"
        X = 0,
        //% block="Y"
        Y = 1,
        //% block="Z"
        Z = 2
    }

    // MPU6050 측정 타입
    export enum MPU6050Type {
        //% block="acceleration"
        Accel = 0,
        //% block="gyro"
        Gyro = 1,
        //% block="temperature"
        Temp = 2
    }

    // MPU6050 데이터 타입 (한글)
    export enum MPU6050DataType {
        //% block="temperature(°C)"
        Temperature = 0,
        //% block="accel X"
        AccelX = 1,
        //% block="accel Y"
        AccelY = 2,
        //% block="accel Z"
        AccelZ = 3,
        //% block="gyro X"
        GyroX = 4,
        //% block="gyro Y"
        GyroY = 5,
        //% block="gyro Z"
        GyroZ = 6
    }

    // MPU6050 데이터 저장 변수
    let _mpu6050Addr: number = 0x68
    let _mpu6050GyroOffsetX: number = 0
    let _mpu6050GyroOffsetY: number = 0
    let _mpu6050GyroOffsetZ: number = 0
    let _mpu6050AccelX: number = 0
    let _mpu6050AccelY: number = 0
    let _mpu6050AccelZ: number = 0
    let _mpu6050GyroX: number = 0
    let _mpu6050GyroY: number = 0
    let _mpu6050GyroZ: number = 0
    let _mpu6050Temp: number = 0

    //% block="Gyro sensor(MPU6050) setup"
    //% group="6축 가속도(MPU6050)" weight=165
    export function mpu6050Setup(): void {
        _mpu6050Addr = 0x68
        // 슬립 모드 해제
        pins.i2cWriteNumber(_mpu6050Addr, 0x6B00, NumberFormat.UInt16BE)
        basic.pause(100)
        // 자이로 범위 설정 (±250°/s)
        pins.i2cWriteNumber(_mpu6050Addr, 0x1B00, NumberFormat.UInt16BE)
        // 가속도 범위 설정 (±2g)
        pins.i2cWriteNumber(_mpu6050Addr, 0x1C00, NumberFormat.UInt16BE)
        basic.pause(10)
    }

    //% block="MPU6050 update values"
    //% group="6축 가속도(MPU6050)" weight=164
    export function mpu6050Update(): void {
        // 가속도 읽기
        pins.i2cWriteNumber(_mpu6050Addr, 0x3B, NumberFormat.UInt8BE)
        let accelBuf = pins.i2cReadBuffer(_mpu6050Addr, 6)
        _mpu6050AccelX = (accelBuf[0] << 8) | accelBuf[1]
        if (_mpu6050AccelX > 32767) _mpu6050AccelX -= 65536
        _mpu6050AccelY = (accelBuf[2] << 8) | accelBuf[3]
        if (_mpu6050AccelY > 32767) _mpu6050AccelY -= 65536
        _mpu6050AccelZ = (accelBuf[4] << 8) | accelBuf[5]
        if (_mpu6050AccelZ > 32767) _mpu6050AccelZ -= 65536

        // 온도 읽기
        pins.i2cWriteNumber(_mpu6050Addr, 0x41, NumberFormat.UInt8BE)
        let tempVal = pins.i2cReadNumber(_mpu6050Addr, NumberFormat.Int16BE)
        _mpu6050Temp = Math.floor(tempVal / 340 + 36.53)

        // 자이로 읽기 (오프셋 적용)
        pins.i2cWriteNumber(_mpu6050Addr, 0x43, NumberFormat.UInt8BE)
        let gyroBuf = pins.i2cReadBuffer(_mpu6050Addr, 6)
        let rawGyroX = (gyroBuf[0] << 8) | gyroBuf[1]
        if (rawGyroX > 32767) rawGyroX -= 65536
        let rawGyroY = (gyroBuf[2] << 8) | gyroBuf[3]
        if (rawGyroY > 32767) rawGyroY -= 65536
        let rawGyroZ = (gyroBuf[4] << 8) | gyroBuf[5]
        if (rawGyroZ > 32767) rawGyroZ -= 65536

        _mpu6050GyroX = rawGyroX - _mpu6050GyroOffsetX
        _mpu6050GyroY = rawGyroY - _mpu6050GyroOffsetY
        _mpu6050GyroZ = rawGyroZ - _mpu6050GyroOffsetZ
    }

    //% block="MPU6050 read: %dtype"
    //% dtype.defl=MPU6050DataType.Temperature
    //% group="6축 가속도(MPU6050)" weight=163
    export function mpu6050ReadValue(dtype: MPU6050DataType): number {
        if (dtype == MPU6050DataType.Temperature) return _mpu6050Temp
        if (dtype == MPU6050DataType.AccelX) return _mpu6050AccelX
        if (dtype == MPU6050DataType.AccelY) return _mpu6050AccelY
        if (dtype == MPU6050DataType.AccelZ) return _mpu6050AccelZ
        if (dtype == MPU6050DataType.GyroX) return _mpu6050GyroX
        if (dtype == MPU6050DataType.GyroY) return _mpu6050GyroY
        return _mpu6050GyroZ
    }

    //% block="Gyro offset set X: %x Y: %y Z: %z"
    //% x.defl=0 y.defl=0 z.defl=0
    //% group="6축 가속도(MPU6050)" weight=162
    //% inlineInputMode=inline
    export function mpu6050SetGyroOffset(x: number, y: number, z: number): void {
        _mpu6050GyroOffsetX = x
        _mpu6050GyroOffsetY = y
        _mpu6050GyroOffsetZ = z
    }

    //% block="Gyro auto calibrate stabilize: %stabilizeTime ms measure: %measureTime ms"
    //% stabilizeTime.defl=1000 stabilizeTime.min=100 stabilizeTime.max=5000
    //% measureTime.defl=3000 measureTime.min=500 measureTime.max=10000
    //% group="6축 가속도(MPU6050)" weight=161
    //% inlineInputMode=inline
    export function mpu6050AutoCalibrate(stabilizeTime: number, measureTime: number): void {
        // 안정화 대기
        basic.pause(stabilizeTime)

        // 측정 횟수 계산 (약 10ms 간격)
        let samples = Math.floor(measureTime / 10)
        let sumX = 0
        let sumY = 0
        let sumZ = 0

        // 여러 번 측정하여 평균 계산
        for (let i = 0; i < samples; i++) {
            pins.i2cWriteNumber(_mpu6050Addr, 0x43, NumberFormat.UInt8BE)
            let gyroBuf = pins.i2cReadBuffer(_mpu6050Addr, 6)

            let rawX = (gyroBuf[0] << 8) | gyroBuf[1]
            if (rawX > 32767) rawX -= 65536
            let rawY = (gyroBuf[2] << 8) | gyroBuf[3]
            if (rawY > 32767) rawY -= 65536
            let rawZ = (gyroBuf[4] << 8) | gyroBuf[5]
            if (rawZ > 32767) rawZ -= 65536

            sumX += rawX
            sumY += rawY
            sumZ += rawZ

            basic.pause(10)
        }

        // 오프셋 설정
        _mpu6050GyroOffsetX = Math.round(sumX / samples)
        _mpu6050GyroOffsetY = Math.round(sumY / samples)
        _mpu6050GyroOffsetZ = Math.round(sumZ / samples)
    }

    //% block="MPU6050 init address %addr"
    //% addr.defl=0x68
    //% group="6축 가속도(MPU6050)" weight=160
    export function mpu6050Init(addr: number): void {
        _mpu6050Addr = addr
        // 슬립 모드 해제
        pins.i2cWriteNumber(_mpu6050Addr, 0x6B00, NumberFormat.UInt16BE)
        basic.pause(100)
    }

    //% block="MPU6050 read %mtype axis %axis"
    //% group="6축 가속도(MPU6050)" weight=159
    export function mpu6050Read(mtype: MPU6050Type, axis: Axis): number {
        let reg = 0x3B  // 가속도 X 시작 레지스터

        if (mtype == MPU6050Type.Accel) {
            reg = 0x3B + (axis * 2)
        } else if (mtype == MPU6050Type.Gyro) {
            reg = 0x43 + (axis * 2)
        } else {
            // 온도
            reg = 0x41
        }

        pins.i2cWriteNumber(_mpu6050Addr, reg, NumberFormat.UInt8BE)
        let val = pins.i2cReadNumber(_mpu6050Addr, NumberFormat.Int16BE)

        if (mtype == MPU6050Type.Temp) {
            return Math.floor(val / 340 + 36.53)
        }
        return val
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
    //% group="CO2센서(SGP30)" weight=155
    export function sgp30Init(): void {
        // IAQ 초기화 명령
        pins.i2cWriteNumber(_sgp30Addr, 0x2003, NumberFormat.UInt16BE)
        basic.pause(10)
    }

    //% block="SGP30 measure run"
    //% group="CO2센서(SGP30)" weight=154
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
    //% group="CO2센서(SGP30)" weight=153
    export function sgp30Read(stype: SGP30Type): number {
        if (stype == SGP30Type.eCO2) {
            return _sgp30eCO2
        }
        return _sgp30TVOC
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
    //% group="거리센서(VL53L0X)" weight=150
    export function vl53l0xInit(addr: number): void {
        _vl53l0xAddr = addr
    }

    //% block="VL53L0X set mode | mode %mode | precision %precision"
    //% group="거리센서(VL53L0X)" weight=149
    export function vl53l0xSetMode(mode: VL53L0XMode, precision: VL53L0XPrecision): void {
        _vl53l0xMode = mode
        _vl53l0xPrecision = precision

        // 정밀도에 따른 타이밍 설정
        let timingBudget = _vl53l0xPrecision == VL53L0XPrecision.High ? 200000 : 20000

        // I2C로 설정 전송
        pins.i2cWriteNumber(_vl53l0xAddr, 0x01, NumberFormat.UInt8BE)
    }

    //% block="VL53L0X control %control"
    //% group="거리센서(VL53L0X)" weight=148
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
    //% group="거리센서(VL53L0X)" weight=147
    export function vl53l0xRead(readType: VL53L0XReadType): number {
        if (readType == VL53L0XReadType.Distance) {
            return _vl53l0xDistance
        }
        return _vl53l0xAmbient
    }


    /********** SHT30 센서 **********/

    // 온도 단위
    export enum TempUnit {
        //% block="Celsius (°C)"
        Celsius = 0,
        //% block="Fahrenheit (°F)"
        Fahrenheit = 1
    }

    // SHT30 데이터 저장 변수
    let _sht30Temperature: number = 0
    let _sht30Humidity: number = 0
    let _sht30Addr: number = 0x44

    //% block="SHT30 init address %addr"
    //% addr.defl=0x44
    //% group="온습도(I2C-SHT30)" weight=145
    export function sht30Init(addr: number): void {
        _sht30Addr = addr
    }

    //% block="SHT30 start measurement"
    //% group="온습도(I2C-SHT30)" weight=144
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
    //% group="온습도(I2C-SHT30)" weight=143
    export function sht30ReadTemp(unit: TempUnit): number {
        if (unit == TempUnit.Fahrenheit) {
            return _sht30Temperature * 9 / 5 + 32
        }
        return _sht30Temperature
    }

    //% block="SHT30 read humidity"
    //% group="온습도(I2C-SHT30)" weight=142
    export function sht30ReadHumidity(): number {
        return _sht30Humidity
    }


    /********** TCS34725 RGB 컬러 센서 **********/

    // TCS34725 감지 색상 타입
    export enum TCS34725DetectType {
        //% block="raw"
        Raw = 0,
        //% block="color"
        Color = 1
    }

    // TCS34725 색상 채널
    export enum TCS34725Channel {
        //% block="red"
        Red = 0,
        //% block="green"
        Green = 1,
        //% block="blue"
        Blue = 2,
        //% block="clear"
        Clear = 3
    }

    // TCS34725 감지 색상
    export enum TCS34725Color {
        //% block="red"
        Red = 0,
        //% block="orange"
        Orange = 1,
        //% block="yellow"
        Yellow = 2,
        //% block="green"
        Green = 3,
        //% block="blue"
        Blue = 4,
        //% block="purple"
        Purple = 5,
        //% block="white"
        White = 6,
        //% block="black"
        Black = 7
    }

    // RGB 색상
    export enum RGBColor {
        //% block="red(R)"
        Red = 0,
        //% block="green(G)"
        Green = 1,
        //% block="blue(B)"
        Blue = 2,
        //% block="clear(C)"
        Clear = 3
    }

    // TCS34725 데이터 저장 변수
    let _tcs34725Addr: number = 0x29
    let _tcs34725R: number = 0
    let _tcs34725G: number = 0
    let _tcs34725B: number = 0
    let _tcs34725C: number = 0
    let _tcs34725R8: number = 0
    let _tcs34725G8: number = 0
    let _tcs34725B8: number = 0
    let _tcs34725DetectedColor: TCS34725Color = TCS34725Color.Black

    //% block="Color sensor(TCS34725) setup"
    //% group="색상감지(TCS34725)" weight=135
    export function tcs34725Setup(): void {
        _tcs34725Addr = 0x29
        // Enable 레지스터 (PON + AEN)
        pins.i2cWriteNumber(_tcs34725Addr, 0x80 | 0x00, NumberFormat.UInt8BE)
        pins.i2cWriteNumber(_tcs34725Addr, 0x03, NumberFormat.UInt8BE)
        // 통합 시간 설정 (101ms)
        pins.i2cWriteNumber(_tcs34725Addr, 0x80 | 0x01, NumberFormat.UInt8BE)
        pins.i2cWriteNumber(_tcs34725Addr, 0xD5, NumberFormat.UInt8BE)
        // 게인 설정 (4x)
        pins.i2cWriteNumber(_tcs34725Addr, 0x80 | 0x0F, NumberFormat.UInt8BE)
        pins.i2cWriteNumber(_tcs34725Addr, 0x01, NumberFormat.UInt8BE)
        basic.pause(50)
    }

    //% block="Color sensor reset"
    //% group="색상감지(TCS34725)" weight=134
    export function tcs34725Reset(): void {
        _tcs34725R = 0
        _tcs34725G = 0
        _tcs34725B = 0
        _tcs34725C = 0
        _tcs34725R8 = 0
        _tcs34725G8 = 0
        _tcs34725B8 = 0
        _tcs34725DetectedColor = TCS34725Color.Black
    }

    //% block="Color sensor detect %dtype"
    //% dtype.defl=TCS34725DetectType.Color
    //% group="색상감지(TCS34725)" weight=133
    export function tcs34725Detect(dtype: TCS34725DetectType): number {
        // 모든 채널 읽기
        pins.i2cWriteNumber(_tcs34725Addr, 0x80 | 0x14, NumberFormat.UInt8BE)
        _tcs34725C = pins.i2cReadNumber(_tcs34725Addr, NumberFormat.UInt16LE)

        pins.i2cWriteNumber(_tcs34725Addr, 0x80 | 0x16, NumberFormat.UInt8BE)
        _tcs34725R = pins.i2cReadNumber(_tcs34725Addr, NumberFormat.UInt16LE)

        pins.i2cWriteNumber(_tcs34725Addr, 0x80 | 0x18, NumberFormat.UInt8BE)
        _tcs34725G = pins.i2cReadNumber(_tcs34725Addr, NumberFormat.UInt16LE)

        pins.i2cWriteNumber(_tcs34725Addr, 0x80 | 0x1A, NumberFormat.UInt8BE)
        _tcs34725B = pins.i2cReadNumber(_tcs34725Addr, NumberFormat.UInt16LE)

        // 8비트로 변환 (0-255)
        if (_tcs34725C > 0) {
            _tcs34725R8 = Math.min(255, Math.round(_tcs34725R * 255 / _tcs34725C))
            _tcs34725G8 = Math.min(255, Math.round(_tcs34725G * 255 / _tcs34725C))
            _tcs34725B8 = Math.min(255, Math.round(_tcs34725B * 255 / _tcs34725C))
        }

        // 색상 판별
        _tcs34725DetectedColor = tcs34725DetectColor()

        if (dtype == TCS34725DetectType.Raw) {
            return _tcs34725C
        }
        return _tcs34725DetectedColor
    }

    //% block="Color sensor %channel (0~255)"
    //% channel.defl=TCS34725Channel.Red
    //% group="색상감지(TCS34725)" weight=132
    export function tcs34725GetChannel(channel: TCS34725Channel): number {
        if (channel == TCS34725Channel.Red) return _tcs34725R8
        if (channel == TCS34725Channel.Green) return _tcs34725G8
        if (channel == TCS34725Channel.Blue) return _tcs34725B8
        return Math.min(255, Math.round(_tcs34725C / 256))
    }

    //% block="Color sensor is %color ?"
    //% color.defl=TCS34725Color.Red
    //% group="색상감지(TCS34725)" weight=131
    export function tcs34725IsColor(color: TCS34725Color): boolean {
        return _tcs34725DetectedColor == color
    }

    // 색상 판별 내부 함수
    function tcs34725DetectColor(): TCS34725Color {
        let r = _tcs34725R8
        let g = _tcs34725G8
        let b = _tcs34725B8

        // 밝기 계산
        let brightness = (r + g + b) / 3

        // 검정 (어두움)
        if (brightness < 30) {
            return TCS34725Color.Black
        }

        // 흰색 (모든 채널이 높고 비슷함)
        if (brightness > 200 && Math.abs(r - g) < 30 && Math.abs(g - b) < 30) {
            return TCS34725Color.White
        }

        // 색상 판별 (가장 높은 채널 기준)
        if (r > g && r > b) {
            if (g > b + 50) {
                return TCS34725Color.Orange  // 빨강 + 초록 = 주황
            }
            if (g > b + 20 && g > 100) {
                return TCS34725Color.Yellow  // 빨강 + 초록(높음) = 노랑
            }
            return TCS34725Color.Red
        }

        if (g > r && g > b) {
            return TCS34725Color.Green
        }

        if (b > r && b > g) {
            if (r > g + 30) {
                return TCS34725Color.Purple  // 파랑 + 빨강 = 보라
            }
            return TCS34725Color.Blue
        }

        return TCS34725Color.White  // 기본값
    }

    //% block="TCS34725 init address %addr"
    //% addr.defl=0x29
    //% group="색상감지(TCS34725)" weight=130
    export function tcs34725Init(addr: number): void {
        _tcs34725Addr = addr
        // Enable 레지스터 (PON + AEN)
        pins.i2cWriteNumber(_tcs34725Addr, 0x80 | 0x00, NumberFormat.UInt8BE)
        pins.i2cWriteNumber(_tcs34725Addr, 0x03, NumberFormat.UInt8BE)
        // 통합 시간 설정
        pins.i2cWriteNumber(_tcs34725Addr, 0x80 | 0x01, NumberFormat.UInt8BE)
        pins.i2cWriteNumber(_tcs34725Addr, 0xD5, NumberFormat.UInt8BE)
        basic.pause(50)
    }

    //% block="TCS34725 color read %color"
    //% group="색상감지(TCS34725)" weight=129
    export function tcs34725Read(color: RGBColor): number {
        // Clear 데이터 읽기
        pins.i2cWriteNumber(_tcs34725Addr, 0x80 | 0x14, NumberFormat.UInt8BE)
        _tcs34725C = pins.i2cReadNumber(_tcs34725Addr, NumberFormat.UInt16LE)

        // Red 데이터 읽기
        pins.i2cWriteNumber(_tcs34725Addr, 0x80 | 0x16, NumberFormat.UInt8BE)
        _tcs34725R = pins.i2cReadNumber(_tcs34725Addr, NumberFormat.UInt16LE)

        // Green 데이터 읽기
        pins.i2cWriteNumber(_tcs34725Addr, 0x80 | 0x18, NumberFormat.UInt8BE)
        _tcs34725G = pins.i2cReadNumber(_tcs34725Addr, NumberFormat.UInt16LE)

        // Blue 데이터 읽기
        pins.i2cWriteNumber(_tcs34725Addr, 0x80 | 0x1A, NumberFormat.UInt8BE)
        _tcs34725B = pins.i2cReadNumber(_tcs34725Addr, NumberFormat.UInt16LE)

        if (color == RGBColor.Red) return _tcs34725R
        if (color == RGBColor.Green) return _tcs34725G
        if (color == RGBColor.Blue) return _tcs34725B
        return _tcs34725C
    }


    /********** MLX90614 Infrared Temperature Sensor **********/

    // MLX90614 Temperature Source
    export enum MLX90614Source {
        //% block="Object"
        Object = 0,
        //% block="Ambient"
        Ambient = 1
    }

    // MLX90614 Temperature Unit
    export enum MLX90614TempUnit {
        //% block="Celsius (°C)"
        Celsius = 0,
        //% block="Fahrenheit (°F)"
        Fahrenheit = 1,
        //% block="Kelvin (K)"
        Kelvin = 2
    }

    // MLX90614 Data Variables
    let _mlx90614Addr: number = 0x5A
    let _mlx90614ObjTemp: number = 0
    let _mlx90614AmbTemp: number = 0

    /**
     * MLX90614 Temperature Sensor I2C Address Setup
     * @param addr I2C address (default: 90 = 0x5A)
     */
    //% block="MLX90614 Sensor Setup I2C Address $addr"
    //% addr.defl=90
    //% group="비접촉온도(MLX90614)" weight=140
    export function mlx90614Init(addr: number): void {
        _mlx90614Addr = addr
    }

    /**
     * MLX90614 Read Temperature
     * @param source Temperature source (Object/Ambient)
     * @param unit Temperature unit
     */
    //% block="$source Temperature Read as $unit"
    //% source.defl=MLX90614Source.Object
    //% unit.defl=MLX90614TempUnit.Celsius
    //% group="비접촉온도(MLX90614)" weight=139
    //% inlineInputMode=inline
    export function mlx90614ReadTemp(source: MLX90614Source, unit: MLX90614TempUnit): number {
        let cmd = source == MLX90614Source.Object ? 0x07 : 0x06

        // SMBus read: send register address
        pins.i2cWriteNumber(_mlx90614Addr, cmd, NumberFormat.UInt8BE)

        // Read 3 bytes (2 bytes data + 1 byte PEC)
        let buf = pins.i2cReadBuffer(_mlx90614Addr, 3)

        // Temperature calculation (raw value is in 0.02K units)
        let raw = (buf[1] << 8) | buf[0]
        let tempK = raw * 0.02  // Kelvin temperature

        // Store
        if (source == MLX90614Source.Object) {
            _mlx90614ObjTemp = tempK - 273.15
        } else {
            _mlx90614AmbTemp = tempK - 273.15
        }

        // Unit conversion
        if (unit == MLX90614TempUnit.Kelvin) {
            return Math.round(tempK * 100) / 100
        } else if (unit == MLX90614TempUnit.Fahrenheit) {
            return Math.round(((tempK - 273.15) * 9 / 5 + 32) * 100) / 100
        } else {
            return Math.round((tempK - 273.15) * 100) / 100
        }
    }

    /**
     * MLX90614 Object Temperature (Celsius)
     */
    //% block="MLX90614 Object Temperature (°C)"
    //% group="비접촉온도(MLX90614)" weight=138
    export function mlx90614ObjectTemp(): number {
        return mlx90614ReadTemp(MLX90614Source.Object, MLX90614TempUnit.Celsius)
    }

    /**
     * MLX90614 Ambient Temperature (Celsius)
     */
    //% block="MLX90614 Ambient Temperature (°C)"
    //% group="비접촉온도(MLX90614)" weight=137
    export function mlx90614AmbientTemp(): number {
        return mlx90614ReadTemp(MLX90614Source.Ambient, MLX90614TempUnit.Celsius)
    }


    /********** APDS9960 제스처/RGB/근접 센서 **********/

    // APDS9960 제스처 타입
    export enum APDS9960Gesture {
        //% block="none"
        None = 0,
        //% block="up"
        Up = 1,
        //% block="down"
        Down = 2,
        //% block="left"
        Left = 3,
        //% block="right"
        Right = 4
    }

    // APDS9960 제스처 타입 (한글)
    export enum APDS9960GestureKR {
        //% block="none"
        None = 0,
        //% block="up"
        Up = 1,
        //% block="down"
        Down = 2,
        //% block="left"
        Left = 3,
        //% block="right"
        Right = 4
    }

    // APDS9960 센서 타입
    export enum APDS9960SensorType {
        //% block="ambient"
        Ambient = 0,
        //% block="proximity"
        Proximity = 1,
        //% block="gesture"
        Gesture = 2,
        //% block="RGB"
        RGB = 3
    }

    // APDS9960 활성화 상태
    export enum APDS9960Enable {
        //% block="enable"
        Enable = 1,
        //% block="disable"
        Disable = 0
    }

    // APDS9960 인터럽트 사용
    export enum APDS9960Interrupt {
        //% block="enable"
        Enable = 1,
        //% block="disable"
        Disable = 0
    }

    // APDS9960 조도 타입
    export enum APDS9960AmbientType {
        //% block="ambient light"
        Ambient = 0,
        //% block="ambient"
        Lux = 1
    }

    // APDS9960 데이터 저장 변수
    let _apds9960Addr: number = 0x39
    let _apds9960R: number = 0
    let _apds9960G: number = 0
    let _apds9960B: number = 0
    let _apds9960C: number = 0
    let _apds9960Proximity: number = 0
    let _apds9960Gesture: APDS9960GestureKR = APDS9960GestureKR.None
    let _apds9960GestureDetected: boolean = false

    //% block="Gesture sensor(APDS9960) setup"
    //% group="제스처(APDS9960)" weight=125
    export function apds9960Setup(): void {
        _apds9960Addr = 0x39

        // Power ON
        pins.i2cWriteNumber(_apds9960Addr, 0x8001, NumberFormat.UInt16BE)
        basic.pause(10)

        // ADC 통합 시간 설정
        pins.i2cWriteNumber(_apds9960Addr, 0x81F6, NumberFormat.UInt16BE)

        // 대기 시간 설정
        pins.i2cWriteNumber(_apds9960Addr, 0x83FF, NumberFormat.UInt16BE)

        // 근접 펄스 수 설정
        pins.i2cWriteNumber(_apds9960Addr, 0x8E87, NumberFormat.UInt16BE)

        // 제스처 설정
        pins.i2cWriteNumber(_apds9960Addr, 0xA340, NumberFormat.UInt16BE)
        pins.i2cWriteNumber(_apds9960Addr, 0xA41E, NumberFormat.UInt16BE)
        pins.i2cWriteNumber(_apds9960Addr, 0xA528, NumberFormat.UInt16BE)
        pins.i2cWriteNumber(_apds9960Addr, 0xA6C8, NumberFormat.UInt16BE)

        // 게인 설정
        pins.i2cWriteNumber(_apds9960Addr, 0x8F44, NumberFormat.UInt16BE)
        pins.i2cWriteNumber(_apds9960Addr, 0xA920, NumberFormat.UInt16BE)

        basic.pause(10)
    }

    //% block="APDS9960 %sensor sensor %enable, interrupt %interrupt"
    //% sensor.defl=APDS9960SensorType.Ambient
    //% enable.defl=APDS9960Enable.Enable
    //% interrupt.defl=APDS9960Interrupt.Disable
    //% group="제스처(APDS9960)" weight=124
    //% inlineInputMode=inline
    export function apds9960EnableSensor(sensor: APDS9960SensorType, enable: APDS9960Enable, interrupt: APDS9960Interrupt): void {
        // Enable 레지스터 읽기
        pins.i2cWriteNumber(_apds9960Addr, 0x80, NumberFormat.UInt8BE)
        let enableReg = pins.i2cReadNumber(_apds9960Addr, NumberFormat.UInt8BE)

        let bit = 0
        let intBit = 0

        if (sensor == APDS9960SensorType.Ambient) {
            bit = 0x02  // AEN
            intBit = 0x10  // AIEN
        } else if (sensor == APDS9960SensorType.Proximity) {
            bit = 0x04  // PEN
            intBit = 0x20  // PIEN
        } else if (sensor == APDS9960SensorType.Gesture) {
            bit = 0x40  // GEN
            intBit = 0x00  // 제스처는 별도 인터럽트
        } else {
            bit = 0x02  // AEN (RGB도 ALS 사용)
            intBit = 0x10
        }

        if (enable == APDS9960Enable.Enable) {
            enableReg |= bit | 0x01  // PON 포함
        } else {
            enableReg &= ~bit
        }

        if (interrupt == APDS9960Interrupt.Enable) {
            enableReg |= intBit
        } else {
            enableReg &= ~intBit
        }

        pins.i2cWriteNumber(_apds9960Addr, (0x80 << 8) | enableReg, NumberFormat.UInt16BE)
    }

    //% block="APDS9960 %atype light"
    //% atype.defl=APDS9960AmbientType.Ambient
    //% group="제스처(APDS9960)" weight=123
    export function apds9960ReadAmbient(atype: APDS9960AmbientType): number {
        // Clear/Ambient 데이터 읽기
        pins.i2cWriteNumber(_apds9960Addr, 0x94, NumberFormat.UInt8BE)
        let buf = pins.i2cReadBuffer(_apds9960Addr, 2)
        _apds9960C = (buf[1] << 8) | buf[0]

        if (atype == APDS9960AmbientType.Lux) {
            // 대략적인 Lux 변환
            return Math.round(_apds9960C / 10)
        }
        return _apds9960C
    }

    //% block="APDS9960 proximity sensor value"
    //% group="제스처(APDS9960)" weight=122
    export function apds9960GetProximity(): number {
        pins.i2cWriteNumber(_apds9960Addr, 0x9C, NumberFormat.UInt8BE)
        _apds9960Proximity = pins.i2cReadNumber(_apds9960Addr, NumberFormat.UInt8BE)
        return _apds9960Proximity
    }

    //% block="APDS9960 gesture detected"
    //% group="제스처(APDS9960)" weight=121
    export function apds9960GestureAvailable(): boolean {
        // 제스처 상태 확인
        pins.i2cWriteNumber(_apds9960Addr, 0xAF, NumberFormat.UInt8BE)
        let status = pins.i2cReadNumber(_apds9960Addr, NumberFormat.UInt8BE)
        _apds9960GestureDetected = (status & 0x01) != 0
        return _apds9960GestureDetected
    }

    //% block="APDS9960 gesture read %gesture"
    //% gesture.defl=APDS9960GestureKR.Left
    //% group="제스처(APDS9960)" weight=120
    export function apds9960GetGesture(gesture: APDS9960GestureKR): boolean {
        // 제스처 상태 확인
        pins.i2cWriteNumber(_apds9960Addr, 0xAF, NumberFormat.UInt8BE)
        let status = pins.i2cReadNumber(_apds9960Addr, NumberFormat.UInt8BE)

        if (status & 0x01) {
            // 제스처 FIFO 읽기
            pins.i2cWriteNumber(_apds9960Addr, 0xFC, NumberFormat.UInt8BE)
            let buf = pins.i2cReadBuffer(_apds9960Addr, 4)

            let ud = buf[0] - buf[1]  // Up - Down
            let lr = buf[2] - buf[3]  // Left - Right

            if (Math.abs(ud) > Math.abs(lr)) {
                if (ud > 20) _apds9960Gesture = APDS9960GestureKR.Up
                else if (ud < -20) _apds9960Gesture = APDS9960GestureKR.Down
                else _apds9960Gesture = APDS9960GestureKR.None
            } else {
                if (lr > 20) _apds9960Gesture = APDS9960GestureKR.Left
                else if (lr < -20) _apds9960Gesture = APDS9960GestureKR.Right
                else _apds9960Gesture = APDS9960GestureKR.None
            }
        } else {
            _apds9960Gesture = APDS9960GestureKR.None
        }

        return _apds9960Gesture == gesture
    }

    //% block="APDS9960 init"
    //% group="제스처(APDS9960)" weight=119
    export function apds9960Init(): void {
        // Enable 레지스터 (PON + AEN + PEN + GEN)
        pins.i2cWriteNumber(_apds9960Addr, 0x80, NumberFormat.UInt8BE)
        pins.i2cWriteNumber(_apds9960Addr, 0x4F, NumberFormat.UInt8BE)
        basic.pause(10)
    }

    //% block="APDS9960 gesture read"
    //% group="제스처(APDS9960)" weight=118
    export function apds9960ReadGesture(): APDS9960Gesture {
        // 제스처 상태 확인
        pins.i2cWriteNumber(_apds9960Addr, 0xAF, NumberFormat.UInt8BE)
        let status = pins.i2cReadNumber(_apds9960Addr, NumberFormat.UInt8BE)

        if (status & 0x01) {
            // 제스처 FIFO 읽기
            pins.i2cWriteNumber(_apds9960Addr, 0xFC, NumberFormat.UInt8BE)
            let buf = pins.i2cReadBuffer(_apds9960Addr, 4)

            let ud = buf[0] - buf[1]  // Up - Down
            let lr = buf[2] - buf[3]  // Left - Right

            if (Math.abs(ud) > Math.abs(lr)) {
                if (ud > 20) return APDS9960Gesture.Up
                if (ud < -20) return APDS9960Gesture.Down
            } else {
                if (lr > 20) return APDS9960Gesture.Left
                if (lr < -20) return APDS9960Gesture.Right
            }
        }
        return APDS9960Gesture.None
    }

    //% block="APDS9960 proximity read"
    //% group="제스처(APDS9960)" weight=117
    export function apds9960ReadProximity(): number {
        pins.i2cWriteNumber(_apds9960Addr, 0x9C, NumberFormat.UInt8BE)
        return pins.i2cReadNumber(_apds9960Addr, NumberFormat.UInt8BE)
    }

    //% block="APDS9960 color read %color"
    //% group="제스처(APDS9960)" weight=116
    export function apds9960ReadColor(color: RGBColor): number {
        // RGBC 데이터 읽기
        pins.i2cWriteNumber(_apds9960Addr, 0x94, NumberFormat.UInt8BE)
        let buf = pins.i2cReadBuffer(_apds9960Addr, 8)

        _apds9960C = (buf[1] << 8) | buf[0]
        _apds9960R = (buf[3] << 8) | buf[2]
        _apds9960G = (buf[5] << 8) | buf[4]
        _apds9960B = (buf[7] << 8) | buf[6]

        if (color == RGBColor.Red) return _apds9960R
        if (color == RGBColor.Green) return _apds9960G
        if (color == RGBColor.Blue) return _apds9960B
        return _apds9960C
    }


    /********** 심박 센서 (MAX30102/MAX30105) **********/

    // MAX30102/MAX30105는 심박수와 혈중산소포화도(SpO2)를 측정하는 센서입니다.
    // I2C 주소: 0x57

    // 심박 센서 측정 타입
    export enum HeartRateSensorType {
        //% block="heart rate"
        HeartRate = 0,
        //% block="SpO2"
        SpO2 = 1
    }

    // 심박 센서 전력 설정
    export enum HeartRatePower {
        //% block="low"
        Low = 0,
        //% block="medium"
        Medium = 1,
        //% block="high"
        High = 2
    }

    // 심박 센서 상태 변수
    let _hrAddr: number = 0x57
    let _hrRedLED: number = 0
    let _hrIRLED: number = 0
    let _hrHeartRate: number = 0
    let _hrSpO2: number = 0
    let _hrTemperature: number = 0
    let _hrFingerDetected: boolean = false
    let _hrBeatDetected: boolean = false
    let _hrReady: boolean = false
    let _hrLastBeat: number = 0
    let _hrBeatCount: number = 0
    let _hrBeatTimes: number[] = []

    //% block="Heart rate sensor setup"
    //% group="심박(MAX30102)" weight=110
    export function heartRateSetup(): void {
        _hrAddr = 0x57

        // 소프트 리셋
        pins.i2cWriteNumber(_hrAddr, 0x0940, NumberFormat.UInt16BE)
        basic.pause(100)

        // FIFO 설정 (샘플 평균 4, FIFO 롤오버 활성화)
        pins.i2cWriteNumber(_hrAddr, 0x0850, NumberFormat.UInt16BE)

        // 모드 설정 (SpO2 모드)
        pins.i2cWriteNumber(_hrAddr, 0x0903, NumberFormat.UInt16BE)

        // SpO2 설정 (ADC 범위 4096, 샘플 레이트 100, 펄스 폭 411us)
        pins.i2cWriteNumber(_hrAddr, 0x0A27, NumberFormat.UInt16BE)

        // LED 전류 설정 (RED: 6.4mA, IR: 6.4mA)
        pins.i2cWriteNumber(_hrAddr, 0x0C24, NumberFormat.UInt16BE)
        pins.i2cWriteNumber(_hrAddr, 0x0D24, NumberFormat.UInt16BE)

        _hrReady = true
        _hrBeatTimes = []
        _hrBeatCount = 0
        basic.pause(100)
    }

    //% block="Finger detected"
    //% group="심박(MAX30102)" weight=109
    export function heartRateFingerDetected(): boolean {
        heartRateReadRaw()
        // IR 값이 일정 수준 이상이면 손가락 감지
        _hrFingerDetected = _hrIRLED > 50000
        return _hrFingerDetected
    }

    //% block="Heart rate read (BPM)"
    //% group="심박(MAX30102)" weight=108
    export function heartRateGetBPM(): number {
        if (!_hrFingerDetected) {
            heartRateFingerDetected()
        }

        if (!_hrFingerDetected) {
            return 0
        }

        // 심박 감지 알고리즘 (간소화)
        heartRateReadRaw()
        let currentTime = control.millis()

        // IR 값의 변화로 심박 감지
        if (_hrIRLED > 50000 && _hrBeatDetected == false) {
            if (_hrLastBeat > 0) {
                let beatInterval = currentTime - _hrLastBeat
                if (beatInterval > 300 && beatInterval < 2000) {
                    _hrBeatTimes.push(beatInterval)
                    if (_hrBeatTimes.length > 10) {
                        _hrBeatTimes.shift()
                    }
                }
            }
            _hrLastBeat = currentTime
            _hrBeatDetected = true
        } else if (_hrIRLED < 45000) {
            _hrBeatDetected = false
        }

        // 평균 심박수 계산
        if (_hrBeatTimes.length > 0) {
            let avgInterval = 0
            for (let i = 0; i < _hrBeatTimes.length; i++) {
                avgInterval += _hrBeatTimes[i]
            }
            avgInterval = avgInterval / _hrBeatTimes.length
            _hrHeartRate = Math.round(60000 / avgInterval)

            // 범위 제한
            if (_hrHeartRate < 40) _hrHeartRate = 0
            if (_hrHeartRate > 200) _hrHeartRate = 200
        }

        return _hrHeartRate
    }

    //% block="SpO2 read (%)"
    //% group="심박(MAX30102)" weight=107
    export function heartRateGetSpO2(): number {
        if (!_hrFingerDetected) {
            heartRateFingerDetected()
        }

        if (!_hrFingerDetected) {
            return 0
        }

        heartRateReadRaw()

        // SpO2 계산 (간소화된 R 값 기반)
        // R = (AC_red / DC_red) / (AC_ir / DC_ir)
        // SpO2 = 110 - 25 * R (대략적인 공식)

        if (_hrIRLED > 0 && _hrRedLED > 0) {
            let ratio = (_hrRedLED * 1.0) / (_hrIRLED * 1.0)
            _hrSpO2 = Math.round(110 - 25 * ratio)

            // 범위 제한
            if (_hrSpO2 > 100) _hrSpO2 = 100
            if (_hrSpO2 < 80) _hrSpO2 = 0
        }

        return _hrSpO2
    }

    //% block="Heartbeat detected"
    //% group="심박(MAX30102)" weight=106
    export function heartRateBeatDetected(): boolean {
        heartRateReadRaw()
        return _hrBeatDetected
    }

    //% block="Sensor ready"
    //% group="심박(MAX30102)" weight=105
    export function heartRateIsReady(): boolean {
        return _hrReady && _hrFingerDetected
    }

    //% block="Sensor temperature (°C)"
    //% group="심박(MAX30102)" weight=104
    export function heartRateGetTemperature(): number {
        // 온도 측정 트리거
        pins.i2cWriteNumber(_hrAddr, 0x2101, NumberFormat.UInt16BE)
        basic.pause(50)

        // 온도 읽기
        pins.i2cWriteNumber(_hrAddr, 0x1F, NumberFormat.UInt8BE)
        let tempInt = pins.i2cReadNumber(_hrAddr, NumberFormat.Int8BE)

        pins.i2cWriteNumber(_hrAddr, 0x20, NumberFormat.UInt8BE)
        let tempFrac = pins.i2cReadNumber(_hrAddr, NumberFormat.UInt8BE)

        _hrTemperature = tempInt + (tempFrac * 0.0625)
        return Math.round(_hrTemperature * 10) / 10
    }

    //% block="%stype sensor power setting %power"
    //% stype.defl=HeartRateSensorType.HeartRate
    //% power.defl=HeartRatePower.Medium
    //% group="심박(MAX30102)" weight=103
    //% inlineInputMode=inline
    export function heartRateSetPower(stype: HeartRateSensorType, power: HeartRatePower): void {
        let ledCurrent = 0x24  // 기본 6.4mA

        if (power == HeartRatePower.Low) {
            ledCurrent = 0x0F  // 3.0mA
        } else if (power == HeartRatePower.Medium) {
            ledCurrent = 0x24  // 6.4mA
        } else {
            ledCurrent = 0x50  // 15.0mA
        }

        if (stype == HeartRateSensorType.HeartRate) {
            // IR LED만 사용 (심박수 모드)
            pins.i2cWriteNumber(_hrAddr, 0x0902, NumberFormat.UInt16BE)  // HR 모드
            pins.i2cWriteNumber(_hrAddr, (0x0D << 8) | ledCurrent, NumberFormat.UInt16BE)
        } else {
            // RED + IR LED 사용 (SpO2 모드)
            pins.i2cWriteNumber(_hrAddr, 0x0903, NumberFormat.UInt16BE)  // SpO2 모드
            pins.i2cWriteNumber(_hrAddr, (0x0C << 8) | ledCurrent, NumberFormat.UInt16BE)
            pins.i2cWriteNumber(_hrAddr, (0x0D << 8) | ledCurrent, NumberFormat.UInt16BE)
        }
    }

    //% block="Red LED raw value read"
    //% group="심박(MAX30102)" weight=102
    export function heartRateGetRedRaw(): number {
        heartRateReadRaw()
        return _hrRedLED
    }

    //% block="IR LED raw value read"
    //% group="심박(MAX30102)" weight=101
    export function heartRateGetIRRaw(): number {
        heartRateReadRaw()
        return _hrIRLED
    }

    // 원시 데이터 읽기 (내부 함수)
    function heartRateReadRaw(): void {
        // FIFO 데이터 읽기
        pins.i2cWriteNumber(_hrAddr, 0x07, NumberFormat.UInt8BE)
        let fifoData = pins.i2cReadBuffer(_hrAddr, 6)

        // RED LED 데이터 (3바이트)
        _hrRedLED = ((fifoData[0] & 0x03) << 16) | (fifoData[1] << 8) | fifoData[2]

        // IR LED 데이터 (3바이트)
        _hrIRLED = ((fifoData[3] & 0x03) << 16) | (fifoData[4] << 8) | fifoData[5]
    }


    /********** Si7021 Temperature & Humidity Sensor **********/

    // Si7021 Value Type
    export enum Si7021Value {
        //% block="Temperature(°C)"
        TempC = 0,
        //% block="Temperature(°F)"
        TempF = 1,
        //% block="Humidity(%)"
        Humidity = 2
    }

    // Si7021 Serial Type
    export enum Si7021Serial {
        //% block="A"
        A = 0,
        //% block="B"
        B = 1
    }

    // Si7021 Data Variables
    let _si7021Addr: number = 0x40
    let _si7021Temp: number = 0
    let _si7021Humidity: number = 0

    /**
     * Si7021 Temperature & Humidity Sensor Setup
     */
    //% block="Si7021 Sensor Setup"
    //% group="온습도(Si7021)" weight=141
    export function si7021Init(): void {
        _si7021Addr = 0x40
        // Soft Reset
        pins.i2cWriteNumber(_si7021Addr, 0xFE, NumberFormat.UInt8BE)
        basic.pause(15)
    }

    /**
     * Si7021 Read Value
     * @param valueType Value type to read
     */
    //% block="Si7021 Read Value: $valueType"
    //% valueType.defl=Si7021Value.TempC
    //% group="온습도(Si7021)" weight=140
    export function si7021Read(valueType: Si7021Value): number {
        if (valueType == Si7021Value.Humidity) {
            // Humidity measurement command (Hold Master Mode)
            pins.i2cWriteNumber(_si7021Addr, 0xE5, NumberFormat.UInt8BE)
            basic.pause(25)

            let buf = pins.i2cReadBuffer(_si7021Addr, 2)
            let raw = (buf[0] << 8) | buf[1]
            _si7021Humidity = ((125 * raw) / 65536) - 6
            _si7021Humidity = Math.max(0, Math.min(100, _si7021Humidity))
            return Math.round(_si7021Humidity * 100) / 100
        } else {
            // Temperature measurement command (Hold Master Mode)
            pins.i2cWriteNumber(_si7021Addr, 0xE3, NumberFormat.UInt8BE)
            basic.pause(25)

            let buf = pins.i2cReadBuffer(_si7021Addr, 2)
            let raw = (buf[0] << 8) | buf[1]
            _si7021Temp = ((175.72 * raw) / 65536) - 46.85

            if (valueType == Si7021Value.TempF) {
                return Math.round((_si7021Temp * 9 / 5 + 32) * 100) / 100
            }
            return Math.round(_si7021Temp * 100) / 100
        }
    }

    /**
     * Si7021 Sensor Reset
     */
    //% block="Si7021 Sensor Reset"
    //% group="온습도(Si7021)" weight=139
    export function si7021Reset(): void {
        pins.i2cWriteNumber(_si7021Addr, 0xFE, NumberFormat.UInt8BE)
        basic.pause(15)
    }

    /**
     * Si7021 Read Serial Number
     * @param serialType Serial type (A or B)
     */
    //% block="Si7021 Read Serial: Serial $serialType"
    //% serialType.defl=Si7021Serial.A
    //% group="온습도(Si7021)" weight=138
    export function si7021ReadSerial(serialType: Si7021Serial): number {
        if (serialType == Si7021Serial.A) {
            // Electronic ID 1st Byte (SNA)
            pins.i2cWriteNumber(_si7021Addr, 0xFA0F, NumberFormat.UInt16BE)
            basic.pause(10)
            let buf = pins.i2cReadBuffer(_si7021Addr, 8)
            return (buf[0] << 24) | (buf[2] << 16) | (buf[4] << 8) | buf[6]
        } else {
            // Electronic ID 2nd Byte (SNB)
            pins.i2cWriteNumber(_si7021Addr, 0xFCC9, NumberFormat.UInt16BE)
            basic.pause(10)
            let buf = pins.i2cReadBuffer(_si7021Addr, 6)
            return (buf[0] << 24) | (buf[1] << 16) | (buf[3] << 8) | buf[4]
        }
    }


    /********** BH1750 조도 센서 **********/

    // BH1750 데이터 저장 변수
    let _bh1750Addr: number = 0x23

    //% block="BH1750 init address %addr"
    //% addr.defl=0x23
    //% group="조도(BH1750)" weight=95
    export function bh1750Init(addr: number): void {
        _bh1750Addr = addr
        // Power On
        pins.i2cWriteNumber(_bh1750Addr, 0x01, NumberFormat.UInt8BE)
        // 연속 고해상도 모드 (1 lux)
        pins.i2cWriteNumber(_bh1750Addr, 0x10, NumberFormat.UInt8BE)
        basic.pause(180)
    }

    //% block="BH1750 light intensity read (lux)"
    //% group="조도(BH1750)" weight=94
    export function bh1750Read(): number {
        let buf = pins.i2cReadBuffer(_bh1750Addr, 2)
        let raw = (buf[0] << 8) | buf[1]
        return Math.floor(raw / 1.2)
    }


    /********** TSL2561 조도 센서 **********/

    // TSL2561 데이터 저장 변수
    let _tsl2561Addr: number = 0x39

    //% block="TSL2561 init address %addr"
    //% addr.defl=0x39
    //% group="조도(TSL2561)" weight=90
    export function tsl2561Init(addr: number): void {
        _tsl2561Addr = addr
        // Power On (Command + Control Register)
        pins.i2cWriteNumber(_tsl2561Addr, 0x80, NumberFormat.UInt8BE)
        pins.i2cWriteNumber(_tsl2561Addr, 0x03, NumberFormat.UInt8BE)
        basic.pause(400)
    }

    //% block="TSL2561 light intensity read (lux)"
    //% group="조도(TSL2561)" weight=89
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


    /********** ADXL345 가속도 센서 **********/

    // ADXL345 데이터 저장 변수
    let _adxl345Addr: number = 0x53

    //% block="ADXL345 init address %addr"
    //% addr.defl=0x53
    //% group="3축 가속도(ADXL345)" weight=85
    export function adxl345Init(addr: number): void {
        _adxl345Addr = addr
        // 측정 모드 활성화 (POWER_CTL 레지스터)
        pins.i2cWriteNumber(_adxl345Addr, 0x2D08, NumberFormat.UInt16BE)
        // 데이터 포맷 설정 (±16g, Full Resolution)
        pins.i2cWriteNumber(_adxl345Addr, 0x310B, NumberFormat.UInt16BE)
        basic.pause(10)
    }

    //% block="ADXL345 acceleration read axis %axis"
    //% group="3축 가속도(ADXL345)" weight=84
    export function adxl345Read(axis: Axis): number {
        let reg = 0x32 + (axis * 2)  // X=0x32, Y=0x34, Z=0x36

        pins.i2cWriteNumber(_adxl345Addr, reg, NumberFormat.UInt8BE)
        return pins.i2cReadNumber(_adxl345Addr, NumberFormat.Int16LE)
    }


    /********** BME280 기압/온도/습도 센서 **********/

    // BME280 측정 타입
    export enum BME280Type {
        //% block="pressure(hPa)"
        Pressure = 0,
        //% block="temperature(°C)"
        Temperature = 1,
        //% block="humidity(%)"
        Humidity = 2
    }

    // BME280 데이터 저장 변수
    let _bme280Addr: number = 0x76
    let _bme280Pressure: number = 0
    let _bme280Temp: number = 0
    let _bme280Humidity: number = 0

    //% block="BME280 init address %addr"
    //% addr.defl=0x76
    //% group="대기압(BME280)" weight=80
    export function bme280Init(addr: number): void {
        _bme280Addr = addr
        // 습도 오버샘플링 설정
        pins.i2cWriteNumber(_bme280Addr, 0xF201, NumberFormat.UInt16BE)
        // 컨트롤 레지스터 설정 (Normal mode, oversampling x1)
        pins.i2cWriteNumber(_bme280Addr, 0xF427, NumberFormat.UInt16BE)
        basic.pause(100)
    }

    //% block="BME280 read %btype"
    //% group="대기압(BME280)" weight=79
    export function bme280Read(btype: BME280Type): number {
        // 모든 데이터 읽기 (0xF7~0xFE)
        pins.i2cWriteNumber(_bme280Addr, 0xF7, NumberFormat.UInt8BE)
        let buf = pins.i2cReadBuffer(_bme280Addr, 8)

        let pressRaw = (buf[0] << 12) | (buf[1] << 4) | (buf[2] >> 4)
        let tempRaw = (buf[3] << 12) | (buf[4] << 4) | (buf[5] >> 4)
        let humRaw = (buf[6] << 8) | buf[7]

        // 간소화된 계산 (실제로는 보정 계수 필요)
        _bme280Temp = tempRaw / 5120.0
        _bme280Pressure = pressRaw / 256.0 / 100.0
        _bme280Humidity = humRaw / 1024.0 * 100.0

        if (btype == BME280Type.Temperature) {
            return _bme280Temp
        } else if (btype == BME280Type.Humidity) {
            return _bme280Humidity
        }
        return _bme280Pressure
    }


    /********** 지문 센서 (AS608/R307) **********/

    // 지문 센서는 광학식 지문 인식 모듈입니다.
    // AS608, R307, R305 등 호환 모듈 지원

    // 지문 시리얼 타입
    export enum FPSerial {
        //% block="software serial"
        Software = 0,
        //% block="hardware serial"
        Hardware = 1
    }

    // 지문 등록 과정
    export enum FPEnroll {
        //% block="get image"
        GetImage = 1,
        //% block="image to tz"
        Image2Tz = 2,
        //% block="create model"
        CreateModel = 3,
        //% block="store"
        Store = 4
    }

    // 지문 인식 모드
    export enum FPSearchMode {
        //% block="fast"
        Fast = 0,
        //% block="accurate"
        Accurate = 1
    }

    // 지문 인식 결과 타입
    export enum FPResult {
        //% block="finger ID"
        FingerID = 0,
        //% block="confidence"
        Confidence = 1,
        //% block="status"
        Status = 2
    }

    // 지문 데이터베이스 명령
    export enum FPDatabase {
        //% block="delete ID"
        DeleteID = 0,
        //% block="delete all"
        DeleteAll = 1,
        //% block="count"
        Count = 2
    }

    // 지문 LED 상태
    export enum FPLED {
        //% block="on"
        On = 1,
        //% block="off"
        Off = 0,
        //% block="blink"
        Blink = 2
    }

    // 지문 센서 상태 변수
    let _fpTx: SerialPin = SerialPin.P1
    let _fpRx: SerialPin = SerialPin.P2
    let _fpFingerID: number = -1
    let _fpConfidence: number = 0
    let _fpStatus: number = 0
    let _fpTemplateCount: number = 0

    //% block="Fingerprint sensor setup: serial %serialType, RX %rx, TX %tx, baud %baud"
    //% serialType.defl=FPSerial.Software
    //% rx.defl=SerialPin.P2
    //% tx.defl=SerialPin.P1
    //% baud.defl=57600
    //% group="Fingerprint" weight=75
    //% inlineInputMode=inline
    export function fpInit(serialType: FPSerial, rx: SerialPin, tx: SerialPin, baud: number): void {
        _fpRx = rx
        _fpTx = tx
        serial.redirect(tx, rx, baud)
        _fpFingerID = -1
        _fpConfidence = 0
        _fpStatus = 0
        basic.pause(500)
    }

    //% block="Fingerprint enroll %step, ID: %id"
    //% step.defl=FPEnroll.GetImage
    //% id.defl=1 id.min=1 id.max=162
    //% group="Fingerprint" weight=74
    //% inlineInputMode=inline
    export function fpEnroll(step: FPEnroll, id: number): number {
        let cmd: Buffer

        if (step == FPEnroll.GetImage) {
            // 이미지 가져오기: EF 01 FF FF FF FF 01 00 03 01 00 05
            cmd = pins.createBuffer(12)
            cmd[0] = 0xEF; cmd[1] = 0x01
            cmd[2] = 0xFF; cmd[3] = 0xFF; cmd[4] = 0xFF; cmd[5] = 0xFF
            cmd[6] = 0x01; cmd[7] = 0x00; cmd[8] = 0x03
            cmd[9] = 0x01  // GenImg
            cmd[10] = 0x00; cmd[11] = 0x05
        } else if (step == FPEnroll.Image2Tz) {
            // 이미지 변환: EF 01 FF FF FF FF 01 00 04 02 01 00 08
            cmd = pins.createBuffer(13)
            cmd[0] = 0xEF; cmd[1] = 0x01
            cmd[2] = 0xFF; cmd[3] = 0xFF; cmd[4] = 0xFF; cmd[5] = 0xFF
            cmd[6] = 0x01; cmd[7] = 0x00; cmd[8] = 0x04
            cmd[9] = 0x02  // Img2Tz
            cmd[10] = 0x01  // Buffer 1
            cmd[11] = 0x00; cmd[12] = 0x08
        } else if (step == FPEnroll.CreateModel) {
            // 템플릿 생성: EF 01 FF FF FF FF 01 00 03 05 00 09
            cmd = pins.createBuffer(12)
            cmd[0] = 0xEF; cmd[1] = 0x01
            cmd[2] = 0xFF; cmd[3] = 0xFF; cmd[4] = 0xFF; cmd[5] = 0xFF
            cmd[6] = 0x01; cmd[7] = 0x00; cmd[8] = 0x03
            cmd[9] = 0x05  // RegModel
            cmd[10] = 0x00; cmd[11] = 0x09
        } else {
            // 템플릿 저장: EF 01 FF FF FF FF 01 00 06 06 01 00 [ID_H] [ID_L] [CHK_H] [CHK_L]
            cmd = pins.createBuffer(15)
            cmd[0] = 0xEF; cmd[1] = 0x01
            cmd[2] = 0xFF; cmd[3] = 0xFF; cmd[4] = 0xFF; cmd[5] = 0xFF
            cmd[6] = 0x01; cmd[7] = 0x00; cmd[8] = 0x06
            cmd[9] = 0x06  // Store
            cmd[10] = 0x01  // Buffer 1
            cmd[11] = (id >> 8) & 0xFF
            cmd[12] = id & 0xFF
            let sum = 0x01 + 0x00 + 0x06 + 0x06 + 0x01 + cmd[11] + cmd[12]
            cmd[13] = (sum >> 8) & 0xFF
            cmd[14] = sum & 0xFF
        }

        serial.writeBuffer(cmd)
        basic.pause(200)

        // 응답 읽기
        let response = serial.readBuffer(12)
        if (response.length >= 10) {
            _fpStatus = response[9]
            return _fpStatus
        }
        return -1
    }

    //% block="Fingerprint search mode: %mode"
    //% mode.defl=FPSearchMode.Fast
    //% group="Fingerprint" weight=73
    export function fpSearch(mode: FPSearchMode): number {
        // 이미지 가져오기
        let imgCmd = pins.createBuffer(12)
        imgCmd[0] = 0xEF; imgCmd[1] = 0x01
        imgCmd[2] = 0xFF; imgCmd[3] = 0xFF; imgCmd[4] = 0xFF; imgCmd[5] = 0xFF
        imgCmd[6] = 0x01; imgCmd[7] = 0x00; imgCmd[8] = 0x03
        imgCmd[9] = 0x01
        imgCmd[10] = 0x00; imgCmd[11] = 0x05
        serial.writeBuffer(imgCmd)
        basic.pause(200)

        let imgResp = serial.readBuffer(12)
        if (imgResp.length < 10 || imgResp[9] != 0x00) {
            _fpStatus = imgResp.length >= 10 ? imgResp[9] : -1
            _fpFingerID = -1
            return -1
        }

        // 이미지 변환
        let tzCmd = pins.createBuffer(13)
        tzCmd[0] = 0xEF; tzCmd[1] = 0x01
        tzCmd[2] = 0xFF; tzCmd[3] = 0xFF; tzCmd[4] = 0xFF; tzCmd[5] = 0xFF
        tzCmd[6] = 0x01; tzCmd[7] = 0x00; tzCmd[8] = 0x04
        tzCmd[9] = 0x02; tzCmd[10] = 0x01
        tzCmd[11] = 0x00; tzCmd[12] = 0x08
        serial.writeBuffer(tzCmd)
        basic.pause(200)

        let tzResp = serial.readBuffer(12)
        if (tzResp.length < 10 || tzResp[9] != 0x00) {
            _fpStatus = tzResp.length >= 10 ? tzResp[9] : -1
            _fpFingerID = -1
            return -1
        }

        // 검색: EF 01 FF FF FF FF 01 00 08 04 01 00 00 00 A3 [CHK]
        let searchCmd = pins.createBuffer(17)
        searchCmd[0] = 0xEF; searchCmd[1] = 0x01
        searchCmd[2] = 0xFF; searchCmd[3] = 0xFF; searchCmd[4] = 0xFF; searchCmd[5] = 0xFF
        searchCmd[6] = 0x01; searchCmd[7] = 0x00; searchCmd[8] = 0x08
        searchCmd[9] = 0x04  // Search
        searchCmd[10] = 0x01  // Buffer 1
        searchCmd[11] = 0x00; searchCmd[12] = 0x00  // Start page
        searchCmd[13] = 0x00; searchCmd[14] = 0xA3  // Page count (163)
        let sum = 0x01 + 0x00 + 0x08 + 0x04 + 0x01 + 0x00 + 0x00 + 0x00 + 0xA3
        searchCmd[15] = (sum >> 8) & 0xFF
        searchCmd[16] = sum & 0xFF
        serial.writeBuffer(searchCmd)
        basic.pause(mode == FPSearchMode.Fast ? 200 : 500)

        // 검색 결과 읽기
        let searchResp = serial.readBuffer(16)
        if (searchResp.length >= 14) {
            _fpStatus = searchResp[9]
            if (_fpStatus == 0x00) {
                _fpFingerID = (searchResp[10] << 8) | searchResp[11]
                _fpConfidence = (searchResp[12] << 8) | searchResp[13]
            } else {
                _fpFingerID = -1
                _fpConfidence = 0
            }
        }

        return _fpFingerID
    }

    //% block="Fingerprint result: %result"
    //% result.defl=FPResult.FingerID
    //% group="Fingerprint" weight=72
    export function fpGetResult(result: FPResult): number {
        if (result == FPResult.FingerID) {
            return _fpFingerID
        } else if (result == FPResult.Confidence) {
            return _fpConfidence
        }
        return _fpStatus
    }

    //% block="Fingerprint database %cmd, ID: %id"
    //% cmd.defl=FPDatabase.DeleteID
    //% id.defl=1 id.min=1 id.max=162
    //% group="Fingerprint" weight=71
    //% inlineInputMode=inline
    export function fpDatabase(cmd: FPDatabase, id: number): number {
        let cmdBuf: Buffer

        if (cmd == FPDatabase.DeleteID) {
            // ID 삭제: EF 01 FF FF FF FF 01 00 07 0C [ID_H] [ID_L] 00 01 [CHK]
            cmdBuf = pins.createBuffer(16)
            cmdBuf[0] = 0xEF; cmdBuf[1] = 0x01
            cmdBuf[2] = 0xFF; cmdBuf[3] = 0xFF; cmdBuf[4] = 0xFF; cmdBuf[5] = 0xFF
            cmdBuf[6] = 0x01; cmdBuf[7] = 0x00; cmdBuf[8] = 0x07
            cmdBuf[9] = 0x0C  // DeletChar
            cmdBuf[10] = (id >> 8) & 0xFF
            cmdBuf[11] = id & 0xFF
            cmdBuf[12] = 0x00; cmdBuf[13] = 0x01
            let sum = 0x01 + 0x00 + 0x07 + 0x0C + cmdBuf[10] + cmdBuf[11] + 0x00 + 0x01
            cmdBuf[14] = (sum >> 8) & 0xFF
            cmdBuf[15] = sum & 0xFF
        } else if (cmd == FPDatabase.DeleteAll) {
            // 전체 삭제: EF 01 FF FF FF FF 01 00 03 0D 00 11
            cmdBuf = pins.createBuffer(12)
            cmdBuf[0] = 0xEF; cmdBuf[1] = 0x01
            cmdBuf[2] = 0xFF; cmdBuf[3] = 0xFF; cmdBuf[4] = 0xFF; cmdBuf[5] = 0xFF
            cmdBuf[6] = 0x01; cmdBuf[7] = 0x00; cmdBuf[8] = 0x03
            cmdBuf[9] = 0x0D  // Empty
            cmdBuf[10] = 0x00; cmdBuf[11] = 0x11
        } else {
            // 등록 개수: EF 01 FF FF FF FF 01 00 03 1D 00 21
            cmdBuf = pins.createBuffer(12)
            cmdBuf[0] = 0xEF; cmdBuf[1] = 0x01
            cmdBuf[2] = 0xFF; cmdBuf[3] = 0xFF; cmdBuf[4] = 0xFF; cmdBuf[5] = 0xFF
            cmdBuf[6] = 0x01; cmdBuf[7] = 0x00; cmdBuf[8] = 0x03
            cmdBuf[9] = 0x1D  // TemplateNum
            cmdBuf[10] = 0x00; cmdBuf[11] = 0x21
        }

        serial.writeBuffer(cmdBuf)
        basic.pause(200)

        let response = serial.readBuffer(14)
        if (response.length >= 10) {
            _fpStatus = response[9]
            if (cmd == FPDatabase.Count && response.length >= 14) {
                _fpTemplateCount = (response[10] << 8) | response[11]
                return _fpTemplateCount
            }
            return _fpStatus
        }
        return -1
    }

    //% block="Fingerprint LED control %state"
    //% state.defl=FPLED.On
    //% group="Fingerprint" weight=70
    export function fpLED(state: FPLED): void {
        // LED 제어: EF 01 FF FF FF FF 01 00 07 35 [ctrl] [speed] [color] [count] [CHK]
        let cmd = pins.createBuffer(16)
        cmd[0] = 0xEF; cmd[1] = 0x01
        cmd[2] = 0xFF; cmd[3] = 0xFF; cmd[4] = 0xFF; cmd[5] = 0xFF
        cmd[6] = 0x01; cmd[7] = 0x00; cmd[8] = 0x07
        cmd[9] = 0x35  // AuraLedConfig

        if (state == FPLED.On) {
            cmd[10] = 0x01  // 켜기
            cmd[11] = 0x00  // 속도
            cmd[12] = 0x01  // 파란색
            cmd[13] = 0x00  // 횟수
        } else if (state == FPLED.Off) {
            cmd[10] = 0x04  // 끄기
            cmd[11] = 0x00
            cmd[12] = 0x00
            cmd[13] = 0x00
        } else {
            cmd[10] = 0x02  // 깜빡임
            cmd[11] = 0x50  // 속도
            cmd[12] = 0x01  // 파란색
            cmd[13] = 0x02  // 횟수
        }

        let sum = 0x01 + 0x00 + 0x07 + 0x35 + cmd[10] + cmd[11] + cmd[12] + cmd[13]
        cmd[14] = (sum >> 8) & 0xFF
        cmd[15] = sum & 0xFF

        serial.writeBuffer(cmd)
        basic.pause(100)
    }


    /********** INA219 전류/전압 센서 **********/

    // INA219는 I2C 전류/전압/전력 측정 센서입니다.
    // 최대 26V, ±3.2A 측정 가능

    // INA219 데이터 타입
    export enum INA219Data {
        //% block="current (mA)"
        Current = 0,
        //% block="voltage (V)"
        Voltage = 1,
        //% block="power (mW)"
        Power = 2,
        //% block="shunt voltage (mV)"
        ShuntVoltage = 3
    }

    // INA219 상태 변수
    let _ina219Addr: number = 0x40

    //% block="INA219 set I2C address %addr"
    //% addr.defl=0x40
    //% group="전류/전압/전력 측정(INA219)" weight=65
    export function ina219Init(addr: number): void {
        _ina219Addr = addr

        // 설정 레지스터 쓰기 (기본 32V, 2A 범위)
        let config = 0x399F
        let buf = pins.createBuffer(3)
        buf[0] = 0x00  // 설정 레지스터
        buf[1] = (config >> 8) & 0xFF
        buf[2] = config & 0xFF
        pins.i2cWriteBuffer(_ina219Addr, buf)

        // 교정 레지스터 설정
        let calibration = 4096
        buf[0] = 0x05
        buf[1] = (calibration >> 8) & 0xFF
        buf[2] = calibration & 0xFF
        pins.i2cWriteBuffer(_ina219Addr, buf)
    }

    //% block="INA219 read %data"
    //% group="전류/전압/전력 측정(INA219)" weight=64
    export function ina219Read(data: INA219Data): number {
        let reg = 0
        switch (data) {
            case INA219Data.ShuntVoltage: reg = 0x01; break
            case INA219Data.Voltage: reg = 0x02; break
            case INA219Data.Power: reg = 0x03; break
            case INA219Data.Current: reg = 0x04; break
        }

        pins.i2cWriteNumber(_ina219Addr, reg, NumberFormat.UInt8BE)
        let raw = pins.i2cReadNumber(_ina219Addr, NumberFormat.Int16BE)

        switch (data) {
            case INA219Data.ShuntVoltage:
                return raw * 0.01  // mV
            case INA219Data.Voltage:
                return (raw >> 3) * 0.004  // V
            case INA219Data.Power:
                return raw * 2  // mW
            case INA219Data.Current:
                return raw  // mA
            default:
                return 0
        }
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
    //% group="CO2센서(CCS811)" weight=88
    export function ccs811Init(): void {
        // 앱 시작 명령
        pins.i2cWriteNumber(_ccs811Addr, 0xF4, NumberFormat.UInt8BE)
        basic.pause(100)
        // 측정 모드 설정 (1초 간격)
        pins.i2cWriteNumber(_ccs811Addr, 0x0110, NumberFormat.UInt16BE)
        basic.pause(100)
    }

    //% block="CCS811 read %ctype"
    //% group="CO2센서(CCS811)" weight=87
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


    /********** I2C 무게 센서 (NAU7802 등) **********/

    // I2C 기반 무게 센서 (NAU7802, SparkFun Qwiic Scale 등)
    // 24비트 ADC로 고정밀 무게 측정 지원

    // I2C Weight Sensor data byte type
    export enum I2CWeightByte {
        //% block="0 (status)"
        Status = 0,
        //% block="1 (data High)"
        DataHigh = 1,
        //% block="2 (data Mid)"
        DataMid = 2,
        //% block="3 (data Low)"
        DataLow = 3
    }

    // I2C 무게센서 상태 변수
    let _i2cWeightAddr: number = 0x2A  // NAU7802 기본 주소
    let _i2cWeightOffset: number = 0
    let _i2cWeightScale: number = 1
    let _i2cWeightInitialized: boolean = false

    /**
     * I2C 무게센서 주소 설정
     * @param addr I2C 주소 (기본값: 0x2A = 42, 또는 99 등)
     */
    //% block="I2C Weight Sensor set address $addr"
    //% addr.defl=99
    //% group="I2C 무게센서" weight=58
    export function i2cWeightSetAddress(addr: number): void {
        _i2cWeightAddr = addr
        _i2cWeightInitialized = false

        // 센서 초기화 시도
        try {
            // PU_CTRL 레지스터 설정 (전원 켜기)
            pins.i2cWriteNumber(_i2cWeightAddr, 0x0001, NumberFormat.UInt16BE)
            basic.pause(10)

            // 디지털 파워 켜기
            pins.i2cWriteNumber(_i2cWeightAddr, 0x0002, NumberFormat.UInt16BE)
            basic.pause(10)

            // ADC 시작
            pins.i2cWriteNumber(_i2cWeightAddr, 0x0006, NumberFormat.UInt16BE)
            basic.pause(100)

            _i2cWeightInitialized = true
        } catch {
            _i2cWeightInitialized = false
        }
    }

    /**
     * I2C 센서에서 무게 읽기
     * @returns 보정된 무게 값
     */
    //% block="I2C Weight Sensor read weight"
    //% group="I2C 무게센서" weight=57
    export function i2cWeightRead(): number {
        let raw = i2cWeightReadRaw24bit()
        return (raw - _i2cWeightOffset) / _i2cWeightScale
    }

    /**
     * I2C 무게센서 사용 가능 여부 확인
     * @returns 센서가 준비되면 true
     */
    //% block="I2C Weight Sensor is available"
    //% group="I2C 무게센서" weight=56
    export function i2cWeightIsAvailable(): boolean {
        if (!_i2cWeightInitialized) {
            return false
        }

        try {
            // 상태 레지스터 읽기
            pins.i2cWriteNumber(_i2cWeightAddr, 0x00, NumberFormat.UInt8BE)
            let status = pins.i2cReadNumber(_i2cWeightAddr, NumberFormat.UInt8BE)
            // CR (Conversion Ready) 비트 확인
            return (status & 0x20) != 0
        } catch {
            return false
        }
    }

    /**
     * I2C 센서에서 원시 데이터 바이트 읽기
     * @param byteType 읽을 바이트 타입
     * @returns 해당 바이트 값
     */
    //% block="I2C Weight Sensor read raw byte $byteType"
    //% byteType.defl=I2CWeightByte.Status
    //% group="I2C 무게센서" weight=55
    export function i2cWeightReadByte(byteType: I2CWeightByte): number {
        try {
            if (byteType == I2CWeightByte.Status) {
                // 상태 레지스터 (0x00)
                pins.i2cWriteNumber(_i2cWeightAddr, 0x00, NumberFormat.UInt8BE)
                return pins.i2cReadNumber(_i2cWeightAddr, NumberFormat.UInt8BE)
            } else {
                // ADC 데이터 레지스터 (0x12, 0x13, 0x14)
                let regAddr = 0x12 + (byteType - 1)
                pins.i2cWriteNumber(_i2cWeightAddr, regAddr, NumberFormat.UInt8BE)
                return pins.i2cReadNumber(_i2cWeightAddr, NumberFormat.UInt8BE)
            }
        } catch {
            return -1
        }
    }

    /**
     * I2C 무게센서 영점 조정 (Tare)
     * @param samples 평균을 낼 샘플 수
     */
    //% block="I2C Weight Sensor tare samples $samples"
    //% samples.defl=10
    //% group="I2C 무게센서" weight=54
    export function i2cWeightTare(samples: number): void {
        let sum = 0
        for (let i = 0; i < samples; i++) {
            sum += i2cWeightReadRaw24bit()
            basic.pause(50)
        }
        _i2cWeightOffset = Math.floor(sum / samples)
    }

    /**
     * I2C 무게센서 스케일 설정
     * @param scale 스케일 값 (예: 알려진 무게로 나눈 원시 값)
     */
    //% block="I2C Weight Sensor set scale $scale"
    //% scale.defl=1
    //% group="I2C 무게센서" weight=53
    export function i2cWeightSetScale(scale: number): void {
        _i2cWeightScale = scale
    }

    /**
     * I2C 무게센서 24비트 원시 값 읽기
     * @returns 24비트 ADC 값
     */
    //% block="I2C Weight Sensor read raw 24bit"
    //% group="I2C 무게센서" weight=52
    export function i2cWeightReadRaw24bit(): number {
        try {
            // 변환 완료 대기
            let timeout = 100
            while (!i2cWeightIsAvailable() && timeout > 0) {
                basic.pause(10)
                timeout--
            }

            // ADC 출력 레지스터 읽기 (0x12 ~ 0x14, 3바이트)
            pins.i2cWriteNumber(_i2cWeightAddr, 0x12, NumberFormat.UInt8BE)
            let buf = pins.i2cReadBuffer(_i2cWeightAddr, 3)

            let value = (buf[0] << 16) | (buf[1] << 8) | buf[2]

            // 24비트 부호 있는 정수 처리
            if (value & 0x800000) {
                value = value - 0x1000000
            }

            return value
        } catch {
            return 0
        }
    }

    /**
     * I2C 무게센서 게인 설정
     * @param gain 게인 값 (1, 2, 4, 8, 16, 32, 64, 128)
     */
    //% block="I2C Weight Sensor set gain $gain"
    //% gain.defl=128
    //% group="I2C 무게센서" weight=51
    export function i2cWeightSetGain(gain: number): void {
        let gainBits = 7  // 기본 128
        if (gain <= 1) gainBits = 0
        else if (gain <= 2) gainBits = 1
        else if (gain <= 4) gainBits = 2
        else if (gain <= 8) gainBits = 3
        else if (gain <= 16) gainBits = 4
        else if (gain <= 32) gainBits = 5
        else if (gain <= 64) gainBits = 6
        else gainBits = 7

        try {
            // CTRL1 레지스터 (0x01)에 게인 설정
            let regValue = (gainBits << 4) | 0x04  // VLDO 3.0V
            pins.i2cWriteNumber(_i2cWeightAddr, 0x01, NumberFormat.UInt8BE)
            pins.i2cWriteNumber(_i2cWeightAddr, regValue, NumberFormat.UInt8BE)
        } catch {
            // 에러 무시
        }
    }
}
