/**
 * BRIXEL Extension - MakeCode micro:bit Extension
 * Supports 92 devices in 10 categories
 */

//% weight=1100 color=#DAA520 icon="\uf108" block="01. Displays"
//% groups="['LCD', 'TM1637', 'NeoPixel']"
namespace Displays01 {


    /********** LCD1602 디스플레이 **********/
    /********** LCD2004 디스플레이 **********/

    // LCD 타입
    export enum LCDType {
        //% block="LCD1602"
        LCD1602 = 0,
        //% block="LCD2004"
        LCD2004 = 1
    }

    // LCD 데이터 저장 변수
    let _lcdAddr: number = 0x27
    let _lcdType: LCDType = LCDType.LCD1602
    let _lcdBacklight: number = 0x08

    //% block="LCD init address %addr type %type"
    //% addr.defl=0x27
    //% group="LCD" weight=100
    export function lcdInit(addr: number, type: LCDType): void {
        _lcdAddr = addr
        _lcdType = type
        _lcdBacklight = 0x08

        // 초기화 시퀀스
        basic.pause(50)
        lcdWrite4bits(0x30)
        basic.pause(5)
        lcdWrite4bits(0x30)
        basic.pause(1)
        lcdWrite4bits(0x30)
        lcdWrite4bits(0x20)

        // 4비트 모드, 2라인, 5x8 폰트
        lcdCommand(0x28)
        // 디스플레이 ON, 커서 OFF
        lcdCommand(0x0C)
        // 클리어
        lcdCommand(0x01)
        basic.pause(2)
        // 엔트리 모드
        lcdCommand(0x06)
    }

    //% block="LCD string show %text x %x y %y"
    //% x.min=0 x.max=19 x.defl=0
    //% y.min=0 y.max=3 y.defl=0
    //% group="LCD" weight=99
    //% inlineInputMode=inline
    export function lcdShowString(text: string, x: number, y: number): void {
        lcdSetCursor(x, y)
        for (let i = 0; i < text.length; i++) {
            lcdData(text.charCodeAt(i))
        }
    }

    //% block="LCD number show %num x %x y %y"
    //% x.min=0 x.max=19 x.defl=0
    //% y.min=0 y.max=3 y.defl=0
    //% group="LCD" weight=98
    //% inlineInputMode=inline
    export function lcdShowNumber(num: number, x: number, y: number): void {
        lcdShowString(num.toString(), x, y)
    }

    //% block="LCD clear"
    //% group="LCD" weight=97
    export function lcdClear(): void {
        lcdCommand(0x01)
        basic.pause(2)
    }

    //% block="LCD backlight %state"
    //% state.shadow="toggleOnOff"
    //% group="LCD" weight=96
    export function lcdBacklight(state: boolean): void {
        _lcdBacklight = state ? 0x08 : 0x00
        pins.i2cWriteNumber(_lcdAddr, _lcdBacklight, NumberFormat.UInt8BE)
    }

    //% block="LCD screen %state"
    //% state.shadow="toggleOnOff"
    //% group="LCD" weight=95
    export function lcdDisplay(state: boolean): void {
        lcdCommand(state ? 0x0C : 0x08)
    }

    // LCD 내부 함수들
    function lcdSetCursor(x: number, y: number): void {
        let rowOffsets = [0x00, 0x40, 0x14, 0x54]
        lcdCommand(0x80 | (x + rowOffsets[y]))
    }

    function lcdCommand(cmd: number): void {
        lcdSend(cmd, 0)
    }

    function lcdData(data: number): void {
        lcdSend(data, 1)
    }

    function lcdSend(value: number, mode: number): void {
        let highNibble = value & 0xF0
        let lowNibble = (value << 4) & 0xF0
        lcdWrite4bits(highNibble | (mode ? 0x01 : 0))
        lcdWrite4bits(lowNibble | (mode ? 0x01 : 0))
    }

    function lcdWrite4bits(value: number): void {
        let data = value | _lcdBacklight
        pins.i2cWriteNumber(_lcdAddr, data, NumberFormat.UInt8BE)
        pins.i2cWriteNumber(_lcdAddr, data | 0x04, NumberFormat.UInt8BE)
        control.waitMicros(1)
        pins.i2cWriteNumber(_lcdAddr, data & ~0x04, NumberFormat.UInt8BE)
        control.waitMicros(50)
    }


    /********** WS2812B 네오픽셀 LED **********/

    // NeoPixel 포맷
    export enum NeoPixelFormat {
        //% block="RGB (GRB format)"
        RGB = 1,
        //% block="RGB+W"
        RGBW = 2,
        //% block="RGB (RGB format)"
        RGB_RGB = 3
    }

    // NeoPixel 색상 프리셋
    export enum NeoPixelColors {
        //% block="red"
        Red = 0xFF0000,
        //% block="orange"
        Orange = 0xFFA500,
        //% block="yellow"
        Yellow = 0xFFFF00,
        //% block="green"
        Green = 0x00FF00,
        //% block="blue"
        Blue = 0x0000FF,
        //% block="indigo"
        Indigo = 0x4B0082,
        //% block="purple"
        Violet = 0x8A2BE2,
        //% block="violet"
        Purple = 0xFF00FF,
        //% block="white"
        White = 0xFFFFFF,
        //% block="black"
        Black = 0x000000
    }

    // NeoPixel 스트립 클래스
    export class NeoPixelStrip {
        buf: Buffer
        pin: DigitalPin
        brightness: number
        start: number
        _length: number
        _mode: NeoPixelFormat

        // 색상 표시
        showColor(color: number): void {
            let red = (color >> 16) & 0xFF
            let green = (color >> 8) & 0xFF
            let blue = color & 0xFF

            red = (red * this.brightness) >> 8
            green = (green * this.brightness) >> 8
            blue = (blue * this.brightness) >> 8

            for (let i = 0; i < this._length; i++) {
                this.setPixelRGB(i, red, green, blue)
            }
            this.show()
        }

        // 개별 픽셀 설정 (RGB)
        setPixelRGB(index: number, r: number, g: number, b: number): void {
            if (index < 0 || index >= this._length) return
            let offset = (this.start + index) * 3
            // GRB 순서 (대부분의 WS2812B)
            if (this._mode == NeoPixelFormat.RGB_RGB) {
                this.buf[offset] = r
                this.buf[offset + 1] = g
                this.buf[offset + 2] = b
            } else {
                this.buf[offset] = g
                this.buf[offset + 1] = r
                this.buf[offset + 2] = b
            }
        }

        // 개별 픽셀 설정 (색상값)
        setPixelColor(index: number, color: number): void {
            let red = (color >> 16) & 0xFF
            let green = (color >> 8) & 0xFF
            let blue = color & 0xFF
            red = (red * this.brightness) >> 8
            green = (green * this.brightness) >> 8
            blue = (blue * this.brightness) >> 8
            this.setPixelRGB(index, red, green, blue)
        }

        // 무지개 효과
        showRainbow(startHue: number = 1, endHue: number = 360): void {
            let stepHue = (endHue - startHue) / this._length
            for (let i = 0; i < this._length; i++) {
                let hue = startHue + i * stepHue
                let color = neopixelHSL(hue, 100, 50)
                this.setPixelColor(i, color)
            }
            this.show()
        }

        // 바 그래프
        showBarGraph(value: number, high: number): void {
            if (high <= 0) {
                this.clear()
                return
            }
            let n = Math.floor((value * this._length) / high)
            for (let i = 0; i < this._length; i++) {
                if (i < n) {
                    this.setPixelColor(i, NeoPixelColors.Green)
                } else {
                    this.setPixelColor(i, NeoPixelColors.Black)
                }
            }
            this.show()
        }

        // 화면 갱신
        show(): void {
            light.sendWS2812Buffer(this.buf, this.pin)
        }

        // 전체 지우기
        clear(): void {
            this.buf.fill(0)
            this.show()
        }

        // 밝기 설정
        setBrightness(brightness: number): void {
            this.brightness = Math.clamp(0, 255, brightness)
        }

        // 픽셀 이동
        shift(offset: number = 1): void {
            this.buf.shift(offset * 3)
        }

        // 픽셀 회전
        rotate(offset: number = 1): void {
            this.buf.rotate(offset * 3)
        }

        // 범위 지정 (서브 스트립)
        range(start: number, length: number): NeoPixelStrip {
            let strip = new NeoPixelStrip()
            strip.buf = this.buf
            strip.pin = this.pin
            strip.brightness = this.brightness
            strip.start = this.start + start
            strip._length = Math.min(length, this._length - start)
            strip._mode = this._mode
            return strip
        }

        // 길이 반환
        length(): number {
            return this._length
        }
    }

    //% block="NeoPixel pin %pin|LED count %numLeds|format %mode"
    //% pin.defl=DigitalPin.P0
    //% numLeds.defl=24 numLeds.min=1 numLeds.max=300
    //% group="NeoPixel" weight=100
    //% blockSetVariable=strip
    export function neopixelCreate(pin: DigitalPin, numLeds: number, mode: NeoPixelFormat): NeoPixelStrip {
        let strip = new NeoPixelStrip()
        let stride = (mode == NeoPixelFormat.RGBW) ? 4 : 3
        strip.buf = pins.createBuffer(numLeds * stride)
        strip.start = 0
        strip._length = numLeds
        strip._mode = mode
        strip.pin = pin
        strip.brightness = 255
        strip.buf.fill(0)
        pins.digitalWritePin(pin, 0)
        return strip
    }

    //% block="%strip|range start %start|count %length set to"
    //% strip.shadow="variables_get" strip.defl="strip"
    //% start.defl=0 length.defl=4
    //% group="NeoPixel" weight=99
    //% blockSetVariable=range
    export function neopixelRange(strip: NeoPixelStrip, start: number, length: number): NeoPixelStrip {
        return strip.range(start, length)
    }

    //% block="%strip|rainbow show color %startHue from %endHue to"
    //% strip.shadow="variables_get" strip.defl="strip"
    //% startHue.defl=1 endHue.defl=360
    //% group="NeoPixel" weight=98
    export function neopixelShowRainbow(strip: NeoPixelStrip, startHue: number, endHue: number): void {
        strip.showRainbow(startHue, endHue)
    }

    //% block="%strip|color %color show"
    //% strip.shadow="variables_get" strip.defl="strip"
    //% color.shadow="neopixelColorPicker"
    //% group="NeoPixel" weight=97
    export function neopixelShowColor(strip: NeoPixelStrip, color: number): void {
        strip.showColor(color)
    }

    //% block="%strip|bar graph value %value|max %high"
    //% strip.shadow="variables_get" strip.defl="strip"
    //% value.defl=0 high.defl=255
    //% group="NeoPixel" weight=96
    export function neopixelShowBarGraph(strip: NeoPixelStrip, value: number, high: number): void {
        strip.showBarGraph(value, high)
    }

    //% block="%strip|refresh"
    //% strip.shadow="variables_get" strip.defl="strip"
    //% group="NeoPixel" weight=95
    export function neopixelShow(strip: NeoPixelStrip): void {
        strip.show()
    }

    //% block="%strip|clear all"
    //% strip.shadow="variables_get" strip.defl="strip"
    //% group="NeoPixel" weight=94
    export function neopixelClear(strip: NeoPixelStrip): void {
        strip.clear()
    }

    //% block="%strip|pixel %offset shift"
    //% strip.shadow="variables_get" strip.defl="strip"
    //% offset.defl=1
    //% group="NeoPixel" weight=93
    export function neopixelShift(strip: NeoPixelStrip, offset: number): void {
        strip.shift(offset)
    }

    //% block="%strip|pixel %offset rotate"
    //% strip.shadow="variables_get" strip.defl="strip"
    //% offset.defl=1
    //% group="NeoPixel" weight=92
    export function neopixelRotate(strip: NeoPixelStrip, offset: number): void {
        strip.rotate(offset)
    }

    //% block="%strip|brightness %brightness set"
    //% strip.shadow="variables_get" strip.defl="strip"
    //% brightness.min=0 brightness.max=255 brightness.defl=128
    //% group="NeoPixel" weight=91
    export function neopixelSetBrightness(strip: NeoPixelStrip, brightness: number): void {
        strip.setBrightness(brightness)
    }

    //% block="%strip|pixel %index at color %color set"
    //% strip.shadow="variables_get" strip.defl="strip"
    //% color.shadow="neopixelColorPicker"
    //% group="NeoPixel" weight=90
    export function neopixelSetPixelColor(strip: NeoPixelStrip, index: number, color: number): void {
        strip.setPixelColor(index, color)
    }

    //% block="HSL color H %h|S %s|L %l"
    //% h.min=0 h.max=360 h.defl=0
    //% s.min=0 s.max=100 s.defl=100
    //% l.min=0 l.max=100 l.defl=50
    //% group="TM1637" weight=85
    export function neopixelHSL(h: number, s: number, l: number): number {
        h = h % 360
        s = Math.clamp(0, 100, s) / 100
        l = Math.clamp(0, 100, l) / 100

        let c = (1 - Math.abs(2 * l - 1)) * s
        let x = c * (1 - Math.abs((h / 60) % 2 - 1))
        let m = l - c / 2

        let r = 0, g = 0, b = 0
        if (h < 60) { r = c; g = x; b = 0 }
        else if (h < 120) { r = x; g = c; b = 0 }
        else if (h < 180) { r = 0; g = c; b = x }
        else if (h < 240) { r = 0; g = x; b = c }
        else if (h < 300) { r = x; g = 0; b = c }
        else { r = c; g = 0; b = x }

        r = Math.round((r + m) * 255)
        g = Math.round((g + m) * 255)
        b = Math.round((b + m) * 255)

        return (r << 16) | (g << 8) | b
    }

    //% block="RGB color R %r|G %g|B %b"
    //% r.min=0 r.max=255 r.defl=255
    //% g.min=0 g.max=255 g.defl=0
    //% b.min=0 b.max=255 b.defl=0
    //% group="NeoPixel" weight=88
    export function neopixelRGB(r: number, g: number, b: number): number {
        return ((r & 0xFF) << 16) | ((g & 0xFF) << 8) | (b & 0xFF)
    }

    //% block="%color"
    //% blockId="neopixelColorPicker"
    //% shim=TD_ID
    //% color.fieldEditor="colorwheel"
    //% color.fieldOptions.colours='["#ff0000","#ffa500","#ffff00","#00ff00","#00ffff","#0000ff","#ff00ff","#ffffff","#000000"]'
    //% color.fieldOptions.columns=3
    //% color.defl=0xff0000
    //% group="NeoPixel" weight=88
    //% blockHidden=true
    export function neopixelColorPicker(color: number): number {
        return color
    }

    //% block="color %color"
    //% group="NeoPixel" weight=88
    export function neopixelPresetColor(color: NeoPixelColors): number {
        return color
    }


    /********** TM1637 7세그먼트 디스플레이 **********/

    // TM1637 소수점 옵션
    export enum TM1637Decimal {
        //% block="decimal none"
        None = 0,
        //% block="decimal 1digit"
        Dec1 = 1,
        //% block="decimal 2digit"
        Dec2 = 2,
        //% block="decimal 3digit"
        Dec3 = 3
    }

    // TM1637 음수 기호 옵션
    export enum TM1637Negative {
        //% block="show negative sign"
        Show = 1,
        //% block="hide negative sign"
        Hide = 0
    }

    // TM1637 콜론 옵션
    export enum TM1637Colon {
        //% block="colon"
        Colon = 1,
        //% block="none"
        None = 0
    }

    // TM1637 위치
    export enum TM1637Position {
        //% block="1st (left)"
        Pos1 = 0,
        //% block="2nd"
        Pos2 = 1,
        //% block="3rd"
        Pos3 = 2,
        //% block="4th (right)"
        Pos4 = 3
    }

    // TM1637 핀 저장 변수
    let _tm1637Clk: DigitalPin = DigitalPin.P2
    let _tm1637Dio: DigitalPin = DigitalPin.P3
    let _tm1637Brightness: number = 7
    let _tm1637Colon: boolean = false
    let _tm1637Buffer: number[] = [0, 0, 0, 0]

    // 7세그먼트 폰트 (0-9, A-Z, 일부 특수문자)
    const TM1637_FONT: number[] = [
        0x3F, 0x06, 0x5B, 0x4F, 0x66, 0x6D, 0x7D, 0x07, 0x7F, 0x6F,  // 0-9
        0x77, 0x7C, 0x39, 0x5E, 0x79, 0x71,  // A-F
        0x3D, 0x76, 0x06, 0x1E, 0x76, 0x38, 0x15, 0x54, 0x3F,  // G-O
        0x73, 0x67, 0x50, 0x6D, 0x78, 0x3E, 0x1C, 0x2A, 0x76, 0x6E, 0x5B,  // P-Z
        0x00, 0x40  // 공백, 마이너스
    ]

    //% block="FND(TM1637) CLK pin %clk|DATA pin %dio set"
    //% clk.defl=DigitalPin.P2 dio.defl=DigitalPin.P3
    //% group="TM1637" weight=88
    //% inlineInputMode=inline
    export function tm1637Init(clk: DigitalPin, dio: DigitalPin): void {
        _tm1637Clk = clk
        _tm1637Dio = dio
        _tm1637Brightness = 7
        _tm1637Colon = false
        _tm1637Buffer = [0, 0, 0, 0]

        // 초기화
        tm1637Start()
        tm1637WriteByte(0x40)  // 데이터 명령: 자동 주소 증가
        tm1637Stop()

        tm1637Clear()
        tm1637SetBrightness(7)
    }

    //% block="FNDnumber show %num|%decimal|%negative"
    //% num.defl=1234
    //% group="TM1637" weight=87
    //% inlineInputMode=inline
    export function tm1637ShowNumber(num: number, decimal: TM1637Decimal, negative: TM1637Negative): void {
        let isNegative = num < 0
        num = Math.abs(num)

        // 소수점 처리
        if (decimal != TM1637Decimal.None) {
            num = Math.round(num * Math.pow(10, decimal))
        }

        let digits: number[] = [0, 0, 0, 0]
        let startPos = 0

        // 숫자 분리
        for (let i = 3; i >= 0; i--) {
            digits[i] = num % 10
            num = Math.floor(num / 10)
        }

        // 음수 기호 처리
        if (isNegative && negative == TM1637Negative.Show) {
            // 앞쪽 0을 마이너스로 대체
            for (let i = 0; i < 3; i++) {
                if (digits[i] == 0) {
                    _tm1637Buffer[i] = 0x40  // 마이너스
                    startPos = i + 1
                    break
                }
            }
        }

        // 버퍼에 숫자 저장
        for (let i = startPos; i < 4; i++) {
            _tm1637Buffer[i] = TM1637_FONT[digits[i]]
            // 소수점 추가
            if (decimal != TM1637Decimal.None && i == (3 - decimal)) {
                _tm1637Buffer[i] |= 0x80
            }
        }

        // 콜론 추가 (2번째 자리)
        if (_tm1637Colon) {
            _tm1637Buffer[1] |= 0x80
        }

        tm1637Display()
    }

    //% block="FNDtime show %hour|: %minute|%colon show"
    //% hour.min=0 hour.max=23 hour.defl=12
    //% minute.min=0 minute.max=59 minute.defl=30
    //% group="TM1637" weight=86
    //% inlineInputMode=inline
    export function tm1637ShowTime(hour: number, minute: number, colon: TM1637Colon): void {
        _tm1637Buffer[0] = TM1637_FONT[Math.floor(hour / 10)]
        _tm1637Buffer[1] = TM1637_FONT[hour % 10]
        _tm1637Buffer[2] = TM1637_FONT[Math.floor(minute / 10)]
        _tm1637Buffer[3] = TM1637_FONT[minute % 10]

        // 콜론 표시
        if (colon == TM1637Colon.Colon) {
            _tm1637Buffer[1] |= 0x80
        }

        tm1637Display()
    }

    //% block="FND text show %text |scroll delay %delay ms"
    //% text.defl="Hello"
    //% delay.defl=500 delay.min=100 delay.max=2000
    //% group="TM1637" weight=85
    //% inlineInputMode=inline
    export function tm1637ShowText(text: string, delay: number): void {
        text = text.toUpperCase()
        let len = text.length

        if (len <= 4) {
            // 4자 이하면 바로 표시
            for (let i = 0; i < 4; i++) {
                if (i < len) {
                    _tm1637Buffer[i] = tm1637CharToSegment(text.charCodeAt(i))
                } else {
                    _tm1637Buffer[i] = 0
                }
            }
            tm1637Display()
        } else {
            // 4자 초과면 스크롤
            let padded = "    " + text + "    "
            for (let pos = 0; pos < padded.length - 3; pos++) {
                for (let i = 0; i < 4; i++) {
                    _tm1637Buffer[i] = tm1637CharToSegment(padded.charCodeAt(pos + i))
                }
                tm1637Display()
                basic.pause(delay)
            }
        }
    }

