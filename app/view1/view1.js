'use strict';

angular.module('myApp.view1', ['ngRoute'])

    .config(['$routeProvider', function ($routeProvider) {
        $routeProvider.when('/', {
            templateUrl: 'view1/view1.html',
            controller: 'View1Ctrl'
        });
    }])

    .controller('View1Ctrl', ['$scope', '$timeout', '$interval', function ($scope, $timeout, $interval) {
        function stackTrace(msg) {
            var err = new Error(msg);
            throw err.stack;
        }

        var simon = {
            setCallback: function (callback) {
                if (callback === undefined) {
                    stackTrace('callback undefined!');
                }
                this.callback = callback;
            },
            toggleOnOff: function () {
                this.on = !this.on;
                this.counterOn = this.on;
                if (!this.on) {
                    this.strict = false;
                    this.count = '- -';
                    this._clearTimeOuts();
                    $interval.cancel(this.heartBeat);
                    this.heartBeat = undefined;
                    this.callback();
                } else {
                    // heart beat
                    var parent = this;
                    var lastTick = Date.now();
                    var updateTick = function () {
                        var tick = Date.now();
                        parent._onUpdate(tick - lastTick);
                        lastTick = tick;
                    };
                    this.heartBeat = $interval(updateTick, 33, 0, true);
                }
            },
            toggleStrict: function () {
                if (this.on) {
                    this.strict = !this.strict;
                }
            },
            _onUpdate: function (dt) {
                this._processEvents(dt);

                // tell view to update
                this.callback();
                //$scope.$apply();
            },
            _addEvent: function (delay, scope, func, prams) {
                var id = this.events.length;
                this.events.push({id: id, scope: scope, delay: delay, func: func, prams: prams});
                return id;
            },
            _removeEvent: function (id) {
                this.events.some(function (element, index) {
                    if (element.id === id) {
                        this.events[index] = undefined;
                        return true;
                    }
                }, this);
            },
            _processEvents: function (dt) {
                var marker = 'marker';
                this.events.push(marker);

                var shifted;
                do {
                    shifted = this.events.shift();
                    if (shifted !== marker) {
                        shifted.delay -= dt;
                        if (shifted.delay <= 0) {
                            shifted.func.bind(shifted.scope)(shifted.prams);
                        } else {
                            this.events.push(shifted);
                        }
                    }
                } while (shifted !== marker);
            },

            start: function () {
                if (!this.on) {
                    return;
                }

                // make sure we are in a good state
                if (this.failTimer !== undefined) {
                    $timeout.cancel(this.failTimer);
                    this.failTimer = undefined;
                }
                this.promises = [];
                this._setState('starting', 0);
                this.count = '- -';
                this.seqCount = 0;
                this.seqNum = 0;
                this.timeDelay = 1500;
                this.btnGreen = false;
                this.btnRed = false;
                this.btnBlue = false;
                this.btnYellow = false;
                this.btnFlashTime = 1000;
                this.sndToPlay = undefined;

                // generate a sequence
                this._generateSequence();

                // run the game
                this._run();
            },
            _setState: function (newState) {
                parent.state = newState;
            },

            //todo rewrite
            _failed: function () {
                console.log('_failed');
                // player failed for some reason, we dont care why
                // if strict that's it game over / restart
                if (this.strict) {

                    // todo

                    return;
                }

                // if not strict then replay sequence
                this._playSequence('waiting');
                this.seqNum = 0;
            },
            btnInput: function (color) {
                if (this.state !== 'waiting') {
                    return;
                }
                var btn;
                var btnNum;
                if (color === 'green') {
                    btn = 'btnGreen';
                    btnNum = 1;
                } else if (color === 'red') {
                    btn = 'btnRed';
                    btnNum = 2;
                } else if (color === 'blue') {
                    btn = 'btnBlue';
                    btnNum = 3;
                } else if (color === 'yellow') {
                    btn = 'btnYellow';
                    btnNum = 4;
                }

                // play sound and light button
                this._addEvent(0, this, this._btnOn, btn);
                this._addEvent(this.btnFlashTime, this, this._btnOff, btn);

                // process input
                // good input
                if (this.sequence[this.seqNum] === btnNum) {
                    this.seqNum++;

                    if (this.seqNum > this.seqCount) {
                        this.seqNum = 0;
                        this.seqCount++;
                        $timeout.cancel(this.failTimer);
                        var promise = this._playSequence('waiting');
                        var parent = this;


                        // todo set fail timer

                    }
                } else {
                    // bad input
                    this._error();
                }

                console.log('btnInput  done' + '  state: ' + this.state);

            },
            _run: function () {
                console.log('_run');
                this._addEvent(0, this, this._setState, 'updating');

                var parent = this;

                // play the sequence up to sequence count + 1
                // time is how long it will take to complete the playing the sequence
                // set state to waiting after sequence is done playing
                var promise = this._playSequence('waiting');


                // set timeout for failure i.e. player has this.inputTime to complete the sequence or this._failed is called
                // store the promise is this.failtimer so we can clear it
                // todo set fail timer
            },
            _generateSequence: function () {
                this.sequence = [];
                for (var i = 0; i < 20; i++) {
                    var num = Math.floor(Math.random() * (5 - 1)) + 1;
                    this.sequence.push(num);
                }
            },
            _playSequence: function (nextState) {
                console.log('_playSequence');

                var delay = this.timeDelay;
                // set state to playing to prevent user actions other than on/off
                this._addEvent(0, this, this._setState, 'playing');

                for (var i = 0; i < this.seqCount + 1; i++) {
                    // button on
                    this._addEvent(delay, this, this._btnOn, this._getBtn(this.sequence[i]));
                    // button off
                    this._addEvent(delay + this.btnFlashTime, this, this._btnOff, this._getBtn(this.sequence[i]));
                    delay += this.timeDelay;
                }
                // set state to nextState after sequence is done playing
                this._addEvent(delay, this, this._setState, nextState);
                return delay;
            },
            _getBtn: function (nbr) {
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
            _btnOn: function (btn) {
                this[btn] = true;
                this.sndToPlay = this[btn + 'Snd'];
            },
            _btnOff: function (btn) {
                this[btn] = false;
                this.sndToPlay = undefined;
            },
            _error: function () {
                // tell view ctrler to flash ! ! on counter
                var parent = this;
                var time = this.flashTime;
                this.count = '! !';

                // tell view to update before we start flashing
                // this.callback();

                var flashFunc = function () {
                    parent.counterOn = !parent.counterOn;
                };

                // tell view to flash ! !
                for (var i = 1; i < 6; i++) {
                    $timeout(flashFunc, time * i);
                }
                return time;
            },
            _clearTimeOuts: function () {
                this.promises.forEach(function (func) {
                    if (func !== undefined) {
                        $timeout.cancel(func);
                    }
                });
                this.promises = [];

                if (this.failTimer !== undefined) {
                    $timeout.cancel(this.failTimer);
                    this.failTimer = undefined;
                }
            },
            getSoundToPlay: function () {
                var result = this.sndToPlay;
                this.sndToPlay = undefined;
                return result;
            },
            events: [],
            state: 'off',
            on: false,
            counterOn: false,
            strict: false,
            count: '- -',
            sequence: [],
            seqCount: 0,
            seqNum: 0,
            promises: [],
            btnGreen: false,
            btnGreenSnd: 'assets/sounds/simonSound1.mp3',
            btnRed: false,
            btnRedSnd: 'assets/sounds/simonSound2.mp3',
            btnBlue: false,
            btnBlueSnd: 'assets/sounds/simonSound3.mp3',
            btnYellow: false,
            btnYellowSnd: 'assets/sounds/simonSound4.mp3',
            timeDelay: 1250,            // millisecond time delay between buttons
            btnFlashTime: 750,         // millisecond how long to leave a button on.
            inputTime: 8000,            // time player has to input the correct sequence
            autoRestartTime: 2000,       // millisecond how long to wait before restart
            flashTime: 300,
            sndToPlay: undefined,
            failTimer: undefined,
            heartBeat: undefined
        };

        var updateView = function () {
            $scope.onOff = simon.on;
            $scope.counterOn = simon.counterOn;
            $scope.strictLed = simon.strict;
            $scope.count = simon.count;
            $scope.greenBtnOn = simon.btnGreen;
            $scope.redBtnOn = simon.btnRed;
            $scope.blueBtnOn = simon.btnBlue;
            $scope.yellowBtnOn = simon.btnYellow;

            var sndToPlay = simon.getSoundToPlay();
            if (sndToPlay !== undefined) {
                var audio = new Audio(sndToPlay);
                audio.play();
            }
            //$scope.$apply();
        };
        $scope.switchClick = function () {
            simon.toggleOnOff(updateView);
        };
        $scope.strictClick = function () {
            simon.toggleStrict(updateView);
        };
        $scope.btnPress = function (color) {
            simon.btnInput(color, updateView);
        };
        $scope.startBtn = function () {
            simon.start(updateView);
        };
        simon.setCallback(updateView);
        updateView();

        /*
        simon.toggleOnOff();
        simon._generateSequence();
        simon.seqCount = 19;
        simon._playSequence('testing');
        */

    }])
;