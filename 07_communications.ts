/**
 * BRIXEL Extension - 07. Communications
 * EEPROM, nRF24L01, LoRa, Bluetooth, GPS
 */

//% weight=1040 color=#F75ACF icon="\uf1eb" block="07. Communications"
//% groups="['Infrared', 'MFRC522', 'PN532', 'GPS', 'nRF24L01', 'LoRa']"
namespace Communications07 {



    /********** nRF24L01 2.4GHz 무선 모듈 **********/

    // nRF24L01은 2.4GHz 대역의 무선 통신 모듈입니다.
    // 최대 2Mbps 속도, 최대 100m 거리 통신 가능
    // micro:bit 간 또는 아두이노와 통신할 때 사용

    // nRF24L01 핀 저장 변수
    let _nrfCE: DigitalPin = DigitalPin.P8
    let _nrfCSN: DigitalPin = DigitalPin.P16
    let _nrfChannel: number = 76
    let _nrfPayloadSize: number = 32
    let _nrfDataReceived: boolean = false
    let _nrfRxBuffer: number[] = []

    // nRF24L01 모드
    export enum NRFMode {
        //% block="TX (TX)"
        Transmit = 0,
        //% block="receive (RX)"
        Receive = 1
    }

    // nRF24L01 전송 속도
    export enum NRFDataRate {
        //% block="1Mbps"
        Rate1Mbps = 0,
        //% block="2Mbps"
        Rate2Mbps = 1,
        //% block="250Kbps"
        Rate250Kbps = 2
    }

    // nRF24L01 출력 세기
    export enum NRFPower {
        //% block="max (0dBm)"
        Max = 3,
        //% block="high (-6dBm)"
        High = 2,
        //% block="medium (-12dBm)"
        Medium = 1,
        //% block="low (-18dBm)"
        Low = 0
    }

    //% block="nRF24L01 set|CE pin %ce|CSN pin %csn|channel %channel"
    //% ce.defl=DigitalPin.P8
    //% csn.defl=DigitalPin.P16
    //% channel.defl=76 channel.min=0 channel.max=125
    //% group="nRF24L01" weight=77
    //% inlineInputMode=inline
    export function nrf24l01Init(ce: DigitalPin, csn: DigitalPin, channel: number): void {
        _nrfCE = ce
        _nrfCSN = csn
        _nrfChannel = channel

        // 핀 초기화
        pins.digitalWritePin(_nrfCE, 0)
        pins.digitalWritePin(_nrfCSN, 1)

        basic.pause(100)

        // 레지스터 초기화
        nrfWriteReg(0x00, 0x0C)  // CONFIG: CRC 활성화, PWR_UP
        nrfWriteReg(0x01, 0x3F)  // EN_AA: 자동 ACK 활성화
        nrfWriteReg(0x02, 0x03)  // EN_RXADDR: 파이프 0,1 활성화
        nrfWriteReg(0x03, 0x03)  // SETUP_AW: 5바이트 주소
        nrfWriteReg(0x04, 0x03)  // SETUP_RETR: 재전송 설정
        nrfWriteReg(0x05, channel) // RF_CH: 채널 설정
        nrfWriteReg(0x06, 0x07)  // RF_SETUP: 1Mbps, 0dBm
        nrfWriteReg(0x11, _nrfPayloadSize)  // RX_PW_P0

        // FIFO 클리어
        nrfFlushTx()
        nrfFlushRx()
        nrfWriteReg(0x07, 0x70)  // STATUS: 플래그 클리어

        basic.pause(10)
    }

    //% block="nRF24L01 mode set %mode"
    //% group="nRF24L01" weight=76
    export function nrf24l01SetMode(mode: NRFMode): void {
        let config = nrfReadReg(0x00)
        if (mode == NRFMode.Receive) {
            config |= 0x01  // PRIM_RX = 1
            nrfWriteReg(0x00, config)
            pins.digitalWritePin(_nrfCE, 1)  // RX 모드 시작
        } else {
            config &= 0xFE  // PRIM_RX = 0
            nrfWriteReg(0x00, config)
            pins.digitalWritePin(_nrfCE, 0)
        }
        basic.pause(2)
    }

    //% block="nRF24L01 address set %addr"
    //% addr.defl="BRIX1"
    //% group="nRF24L01" weight=75
    export function nrf24l01SetAddress(addr: string): void {
        // 5바이트 주소 설정
        let addrBytes: number[] = []
        for (let i = 0; i < 5; i++) {
            addrBytes.push(i < addr.length ? addr.charCodeAt(i) : 0)
        }

        // TX 주소와 RX 파이프 0 주소 설정
        pins.digitalWritePin(_nrfCSN, 0)
        pins.spiWrite(0x20 | 0x10)  // W_REGISTER | TX_ADDR
        for (let byte of addrBytes) {
            pins.spiWrite(byte)
        }
        pins.digitalWritePin(_nrfCSN, 1)

        pins.digitalWritePin(_nrfCSN, 0)
        pins.spiWrite(0x20 | 0x0A)  // W_REGISTER | RX_ADDR_P0
        for (let byte of addrBytes) {
            pins.spiWrite(byte)
        }
        pins.digitalWritePin(_nrfCSN, 1)
    }