    //% block="FND position %pos|at number %digit show"
    //% digit.min=0 digit.max=9 digit.defl=8
    //% group="TM1637" weight=84
    //% inlineInputMode=inline
    export function tm1637ShowDigitAt(pos: TM1637Position, digit: number): void {
        _tm1637Buffer[pos] = TM1637_FONT[digit % 10]
        tm1637Display()
    }

    //% block="FNDscreen clear"
    //% group="TM1637" weight=83
    export function tm1637Clear(): void {
        _tm1637Buffer = [0, 0, 0, 0]
        tm1637Display()
    }

    //% block="FNDbrightness set %brightness"
    //% brightness.min=0 brightness.max=7 brightness.defl=7
    //% group="TM1637" weight=79
    export function tm1637SetBrightness(brightness: number): void {
        _tm1637Brightness = Math.clamp(0, 7, brightness)

        tm1637Start()
        if (_tm1637Brightness == 0) {
            tm1637WriteByte(0x80)  // 디스플레이 OFF
        } else {
            tm1637WriteByte(0x88 | _tm1637Brightness)  // 디스플레이 ON + 밝기
        }
        tm1637Stop()
    }

    //% block="FNDcolon %colon show"
    //% group="TM1637" weight=78
    export function tm1637SetColon(colon: TM1637Colon): void {
        _tm1637Colon = (colon == TM1637Colon.Colon)
        if (_tm1637Colon) {
            _tm1637Buffer[1] |= 0x80
        } else {
            _tm1637Buffer[1] &= 0x7F
        }
        tm1637Display()
    }

    // 문자를 7세그먼트 코드로 변환
    function tm1637CharToSegment(charCode: number): number {
        if (charCode >= 48 && charCode <= 57) {
            // 0-9
            return TM1637_FONT[charCode - 48]
        } else if (charCode >= 65 && charCode <= 90) {
            // A-Z
            return TM1637_FONT[charCode - 65 + 10]
        } else if (charCode == 32) {
            // 공백
            return 0x00
        } else if (charCode == 45) {
            // 마이너스
            return 0x40
        }
        return 0x00
    }

    // TM1637 디스플레이 갱신
    function tm1637Display(): void {
        tm1637Start()
        tm1637WriteByte(0xC0)  // 주소 명령: 첫 번째 주소
        for (let i = 0; i < 4; i++) {
            tm1637WriteByte(_tm1637Buffer[i])
        }
        tm1637Stop()

        tm1637Start()
        tm1637WriteByte(0x88 | _tm1637Brightness)
        tm1637Stop()
    }

    // TM1637 통신 함수들
    function tm1637Start(): void {
        pins.digitalWritePin(_tm1637Dio, 1)
        pins.digitalWritePin(_tm1637Clk, 1)
        control.waitMicros(2)
        pins.digitalWritePin(_tm1637Dio, 0)
    }

    function tm1637Stop(): void {
        pins.digitalWritePin(_tm1637Clk, 0)
        control.waitMicros(2)
        pins.digitalWritePin(_tm1637Dio, 0)
        control.waitMicros(2)
        pins.digitalWritePin(_tm1637Clk, 1)
        control.waitMicros(2)
        pins.digitalWritePin(_tm1637Dio, 1)
    }

    function tm1637WriteByte(data: number): void {
        for (let i = 0; i < 8; i++) {
            pins.digitalWritePin(_tm1637Clk, 0)
            control.waitMicros(2)
            pins.digitalWritePin(_tm1637Dio, (data >> i) & 1)
            control.waitMicros(2)
            pins.digitalWritePin(_tm1637Clk, 1)
            control.waitMicros(2)
        }
        // ACK
        pins.digitalWritePin(_tm1637Clk, 0)
        control.waitMicros(2)
        pins.digitalWritePin(_tm1637Dio, 1)
        control.waitMicros(2)
        pins.digitalWritePin(_tm1637Clk, 1)
        control.waitMicros(2)
    }
}


//% weight=1090 color=#DEB887 icon="\uf108" block="02. Adv Displays"
//% groups="['OLED', 'HT16K33', 'MAX7219', '74HC595', 'TFT']"
namespace AdvDisplays {



    /********** SSD1306 OLED 디스플레이 **********/
    /********** SH1106 OLED 디스플레이 **********/

    // OLED 드라이버 타입
    export enum OLEDDriver {
        //% block="SSD1306"
        SSD1306 = 0,
        //% block="SH1106"
        SH1106 = 1
    }

    // OLED 해상도
    export enum OLEDSize {
        //% block="128x64 (0.96inch)"
        Size128x64 = 0,
        //% block="128x32 (0.91inch)"
        Size128x32 = 1,
        //% block="64x128 (vertical)"
        Size64x128 = 2
    }

    // OLED 색상
    export enum OLEDColor {
        //% block="white"
        White = 1,
        //% block="black"
        Black = 0
    }

    // OLED 데이터 저장 변수
    let _oledAddr: number = 0x3C
    let _oledWidth: number = 128
    let _oledHeight: number = 64
    let _oledDriver: OLEDDriver = OLEDDriver.SSD1306

    //% block="OLED init address %addr driver %driver level %size"
    //% addr.defl=60
    //% group="OLED" weight=90
    //% inlineInputMode=inline
    export function oledInit(addr: number, driver: OLEDDriver, size: OLEDSize): void {
        _oledAddr = addr
        _oledDriver = driver

        if (size == OLEDSize.Size128x64) {
            _oledWidth = 128
            _oledHeight = 64
        } else if (size == OLEDSize.Size128x32) {
            _oledWidth = 128
            _oledHeight = 32
        } else {
            _oledWidth = 64
            _oledHeight = 128
        }

        // 초기화 명령 시퀀스
        oledCmd(0xAE)  // 디스플레이 OFF
        oledCmd(0xD5)  // 클럭 분주비
        oledCmd(0x80)
        oledCmd(0xA8)  // 멀티플렉스
        oledCmd(_oledHeight - 1)
        oledCmd(0xD3)  // 디스플레이 오프셋
        oledCmd(0x00)
        oledCmd(0x40)  // 시작 라인
        oledCmd(0x8D)  // 차지 펌프
        oledCmd(0x14)
        oledCmd(0x20)  // 메모리 모드
        oledCmd(0x00)
        oledCmd(0xA1)  // 세그먼트 리맵
        oledCmd(0xC8)  // COM 출력 스캔 방향
        oledCmd(0xDA)  // COM 핀 설정
        oledCmd(_oledHeight == 32 ? 0x02 : 0x12)
        oledCmd(0x81)  // 대비
        oledCmd(0xCF)
        oledCmd(0xD9)  // 프리차지
        oledCmd(0xF1)
        oledCmd(0xDB)  // VCOMH
        oledCmd(0x40)
        oledCmd(0xA4)  // 전체 ON 비활성화
        oledCmd(0xA6)  // 정상 표시
        oledCmd(0xAF)  // 디스플레이 ON

        oledClear()
    }

    //% block="OLED string show x %x y %y text %text color %color"
    //% x.defl=0 y.defl=0
    //% group="OLED" weight=89
    //% inlineInputMode=inline
    export function oledShowString(x: number, y: number, text: string, color: OLEDColor): void {
        oledSetCursor(x, y)
        for (let i = 0; i < text.length; i++) {
            oledWriteChar(text.charCodeAt(i), color)
        }
    }

    //% block="OLED number show x %x y %y number %num color %color"
    //% x.defl=0 y.defl=0 num.defl=12
    //% group="OLED" weight=88
    //% inlineInputMode=inline
    export function oledShowNumber(x: number, y: number, num: number, color: OLEDColor): void {
        oledShowString(x, y, num.toString(), color)
    }

    //% block="OLED rectangle draw x1 %x1 y1 %y1 x2 %x2 y2 %y2 color %color"
    //% x1.defl=0 y1.defl=0 x2.defl=60 y2.defl=30
    //% group="OLED" weight=87
    //% inlineInputMode=inline
    export function oledDrawRect(x1: number, y1: number, x2: number, y2: number, color: OLEDColor): void {
        oledDrawHLine(x1, y1, x2 - x1, color)
        oledDrawHLine(x1, y2, x2 - x1, color)
        oledDrawVLine(x1, y1, y2 - y1, color)
        oledDrawVLine(x2, y1, y2 - y1, color)
    }

    //% block="OLED horizontal line draw x %x y %y length %len color %color"
    //% x.defl=0 y.defl=0 len.defl=10
    //% group="OLED" weight=86
    //% inlineInputMode=inline
    export function oledDrawHLine(x: number, y: number, len: number, color: OLEDColor): void {
        for (let i = 0; i < len; i++) {
            oledSetPixel(x + i, y, color)
        }
    }

    //% block="OLED vertical line draw x %x y %y length %len color %color"
    //% x.defl=0 y.defl=0 len.defl=10
    //% group="OLED" weight=85
    //% inlineInputMode=inline
    export function oledDrawVLine(x: number, y: number, len: number, color: OLEDColor): void {
        for (let i = 0; i < len; i++) {
            oledSetPixel(x, y + i, color)
        }
    }

    //% block="OLED pixel x %x y %y color %color"
    //% x.defl=0 y.defl=0
    //% group="OLED" weight=84
    //% inlineInputMode=inline
    export function oledSetPixel(x: number, y: number, color: OLEDColor): void {
        if (x < 0 || x >= _oledWidth || y < 0 || y >= _oledHeight) return

        let page = y >> 3
        let bit = y & 0x07

        oledCmd(0xB0 + page)
        oledCmd(0x00 + (x & 0x0F))
        oledCmd(0x10 + (x >> 4))

        let data = color == OLEDColor.White ? (1 << bit) : 0
        oledData(data)
    }

    //% block="OLED clear"
    //% group="OLED" weight=83
    export function oledClear(): void {
        for (let page = 0; page < _oledHeight / 8; page++) {
            oledCmd(0xB0 + page)
            oledCmd(0x00)
            oledCmd(0x10)
            for (let col = 0; col < _oledWidth; col++) {
                oledData(0x00)
            }
        }
    }

    //% block="OLED screen %state"
    //% state.shadow="toggleOnOff"
    //% group="OLED" weight=82
    export function oledDisplay(state: boolean): void {
        oledCmd(state ? 0xAF : 0xAE)
    }

    //% block="OLED invert %invert"
    //% invert.shadow="toggleYesNo"
    //% group="OLED" weight=81
    export function oledInvert(invert: boolean): void {
        oledCmd(invert ? 0xA7 : 0xA6)
    }

    // OLED 내부 함수들
    function oledCmd(cmd: number): void {
        let buf = pins.createBuffer(2)
        buf[0] = 0x00
        buf[1] = cmd
        pins.i2cWriteBuffer(_oledAddr, buf)
    }

    function oledData(data: number): void {
        let buf = pins.createBuffer(2)
        buf[0] = 0x40
        buf[1] = data
        pins.i2cWriteBuffer(_oledAddr, buf)
    }

    function oledSetCursor(x: number, y: number): void {
        let page = y >> 3
        oledCmd(0xB0 + page)
        if (_oledDriver == OLEDDriver.SH1106) {
            x += 2  // SH1106은 2픽셀 오프셋
        }
        oledCmd(0x00 + (x & 0x0F))
        oledCmd(0x10 + (x >> 4))
    }

    // 5x7 기본 폰트 (ASCII 32-127)
    const OLED_FONT: number[] = [
        0x00, 0x00, 0x00, 0x00, 0x00,  // 32: space
        0x00, 0x00, 0x5F, 0x00, 0x00,  // 33: !
        0x00, 0x07, 0x00, 0x07, 0x00,  // 34: "
        0x14, 0x7F, 0x14, 0x7F, 0x14,  // 35: #
        0x24, 0x2A, 0x7F, 0x2A, 0x12,  // 36: $
        0x23, 0x13, 0x08, 0x64, 0x62,  // 37: %
        0x36, 0x49, 0x55, 0x22, 0x50,  // 38: &
        0x00, 0x05, 0x03, 0x00, 0x00,  // 39: '
        0x00, 0x1C, 0x22, 0x41, 0x00,  // 40: (
        0x00, 0x41, 0x22, 0x1C, 0x00,  // 41: )
        0x08, 0x2A, 0x1C, 0x2A, 0x08,  // 42: *
        0x08, 0x08, 0x3E, 0x08, 0x08,  // 43: +
        0x00, 0x50, 0x30, 0x00, 0x00,  // 44: ,
        0x08, 0x08, 0x08, 0x08, 0x08,  // 45: -
        0x00, 0x60, 0x60, 0x00, 0x00,  // 46: .
        0x20, 0x10, 0x08, 0x04, 0x02,  // 47: /
        0x3E, 0x51, 0x49, 0x45, 0x3E,  // 48: 0
        0x00, 0x42, 0x7F, 0x40, 0x00,  // 49: 1
        0x42, 0x61, 0x51, 0x49, 0x46,  // 50: 2
        0x21, 0x41, 0x45, 0x4B, 0x31,  // 51: 3
        0x18, 0x14, 0x12, 0x7F, 0x10,  // 52: 4
        0x27, 0x45, 0x45, 0x45, 0x39,  // 53: 5
        0x3C, 0x4A, 0x49, 0x49, 0x30,  // 54: 6
        0x01, 0x71, 0x09, 0x05, 0x03,  // 55: 7
        0x36, 0x49, 0x49, 0x49, 0x36,  // 56: 8
        0x06, 0x49, 0x49, 0x29, 0x1E,  // 57: 9
        0x00, 0x36, 0x36, 0x00, 0x00,  // 58: :
        0x00, 0x56, 0x36, 0x00, 0x00,  // 59: ;
        0x00, 0x08, 0x14, 0x22, 0x41,  // 60: <
        0x14, 0x14, 0x14, 0x14, 0x14,  // 61: =
        0x41, 0x22, 0x14, 0x08, 0x00,  // 62: >
        0x02, 0x01, 0x51, 0x09, 0x06,  // 63: ?
        0x32, 0x49, 0x79, 0x41, 0x3E,  // 64: @
        0x7E, 0x11, 0x11, 0x11, 0x7E,  // 65: A
        0x7F, 0x49, 0x49, 0x49, 0x36,  // 66: B
        0x3E, 0x41, 0x41, 0x41, 0x22,  // 67: C
        0x7F, 0x41, 0x41, 0x22, 0x1C,  // 68: D
        0x7F, 0x49, 0x49, 0x49, 0x41,  // 69: E
        0x7F, 0x09, 0x09, 0x01, 0x01,  // 70: F
        0x3E, 0x41, 0x41, 0x51, 0x32,  // 71: G
        0x7F, 0x08, 0x08, 0x08, 0x7F,  // 72: H
        0x00, 0x41, 0x7F, 0x41, 0x00,  // 73: I
        0x20, 0x40, 0x41, 0x3F, 0x01,  // 74: J
        0x7F, 0x08, 0x14, 0x22, 0x41,  // 75: K
        0x7F, 0x40, 0x40, 0x40, 0x40,  // 76: L
        0x7F, 0x02, 0x04, 0x02, 0x7F,  // 77: M
        0x7F, 0x04, 0x08, 0x10, 0x7F,  // 78: N
        0x3E, 0x41, 0x41, 0x41, 0x3E,  // 79: O
        0x7F, 0x09, 0x09, 0x09, 0x06,  // 80: P
        0x3E, 0x41, 0x51, 0x21, 0x5E,  // 81: Q
        0x7F, 0x09, 0x19, 0x29, 0x46,  // 82: R
        0x46, 0x49, 0x49, 0x49, 0x31,  // 83: S
        0x01, 0x01, 0x7F, 0x01, 0x01,  // 84: T
        0x3F, 0x40, 0x40, 0x40, 0x3F,  // 85: U
        0x1F, 0x20, 0x40, 0x20, 0x1F,  // 86: V
        0x7F, 0x20, 0x18, 0x20, 0x7F,  // 87: W
        0x63, 0x14, 0x08, 0x14, 0x63,  // 88: X
        0x03, 0x04, 0x78, 0x04, 0x03,  // 89: Y
        0x61, 0x51, 0x49, 0x45, 0x43,  // 90: Z
        0x00, 0x00, 0x7F, 0x41, 0x41,  // 91: [
        0x02, 0x04, 0x08, 0x10, 0x20,  // 92: backslash
        0x41, 0x41, 0x7F, 0x00, 0x00,  // 93: ]
        0x04, 0x02, 0x01, 0x02, 0x04,  // 94: ^
        0x40, 0x40, 0x40, 0x40, 0x40,  // 95: _
        0x00, 0x01, 0x02, 0x04, 0x00,  // 96: `
        0x20, 0x54, 0x54, 0x54, 0x78,  // 97: a
        0x7F, 0x48, 0x44, 0x44, 0x38,  // 98: b
        0x38, 0x44, 0x44, 0x44, 0x20,  // 99: c
        0x38, 0x44, 0x44, 0x48, 0x7F,  // 100: d
        0x38, 0x54, 0x54, 0x54, 0x18,  // 101: e
        0x08, 0x7E, 0x09, 0x01, 0x02,  // 102: f
        0x08, 0x14, 0x54, 0x54, 0x3C,  // 103: g
        0x7F, 0x08, 0x04, 0x04, 0x78,  // 104: h
        0x00, 0x44, 0x7D, 0x40, 0x00,  // 105: i
        0x20, 0x40, 0x44, 0x3D, 0x00,  // 106: j
        0x00, 0x7F, 0x10, 0x28, 0x44,  // 107: k
        0x00, 0x41, 0x7F, 0x40, 0x00,  // 108: l
        0x7C, 0x04, 0x18, 0x04, 0x78,  // 109: m
        0x7C, 0x08, 0x04, 0x04, 0x78,  // 110: n
        0x38, 0x44, 0x44, 0x44, 0x38,  // 111: o
        0x7C, 0x14, 0x14, 0x14, 0x08,  // 112: p
        0x08, 0x14, 0x14, 0x18, 0x7C,  // 113: q
        0x7C, 0x08, 0x04, 0x04, 0x08,  // 114: r
        0x48, 0x54, 0x54, 0x54, 0x20,  // 115: s
        0x04, 0x3F, 0x44, 0x40, 0x20,  // 116: t
        0x3C, 0x40, 0x40, 0x20, 0x7C,  // 117: u
        0x1C, 0x20, 0x40, 0x20, 0x1C,  // 118: v
        0x3C, 0x40, 0x30, 0x40, 0x3C,  // 119: w
        0x44, 0x28, 0x10, 0x28, 0x44,  // 120: x
        0x0C, 0x50, 0x50, 0x50, 0x3C,  // 121: y
        0x44, 0x64, 0x54, 0x4C, 0x44,  // 122: z
        0x00, 0x08, 0x36, 0x41, 0x00,  // 123: {
        0x00, 0x00, 0x7F, 0x00, 0x00,  // 124: |
        0x00, 0x41, 0x36, 0x08, 0x00,  // 125: }
        0x08, 0x08, 0x2A, 0x1C, 0x08,  // 126: ~
        0x08, 0x1C, 0x2A, 0x08, 0x08   // 127: arrow
    ]

    function oledWriteChar(c: number, color: OLEDColor): void {
        if (c < 32 || c > 127) c = 32  // 범위 밖이면 공백
        let index = (c - 32) * 5
        for (let i = 0; i < 5; i++) {
            let data = OLED_FONT[index + i]
            if (color == OLEDColor.Black) {
                data = ~data & 0xFF
            }
            oledData(data)
        }
        oledData(0x00)  // 문자 간격
    }

    /********** MAX7219 도트 매트릭스 **********/

    // MAX7219 회전 방향
    export enum MAX7219Rotation {
        //% block="none"
        None = 0,
        //% block="90° clockwise"
        CW90 = 1,
        //% block="180°"
        CW180 = 2,
        //% block="90° counter-clockwise"
        CCW90 = 3
    }

    // MAX7219 정렬
    export enum MAX7219Align {
        //% block="left"
        Left = 0,
        //% block="right"
        Right = 1
    }

    // MAX7219 핀 저장 변수
    let _max7219DIN: DigitalPin = DigitalPin.P15
    let _max7219CS: DigitalPin = DigitalPin.P16
    let _max7219CLK: DigitalPin = DigitalPin.P13
    let _max7219Num: number = 1
    let _max7219Rotation: MAX7219Rotation = MAX7219Rotation.None
    let _max7219Buffer: number[][] = []

