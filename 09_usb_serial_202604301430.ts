/**
 * BRIXEL Extension - 09. USB Serial
 * Serial communication, parsing
 */

//% weight=1010 color=#4285F4 icon="\uf287" block="09. USB Serial"
//% groups="['Settings', 'Send', 'Receive', 'Parse (Scratch)', 'Parse (Direct)']"
namespace USBSerial {

    /********** USB 시리얼 통신 **********/

    // USB 시리얼 상태 변수
    let _serialConnected: boolean = false
    let _serialRxPin: SerialPin = SerialPin.USB_RX
    let _serialTxPin: SerialPin = SerialPin.USB_TX
    let _serialBaud: BaudRate = BaudRate.BaudRate115200
    let _serialReceivedMsg: string = ""
    let _serialHasMessage: boolean = false
    let _serialParsedValues: string[] = []
    let _lastSentValue: number = -99999

    //% block="Serial start (RX: %rx TX: %tx Baud: %baud )"
    //% rx.defl=SerialPin.USB_RX
    //% tx.defl=SerialPin.USB_TX
    //% baud.defl=BaudRate.BaudRate115200
    //% group="Settings" weight=100
    //% inlineInputMode=inline
    export function serialStart(rx: SerialPin, tx: SerialPin, baud: BaudRate): void {
        _serialRxPin = rx
        _serialTxPin = tx
        _serialBaud = baud
        serial.redirect(tx, rx, baud)
        _serialConnected = true
        basic.pause(100)
    }

    //% block="Serial is connected?"
    //% group="Settings" weight=99
    export function serialIsConnected(): boolean {
        return _serialConnected
    }

    //% block="« %text » send (newline %newline )"
    //% text.defl="Hello"
    //% newline.shadow="toggleYesNo" newline.defl=true
    //% group="Send" weight=98
    //% inlineInputMode=inline
    export function serialSend(text: string, newline: boolean): void {
        if (newline) {
            serial.writeLine(text)
        } else {
            serial.writeString(text)
        }
    }

    //% block="%value send only when changed"
    //% value.defl=0
    //% group="Send" weight=97
    export function serialSendOnChange(value: number): void {
        if (value != _lastSentValue) {
            _lastSentValue = value
            serial.writeLine("" + value)
        }
    }

    //% block="%value send continuously (newline %newline )"
    //% value.defl=0
    //% newline.shadow="toggleYesNo" newline.defl=true
    //% group="Send" weight=96
    //% inlineInputMode=inline
    export function serialSendContinuous(value: number, newline: boolean): void {
        if (newline) {
            serial.writeLine("" + value)
        } else {
            serial.writeString("" + value)
        }
    }

    //% block="CSV send: « %csvData »"
    //% csvData.defl="100,200,300"
    //% group="Send" weight=95
    export function serialSendCSV(csvData: string): void {
        serial.writeLine(csvData)
    }

    //% block="Name: « %name » Value: « %value » send (newline %newline )"
    //% name.defl="LED"
    //% value.defl="ON"
    //% newline.shadow="toggleYesNo" newline.defl=true
    //% group="Send" weight=94
    //% inlineInputMode=inline
    export function serialSendNameValue(name: string, value: string, newline: boolean): void {
        let data = name + ":" + value
        if (newline) {
            serial.writeLine(data)
        } else {
            serial.writeString(data)
        }
    }

    //% block="Serial data receive poll"
    //% group="Receive" weight=93
    export function serialPoll(): void {
        let data = serial.readString()
        if (data.length > 0) {
            _serialReceivedMsg = data
            _serialHasMessage = true
        }
    }

    //% block="New message available?"
    //% group="Receive" weight=92
    export function serialHasMessage(): boolean {
        return _serialHasMessage
    }

    //% block="Received data (string)"
    //% group="Receive" weight=91
    export function serialReadMessage(): string {
        _serialHasMessage = false
        return _serialReceivedMsg
    }

    //% block="Clear received data"
    //% group="Receive" weight=90
    export function serialClearBuffer(): void {
        _serialReceivedMsg = ""
        _serialHasMessage = false
        _serialParsedValues = []
        serial.readString()
    }

    //% block="Parse received data with « %delimiter »"
    //% delimiter.defl=","
    //% group="Parse (Scratch)" weight=89
    export function serialParse(delimiter: string): void {
        _serialParsedValues = _serialReceivedMsg.split(delimiter)
    }

    //% block="%index th parsed value"
    //% index.defl=1 index.min=1
    //% group="Parse (Scratch)" weight=88
    export function serialGetParsedValue(index: number): string {
        if (index < 1 || index > _serialParsedValues.length) {
            return ""
        }
        return _serialParsedValues[index - 1]
    }

    //% block="Parsed value count"
    //% group="Parse (Scratch)" weight=87
    export function serialGetParsedCount(): number {
        return _serialParsedValues.length
    }

    //% block="%index th value from (string: « %text »)"
    //% index.defl=1 index.min=1
    //% text.defl="a,b,c"
    //% group="Parse (Direct)" weight=86
    //% inlineInputMode=inline
    export function serialGetValueFromText(index: number, text: string): string {
        let parts = text.split(",")
        if (index < 1 || index > parts.length) {
            return ""
        }
        return parts[index - 1]
    }

    //% block="Parsed value count (string: « %text »)"
    //% text.defl="a,b,c"
    //% group="Parse (Direct)" weight=85
    export function serialGetCountFromText(text: string): number {
        return text.split(",").length
    }

    //% block="« %text » convert to number"
    //% text.defl="123"
    //% group="Parse (Direct)" weight=84
    export function serialToNumber(text: string): number {
        let num = parseFloat(text)
        return isNaN(num) ? 0 : num
    }
}
