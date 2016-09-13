'use strict';

var achillesKidsApp = achillesKidsApp || {};

achillesKidsApp.controllers = angular.module('achillesControllers', ['ui.bootstrap']);

// controller for my profile page

achillesKidsApp.controllers.controller('MyProfileCtrl',
    function ($scope, $log, oauth2Provider, HTTP_ERRORS) {
        $scope.submitted = false;
        $scope.loading = false;

    // initial profile retrieved from server to know state

    $scope.initialProfile = {};

    // entries for teeShirtSize select box

    $scope.teeShirtSizes = [
            {'size': 'XS_M', 'text': "XS - Men's"},
            {'size': 'XS_W', 'text': "XS - Women's"},
            {'size': 'S_M', 'text': "S - Men's"},
            {'size': 'S_W', 'text': "S - Women's"},
            {'size': 'M_M', 'text': "M - Men's"},
            {'size': 'M_W', 'text': "M - Women's"},
            {'size': 'L_M', 'text': "L - Men's"},
            {'size': 'L_W', 'text': "L - Women's"},
            {'size': 'XL_M', 'text': "XL - Men's"},
            {'size': 'XL_W', 'text': "XL - Women's"},
            {'size': 'XXL_M', 'text': "XXL - Men's"},
            {'size': 'XXL_W', 'text': "XXL - Women's"},
            {'size': 'XXXL_M', 'text': "XXXL - Men's"},
            {'size': 'XXXL_W', 'text': "XXXL - Women's"}
        ];

    // initializes my profile page
    // updates profile if user's profile stored

    $scope.init = function() {
    	var retrieveProfileCallback = function () {
    		$scope.profile = {};
    		$scope.loading = true;
    		gapi.client.achilles.getProfile().
                execute(function (resp) {
	    			$scope.$apply(function () {
	    				$scope.loading = false;
	    				if (resp.error) {
	    					// failed to get user profile
	    				} else {
	    					// succeeded in getting user profile
	    					$scope.profile.displayName = resp.result.displayName;
                            teeShirtSize: $scope.profile.teeShirtSize
	    					$scope.initialProfile = resp.result;
	    				}
	    			});
    		});
    	};
    	if (!oauth2Provider.signedIn) {
    		var modalInstance = oauth2Provider.showLoginModal();
    		modalInstance.result.then(retrieveProfileCallback);
    	} else {
    		retrieveProfileCallback();
    	}
    };

         //Invokes the achilles.saveProfile API.

        $scope.saveProfile = function () {
            $scope.submitted = true;
            $scope.loading = true;
            gapi.client.achilles.saveProfile($scope.profile).
                execute(function (resp) {
                    $scope.$apply(function () {
                        $scope.loading = false;
                        if (resp.error) {
                            // The request has failed.
                            var errorMessage = resp.error.message || '';
                            $scope.messages = 'Failed to update a profile : ' + errorMessage;
                            $scope.alertStatus = 'warning';
                            $log.error($scope.messages + 'Profile : ' + JSON.stringify($scope.profile));

                            if (resp.code && resp.code == HTTP_ERRORS.UNAUTHORIZED) {
                                oauth2Provider.showLoginModal();
                                return;
                            }
                        } else {
                            // The request has succeeded.
                            $scope.messages = 'The profile has been updated';
                            $scope.alertStatus = 'success';
                            $scope.submitted = false;
                            $scope.initialProfile = {
                                displayName: $scope.profile.displayName,
                                teeShirtSize: $scope.profile.teeShirtSize
                            };

                            $log.info($scope.messages + JSON.stringify(resp.result));
                        }
                    });
                });
        };
    });

/* The root controller having a scope of the body element and methods used in the application wide
 * such as user authentications.
 *
 */