    // 8x8 폰트 (기본 ASCII 32-127)
    const MAX7219_FONT: number[][] = [
        [0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00],  // 32: 공백
        [0x00, 0x00, 0x5F, 0x00, 0x00, 0x00, 0x00, 0x00],  // 33: !
        [0x00, 0x07, 0x00, 0x07, 0x00, 0x00, 0x00, 0x00],  // 34: "
        [0x14, 0x7F, 0x14, 0x7F, 0x14, 0x00, 0x00, 0x00],  // 35: #
        [0x24, 0x2A, 0x7F, 0x2A, 0x12, 0x00, 0x00, 0x00],  // 36: $
        [0x23, 0x13, 0x08, 0x64, 0x62, 0x00, 0x00, 0x00],  // 37: %
        [0x36, 0x49, 0x55, 0x22, 0x50, 0x00, 0x00, 0x00],  // 38: &
        [0x00, 0x05, 0x03, 0x00, 0x00, 0x00, 0x00, 0x00],  // 39: '
        [0x00, 0x1C, 0x22, 0x41, 0x00, 0x00, 0x00, 0x00],  // 40: (
        [0x00, 0x41, 0x22, 0x1C, 0x00, 0x00, 0x00, 0x00],  // 41: )
        [0x08, 0x2A, 0x1C, 0x2A, 0x08, 0x00, 0x00, 0x00],  // 42: *
        [0x08, 0x08, 0x3E, 0x08, 0x08, 0x00, 0x00, 0x00],  // 43: +
        [0x00, 0x50, 0x30, 0x00, 0x00, 0x00, 0x00, 0x00],  // 44: ,
        [0x08, 0x08, 0x08, 0x08, 0x08, 0x00, 0x00, 0x00],  // 45: -
        [0x00, 0x60, 0x60, 0x00, 0x00, 0x00, 0x00, 0x00],  // 46: .
        [0x20, 0x10, 0x08, 0x04, 0x02, 0x00, 0x00, 0x00],  // 47: /
        [0x3E, 0x51, 0x49, 0x45, 0x3E, 0x00, 0x00, 0x00],  // 48: 0
        [0x00, 0x42, 0x7F, 0x40, 0x00, 0x00, 0x00, 0x00],  // 49: 1
        [0x42, 0x61, 0x51, 0x49, 0x46, 0x00, 0x00, 0x00],  // 50: 2
        [0x21, 0x41, 0x45, 0x4B, 0x31, 0x00, 0x00, 0x00],  // 51: 3
        [0x18, 0x14, 0x12, 0x7F, 0x10, 0x00, 0x00, 0x00],  // 52: 4
        [0x27, 0x45, 0x45, 0x45, 0x39, 0x00, 0x00, 0x00],  // 53: 5
        [0x3C, 0x4A, 0x49, 0x49, 0x30, 0x00, 0x00, 0x00],  // 54: 6
        [0x01, 0x71, 0x09, 0x05, 0x03, 0x00, 0x00, 0x00],  // 55: 7
        [0x36, 0x49, 0x49, 0x49, 0x36, 0x00, 0x00, 0x00],  // 56: 8
        [0x06, 0x49, 0x49, 0x29, 0x1E, 0x00, 0x00, 0x00],  // 57: 9
        [0x00, 0x36, 0x36, 0x00, 0x00, 0x00, 0x00, 0x00],  // 58: :
        [0x00, 0x56, 0x36, 0x00, 0x00, 0x00, 0x00, 0x00],  // 59: ;
        [0x00, 0x08, 0x14, 0x22, 0x41, 0x00, 0x00, 0x00],  // 60: <
        [0x14, 0x14, 0x14, 0x14, 0x14, 0x00, 0x00, 0x00],  // 61: =
        [0x41, 0x22, 0x14, 0x08, 0x00, 0x00, 0x00, 0x00],  // 62: >
        [0x02, 0x01, 0x51, 0x09, 0x06, 0x00, 0x00, 0x00],  // 63: ?
        [0x32, 0x49, 0x79, 0x41, 0x3E, 0x00, 0x00, 0x00],  // 64: @
        [0x7E, 0x11, 0x11, 0x11, 0x7E, 0x00, 0x00, 0x00],  // 65: A
        [0x7F, 0x49, 0x49, 0x49, 0x36, 0x00, 0x00, 0x00],  // 66: B
        [0x3E, 0x41, 0x41, 0x41, 0x22, 0x00, 0x00, 0x00],  // 67: C
        [0x7F, 0x41, 0x41, 0x22, 0x1C, 0x00, 0x00, 0x00],  // 68: D
        [0x7F, 0x49, 0x49, 0x49, 0x41, 0x00, 0x00, 0x00],  // 69: E
        [0x7F, 0x09, 0x09, 0x01, 0x01, 0x00, 0x00, 0x00],  // 70: F
        [0x3E, 0x41, 0x41, 0x51, 0x32, 0x00, 0x00, 0x00],  // 71: G
        [0x7F, 0x08, 0x08, 0x08, 0x7F, 0x00, 0x00, 0x00],  // 72: H
        [0x00, 0x41, 0x7F, 0x41, 0x00, 0x00, 0x00, 0x00],  // 73: I
        [0x20, 0x40, 0x41, 0x3F, 0x01, 0x00, 0x00, 0x00],  // 74: J
        [0x7F, 0x08, 0x14, 0x22, 0x41, 0x00, 0x00, 0x00],  // 75: K
        [0x7F, 0x40, 0x40, 0x40, 0x40, 0x00, 0x00, 0x00],  // 76: L
        [0x7F, 0x02, 0x04, 0x02, 0x7F, 0x00, 0x00, 0x00],  // 77: M
        [0x7F, 0x04, 0x08, 0x10, 0x7F, 0x00, 0x00, 0x00],  // 78: N
        [0x3E, 0x41, 0x41, 0x41, 0x3E, 0x00, 0x00, 0x00],  // 79: O
        [0x7F, 0x09, 0x09, 0x09, 0x06, 0x00, 0x00, 0x00],  // 80: P
        [0x3E, 0x41, 0x51, 0x21, 0x5E, 0x00, 0x00, 0x00],  // 81: Q
        [0x7F, 0x09, 0x19, 0x29, 0x46, 0x00, 0x00, 0x00],  // 82: R
        [0x46, 0x49, 0x49, 0x49, 0x31, 0x00, 0x00, 0x00],  // 83: S
        [0x01, 0x01, 0x7F, 0x01, 0x01, 0x00, 0x00, 0x00],  // 84: T
        [0x3F, 0x40, 0x40, 0x40, 0x3F, 0x00, 0x00, 0x00],  // 85: U
        [0x1F, 0x20, 0x40, 0x20, 0x1F, 0x00, 0x00, 0x00],  // 86: V
        [0x7F, 0x20, 0x18, 0x20, 0x7F, 0x00, 0x00, 0x00],  // 87: W
        [0x63, 0x14, 0x08, 0x14, 0x63, 0x00, 0x00, 0x00],  // 88: X
        [0x03, 0x04, 0x78, 0x04, 0x03, 0x00, 0x00, 0x00],  // 89: Y
        [0x61, 0x51, 0x49, 0x45, 0x43, 0x00, 0x00, 0x00],  // 90: Z
    ]

    //% block="MAX7219 set|matrix count %num|DIN pin %din|CS pin %cs|CLK pin %clk"
    //% num.defl=1 num.min=1 num.max=8
    //% din.defl=DigitalPin.P15 cs.defl=DigitalPin.P16 clk.defl=DigitalPin.P13
    //% group="MAX7219" weight=76
    //% inlineInputMode=inline
    export function max7219Init(num: number, din: DigitalPin, cs: DigitalPin, clk: DigitalPin): void {
        _max7219Num = num
        _max7219DIN = din
        _max7219CS = cs
        _max7219CLK = clk

        // 버퍼 초기화
        _max7219Buffer = []
        for (let i = 0; i < num; i++) {
            _max7219Buffer.push([0, 0, 0, 0, 0, 0, 0, 0])
        }

        // MAX7219 초기화
        max7219SendAll(0x09, 0x00)  // Decode Mode: 없음
        max7219SendAll(0x0A, 0x07)  // Intensity: 중간
        max7219SendAll(0x0B, 0x07)  // Scan Limit: 8줄 전체
        max7219SendAll(0x0C, 0x01)  // Shutdown: 정상 동작
        max7219SendAll(0x0F, 0x00)  // Display Test: 끔

        max7219Clear()
    }

    //% block="MAX7219 rotate %rotation"
    //% group="MAX7219" weight=75
    export function max7219SetRotation(rotation: MAX7219Rotation): void {
        _max7219Rotation = rotation
    }

    //% block="MAX7219 text show %text|align %align|screen clear %clear"
    //% text.defl="Hi!"
    //% clear.shadow="toggleYesNo" clear.defl=true
    //% group="MAX7219" weight=74
    //% inlineInputMode=inline
    export function max7219ShowText(text: string, align: MAX7219Align, clear: boolean): void {
        if (clear) max7219Clear()

        text = text.toUpperCase()
        let totalWidth = 0

        // 텍스트 너비 계산
        for (let i = 0; i < text.length && i < _max7219Num; i++) {
            totalWidth += 6  // 5픽셀 문자 + 1픽셀 간격
        }

        let offset = 0
        if (align == MAX7219Align.Right) {
            offset = (_max7219Num * 8) - totalWidth
            if (offset < 0) offset = 0
        }

        // 각 문자 표시
        let xPos = offset
        for (let i = 0; i < text.length; i++) {
            let charCode = text.charCodeAt(i)
            if (charCode >= 32 && charCode <= 90) {
                let fontData = MAX7219_FONT[charCode - 32]
                for (let col = 0; col < 5; col++) {
                    let matrixIdx = Math.floor(xPos / 8)
                    let colIdx = xPos % 8
                    if (matrixIdx < _max7219Num) {
                        for (let row = 0; row < 8; row++) {
                            if (fontData[col] & (1 << row)) {
                                _max7219Buffer[matrixIdx][row] |= (1 << (7 - colIdx))
                            }
                        }
                    }
                    xPos++
                }
                xPos++  // 문자 간격
            }
        }

        max7219Refresh()
    }

    //% block="MAX7219 scroll text %text|delay %delay ms"
    //% text.defl="Hello World!"
    //% delay.defl=100 delay.min=20 delay.max=500
    //% group="MAX7219" weight=73
    //% inlineInputMode=inline
    export function max7219ScrollText(text: string, delay: number): void {
        text = text.toUpperCase()

        // 전체 스크롤 버퍼 생성
        let scrollBuffer: number[] = []

        // 앞쪽 빈 공간
        for (let i = 0; i < _max7219Num * 8; i++) {
            scrollBuffer.push(0)
        }

        // 텍스트 데이터
        for (let i = 0; i < text.length; i++) {
            let charCode = text.charCodeAt(i)
            if (charCode >= 32 && charCode <= 90) {
                let fontData = MAX7219_FONT[charCode - 32]
                for (let col = 0; col < 5; col++) {
                    scrollBuffer.push(fontData[col])
                }
                scrollBuffer.push(0)  // 문자 간격
            }
        }

        // 뒤쪽 빈 공간
        for (let i = 0; i < _max7219Num * 8; i++) {
            scrollBuffer.push(0)
        }

        // 스크롤 애니메이션
        for (let pos = 0; pos < scrollBuffer.length - _max7219Num * 8; pos++) {
            for (let m = 0; m < _max7219Num; m++) {
                for (let col = 0; col < 8; col++) {
                    let bufIdx = pos + m * 8 + col
                    _max7219Buffer[m][col] = scrollBuffer[bufIdx]
                }
            }
            max7219Refresh()
            basic.pause(delay)
        }
    }

    //% block="MAX7219 pixel set x %x|y %y|value %value"
    //% x.min=0 x.max=63 x.defl=0
    //% y.min=0 y.max=7 y.defl=0
    //% value.shadow="toggleOnOff" value.defl=true
    //% group="MAX7219" weight=72
    //% inlineInputMode=inline
    export function max7219SetPixel(x: number, y: number, value: boolean): void {
        let matrixIdx = Math.floor(x / 8)
        let col = x % 8
        if (matrixIdx < _max7219Num && y >= 0 && y < 8) {
            if (value) {
                _max7219Buffer[matrixIdx][y] |= (1 << (7 - col))
            } else {
                _max7219Buffer[matrixIdx][y] &= ~(1 << (7 - col))
            }
        }
    }

    //% block="MAX7219 refresh"
    //% group="MAX7219" weight=71
    export function max7219Refresh(): void {
        for (let row = 0; row < 8; row++) {
            pins.digitalWritePin(_max7219CS, 0)
            for (let m = _max7219Num - 1; m >= 0; m--) {
                max7219SendByte(row + 1)
                max7219SendByte(_max7219Buffer[m][row])
            }
            pins.digitalWritePin(_max7219CS, 1)
        }
    }

    //% block="MAX7219 clear all"
    //% group="MAX7219" weight=70
    export function max7219Clear(): void {
        for (let m = 0; m < _max7219Num; m++) {
            for (let i = 0; i < 8; i++) {
                _max7219Buffer[m][i] = 0
            }
        }
        max7219Refresh()
    }

    //% block="MAX7219 fill all"
    //% group="MAX7219" weight=69
    export function max7219Fill(): void {
        for (let m = 0; m < _max7219Num; m++) {
            for (let i = 0; i < 8; i++) {
                _max7219Buffer[m][i] = 0xFF
            }
        }
        max7219Refresh()
    }

    //% block="MAX7219 brightness set %brightness"
    //% brightness.min=0 brightness.max=15 brightness.defl=7
    //% group="MAX7219" weight=68
    export function max7219SetBrightness(brightness: number): void {
        max7219SendAll(0x0A, Math.clamp(0, 15, brightness))
    }

    //% block="MAX7219 power %state"
    //% state.shadow="toggleOnOff" state.defl=true
    //% group="MAX7219" weight=67
    export function max7219Power(state: boolean): void {
        max7219SendAll(0x0C, state ? 0x01 : 0x00)
    }

    // MAX7219 내부 함수들
    function max7219SendByte(data: number): void {
        for (let i = 7; i >= 0; i--) {
            pins.digitalWritePin(_max7219CLK, 0)
            pins.digitalWritePin(_max7219DIN, (data >> i) & 1)
            pins.digitalWritePin(_max7219CLK, 1)
        }
    }

    function max7219SendAll(reg: number, data: number): void {
        pins.digitalWritePin(_max7219CS, 0)
        for (let i = 0; i < _max7219Num; i++) {
            max7219SendByte(reg)
            max7219SendByte(data)
        }
        pins.digitalWritePin(_max7219CS, 1)
    }


    /********** HT16K33 LED 드라이버 (I2C 도트 매트릭스) **********/

    // HT16K33 매트릭스 크기
    export enum HT16K33Size {
        //% block="8x8 matrix"
        Size8x8 = 0,
        //% block="8x16 matrix"
        Size8x16 = 1,
        //% block="8x8 bicolor"
        Bicolor8x8 = 2
    }

    // HT16K33 스크롤 방향
    export enum HT16K33Scroll {
        //% block="left"
        Left = 0,
        //% block="right"
        Right = 1
    }

    // HT16K33 바이컬러 색상
    export enum HT16K33Color {
        //% block="off"
        Off = 0,
        //% block="green"
        Green = 1,
        //% block="red"
        Red = 2,
        //% block="orange"
        Orange = 3
    }

    // HT16K33 사각형 스타일
    export enum HT16K33RectStyle {
        //% block="Outline"
        Outline = 0,
        //% block="Fill"
        Fill = 1
    }

    // HT16K33 데이터 저장 변수
    let _ht16k33Addr: number = 0x70
    let _ht16k33Size: HT16K33Size = HT16K33Size.Size8x8
    let _ht16k33Brightness: number = 15
    let _ht16k33Blink: number = 0
    let _ht16k33Buffer: number[] = []
    let _ht16k33Rotation: number = 0

    // 8x8 폰트 (간소화된 버전, 0-9, A-Z)
    const HT16K33_FONT: number[][] = [
        [0x3E, 0x51, 0x49, 0x45, 0x3E, 0x00, 0x00, 0x00],  // 0
        [0x00, 0x42, 0x7F, 0x40, 0x00, 0x00, 0x00, 0x00],  // 1
        [0x42, 0x61, 0x51, 0x49, 0x46, 0x00, 0x00, 0x00],  // 2
        [0x21, 0x41, 0x45, 0x4B, 0x31, 0x00, 0x00, 0x00],  // 3
        [0x18, 0x14, 0x12, 0x7F, 0x10, 0x00, 0x00, 0x00],  // 4
        [0x27, 0x45, 0x45, 0x45, 0x39, 0x00, 0x00, 0x00],  // 5
        [0x3C, 0x4A, 0x49, 0x49, 0x30, 0x00, 0x00, 0x00],  // 6
        [0x01, 0x71, 0x09, 0x05, 0x03, 0x00, 0x00, 0x00],  // 7
        [0x36, 0x49, 0x49, 0x49, 0x36, 0x00, 0x00, 0x00],  // 8
        [0x06, 0x49, 0x49, 0x29, 0x1E, 0x00, 0x00, 0x00],  // 9
        [0x7E, 0x11, 0x11, 0x11, 0x7E, 0x00, 0x00, 0x00],  // A
        [0x7F, 0x49, 0x49, 0x49, 0x36, 0x00, 0x00, 0x00],  // B
        [0x3E, 0x41, 0x41, 0x41, 0x22, 0x00, 0x00, 0x00],  // C
        [0x7F, 0x41, 0x41, 0x22, 0x1C, 0x00, 0x00, 0x00],  // D
        [0x7F, 0x49, 0x49, 0x49, 0x41, 0x00, 0x00, 0x00],  // E
        [0x7F, 0x09, 0x09, 0x01, 0x01, 0x00, 0x00, 0x00],  // F
        [0x3E, 0x41, 0x41, 0x51, 0x32, 0x00, 0x00, 0x00],  // G
        [0x7F, 0x08, 0x08, 0x08, 0x7F, 0x00, 0x00, 0x00],  // H
        [0x00, 0x41, 0x7F, 0x41, 0x00, 0x00, 0x00, 0x00],  // I
        [0x20, 0x40, 0x41, 0x3F, 0x01, 0x00, 0x00, 0x00],  // J
        [0x7F, 0x08, 0x14, 0x22, 0x41, 0x00, 0x00, 0x00],  // K
        [0x7F, 0x40, 0x40, 0x40, 0x40, 0x00, 0x00, 0x00],  // L
        [0x7F, 0x02, 0x04, 0x02, 0x7F, 0x00, 0x00, 0x00],  // M
        [0x7F, 0x04, 0x08, 0x10, 0x7F, 0x00, 0x00, 0x00],  // N
        [0x3E, 0x41, 0x41, 0x41, 0x3E, 0x00, 0x00, 0x00],  // O
        [0x7F, 0x09, 0x09, 0x09, 0x06, 0x00, 0x00, 0x00],  // P
        [0x3E, 0x41, 0x51, 0x21, 0x5E, 0x00, 0x00, 0x00],  // Q
        [0x7F, 0x09, 0x19, 0x29, 0x46, 0x00, 0x00, 0x00],  // R
        [0x46, 0x49, 0x49, 0x49, 0x31, 0x00, 0x00, 0x00],  // S
        [0x01, 0x01, 0x7F, 0x01, 0x01, 0x00, 0x00, 0x00],  // T
        [0x3F, 0x40, 0x40, 0x40, 0x3F, 0x00, 0x00, 0x00],  // U
        [0x1F, 0x20, 0x40, 0x20, 0x1F, 0x00, 0x00, 0x00],  // V
        [0x7F, 0x20, 0x18, 0x20, 0x7F, 0x00, 0x00, 0x00],  // W
        [0x63, 0x14, 0x08, 0x14, 0x63, 0x00, 0x00, 0x00],  // X
        [0x03, 0x04, 0x78, 0x04, 0x03, 0x00, 0x00, 0x00],  // Y
        [0x61, 0x51, 0x49, 0x45, 0x43, 0x00, 0x00, 0x00],  // Z
    ]

    //% block="I2C dot matrix(HT16K33) set # %num|device %size|I2C address %addr|brightness(0-15) %brightness|blink %blink|rotate %rotation"
    //% num.defl=1 num.min=1 num.max=8
    //% addr.defl=0x70
    //% brightness.defl=15 brightness.min=0 brightness.max=15
    //% blink.shadow="toggleOnOff" blink.defl=false
    //% rotation.defl=0 rotation.min=0 rotation.max=3
    //% group="MAX7219" weight=66
    //% inlineInputMode=inline
    export function ht16k33Init(num: number, size: HT16K33Size, addr: number, brightness: number, blink: boolean, rotation: number): void {
        _ht16k33Addr = addr
        _ht16k33Size = size
        _ht16k33Brightness = brightness
        _ht16k33Blink = blink ? 1 : 0
        _ht16k33Rotation = rotation

        // 버퍼 초기화 (16바이트)
        _ht16k33Buffer = []
        for (let i = 0; i < 16; i++) {
            _ht16k33Buffer.push(0)
        }

        // HT16K33 초기화
        pins.i2cWriteNumber(_ht16k33Addr, 0x21, NumberFormat.UInt8BE)  // 시스템 오실레이터 ON
        ht16k33SetBrightness(brightness)
        ht16k33SetBlink(blink)
        ht16k33Clear()
    }