    //% block="nRF24L01 string send %text"
    //% text.defl="Hello"
    //% group="nRF24L01" weight=74
    export function nrf24l01SendString(text: string): boolean {
        let payload: number[] = []
        for (let i = 0; i < _nrfPayloadSize; i++) {
            payload.push(i < text.length ? text.charCodeAt(i) : 0)
        }
        return nrfSendPayload(payload)
    }

    //% block="nRF24L01 number send %value"
    //% group="nRF24L01" weight=73
    export function nrf24l01SendNumber(value: number): boolean {
        return nrf24l01SendString("" + value)
    }

    //% block="nRF24L01 data receive?"
    //% group="nRF24L01" weight=72
    export function nrf24l01DataReady(): boolean {
        let status = nrfReadReg(0x07)
        return (status & 0x40) != 0  // RX_DR 플래그
    }

    //% block="nRF24L01 string receive"
    //% group="nRF24L01" weight=71
    export function nrf24l01ReceiveString(): string {
        if (!nrf24l01DataReady()) return ""

        // 데이터 읽기
        pins.digitalWritePin(_nrfCSN, 0)
        pins.spiWrite(0x61)  // R_RX_PAYLOAD
        let result = ""
        for (let i = 0; i < _nrfPayloadSize; i++) {
            let byte = pins.spiWrite(0xFF)
            if (byte > 0 && byte < 128) {
                result += String.fromCharCode(byte)
            }
        }
        pins.digitalWritePin(_nrfCSN, 1)

        // 플래그 클리어
        nrfWriteReg(0x07, 0x40)

        return result
    }

    //% block="nRF24L01 number receive"
    //% group="nRF24L01" weight=70
    export function nrf24l01ReceiveNumber(): number {
        let str = nrf24l01ReceiveString()
        let num = parseFloat(str)
        return isNaN(num) ? 0 : num
    }

    // nRF24L01 내부 함수들
    function nrfWriteReg(reg: number, value: number): void {
        pins.digitalWritePin(_nrfCSN, 0)
        pins.spiWrite(0x20 | reg)
        pins.spiWrite(value)
        pins.digitalWritePin(_nrfCSN, 1)
    }

    function nrfReadReg(reg: number): number {
        pins.digitalWritePin(_nrfCSN, 0)
        pins.spiWrite(reg)
        let value = pins.spiWrite(0xFF)
        pins.digitalWritePin(_nrfCSN, 1)
        return value
    }

    function nrfFlushTx(): void {
        pins.digitalWritePin(_nrfCSN, 0)
        pins.spiWrite(0xE1)
        pins.digitalWritePin(_nrfCSN, 1)
    }

    function nrfFlushRx(): void {
        pins.digitalWritePin(_nrfCSN, 0)
        pins.spiWrite(0xE2)
        pins.digitalWritePin(_nrfCSN, 1)
    }

    function nrfSendPayload(payload: number[]): boolean {
        // TX FIFO에 데이터 쓰기
        pins.digitalWritePin(_nrfCSN, 0)
        pins.spiWrite(0xA0)  // W_TX_PAYLOAD
        for (let byte of payload) {
            pins.spiWrite(byte)
        }
        pins.digitalWritePin(_nrfCSN, 1)

        // 전송 시작
        pins.digitalWritePin(_nrfCE, 1)
        control.waitMicros(15)
        pins.digitalWritePin(_nrfCE, 0)

        // 전송 완료 대기
        basic.pause(10)
        let status = nrfReadReg(0x07)

        // 플래그 클리어
        nrfWriteReg(0x07, 0x30)

        return (status & 0x20) != 0  // TX_DS 플래그
    }


    /********** LoRa 장거리 무선 모듈 **********/

    // LoRa는 장거리 저전력 무선 통신 모듈입니다.
    // 최대 10km 이상 통신 가능 (환경에 따라 다름)
    // SX1276/SX1278 또는 Ra-02 모듈 사용

    // LoRa 핀 저장 변수
    let _loraTx: SerialPin = SerialPin.P1
    let _loraRx: SerialPin = SerialPin.P2
    let _loraChannel: number = 0
    let _loraAddress: number = 0

