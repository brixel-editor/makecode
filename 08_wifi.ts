/**
 * BRIXEL Extension - 08. WiFi (v3.0 — 브릭셀 에디터 호환)
 * ESP8266 / ESP32 WebSocket — 8-block 단일 인터페이스
 *
 * 핵심 변경:
 *  - 송신: WS [값] 보내기 1블록 (자동 \n)
 *  - 수신: 자동 코얼레스 (변경시만 / 매번)
 *  - WS 메시지 받았을 때 [statement] 핸들러
 *  - 파싱: split + 1-based 인덱스
 */

//% weight=1020 color=#4285F4 icon="" block="08. WiFi"
//% groups="['Settings', 'Send', 'Receive', 'Parse']"
namespace WiFi08 {

    let _wifiTx: SerialPin = SerialPin.P1
    let _wifiRx: SerialPin = SerialPin.P2
    let _wifiBaud: BaudRate = BaudRate.BaudRate115200
    let _wifiConnected: boolean = false
    let _wifiIP: string = ""

    let _wsLastMsg: string = ""
    let _wsPrevMsg: string = ""
    let _wsMsgReady: boolean = false
    let _wsMsgConsumed: boolean = true
    let _wsAnyReady: boolean = false
    let _wsAnyConsumed: boolean = true
    let _wsParsedData: string = ""
    let _wsParsedDelim: string = ","
    let _wsPollStarted: boolean = false
    let _wsChangedHandler: (msg: string) => void = null
    let _wsAnyHandler: (msg: string) => void = null

    function _at(cmd: string, waitMs: number): string {
        serial.writeString(cmd + "\r\n")
        basic.pause(waitMs)
        return serial.readString()
    }

    function _handleWsLine(line: string): void {
        if (line.charCodeAt(line.length - 1) === 13) {
            line = line.substr(0, line.length - 1)
        }
        if (line.length === 0) return
        _wsLastMsg = line
        _wsAnyReady = true
        _wsAnyConsumed = false
        if (_wsAnyHandler) _wsAnyHandler(line)
        if (line !== _wsPrevMsg) {
            _wsPrevMsg = line
            _wsMsgReady = true
            _wsMsgConsumed = false
            if (_wsChangedHandler) _wsChangedHandler(line)
        }
    }

    function _ensureWsPoll(): void {
        if (_wsPollStarted) return
        _wsPollStarted = true
        control.inBackground(() => {
            let buf = ""
            while (true) {
                let chunk = serial.readString()
                if (chunk && chunk.length > 0) {
                    buf += chunk
                    let ipdIdx = buf.indexOf("+IPD")
                    while (ipdIdx >= 0) {
                        let colon = buf.indexOf(":", ipdIdx)
                        if (colon < 0) break
                        let header = buf.substr(ipdIdx, colon - ipdIdx)
                        let parts = header.split(",")
                        let len = parseInt(parts[parts.length - 1])
                        if (isNaN(len) || len <= 0) {
                            buf = buf.substr(colon + 1)
                            ipdIdx = buf.indexOf("+IPD")
                            continue
                        }
                        if (buf.length < colon + 1 + len) break
                        let payload = buf.substr(colon + 1, len)
                        buf = buf.substr(colon + 1 + len)
                        let lines = payload.split("\n")
                        for (let i = 0; i < lines.length; i++) {
                            if (lines[i].length > 0) _handleWsLine(lines[i])
                        }
                        ipdIdx = buf.indexOf("+IPD")
                    }
                    if (buf.length > 1024) buf = buf.substr(buf.length - 512)
                }
                basic.pause(20)
            }
        })
    }

    //% block="📶 WiFi start SSID %ssid Password %password"
    //% ssid.defl="SSID"
    //% password.defl="PASSWORD"
    //% group="Settings" weight=100
    //% inlineInputMode=inline
    export function wifiStart(ssid: string, password: string): void {
        serial.redirect(_wifiTx, _wifiRx, _wifiBaud)
        basic.pause(100)
        _wifiConnected = false

        _at("AT+RST", 2000)
        _at("AT+CWMODE=1", 500)
        _at("AT+CWJAP=\"" + ssid + "\",\"" + password + "\"", 5000)

        let resp = _at("AT+CIFSR", 1000)
        if (resp.indexOf("STAIP") >= 0) {
            _wifiConnected = true
            let s = resp.indexOf("STAIP,\"") + 7
            let e = resp.indexOf("\"", s)
            if (s > 6 && e > s) _wifiIP = resp.substr(s, e - s)
        }
    }

    //% block="📶 WS server start port %port"
    //% port.defl=81 port.min=1 port.max=65535
    //% group="Settings" weight=99
    export function wsServerStart(port: number): void {
        _at("AT+CIPMUX=1", 500)
        _at("AT+CIPSERVER=1," + port, 500)
        _ensureWsPoll()
    }

    //% block="📶 WiFi connected?"
    //% group="Settings" weight=98
    export function wifiIsConnected(): boolean {
        return _wifiConnected
    }

    //% block="📶 My IP address"
    //% group="Settings" weight=97
    export function wifiLocalIp(): string {
        if (_wifiIP === "") {
            let resp = _at("AT+CIFSR", 500)
            let s = resp.indexOf("STAIP,\"") + 7
            let e = resp.indexOf("\"", s)
            if (s > 6 && e > s) _wifiIP = resp.substr(s, e - s)
        }
        return _wifiIP
    }

    //% block="📤 WS send %value"
    //% value.defl="Hello"
    //% group="Send" weight=96
    export function wsSend(value: string): void {
        let data = value + "\r\n"
        serial.writeString("AT+CIPSEND=0," + data.length + "\r\n")
        basic.pause(100)
        serial.writeString(data)
        basic.pause(50)
    }

    //% block="📥 on WS message changed"
    //% group="Receive" weight=95
    //% draggableParameters
    export function onWsMessageChanged(handler: (message: string) => void): void {
        _wsChangedHandler = handler
        _ensureWsPoll()
    }

    //% block="📥 on WS message any"
    //% group="Receive" weight=94
    //% draggableParameters
    export function onWsMessageAny(handler: (message: string) => void): void {
        _wsAnyHandler = handler
        _ensureWsPoll()
    }

    //% block="📥 WS received value"
    //% group="Receive" weight=93
    export function wsGetReceived(): string {
        _ensureWsPoll()
        return _wsLastMsg
    }

    //% block="📥 WS new message?"
    //% group="Receive" weight=92
    export function wsHasNew(): boolean {
        _ensureWsPoll()
        if (_wsMsgReady && !_wsMsgConsumed) {
            _wsMsgConsumed = true
            return true
        }
        return false
    }

    //% block="🔍 WS parse received with %delimiter"
    //% delimiter.defl=","
    //% group="Parse" weight=91
    export function wsParse(delimiter: string): void {
        _wsParsedDelim = delimiter && delimiter.length > 0 ? delimiter : ","
        _wsParsedData = _wsLastMsg
    }

    //% block="🔍 WS parsed %index th value"
    //% index.defl=1 index.min=1
    //% group="Parse" weight=90
    export function wsParsedGet(index: number): string {
        if (!_wsParsedData || _wsParsedData.length === 0) return ""
        let parts = _wsParsedData.split(_wsParsedDelim)
        if (index < 1 || index > parts.length) return ""
        return parts[index - 1]
    }
}