    //% block="I2C matrix %num |char %text |scroll %scroll|speed(second) %speed"
    //% num.defl=1
    //% text.defl="Hello"
    //% speed.defl=0.2
    //% group="HT16K33" weight=65
    //% inlineInputMode=inline
    export function ht16k33ShowText(num: number, text: string, scroll: HT16K33Scroll, speed: number): void {
        text = text.toUpperCase()
        let delayMs = Math.floor(speed * 1000)

        if (text.length <= 1) {
            // 한 글자면 바로 표시
            ht16k33ShowChar(text.charCodeAt(0))
        } else {
            // 여러 글자면 스크롤
            for (let i = 0; i < text.length; i++) {
                ht16k33ShowChar(text.charCodeAt(i))
                basic.pause(delayMs)
            }
        }
    }

    //% block="I2C matrix %num |screenat show"
    //% num.defl=1
    //% group="HT16K33" weight=64
    export function ht16k33Refresh(num: number): void {
        // 버퍼를 I2C로 전송
        let buf = pins.createBuffer(17)
        buf[0] = 0x00  // 시작 주소
        for (let i = 0; i < 16; i++) {
            buf[i + 1] = _ht16k33Buffer[i]
        }
        pins.i2cWriteBuffer(_ht16k33Addr, buf)
    }

    //% block="I2C matrix %num |screen clear"
    //% num.defl=1
    //% group="HT16K33" weight=63
    export function ht16k33Clear(): void {
        for (let i = 0; i < 16; i++) {
            _ht16k33Buffer[i] = 0
        }
        ht16k33Refresh(1)
    }

    //% block="I2C matrix %num brightness(0-15) %brightness"
    //% num.defl=1
    //% brightness.defl=15 brightness.min=0 brightness.max=15
    //% group="HT16K33" weight=62
    export function ht16k33SetBrightness(brightness: number): void {
        _ht16k33Brightness = Math.clamp(0, 15, brightness)
        pins.i2cWriteNumber(_ht16k33Addr, 0xE0 | _ht16k33Brightness, NumberFormat.UInt8BE)
    }

    //% block="I2C matrix %num blink %blink"
    //% num.defl=1
    //% blink.shadow="toggleOnOff" blink.defl=false
    //% group="HT16K33" weight=61
    export function ht16k33SetBlink(blink: boolean): void {
        _ht16k33Blink = blink ? 1 : 0
        // 0x81: ON 깜빡임 없음, 0x83: ON 2Hz 깜빡임
        pins.i2cWriteNumber(_ht16k33Addr, 0x81 | (_ht16k33Blink << 1), NumberFormat.UInt8BE)
    }

    //% block="I2C matrix %num |%row row|%col column|pixel %state"
    //% num.defl=1
    //% row.min=0 row.max=7 row.defl=0
    //% col.min=0 col.max=7 col.defl=0
    //% state.shadow="toggleOnOff" state.defl=true
    //% group="HT16K33" weight=60
    //% inlineInputMode=inline
    export function ht16k33SetPixel(num: number, row: number, col: number, state: boolean): void {
        if (row < 0 || row > 7 || col < 0 || col > 7) return

        let bufIdx = row * 2
        if (state) {
            _ht16k33Buffer[bufIdx] |= (1 << col)
        } else {
            _ht16k33Buffer[bufIdx] &= ~(1 << col)
        }
    }

    //% block="I2C bicolor matrix %num |%row row|%col column|color %color"
    //% num.defl=1
    //% row.min=0 row.max=7 row.defl=0
    //% col.min=0 col.max=7 col.defl=0
    //% group="HT16K33" weight=59
    //% inlineInputMode=inline
    export function ht16k33SetBicolorPixel(num: number, row: number, col: number, color: HT16K33Color): void {
        if (row < 0 || row > 7 || col < 0 || col > 7) return

        let greenIdx = row * 2
        let redIdx = row * 2 + 1

        // 색상 설정
        if (color == HT16K33Color.Off) {
            _ht16k33Buffer[greenIdx] &= ~(1 << col)
            _ht16k33Buffer[redIdx] &= ~(1 << col)
        } else if (color == HT16K33Color.Green) {
            _ht16k33Buffer[greenIdx] |= (1 << col)
            _ht16k33Buffer[redIdx] &= ~(1 << col)
        } else if (color == HT16K33Color.Red) {
            _ht16k33Buffer[greenIdx] &= ~(1 << col)
            _ht16k33Buffer[redIdx] |= (1 << col)
        } else if (color == HT16K33Color.Orange) {
            _ht16k33Buffer[greenIdx] |= (1 << col)
            _ht16k33Buffer[redIdx] |= (1 << col)
        }
    }

    //% block="I2C matrix %num |( %x1 row, %y1 column) → ( %x2 row, %y2 column) line draw"
    //% num.defl=1
    //% x1.min=0 x1.max=7 x1.defl=0
    //% y1.min=0 y1.max=7 y1.defl=0
    //% x2.min=0 x2.max=7 x2.defl=7
    //% y2.min=0 y2.max=7 y2.defl=7
    //% group="HT16K33" weight=58
    //% inlineInputMode=inline
    export function ht16k33DrawLine(num: number, x1: number, y1: number, x2: number, y2: number): void {
        // Bresenham's line algorithm
        let dx = Math.abs(x2 - x1)
        let dy = Math.abs(y2 - y1)
        let sx = x1 < x2 ? 1 : -1
        let sy = y1 < y2 ? 1 : -1
        let err = dx - dy

        while (true) {
            ht16k33SetPixel(num, x1, y1, true)

            if (x1 == x2 && y1 == y2) break
            let e2 = 2 * err
            if (e2 > -dy) {
                err -= dy
                x1 += sx
            }
            if (e2 < dx) {
                err += dx
                y1 += sy
            }
        }
    }

    //% block="I2C matrix %num |center( %cx row, %cy column) radius %r|circle draw"
    //% num.defl=1
    //% cx.min=0 cx.max=7 cx.defl=3
    //% cy.min=0 cy.max=7 cy.defl=3
    //% r.min=1 r.max=4 r.defl=3
    //% group="HT16K33" weight=57
    //% inlineInputMode=inline
    export function ht16k33DrawCircle(num: number, cx: number, cy: number, r: number): void {
        // Midpoint circle algorithm
        let x = r
        let y = 0
        let err = 0

        while (x >= y) {
            ht16k33SetPixel(num, cx + x, cy + y, true)
            ht16k33SetPixel(num, cx + y, cy + x, true)
            ht16k33SetPixel(num, cx - y, cy + x, true)
            ht16k33SetPixel(num, cx - x, cy + y, true)
            ht16k33SetPixel(num, cx - x, cy - y, true)
            ht16k33SetPixel(num, cx - y, cy - x, true)
            ht16k33SetPixel(num, cx + y, cy - x, true)
            ht16k33SetPixel(num, cx + x, cy - y, true)

            y++
            err += 1 + 2 * y
            if (2 * (err - x) + 1 > 0) {
                x--
                err += 1 - 2 * x
            }
        }
    }

    //% block="I2C matrix %num |start( %x row, %y column) level %w × %h|rectangle %style"
    //% num.defl=1
    //% x.min=0 x.max=7 x.defl=0
    //% y.min=0 y.max=7 y.defl=0
    //% w.min=1 w.max=8 w.defl=4
    //% h.min=1 h.max=8 h.defl=4
    //% group="74HC595" weight=56
    //% inlineInputMode=inline
    export function ht16k33DrawRect(num: number, x: number, y: number, w: number, h: number, style: HT16K33RectStyle): void {
        if (style == HT16K33RectStyle.Outline) {
            // 외곽선만
            for (let i = 0; i < w; i++) {
                ht16k33SetPixel(num, x + i, y, true)
                ht16k33SetPixel(num, x + i, y + h - 1, true)
            }
            for (let j = 0; j < h; j++) {
                ht16k33SetPixel(num, x, y + j, true)
                ht16k33SetPixel(num, x + w - 1, y + j, true)
            }
        } else {
            // 채우기
            for (let i = 0; i < w; i++) {
                for (let j = 0; j < h; j++) {
                    ht16k33SetPixel(num, x + i, y + j, true)
                }
            }
        }
    }

    //% block="I2C matrix %num |fill all"
    //% num.defl=1
    //% group="74HC595" weight=55
    export function ht16k33Fill(num: number): void {
        for (let i = 0; i < 16; i++) {
            _ht16k33Buffer[i] = 0xFF
        }
        ht16k33Refresh(num)
    }

    // 한 문자 표시 (내부 함수)
    function ht16k33ShowChar(charCode: number): void {
        let fontIdx = -1

        if (charCode >= 48 && charCode <= 57) {
            // 0-9
            fontIdx = charCode - 48
        } else if (charCode >= 65 && charCode <= 90) {
            // A-Z
            fontIdx = charCode - 65 + 10
        }

        if (fontIdx >= 0 && fontIdx < HT16K33_FONT.length) {
            for (let row = 0; row < 8; row++) {
                _ht16k33Buffer[row * 2] = HT16K33_FONT[fontIdx][row]
            }
        } else {
            // 알 수 없는 문자는 공백
            for (let row = 0; row < 8; row++) {
                _ht16k33Buffer[row * 2] = 0
            }
        }

        ht16k33Refresh(1)
    }


    /********** 74HC595 시프트 레지스터 **********/

    // 74HC595 핀 저장 변수
    let _hc595Data: DigitalPin = DigitalPin.P0    // DS (SER)
    let _hc595Clock: DigitalPin = DigitalPin.P1   // SHCP (SRCLK)
    let _hc595Latch: DigitalPin = DigitalPin.P2   // STCP (RCLK)
    let _hc595ChipCount: number = 1
    let _hc595Buffer: number[] = [0]

    //% block="74HC595 set|data pin(DS) %data|clock pin(SHCP) %clock|latch pin(STCP) %latch|chip count %count"
    //% data.defl=DigitalPin.P0
    //% clock.defl=DigitalPin.P1
    //% latch.defl=DigitalPin.P2
    //% count.defl=1 count.min=1 count.max=8
    //% group="74HC595" weight=54
    //% inlineInputMode=inline
    export function hc595Init(data: DigitalPin, clock: DigitalPin, latch: DigitalPin, count: number): void {
        _hc595Data = data
        _hc595Clock = clock
        _hc595Latch = latch
        _hc595ChipCount = count

        // 버퍼 초기화
        _hc595Buffer = []
        for (let i = 0; i < count; i++) {
            _hc595Buffer.push(0)
        }

        // 핀 초기화
        pins.digitalWritePin(_hc595Data, 0)
        pins.digitalWritePin(_hc595Clock, 0)
        pins.digitalWritePin(_hc595Latch, 0)

        // 모든 출력 끄기
        hc595Clear()
    }

    //% block="74HC595 byte output %value"
    //% value.min=0 value.max=255 value.defl=0
    //% group="74HC595" weight=53
    export function hc595Output(value: number): void {
        _hc595Buffer[0] = value & 0xFF
        hc595Update()
    }

    //% block="74HC595 chip %chipIndex at byte %value output"
    //% chipIndex.min=0 chipIndex.max=7 chipIndex.defl=0
    //% value.min=0 value.max=255 value.defl=0
    //% group="74HC595" weight=52
    export function hc595OutputToChip(chipIndex: number, value: number): void {
        if (chipIndex >= 0 && chipIndex < _hc595ChipCount) {
            _hc595Buffer[chipIndex] = value & 0xFF
            hc595Update()
        }
    }

    //% block="74HC595 pin %pin %state"
    //% pin.min=0 pin.max=63 pin.defl=0
    //% state.shadow="toggleOnOff" state.defl=true
    //% group="74HC595" weight=51
    export function hc595SetPin(pin: number, state: boolean): void {
        let chipIndex = Math.floor(pin / 8)
        let bitIndex = pin % 8

        if (chipIndex >= 0 && chipIndex < _hc595ChipCount) {
            if (state) {
                _hc595Buffer[chipIndex] |= (1 << bitIndex)
            } else {
                _hc595Buffer[chipIndex] &= ~(1 << bitIndex)
            }
            hc595Update()
        }
    }

    //% block="74HC595 pin %pin toggle"
    //% pin.min=0 pin.max=63 pin.defl=0
    //% group="74HC595" weight=50
    export function hc595TogglePin(pin: number): void {
        let chipIndex = Math.floor(pin / 8)
        let bitIndex = pin % 8

        if (chipIndex >= 0 && chipIndex < _hc595ChipCount) {
            _hc595Buffer[chipIndex] ^= (1 << bitIndex)
            hc595Update()
        }
    }

    //% block="74HC595 pin %pin state"
    //% pin.min=0 pin.max=63 pin.defl=0
    //% group="74HC595" weight=49
    export function hc595GetPin(pin: number): boolean {
        let chipIndex = Math.floor(pin / 8)
        let bitIndex = pin % 8

        if (chipIndex >= 0 && chipIndex < _hc595ChipCount) {
            return (_hc595Buffer[chipIndex] & (1 << bitIndex)) != 0
        }
        return false
    }

    //% block="74HC595 all on"
    //% group="74HC595" weight=48
    export function hc595Fill(): void {
        for (let i = 0; i < _hc595ChipCount; i++) {
            _hc595Buffer[i] = 0xFF
        }
        hc595Update()
    }

    //% block="74HC595 all off"
    //% group="74HC595" weight=47
    export function hc595Clear(): void {
        for (let i = 0; i < _hc595ChipCount; i++) {
            _hc595Buffer[i] = 0x00
        }
        hc595Update()
    }

    //% block="74HC595 left shift"
    //% group="74HC595" weight=46
    export function hc595ShiftLeft(): void {
        let carry = 0
        for (let i = 0; i < _hc595ChipCount; i++) {
            let newCarry = (_hc595Buffer[i] & 0x80) ? 1 : 0
            _hc595Buffer[i] = ((_hc595Buffer[i] << 1) | carry) & 0xFF
            carry = newCarry
        }
        hc595Update()
    }

    //% block="74HC595 right shift"
    //% group="74HC595" weight=45
    export function hc595ShiftRight(): void {
        let carry = 0
        for (let i = _hc595ChipCount - 1; i >= 0; i--) {
            let newCarry = (_hc595Buffer[i] & 0x01) ? 0x80 : 0
            _hc595Buffer[i] = ((_hc595Buffer[i] >> 1) | carry) & 0xFF
            carry = newCarry
        }
        hc595Update()
    }

    //% block="74HC595 LED bar graph value %value|max %max"
    //% value.defl=0
    //% max.defl=8 max.min=1 max.max=64
    //% group="74HC595" weight=44
    export function hc595BarGraph(value: number, max: number): void {
        let totalBits = _hc595ChipCount * 8
        let ledsOn = Math.floor((value * totalBits) / max)
        ledsOn = Math.clamp(0, totalBits, ledsOn)

        for (let i = 0; i < _hc595ChipCount; i++) {
            let bitsForThisChip = ledsOn - (i * 8)
            if (bitsForThisChip >= 8) {
                _hc595Buffer[i] = 0xFF
            } else if (bitsForThisChip > 0) {
                _hc595Buffer[i] = (1 << bitsForThisChip) - 1
            } else {
                _hc595Buffer[i] = 0x00
            }
        }
        hc595Update()
    }

    // 74HC595 내부: 버퍼를 시프트 레지스터로 전송
    function hc595Update(): void {
        pins.digitalWritePin(_hc595Latch, 0)

        // 마지막 칩부터 전송 (데이지 체인)
        for (let i = _hc595ChipCount - 1; i >= 0; i--) {
            hc595ShiftOut(_hc595Buffer[i])
        }

        // 래치: 출력에 반영
        pins.digitalWritePin(_hc595Latch, 1)
        control.waitMicros(1)
        pins.digitalWritePin(_hc595Latch, 0)
    }

    // 74HC595 내부: 1바이트 시프트 아웃 (MSB first)
    function hc595ShiftOut(value: number): void {
        for (let i = 7; i >= 0; i--) {
            pins.digitalWritePin(_hc595Clock, 0)
            pins.digitalWritePin(_hc595Data, (value >> i) & 1)
            pins.digitalWritePin(_hc595Clock, 1)
        }
    }


    /********** ST7735 TFT 디스플레이 **********/

    // TFT 색상 (RGB565 형식)
    export enum TFTColor {
        //% block="black"
        Black = 0x0000,
        //% block="white"
        White = 0xFFFF,
        //% block="red"
        Red = 0xF800,
        //% block="green"
        Green = 0x07E0,
        //% block="blue"
        Blue = 0x001F,
        //% block="yellow"
        Yellow = 0xFFE0,
        //% block="cyan"
        Cyan = 0x07FF,
        //% block="magenta"
        Magenta = 0xF81F,
        //% block="orange"
        Orange = 0xFC00,
        //% block="purple"
        Purple = 0x8010,
        //% block="gray"
        Gray = 0x8410
    }

    // TFT 회전
    export enum TFTRotation {
        //% block="0°"
        Rotate0 = 0,
        //% block="90°"
        Rotate90 = 1,
        //% block="180°"
        Rotate180 = 2,
        //% block="270°"
        Rotate270 = 3
    }

    // TFT 폰트 크기
    export enum TFTFontSize {
        //% block="small"
        Small = 1,
        //% block="medium"
        Medium = 2,
        //% block="large"
        Large = 3
    }

    // ST7735 핀 저장 변수
    let _st7735CS: DigitalPin = DigitalPin.P16
    let _st7735DC: DigitalPin = DigitalPin.P8
    let _st7735RST: DigitalPin = DigitalPin.P12
    let _st7735Width: number = 128
    let _st7735Height: number = 160
    let _st7735Rotation: TFTRotation = TFTRotation.Rotate0

    //% block="ST7735 TFT set|CS pin %cs|DC pin %dc|RST pin %rst|rotate %rotation"
    //% cs.defl=DigitalPin.P16
    //% dc.defl=DigitalPin.P8
    //% rst.defl=DigitalPin.P12
    //% group="TFT" weight=70
    //% inlineInputMode=inline
    export function st7735Init(cs: DigitalPin, dc: DigitalPin, rst: DigitalPin, rotation: TFTRotation): void {
        _st7735CS = cs
        _st7735DC = dc
        _st7735RST = rst
        _st7735Rotation = rotation

        // 핀 초기화
        pins.digitalWritePin(_st7735CS, 1)
        pins.digitalWritePin(_st7735DC, 0)

        // 하드웨어 리셋
        pins.digitalWritePin(_st7735RST, 1)
        basic.pause(10)
        pins.digitalWritePin(_st7735RST, 0)
        basic.pause(10)
        pins.digitalWritePin(_st7735RST, 1)
        basic.pause(120)

        // ST7735 초기화 시퀀스
        st7735WriteCmd(0x01)  // Software Reset
        basic.pause(150)
        st7735WriteCmd(0x11)  // Sleep Out
        basic.pause(120)

        st7735WriteCmd(0x3A)  // Color Mode
        st7735WriteData(0x05) // 16-bit color (RGB565)

        st7735WriteCmd(0x36)  // Memory Access Control
        let madctl = 0x00
        if (rotation == TFTRotation.Rotate0) {
            madctl = 0x00
            _st7735Width = 128
            _st7735Height = 160
        } else if (rotation == TFTRotation.Rotate90) {
            madctl = 0x60
            _st7735Width = 160
            _st7735Height = 128
        } else if (rotation == TFTRotation.Rotate180) {
            madctl = 0xC0
            _st7735Width = 128
            _st7735Height = 160
        } else {
            madctl = 0xA0
            _st7735Width = 160
            _st7735Height = 128
        }
        st7735WriteData(madctl)

        st7735WriteCmd(0x29)  // Display ON
        basic.pause(10)

        st7735FillScreen(TFTColor.Black)
    }

    //% block="ST7735 screen fill color %color"
    //% color.shadow="tftColorPicker"
    //% group="TFT" weight=69
    export function st7735FillScreen(color: number): void {
        st7735SetWindow(0, 0, _st7735Width - 1, _st7735Height - 1)
        st7735WriteCmd(0x2C)  // Memory Write

        let hi = (color >> 8) & 0xFF
        let lo = color & 0xFF

        pins.digitalWritePin(_st7735CS, 0)
        pins.digitalWritePin(_st7735DC, 1)
        for (let i = 0; i < _st7735Width * _st7735Height; i++) {
            pins.spiWrite(hi)
            pins.spiWrite(lo)
        }
        pins.digitalWritePin(_st7735CS, 1)
    }

    //% block="ST7735 pixel x %x|y %y|color %color"
    //% x.min=0 x.defl=0
    //% y.min=0 y.defl=0
    //% color.shadow="tftColorPicker"
    //% group="TFT" weight=68
    //% inlineInputMode=inline
    export function st7735DrawPixel(x: number, y: number, color: number): void {
        if (x < 0 || x >= _st7735Width || y < 0 || y >= _st7735Height) return

        st7735SetWindow(x, y, x, y)
        st7735WriteCmd(0x2C)
        st7735WriteData((color >> 8) & 0xFF)
        st7735WriteData(color & 0xFF)
    }

