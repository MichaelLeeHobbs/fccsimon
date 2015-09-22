/*global console, angular, Audio */

angular.module('myApp.view1', ['ngRoute'])
    .config(['$routeProvider', function ($routeProvider) {
        'use strict';
        $routeProvider.when('/', {
            templateUrl: 'view1/view1.html',
            controller:  'View1Ctrl'
        });
    }])

    .controller('View1Ctrl', ['$scope', '$timeout', '$interval', function ($scope, $timeout, $interval) {
        'use strict';
        function stackTrace(msg) {
            var err = new Error(msg);
            throw err.stack;
        }

        var simon = {
            states:           {
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
                updating:  function () {
                    /* state: updating */
                },
                start:     function () {
                    /* state: start */

                    // clean up
                    this._cleanup();

                    // generate a sequence
                    this._generateSequence();

                    // set start to restart - this was done to avoid code duplication as
                    // restart already dose what needed to be done to start
                    var parent       = this;
                    this._addEvent(0, this, this._setState, parent.states.restart);
                },
                restart:   function () {
                    /* state: restart */
                    this.seqNum = 0;

                    // play sequence
                    // prams[timeDelay, sequence, stop, modifier]
                    var prams = [this.timeDelay, this.sequence, this.seqCount + 1, this.difficulty];
                    console.log('82');
                    var delay = this.animation.play(this, this.animation.playSequence, this.states.run, prams);

                    // add event to time out if they take too long to input buttons
                    // keep event id so we can cancel it
                    console.log('delay: ' + delay);
                    this.failTimerID = this._addEvent(delay + this.inputTimeOut, this, this._setState, this.states.failed);
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
            animation:        {
                play:        function (scope, animation, nextState, prams) {
                    scope._addEvent(0, scope, scope._setState, scope.states.animating);
                    var animationTime = animation(scope, prams);
                    console.log('play: nextState: ' + nextState);
                    scope._addEvent(animationTime, scope, scope._setState, nextState);
                    return animationTime;
                },
                error:       function (scope) {
                    var flashTime = 300;
                    var time      = 0;

                    scope.view.counter = '! !';
                    var flashFunc      = function () {
                        scope.view.counterOn = !scope.view.counterOn;
                    };

                    // tell view to flash ! !
                    for (var i = 1; i < 7; i++) {
                        scope._addEvent(time, scope, flashFunc);
                        time += flashTime;
                    }
                    return time;
                },
                win:         function (scope) {
                    var spinTime = 50;
                    var time     = 0;

                    var spin = ['| |', '/ /', '- -', '\\ \\'];

                    var flashFunc = function (num) {
                        scope.view.counterOn = !scope.view.counterOn;
                        scope.view.counter   = spin[num % 4];
                    };

                    // tell view to flash ! !
                    for (var i = 1; i < 101; i++) {
                        scope._addEvent(time, scope, flashFunc, i);
                        time += spinTime;
                    }
                    return time;
                },
                buttonFlash: function (scope, prams) {
                    var btn    = prams[0];
                    var time   = prams[1];
                    var btnOn  = function (btn) {
                        scope.view[btn]      = true;
                        scope.view.sndToPlay = scope.sounds[btn + 'Snd'];
                    };
                    var btnOff = function (btn) {
                        scope.view[btn]      = false;
                        scope.view.sndToPlay = undefined;
                    };

                    scope._addEvent(time, scope, btnOn, btn);
                    scope._addEvent(time + scope.flashTime, scope, btnOff, btn);
                    return scope.flashTime;
                },
                // prams[timeDelay, sequence, stop, modifier]
                playSequence: function (scope, prams) {
                    var delay = prams[0];       // timeDelay;
                    var timeDelay = prams[0];
                    var sequence = prams[1];
                    var stop = prams[2];
                    var modifier = prams[3];
                    // prams[2] = scope.seqCount + 1
                    for (var i = 0; i < stop; i++) {
                        scope.animation.play(scope, scope.animation.buttonFlash, scope.states.animating, [scope._getBtn(sequence[i]), delay]);
                        delay += timeDelay - modifier;
                    }
                    return delay;
                }
            }, /* end of animation */
            _startHeartBeat:  function () {
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
            _stopHeartBeat:   function () {
                $interval.cancel(this.heartBeat);
                this.heartBeat = undefined;
            },
            _setCallback:     function (callback) {
                if (callback === undefined) {
                    stackTrace('callback undefined!');
                }
                this.callback = callback;
            },
            on:               function (callback) {
                if (callback === undefined) {
                    stackTrace('callback cannot be undefined!');
                }
                this._setCallback(callback);
                this._startHeartBeat();
                var parent = this;
                this._addEvent(0, this, this._setState, parent.states.on);
            },
            off:              function () {
                var parent = this;
                this._addEvent(0, this, this._setState, parent.states.off);
            },
            toggleStrict:     function () {
                this.view.strictOn = !this.view.strictOn;

                /* test code */
                /*
                 this.seqCount = 19;
                 this.seqNum = 18;
                 console.log(this.sequence);
                 */
            },
            _onUpdate:        function (dt) {
                this._processEvents(dt);

                // execute state
                if (this.state !== undefined) {
                    this.state();
                }
                // tell view to update
                this.callback();
            },
            _addEvent:        function (delay, scope, func, prams) {
                console.log('addEvent: delay: ' + delay + ' prams: ' + prams);
                var id = this.events.length;
                this.events.push({id: id, scope: scope, delay: delay, func: func, prams: prams});
                return id;
            },
            _removeEvent:     function (id) {
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
            _processEvents:   function (dt) {
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
            _cleanup:         function () {
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
                //console.log(this.state);
                if (this.state !== this.states.run) {
                    return;
                }
                var btn;
                var btnNum;
                var delay = 0;
                var parent = this;

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
                delay = this.animation.play(this, this.animation.buttonFlash, this.states.run, [btn, 0]);

                // process input
                // good input
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
                        this._addEvent(delay, this, this.animation.play(this, this.animation.win, this.states.ready));
                        return;
                    }

                    //
                    if (this.seqNum > this.seqCount) {
                        //console.log('this.seqNum > this.seqCount');
                        this.seqNum = 0;
                        this.seqCount++;

                        // cancel fail timer
                        this._removeEvent(this.failTimerID);

                        // play sequence
                        // prams[timeDelay, sequence, stop, modifier]
                        var prams = [this.timeDelay, this.sequence, this.seqCount + 1, this.difficulty];
                        console.log('361');
                        delay += this.animation.play(this, this.animation.playSequence, this.states.updating, prams);

                        // set state to run
                        this._addEvent(delay, this, this._setState, parent.states.run);

                        // add event to time out if they take too long to input buttons
                        // keep event id so we can cancel it
                        console.log('delay: ' + delay);
                        this.failTimerID = this._addEvent(delay + this.inputTimeOut, this, this._setState, parent.states.failed);
                        return;
                    }
                } else {
                    // bad input - set state to failed
                    this._addEvent(0, this, this._setState, parent.states.failed);
                    return;
                }
                this._addEvent(delay, this, this._setState, parent.states.run);

            },
            _generateSequence: function () {
                this.sequence = [];
                for (var i = 0; i < 20; i++) {
                    var num = Math.floor(Math.random() * (5 - 1)) + 1;
                    this.sequence.push(num);
                }
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
            getSoundToPlay:    function () {
                var result          = this.view.sndToPlay;
                this.view.sndToPlay = undefined;
                return result;
            },
            _setCounter:       function (value) {
                value = value.toString().split('');
                if (value.length === 1) {
                    value.unshift('0');
                }
                this.view.counter = value.join(' ');
            },
            view:              {
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
            sounds:            {
                btnGreenSnd:  'assets/sounds/simonSound1.mp3',
                btnRedSnd:    'assets/sounds/simonSound2.mp3',
                btnBlueSnd:   'assets/sounds/simonSound3.mp3',
                btnYellowSnd: 'assets/sounds/simonSound4.mp3'
            },
            events:            [],
            state:             undefined,
            sequence:          [],
            seqCount:          0,                 // end of the current rnd
            seqNum:            0,                 // how many correct buttons player has pushed
            timeDelay:         900,              // millisecond time delay between buttons
            btnFlashTime:      400,               // millisecond how long to leave a button on.
            inputTimeOut:      8000,              // time player has to input the correct sequence
            autoRestartTime:   2000,              // millisecond how long to wait before restart
            flashTime:         300,
            level_1:           5,
            level_2:           9,
            level_3:           13,
            difficulty:        0,
            diffInc:           200,
            failTimerID:       undefined,
            heartBeat:         undefined
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

    }]);