    //% block="LoRa set|TX pin %tx|RX pin %rx|channel %channel|address %addr"
    //% tx.defl=SerialPin.P1
    //% rx.defl=SerialPin.P2
    //% channel.defl=0 channel.min=0 channel.max=31
    //% addr.defl=0 addr.min=0 addr.max=65535
    //% group="LoRa" weight=69
    //% inlineInputMode=inline
    export function loraInit(tx: SerialPin, rx: SerialPin, channel: number, addr: number): void {
        _loraTx = tx
        _loraRx = rx
        _loraChannel = channel
        _loraAddress = addr

        serial.redirect(tx, rx, BaudRate.BaudRate9600)
        basic.pause(100)
    }

    //% block="LoRa string send %text"
    //% text.defl="Hello"
    //% group="LoRa" weight=68
    export function loraSendString(text: string): void {
        serial.writeLine(text)
    }

    //% block="LoRa number send %value"
    //% group="LoRa" weight=67
    export function loraSendNumber(value: number): void {
        serial.writeLine("" + value)
    }

    //% block="LoRa data receive"
    //% group="LoRa" weight=66
    export function loraReceive(): string {
        return serial.readLine()
    }

    //% block="LoRa target address set %addr"
    //% addr.defl=0 addr.min=0 addr.max=65535
    //% group="LoRa" weight=65
    export function loraSetTarget(addr: number): void {
        // AT 명령어로 대상 주소 설정 (모듈에 따라 다름)
        serial.writeLine("AT+ADDR=" + addr)
        basic.pause(100)
    }


    /********** MFRC522 RFID 리더 **********/

    // MFRC522는 13.56MHz RFID 카드 리더입니다.
    // Mifare Classic 1K/4K 카드 및 태그를 읽을 수 있습니다.
    // SPI 통신 사용

    // MFRC522 핀 저장 변수
    let _mfrc522RST: DigitalPin = DigitalPin.P8
    let _mfrc522SDA: DigitalPin = DigitalPin.P16  // CS/SDA
    let _mfrc522LastUID: string = ""
    let _mfrc522CardPresent: boolean = false

    // MFRC522 레지스터 주소
    const MFRC522_CommandReg = 0x01
    const MFRC522_ComIEnReg = 0x02
    const MFRC522_ComIrqReg = 0x04
    const MFRC522_DivIrqReg = 0x05
    const MFRC522_ErrorReg = 0x06
    const MFRC522_Status1Reg = 0x07
    const MFRC522_Status2Reg = 0x08
    const MFRC522_FIFODataReg = 0x09
    const MFRC522_FIFOLevelReg = 0x0A
    const MFRC522_ControlReg = 0x0C
    const MFRC522_BitFramingReg = 0x0D
    const MFRC522_ModeReg = 0x11
    const MFRC522_TxControlReg = 0x14
    const MFRC522_TxASKReg = 0x15
    const MFRC522_CRCResultRegH = 0x21
    const MFRC522_CRCResultRegL = 0x22
    const MFRC522_TModeReg = 0x2A
    const MFRC522_TPrescalerReg = 0x2B
    const MFRC522_TReloadRegH = 0x2C
    const MFRC522_TReloadRegL = 0x2D
    const MFRC522_VersionReg = 0x37

    //% block="RFID(MFRC522) set|RST pin %rst|SDA pin %sda"
    //% rst.defl=DigitalPin.P8
    //% sda.defl=DigitalPin.P16
    //% group="MFRC522" weight=64
    //% inlineInputMode=inline
    export function mfrc522Init(rst: DigitalPin, sda: DigitalPin): void {
        _mfrc522RST = rst
        _mfrc522SDA = sda

        // 핀 초기화
        pins.digitalWritePin(_mfrc522SDA, 1)
        pins.digitalWritePin(_mfrc522RST, 1)

        // 하드웨어 리셋
        pins.digitalWritePin(_mfrc522RST, 0)
        control.waitMicros(10)
        pins.digitalWritePin(_mfrc522RST, 1)
        basic.pause(50)

        // 소프트 리셋
        mfrc522WriteReg(MFRC522_CommandReg, 0x0F)
        basic.pause(50)

        // 타이머 설정
        mfrc522WriteReg(MFRC522_TModeReg, 0x8D)
        mfrc522WriteReg(MFRC522_TPrescalerReg, 0x3E)
        mfrc522WriteReg(MFRC522_TReloadRegH, 0x00)
        mfrc522WriteReg(MFRC522_TReloadRegL, 0x30)

        // 기타 설정
        mfrc522WriteReg(MFRC522_TxASKReg, 0x40)
        mfrc522WriteReg(MFRC522_ModeReg, 0x3D)

        // 안테나 ON
        let txControl = mfrc522ReadReg(MFRC522_TxControlReg)
        mfrc522WriteReg(MFRC522_TxControlReg, txControl | 0x03)
    }

