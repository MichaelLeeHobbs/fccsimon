'use strict';

angular.module('myApp.view1', ['ngRoute'])

    .config(['$routeProvider', function ($routeProvider) {
        $routeProvider.when('/', {
            templateUrl: 'view1/view1.html',
            controller:  'View1Ctrl'
        });
    }])

    .controller('View1Ctrl', ['$scope', '$timeout', '$interval', function ($scope, $timeout, $interval) {
        function stackTrace(msg) {
            var err = new Error(msg);
            throw err.stack;
        }

        var simon = {
            states:          {
                on:        function () {
                    /* state: on */
                    this.view.gameOn    = true;
                    this.view.counterOn = true;
                    // next state
                    this._addEvent(0, this, this._setState, this.states.ready);
                    console.log('state on ran');
                },
                off:       function () {
                    /* state: off */
                    this.view.gameOn    = false;
                    this.view.strict    = false;
                    this.view.counter   = '- -';
                    this.view.counterOn = false;

                    // clean up
                    this._cleanup();

                    // set state to undefined - this is our initial state
                    this._addEvent(0, this, this._setState, undefined);
                    // stop heartbeat 100ms latter - this gives update time to process any clean up events
                    this._addEvent(100, this, this._stopHeartBeat, undefined);
                },
                ready:     function () {
                    /* state: ready */
                },
                run:       function () {
                    /* state: run */
                    this._setCounter(this.seqCount + 1);
                },
                waiting:   function () {
                    /* state: waiting */
                },
                animating: function () {
                    /* state: animating */
                    // empty marker state
                },
                playing:   function () {
                    /* state: playing */
                },
                start:     function () {
                    /* state: start */

                    // clean up
                    this._cleanup();

                    // generate a sequence
                    this._generateSequence();

                    // set start to restart - this was done to avoid code duplication as
                    // restart already dose what needed to be done to start
                    var parent = this;
                    this.failTimerID = this._addEvent(0, this, this._setState, parent.states.restart);
                },
                restart:   function () {
                    /* state: restart */
                    this.seqNum = 0;

                    // play sequence
                    var delay = this._playSequence();

                    // set state to run
                    var parent = this;
                    this._addEvent(delay, this, this._setState, parent.states.run);

                    // add event to time out if they take too long to input buttons
                    // keep event id so we can cancel it
                    this.failTimerID = this._addEvent(delay + this.inputTimeOut, this, this._setState, parent.states.failed);
                },
                failed:    function () {
                    /* state: failed */

                    // cancel any fail timer - this way it doesnt get called twice
                    if (this.failTimerID !== undefined) {
                        this._removeEvent(this.failTimerID);
                        this.failTimerID = undefined;
                    }

                    console.log('failed');
                    // player failed for some reason, we don't care why

                    var nextState = this.states.restart;
                    // if strict that's it game over / restart
                    if (this.view.strictOn) {
                        nextState = this.states.start;
                    }

                    // play animation.error
                    this.animation.play(this, this.animation.error, nextState);
                }
            }, /* end of states */
            animation:       {
                play:  function (scope, animation, nextState) {
                    scope._addEvent(0, scope, scope._setState, scope.states.animating);
                    var animationTime = animation(scope);
                    scope._addEvent(animationTime, scope, scope._setState, nextState);
                },
                error: function (scope) {
                    var flashTime = 300;
                    var time = 0;

                    scope.view.counter    = '! !';
                    var flashFunc = function () {
                        scope.view.counterOn = !scope.view.counterOn;
                    };

                    // tell view to flash ! !
                    for (var i = 1; i < 7; i++) {
                        scope._addEvent(time, scope, flashFunc);
                        time += flashTime;
                    }
                    return time;
                },
                win: function (scope) {
                    var spinTime = 50;
                    var time = 0;

                    var spin = ['| |', '/ /', '- -', '\\ \\'];

                    var flashFunc = function (num) {
                        scope.view.counterOn = !scope.view.counterOn;
                        scope.view.counter    = spin[num % 4];
                    };

                    // tell view to flash ! !
                    for (var i = 1; i < 101; i++) {
                        scope._addEvent(time, scope, flashFunc, i);
                        time += spinTime;
                    }
                    return time;

                }

            }, /* end of animation */
            _startHeartBeat: function () {
                // heart beat
                var parent     = this;
                var lastTick   = Date.now();
                var updateTick = function () {
                    var tick = Date.now();
                    parent._onUpdate(tick - lastTick);
                    lastTick = tick;
                };
                this.heartBeat = $interval(updateTick, 33, 0, true);
            },
            _stopHeartBeat:  function () {
                $interval.cancel(this.heartBeat);
                this.heartBeat = undefined;
            },
            _setCallback:    function (callback) {
                if (callback === undefined) {
                    stackTrace('callback undefined!');
                }
                this.callback = callback;
            },
            on:              function (callback) {
                if (callback === undefined) {
                    stackTrace('callback cannot be undefined!');
                }
                this._setCallback(callback);
                this._startHeartBeat();
                var parent = this;
                this._addEvent(0, this, this._setState, parent.states.on);
            },
            off:             function () {
                var parent = this;
                this._addEvent(0, this, this._setState, parent.states.off);
            },
            toggleStrict:    function () {
                this.view.strictOn = !this.view.strictOn;
            },
            _onUpdate:       function (dt) {
                this._processEvents(dt);

                // execute state
                if (this.state !== undefined) {
                    this.state();
                }
                // tell view to update
                this.callback();
            },
            _addEvent:       function (delay, scope, func, prams) {
                var id = this.events.length;
                this.events.push({id: id, scope: scope, delay: delay, func: func, prams: prams});
                return id;
            },
            _removeEvent:    function (id) {
                this.events.some(function (element, index) {
                    if (element.id === id) {
                        this.events[index] = undefined;
                        return true;
                    }
                }, this);
            },
            _removeAllEvents: function () {
                this.events = [];
            },
            _processEvents:  function (dt) {
                var marker = 'marker';
                this.events.push(marker);

                var shifted;
                do {
                    shifted = this.events.shift();
                    if (shifted !== marker && shifted !== undefined) {
                        shifted.delay -= dt;
                        if (shifted.delay <= 0) {
                            shifted.func.bind(shifted.scope)(shifted.prams);
                        } else {
                            this.events.push(shifted);
                        }
                    }
                } while (shifted !== marker);
            },
            _cleanup:        function () {
                // clear all events
                this._removeAllEvents();

                // reset view and other data
                this.view.counter   = '- -';
                this.seqCount       = 0;
                this.seqNum         = 0;
                this.difficulty     = 0;
                this.view.btnGreen  = false;
                this.view.btnRed    = false;
                this.view.btnBlue   = false;
                this.view.btnYellow = false;
                this.view.sndToPlay = undefined;
            },

            start:             function () {
                if (!this.view.gameOn) {
                    return;
                }
                console.log('starting');

                // set state to start
                var parent = this;
                this._addEvent(0, this, this._setState, parent.states.start);
            },
            _setState:         function (newState) {
                this.state = newState;
            },
            btnInput:          function (color) {
                if (this.state !== this.states.run) {
                    return;
                }
                var btn;
                var btnNum;
                if (color === 'green') {
                    btn    = 'btnGreen';
                    btnNum = 1;
                } else if (color === 'red') {
                    btn    = 'btnRed';
                    btnNum = 2;
                } else if (color === 'blue') {
                    btn    = 'btnBlue';
                    btnNum = 3;
                } else if (color === 'yellow') {
                    btn    = 'btnYellow';
                    btnNum = 4;
                }

                // play sound and light button
                this._addEvent(0, this, this._btnOn, btn);
                this._addEvent(this.btnFlashTime, this, this._btnOff, btn);

                // process input
                // good input
                var parent = this;
                if (this.sequence[this.seqNum] === btnNum) {
                    this.seqNum++;


                    /* difficulty increase */
                    if (this.seqNum === this.level_1 || this.seqNum === this.level_2 || this.seqNum === this.level_3) {
                        this.difficulty += this.diffInc;
                    }

                    /* win */
                    if (this.seqNum > 19) {
                        // cancel fail timer
                        this._removeEvent(this.failTimerID);

                        // play win animation
                        this.animation.play(this, this.animation.win, this.states.ready);
                        return;
                    }

                    //
                    if (this.seqNum > this.seqCount) {
                        console.log('this.seqNum > this.seqCount');
                        this.seqNum = 0;
                        this.seqCount++;

                        // cancel fail timer
                        this._removeEvent(this.failTimerID);

                        // play sequence
                        var delay = this._playSequence();

                        // set state to run
                        this._addEvent(delay, this, this._setState, parent.states.run);

                        // add event to time out if they take too long to input buttons
                        // keep event id so we can cancel it
                        this.failTimerID = this._addEvent(delay + this.inputTimeOut, this, this._setState, parent.states.failed);
                    }
                } else {
                    // bad input - set state to failed
                    this._addEvent(0, this, this._setState, parent.states.failed);
                }
            },
            _generateSequence: function () {
                this.sequence = [];
                for (var i = 0; i < 20; i++) {
                    var num = Math.floor(Math.random() * (5 - 1)) + 1;
                    this.sequence.push(num);
                }
            },
            // todo turn playSequence into an animation
            _playSequence:     function () {
                console.log('_playSequence');

                var delay = this.timeDelay;
                // set state to playing to prevent user actions other than on/off
                var parent = this;
                this._addEvent(0, this, this._setState, parent.states.animating);

                for (var i = 0; i < this.seqCount + 1; i++) {
                    // button on
                    this._addEvent(delay , this, this._btnOn, this._getBtn(this.sequence[i]));
                    // button off
                    this._addEvent(delay + this.btnFlashTime, this, this._btnOff, this._getBtn(this.sequence[i]));
                    delay += this.timeDelay - this.difficulty;
                }
                return delay;
            },
            _btnOn:            function (btn) {
                this.view[btn]      = true;
                this.view.sndToPlay = this.sounds[btn + 'Snd'];
            },
            _btnOff:           function (btn) {
                this.view[btn]      = false;
                this.view.sndToPlay = undefined;
            },
            _getBtn:           function (nbr) {
                switch (nbr) {
                    case 1:
                        return 'btnGreen';
                    case 2:
                        return 'btnRed';
                    case 3:
                        return 'btnBlue';
                    case 4:
                        return 'btnYellow';
                }
            },
            getSoundToPlay:  function () {
                var result          = this.view.sndToPlay;
                this.view.sndToPlay = undefined;
                return result;
            },
            _setCounter: function (value){
                value = value.toString().split('');
                if (value.length === 1){
                    value.unshift('0');
                }
                this.view.counter = value.join(' ');
            },
            view:            {
                btnGreen:  false,
                btnRed:    false,
                btnBlue:   false,
                btnYellow: false,
                sndToPlay: undefined,
                counter:   '- -',
                counterOn: false,
                strictOn:  false,
                gameOn:    false
            },
            sounds:          {
                btnGreenSnd:  'assets/sounds/simonSound1.mp3',
                btnRedSnd:    'assets/sounds/simonSound2.mp3',
                btnBlueSnd:   'assets/sounds/simonSound3.mp3',
                btnYellowSnd: 'assets/sounds/simonSound4.mp3',
            },
            events:          [],
            state:           undefined,
            sequence:        [],
            seqCount:        0,                 // end of the current rnd
            seqNum:          0,                 // how many correct buttons player has pushed
            timeDelay:       900,              // millisecond time delay between buttons
            btnFlashTime:    400,               // millisecond how long to leave a button on.
            inputTimeOut:    8000,              // time player has to input the correct sequence
            autoRestartTime: 2000,              // millisecond how long to wait before restart
            flashTime:       300,
            level_1:         5,
            level_2:         9,
            level_3:         13,
            difficulty:      0,
            diffInc:         200,
            failTimerID:     undefined,
            heartBeat:       undefined
        };
        /* end of simon */

        var onOffSwitch    = false;
        var updateView     = function () {
            $scope.onOff       = simon.view.gameOn;
            $scope.counterOn   = simon.view.counterOn;
            $scope.strictLed   = simon.view.strictOn;
            $scope.count       = simon.view.counter;
            $scope.greenBtnOn  = simon.view.btnGreen;
            $scope.redBtnOn    = simon.view.btnRed;
            $scope.blueBtnOn   = simon.view.btnBlue;
            $scope.yellowBtnOn = simon.view.btnYellow;

            var sndToPlay = simon.getSoundToPlay();
            if (sndToPlay !== undefined) {
                var audio = new Audio(sndToPlay);
                audio.play();
            }
            //$scope.$apply();
        };
        $scope.switchClick = function () {
            onOffSwitch = !onOffSwitch;
            if (onOffSwitch) {
                simon.on(updateView);
            } else {
                simon.off();
            }
        };
        $scope.strictClick = function () {
            simon.toggleStrict();
        };
        $scope.btnPress    = function (color) {
            simon.btnInput(color);
        };
        $scope.startBtn    = function () {
            simon.start();
        };
        updateView();

        /*
         simon.toggleOnOff();
         simon._generateSequence();
         simon.seqCount = 19;
         simon._playSequence('testing');
         */

    }])
;