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
            on: false,
            strict: false

        };

        var updateView = function () {
            $scope.onOff = simon.on;
            $scope.strictLed = simon.strict;

        };
        $scope.count = '- -';
        $scope.switchClick = function () {
            simon.on = !simon.on;
            updateView();
        };
        $scope.strictClick = function () {
            if (simon.on) {
                simon.strict = !simon.strict;
                updateView();
            }
        };

    }]);