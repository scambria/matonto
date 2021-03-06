/*-
 * #%L
 * org.matonto.web
 * $Id:$
 * $HeadURL:$
 * %%
 * Copyright (C) 2016 iNovex Information Systems, Inc.
 * %%
 * This program is free software: you can redistribute it and/or modify
 * it under the terms of the GNU Affero General Public License as published by
 * the Free Software Foundation, either version 3 of the License, or
 * (at your option) any later version.
 * 
 * This program is distributed in the hope that it will be useful,
 * but WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
 * GNU General Public License for more details.
 * 
 * You should have received a copy of the GNU Affero General Public License
 * along with this program.  If not, see <http://www.gnu.org/licenses/>.
 * #L%
 */
(function() {
    'use strict';

    angular
        /**
         * @ngdoc overview
         * @name catalogManager
         *
         * @description
         * The `catalogManager` module only provides the `catalogManagerService` service which
         * provides access to the MatOnto catalog REST endpoints and utility functions for the
         * results of those endpoints
         */
        .module('catalogManager', [])
        /**
         * @ngdoc service
         * @name catalogManager.service:catalogManagerService
         * @requires $rootScope
         * @requires $http
         * @requires $q
         * @requires prefixes.service:prefixes
         *
         * @description
         * `catalogManagerService` is a service that provides access to the MatOnto catalog REST
         * endpoints and utility functions for the resource and distribution objects that are
         * returned.
         */
        .service('catalogManagerService', catalogManagerService);

        catalogManagerService.$inject = ['$rootScope', '$http', '$q', 'prefixes'];

        function catalogManagerService($rootScope, $http, $q, prefixes) {
            var self = this,
                prefix = '/matontorest/catalog/',
                limit = 10;

            /**
             * @ngdoc property
             * @name currentPage
             * @propertyOf catalogManager.service:catalogManagerService
             * @type {number}
             *
             * @description
             * `currentPage` holds the index of the current page of results.
             */
            self.currentPage = 0;
            /**
             * @ngdoc property
             * @name results
             * @propertyOf catalogManager.service:catalogManagerService
             * @type {Object}
             *
             * @description
             * `results` holds the results of the most recent call to `/matontorest/catalog/resources`.
             * The structure of this object is:
             * ```
             * {
             *     links: {
             *         base: '',
             *         context: '',
             *         next: '',
             *         prev: '',
             *         self: ''
             *     },
             *     limit: 10,
             *     results: [],
             *     size: 0,
             *     start: 0,
             *     totalSize: 0
             * }
             * ```
             */
            self.results = {
                size: 0,
                totalSize: 0,
                results: [],
                limit: 0,
                start: 0
            };
            /**
             * @ngdoc property
             * @name selectedResource
             * @propertyOf catalogManager.service:catalogManagerService
             * @type {Object}
             *
             * @description
             * `selectedResource` holds the resource object of the most recently clicked result in the
             * {@link resultsList.directive:resultsList Result List}. The structure of this object is:
             * ```
             * {
             *     id: '',
             *     types: [],
             *     title: '',
             *     description: '',
             *     issued: {
             *         year: 2016,
             *         month: 4,
             *         day: 29,
             *         timezone: 0,
             *         hour: 0,
             *         minute: 0,
             *         second: 0,
             *         fractionalSecond: 0
             *     },
             *     modified: {
             *         year: 2016,
             *         month: 4,
             *         day: 29,
             *         timezone: 0,
             *         hour: 0,
             *         minute: 0,
             *         second: 0,
             *         fractionalSecond: 0
             *     },
             *     identifier: '',
             *     keywords: [],
             *     distributions: []
             * }
             * ```
             */
            self.selectedResource = undefined;
            /**
             * @ngdoc property
             * @name filters
             * @propertyOf catalogManager.service:catalogManagerService
             * @type {Object}
             *
             * @description
             * `filters` holds all the filters to apply to the next call to `matontorest/catalog/resources`.
             * All filters in this list are used to populate the {@link filterList.directive:filterList Filter List}.
             */
            self.filters = {
                Resources: []
            };
            /**
             * @ngdoc property
             * @name sortBy
             * @propertyOf catalogManager.service:catalogManagerService
             * @type {string}
             *
             * @description
             * `sortBy` holds the IRI of the field to sort the resources by in the next call to
             * `matontorest/catalog/resources`.
             */
            self.sortBy = '';
            /**
             * @ngdoc property
             * @name asc
             * @propertyOf catalogManager.service:catalogManagerService
             * @type {boolean}
             *
             * @description
             * `asc` holds the direction of the sort applied to the next call to `matontorest/catalog/resources`.
             */
            self.asc = false;
            /**
             * @ngdoc property
             * @name errorMessage
             * @propertyOf catalogManager.service:catalogManagerService
             * @type {string}
             *
             * @description
             * `errorMessage` holds the latest error message returned by the other methods making HTTP calls.
             */
            self.errorMessage = '';

            function initialize() {
                self.getResourceTypes()
                    .then(function(types) {
                        self.filters.Resources = _.map(types, function(type) {
                            return {
                                value: type,
                                formatter: self.getType,
                                applied: false
                            };
                        });
                    });
            }

            /**
             * @ngdoc method
             * @name getResourceTypes
             * @methodOf catalogManager.service:catalogManagerService
             *
             * @description
             * Calls the GET /matontorest/catalog/resource-types endpoint and returns the
             * array of resource type IRIs.
             *
             * @returns {Promise} A promise that resolves to an array of the IRIs for all
             * resource types in the catalog
             */
            self.getResourceTypes = function() {
                return $http.get(prefix + 'resource-types')
                    .then(function(response) {
                        return $q.resolve(response.data);
                    });
            }

            /**
             * @ngdoc method
             * @name getSortOptions
             * @methodOf catalogManager.service:catalogManagerService
             *
             * @description
             * Calls the GET /matontorest/catalog/sort-options endpoint and returns the
             * array of resource field IRIs.
             *
             * @return {Promise} A promise that resolves to an array of the IRIs for all
             * supported resource fields to sort by
             */
            self.getSortOptions = function() {
                return $http.get(prefix + 'sort-options')
                    .then(function(response) {
                        return $q.resolve(response.data);
                    });
            }

            /**
             * @ngdoc method
             * @name getResources
             * @methodOf catalogManager.service:catalogManagerService
             *
             * @description
             * Calls the GET /matontorest/catalog/resources endpoint and returns the object
             * containing paginated results for the resource query. The paginated results object
             * has the following structure:
             * ```
             * {
             *     links: {
             *         base: '',
             *         context: '',
             *         next: '',
             *         prev: '',
             *         self: ''
             *     },
             *     limit: 10,
             *     results: [],
             *     size: 0,
             *     start: 0,
             *     totalSize: 0
             * }
             * ```
             *
             * @returns {Promise} A promise that either resolves with a paginated results object
             * or is rejected with a error message.
             */
            self.getResources = function() {
                $rootScope.showSpinner = true;
                var config = {
                    params: {
                        limit: limit,
                        start: self.currentPage * self.results.limit,
                        type: _.get(_.find(self.filters.Resources, 'applied'), 'value'),
                        sortBy: self.sortBy,
                        asc: self.asc
                    }
                };
                $http.get(prefix + 'resources', config)
                    .then(function(response) {
                        self.results = response.data;
                    }, function(error) {
                        self.errorMessage = error.statusText;
                    }).then(function() {
                        $rootScope.showSpinner = false;
                    });
            }

            /**
             * @ngdoc method
             * @name getResultsPage
             * @methodOf catalogManager.service:catalogManagerService
             *
             * @description
             * Calls the GET /matontorest/catalog/resources endpoint with the passed URL and
             * returns the object containing paginated results for the resource query. The paginated
             * results object has the following structure:
             * * ```
             * {
             *     links: {
             *         base: '',
             *         context: '',
             *         next: '',
             *         prev: '',
             *         self: ''
             *     },
             *     limit: 10,
             *     results: [],
             *     size: 0,
             *     start: 0,
             *     totalSize: 0
             * }
             * ```
             * This method is meant to be used with 'links.next' and 'links.prev' URLS from a paginated
             * results object.
             *
             * @param  {string} url A URL for a /matontorest/catalog/resources call. Typically a
             * 'links.next' and 'links.prev' URLS from a paginated results object.
             * @returns {Promise} A promise that either resolves with a paginated results object
             * or is rejected with a error message.
             */
            self.getResultsPage = function(url) {
                $rootScope.showSpinner = true;
                $http.get(url)
                    .then(function(response) {
                        self.results = response.data;
                    }, function(error) {
                        self.errorMessage = error.statusText;
                    }).then(function() {
                        $rootScope.showSpinner = false;
                    });
            }

            /**
             * @ngdoc method
             * @name getResource
             * @methodOf catalogManager.service:catalogManagerService
             *
             * @description
             * Calls the GET /matontorest/catalog/resources/{resourceId} endpoint with the passed
             * resource id and returns the matching resource object if it exists. The resource
             * object has the following structure:
             * ```
             * {
             *     id: '',
             *     types: [],
             *     title: '',
             *     description: '',
             *     issued: {
             *         year: 2016,
             *         month: 4,
             *         day: 29,
             *         timezone: 0,
             *         hour: 0,
             *         minute: 0,
             *         second: 0,
             *         fractionalSecond: 0
             *     },
             *     modified: {
             *         year: 2016,
             *         month: 4,
             *         day: 29,
             *         timezone: 0,
             *         hour: 0,
             *         minute: 0,
             *         second: 0,
             *         fractionalSecond: 0
             *     },
             *     identifier: '',
             *     keywords: [],
             *     distributions: []
             * }
             * ```
             *
             * @param {string} resourceId The id of the resource to retrieve.
             * @return {Promise} A promise the resolves to the resource if it exists or is rejected to
             * an error message.
             */
            self.getResource = function(resourceId) {
                $rootScope.showSpinner = true;
                var deferred = $q.defer();
                $http.get(prefix + 'resources/' + encodeURIComponent(resourceId))
                    .then(function(response) {
                        if (response.status === 204) {
                            deferred.reject('Resource does not exist');
                        } else if (response.status === 200) {
                            deferred.resolve(response.data);
                        } else {
                            deferred.reject('An error has occurred');
                        }
                    }, function(error) {
                        deferred.reject(error.statusText);
                    }).then(function() {
                        $rootScope.showSpinner = false;
                    });
                return deferred.promise;
            }

            /**
             * @ngdoc method
             * @name getResourceDistributions
             * @methodOf catalogManager.service:catalogManagerService
             *
             * @description
             * Calls the GET /matontorest/catalog/resources/{resourceId}/distributions endpoint and
             * returns the array of distribution objects for that particular resource.
             *
             * @param {string} resourceId The id of the resource to retrieve the distributions of
             * @return {Promise} A promise that resolves to the array of distributions for a resource
             * or is rejected with an error message.
             */
            self.getResourceDistributions = function(resourceId) {
                $rootScope.showSpinner = true;
                var deferred = $q.defer();
                $http.get(prefix + 'resources/' + encodeURIComponent(resourceId) + '/distributions')
                    .then(function(response) {
                        if (response.status === 204) {
                            deferred.reject('Resource does not exist');
                        } else if (response.status === 200) {
                            deferred.resolve(response.data);
                        } else {
                            deferred.reject('An error has occurred');
                        }
                    }, function(error) {
                        deferred.reject(error.statusText);
                    }).then(function() {
                        $rootScope.showSpinner = false;
                    });
                return deferred.promise;
            }

            /**
             * @ngdoc method
             * @name getResourceDistribution
             * @methodOf catalogManager.service:catalogManagerService
             *
             * @description
             * Calls the GET /matontorest/catalog/resources/{resourceId}/distributions/{distributionId}
             * endpoint and returns the matching distribution for the particular resource. The distribution
             * object has the following structure:
             * ```
             * {
             *     id: '',
             *     title: '',
             *     description: '',
             *     license: '',
             *     rights: '',
             *     accessURL: '',
             *     downloadUrl: '',
             *     mediaType: '',
             *     format: '',
             *     issued: {
             *         year: 2016,
             *         month: 4,
             *         day: 29,
             *         timezone: 0,
             *         hour: 0,
             *         minute: 0,
             *         second: 0,
             *         fractionalSecond: 0
             *     },
             *     modified: {
             *         year: 2016,
             *         month: 4,
             *         day: 29,
             *         timezone: 0,
             *         hour: 0,
             *         minute: 0,
             *         second: 0,
             *         fractionalSecond: 0
             *     },
             *     bytesSize: 0
             * }
             * ```
             *
             * @param {string} resourceId The id of the resource with the specified distribution
             * @param {string} distributionId The id of the distribution to retrieve
             * @return {Promise} A promise that resolves to the distribution if it exists or is rejected
             * with an error message.
             */
            self.getResourceDistribution = function(resourceId, distributionId) {
                $rootScope.showSpinner = true;
                var deferred = $q.defer();
                $http.get(prefix + 'resources/' + encodeURIComponent(resourceId) + '/distributions/' + encodeURIComponent(distributionId))
                    .then(function(response) {
                        if (response.status === 204) {
                            deferred.reject('Resource and/or distribution does not exist');
                        } else {
                            deferred.resolve(response.data);
                        }
                    }, function(error) {
                        deferred.reject(error.statusText);
                    }).then(function() {
                        $rootScope.showSpinner = false;
                    });
                return deferred.promise;
            }

            /**
             * @ngdoc method
             * @name downloadResource
             * @methodOf catalogManager.service:catalogManagerService
             *
             * @description
             * Retrieves the latest distribution for a resource and calls it's download link
             * (eventually).
             *
             * @param {string} resourceId The id of the resource to download
             */
            self.downloadResource = function(resourceId) {
                self.getResourceDistributions(resourceId)
                    .then(function(distributions) {
                        var latest = _.last(_.sortBy(distributions, function(dist) {
                            return self.getDate(dist.modified);
                        }));
                        console.log('Downloading ' + latest.title);
                    }, function(errorMessage) {
                        self.errorMessage = errorMessage;
                    });
            }

            /**
             * @ngdoc method
             * @name getType
             * @methodOf catalogManager.service:catalogManagerService
             *
             * @description
             * Retrieves the local name of a resource type IRI.
             *
             * @param {string} type A resource type IRI
             * @return {string} The local name of a resource type IRI
             */
            self.getType = function(type) {
                if (typeof type === 'string') {
                    return type.replace(prefixes.catalog, '');
                }
                return '';
            }

            /**
             * @ngdoc method
             * @name getDate
             * @methodOf catalogManager.service:catalogManagerService
             *
             * @description
             * Creates a Date object from a date object in a resource or distribution object.
             *
             * @param {Object} date A date object from a resource or distribution object.
             * @param {number} date.year A full four digit year
             * @param {number} date.month A month number starting with January = 1
             * @param {number} date.day A day number
             * @param {number} date.hour A hour number
             * @param {number} date.minute A minute number
             * @param {number} date.second A second number
             * @return {Date} The Date object created with the year, month, day, hour, minute,
             * and second from the resource or distribution's date object.
             */
            self.getDate = function(date) {
                if (typeof date !== 'object' || date === null) {
                    return undefined;
                }
                var dateObj = new Date(0);
                if (_.has(date, 'year')) {
                    dateObj.setFullYear(_.get(date, 'year', 0));
                }
                if (_.has(date, 'month')) {
                    dateObj.setMonth(_.get(date, 'month', 1) - 1);
                }
                if (_.has(date, 'day')) {
                    dateObj.setDate(_.get(date, 'day', 1));
                }
                if (_.has(date, 'hour')) {
                    dateObj.setHours(_.get(date, 'hour', 0));
                }
                if (_.has(date, 'minute')) {
                    dateObj.setMinutes(_.get(date, 'minute', 0));
                }
                if (_.has(date, 'second')) {
                    dateObj.setSeconds(_.get(date, 'second', 0));
                }
                return dateObj;
            }

            initialize();
        }
})();
