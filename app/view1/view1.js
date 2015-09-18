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
            on: false,
            strict: false,
            count: '- -'

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


        updateView();
    }]);