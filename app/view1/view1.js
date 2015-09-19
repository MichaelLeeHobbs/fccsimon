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
            toggleOnOff: function (callback) {
                if (callback === undefined) {
                    stackTrace('callback undefined!');
                }

                this.on = !this.on;
                this.counterOn = this.on;
                if (!this.on) {
                    this.strict = false;
                    this.count = '- -';
                    this._clearTimeOuts();
                    $interval.cancel(this.heartBeat);
                    this.heartBeat = undefined;
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
                callback();
            },
            toggleStrict: function (callback) {
                if (callback !== undefined) {
                    stackTrace('callback undefined!');
                }

                if (this.on) {
                    this.strict = !this.strict;
                }
                callback();
            },
            _onUpdate: function (dt) {
                console.log('tick: ' + dt);
            },

            start: function (callback) {
                if (callback === undefined) {
                    stackTrace('callback undefined!');
                }

                // callback = view update

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
                this._run(callback);


            },
            _setState: function (newState, timeDelay) {
                var parent = this;
                if (!timeDelay) {
                    timeDelay = 0;
                }
                return $timeout(function () {
                    parent.state = newState;
                }, timeDelay);
            },
            _failed: function (callback) {
                if (callback === undefined) {
                    stackTrace('callback undefined!');
                }
                console.log('_failed');
                // player failed for some reason, we dont care why
                // if strict that's it game over / restart
                if (this.strict) {
                    this.failTimer = undefined;

                    // restart
                    $timeout(function () {
                        parent.start(callback);
                    }, this.autoRestartTime);
                    return;
                }

                // if not strict then replay sequence
                this._playSequence(callback, 'waiting');
                this.seqNum = 0;
            },
            btnInput: function (color, callback) {
                if (callback === undefined) {
                    stackTrace('callback undefined!');
                }

                console.log('btnInput  color: ' + color + '  state: ' + this.state);

                // callback = view update
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
                this._btnOn(btn, 0, callback);
                this._btnOff(btn, 100, callback);

                // process input
                // good input
                if (this.sequence[this.seqNum] === btnNum) {
                    this.seqNum++;

                    if (this.seqNum > this.seqCount) {
                        this.seqNum = 0;
                        this.seqCount++;
                        $timeout.cancel(this.failTimer);
                        var promise = this._playSequence(callback, 'waiting');
                        var parent = this;

                        this.failTimer = promise.then(function () {
                            return $timeout(function () {
                                parent._failed(callback);
                            }, parent.inputTime);
                        });

                    }
                } else {
                    // bad input
                    this._error(callback);
                }

                console.log('btnInput  done' + '  state: ' + this.state);

            },
            _run: function (callback) {
                console.log('_run');
                // callback = view update
                if (callback === undefined) {
                    stackTrace('callback undefined!');
                }
                this._setState('updating', 0);

                var parent = this;

                // play the sequence up to sequence count + 1
                // time is how long it will take to complete the playing the sequence
                // set state to waiting after sequence is done playing
                var promise = this._playSequence(callback, 'waiting');


                // set timeout for failure i.e. player has this.inputTime to complete the sequence or this._failed is called
                // store the promise is this.failtimer so we can clear it
                this.failTimer = promise.then(function () {
                    return $timeout(function () {
                        parent._failed(callback);
                    }, parent.inputTime);
                });
                /*
                 this.failTimer = $timeout(function () {
                 parent._failed(callback);
                 }, this.inputTime + time);*/
            },
            _generateSequence: function () {
                this.sequence = [];
                for (var i = 0; i < 20; i++) {
                    var num = Math.floor(Math.random() * (5 - 1)) + 1;
                    this.sequence.push(num);
                }
            },
            _playSequence: function (callback, nextState) {
                // callback is the viewUpdate function
                if (callback === undefined) {
                    stackTrace('callback undefined!');
                }

                console.log('_playSequence');

                var delay = this.timeDelay;
                var parent = this;

                this.promises.push(this._setState('playing', 0));

                for (var i = 0; i < this.seqCount + 1; i++) {
                    // push timeouts onto an array so we can clear them all if needed
                    // set timeout to turn button on

                    // todo remove functions from loop
                    // turn buttons on off
                    this.promises.push(this._btnOn(
                        this._getBtn(this.sequence[i]),
                        delay,
                        callback
                    ));
                    // set timeout to turn button off
                    this.promises.push(this._btnOff(
                        this._getBtn(this.sequence[i]),
                        delay + this.btnFlashTime,
                        callback
                    ));
                    delay += this.timeDelay;
                }
                // set state to nextState after sequence is done playing
                this.promises.push(parent._setState(nextState, delay));
                console.log(this.promises);
                return this.promises[this.promises.length - 1];
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
            _btnOn: function (btn, delay, callback) {
                // callback tells the view to update
                if (callback === undefined) {
                    stackTrace('callback undefined!');
                }
                var parent = this;
                $timeout(function () {
                        parent[btn] = true;
                        parent.sndToPlay = parent[btn + 'Snd'];
                        callback();
                    }, delay
                );
            },
            _btnOff: function (btn, delay, callback) {
                // callback tells the view to update
                if (callback === undefined) {
                    stackTrace('callback undefined!');
                }
                var parent = this;
                $timeout(function () {
                        parent[btn] = false;
                        parent.sndToPlay = undefined;
                        callback();
                    }, delay
                );
            },
            _error: function (callback) {
                if (callback === undefined) {
                    stackTrace('callback undefined!');
                }

                // tell view ctrler to flash ! ! on counter
                var parent = this;
                var time = this.flashTime;
                this.count = '! !';

                // tell view to update before we start flashing
                callback();

                var flashFunc = function () {
                    parent.counterOn = !parent.counterOn;
                    callback();
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
            timeDelay: 1500,            // millisecond time delay between buttons
            btnFlashTime: 1000,         // millisecond how long to leave a button on.
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

            if (simon.sndToPlay !== undefined) {
                var audio = new Audio(simon.sndToPlay);
                audio.play();
            }
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

        updateView();


    }])
;