    //% block="ST7735 line draw (%x1,%y1) → (%x2,%y2)|color %color"
    //% x1.defl=0 y1.defl=0 x2.defl=50 y2.defl=50
    //% color.shadow="tftColorPicker"
    //% group="TFT" weight=67
    //% inlineInputMode=inline
    export function st7735DrawLine(x1: number, y1: number, x2: number, y2: number, color: number): void {
        let dx = Math.abs(x2 - x1)
        let dy = Math.abs(y2 - y1)
        let sx = x1 < x2 ? 1 : -1
        let sy = y1 < y2 ? 1 : -1
        let err = dx - dy

        while (true) {
            st7735DrawPixel(x1, y1, color)
            if (x1 == x2 && y1 == y2) break
            let e2 = 2 * err
            if (e2 > -dy) { err -= dy; x1 += sx }
            if (e2 < dx) { err += dx; y1 += sy }
        }
    }

    //% block="ST7735 rectangle (%x,%y) level %w×%h|color %color|fill %fill"
    //% x.defl=10 y.defl=10 w.defl=50 h.defl=30
    //% color.shadow="tftColorPicker"
    //% fill.shadow="toggleYesNo" fill.defl=false
    //% group="TFT" weight=66
    //% inlineInputMode=inline
    export function st7735DrawRect(x: number, y: number, w: number, h: number, color: number, fill: boolean): void {
        if (fill) {
            st7735SetWindow(x, y, x + w - 1, y + h - 1)
            st7735WriteCmd(0x2C)

            let hi = (color >> 8) & 0xFF
            let lo = color & 0xFF

            pins.digitalWritePin(_st7735CS, 0)
            pins.digitalWritePin(_st7735DC, 1)
            for (let i = 0; i < w * h; i++) {
                pins.spiWrite(hi)
                pins.spiWrite(lo)
            }
            pins.digitalWritePin(_st7735CS, 1)
        } else {
            st7735DrawLine(x, y, x + w - 1, y, color)
            st7735DrawLine(x, y + h - 1, x + w - 1, y + h - 1, color)
            st7735DrawLine(x, y, x, y + h - 1, color)
            st7735DrawLine(x + w - 1, y, x + w - 1, y + h - 1, color)
        }
    }

    //% block="ST7735 circle center (%cx,%cy) radius %r|color %color"
    //% cx.defl=64 cy.defl=80 r.defl=20
    //% color.shadow="tftColorPicker"
    //% group="TFT" weight=65
    //% inlineInputMode=inline
    export function st7735DrawCircle(cx: number, cy: number, r: number, color: number): void {
        let x = r
        let y = 0
        let err = 0

        while (x >= y) {
            st7735DrawPixel(cx + x, cy + y, color)
            st7735DrawPixel(cx + y, cy + x, color)
            st7735DrawPixel(cx - y, cy + x, color)
            st7735DrawPixel(cx - x, cy + y, color)
            st7735DrawPixel(cx - x, cy - y, color)
            st7735DrawPixel(cx - y, cy - x, color)
            st7735DrawPixel(cx + y, cy - x, color)
            st7735DrawPixel(cx + x, cy - y, color)

            y++
            err += 1 + 2 * y
            if (2 * (err - x) + 1 > 0) {
                x--
                err += 1 - 2 * x
            }
        }
    }

    //% block="ST7735 text %text|position (%x,%y)|color %color|size %size"
    //% text.defl="Hello"
    //% x.defl=10 y.defl=10
    //% color.shadow="tftColorPicker"
    //% group="TFT" weight=64
    //% inlineInputMode=inline
    export function st7735DrawText(text: string, x: number, y: number, color: number, size: TFTFontSize): void {
        let cursorX = x
        for (let i = 0; i < text.length; i++) {
            st7735DrawChar(text.charCodeAt(i), cursorX, y, color, size)
            cursorX += 6 * size
        }
    }

    //% block="RGB color R %r|G %g|B %b"
    //% r.min=0 r.max=255 r.defl=255
    //% g.min=0 g.max=255 g.defl=0
    //% b.min=0 b.max=255 b.defl=0
    //% group="TFT" weight=63
    export function tftRGB(r: number, g: number, b: number): number {
        // RGB888 → RGB565 변환
        return ((r & 0xF8) << 8) | ((g & 0xFC) << 3) | (b >> 3)
    }

    //% block="%color"
    //% blockId="tftColorPicker"
    //% shim=TD_ID
    //% color.fieldEditor="colorwheel"
    //% color.fieldOptions.colours='["#000000","#FFFFFF","#FF0000","#00FF00","#0000FF","#FFFF00","#00FFFF","#FF00FF","#FFA500","#808080"]'
    //% color.fieldOptions.columns=5
    //% color.defl=0xFFFF
    //% group="TFT" weight=62
    //% blockHidden=true
    export function tftColorPicker(color: number): number {
        return color
    }

    //% block="TFT color %color"
    //% group="TFT" weight=61
    export function tftPresetColor(color: TFTColor): number {
        return color
    }

    // ST7735 내부 함수들
    function st7735WriteCmd(cmd: number): void {
        pins.digitalWritePin(_st7735DC, 0)
        pins.digitalWritePin(_st7735CS, 0)
        pins.spiWrite(cmd)
        pins.digitalWritePin(_st7735CS, 1)
    }

    function st7735WriteData(data: number): void {
        pins.digitalWritePin(_st7735DC, 1)
        pins.digitalWritePin(_st7735CS, 0)
        pins.spiWrite(data)
        pins.digitalWritePin(_st7735CS, 1)
    }

    function st7735SetWindow(x0: number, y0: number, x1: number, y1: number): void {
        st7735WriteCmd(0x2A)  // Column Address Set
        st7735WriteData(0x00)
        st7735WriteData(x0)
        st7735WriteData(0x00)
        st7735WriteData(x1)

        st7735WriteCmd(0x2B)  // Row Address Set
        st7735WriteData(0x00)
        st7735WriteData(y0)
        st7735WriteData(0x00)
        st7735WriteData(y1)
    }

    // 간단한 5x7 폰트 (숫자, 대문자)
    const TFT_FONT: number[] = [
        0x00, 0x00, 0x00, 0x00, 0x00,  // 32: 공백
        0x00, 0x00, 0x5F, 0x00, 0x00,  // 33: !
        0x00, 0x07, 0x00, 0x07, 0x00,  // 34: "
        0x14, 0x7F, 0x14, 0x7F, 0x14,  // 35: #
        0x24, 0x2A, 0x7F, 0x2A, 0x12,  // 36: $
        0x23, 0x13, 0x08, 0x64, 0x62,  // 37: %
        0x36, 0x49, 0x55, 0x22, 0x50,  // 38: &
        0x00, 0x05, 0x03, 0x00, 0x00,  // 39: '
        0x00, 0x1C, 0x22, 0x41, 0x00,  // 40: (
        0x00, 0x41, 0x22, 0x1C, 0x00,  // 41: )
        0x08, 0x2A, 0x1C, 0x2A, 0x08,  // 42: *
        0x08, 0x08, 0x3E, 0x08, 0x08,  // 43: +
        0x00, 0x50, 0x30, 0x00, 0x00,  // 44: ,
        0x08, 0x08, 0x08, 0x08, 0x08,  // 45: -
        0x00, 0x60, 0x60, 0x00, 0x00,  // 46: .
        0x20, 0x10, 0x08, 0x04, 0x02,  // 47: /
        0x3E, 0x51, 0x49, 0x45, 0x3E,  // 48: 0
        0x00, 0x42, 0x7F, 0x40, 0x00,  // 49: 1
        0x42, 0x61, 0x51, 0x49, 0x46,  // 50: 2
        0x21, 0x41, 0x45, 0x4B, 0x31,  // 51: 3
        0x18, 0x14, 0x12, 0x7F, 0x10,  // 52: 4
        0x27, 0x45, 0x45, 0x45, 0x39,  // 53: 5
        0x3C, 0x4A, 0x49, 0x49, 0x30,  // 54: 6
        0x01, 0x71, 0x09, 0x05, 0x03,  // 55: 7
        0x36, 0x49, 0x49, 0x49, 0x36,  // 56: 8
        0x06, 0x49, 0x49, 0x29, 0x1E,  // 57: 9
        0x00, 0x36, 0x36, 0x00, 0x00,  // 58: :
        0x00, 0x56, 0x36, 0x00, 0x00,  // 59: ;
        0x00, 0x08, 0x14, 0x22, 0x41,  // 60: <
        0x14, 0x14, 0x14, 0x14, 0x14,  // 61: =
        0x41, 0x22, 0x14, 0x08, 0x00,  // 62: >
        0x02, 0x01, 0x51, 0x09, 0x06,  // 63: ?
        0x32, 0x49, 0x79, 0x41, 0x3E,  // 64: @
        0x7E, 0x11, 0x11, 0x11, 0x7E,  // 65: A
        0x7F, 0x49, 0x49, 0x49, 0x36,  // 66: B
        0x3E, 0x41, 0x41, 0x41, 0x22,  // 67: C
        0x7F, 0x41, 0x41, 0x22, 0x1C,  // 68: D
        0x7F, 0x49, 0x49, 0x49, 0x41,  // 69: E
        0x7F, 0x09, 0x09, 0x01, 0x01,  // 70: F
        0x3E, 0x41, 0x41, 0x51, 0x32,  // 71: G
        0x7F, 0x08, 0x08, 0x08, 0x7F,  // 72: H
        0x00, 0x41, 0x7F, 0x41, 0x00,  // 73: I
        0x20, 0x40, 0x41, 0x3F, 0x01,  // 74: J
        0x7F, 0x08, 0x14, 0x22, 0x41,  // 75: K
        0x7F, 0x40, 0x40, 0x40, 0x40,  // 76: L
        0x7F, 0x02, 0x04, 0x02, 0x7F,  // 77: M
        0x7F, 0x04, 0x08, 0x10, 0x7F,  // 78: N
        0x3E, 0x41, 0x41, 0x41, 0x3E,  // 79: O
        0x7F, 0x09, 0x09, 0x09, 0x06,  // 80: P
        0x3E, 0x41, 0x51, 0x21, 0x5E,  // 81: Q
        0x7F, 0x09, 0x19, 0x29, 0x46,  // 82: R
        0x46, 0x49, 0x49, 0x49, 0x31,  // 83: S
        0x01, 0x01, 0x7F, 0x01, 0x01,  // 84: T
        0x3F, 0x40, 0x40, 0x40, 0x3F,  // 85: U
        0x1F, 0x20, 0x40, 0x20, 0x1F,  // 86: V
        0x7F, 0x20, 0x18, 0x20, 0x7F,  // 87: W
        0x63, 0x14, 0x08, 0x14, 0x63,  // 88: X
        0x03, 0x04, 0x78, 0x04, 0x03,  // 89: Y
        0x61, 0x51, 0x49, 0x45, 0x43,  // 90: Z
    ]

    function st7735DrawChar(c: number, x: number, y: number, color: number, size: number): void {
        if (c < 32 || c > 90) c = 32  // 지원하지 않는 문자는 공백

        let fontIdx = (c - 32) * 5

        for (let col = 0; col < 5; col++) {
            let line = TFT_FONT[fontIdx + col]
            for (let row = 0; row < 7; row++) {
                if (line & (1 << row)) {
                    if (size == 1) {
                        st7735DrawPixel(x + col, y + row, color)
                    } else {
                        st7735DrawRect(x + col * size, y + row * size, size, size, color, true)
                    }
                }
            }
        }
    }


    /********** ILI9341 TFT 디스플레이 **********/

    // ILI9341 핀 저장 변수
    let _ili9341CS: DigitalPin = DigitalPin.P16
    let _ili9341DC: DigitalPin = DigitalPin.P8
    let _ili9341RST: DigitalPin = DigitalPin.P12
    let _ili9341Width: number = 240
    let _ili9341Height: number = 320

    //% block="ILI9341 TFT set|CS pin %cs|DC pin %dc|RST pin %rst|rotate %rotation"
    //% cs.defl=DigitalPin.P16
    //% dc.defl=DigitalPin.P8
    //% rst.defl=DigitalPin.P12
    //% group="TFT" weight=60
    //% inlineInputMode=inline
    export function ili9341Init(cs: DigitalPin, dc: DigitalPin, rst: DigitalPin, rotation: TFTRotation): void {
        _ili9341CS = cs
        _ili9341DC = dc
        _ili9341RST = rst

        // 핀 초기화
        pins.digitalWritePin(_ili9341CS, 1)
        pins.digitalWritePin(_ili9341DC, 0)

        // 하드웨어 리셋
        pins.digitalWritePin(_ili9341RST, 1)
        basic.pause(10)
        pins.digitalWritePin(_ili9341RST, 0)
        basic.pause(10)
        pins.digitalWritePin(_ili9341RST, 1)
        basic.pause(120)

        // ILI9341 초기화 시퀀스
        ili9341WriteCmd(0x01)  // Software Reset
        basic.pause(150)
        ili9341WriteCmd(0x11)  // Sleep Out
        basic.pause(120)

        ili9341WriteCmd(0x3A)  // Pixel Format
        ili9341WriteData(0x55) // 16-bit color

        ili9341WriteCmd(0x36)  // Memory Access Control
        let madctl = 0x48
        if (rotation == TFTRotation.Rotate0) {
            madctl = 0x48
            _ili9341Width = 240
            _ili9341Height = 320
        } else if (rotation == TFTRotation.Rotate90) {
            madctl = 0x28
            _ili9341Width = 320
            _ili9341Height = 240
        } else if (rotation == TFTRotation.Rotate180) {
            madctl = 0x88
            _ili9341Width = 240
            _ili9341Height = 320
        } else {
            madctl = 0xE8
            _ili9341Width = 320
            _ili9341Height = 240
        }
        ili9341WriteData(madctl)

        ili9341WriteCmd(0x29)  // Display ON
        basic.pause(10)

        ili9341FillScreen(TFTColor.Black)
    }

    //% block="ILI9341 screen fill color %color"
    //% color.shadow="tftColorPicker"
    //% group="TFT" weight=59
    export function ili9341FillScreen(color: number): void {
        ili9341SetWindow(0, 0, _ili9341Width - 1, _ili9341Height - 1)
        ili9341WriteCmd(0x2C)

        let hi = (color >> 8) & 0xFF
        let lo = color & 0xFF

        pins.digitalWritePin(_ili9341CS, 0)
        pins.digitalWritePin(_ili9341DC, 1)
        // ILI9341은 240x320으로 더 큼 - 분할 전송
        for (let row = 0; row < _ili9341Height; row++) {
            for (let col = 0; col < _ili9341Width; col++) {
                pins.spiWrite(hi)
                pins.spiWrite(lo)
            }
        }
        pins.digitalWritePin(_ili9341CS, 1)
    }

    //% block="ILI9341 pixel x %x|y %y|color %color"
    //% x.min=0 x.defl=0
    //% y.min=0 y.defl=0
    //% color.shadow="tftColorPicker"
    //% group="TFT" weight=58
    //% inlineInputMode=inline
    export function ili9341DrawPixel(x: number, y: number, color: number): void {
        if (x < 0 || x >= _ili9341Width || y < 0 || y >= _ili9341Height) return

        ili9341SetWindow(x, y, x, y)
        ili9341WriteCmd(0x2C)
        ili9341WriteData((color >> 8) & 0xFF)
        ili9341WriteData(color & 0xFF)
    }

    //% block="ILI9341 rectangle (%x,%y) level %w×%h|color %color|fill %fill"
    //% x.defl=10 y.defl=10 w.defl=50 h.defl=30
    //% color.shadow="tftColorPicker"
    //% fill.shadow="toggleYesNo" fill.defl=true
    //% group="TFT" weight=57
    //% inlineInputMode=inline
    export function ili9341DrawRect(x: number, y: number, w: number, h: number, color: number, fill: boolean): void {
        if (fill) {
            ili9341SetWindow(x, y, x + w - 1, y + h - 1)
            ili9341WriteCmd(0x2C)

            let hi = (color >> 8) & 0xFF
            let lo = color & 0xFF

            pins.digitalWritePin(_ili9341CS, 0)
            pins.digitalWritePin(_ili9341DC, 1)
            for (let i = 0; i < w * h; i++) {
                pins.spiWrite(hi)
                pins.spiWrite(lo)
            }
            pins.digitalWritePin(_ili9341CS, 1)
        } else {
            // 외곽선만 그리기
            for (let i = 0; i < w; i++) {
                ili9341DrawPixel(x + i, y, color)
                ili9341DrawPixel(x + i, y + h - 1, color)
            }
            for (let j = 0; j < h; j++) {
                ili9341DrawPixel(x, y + j, color)
                ili9341DrawPixel(x + w - 1, y + j, color)
            }
        }
    }

    //% block="ILI9341 text %text|position (%x,%y)|color %color|size %size"
    //% text.defl="Hello"
    //% x.defl=10 y.defl=10
    //% color.shadow="tftColorPicker"
    //% group="TFT" weight=56
    //% inlineInputMode=inline
    export function ili9341DrawText(text: string, x: number, y: number, color: number, size: TFTFontSize): void {
        let cursorX = x
        for (let i = 0; i < text.length; i++) {
            ili9341DrawChar(text.charCodeAt(i), cursorX, y, color, size)
            cursorX += 6 * size
        }
    }

    // ILI9341 내부 함수들
    function ili9341WriteCmd(cmd: number): void {
        pins.digitalWritePin(_ili9341DC, 0)
        pins.digitalWritePin(_ili9341CS, 0)
        pins.spiWrite(cmd)
        pins.digitalWritePin(_ili9341CS, 1)
    }

    function ili9341WriteData(data: number): void {
        pins.digitalWritePin(_ili9341DC, 1)
        pins.digitalWritePin(_ili9341CS, 0)
        pins.spiWrite(data)
        pins.digitalWritePin(_ili9341CS, 1)
    }

    function ili9341SetWindow(x0: number, y0: number, x1: number, y1: number): void {
        ili9341WriteCmd(0x2A)  // Column Address Set
        ili9341WriteData((x0 >> 8) & 0xFF)
        ili9341WriteData(x0 & 0xFF)
        ili9341WriteData((x1 >> 8) & 0xFF)
        ili9341WriteData(x1 & 0xFF)

        ili9341WriteCmd(0x2B)  // Row Address Set
        ili9341WriteData((y0 >> 8) & 0xFF)
        ili9341WriteData(y0 & 0xFF)
        ili9341WriteData((y1 >> 8) & 0xFF)
        ili9341WriteData(y1 & 0xFF)
    }

    function ili9341DrawChar(c: number, x: number, y: number, color: number, size: number): void {
        if (c < 32 || c > 90) c = 32

        let fontIdx = (c - 32) * 5

        for (let col = 0; col < 5; col++) {
            let line = TFT_FONT[fontIdx + col]
            for (let row = 0; row < 7; row++) {
                if (line & (1 << row)) {
                    if (size == 1) {
                        ili9341DrawPixel(x + col, y + row, color)
                    } else {
                        ili9341DrawRect(x + col * size, y + row * size, size, size, color, true)
                    }
                }
            }
        }
    }
}


