'use strict';

angular.module('myApp.view1', ['ngRoute'])

    .config(['$routeProvider', function ($routeProvider) {
        $routeProvider.when('/', {
            templateUrl: 'view1/view1.html',
            controller: 'View1Ctrl'
        });
    }])

    .controller('View1Ctrl', ['$scope', '$timeout', function ($scope, $timeout) {
        var simon = {
            toggleOnOff: function () {
                this.on = !this.on;
                this.counterOn = this.on;
                if (!this.on) {
                    this.strict = false;
                    this.count = '- -';
                }
            },
            toggleStrict: function () {
                if (this.on) {
                    this.strict = !this.strict;
                }
            },
            start: function (callback) {
                // callback = view update

                // make sure we are in a good state
                if (this.failTimer !== undefined) {
                    this.failTimer.clear();
                    this.failTimer = undefined;
                }
                this.state = 'starting';
                this.count = '- -';
                this.seqCount = 0;
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
            _run: function (callback) {
                // callback = view update
                var parent = this;

                // play the sequence up to sequence count + 1
                // time is how long it will take to complete the playing the sequence
                var time = this._playSequence();

                // set state to waiting after sequence is done playing
                this.timeOuts.push($timeout(function () {
                    parent.state = 'waiting';
                }, time));

                // set timeout for failure i.e. player has this.inputTime to complete the sequence or this._failed is called
                // store the promise is this.failtimer so we can clear it
                this.failTimer = $timeout(function () {
                    parent._failed(callback);
                }, this.inputTime + time);


                // if correct input wait for next input
                // or if input count = sequence count then
                // sequence count + 1 and loop
                //
            },
            _failed: function (callback) {
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
                this._playSequence();

            },
            btnInput: function (color, callback) {
                // callback = view update
                if (this.state !== 'waiting') {
                    return;
                }
                var btn;
                if (color === 'green') {
                    btn = 'btnGreen';
                } else if (color === 'red') {
                    btn = 'btnRed';
                } else if (color === 'blue') {
                    btn = 'btnBlue';
                } else if (color === 'yellow') {
                    btn = 'btnYellow';
                }

                // play sound
                this.sndToPlay = this[btn + 'Snd'];

                // process input
                //todo

                callback();

            },
            _generateSequence: function () {
                this.sequence = [];
                for (var i = 0; i < 20; i++) {
                    var num = Math.floor(Math.random() * (5 - 1)) + 1;
                    this.sequence.push(num);
                }
            },
            _playSequence: function (callBack) {
                // callback is the viewUpdate function
                var parent = this;
                var delay = this.timeDelay;
                this.state = 'playing';

                for (var i = 0; i < this.seqCount + 1; i++) {
                    // push timeouts onto an array so we can clear them all if needed
                    //this.timeOuts.push($timeout(callBack(this.sequence[i], this.timeDelay), delay));

                    // todo test
                    console.log(this.sequence[i] + " = " + this._getBtn(this.sequence[i]));


                    // set timeout to turn button on
                    this.timeOuts.push(this._btnOnOff(
                        this._getBtn(this.sequence[i]),
                        delay,
                        true,
                        callBack
                    ));
                    // set timeout to turn button off
                    this.timeOuts.push(this._btnOnOff(
                        this._getBtn(this.sequence[i]),
                        delay + this.btnFlashTime,
                        false,
                        callBack
                    ));
                    delay += this.timeDelay;
                }
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
            _btnOnOff: function (btn, time, isOn, callback) {
                // callback tells the view to update
                // view handles the update
                var parent = this;
                return $timeout(function () {
                    console.log(btn + ': ' + isOn);
                    parent[btn] = isOn;
                    if (isOn) {
                        parent.sndToPlay = parent[btn + 'Snd'];
                    } else {
                        parent.sndToPlay = undefined;
                    }

                    callback();
                }, time);
            },
            _error: function (callback) {
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
                for (var i = 1; i < 6; i++){
                    $timeout(flashFunc, time * i);
                }
                return time;
            },
            state: 'none',
            on: false,
            counterOn: false,
            strict: false,
            count: '- -',
            sequence: [],
            seqCount: 0,
            timeDelay: 1500,            // millisecond time delay between buttons
            timeOuts: [],
            btnGreen: false,
            btnGreenSnd: 'assets/sounds/simonSound1.mp3',
            btnRed: false,
            btnRedSnd: 'assets/sounds/simonSound2.mp3',
            btnBlue: false,
            btnBlueSnd: 'assets/sounds/simonSound3.mp3',
            btnYellow: false,
            btnYellowSnd: 'assets/sounds/simonSound4.mp3',
            btnFlashTime: 1000,         // millisecond how long to leave a button on.
            sndToPlay: undefined,
            inputTime: 8000,            // time player has to input the correct sequence
            failTimer: undefined,
            autoRestartTime: 2000,       // millisecond how long to wait before restart
            flashTime: 300

        };

        var updateView = function () {
            console.log('update called');


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

            //$scope.$apply();
        };
        $scope.switchClick = function () {
            simon.toggleOnOff();
            updateView();
        };
        $scope.strictClick = function () {
            simon.toggleStrict();
            updateView();
        };
        $scope.btnPress = function (color) {
            console.log(color + 'pressed');
            simon.btnInput(color, updateView);
        };

        updateView();

// test code
        /*
         $scope.greenBtnOn = true;
         $scope.redBtnOn = true;
         $scope.blueBtnOn = true;
         $scope.yellowBtnOn = true;*/

        console.log('test simon._getBtn()' + simon._getBtn(1));
        /*
         simon._generateSequence();
         console.log(simon.sequence);
         simon.seqCount = 19;
         simon._playSequence(updateView);*/
        //simon.state = 'waiting';

        // test error
        simon._error(updateView);

    }])
;