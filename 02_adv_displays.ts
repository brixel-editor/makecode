/**
 * BRIXEL Extension - 02. Advanced Displays
 * OLED, MAX7219, HT16K33, 74HC595, TFT (ST7735, ILI9341)
 */

//% weight=1090 color=#FAC907 icon="\uf108" block="02. Adv Displays"
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

    //% block="I2C matrix screen clear"
    //% group="HT16K33" weight=63
    export function ht16k33Clear(): void {
        for (let i = 0; i < 16; i++) {
            _ht16k33Buffer[i] = 0
        }
        ht16k33Refresh(1)
    }

    //% block="I2C matrix brightness(0-15) %brightness"
    //% brightness.defl=15 brightness.min=0 brightness.max=15
    //% group="HT16K33" weight=62
    export function ht16k33SetBrightness(brightness: number): void {
        _ht16k33Brightness = Math.clamp(0, 15, brightness)
        pins.i2cWriteNumber(_ht16k33Addr, 0xE0 | _ht16k33Brightness, NumberFormat.UInt8BE)
    }

    //% block="I2C matrix blink %blink"
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
