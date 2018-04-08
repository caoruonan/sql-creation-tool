var SqlTollApp = angular.module('SqlTollApp', [
	'ui.router',
	"ui.bootstrap",
    "ngResource"
]);

SqlTollApp.directive('itemRepeatFinish', function ($timeout) {
    return {
        restrict: 'A',
        link: function (scope, element, attr) {
            if (scope.$last === true) {
                $timeout(function() {
                    scope.$eval(scope.itemRepeatFinish);
                });
            }
        }
    }
}).directive('repeatFinish', function ($timeout) {
    return {
        restrict: 'A',
        link: function (scope, element, attr) {
            if (scope.$last === true) {
                $timeout(function() {
                    scope.$emit('ngRepeatFinished');
                });
            }
        }
    }
});

SqlTollApp.config(['$stateProvider', '$urlRouterProvider',function($stateProvider, $urlRouterProvider) {
	$urlRouterProvider.otherwise("/demo");
	$stateProvider
		.state('demo',{
			url:'/demo',
			templateUrl: "views/demo.html"
		})

}]);