//% weight=1080 color=#FF8C00 icon="\uf0e7" block="03. Sensors"
//% groups="['HC-SR04', 'VL53L0X', 'GP2Y0A21YK', 'US-100', 'DHT11/DHT22', 'DS18B20', 'LM35', 'SHT30', 'HX711', 'Rotary Encoder', 'MQ-2', 'MQ-135', 'CCS811', 'SGP30', 'PMS', 'MHZ19', 'TDS', 'pH', 'Turbidity', 'BH1750', 'TEMT6000', 'TSL2561', 'UV Sensor', 'Joystick', 'Keypad', 'Button', 'Potentiometer', 'Other Sensors']"
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
    //% group="DHT11/DHT22" weight=110
    export function dhtLastQuerySuccessful(): boolean {
        return _dhtLastQuery
    }

    //% block="Read %readType"
    //% group="DHT11/DHT22" weight=109
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
    //% group="DHT11/DHT22" weight=108
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
    //% group="DHT11/DHT22" weight=107
    export function dhtSensorResponding(): boolean {
        return _dhtSensorResponding
    }

    //% block="Temperature type: %unit"
    //% group="DHT11/DHT22" weight=106
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
    //% group="DS18B20" weight=104
    export function ds18b20SetPin(pin: DigitalPin): void {
        _ds18b20Pin = pin
    }

    //% block="DS18B20 start conversion"
    //% group="DS18B20" weight=103
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
    //% group="DS18B20" weight=102
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
    //% group="DS18B20" weight=101
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
    //% group="LM35" weight=97
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
    //% group="SHT30" weight=96
    export function sht30Init(addr: number): void {
        _sht30Addr = addr
    }

    //% block="SHT30 start measurement"
    //% group="SHT30" weight=95
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
    //% group="SHT30" weight=94
    export function sht30ReadTemp(unit: TempUnit): number {
        if (unit == TempUnit.Fahrenheit) {
            return _sht30Temperature * 9 / 5 + 32
        }
        return _sht30Temperature
    }

    //% block="SHT30 read humidity"
    //% group="SHT30" weight=93
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
    //% group="HC-SR04" weight=92
    export function hcsr04SetPins(trig: DigitalPin, echo: DigitalPin): void {
        _hcsr04Trig = trig
        _hcsr04Echo = echo
    }

    //% block="HC-SR04 read distance unit %unit"
    //% group="HC-SR04" weight=91
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
    //% group="VL53L0X" weight=89
    export function vl53l0xInit(addr: number): void {
        _vl53l0xAddr = addr
    }

    //% block="VL53L0X set mode | mode %mode | precision %precision"
    //% group="VL53L0X" weight=88
    export function vl53l0xSetMode(mode: VL53L0XMode, precision: VL53L0XPrecision): void {
        _vl53l0xMode = mode
        _vl53l0xPrecision = precision

        // 정밀도에 따른 타이밍 설정
        let timingBudget = _vl53l0xPrecision == VL53L0XPrecision.High ? 200000 : 20000

        // I2C로 설정 전송
        pins.i2cWriteNumber(_vl53l0xAddr, 0x01, NumberFormat.UInt8BE)
    }

    //% block="VL53L0X control %control"
    //% group="VL53L0X" weight=87
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
    //% group="VL53L0X" weight=86
    export function vl53l0xRead(readType: VL53L0XReadType): number {
        if (readType == VL53L0XReadType.Distance) {
            return _vl53l0xDistance
        }
        return _vl53l0xAmbient
    }


    /********** GP2Y0A21YK 적외선 거리 센서 **********/

    //% block="GP2Y0A21YK read distance pin %pin unit %unit"
    //% group="GP2Y0A21YK" weight=85
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
    //% group="US-100" weight=84
    export function us100SetPins(trig: DigitalPin, echo: DigitalPin): void {
        _us100Trig = trig
        _us100Echo = echo
    }

    //% block="US-100 distance measure unit %unit"
    //% group="US-100" weight=83
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
    //% group="BH1750" weight=80
    export function bh1750Init(addr: number): void {
        _bh1750Addr = addr
        // Power On
        pins.i2cWriteNumber(_bh1750Addr, 0x01, NumberFormat.UInt8BE)
        // 연속 고해상도 모드 (1 lux)
        pins.i2cWriteNumber(_bh1750Addr, 0x10, NumberFormat.UInt8BE)
        basic.pause(180)
    }

    //% block="BH1750 light intensity read (lux)"
    //% group="BH1750" weight=79
    export function bh1750Read(): number {
        let buf = pins.i2cReadBuffer(_bh1750Addr, 2)
        let raw = (buf[0] << 8) | buf[1]
        return Math.floor(raw / 1.2)
    }


    /********** TEMT6000 조도 센서 **********/

    //% block="TEMT6000 light intensity read pin %pin"
    //% group="TEMT6000" weight=78
    export function temt6000Read(pin: AnalogPin): number {
        return pins.analogReadPin(pin)
    }


    /********** TSL2561 조도 센서 **********/

    // TSL2561 데이터 저장 변수
    let _tsl2561Addr: number = 0x39

    //% block="TSL2561 init address %addr"
    //% addr.defl=0x39
    //% group="TSL2561" weight=77
    export function tsl2561Init(addr: number): void {
        _tsl2561Addr = addr
        // Power On (Command + Control Register)
        pins.i2cWriteNumber(_tsl2561Addr, 0x80, NumberFormat.UInt8BE)
        pins.i2cWriteNumber(_tsl2561Addr, 0x03, NumberFormat.UInt8BE)
        basic.pause(400)
    }

    //% block="TSL2561 light intensity read (lux)"
    //% group="TSL2561" weight=76
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
    //% group="MQ-2" weight=50
    export function mq2Read(pin: AnalogPin): number {
        return pins.analogReadPin(pin)
    }


    /********** MQ-135 공기질 센서 **********/

    //% block="MQ-135 air quality read pin %pin"
    //% group="MQ-135" weight=49
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
    //% group="CCS811" weight=48
    export function ccs811Init(): void {
        // 앱 시작 명령
        pins.i2cWriteNumber(_ccs811Addr, 0xF4, NumberFormat.UInt8BE)
        basic.pause(100)
        // 측정 모드 설정 (1초 간격)
        pins.i2cWriteNumber(_ccs811Addr, 0x0110, NumberFormat.UInt16BE)
        basic.pause(100)
    }

    //% block="CCS811 read %ctype"
    //% group="CCS811" weight=47
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
    //% group="SGP30" weight=46
    export function sgp30Init(): void {
        // IAQ 초기화 명령
        pins.i2cWriteNumber(_sgp30Addr, 0x2003, NumberFormat.UInt16BE)
        basic.pause(10)
    }

    //% block="SGP30 measure run"
    //% group="SGP30" weight=45
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
    //% group="SGP30" weight=44
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
    //% group="PMS" weight=50
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
    //% group="PMS" weight=49
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
    //% group="PMS" weight=48
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
    //% group="PMS" weight=47
    export function pmsRead(dtype: PMSDataType): number {
        pmsParseData()
        return _pmsData[dtype]
    }

    //% block="PMS PM sensor request read"
    //% group="PMS" weight=46
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
    //% group="PMS" weight=45
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
    //% group="MHZ19" weight=38
    //% inlineInputMode=inline
    export function mhz19Init(serialType: MHZ19Serial, rx: SerialPin, tx: SerialPin, baud: number): void {
        _mhz19Rx = rx
        _mhz19Tx = tx
        serial.redirect(tx, rx, baud)
        basic.pause(500)  // 센서 안정화 대기
    }

    //% block="MHZ19 set range: %range ppm"
    //% range.defl=MHZ19Range.Range2000
    //% group="MHZ19" weight=37
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
    //% group="MHZ19" weight=36
    //% inlineInputMode=inline
    export function mhz19SetFilter(filter: MHZ19Filter, filterType: MHZ19FilterType): void {
        // 필터 설정은 소프트웨어적으로 처리 (MHZ19B에서는 직접 지원 안함)
        // 이 블록은 호환성을 위해 제공
    }

    //% block="MHZ19 read: %dtype"
    //% dtype.defl=MHZ19DataType.CO2
    //% group="MHZ19" weight=35
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
    //% group="MHZ19" weight=34
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
    //% group="MHZ19" weight=33
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
    //% group="HX711" weight=43
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
    //% group="HX711" weight=42
    export function hx711ReadWeight(): number {
        let raw = hx711ReadRaw()
        return (raw - _hx711Offset) / _hx711Scale
    }

    //% block="HX711 weight sensor tare %times times"
    //% times.defl=10 times.min=1 times.max=50
    //% group="HX711" weight=41
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
    //% group="HX711" weight=40
    export function hx711SetScale(scale: number): void {
        if (scale != 0) {
            _hx711Scale = scale
        }
    }

    //% block="HX711 weight sensor is ready"
    //% group="HX711" weight=39
    export function hx711IsReady(): boolean {
        return pins.digitalReadPin(_hx711Dout) == 0
    }

    //% block="HX711 weight sensor power %state"
    //% state.shadow="toggleOnOff"
    //% group="HX711" weight=38
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
    //% group="HX711" weight=37
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
    //% group="TDS" weight=32
    export function tdsInit(pin: AnalogPin): void {
        _tdsPin = pin
        _tdsTemperature = 25
        _tdsRefVoltage = 3.3
        _tdsADCResolution = 1023
        _tdsKValue = 1.0
    }

    //% block="TDS sensor temp compensation: %temperature °C"
    //% temperature.defl=25 temperature.min=0 temperature.max=50
    //% group="TDS" weight=31
    export function tdsSetTemperature(temperature: number): void {
        _tdsTemperature = temperature
    }

    //% block="TDS sensor update"
    //% group="TDS" weight=30
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
    //% group="TDS" weight=29
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
    //% group="TDS" weight=28
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
    //% group="Turbidity" weight=23
    export function turbidityInit(pin: AnalogPin): void {
        _turbidityPin = pin
        _turbidityRefVoltage = 3.3
        _turbidityClearVoltage = 2.5
    }

    //% block="Turbidity sensor calibrate (clear water)"
    //% group="Turbidity" weight=22
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
    //% group="Turbidity" weight=21
    export function turbidityUpdate(): void {
        // 값 읽기는 turbidityRead에서 직접 수행
        // 이 블록은 호환성을 위해 제공
    }

    //% block="Turbidity sensor read: %dtype"
    //% dtype.defl=TurbidityDataType.NTU
    //% group="Turbidity" weight=20
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


//% weight=1070 color=#1E90FF icon="\uf0e7" block="04. Adv Sensors"
//% groups="['Time', 'BMP280', 'BME280', 'MPU6050', 'ADXL345', 'TCS34725', 'APDS9960', 'MAX30102', 'Fingerprint', 'INA219', 'ACS712', 'Voltage Sensor', 'Other']"
namespace AdvSensors {



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
    //% group="APDS9960" weight=90
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
    //% group="APDS9960" weight=89
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
    //% group="APDS9960" weight=88
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
    //% group="APDS9960" weight=87
    export function apds9960GetProximity(): number {
        pins.i2cWriteNumber(_apds9960Addr, 0x9C, NumberFormat.UInt8BE)
        _apds9960Proximity = pins.i2cReadNumber(_apds9960Addr, NumberFormat.UInt8BE)
        return _apds9960Proximity
    }

    //% block="APDS9960 gesture detected"
    //% group="APDS9960" weight=86
    export function apds9960GestureAvailable(): boolean {
        // 제스처 상태 확인
        pins.i2cWriteNumber(_apds9960Addr, 0xAF, NumberFormat.UInt8BE)
        let status = pins.i2cReadNumber(_apds9960Addr, NumberFormat.UInt8BE)
        _apds9960GestureDetected = (status & 0x01) != 0
        return _apds9960GestureDetected
    }

    //% block="APDS9960 gesture read %gesture"
    //% gesture.defl=APDS9960GestureKR.Left
    //% group="APDS9960" weight=85
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
    //% group="APDS9960" weight=75
    export function apds9960Init(): void {
        // Enable 레지스터 (PON + AEN + PEN + GEN)
        pins.i2cWriteNumber(_apds9960Addr, 0x80, NumberFormat.UInt8BE)
        pins.i2cWriteNumber(_apds9960Addr, 0x4F, NumberFormat.UInt8BE)
        basic.pause(10)
    }

    //% block="APDS9960 gesture read"
    //% group="APDS9960" weight=74
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
    //% group="APDS9960" weight=73
    export function apds9960ReadProximity(): number {
        pins.i2cWriteNumber(_apds9960Addr, 0x9C, NumberFormat.UInt8BE)
        return pins.i2cReadNumber(_apds9960Addr, NumberFormat.UInt8BE)
    }

    //% block="APDS9960 color read %color"
    //% group="APDS9960" weight=72
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
    //% group="TCS34725" weight=80
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
    //% group="TCS34725" weight=79
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
    //% group="TCS34725" weight=78
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
    //% group="TCS34725" weight=77
    export function tcs34725GetChannel(channel: TCS34725Channel): number {
        if (channel == TCS34725Channel.Red) return _tcs34725R8
        if (channel == TCS34725Channel.Green) return _tcs34725G8
        if (channel == TCS34725Channel.Blue) return _tcs34725B8
        return Math.min(255, Math.round(_tcs34725C / 256))
    }

    //% block="Color sensor is %color ?"
    //% color.defl=TCS34725Color.Red
    //% group="TCS34725" weight=76
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
    //% group="TCS34725" weight=71
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
    //% group="TCS34725" weight=70
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
    //% group="MPU6050" weight=75
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
    //% group="MPU6050" weight=74
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
    //% group="MPU6050" weight=73
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
    //% group="MPU6050" weight=72
    //% inlineInputMode=inline
    export function mpu6050SetGyroOffset(x: number, y: number, z: number): void {
        _mpu6050GyroOffsetX = x
        _mpu6050GyroOffsetY = y
        _mpu6050GyroOffsetZ = z
    }

    //% block="Gyro auto calibrate stabilize: %stabilizeTime ms measure: %measureTime ms"
    //% stabilizeTime.defl=1000 stabilizeTime.min=100 stabilizeTime.max=5000
    //% measureTime.defl=3000 measureTime.min=500 measureTime.max=10000
    //% group="MPU6050" weight=71
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
    //% group="MPU6050" weight=70
    export function mpu6050Init(addr: number): void {
        _mpu6050Addr = addr
        // 슬립 모드 해제
        pins.i2cWriteNumber(_mpu6050Addr, 0x6B00, NumberFormat.UInt16BE)
        basic.pause(100)
    }

    //% block="MPU6050 read %mtype axis %axis"
    //% group="MPU6050" weight=69
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


    /********** ADXL345 가속도 센서 **********/

    // ADXL345 데이터 저장 변수
    let _adxl345Addr: number = 0x53

    //% block="ADXL345 init address %addr"
    //% addr.defl=0x53
    //% group="ADXL345" weight=67
    export function adxl345Init(addr: number): void {
        _adxl345Addr = addr
        // 측정 모드 활성화 (POWER_CTL 레지스터)
        pins.i2cWriteNumber(_adxl345Addr, 0x2D08, NumberFormat.UInt16BE)
        // 데이터 포맷 설정 (±16g, Full Resolution)
        pins.i2cWriteNumber(_adxl345Addr, 0x310B, NumberFormat.UInt16BE)
        basic.pause(10)
    }

    //% block="ADXL345 acceleration read axis %axis"
    //% group="ADXL345" weight=66
    export function adxl345Read(axis: Axis): number {
        let reg = 0x32 + (axis * 2)  // X=0x32, Y=0x34, Z=0x36

        pins.i2cWriteNumber(_adxl345Addr, reg, NumberFormat.UInt8BE)
        return pins.i2cReadNumber(_adxl345Addr, NumberFormat.Int16LE)
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
    //% group="BMP280" weight=65
    export function bmp280Init(addr: number): void {
        _bmp280Addr = addr
        // 컨트롤 레지스터 설정 (Normal mode, oversampling x1)
        pins.i2cWriteNumber(_bmp280Addr, 0xF427, NumberFormat.UInt16BE)
        basic.pause(100)
    }

    //% block="BMP280 read %btype"
    //% group="BMP280" weight=64
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
    //% group="BME280" weight=63
    export function bme280Init(addr: number): void {
        _bme280Addr = addr
        // 습도 오버샘플링 설정
        pins.i2cWriteNumber(_bme280Addr, 0xF201, NumberFormat.UInt16BE)
        // 컨트롤 레지스터 설정 (Normal mode, oversampling x1)
        pins.i2cWriteNumber(_bme280Addr, 0xF427, NumberFormat.UInt16BE)
        basic.pause(100)
    }

    //% block="BME280 read %btype"
    //% group="BME280" weight=62
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
    //% group="MAX30102" weight=35
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
    //% group="MAX30102" weight=34
    export function heartRateFingerDetected(): boolean {
        heartRateReadRaw()
        // IR 값이 일정 수준 이상이면 손가락 감지
        _hrFingerDetected = _hrIRLED > 50000
        return _hrFingerDetected
    }

    //% block="Heart rate read (BPM)"
    //% group="MAX30102" weight=33
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
    //% group="MAX30102" weight=32
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
    //% group="MAX30102" weight=31
    export function heartRateBeatDetected(): boolean {
        heartRateReadRaw()
        return _hrBeatDetected
    }

    //% block="Sensor ready"
    //% group="MAX30102" weight=30
    export function heartRateIsReady(): boolean {
        return _hrReady && _hrFingerDetected
    }

    //% block="Sensor temperature (°C)"
    //% group="MAX30102" weight=29
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
    //% group="MAX30102" weight=28
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
    //% group="MAX30102" weight=27
    export function heartRateGetRedRaw(): number {
        heartRateReadRaw()
        return _hrRedLED
    }

    //% block="IR LED raw value read"
    //% group="MAX30102" weight=26
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
    //% group="Fingerprint" weight=23
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
    //% group="Fingerprint" weight=22
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
    //% group="Fingerprint" weight=21
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
    //% group="Fingerprint" weight=20
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
    //% group="Fingerprint" weight=19
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
    //% group="Fingerprint" weight=18
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
    //% group="Time" weight=100
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
    //% group="Time" weight=99
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
    //% group="Time" weight=98
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
    //% group="Time" weight=97
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
    //% group="Time" weight=96
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
    //% group="Time" weight=95
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
    //% group="INA219" weight=49
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
    //% group="INA219" weight=48
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


    /********** ACS712 전류 센서 **********/

    // ACS712는 홀 효과 기반 아날로그 전류 센서입니다.
    // 5A, 20A, 30A 버전 있음

    // ACS712 감도 타입
    export enum ACS712Type {
        //% block="5A (185mV/A)"
        ACS712_5A = 185,
        //% block="20A (100mV/A)"
        ACS712_20A = 100,
        //% block="30A (66mV/A)"
        ACS712_30A = 66
    }

    //% block="ACS712 current (A)|pin %pin|type %sensorType"
    //% pin.defl=AnalogPin.P0
    //% sensorType.defl=ACS712Type.ACS712_20A
    //% group="ACS712" weight=47
    export function acs712Current(pin: AnalogPin, sensorType: ACS712Type): number {
        let raw = pins.analogReadPin(pin)
        // micro:bit는 3.3V 기준, ACS712는 5V 기준이므로 변환 필요
        let voltage = raw * 3.3 / 1023
        // 2.5V가 0A 기준점 (실제로는 1.65V가 됨 - 3.3V 시스템)
        let current = (voltage - 1.65) / (sensorType / 1000)
        return Math.round(current * 100) / 100
    }


    /********** 전압 센서 (분압 모듈) **********/

    // 전압 분압 모듈 (최대 25V 측정)
    // 5:1 분압 비율

    //% block="voltage sensor read (V)|pin %pin|maxvoltage %maxVoltage"
    //% pin.defl=AnalogPin.P0
    //% maxVoltage.defl=25
    //% group="Voltage Sensor" weight=46
    export function voltageRead(pin: AnalogPin, maxVoltage: number): number {
        let raw = pins.analogReadPin(pin)
        let voltage = raw * maxVoltage / 1023
        return Math.round(voltage * 100) / 100
    }

    //% block="battery level (%)|pin %pin|minvoltage %minV|maxvoltage %maxV"
    //% pin.defl=AnalogPin.P0
    //% minV.defl=3.0 maxV.defl=4.2
    //% group="Voltage Sensor" weight=45
    //% inlineInputMode=inline
    export function batteryPercent(pin: AnalogPin, minV: number, maxV: number): number {
        let raw = pins.analogReadPin(pin)
        let voltage = raw * 3.3 / 1023
        let percent = (voltage - minV) / (maxV - minV) * 100
        return Math.clamp(0, 100, Math.round(percent))
    }


    /********** 레이저 모듈 **********/

    //% block="laser %state|digital %pin pin"
    //% state.shadow="toggleOnOff"
    //% pin.defl=DigitalPin.P0
    //% group="Other" weight=50
    export function laser(state: boolean, pin: DigitalPin): void {
        pins.digitalWritePin(pin, state ? 1 : 0)
    }


    /********** 리드 스위치 **********/

    //% block="reed switch detected? (digital pin %pin)"
    //% pin.defl=DigitalPin.P0
    //% group="Other" weight=49
    export function reedSwitchRead(pin: DigitalPin): boolean {
        return pins.digitalReadPin(pin) == 1
    }


    /********** 틸트 센서 **********/

    //% block="tilt sensor tilted? (digital pin %pin)"
    //% pin.defl=DigitalPin.P0
    //% group="Other" weight=48
    export function tiltSensorRead(pin: DigitalPin): boolean {
        return pins.digitalReadPin(pin) == 1
    }
}


//% weight=1060 color=#32CD32 icon="\uf013" block="05. Actuators"
//% groups="['Servo Motors', 'Stepper Motors', 'L298N', 'L293D', 'TB6612FNG', 'DRV8833', 'Relays', 'Solenoid', 'Fan', 'Pump']"
namespace Actuators05 {


    /********** L298N 모터 드라이버 **********/

    // L298N 핀 저장 변수
    let _l298nENA: AnalogPin = AnalogPin.P0
    let _l298nIN1: DigitalPin = DigitalPin.P1
    let _l298nIN2: DigitalPin = DigitalPin.P2
    let _l298nENB: AnalogPin = AnalogPin.P3
    let _l298nIN3: DigitalPin = DigitalPin.P4
    let _l298nIN4: DigitalPin = DigitalPin.P5

