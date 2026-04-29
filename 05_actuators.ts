/**
 * BRIXEL Extension - 05. Actuators
 * Servo, DC Motor, Stepper Motor, Relay, Solenoid
 */

//% weight=1060 color=#50B91A icon="\uf013" block="05. Actuators"
//% groups="['Servo Motors', '5Kg GeekServo', 'Green GeekServo', 'Stepper Motors', 'DC모터(L298N)', 'DC모터(L293D)', '듀얼 H-브리지 모터(TB6612FNG)', '듀얼 H-브리지 DC 모터(DRV8833)', 'DC모터 드라이버(PCA9685)', 'Relays', 'Solenoid', 'Fan모터', 'Pump모터']"
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
    //% group="DC모터(L298N)" weight=100
    export function l298nSetPinsA(ena: AnalogPin, in1: DigitalPin, in2: DigitalPin): void {
        _l298nENA = ena
        _l298nIN1 = in1
        _l298nIN2 = in2
    }

    //% block="L298N motorB pin set ENB %enb IN3 %in3 IN4 %in4"
    //% group="DC모터(L298N)" weight=99
    export function l298nSetPinsB(enb: AnalogPin, in3: DigitalPin, in4: DigitalPin): void {
        _l298nENB = enb
        _l298nIN3 = in3
        _l298nIN4 = in4
    }

    //% block="L298N motorA speed %speed"
    //% speed.min=-100 speed.max=100 speed.defl=0
    //% group="DC모터(L298N)" weight=98
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
    //% group="DC모터(L298N)" weight=97
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
    //% group="DC모터(L293D)" weight=96
    export function l293dSetPins1(en1: AnalogPin, in1: DigitalPin, in2: DigitalPin): void {
        _l293dEN1 = en1
        _l293dIN1 = in1
        _l293dIN2 = in2
    }

    //% block="L293D motor2 pin set EN2 %en2 IN3 %in3 IN4 %in4"
    //% group="DC모터(L293D)" weight=95
    export function l293dSetPins2(en2: AnalogPin, in3: DigitalPin, in4: DigitalPin): void {
        _l293dEN2 = en2
        _l293dIN3 = in3
        _l293dIN4 = in4
    }

    //% block="L293D motor1 speed %speed"
    //% speed.min=-100 speed.max=100 speed.defl=0
    //% group="DC모터(L293D)" weight=94
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
    //% group="DC모터(L293D)" weight=93
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
    //% group="듀얼 H-브리지 모터(TB6612FNG)" weight=92
    export function tb6612SetPinsA(pwma: AnalogPin, ain1: DigitalPin, ain2: DigitalPin, stby: DigitalPin): void {
        _tb6612PWMA = pwma
        _tb6612AIN1 = ain1
        _tb6612AIN2 = ain2
        _tb6612STBY = stby
        pins.digitalWritePin(_tb6612STBY, 1)
    }

    //% block="TB6612FNG motorB pin set PWMB %pwmb BIN1 %bin1 BIN2 %bin2"
    //% group="듀얼 H-브리지 모터(TB6612FNG)" weight=91
    export function tb6612SetPinsB(pwmb: AnalogPin, bin1: DigitalPin, bin2: DigitalPin): void {
        _tb6612PWMB = pwmb
        _tb6612BIN1 = bin1
        _tb6612BIN2 = bin2
    }

    //% block="TB6612FNG motorA speed %speed"
    //% speed.min=-100 speed.max=100 speed.defl=0
    //% group="듀얼 H-브리지 모터(TB6612FNG)" weight=90
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
    //% group="듀얼 H-브리지 모터(TB6612FNG)" weight=89
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
    //% group="듀얼 H-브리지 DC 모터(DRV8833)" weight=88
    export function drv8833SetPinsA(ain1: AnalogPin, ain2: AnalogPin): void {
        _drv8833AIN1 = ain1
        _drv8833AIN2 = ain2
    }

    //% block="DRV8833 motorB pin set BIN1 %bin1 BIN2 %bin2"
    //% group="듀얼 H-브리지 DC 모터(DRV8833)" weight=87
    export function drv8833SetPinsB(bin1: AnalogPin, bin2: AnalogPin): void {
        _drv8833BIN1 = bin1
        _drv8833BIN2 = bin2
    }

    //% block="DRV8833 motorA speed %speed"
    //% speed.min=-100 speed.max=100 speed.defl=0
    //% group="듀얼 H-브리지 DC 모터(DRV8833)" weight=86
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
    //% group="듀얼 H-브리지 DC 모터(DRV8833)" weight=85
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

    /********** 5Kg GeekServo (360도 서보/DC모터 모드) **********/

    // GeekServo 방향
    export enum GeekServoDir {
        //% block="forward (CW)"
        CW = 0,
        //% block="backward (CCW)"
        CCW = 1
    }

    //% block="5Kg GeekServo setup pin %pin"
    //% group="5Kg GeekServo" weight=60
    export function geekServoSetup(pin: AnalogPin): void {
        // 초기 중립 펄스 전송하여 서보 초기화
        pins.servoSetPulse(pin, 1500)
    }

    //% block="5Kg GeekServo pin %pin set angle %degrees (0~360)"
    //% degrees.min=0 degrees.max=360 degrees.defl=0
    //% group="5Kg GeekServo" weight=59
    //% inlineInputMode=inline
    export function geekServoAngle360(pin: AnalogPin, degrees: number): void {
        if (degrees < 0) degrees = 0
        if (degrees > 360) degrees = 360

        // 구간별 매핑 (Piecewise Mapping) - Arduino 라이브러리와 동일
        let p0 = 500
        let p90 = 990
        let p180 = 1510
        let p270 = 2020
        let p360 = 2500
        let us = 1500

        if (degrees <= 90) {
            us = Math.map(degrees, 0, 90, p0, p90)
        } else if (degrees <= 180) {
            us = Math.map(degrees, 90, 180, p90, p180)
        } else if (degrees <= 270) {
            us = Math.map(degrees, 180, 270, p180, p270)
        } else {
            us = Math.map(degrees, 270, 360, p270, p360)
        }

        pins.servoSetPulse(pin, us)
    }

    //% block="5Kg GeekServo wheel pin %pin speed %speed direction %dir"
    //% speed.min=0 speed.max=100 speed.defl=100
    //% group="5Kg GeekServo" weight=58
    //% inlineInputMode=inline
    export function geekServoWheel(pin: AnalogPin, speed: number, dir: GeekServoDir): void {
        if (speed < 0) speed = 0
        if (speed > 100) speed = 100

        let us = 4000 // 중립 (정지)
        if (dir == GeekServoDir.CW) {
            us = Math.map(speed, 0, 100, 4000, 5000)
        } else {
            us = Math.map(speed, 0, 100, 4000, 3000)
        }

        pins.servoSetPulse(pin, us)
    }

    //% block="5Kg GeekServo wheel pin %pin speed %speed direction %dir duration %duration ms"
    //% speed.min=0 speed.max=100 speed.defl=100
    //% duration.defl=1000
    //% group="5Kg GeekServo" weight=57
    //% inlineInputMode=inline
    export function geekServoWheelTimed(pin: AnalogPin, speed: number, dir: GeekServoDir, duration: number): void {
        geekServoWheel(pin, speed, dir)
        basic.pause(duration)
        geekServoWheel(pin, 0, GeekServoDir.CW)
    }

    //% block="5Kg GeekServo stop pin %pin"
    //% group="5Kg GeekServo" weight=56
    export function geekServoStop(pin: AnalogPin): void {
        pins.servoSetPulse(pin, 4000)
    }


    /********** Green GeekServo (연속회전 서보, 500~2500μs) **********/

    //% block="Green GeekServo setup pin %pin"
    //% group="Green GeekServo" weight=55
    export function greenGeekServoSetup(pin: AnalogPin): void {
        pins.servoSetPulse(pin, 1500)
    }

    //% block="Green GeekServo wheel pin %pin speed %speed direction %dir"
    //% speed.min=0 speed.max=100 speed.defl=100
    //% group="Green GeekServo" weight=54
    //% inlineInputMode=inline
    export function greenGeekServoWheel(pin: AnalogPin, speed: number, dir: GeekServoDir): void {
        if (speed < 0) speed = 0
        if (speed > 100) speed = 100

        let us = 1500 // 중립 (정지)
        if (dir == GeekServoDir.CW) {
            us = Math.map(speed, 0, 100, 1500, 2500)
        } else {
            us = Math.map(speed, 0, 100, 1500, 500)
        }

        pins.servoSetPulse(pin, us)
    }

    //% block="Green GeekServo wheel pin %pin speed %speed direction %dir duration %duration ms"
    //% speed.min=0 speed.max=100 speed.defl=100
    //% duration.defl=1000
    //% group="Green GeekServo" weight=53
    //% inlineInputMode=inline
    export function greenGeekServoWheelTimed(pin: AnalogPin, speed: number, dir: GeekServoDir, duration: number): void {
        greenGeekServoWheel(pin, speed, dir)
        basic.pause(duration)
        greenGeekServoWheel(pin, 0, GeekServoDir.CW)
    }

    //% block="Green GeekServo stop pin %pin"
    //% group="Green GeekServo" weight=52
    export function greenGeekServoStop(pin: AnalogPin): void {
        pins.servoSetPulse(pin, 1500)
    }


    /********** DC모터 드라이버 (PCA9685) **********/

    // PCA9685 상태 저장
    let _pca9685Addr: number[] = [0x40, 0x40, 0x40, 0x40]
    let _pca9685Initialized: boolean[] = [false, false, false, false]

    // PCA9685 레지스터
    const PCA9685_MODE1 = 0x00
    const PCA9685_PRESCALE = 0xFE
    const PCA9685_LED0_ON_L = 0x06

    // PCA9685 채널 하나에 PWM 설정
    function pca9685SetPWM(addr: number, channel: number, on: number, off: number): void {
        let reg = PCA9685_LED0_ON_L + 4 * channel
        let buf = pins.createBuffer(5)
        buf[0] = reg
        buf[1] = on & 0xFF
        buf[2] = (on >> 8) & 0xFF
        buf[3] = off & 0xFF
        buf[4] = (off >> 8) & 0xFF
        pins.i2cWriteBuffer(addr, buf)
    }

    // PCA9685 채널에 값 설정 (0~4095)
    function pca9685SetPin(addr: number, channel: number, value: number): void {
        if (value >= 4095) {
            pca9685SetPWM(addr, channel, 4096, 0)
        } else if (value <= 0) {
            pca9685SetPWM(addr, channel, 0, 0)
        } else {
            pca9685SetPWM(addr, channel, 0, value)
        }
    }

    // PCA9685 초기화
    function pca9685Init(addr: number): void {
        // Reset
        let buf = pins.createBuffer(2)
        buf[0] = PCA9685_MODE1
        buf[1] = 0x00
        pins.i2cWriteBuffer(addr, buf)
        basic.pause(5)

        // Sleep mode for prescale setting
        buf[0] = PCA9685_MODE1
        buf[1] = 0x10 // sleep
        pins.i2cWriteBuffer(addr, buf)

        // Set prescale for ~1000Hz (for DC motor PWM)
        // prescale = round(25MHz / (4096 * freq)) - 1
        // for 1000Hz: round(25000000 / (4096 * 1000)) - 1 = 5
        buf[0] = PCA9685_PRESCALE
        buf[1] = 5
        pins.i2cWriteBuffer(addr, buf)

        // Restart
        buf[0] = PCA9685_MODE1
        buf[1] = 0xA0 // auto-increment + restart
        pins.i2cWriteBuffer(addr, buf)
        basic.pause(5)
    }

    // PCA9685 모터 정지 대상
    export enum PCA9685StopTarget {
        //% block="All"
        All = 0,
        //% block="Wheel A"
        WheelA = 1,
        //% block="Wheel B"
        WheelB = 2
    }

    //% block="DC Motor Driver(PCA9685) %index I2C address %addr"
    //% index.min=1 index.max=4 index.defl=1
    //% addr.defl=0x40
    //% group="DC모터 드라이버(PCA9685)" weight=50
    //% inlineInputMode=inline
    export function pca9685DcMotorSetup(index: number, addr: number): void {
        let i = index - 1
        _pca9685Addr[i] = addr
        pca9685Init(addr)
        _pca9685Initialized[i] = true
    }

    //% block="Motor Driver %index Wheel A direction %dir speed %speed \\%"
    //% index.min=1 index.max=4 index.defl=1
    //% dir.min=0 dir.max=1 dir.defl=0
    //% speed.min=0 speed.max=100 speed.defl=50
    //% group="DC모터 드라이버(PCA9685)" weight=49
    //% inlineInputMode=inline
    export function pca9685DcMotorWheelA(index: number, dir: number, speed: number): void {
        let i = index - 1
        let addr = _pca9685Addr[i]
        let spd = Math.map(Math.constrain(speed, 0, 100), 0, 100, 0, 4095)

        // CH0: IN1, CH1: PWM(속도), CH2: IN2
        if (dir == 0) {
            pca9685SetPin(addr, 0, 4095)
            pca9685SetPin(addr, 1, spd)
            pca9685SetPin(addr, 2, 0)
        } else {
            pca9685SetPin(addr, 0, 0)
            pca9685SetPin(addr, 1, spd)
            pca9685SetPin(addr, 2, 4095)
        }
    }

    //% block="Motor Driver %index Wheel B direction %dir speed %speed \\%"
    //% index.min=1 index.max=4 index.defl=1
    //% dir.min=0 dir.max=1 dir.defl=0
    //% speed.min=0 speed.max=100 speed.defl=50
    //% group="DC모터 드라이버(PCA9685)" weight=48
    //% inlineInputMode=inline
    export function pca9685DcMotorWheelB(index: number, dir: number, speed: number): void {
        let i = index - 1
        let addr = _pca9685Addr[i]
        let spd = Math.map(Math.constrain(speed, 0, 100), 0, 100, 0, 4095)

        // CH3: IN1, CH4: PWM(속도), CH5: IN2 - B모터 방향 반전
        if (dir == 0) {
            pca9685SetPin(addr, 3, 0)
            pca9685SetPin(addr, 4, spd)
            pca9685SetPin(addr, 5, 4095)
        } else {
            pca9685SetPin(addr, 3, 4095)
            pca9685SetPin(addr, 4, spd)
            pca9685SetPin(addr, 5, 0)
        }
    }

    //% block="Motor Driver %index stop %target"
    //% index.min=1 index.max=4 index.defl=1
    //% group="DC모터 드라이버(PCA9685)" weight=47
    //% inlineInputMode=inline
    export function pca9685DcMotorStop(index: number, target: PCA9685StopTarget): void {
        let i = index - 1
        let addr = _pca9685Addr[i]

        if (target == PCA9685StopTarget.All || target == PCA9685StopTarget.WheelA) {
            pca9685SetPin(addr, 0, 0)
            pca9685SetPin(addr, 1, 0)
            pca9685SetPin(addr, 2, 0)
        }
        if (target == PCA9685StopTarget.All || target == PCA9685StopTarget.WheelB) {
            pca9685SetPin(addr, 3, 0)
            pca9685SetPin(addr, 4, 0)
            pca9685SetPin(addr, 5, 0)
        }
    }

    //% block="Motor Driver %index Wheel A direction %dir speed %speed \\% duration %duration ms"
    //% index.min=1 index.max=4 index.defl=1
    //% dir.min=0 dir.max=1 dir.defl=0
    //% speed.min=0 speed.max=100 speed.defl=50
    //% duration.defl=1000
    //% group="DC모터 드라이버(PCA9685)" weight=46
    //% inlineInputMode=inline
    export function pca9685DcMotorWheelATimed(index: number, dir: number, speed: number, duration: number): void {
        pca9685DcMotorWheelA(index, dir, speed)
        basic.pause(duration)
        pca9685DcMotorStop(index, PCA9685StopTarget.WheelA)
    }

    //% block="Motor Driver %index Wheel B direction %dir speed %speed \\% duration %duration ms"
    //% index.min=1 index.max=4 index.defl=1
    //% dir.min=0 dir.max=1 dir.defl=0
    //% speed.min=0 speed.max=100 speed.defl=50
    //% duration.defl=1000
    //% group="DC모터 드라이버(PCA9685)" weight=45
    //% inlineInputMode=inline
    export function pca9685DcMotorWheelBTimed(index: number, dir: number, speed: number, duration: number): void {
        pca9685DcMotorWheelB(index, dir, speed)
        basic.pause(duration)
        pca9685DcMotorStop(index, PCA9685StopTarget.WheelB)
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
    //% group="Fan모터" weight=58
    export function fanSetPin(pin: AnalogPin): void {
        _fanPin = pin
    }

    //% block="fan speed %speed \\%"
    //% speed.min=0 speed.max=100 speed.defl=50
    //% group="Fan모터" weight=57
    export function fanSpeed(speed: number): void {
        pins.analogWritePin(_fanPin, speed * 10.23)
    }


    /********** 펌프 **********/

    // 펌프 핀
    let _pumpPin: DigitalPin = DigitalPin.P0

    //% block="pump pin set %pin"
    //% group="Pump모터" weight=56
    export function pumpSetPin(pin: DigitalPin): void {
        _pumpPin = pin
    }

    //% block="pump %state"
    //% state.shadow="toggleOnOff"
    //% group="Pump모터" weight=55
    export function pump(state: boolean): void {
        pins.digitalWritePin(_pumpPin, state ? 1 : 0)
    }
}
