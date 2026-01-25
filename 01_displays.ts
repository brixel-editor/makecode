/**
 * BRIXEL Extension - 01. Displays
 * LCD1602, LCD2004, TM1637, NeoPixel
 */

//% weight=1100 color=#FAC907 icon="\uf108" block="01. Displays"
//% groups="['LCD', '숫자표시장치(TM1637)', '네오픽셀(NeoPixel)']"
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
    //% addr.defl=0x20
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
