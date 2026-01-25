/**
 * BRIXEL Extension - 08. WiFi
 * ESP8266, ESP32 WiFi, WebSocket
 */

//% weight=1020 color=#4169E1 icon="\uf1eb" block="08. WiFi"
//% groups="['Settings', 'SendReceive']"
namespace WiFi08 {

    /********** WiFi 통신 (ESP8266/ESP32) **********/

    // WiFi 상태 변수
    let _wifiTx: SerialPin = SerialPin.P1
    let _wifiRx: SerialPin = SerialPin.P2
    let _wifiConnected: boolean = false
    let _wifiIP: string = ""
    let _wifiSSID: string = ""
    let _wsConnected: boolean = false
    let _wsMessage: string = ""
    let _wsHasMessage: boolean = false

    //% block="WiFi set SSID « %ssid » Password « %password »"
    //% ssid.defl="SSID"
    //% password.defl="PASSWORD"
    //% group="Settings" weight=100
    //% inlineInputMode=inline
    export function wifiConnect(ssid: string, password: string): void {
        _wifiSSID = ssid
        _wifiConnected = false

        // AT 명령으로 WiFi 연결
        serial.writeString("AT+RST\r\n")
        basic.pause(2000)

        serial.writeString("AT+CWMODE=1\r\n")
        basic.pause(500)

        serial.writeString("AT+CWJAP=\"" + ssid + "\",\"" + password + "\"\r\n")
        basic.pause(5000)

        // 연결 확인
        serial.writeString("AT+CIFSR\r\n")
        basic.pause(1000)

        let response = serial.readString()
        if (response.indexOf("STAIP") >= 0) {
            _wifiConnected = true
            let start = response.indexOf("\"") + 1
            let end = response.indexOf("\"", start)
            if (start > 0 && end > start) {
                _wifiIP = response.substr(start, end - start)
            }
        }
    }

    //% block="WebSocket server start port %port"
    //% port.defl=81 port.min=1 port.max=65535
    //% group="Settings" weight=99
    export function wsServerStart(port: number): void {
        serial.writeString("AT+CIPMUX=1\r\n")
        basic.pause(500)

        serial.writeString("AT+CIPSERVER=1," + port + "\r\n")
        basic.pause(500)

        _wsConnected = true
    }

    //% block="WiFi is connected?"
    //% group="Settings" weight=98
    export function wifiIsConnected(): boolean {
        return _wifiConnected
    }

    //% block="WiFi local IP address"
    //% group="Settings" weight=97
    export function wifiGetIP(): string {
        if (_wifiIP == "") {
            serial.writeString("AT+CIFSR\r\n")
            basic.pause(500)
            let response = serial.readString()
            let start = response.indexOf("STAIP,\"") + 7
            let end = response.indexOf("\"", start)
            if (start > 6 && end > start) {
                _wifiIP = response.substr(start, end - start)
            }
        }
        return _wifiIP
    }

    //% block="WebSocket has message?"
    //% group="SendReceive" weight=96
    export function wsHasMessage(): boolean {
        let data = serial.readString()
        if (data.length > 0 && data.indexOf("+IPD") >= 0) {
            let start = data.indexOf(":") + 1
            if (start > 0) {
                _wsMessage = data.substr(start)
                _wsHasMessage = true
            }
        }
        return _wsHasMessage
    }

    //% block="WebSocket read message"
    //% group="SendReceive" weight=95
    export function wsReadMessage(): string {
        _wsHasMessage = false
        let msg = _wsMessage
        _wsMessage = ""
        return msg
    }

    //% block="WebSocket send « %text » (with newline)"
    //% text.defl="Hello"
    //% group="SendReceive" weight=94
    export function wsSendLine(text: string): void {
        let data = text + "\r\n"
        serial.writeString("AT+CIPSEND=0," + data.length + "\r\n")
        basic.pause(100)
        serial.writeString(data)
        basic.pause(100)
    }

    //% block="WebSocket send « %text » (no newline)"
    //% text.defl="Hello"
    //% group="SendReceive" weight=93
    export function wsSendString(text: string): void {
        serial.writeString("AT+CIPSEND=0," + text.length + "\r\n")
        basic.pause(100)
        serial.writeString(text)
        basic.pause(100)
    }

    //% block="WebSocket send label « %label » value %value"
    //% label.defl="temp"
    //% value.defl=25
    //% group="SendReceive" weight=92
    //% inlineInputMode=inline
    export function wsSendValue(label: string, value: number): void {
        let data = label + ":" + value + "\r\n"
        serial.writeString("AT+CIPSEND=0," + data.length + "\r\n")
        basic.pause(100)
        serial.writeString(data)
        basic.pause(100)
    }
}