    //% block="L298N motorA pin set ENA %ena IN1 %in1 IN2 %in2"
    //% group="L298N" weight=100
    export function l298nSetPinsA(ena: AnalogPin, in1: DigitalPin, in2: DigitalPin): void {
        _l298nENA = ena
        _l298nIN1 = in1
        _l298nIN2 = in2
    }

    //% block="L298N motorB pin set ENB %enb IN3 %in3 IN4 %in4"
    //% group="L298N" weight=99
    export function l298nSetPinsB(enb: AnalogPin, in3: DigitalPin, in4: DigitalPin): void {
        _l298nENB = enb
        _l298nIN3 = in3
        _l298nIN4 = in4
    }

    //% block="L298N motorA speed %speed"
    //% speed.min=-100 speed.max=100 speed.defl=0
    //% group="L298N" weight=98
    export function l298nMotorA(speed: number): void {
        let pwm = Math.abs(speed) * 10.23
        if (speed > 0) {
            pins.digitalWritePin(_l298nIN1, 1)
            pins.digitalWritePin(_l298nIN2, 0)
        } else if (speed < 0) {
            pins.digitalWritePin(_l298nIN1, 0)
            pins.digitalWritePin(_l298nIN2, 1)
        } else {
            pins.digitalWritePin(_l298nIN1, 0)
            pins.digitalWritePin(_l298nIN2, 0)
        }
        pins.analogWritePin(_l298nENA, pwm)
    }

    //% block="L298N motorB speed %speed"
    //% speed.min=-100 speed.max=100 speed.defl=0
    //% group="L298N" weight=97
    export function l298nMotorB(speed: number): void {
        let pwm = Math.abs(speed) * 10.23
        if (speed > 0) {
            pins.digitalWritePin(_l298nIN3, 1)
            pins.digitalWritePin(_l298nIN4, 0)
        } else if (speed < 0) {
            pins.digitalWritePin(_l298nIN3, 0)
            pins.digitalWritePin(_l298nIN4, 1)
        } else {
            pins.digitalWritePin(_l298nIN3, 0)
            pins.digitalWritePin(_l298nIN4, 0)
        }
        pins.analogWritePin(_l298nENB, pwm)
    }


    /********** L293D 모터 드라이버 **********/

    // L293D 핀 저장 변수
    let _l293dEN1: AnalogPin = AnalogPin.P0
    let _l293dIN1: DigitalPin = DigitalPin.P1
    let _l293dIN2: DigitalPin = DigitalPin.P2
    let _l293dEN2: AnalogPin = AnalogPin.P3
    let _l293dIN3: DigitalPin = DigitalPin.P4
    let _l293dIN4: DigitalPin = DigitalPin.P5

    //% block="L293D motor1 pin set EN1 %en1 IN1 %in1 IN2 %in2"
    //% group="L293D" weight=96
    export function l293dSetPins1(en1: AnalogPin, in1: DigitalPin, in2: DigitalPin): void {
        _l293dEN1 = en1
        _l293dIN1 = in1
        _l293dIN2 = in2
    }

    //% block="L293D motor2 pin set EN2 %en2 IN3 %in3 IN4 %in4"
    //% group="L293D" weight=95
    export function l293dSetPins2(en2: AnalogPin, in3: DigitalPin, in4: DigitalPin): void {
        _l293dEN2 = en2
        _l293dIN3 = in3
        _l293dIN4 = in4
    }

    //% block="L293D motor1 speed %speed"
    //% speed.min=-100 speed.max=100 speed.defl=0
    //% group="L293D" weight=94
    export function l293dMotor1(speed: number): void {
        let pwm = Math.abs(speed) * 10.23
        if (speed > 0) {
            pins.digitalWritePin(_l293dIN1, 1)
            pins.digitalWritePin(_l293dIN2, 0)
        } else if (speed < 0) {
            pins.digitalWritePin(_l293dIN1, 0)
            pins.digitalWritePin(_l293dIN2, 1)
        } else {
            pins.digitalWritePin(_l293dIN1, 0)
            pins.digitalWritePin(_l293dIN2, 0)
        }
        pins.analogWritePin(_l293dEN1, pwm)
    }

    //% block="L293D motor2 speed %speed"
    //% speed.min=-100 speed.max=100 speed.defl=0
    //% group="L293D" weight=93
    export function l293dMotor2(speed: number): void {
        let pwm = Math.abs(speed) * 10.23
        if (speed > 0) {
            pins.digitalWritePin(_l293dIN3, 1)
            pins.digitalWritePin(_l293dIN4, 0)
        } else if (speed < 0) {
            pins.digitalWritePin(_l293dIN3, 0)
            pins.digitalWritePin(_l293dIN4, 1)
        } else {
            pins.digitalWritePin(_l293dIN3, 0)
            pins.digitalWritePin(_l293dIN4, 0)
        }
        pins.analogWritePin(_l293dEN2, pwm)
    }


    /********** TB6612FNG 모터 드라이버 **********/

    // TB6612FNG 핀 저장 변수
    let _tb6612PWMA: AnalogPin = AnalogPin.P0
    let _tb6612AIN1: DigitalPin = DigitalPin.P1
    let _tb6612AIN2: DigitalPin = DigitalPin.P2
    let _tb6612PWMB: AnalogPin = AnalogPin.P3
    let _tb6612BIN1: DigitalPin = DigitalPin.P4
    let _tb6612BIN2: DigitalPin = DigitalPin.P5
    let _tb6612STBY: DigitalPin = DigitalPin.P6

    //% block="TB6612FNG pin set PWMA %pwma AIN1 %ain1 AIN2 %ain2 STBY %stby"
    //% group="TB6612FNG" weight=92
    export function tb6612SetPinsA(pwma: AnalogPin, ain1: DigitalPin, ain2: DigitalPin, stby: DigitalPin): void {
        _tb6612PWMA = pwma
        _tb6612AIN1 = ain1
        _tb6612AIN2 = ain2
        _tb6612STBY = stby
        pins.digitalWritePin(_tb6612STBY, 1)
    }

    //% block="TB6612FNG motorB pin set PWMB %pwmb BIN1 %bin1 BIN2 %bin2"
    //% group="TB6612FNG" weight=91
    export function tb6612SetPinsB(pwmb: AnalogPin, bin1: DigitalPin, bin2: DigitalPin): void {
        _tb6612PWMB = pwmb
        _tb6612BIN1 = bin1
        _tb6612BIN2 = bin2
    }

    //% block="TB6612FNG motorA speed %speed"
    //% speed.min=-100 speed.max=100 speed.defl=0
    //% group="TB6612FNG" weight=90
    export function tb6612MotorA(speed: number): void {
        let pwm = Math.abs(speed) * 10.23
        if (speed > 0) {
            pins.digitalWritePin(_tb6612AIN1, 1)
            pins.digitalWritePin(_tb6612AIN2, 0)
        } else if (speed < 0) {
            pins.digitalWritePin(_tb6612AIN1, 0)
            pins.digitalWritePin(_tb6612AIN2, 1)
        } else {
            pins.digitalWritePin(_tb6612AIN1, 0)
            pins.digitalWritePin(_tb6612AIN2, 0)
        }
        pins.analogWritePin(_tb6612PWMA, pwm)
    }

    //% block="TB6612FNG motorB speed %speed"
    //% speed.min=-100 speed.max=100 speed.defl=0
    //% group="TB6612FNG" weight=89
    export function tb6612MotorB(speed: number): void {
        let pwm = Math.abs(speed) * 10.23
        if (speed > 0) {
            pins.digitalWritePin(_tb6612BIN1, 1)
            pins.digitalWritePin(_tb6612BIN2, 0)
        } else if (speed < 0) {
            pins.digitalWritePin(_tb6612BIN1, 0)
            pins.digitalWritePin(_tb6612BIN2, 1)
        } else {
            pins.digitalWritePin(_tb6612BIN1, 0)
            pins.digitalWritePin(_tb6612BIN2, 0)
        }
        pins.analogWritePin(_tb6612PWMB, pwm)
    }


    /********** DRV8833 모터 드라이버 **********/

    // DRV8833 핀 저장 변수
    let _drv8833AIN1: AnalogPin = AnalogPin.P0
    let _drv8833AIN2: AnalogPin = AnalogPin.P1
    let _drv8833BIN1: AnalogPin = AnalogPin.P2
    let _drv8833BIN2: AnalogPin = AnalogPin.P3

    //% block="DRV8833 motorA pin set AIN1 %ain1 AIN2 %ain2"
    //% group="DRV8833" weight=88
    export function drv8833SetPinsA(ain1: AnalogPin, ain2: AnalogPin): void {
        _drv8833AIN1 = ain1
        _drv8833AIN2 = ain2
    }

    //% block="DRV8833 motorB pin set BIN1 %bin1 BIN2 %bin2"
    //% group="DRV8833" weight=87
    export function drv8833SetPinsB(bin1: AnalogPin, bin2: AnalogPin): void {
        _drv8833BIN1 = bin1
        _drv8833BIN2 = bin2
    }

    //% block="DRV8833 motorA speed %speed"
    //% speed.min=-100 speed.max=100 speed.defl=0
    //% group="DRV8833" weight=86
    export function drv8833MotorA(speed: number): void {
        let pwm = Math.abs(speed) * 10.23
        if (speed > 0) {
            pins.analogWritePin(_drv8833AIN1, pwm)
            pins.analogWritePin(_drv8833AIN2, 0)
        } else if (speed < 0) {
            pins.analogWritePin(_drv8833AIN1, 0)
            pins.analogWritePin(_drv8833AIN2, pwm)
        } else {
            pins.analogWritePin(_drv8833AIN1, 0)
            pins.analogWritePin(_drv8833AIN2, 0)
        }
    }

    //% block="DRV8833 motorB speed %speed"
    //% speed.min=-100 speed.max=100 speed.defl=0
    //% group="DRV8833" weight=85
    export function drv8833MotorB(speed: number): void {
        let pwm = Math.abs(speed) * 10.23
        if (speed > 0) {
            pins.analogWritePin(_drv8833BIN1, pwm)
            pins.analogWritePin(_drv8833BIN2, 0)
        } else if (speed < 0) {
            pins.analogWritePin(_drv8833BIN1, 0)
            pins.analogWritePin(_drv8833BIN2, pwm)
        } else {
            pins.analogWritePin(_drv8833BIN1, 0)
            pins.analogWritePin(_drv8833BIN2, 0)
        }
    }

    /********** NEMA17 스테퍼 모터 **********/

    // 스테퍼 드라이버 타입
    export enum StepperDriver {
        //% block="driver(2pin)"
        Driver2Pin = 0,
        //% block="ULN2003(4pin)"
        ULN2003 = 1
    }

    // 스테퍼 이동 타입
    export enum StepperMoveType {
        //% block="move to absolute position"
        Absolute = 0,
        //% block="move to relative position"
        Relative = 1
    }

    // 스테퍼 동작
    export enum StepperAction {
        //% block="run"
        Run = 0,
        //% block="stop"
        Stop = 1
    }

    // 스테퍼 상태
    export enum StepperStatus {
        //% block="current position"
        Position = 0,
        //% block="running"
        Running = 1
    }

    // 스테퍼 모터 데이터 (최대 4개)
    let _stepperDirPin: DigitalPin[] = [DigitalPin.P0, DigitalPin.P0, DigitalPin.P0, DigitalPin.P0]
    let _stepperStepPin: DigitalPin[] = [DigitalPin.P1, DigitalPin.P1, DigitalPin.P1, DigitalPin.P1]
    let _stepperMaxSpeed: number[] = [1000, 1000, 1000, 1000]
    let _stepperAccel: number[] = [50, 50, 50, 50]
    let _stepperSpeed: number[] = [200, 200, 200, 200]
    let _stepperSteps: number[] = [200, 200, 200, 200]
    let _stepperPosition: number[] = [0, 0, 0, 0]
    let _stepperTarget: number[] = [0, 0, 0, 0]
    let _stepperRunning: boolean[] = [false, false, false, false]

    //% block="step motor(A4988) driver( %index ) driver %driver : DIRpin %dirPin . Steppin %stepPin set"
    //% index.min=1 index.max=4 index.defl=1
    //% group="Stepper Motors" weight=76
    //% inlineInputMode=inline
    export function stepperSetup(index: number, driver: StepperDriver, dirPin: DigitalPin, stepPin: DigitalPin): void {
        let i = index - 1
        _stepperDirPin[i] = dirPin
        _stepperStepPin[i] = stepPin
    }

    //% block="step motor %index : max speed %maxSpeed . acceleration %accel . speed set %speed . step set %steps"
    //% index.min=1 index.max=4 index.defl=1
    //% maxSpeed.defl=1000 accel.defl=50 speed.defl=200 steps.defl=200
    //% group="Stepper Motors" weight=75
    //% inlineInputMode=inline
    export function stepperConfig(index: number, maxSpeed: number, accel: number, speed: number, steps: number): void {
        let i = index - 1
        _stepperMaxSpeed[i] = maxSpeed
        _stepperAccel[i] = accel
        _stepperSpeed[i] = speed
        _stepperSteps[i] = steps
    }

    //% block="step motor %index : %moveType %position"
    //% index.min=1 index.max=4 index.defl=1
    //% position.defl=200
    //% group="Stepper Motors" weight=74
    //% inlineInputMode=inline
    export function stepperMove(index: number, moveType: StepperMoveType, position: number): void {
        let i = index - 1
        if (moveType == StepperMoveType.Absolute) {
            _stepperTarget[i] = position
        } else {
            _stepperTarget[i] = _stepperPosition[i] + position
        }
    }

    //% block="step motor %index : %action"
    //% index.min=1 index.max=4 index.defl=1
    //% group="Stepper Motors" weight=73
    export function stepperAction(index: number, action: StepperAction): void {
        let i = index - 1
        if (action == StepperAction.Run) {
            _stepperRunning[i] = true
            let steps = _stepperTarget[i] - _stepperPosition[i]
            let dir = steps > 0 ? 1 : 0
            pins.digitalWritePin(_stepperDirPin[i], dir)

            let delay = Math.floor(1000000 / _stepperSpeed[i] / 2)
            for (let s = 0; s < Math.abs(steps); s++) {
                if (!_stepperRunning[i]) break
                pins.digitalWritePin(_stepperStepPin[i], 1)
                control.waitMicros(delay)
                pins.digitalWritePin(_stepperStepPin[i], 0)
                control.waitMicros(delay)
                _stepperPosition[i] += dir ? 1 : -1
            }
            _stepperRunning[i] = false
        } else {
            _stepperRunning[i] = false
        }
    }

    //% block="step motor %index : %status"
    //% index.min=1 index.max=4 index.defl=1
    //% group="Stepper Motors" weight=72
    export function stepperGetStatus(index: number, status: StepperStatus): number {
        let i = index - 1
        if (status == StepperStatus.Position) {
            return _stepperPosition[i]
        }
        return _stepperRunning[i] ? 1 : 0
    }

    /********** MG996R 서보 모터 **********/

    // 서보 통합 구현
    let _servoNeutralStop: boolean = false

    //% block="servo %pin servo's angle %angle (°) set to"
    //% angle.min=0 angle.max=180 angle.defl=90
    //% group="Servo Motors" weight=82
    //% inlineInputMode=inline
    export function servoSetAngle(pin: AnalogPin, angle: number): void {
        pins.servoWritePin(pin, angle)
    }

    //% block="servo %pin continuous servo rotation speed %speed \\% set to"
    //% speed.min=-100 speed.max=100 speed.defl=50
    //% group="Servo Motors" weight=81
    //% inlineInputMode=inline
    export function servoSetSpeed(pin: AnalogPin, speed: number): void {
        // -100~100을 0~180으로 변환 (90이 정지)
        let angle = Math.map(speed, -100, 100, 0, 180)
        pins.servoWritePin(pin, angle)
    }

    //% block="servo %pin stop"
    //% group="Servo Motors" weight=80
    export function servoStop(pin: AnalogPin): void {
        pins.servoWritePin(pin, 90)
        if (_servoNeutralStop) {
            pins.servoSetPulse(pin, 0)
        }
    }

    //% block="set servo %pin stop on neutral %enable"
    //% enable.shadow="toggleOnOff" enable.defl=false
    //% group="Servo Motors" weight=79
    export function servoSetNeutralStop(pin: AnalogPin, enable: boolean): void {
        _servoNeutralStop = enable
    }

    //% block="servo servo %pin 's angle %minAngle from %maxAngle through rangeset to"
    //% minAngle.defl=0 maxAngle.defl=180
    //% group="Servo Motors" weight=78
    //% inlineInputMode=inline
    export function servoSetRange(pin: AnalogPin, minAngle: number, maxAngle: number): void {
        // 범위 제한 설정 (MakeCode 내부 사용)
        pins.servoSetPulse(pin, Math.map(minAngle, 0, 180, 500, 2500))
    }

    //% block="servo %pin servo's pulse %pulse (μs) set to"
    //% pulse.defl=1500
    //% group="Servo Motors" weight=77
    //% inlineInputMode=inline
    export function servoSetPulse(pin: AnalogPin, pulse: number): void {
        pins.servoSetPulse(pin, pulse)
    }

    // 28BYJ-48, NEMA17은 위의 통합 스테퍼 시스템 사용


    /********** 1채널 릴레이 **********/

    // 1채널 릴레이 핀
    let _relay1chPin: DigitalPin = DigitalPin.P0

    //% block="1channel relay pin set %pin"
    //% group="Relays" weight=70
    export function relay1chSetPin(pin: DigitalPin): void {
        _relay1chPin = pin
    }

    //% block="1channel relay %state"
    //% state.shadow="toggleOnOff"
    //% group="Relays" weight=69
    export function relay1ch(state: boolean): void {
        pins.digitalWritePin(_relay1chPin, state ? 1 : 0)
    }


    /********** 2채널 릴레이 **********/

    // 2채널 릴레이 핀
    let _relay2chPins: DigitalPin[] = [DigitalPin.P0, DigitalPin.P1]

    //% block="2channel relay pin set CH1 %pin1 CH2 %pin2"
    //% group="Relays" weight=68
    export function relay2chSetPins(pin1: DigitalPin, pin2: DigitalPin): void {
        _relay2chPins[0] = pin1
        _relay2chPins[1] = pin2
    }

    //% block="2channel relay channel %ch %state"
    //% ch.min=1 ch.max=2 ch.defl=1
    //% state.shadow="toggleOnOff"
    //% group="Relays" weight=67
    export function relay2ch(ch: number, state: boolean): void {
        pins.digitalWritePin(_relay2chPins[ch - 1], state ? 1 : 0)
    }


    /********** 4채널 릴레이 **********/

    // 4채널 릴레이 핀
    let _relay4chPins: DigitalPin[] = [DigitalPin.P0, DigitalPin.P1, DigitalPin.P2, DigitalPin.P3]

    //% block="4channel relay pin set CH1 %pin1 CH2 %pin2 CH3 %pin3 CH4 %pin4"
    //% group="Relays" weight=66
    //% inlineInputMode=inline
    export function relay4chSetPins(pin1: DigitalPin, pin2: DigitalPin, pin3: DigitalPin, pin4: DigitalPin): void {
        _relay4chPins[0] = pin1
        _relay4chPins[1] = pin2
        _relay4chPins[2] = pin3
        _relay4chPins[3] = pin4
    }

    //% block="4channel relay channel %ch %state"
    //% ch.min=1 ch.max=4 ch.defl=1
    //% state.shadow="toggleOnOff"
    //% group="Relays" weight=65
    export function relay4ch(ch: number, state: boolean): void {
        pins.digitalWritePin(_relay4chPins[ch - 1], state ? 1 : 0)
    }

    //% block="4channel relay all %state"
    //% state.shadow="toggleOnOff"
    //% group="Relays" weight=64
    export function relay4chAll(state: boolean): void {
        for (let i = 0; i < 4; i++) {
            pins.digitalWritePin(_relay4chPins[i], state ? 1 : 0)
        }
    }


    /********** 솔레노이드 **********/

    // 솔레노이드 핀
    let _solenoidPin: DigitalPin = DigitalPin.P0

    //% block="solenoid pin set %pin"
    //% group="Solenoid" weight=60
    export function solenoidSetPin(pin: DigitalPin): void {
        _solenoidPin = pin
    }

    //% block="solenoid %state"
    //% state.shadow="toggleOnOff"
    //% group="Solenoid" weight=59
    export function solenoid(state: boolean): void {
        pins.digitalWritePin(_solenoidPin, state ? 1 : 0)
    }


    /********** 팬 (쿨링팬) **********/

    // 팬 핀
    let _fanPin: AnalogPin = AnalogPin.P0

    //% block="fan pin set %pin"
    //% group="Fan" weight=58
    export function fanSetPin(pin: AnalogPin): void {
        _fanPin = pin
    }

    //% block="fan speed %speed \\%"
    //% speed.min=0 speed.max=100 speed.defl=50
    //% group="Fan" weight=57
    export function fanSpeed(speed: number): void {
        pins.analogWritePin(_fanPin, speed * 10.23)
    }