    //% block="RFID card detected?"
    //% group="MFRC522" weight=63
    export function mfrc522CardPresent(): boolean {
        // REQA 명령 전송
        mfrc522WriteReg(MFRC522_BitFramingReg, 0x07)

        let result = mfrc522Transceive([0x26], 1)
        _mfrc522CardPresent = (result.length == 2)

        return _mfrc522CardPresent
    }

    //% block="RFID card UID read"
    //% group="MFRC522" weight=62
    export function mfrc522ReadUID(): string {
        if (!mfrc522CardPresent()) {
            _mfrc522LastUID = ""
            return ""
        }

        // Anticollision 명령
        mfrc522WriteReg(MFRC522_BitFramingReg, 0x00)
        let result = mfrc522Transceive([0x93, 0x20], 2)

        if (result.length >= 5) {
            // UID를 16진수 문자열로 변환
            _mfrc522LastUID = ""
            for (let i = 0; i < 4; i++) {
                let b = result[i]
                let hex = "0123456789ABCDEF".charAt((b >> 4) & 0x0F) + "0123456789ABCDEF".charAt(b & 0x0F)
                _mfrc522LastUID += hex
            }
        } else {
            _mfrc522LastUID = ""
        }

        return _mfrc522LastUID
    }

    //% block="RFID last UID"
    //% group="MFRC522" weight=61
    export function mfrc522LastUID(): string {
        return _mfrc522LastUID
    }

    //% block="RFID UID %targetUID ?"
    //% targetUID.defl="A1B2C3D4"
    //% group="MFRC522" weight=60
    export function mfrc522UIDMatches(targetUID: string): boolean {
        return _mfrc522LastUID.toUpperCase() == targetUID.toUpperCase()
    }

    //% block="RFID card detected"
    //% group="MFRC522" weight=59
    //% draggableParameters
    export function mfrc522OnCardDetected(handler: () => void): void {
        control.inBackground(() => {
            while (true) {
                if (mfrc522CardPresent()) {
                    mfrc522ReadUID()
                    handler()
                    basic.pause(500)  // 중복 감지 방지
                }
                basic.pause(100)
            }
        })
    }

    // MFRC522 내부 함수들
    function mfrc522WriteReg(reg: number, value: number): void {
        pins.digitalWritePin(_mfrc522SDA, 0)
        pins.spiWrite((reg << 1) & 0x7E)
        pins.spiWrite(value)
        pins.digitalWritePin(_mfrc522SDA, 1)
    }

    function mfrc522ReadReg(reg: number): number {
        pins.digitalWritePin(_mfrc522SDA, 0)
        pins.spiWrite(((reg << 1) & 0x7E) | 0x80)
        let value = pins.spiWrite(0x00)
        pins.digitalWritePin(_mfrc522SDA, 1)
        return value
    }

    function mfrc522Transceive(data: number[], txBits: number): number[] {
        // FIFO 클리어
        mfrc522WriteReg(MFRC522_FIFOLevelReg, 0x80)

        // 데이터를 FIFO에 쓰기
        for (let byte of data) {
            mfrc522WriteReg(MFRC522_FIFODataReg, byte)
        }

        // Transceive 명령 실행
        mfrc522WriteReg(MFRC522_CommandReg, 0x0C)
        mfrc522WriteReg(MFRC522_BitFramingReg, mfrc522ReadReg(MFRC522_BitFramingReg) | 0x80)

        // 응답 대기
        let timeout = 25
        let irq = 0
        while (timeout > 0) {
            irq = mfrc522ReadReg(MFRC522_ComIrqReg)
            if ((irq & 0x30) != 0) break  // RxIRq 또는 IdleIRq
            timeout--
            basic.pause(1)
        }

        // 전송 중지
        mfrc522WriteReg(MFRC522_BitFramingReg, mfrc522ReadReg(MFRC522_BitFramingReg) & 0x7F)

        // 에러 체크
        if (timeout == 0 || (mfrc522ReadReg(MFRC522_ErrorReg) & 0x1B) != 0) {
            return []
        }

        // 결과 읽기
        let result: number[] = []
        let fifoLen = mfrc522ReadReg(MFRC522_FIFOLevelReg)
        for (let i = 0; i < fifoLen; i++) {
            result.push(mfrc522ReadReg(MFRC522_FIFODataReg))
        }

        return result
    }


    /********** PN532 NFC 리더 **********/

    // PN532는 NFC 리더/라이터 모듈입니다.
    // RFID 카드 읽기, NFC 태그 읽기/쓰기 지원
    // I2C 또는 SPI 통신 사용

    // PN532 변수
    let _pn532Addr: number = 0x24
    let _pn532LastUID: string = ""

