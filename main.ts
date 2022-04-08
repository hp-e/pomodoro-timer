const BUTTON_LONG_CLICK = 4;
const MAX_ALLOWED_MINUTES = 25;
const MAX_STEP = 5
const MIN_STEP = 1

const WORKTIME = 25
const SHORTBREAK = 5
const LONGBREAK = 20
const POMODOROS = 4

enum TimerState {
    stopped,
    started,
    paused
}

enum TimerMode {
    working,
    pausing,
    off
}

let pomodoroCount = 0;
let mode: TimerMode = TimerMode.working;

let _enableSound = false;
let _elapsed = 0
let _listY: number[] = []
let _listX: number[] = []

let timerState: TimerState = TimerState.stopped;

let minuteStep = 5

let minutes = 25
let remainingMinutes = minutes

initList()
reset()

enterWorkMode()

control.onEvent(EventBusSource.MICROBIT_ID_BUTTON_AB, BUTTON_LONG_CLICK, () => {
    _enableSound = !_enableSound
    basic.showNumber(+_enableSound);
    playMelody(Melodies.JumpUp);
    blinkLeds(3)
    renderScreen()
})

control.onEvent(EventBusSource.MICROBIT_ID_BUTTON_B, BUTTON_LONG_CLICK, stopTimer)

input.onButtonPressed(Button.AB, toggleMode)
input.onButtonPressed(Button.B, toggleTimer)

control.onEvent(EventBusSource.MICROBIT_ID_BUTTON_A, BUTTON_LONG_CLICK, () => {
    let plotOnY = 2;

    minuteStep = minuteStep == MAX_STEP ? MIN_STEP : MAX_STEP;

    basic.clearScreen()

    if (minuteStep == MAX_STEP) {
        for (let x = 0; x <= minuteStep - 1; x++) {
            led.plot(x, plotOnY)
        }
    } else {
        led.plot(plotOnY, plotOnY)
    }

    blinkLeds(3)

    renderScreen();
})

input.onButtonPressed(Button.A, () => {

    if (timerState == TimerState.stopped) {

        if (minutes >= MAX_ALLOWED_MINUTES) {
            minutes = minuteStep;
        } else {
            minutes += minutes % 5 > 0 && minuteStep == MAX_STEP ? 5 - (minutes % 5) : minuteStep;
        }

        remainingMinutes = minutes
        renderScreen()
    }
})

function initList() {
    for (let y = 0; y < MAX_STEP; y++) {
        for (let x = 0; x < MAX_STEP; x++) {
            _listX.push(x)
            _listY.push(y)
        }
    }
}

function reset() {
    basic.clearScreen()
    setDefaultValues()
    renderScreen()
}

function stopTimer() {
    if (timerState != TimerState.stopped) {
        timerState = TimerState.stopped
        basic.clearScreen()
        basic.showLeds(`
                . . . . .
                . # # # .
                . # . # .
                . # # # .
                . . . . .
            `)
        blinkLeds()
        reset()
    }
}

function blinkLeds(times: number = 3, msout: number = 300, msin: number = 500) {
    for (let index = 0; index <= times; index++) {
        led.fadeOut(msout)
        led.fadeIn(msin)
    }
}
function pauseTimer() {
    timerState = TimerState.paused
}

function startTimer() {
    renderScreen()
    timerState = TimerState.started
}

function playMelody(melody: Melodies) {
    if (_enableSound) {
        music.startMelody(music.builtInMelody(melody), MelodyOptions.OnceInBackground)
    }
}

function playSound(frequency: number) {
    if (_enableSound) {
        music.playTone(frequency, music.beat(BeatFraction.Sixteenth))
    }
}

function toggleMode() {
    if (mode === TimerMode.working) {
        enterPauseMode()
    } else {
        enterWorkMode()
    }
}

function toggleTimer() {
    if (timerState != TimerState.started) {
        startTimer()
    } else {
        pauseTimer()
    }
}

function endTimer() {

    timerState = TimerState.stopped
    playMelody(Melodies.Funk)
    basic.showIcon(IconNames.No)

    blinkLeds(5)
    reset()
}

function setDefaultValues() {

    timerState = TimerState.stopped
    remainingMinutes = minutes
    _elapsed = 0
}

function renderScreen() {
    basic.clearScreen()
    let x = 0
    let y = 0
    let minIdx = remainingMinutes - 1
    for (let index = 0; index < remainingMinutes; index++) {
        x = _listX[index]
        y = _listY[index]
        led.plot(x, y)
    }
}

function enterWorkMode() {
    playMelody(Melodies.Funk)
    pomodoroCount++;
    mode = TimerMode.working;
    minutes = WORKTIME;
    remainingMinutes = WORKTIME;
    basic.showNumber(pomodoroCount);
    blinkLeds(3);
    renderScreen()
}

function enterPauseMode() {
    playMelody(Melodies.Funk)
    mode = TimerMode.pausing;
    
    if (pomodoroCount === POMODOROS) {
        pomodoroCount = 0;
        minutes = LONGBREAK
    } else {
        minutes = SHORTBREAK             
    }
    // remainingMinutes = ++pomodoroCount == POMODOROS ? LONGBREAK : SHORTBREAK;
    remainingMinutes = minutes;
    renderScreen()
}

loops.everyInterval(1000, () => {
    let x: number;
    let y: number;

    if (timerState == TimerState.started) {
        _elapsed = _elapsed + 1
        x = _listX[remainingMinutes - 1]
        y = _listY[remainingMinutes - 1]
        led.toggle(x, y)
        if (_elapsed == 60) {
            _elapsed = 0
            remainingMinutes = remainingMinutes - 1
            renderScreen()            
        }

        if (remainingMinutes <= 0) {
            if (mode == TimerMode.working) {
                enterPauseMode();
            } else if (mode == TimerMode.pausing) {
                enterWorkMode();
            } else {
                endTimer()
            }
        }

    }

    if (timerState == TimerState.paused) {
        led.fadeOut(100)
        basic.showLeds(`
            . . . . .
            . # . # .
            . # . # .
            . # . # .
            . . . . .
        `)
        led.fadeIn(300)
    }

})