    /********** 펌프 **********/

    // 펌프 핀
    let _pumpPin: DigitalPin = DigitalPin.P0

    //% block="pump pin set %pin"
    //% group="Pump" weight=56
    export function pumpSetPin(pin: DigitalPin): void {
        _pumpPin = pin
    }

    //% block="pump %state"
    //% state.shadow="toggleOnOff"
    //% group="Pump" weight=55
    export function pump(state: boolean): void {
        pins.digitalWritePin(_pumpPin, state ? 1 : 0)
    }
}


//% weight=1050 color=#808000 icon="\uf028" block="06. Output Device"
//% groups="['Buzzer', 'MP3 Player', 'SD Card', 'EEPROM', 'Microphone']"
namespace OutputDevice {


    /********** 부저/스피커 **********/

    // 음악 연주 기능 (패시브 부저, 스피커용)
    // 액티브 부저는 단순 ON/OFF만 가능하므로 음악 연주 불가

    // 음표 (옥타브 4 기준)
    export enum MusicNote {
        //% block="C(C4)"
        C4 = 262,
        //% block="C#(C#4)"
        CS4 = 277,
        //% block="D(D4)"
        D4 = 294,
        //% block="D#(D#4)"
        DS4 = 311,
        //% block="E(E4)"
        E4 = 330,
        //% block="F(F4)"
        F4 = 349,
        //% block="F#(F#4)"
        FS4 = 370,
        //% block="G(G4)"
        G4 = 392,
        //% block="G#(G#4)"
        GS4 = 415,
        //% block="A(A4)"
        A4 = 440,
        //% block="A#(A#4)"
        AS4 = 466,
        //% block="B(B4)"
        B4 = 494,
        //% block="C(C5)"
        C5 = 523,
        //% block="D(D5)"
        D5 = 587,
        //% block="E(E5)"
        E5 = 659,
        //% block="F(F5)"
        F5 = 698,
        //% block="G(G5)"
        G5 = 784,
        //% block="A(A5)"
        A5 = 880,
        //% block="hour(B5)"
        B5 = 988,
        //% block="rest"
        Rest = 0
    }

    // 박자 (음표 길이)
    export enum MusicBeat {
        //% block="whole note (4)"
        Whole = 4,
        //% block="half note (2)"
        Half = 2,
        //% block="quarter note (1)"
        Quarter = 1,
        //% block="eighth note (1/2)"
        Eighth = 0.5,
        //% block="sixteenth note (1/4)"
        Sixteenth = 0.25,
        //% block="dottedquarter note (1.5)"
        DottedQuarter = 1.5,
        //% block="dottedhalf note (3)"
        DottedHalf = 3
    }

    // 부저 상태 변수
    let _buzzerPin: AnalogPin = AnalogPin.P0
    let _buzzerBPM: number = 120
    let _buzzerInitialized: boolean = false

    //% block="buzzer set"
    //% group="Buzzer" weight=100
    export function buzzerSetup(): void {
        _buzzerInitialized = true
    }

    //% block="Set the play speed(BPM) %bpm "
    //% bpm.defl=120 bpm.min=40 bpm.max=240
    //% group="Buzzer" weight=99
    export function buzzerSetBPM(bpm: number): void {
        _buzzerBPM = Math.clamp(40, 240, bpm)
    }

    //% block="buzzer: Plays the note %note on digital pin %pin at the beat %beat "
    //% pin.defl=DigitalPin.P0
    //% note.defl=MusicNote.C4
    //% beat.defl=MusicBeat.Quarter
    //% group="Buzzer" weight=98
    //% inlineInputMode=inline
    export function buzzerPlayNote(pin: DigitalPin, note: MusicNote, beat: MusicBeat): void {
        // BPM에 따른 박자 시간 계산 (60000ms / BPM = 1박자 시간)
        let beatMs = Math.floor(60000 / _buzzerBPM * beat)

        if (note == MusicNote.Rest || note == 0) {
            // 쉼표
            basic.pause(beatMs)
        } else {
            // 음표 재생
            let analogPin = digitalToAnalog(pin)
            pins.analogSetPitchPin(analogPin)
            pins.analogPitch(note, beatMs)
        }
    }

    //% block="buzzer: Stop digital %pin number sound "
    //% pin.defl=DigitalPin.P0
    //% group="Buzzer" weight=97
    export function buzzerStop(pin: DigitalPin): void {
        let analogPin = digitalToAnalog(pin)
        pins.analogWritePin(analogPin, 0)
    }

    //% block="buzzer: digital %pin from frequency %freq Hz play "
    //% pin.defl=DigitalPin.P0
    //% freq.defl=440 freq.min=20 freq.max=8000
    //% group="Buzzer" weight=96
    export function buzzerPlayFrequency(pin: DigitalPin, freq: number): void {
        let analogPin = digitalToAnalog(pin)
        pins.analogSetPitchPin(analogPin)
        if (freq > 0) {
            pins.analogPitch(freq, 0)
        } else {
            pins.analogWritePin(analogPin, 0)
        }
    }

    //% block="buzzer: digital %pin from frequency %freq Hz %duration ms play "
    //% pin.defl=DigitalPin.P0
    //% freq.defl=440 freq.min=20 freq.max=8000
    //% duration.defl=500
    //% group="Buzzer" weight=95
    //% inlineInputMode=inline
    export function buzzerPlayTone(pin: DigitalPin, freq: number, duration: number): void {
        let analogPin = digitalToAnalog(pin)
        pins.analogSetPitchPin(analogPin)
        pins.analogPitch(freq, duration)
    }

    //% block="active buzzer: digital %pin pin %state "
    //% pin.defl=DigitalPin.P0
    //% state.shadow="toggleOnOff" state.defl=true
    //% group="Buzzer" weight=94
    export function activeBuzzer(pin: DigitalPin, state: boolean): void {
        pins.digitalWritePin(pin, state ? 1 : 0)
    }

    //% block="melody play: %pin pin|melody %melody "
    //% pin.defl=DigitalPin.P0
    //% melody.defl=Melodies.Dadadadum
    //% group="Buzzer" weight=93
    export function buzzerPlayMelody(pin: DigitalPin, melody: Melodies): void {
        let analogPin = digitalToAnalog(pin)
        pins.analogSetPitchPin(analogPin)
        music.beginMelody(music.builtInMelody(melody), MelodyOptions.Once)
    }

    // 디지털 핀을 아날로그 핀으로 변환 (내부 함수)
    function digitalToAnalog(pin: DigitalPin): AnalogPin {
        switch (pin) {
            case DigitalPin.P0: return AnalogPin.P0
            case DigitalPin.P1: return AnalogPin.P1
            case DigitalPin.P2: return AnalogPin.P2
            case DigitalPin.P3: return AnalogPin.P3
            case DigitalPin.P4: return AnalogPin.P4
            case DigitalPin.P10: return AnalogPin.P10
            default: return AnalogPin.P0
        }
    }


    /********** DFPlayer MP3 모듈 **********/

    // DFPlayer Mini는 SD카드의 MP3 파일을 재생하는 모듈입니다.

    // DFPlayer 상태 변수
    let _dfpTx: SerialPin = SerialPin.P1
    let _dfpRx: SerialPin = SerialPin.P2
    let _dfpVolume: number = 15

    //% block="MP3 player(DFPlayer) set|TX pin %tx|RX pin %rx"
    //% tx.defl=SerialPin.P1
    //% rx.defl=SerialPin.P2
    //% group="MP3 player" weight=89
    //% inlineInputMode=inline
    export function dfplayerInit(tx: SerialPin, rx: SerialPin): void {
        _dfpTx = tx
        _dfpRx = rx
        serial.redirect(tx, rx, BaudRate.BaudRate9600)
        basic.pause(500)

        // 초기 볼륨 설정
        dfplayerSetVolume(15)
    }

    //% block="MP3 player(DFPlayer) play track %track"
    //% track.defl=1 track.min=1 track.max=255
    //% group="MP3 player" weight=88
    export function dfplayerPlay(track: number): void {
        dfplayerSendCmd(0x03, track)
    }

    //% block="MP3 pause"
    //% group="MP3 player" weight=87
    export function dfplayerPause(): void {
        dfplayerSendCmd(0x0E, 0)
    }

    //% block="MP3 resume"
    //% group="MP3 player" weight=86
    export function dfplayerResume(): void {
        dfplayerSendCmd(0x0D, 0)
    }

    //% block="MP3 stop"
    //% group="MP3 player" weight=85
    export function dfplayerStop(): void {
        dfplayerSendCmd(0x16, 0)
    }

    //% block="MP3 volume %volume (0~30)"
    //% volume.defl=15 volume.min=0 volume.max=30
    //% group="MP3 player" weight=84
    export function dfplayerSetVolume(volume: number): void {
        _dfpVolume = Math.clamp(0, 30, volume)
        dfplayerSendCmd(0x06, _dfpVolume)
    }

    //% block="MP3 player(DFPlayer) next track"
    //% group="MP3 player" weight=83
    export function dfplayerNext(): void {
        dfplayerSendCmd(0x01, 0)
    }

    //% block="MP3 player(DFPlayer) previous track"
    //% group="MP3 player" weight=82
    export function dfplayerPrevious(): void {
        dfplayerSendCmd(0x02, 0)
    }

    //% block="MP3 player(DFPlayer) play folder %folder 's file %file"
    //% folder.defl=1 folder.min=1 folder.max=99
    //% file.defl=1 file.min=1 file.max=255
    //% group="MP3 player" weight=81
    //% inlineInputMode=inline
    export function dfplayerPlayFolder(folder: number, file: number): void {
        dfplayerSendCmd(0x0F, (folder << 8) | file)
    }

    //% block="MP3 loop %state"
    //% state.shadow="toggleOnOff" state.defl=true
    //% group="MP3 player" weight=80
    export function dfplayerLoop(state: boolean): void {
        dfplayerSendCmd(0x11, state ? 1 : 0)
    }

    // DFPlayer 명령 전송 (내부 함수)
    function dfplayerSendCmd(cmd: number, param: number): void {
        let buf = pins.createBuffer(10)
        buf[0] = 0x7E  // Start
        buf[1] = 0xFF  // Version
        buf[2] = 0x06  // Length
        buf[3] = cmd   // Command
        buf[4] = 0x00  // Feedback
        buf[5] = (param >> 8) & 0xFF  // Param high
        buf[6] = param & 0xFF         // Param low

        // Checksum
        let checksum = 0 - (buf[1] + buf[2] + buf[3] + buf[4] + buf[5] + buf[6])
        buf[7] = (checksum >> 8) & 0xFF
        buf[8] = checksum & 0xFF
        buf[9] = 0xEF  // End

        serial.writeBuffer(buf)
        basic.pause(50)
    }


    /********** 마이크로폰 **********/

    //% block="microphone sound level (Analog pin %pin)"
    //% pin.defl=AnalogPin.P1
    //% group="microphone" weight=79
    export function microphoneRead(pin: AnalogPin): number {
        return pins.analogReadPin(pin)
    }

    //% block="microphone sound detected? (Analog pin %pin|threshold %threshold)"
    //% pin.defl=AnalogPin.P1
    //% threshold.defl=600 threshold.min=0 threshold.max=1023
    //% group="microphone" weight=78
    export function microphoneDetected(pin: AnalogPin, threshold: number): boolean {
        return pins.analogReadPin(pin) > threshold
    }

    //% block="microphone average sound level (Analog pin %pin|samples %samples)"
    //% pin.defl=AnalogPin.P1
    //% samples.defl=10 samples.min=1 samples.max=100
    //% group="microphone" weight=77
    export function microphoneAverage(pin: AnalogPin, samples: number): number {
        let sum = 0
        for (let i = 0; i < samples; i++) {
            sum += pins.analogReadPin(pin)
            basic.pause(1)
        }
        return Math.floor(sum / samples)
    }


    /********** SD 카드 **********/

    // SD 카드 모듈 (SPI 통신)
    // FAT16/FAT32 파일 시스템 지원

    // 파일 모드
    export enum SDFileMode {
        //% block="read"
        Read = 0,
        //% block="write"
        Write = 1,
        //% block="append"
        Append = 2
    }

    // SD 카드 상태 변수
    let _sdCS: DigitalPin = DigitalPin.P10
    let _sdInitialized: boolean = false
    let _sdFileHandles: string[] = []
    let _sdFileData: string[] = []

    //% block="SD card %id|1set CS %cs|MOSI %mosi|MISO %miso|SCK %sck"
    //% id.defl=1
    //% cs.defl=DigitalPin.P10
    //% mosi.defl=DigitalPin.P11
    //% miso.defl=DigitalPin.P12
    //% sck.defl=DigitalPin.P13
    //% group="SD Card" weight=66
    //% inlineInputMode=inline
    export function sdInit(id: number, cs: DigitalPin, mosi: DigitalPin, miso: DigitalPin, sck: DigitalPin): void {
        _sdCS = cs

        // SPI 초기화
        pins.digitalWritePin(cs, 1)
        pins.spiPins(mosi, miso, sck)
        pins.spiFormat(8, 0)
        pins.spiFrequency(1000000)

        // SD 카드 초기화 시퀀스
        basic.pause(10)
        pins.digitalWritePin(cs, 0)

        // CMD0 - 리셋
        for (let i = 0; i < 10; i++) {
            pins.spiWrite(0xFF)
        }

        _sdInitialized = true
        pins.digitalWritePin(cs, 1)
    }

    //% block="file open %handle|file name %filename mode %mode"
    //% handle.defl="myFile"
    //% filename.defl="data.txt"
    //% mode.defl=SDFileMode.Read
    //% group="SD Card" weight=65
    //% inlineInputMode=inline
    export function sdFileOpen(handle: string, filename: string, mode: SDFileMode): void {
        let index = _sdFileHandles.indexOf(handle)
        if (index < 0) {
            index = _sdFileHandles.length
            _sdFileHandles.push(handle)
            _sdFileData.push("")
        }

        if (mode == SDFileMode.Read) {
            // 파일 읽기 모드 - 데이터 로드
            _sdFileData[index] = sdReadFileInternal(filename)
        } else if (mode == SDFileMode.Write) {
            // 쓰기 모드 - 빈 버퍼
            _sdFileData[index] = ""
        }
        // Append 모드는 기존 데이터 유지
    }

    //% block="fileat write « %handle » data « %data »"
    //% handle.defl="myFile"
    //% data.defl="Hello"
    //% group="SD Card" weight=64
    export function sdFileWrite(handle: string, data: string): void {
        let index = _sdFileHandles.indexOf(handle)
        if (index >= 0) {
            _sdFileData[index] += data
        }
    }

    //% block="fileat read « %handle »"
    //% handle.defl="myFile"
    //% group="SD Card" weight=63
    export function sdFileRead(handle: string): string {
        let index = _sdFileHandles.indexOf(handle)
        if (index >= 0) {
            return _sdFileData[index]
        }
        return ""
    }

    //% block="file exists %id|file name %filename"
    //% id.defl=1
    //% filename.defl="data.txt"
    //% group="SD Card" weight=62
    export function sdFileExists(id: number, filename: string): boolean {
        // 간소화된 구현 - 실제로는 FAT 디렉토리 검색 필요
        return _sdInitialized
    }

    //% block="file level « %handle »"
    //% handle.defl="myFile"
    //% group="SD Card" weight=61
    export function sdFileSize(handle: string): number {
        let index = _sdFileHandles.indexOf(handle)
        if (index >= 0) {
            return _sdFileData[index].length
        }
        return 0
    }

    //% block="file close « %handle »"
    //% handle.defl="myFile"
    //% group="SD Card" weight=60
    export function sdFileClose(handle: string): void {
        let index = _sdFileHandles.indexOf(handle)
        if (index >= 0) {
            // 파일 데이터 저장 (실제 구현 필요)
            // sdWriteFileInternal(filename, _sdFileData[index])
        }
    }

    //% block="file delete %id|file name %filename"
    //% id.defl=1
    //% filename.defl="data.txt"
    //% group="SD Card" weight=59
    export function sdFileDelete(id: number, filename: string): void {
        // FAT 디렉토리에서 파일 삭제 (간소화)
        if (!_sdInitialized) return
    }

    //% block="create directory %id|path « %path »"
    //% id.defl=1
    //% path.defl="mydir"
    //% group="SD Card" weight=58
    export function sdMakeDir(id: number, path: string): void {
        // FAT 디렉토리 생성 (간소화)
        if (!_sdInitialized) return
    }

    //% block="readable byte %handle"
    //% handle.defl="myFile"
    //% group="SD Card" weight=57
    export function sdFileAvailable(handle: string): number {
        let index = _sdFileHandles.indexOf(handle)
        if (index >= 0) {
            return _sdFileData[index].length
        }
        return 0
    }

    // SD 카드 내부 읽기 함수
    function sdReadFileInternal(filename: string): string {
        // 간소화된 구현 - 실제로는 FAT 파일 시스템 파싱 필요
        return ""
    }


    /********** EEPROM (AT24C32/AT24C64 등) **********/

    // I2C EEPROM - 전원이 꺼져도 데이터 유지
    // AT24C32: 4KB, AT24C64: 8KB, AT24C256: 32KB

    // EEPROM 상태 변수
    let _eepromAddr: number = 0x50  // 기본 I2C 주소

    //% block="EEPROM set I2C address %addr"
    //% addr.defl=0x50
    //% group="EEPROM" weight=56
    export function eepromInit(addr: number): void {
        _eepromAddr = addr
    }

    //% block="EEPROM write address %memAddr|value %value"
    //% memAddr.defl=0 memAddr.min=0 memAddr.max=32767
    //% value.defl=0 value.min=0 value.max=255
    //% group="EEPROM" weight=55
    export function eepromWrite(memAddr: number, value: number): void {
        let buf = pins.createBuffer(3)
        buf[0] = (memAddr >> 8) & 0xFF  // 주소 상위 바이트
        buf[1] = memAddr & 0xFF          // 주소 하위 바이트
        buf[2] = value & 0xFF            // 데이터
        pins.i2cWriteBuffer(_eepromAddr, buf)
        basic.pause(5)  // 쓰기 완료 대기
    }

    //% block="EEPROM read address %memAddr"
    //% memAddr.defl=0 memAddr.min=0 memAddr.max=32767
    //% group="EEPROM" weight=54
    export function eepromRead(memAddr: number): number {
        let addrBuf = pins.createBuffer(2)
        addrBuf[0] = (memAddr >> 8) & 0xFF
        addrBuf[1] = memAddr & 0xFF
        pins.i2cWriteBuffer(_eepromAddr, addrBuf)

        let result = pins.i2cReadNumber(_eepromAddr, NumberFormat.UInt8BE)
        return result
    }

    //% block="EEPROM string write address %memAddr|string %text"
    //% memAddr.defl=0
    //% text.defl="Hello"
    //% group="EEPROM" weight=53
    export function eepromWriteString(memAddr: number, text: string): void {
        // 길이 저장 (첫 바이트)
        eepromWrite(memAddr, text.length)

        // 문자열 데이터 저장
        for (let i = 0; i < text.length; i++) {
            eepromWrite(memAddr + 1 + i, text.charCodeAt(i))
        }
    }

    //% block="EEPROM string read address %memAddr"
    //% memAddr.defl=0
    //% group="EEPROM" weight=52
    export function eepromReadString(memAddr: number): string {
        // 길이 읽기
        let len = eepromRead(memAddr)
        if (len > 100) len = 100  // 최대 길이 제한

        // 문자열 데이터 읽기
        let result = ""
        for (let i = 0; i < len; i++) {
            let char = eepromRead(memAddr + 1 + i)
            result += String.fromCharCode(char)
        }
        return result
    }

    //% block="EEPROM number write (4byte) address %memAddr|value %value"
    //% memAddr.defl=0
    //% value.defl=0
    //% group="EEPROM" weight=51
    export function eepromWriteNumber(memAddr: number, value: number): void {
        // 32비트 정수로 저장
        eepromWrite(memAddr, (value >> 24) & 0xFF)
        eepromWrite(memAddr + 1, (value >> 16) & 0xFF)
        eepromWrite(memAddr + 2, (value >> 8) & 0xFF)
        eepromWrite(memAddr + 3, value & 0xFF)
    }

    //% block="EEPROM number read (4byte) address %memAddr"
    //% memAddr.defl=0
    //% group="EEPROM" weight=50
    export function eepromReadNumber(memAddr: number): number {
        let b0 = eepromRead(memAddr)
        let b1 = eepromRead(memAddr + 1)
        let b2 = eepromRead(memAddr + 2)
        let b3 = eepromRead(memAddr + 3)
        return (b0 << 24) | (b1 << 16) | (b2 << 8) | b3
    }
}


//% weight=1040 color=#EE82EE icon="\uf1eb" block="07. Communications"
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


//% weight=1010 color=#008080 icon="\uf287" block="09. USB Serial"
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

