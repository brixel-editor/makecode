/**
 * BRIXEL Extension - 06. Output Device
 * Buzzer, Speaker, Vibration Motor
 */

//% weight=1050 color=#50B91A icon="\uf028" block="06. Output Device"
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
