/**
 * BRIXEL Extension - 10. Bluetooth (Web BLE)
 * Compatible with Arduino Web BLE Blocks
 */

//% weight=1030 color=#0079C1 icon="\uf294" block="10. Bluetooth"
//% groups="['Web BLE']"
namespace CommBlue {

    // Web BLE 상태 변수
    let _webBLEConnected: boolean = false
    let _webBLEBuffer: string = ""
    let _webBLELastMsg: string = ""
    let _webBLEMsgReady: boolean = false
    let _webBLEParsedData: string[] = []

    /**
     * Web BLE Setup Name
     * Initialize built-in BLE and set name
     */
    //% block="Web BLE Setup Name %name"
    //% name.defl="Brixel_BLE"
    //% group="Web BLE" weight=100
    export function webBLESetup(name: string): void {
        // 블루투스 UART 서비스 시작
        bluetooth.startUartService()

        // 이름 설정 (Console에서 설정 필요할 수 있음)
        // MakeCode에서는 프로젝트 설정의 이름을 따르는 경우가 많지만, 
        // 여기서 명시적으로 advertise 할 수 있는 방법은 제한적임.
        // 하지만 UART 서비스 시작이 핵심.

        // 연결 이벤트 핸들러
        bluetooth.onBluetoothConnected(function () {
            _webBLEConnected = true
        })

        bluetooth.onBluetoothDisconnected(function () {
            _webBLEConnected = false
        })

        // 데이터 수신 핸들러 (Delimiter: NewLine)
        bluetooth.onUartDataReceived(serial.delimiters(Delimiters.NewLine), function () {
            let data = bluetooth.uartReadUntil(serial.delimiters(Delimiters.NewLine))
            _webBLELastMsg = data
            _webBLEMsgReady = true
        })
    }

    /**
     * Is Web BLE message available?
     */
    //% block="Is Web BLE message available?"
    //% group="Web BLE" weight=99
    export function webBLEAvailable(): boolean {
        return _webBLEMsgReady
    }

    /**
     * Message received via Web BLE
     */
    //% block="Message received via Web BLE"
    //% group="Web BLE" weight=98
    export function webBLERead(): string {
        _webBLEMsgReady = false
        return _webBLELastMsg
    }

    /**
     * Send content via Web BLE
     */
    //% block="Send %content via Web BLE"
    //% group="Web BLE" weight=97
    export function webBLEWrite(content: string): void {
        bluetooth.uartWriteString(content + "\n")
    }

    /**
     * Is Web BLE connected?
     */
    //% block="Is Web BLE connected?"
    //% group="Web BLE" weight=96
    export function webBLEConnected(): boolean {
        return _webBLEConnected
    }

    /**
     * Parse received Web BLE data by delimiter
     */
    //% block="Parse received Web BLE data by %delimiter"
    //% delimiter.defl=","
    //% group="Web BLE" weight=95
    export function webBLEParse(delimiter: string): void {
        _webBLEParsedData = _webBLELastMsg.split(delimiter)
        // 빈 문자열 제거 및 공백 트리밍이 필요하다면 추가 로직 필요
        // 여기서는 단순 split 사용
        _webBLEMsgReady = false
    }

    /**
     * N-th parsed Web BLE value
     */
    //% block="%n -th parsed Web BLE value"
    //% n.defl=1
    //% group="Web BLE" weight=94
    export function webBLEGetValue(n: number): string {
        if (n <= 0 || n > _webBLEParsedData.length) {
            return ""
        }
        return _webBLEParsedData[n - 1]
    }
}
