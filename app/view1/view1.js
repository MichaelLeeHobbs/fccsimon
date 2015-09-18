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
            on: false

        };

        var updateView = function () {
            $scope.onOff = simon.on;

        };
        $scope.count = '- -';
        $scope.switchClick = function () {
            simon.on = !simon.on;
            updateView();
        };

    }]);