    //% block="NFC(PN532) I2C set address %addr"
    //% addr.defl=0x24
    //% group="PN532" weight=58
    export function pn532Init(addr: number): void {
        _pn532Addr = addr

        // PN532 웨이크업
        basic.pause(100)

        // SAM 설정 (Security Access Module)
        let samConfig = [0x00, 0x00, 0xFF, 0x05, 0xFB, 0xD4, 0x14, 0x01, 0x00, 0x00, 0x17, 0x00]
        let buf = pins.createBuffer(samConfig.length)
        for (let i = 0; i < samConfig.length; i++) {
            buf[i] = samConfig[i]
        }
        pins.i2cWriteBuffer(_pn532Addr, buf)
        basic.pause(100)
    }

    //% block="NFC card detected?"
    //% group="PN532" weight=57
    export function pn532CardPresent(): boolean {
        // InListPassiveTarget 명령
        let cmd = [0x00, 0x00, 0xFF, 0x04, 0xFC, 0xD4, 0x4A, 0x01, 0x00, 0xE1, 0x00]
        let buf = pins.createBuffer(cmd.length)
        for (let i = 0; i < cmd.length; i++) {
            buf[i] = cmd[i]
        }
        pins.i2cWriteBuffer(_pn532Addr, buf)
        basic.pause(100)

        // 응답 읽기
        let response = pins.i2cReadBuffer(_pn532Addr, 20)

        // 카드 감지 확인 (간소화)
        return response.length > 10 && response[7] == 0xD5
    }

    //% block="NFC card UID read"
    //% group="PN532" weight=56
    export function pn532ReadCard(): string {
        if (!pn532CardPresent()) {
            _pn532LastUID = ""
            return ""
        }

        // 응답에서 UID 추출 (간소화된 구현)
        let response = pins.i2cReadBuffer(_pn532Addr, 25)

        if (response.length > 15) {
            _pn532LastUID = ""
            let uidLen = response[12]
            if (uidLen > 0 && uidLen <= 7) {
                for (let i = 0; i < uidLen; i++) {
                    let b = response[13 + i]
                    let hex = "0123456789ABCDEF".charAt((b >> 4) & 0x0F) + "0123456789ABCDEF".charAt(b & 0x0F)
                    _pn532LastUID += hex
                }
            }
        }

        return _pn532LastUID
    }

    //% block="NFC last UID"
    //% group="PN532" weight=55
    export function pn532LastUID(): string {
        return _pn532LastUID
    }

    //% block="NFC UID %targetUID ?"
    //% targetUID.defl="04A1B2C3"
    //% group="PN532" weight=54
    export function pn532UIDMatches(targetUID: string): boolean {
        return _pn532LastUID.toUpperCase() == targetUID.toUpperCase()
    }


    /********** GPS 모듈 (NEO-6M/7M 등) **********/

    // GPS 모듈은 NMEA 프로토콜로 위치 정보를 전송합니다.
    // NEO-6M, NEO-7M, NEO-M8N 등 대부분의 GPS 모듈 호환

    // GPS 시리얼 타입
    export enum GPSSerial {
        //% block="Serial"
        Hardware = 0,
        //% block="software serial"
        Software = 1
    }

    // GPS 데이터 타입
    export enum GPSData {
        //% block="latitude"
        Latitude = 0,
        //% block="longitude"
        Longitude = 1,
        //% block="altitude(m)"
        Altitude = 2,
        //% block="speed(km/h)"
        Speed = 3,
        //% block="direction(°)"
        Course = 4,
        //% block="satellite"
        Satellites = 5,
        //% block="time(UTC)"
        Time = 6,
        //% block="date"
        Date = 7
    }

    // 거리/방위 계산 타입
    export enum GPSCalcType {
        //% block="distance(m)"
        DistanceMeters = 0,
        //% block="distance(km)"
        DistanceKm = 1,
        //% block="bearing(°)"
        Bearing = 2
    }

    // GPS 상태 변수
    let _gpsSerial: GPSSerial = GPSSerial.Hardware
    let _gpsTx: SerialPin = SerialPin.P1
    let _gpsRx: SerialPin = SerialPin.P2
    let _gpsBaud: BaudRate = BaudRate.BaudRate9600
    let _gpsLatitude: number = 0
    let _gpsLongitude: number = 0
    let _gpsAltitude: number = 0
    let _gpsSpeed: number = 0
    let _gpsCourse: number = 0
    let _gpsSatellites: number = 0
    let _gpsTime: string = ""
    let _gpsDate: string = ""
    let _gpsFix: boolean = false
    let _gpsRawData: string = ""

