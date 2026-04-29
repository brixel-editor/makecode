/**
 * BRIXEL Extension - 09. USB Serial (v3.0 — 브릭셀 에디터 호환)
 * 8-block 단일 인터페이스 + 형변환 3블록
 *
 * 핵심 변경:
 *  - 송신: [값] 보내기 1블록 (자동 \n)
 *  - 수신: 자동 코얼레스 (변경시만 / 매번)
 *  - 메시지 받았을 때 [statement] 핸들러
 *  - 파싱: split + 1-based 인덱스
 *  - 형변환: 정수 / 실수 / ASCII
 */

//% weight=1010 color=#367E7F icon="" block="09. USB Serial"
//% groups="['Settings', 'Send', 'Receive', 'Parse', 'Convert']"
namespace USBSerial {

    let _connected: boolean = false
    let _lastMsg: string = ""
    let _prevMsg: string = ""
    let _msgReady: boolean = false
    let _msgConsumed: boolean = true
    let _anyReady: boolean = false
    let _anyConsumed: boolean = true
    let _parsedData: string = ""
    let _parsedDelim: string = ","
    let _pollStarted: boolean = false
    let _changedHandler: (msg: string) => void = null
    let _anyHandler: (msg: string) => void = null

    function _ensurePoll(): void {
        if (_pollStarted) return
        _pollStarted = true
        control.inBackground(() => {
            while (true) {
                let line = serial.readUntil(serial.delimiters(Delimiters.NewLine))
                if (line && line.length > 0) {
                    if (line.charCodeAt(line.length - 1) === 13) {
                        line = line.substr(0, line.length - 1)
                    }
                    if (line.length > 0) {
                        _lastMsg = line
                        _anyReady = true
                        _anyConsumed = false
                        if (_anyHandler) _anyHandler(line)
                        if (line !== _prevMsg) {
                            _prevMsg = line
                            _msgReady = true
                            _msgConsumed = false
                            if (_changedHandler) _changedHandler(line)
                        }
                    }
                }
                basic.pause(5)
            }
        })
    }

    //% block="📡 Serial start RX %rx TX %tx Baud %baud"
    //% rx.defl=SerialPin.USB_RX
    //% tx.defl=SerialPin.USB_TX
    //% baud.defl=BaudRate.BaudRate115200
    //% group="Settings" weight=100
    //% inlineInputMode=inline
    export function serialStart(rx: SerialPin, tx: SerialPin, baud: BaudRate): void {
        serial.redirect(tx, rx, baud)
        _connected = true
        basic.pause(100)
        _ensurePoll()
    }

    //% block="📡 Serial connected?"
    //% group="Settings" weight=99
    export function serialIsConnected(): boolean {
        return _connected
    }

    //% block="📤 Serial send %value"
    //% value.defl="Hello"
    //% group="Send" weight=98
    export function serialSend(value: string): void {
        serial.writeLine(value)
    }

    //% block="📥 on Serial message changed"
    //% group="Receive" weight=97
    //% draggableParameters
    export function onSerialMessageChanged(handler: (message: string) => void): void {
        _changedHandler = handler
        _ensurePoll()
    }

    //% block="📥 on Serial message any"
    //% group="Receive" weight=96
    //% draggableParameters
    export function onSerialMessageAny(handler: (message: string) => void): void {
        _anyHandler = handler
        _ensurePoll()
    }

    //% block="📥 Serial received value"
    //% group="Receive" weight=95
    export function serialGetReceived(): string {
        _ensurePoll()
        return _lastMsg
    }

    //% block="📥 Serial new message?"
    //% group="Receive" weight=94
    export function serialHasNew(): boolean {
        _ensurePoll()
        if (_msgReady && !_msgConsumed) {
            _msgConsumed = true
            return true
        }
        return false
    }

    //% block="🔍 Serial parse received with %delimiter"
    //% delimiter.defl=","
    //% group="Parse" weight=93
    export function serialParse(delimiter: string): void {
        _parsedDelim = delimiter && delimiter.length > 0 ? delimiter : ","
        _parsedData = _lastMsg
    }

    //% block="🔍 Serial parsed %index th value"
    //% index.defl=1 index.min=1
    //% group="Parse" weight=92
    export function serialParsedGet(index: number): string {
        if (!_parsedData || _parsedData.length === 0) return ""
        let parts = _parsedData.split(_parsedDelim)
        if (index < 1 || index > parts.length) return ""
        return parts[index - 1]
    }

    //% block="🔢 %value to integer"
    //% value.defl="0"
    //% group="Convert" weight=91
    export function commToInt(value: string): number {
        let n = parseFloat(value)
        if (isNaN(n)) return 0
        return Math.trunc(n)
    }

    //% block="🔢 %value to float"
    //% value.defl="0"
    //% group="Convert" weight=90
    export function commToFloat(value: string): number {
        let n = parseFloat(value)
        return isNaN(n) ? 0 : n
    }

    //% block="🔢 %value ASCII byte"
    //% value.defl="A"
    //% group="Convert" weight=89
    export function commToAscii(value: string): number {
        if (!value || value.length === 0) return 0
        return value.charCodeAt(0)
    }
}