achillesKidsApp.controllers.controller('RootCtrl', function ($scope, $location, oauth2Provider) {

    /**
     * Returns if the viewLocation is the currently viewed page.
     *
     * @param viewLocation
     * @returns {boolean} true if viewLocation is the currently viewed page. Returns false otherwise.
     */
    $scope.isActive = function (viewLocation) {
        return viewLocation === $location.path();
    };

    /**
     * Returns the OAuth2 signedIn state.
     *
     * @returns {oauth2Provider.signedIn|*} true if siendIn, false otherwise.
     */
    $scope.getSignedInState = function () {
        return oauth2Provider.signedIn;
    };

    /**
     * Calls the OAuth2 authentication method.
     */
    $scope.signIn = function () {
        oauth2Provider.signIn(function () {
            gapi.client.oauth2.userinfo.get().execute(function (resp) {
                $scope.$apply(function () {
                    if (resp.email) {
                        oauth2Provider.signedIn = true;
                        $scope.alertStatus = 'success';
                        $scope.rootMessages = 'Logged in with ' + resp.email;
                    }
                });
            });
        });
    };

    /**
     * Render the signInButton and restore the credential if it's stored in the cookie.
     * (Just calling this to restore the credential from the stored cookie. So hiding the signInButton immediately
     *  after the rendering)
     */
    $scope.initSignInButton = function () {
        gapi.signin.render('signInButton', {
            'callback': function () {
                jQuery('#signInButton button').attr('disabled', 'true').css('cursor', 'default');
                if (gapi.auth.getToken() && gapi.auth.getToken().access_token) {
                    $scope.$apply(function () {
                        oauth2Provider.signedIn = true;
                    });
                }
            },
            'clientid': oauth2Provider.CLIENT_ID,
            'cookiepolicy': 'single_host_origin',
            'scope': oauth2Provider.SCOPES
        });
    };

    /**
     * Logs out the user.
     */
    $scope.signOut = function () {
        oauth2Provider.signOut();
        $scope.alertStatus = 'success';
        $scope.rootMessages = 'Logged out';
    };

    /**
     * Collapses the navbar on mobile devices.
     */
    $scope.collapseNavbar = function () {
        angular.element(document.querySelector('.navbar-collapse')).removeClass('in');
    };

});


/**
 * @ngdoc controller
 * @name OAuth2LoginModalCtrl
 *
 * @description
 * The controller for the modal dialog that is shown when an user needs to login to achive some functions.
 *
 */
achillesKidsApp.controllers.controller('OAuth2LoginModalCtrl',
    function ($scope, $modalInstance, $rootScope, oauth2Provider) {
        $scope.singInViaModal = function () {
            oauth2Provider.signIn(function () {
                gapi.client.oauth2.userinfo.get().execute(function (resp) {
                    $scope.$root.$apply(function () {
                        oauth2Provider.signedIn = true;
                        $scope.$root.alertStatus = 'success';
                        $scope.$root.rootMessages = 'Logged in with ' + resp.email;
                    });

                    $modalInstance.close();
                });
            });
        };
    });