    //% block="GPS set: serial %serialType|baud rate %baud|↳ (software serial when selected) RX pin %rx|TX pin %tx"
    //% serialType.defl=GPSSerial.Hardware
    //% baud.defl=9600
    //% rx.defl=SerialPin.P2
    //% tx.defl=SerialPin.P1
    //% group="GPS" weight=53
    //% inlineInputMode=inline
    export function gpsInit(serialType: GPSSerial, baud: number, rx: SerialPin, tx: SerialPin): void {
        _gpsSerial = serialType
        _gpsTx = tx
        _gpsRx = rx

        if (baud == 4800) _gpsBaud = BaudRate.BaudRate4800
        else if (baud == 19200) _gpsBaud = BaudRate.BaudRate19200
        else if (baud == 38400) _gpsBaud = BaudRate.BaudRate38400
        else if (baud == 57600) _gpsBaud = BaudRate.BaudRate57600
        else if (baud == 115200) _gpsBaud = BaudRate.BaudRate115200
        else _gpsBaud = BaudRate.BaudRate9600

        serial.redirect(tx, rx, _gpsBaud)
        basic.pause(100)
    }

    //% block="GPS update (serial receive → parsing)"
    //% group="GPS" weight=52
    export function gpsUpdate(): void {
        // NMEA 문장 읽기
        let rawData = serial.readString()
        if (rawData.length == 0) return

        _gpsRawData += rawData

        // $GPGGA 또는 $GPRMC 문장 파싱
        let ggaStart = _gpsRawData.indexOf("$GPGGA")
        let rmcStart = _gpsRawData.indexOf("$GPRMC")

        // GPGGA 파싱 (위치, 고도, 위성 수)
        if (ggaStart >= 0) {
            let ggaEnd = _gpsRawData.indexOf("\r", ggaStart)
            if (ggaEnd > ggaStart) {
                let gga = _gpsRawData.substr(ggaStart, ggaEnd - ggaStart)
                parseGPGGA(gga)
                _gpsRawData = _gpsRawData.substr(ggaEnd + 1)
            }
        }

        // GPRMC 파싱 (위치, 속도, 방향, 날짜)
        if (rmcStart >= 0) {
            let rmcEnd = _gpsRawData.indexOf("\r", rmcStart)
            if (rmcEnd > rmcStart) {
                let rmc = _gpsRawData.substr(rmcStart, rmcEnd - rmcStart)
                parseGPRMC(rmc)
                _gpsRawData = _gpsRawData.substr(rmcEnd + 1)
            }
        }

        // 버퍼 오버플로우 방지
        if (_gpsRawData.length > 500) {
            _gpsRawData = _gpsRawData.substr(_gpsRawData.length - 200)
        }
    }

    //% block="GPS value read %dataType"
    //% group="GPS" weight=51
    export function gpsRead(dataType: GPSData): number {
        switch (dataType) {
            case GPSData.Latitude: return _gpsLatitude
            case GPSData.Longitude: return _gpsLongitude
            case GPSData.Altitude: return _gpsAltitude
            case GPSData.Speed: return _gpsSpeed
            case GPSData.Course: return _gpsCourse
            case GPSData.Satellites: return _gpsSatellites
            default: return 0
        }
    }

    //% block="GPS signal acquired (FIX)?"
    //% group="GPS" weight=50
    export function gpsHasFix(): boolean {
        return _gpsFix
    }

