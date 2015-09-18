'use strict';

angular.module('myApp.view1', ['ngRoute'])

    .config(['$routeProvider', function ($routeProvider) {
        $routeProvider.when('/', {
            templateUrl: 'view1/view1.html',
            controller: 'View1Ctrl'
        });
    }])

    .controller('View1Ctrl', ['$scope', function ($scope) {
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
                // callback(buttonFlash(color, time=ms), counterFlash(time=ms), playSound(sound, on=bool))

            },
            btnInput: function (color){

            },
            generateSequence: function(){
                this.sequence = [];
                for (var i = 0; i < 20; i++){
                    var num = Math.floor(Math.random() * (5 - 1)) + 1;
                    this.sequence.push(num);
                }
            },
            on: false,
            strict: false,
            count: '- -',
            sequence: [],
            seqCount: 0
        };

        var updateView = function () {
            $scope.onOff = simon.on;
            $scope.strictLed = simon.strict;
            $scope.count = simon.count;
        };
        $scope.switchClick = function () {
            simon.toggleOnOff();
            updateView();
        };
        $scope.strictClick = function () {
            simon.toggleStrict();
            updateView();
        };

        // test code
        simon.generateSequence();
        console.log(simon.sequence);


        updateView();
    }]);