achillesKidsApp.controllers.controller('ShowStudentCtrl', function ($scope, $log, oauth2Provider, HTTP_ERRORS) {
	   /**
     * Holds the status if the query is being executed.
     * @type {boolean}
     */
    $scope.submitted = false;

    $scope.selectedTab = 'ALL';

    /**
     * Holds the filters that will be applied when queryStudentsAll is invoked.
     * @type {Array}
     */
    $scope.filters = [
    ];

    $scope.filtereableFields = [
        {enumValue: 'NAME', displayName: 'Name'},
        {enumValue: 'GRADE', displayName: 'Grade'},
        {enumValue: 'SCHOOL', displayName: 'School'},
        {enumValue: 'MILES_COMPLETED', displayName: 'Miles completed'}
    ]

    /**
     * Possible operators.
     *
     * @type {{displayName: string, enumValue: string}[]}
     */
    $scope.operators = [
        {displayName: '=', enumValue: 'EQ'},
        {displayName: '>', enumValue: 'GT'},
        {displayName: '>=', enumValue: 'GTEQ'},
        {displayName: '<', enumValue: 'LT'},
        {displayName: '<=', enumValue: 'LTEQ'},
        {displayName: '!=', enumValue: 'NE'}
    ];

    $scope.students = [];

      /**
     * Holds the state if offcanvas is enabled.
     *
     * @type {boolean}
     */
    $scope.isOffcanvasEnabled = false;

       /**
     * Sets the selected tab to 'ALL'
     */
    $scope.tabAllSelected = function () {
        $scope.selectedTab = 'ALL';
        $scope.queryStudents();
    };

       /**
     * Toggles the status of the offcanvas.
     */
    $scope.toggleOffcanvas = function () {
        $scope.isOffcanvasEnabled = !$scope.isOffcanvasEnabled;
    };

    $scope.tabYouHaveCreatedSelected = function () {
    $scope.selectedTab = 'YOU_HAVE_CREATED';
    if (!oauth2Provider.signedIn) {
        oauth2Provider.showLoginModal();
        return;
    }
    $scope.queryStudents();
};

	    /**
     * Toggles the status of the offcanvas.
     */
    $scope.toggleOffcanvas = function () {
        $scope.isOffcanvasEnabled = !$scope.isOffcanvasEnabled;
    };

    /**
     * Namespace for the pagination.
     * @type {{}|*}
     */
    $scope.pagination = $scope.pagination || {};
    $scope.pagination.currentPage = 0;
    $scope.pagination.pageSize = 20;
    /**
     * Returns the number of the pages in the pagination.
     *
     * @returns {number}
     */
    $scope.pagination.numberOfPages = function () {
        return Math.ceil($scope.students.length / $scope.pagination.pageSize);
    };

        /**
     * Returns an array including the numbers from 1 to the number of the pages.
     *
     * @returns {Array}
     */
    $scope.pagination.pageArray = function () {
        var pages = [];
        var numberOfPages = $scope.pagination.numberOfPages();
        for (var i = 0; i < numberOfPages; i++) {
            pages.push(i);
        }
        return pages;
    };


    /**
     * Checks if the target element that invokes the click event has the "disabled" class.
     *
     * @param event the click event
     * @returns {boolean} if the target element that has been clicked has the "disabled" class.
     */
    $scope.pagination.isDisabled = function (event) {
        return angular.element(event.target).hasClass('disabled');
    }

    /**
     * Adds a filter and set the default value.
     */
    $scope.addFilter = function () {
        $scope.filters.push({
            field: $scope.filtereableFields[0],
            operator: $scope.operators[0],
            value: ''
        })
    };

    /**
     * Clears all filters.
     */
    $scope.clearFilters = function () {
        $scope.filters = [];
    };

       /**
     * Removes the filter specified by the index from $scope.filters.
     *
     * @param index
     */
    $scope.removeFilter = function (index) {
        if ($scope.filters[index]) {
            $scope.filters.splice(index, 1);
        }
    };

        /**
     * Query the students depending on the tab currently selected.
     *
     */
    $scope.queryStudents = function () {
        $scope.submitted = false;
        if ($scope.selectedTab == 'ALL') {
            $scope.queryStudentsAll();
        } else if ($scope.selectedTab == 'YOU_HAVE_CREATED') {
            $scope.getStudentsCreated();
        } else if ($scope.selectedTab == 'YOU_WILL_ATTEND') {
            $scope.getStudentsAttend();
        }

     /**
     * Invokes the student.queryStudents API.
     */
    $scope.queryStudentsAll = function () {
        var sendFilters = {
            filters: []
        }
        for (var i = 0; i < $scope.filters.length; i++) {
            var filter = $scope.filters[i];
            if (filter.field && filter.operator && filter.value) {
                sendFilters.filters.push({
                    field: filter.field.enumValue,
                    operator: filter.operator.enumValue,
                    value: filter.value
                });
            }
        }
        $scope.loading = true;
        gapi.client.student.queryStudents(sendFilters).
            execute(function (resp) {
                $scope.$apply(function () {
                    $scope.loading = false;
                    if (resp.error) {
                        // The request has failed.
                        var errorMessage = resp.error.message || '';
                        $scope.messages = 'Failed to query students : ' + errorMessage;
                        $scope.alertStatus = 'warning';
                        $log.error($scope.messages + ' filters : ' + JSON.stringify(sendFilters));
                    } else {
                        // The request has succeeded.
                        $scope.submitted = false;
                        $scope.messages = 'Query succeeded : ' + JSON.stringify(sendFilters);
                        $scope.alertStatus = 'success';
                        $log.info($scope.messages);

                        $scope.students = [];
                        angular.forEach(resp.items, function (student) {
                            $scope.students.push(student);
                        });
                    }
                    $scope.submitted = true;
                });
            });
        };
    };
});


achillesKidsApp.controllers.controller('StudentDetailCtrl', function ($scope, $log, $routeParams, HTTP_ERRORS) {
    $scope.student = {};

    /**
     * Initializes the student detail page.
     * Invokes the student.getStudent method and sets the returned student in the $scope.
     *
     */
    $scope.init = function () {
        $scope.loading = true;
        gapi.client.student.getStudent({
            websafeStudentKey: $routeParams.websafeStudentKey
        }).execute(function (resp) {
            $scope.$apply(function () {
                $scope.loading = false;
                if (resp.error) {
                    // The request has failed.
                    var errorMessage = resp.error.message || '';
                    $scope.messages = 'Failed to get the student : ' + $routeParams.websafeKey
                        + ' ' + errorMessage;
                    $scope.alertStatus = 'warning';
                    $log.error($scope.messages);
                } else {
                    // The request has succeeded.
                    $scope.alertStatus = 'success';
                    $scope.student = resp.result;
                }
            });
        });
    };
});