    //% block="calculate two coordinates|calc type %calcType|latitude1 %lat1|longitude1 %lon1|latitude2 %lat2|longitude2 %lon2"
    //% calcType.defl=GPSCalcType.DistanceMeters
    //% lat1.defl=37.5665 lon1.defl=126.978
    //% lat2.defl=35.1796 lon2.defl=129.0756
    //% group="GPS" weight=49
    //% inlineInputMode=inline
    export function gpsCalculate(calcType: GPSCalcType, lat1: number, lon1: number, lat2: number, lon2: number): number {
        // Haversine 공식으로 거리 계산
        let R = 6371000  // 지구 반지름 (미터)
        let dLat = (lat2 - lat1) * Math.PI / 180
        let dLon = (lon2 - lon1) * Math.PI / 180
        let a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
            Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
            Math.sin(dLon / 2) * Math.sin(dLon / 2)
        let c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))
        let distance = R * c

        if (calcType == GPSCalcType.DistanceMeters) {
            return Math.round(distance)
        } else if (calcType == GPSCalcType.DistanceKm) {
            return Math.round(distance / 10) / 100  // 소수점 2자리
        } else {
            // 방위각 계산
            let y = Math.sin(dLon) * Math.cos(lat2 * Math.PI / 180)
            let x = Math.cos(lat1 * Math.PI / 180) * Math.sin(lat2 * Math.PI / 180) -
                Math.sin(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * Math.cos(dLon)
            let bearing = Math.atan2(y, x) * 180 / Math.PI
            return (bearing + 360) % 360
        }
    }

    //% block="bearing 16 directionsto|angle %angle"
    //% angle.defl=0
    //% group="GPS" weight=48
    export function gpsBearingTo16(angle: number): string {
        let directions = ["N", "NNE", "NE", "ENE", "E", "ESE", "SE", "SSE",
            "S", "SSW", "SW", "WSW", "W", "WNW", "NW", "NNW"]
        let index = Math.round(((angle % 360) + 360) % 360 / 22.5) % 16
        return directions[index]
    }

    //% block="GPS time (UTC)"
    //% group="GPS" weight=47
    export function gpsGetTime(): string {
        return _gpsTime
    }

    //% block="GPS date"
    //% group="GPS" weight=46
    export function gpsGetDate(): string {
        return _gpsDate
    }

    // GPGGA 문장 파싱 (내부 함수)
    function parseGPGGA(sentence: string): void {
        let parts = sentence.split(",")
        if (parts.length < 10) return

        // 시간 (HHMMSS.sss)
        if (parts[1].length >= 6) {
            _gpsTime = parts[1].substr(0, 2) + ":" + parts[1].substr(2, 2) + ":" + parts[1].substr(4, 2)
        }

        // 위도
        if (parts[2].length > 0) {
            let latDeg = parseFloat(parts[2].substr(0, 2))
            let latMin = parseFloat(parts[2].substr(2))
            _gpsLatitude = latDeg + latMin / 60
            if (parts[3] == "S") _gpsLatitude = -_gpsLatitude
        }

        // 경도
        if (parts[4].length > 0) {
            let lonDeg = parseFloat(parts[4].substr(0, 3))
            let lonMin = parseFloat(parts[4].substr(3))
            _gpsLongitude = lonDeg + lonMin / 60
            if (parts[5] == "W") _gpsLongitude = -_gpsLongitude
        }

        // Fix 상태 (0=없음, 1=GPS, 2=DGPS)
        _gpsFix = parseInt(parts[6]) > 0

        // 위성 수
        _gpsSatellites = parseInt(parts[7])

        // 고도
        if (parts[9].length > 0) {
            _gpsAltitude = parseFloat(parts[9])
        }
    }

    // GPRMC 문장 파싱 (내부 함수)
    function parseGPRMC(sentence: string): void {
        let parts = sentence.split(",")
        if (parts.length < 10) return

        // 상태 (A=유효, V=무효)
        _gpsFix = (parts[2] == "A")

        // 속도 (노트 → km/h)
        if (parts[7].length > 0) {
            _gpsSpeed = parseFloat(parts[7]) * 1.852
        }

        // 방향
        if (parts[8].length > 0) {
            _gpsCourse = parseFloat(parts[8])
        }

        // 날짜 (DDMMYY)
        if (parts[9].length >= 6) {
            _gpsDate = parts[9].substr(0, 2) + "/" + parts[9].substr(2, 2) + "/20" + parts[9].substr(4, 2)
        }
    }


    /********** IR 적외선 리모컨 **********/

    // IR 리모컨 수신기 (VS1838B, TSOP38238 등)
    // NEC 프로토콜 기반 (대부분의 리모컨 호환)

    // IR 리모컨 버튼 (일반 미니 리모컨 기준)
    export enum IRButton {
        //% block="0"
        Num0 = 0,
        //% block="1"
        Num1 = 1,
        //% block="2"
        Num2 = 2,
        //% block="3"
        Num3 = 3,
        //% block="4"
        Num4 = 4,
        //% block="5"
        Num5 = 5,
        //% block="6"
        Num6 = 6,
        //% block="7"
        Num7 = 7,
        //% block="8"
        Num8 = 8,
        //% block="9"
        Num9 = 9,
        //% block="*"
        Star = 10,
        //% block="#"
        Hash = 11,
        //% block="▲"
        Up = 12,
        //% block="▼"
        Down = 13,
        //% block="◀"
        Left = 14,
        //% block="▶"
        Right = 15,
        //% block="OK"
        OK = 16,
        //% block="other"
        Other = 99
    }

    // IR 상태 변수
    let _irPin: DigitalPin = DigitalPin.P11
    let _irRawCode: number = 0
    let _irButton: number = -1
    let _irHasSignal: boolean = false
    let _irLastTime: number = 0
    let _irCallback: (button: number) => void = null

    // NEC 리모컨 코드 매핑 (일반적인 미니 리모컨)
    const IR_CODE_MAP: number[] = [
        0x16,  // 0
        0x0C,  // 1
        0x18,  // 2
        0x5E,  // 3
        0x08,  // 4
        0x1C,  // 5
        0x5A,  // 6
        0x42,  // 7
        0x52,  // 8
        0x4A,  // 9
        0x22,  // * (10)
        0x0D,  // # (11)
        0x46,  // ▲ (12)
        0x15,  // ▼ (13)
        0x44,  // ◀ (14)
        0x43,  // ▶ (15)
        0x40   // OK (16)
    ]

    //% block="IR remote receiver set: pin %pin"
    //% pin.defl=DigitalPin.P11
    //% group="Infrared" weight=45
    export function irInit(pin: DigitalPin): void {
        _irPin = pin
        _irRawCode = 0
        _irButton = -1
        _irHasSignal = false

        // 핀 이벤트 설정 (하강 에지에서 시작)
        pins.setPull(pin, PinPullMode.PullUp)

        // 백그라운드에서 IR 신호 모니터링
        control.inBackground(() => {
            while (true) {
                let code = irReadNEC()
                if (code > 0) {
                    _irRawCode = code
                    _irButton = irCodeToButton(code & 0xFF)
                    _irHasSignal = true
                    _irLastTime = input.runningTime()

                    if (_irCallback != null) {
                        _irCallback(_irButton)
                    }
                }
                basic.pause(50)
            }
        })
    }

    //% block="IR remote signal ?"
    //% group="Infrared" weight=44
    export function irHasSignal(): boolean {
        // 500ms 이내에 신호가 있었으면 true
        if (_irHasSignal && (input.runningTime() - _irLastTime) < 500) {
            return true
        }
        _irHasSignal = false
        return false
    }

    //% block="IR remote button #"
    //% group="Infrared" weight=43
    export function irButtonNumber(): number {
        let btn = _irButton
        _irHasSignal = false
        return btn
    }

    //% block="IR remote original code value"
    //% group="Infrared" weight=42
    export function irRawCode(): number {
        return _irRawCode
    }

    //% block="Is the IR remote button %button ?"
    //% button.defl=IRButton.Num0
    //% group="Infrared" weight=41
    export function irButtonIs(button: IRButton): boolean {
        return _irButton == button
    }

    //% block="When the IR remote button is pressed"
    //% group="Infrared" weight=40
    //% draggableParameters
    export function irOnButton(handler: (button: number) => void): void {
        _irCallback = handler
    }

    // NEC 프로토콜 읽기 (내부 함수)
    function irReadNEC(): number {
        // 리더 펄스 대기 (9ms LOW)
        let startTime = input.runningTimeMicros()
        while (pins.digitalReadPin(_irPin) == 0) {
            if (input.runningTimeMicros() - startTime > 15000) return 0
        }
        let lowTime = input.runningTimeMicros() - startTime
        if (lowTime < 8000 || lowTime > 10000) return 0

        // 스페이스 대기 (4.5ms HIGH)
        startTime = input.runningTimeMicros()
        while (pins.digitalReadPin(_irPin) == 1) {
            if (input.runningTimeMicros() - startTime > 6000) return 0
        }
        let highTime = input.runningTimeMicros() - startTime
        if (highTime < 4000 || highTime > 5000) return 0

        // 32비트 데이터 읽기
        let data: number = 0
        for (let i = 0; i < 32; i++) {
            // LOW 구간 (562.5us)
            startTime = input.runningTimeMicros()
            while (pins.digitalReadPin(_irPin) == 0) {
                if (input.runningTimeMicros() - startTime > 1000) return 0
            }

            // HIGH 구간 측정 (0: 562.5us, 1: 1687.5us)
            startTime = input.runningTimeMicros()
            while (pins.digitalReadPin(_irPin) == 1) {
                if (input.runningTimeMicros() - startTime > 2000) return 0
            }
            let bitTime = input.runningTimeMicros() - startTime

            // 비트 판별
            if (bitTime > 1000) {
                data |= (1 << i)
            }
        }

        return data
    }

    // IR 코드를 버튼 번호로 변환 (내부 함수)
    function irCodeToButton(code: number): number {
        for (let i = 0; i < IR_CODE_MAP.length; i++) {
            if (IR_CODE_MAP[i] == code) {
                return i
            }
        }
        return IRButton.Other
    }

    //% block="IR TX code %code|pin %pin"
    //% code.defl=0
    //% pin.defl=DigitalPin.P12
    //% group="Infrared" weight=39
    export function irTransmit(code: number, pin: DigitalPin): void {
        // NEC 프로토콜 송신
        // 리더 펄스 (9ms 38kHz, 4.5ms OFF)
        irCarrier(pin, 9000)
        control.waitMicros(4500)

        // 32비트 데이터 전송
        for (let i = 0; i < 32; i++) {
            // 562.5us 캐리어
            irCarrier(pin, 562)

            // 데이터 비트에 따라 대기
            if (code & (1 << i)) {
                control.waitMicros(1687)  // 1
            } else {
                control.waitMicros(562)   // 0
            }
        }

        // 종료 펄스
        irCarrier(pin, 562)
    }

    // 38kHz 캐리어 생성 (내부 함수)
    function irCarrier(pin: DigitalPin, durationUs: number): void {
        let cycles = Math.floor(durationUs / 26)  // 38kHz = 26us 주기
        for (let i = 0; i < cycles; i++) {
            pins.digitalWritePin(pin, 1)
            control.waitMicros(13)
            pins.digitalWritePin(pin, 0)
            control.waitMicros(13)
        }
    }
}
