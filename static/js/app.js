'use strict'

var app = angular.module('achillesKidsApp',
	['achillesControllers', 'ngRoute', 'ui.bootstrap']).config(['$routeProvider',
		function($routeProvider) {
			$routeProvider.
				when('/profile', {
					templateUrl: '/partials/profile.html',
					controller: 'MyProfileCtrl'
				}).
				when('/student', {
					templateUrl: '/partials/show_students.html',
					controller: 'ShowStudentCtrl'
				}).
                when('/student/create', {
                    templateUrl: '/partials/create_students.html',
                    controller: 'CreateStudentCtrl'
                }).
				when('/student/detail/:websafeStudentKey', {
					templateUrl: '/partials/student_detail.html',
					controller: 'StudentDetailCtrl'
				}).
				when('/',{
					templateUrl: '/partials/home.html'
				}).
				otherwise({
					redirectTo: '/'
				});
		}]);
/**
 * @ngdoc filter
 * @name startFrom
 *
 * @description
 * A filter that extracts an array from the specific index.
 *
 */
app.filter('startFrom', function () {
    /**
     * Extracts an array from the specific index.
     *
     * @param {Array} data
     * @param {Integer} start
     * @returns {Array|*}
     */
    var filter = function (data, start) {
        return data.slice(start);
    }
    return filter;
});


/**
 * @ngdoc constant
 * @name HTTP_ERRORS
 *
 * @description
 * Holds the constants that represent HTTP error codes.
 *
 */
app.constant('HTTP_ERRORS', {
    'UNAUTHORIZED': 401
});


/**
 * @ngdoc service
 * @name oauth2Provider
 *
 * @description
 * Service that holds the OAuth2 information shared across all the pages.
 *
 */
app.factory('oauth2Provider', function ($modal) {
    var oauth2Provider = {
        CLIENT_ID: '55986836660-hdnk2ofc24h3jpa4a8jfb1seu0qk1pav.apps.googleusercontent.com',
        SCOPES: 'email profile',
        signedIn: false
    }

    /**
     * Calls the OAuth2 authentication method.
     */
    oauth2Provider.signIn = function (callback) {
        gapi.auth.signIn({
            'clientid': oauth2Provider.CLIENT_ID,
            'cookiepolicy': 'single_host_origin',
            'accesstype': 'online',
            'approveprompt': 'auto',
            'scope': oauth2Provider.SCOPES,
            'callback': callback
        });
    };

    /**
     * Logs out the user.
     */
    oauth2Provider.signOut = function () {
        gapi.auth.signOut();
        // Explicitly set the invalid access token in order to make the API calls fail.
        gapi.auth.setToken({access_token: ''})
        oauth2Provider.signedIn = false;
    };

    /**
     * Shows the modal with Google+ sign in button.
     *
     * @returns {*|Window}
     */
    oauth2Provider.showLoginModal = function() {
        var modalInstance = $modal.open({
            templateUrl: '/partials/login.modal.html',
            controller: 'OAuth2LoginModalCtrl'
        });
        return modalInstance;
    };

    return oauth2Provider;
});
