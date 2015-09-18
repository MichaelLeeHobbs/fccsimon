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
                // callback(buttonFlash(btnNbr, time=ms), counterFlash(time=ms), playSound(sound, on=bool))

            },
            btnInput: function (color) {

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
                this.timeOuts.push($timeout(function () {
                    parent.state = 'waiting';
                }, delay));

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
            state: 'none',
            on: false,
            strict: false,
            count: '- -',
            sequence: [],
            seqCount: 0,
            timeDelay: 1500,     // millisecond time delay between buttons
            timeOuts: [],
            btnGreen: false,
            btnGreenSnd: 'assets/sounds/simonSound1.mp3',
            btnRed: false,
            btnRedSnd: 'assets/sounds/simonSound2.mp3',
            btnBlue: false,
            btnBlueSnd: 'assets/sounds/simonSound3.mp3',
            btnYellow: false,
            btnYellowSnd: 'assets/sounds/simonSound4.mp3',
            btnFlashTime: 1000,   // millisecond how long to leave a button on.
            sndToPlay: undefined

        };

        var updateView = function () {
            console.log('update called');


            $scope.onOff = simon.on;
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

        updateView();

// test code
/*
        $scope.greenBtnOn = true;
        $scope.redBtnOn = true;
        $scope.blueBtnOn = true;
        $scope.yellowBtnOn = true;*/

        console.log('test simon._getBtn()' + simon._getBtn(1));

        simon._generateSequence();
        console.log(simon.sequence);
        simon.seqCount = 19;
        simon._playSequence(updateView);

    }])
;