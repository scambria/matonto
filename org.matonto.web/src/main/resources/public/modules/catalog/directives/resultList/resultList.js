(function() {
    'use strict';

    angular
        /**
         * @ngdoc overview
         * @name resultList
         * @requires catalogManager
         *
         * @description 
         * The `resultList` module only provides the `resultList` directive which creates
         * a sortable paginated list of resources.
         */
        .module('resultList', ['catalogManager', 'ontologyManager'])
        /**
         * @ngdoc directive
         * @name resultList.directive:resultList
         * @scope
         * @restrict E
         * @requires catalogManager.catalogManagerService
         *
         * @description 
         * `resultList` is a directive that creates a sortable paginated list of resources 
         * given the results in {@link catalogManager.service:catalogManagerService catalogManagerService}. 
         * The directive is replaced by the content of the template. The directive is split 
         * into three main divs: '.results-header' which contains information about the 
         * current page and a ordering select box, '.results-list' which contains the series
         * of divs for each resource in the list, and '.page-nav' with pagination buttons. 
         * The title of each resource in the results list is clickable. Each resource also 
         * has a download button.
         *
         * @usage
         * <result-list></result-list>
         */
        .directive('resultList', resultList);

        resultList.$inject = ['catalogManagerService', 'ontologyManagerService'];

        function resultList(catalogManagerService, ontologyManagerService) {
            return {
                restrict: 'E',
                controllerAs: 'dvm',
                replace: true,
                scope: {},
                controller: function() {
                    var dvm = this;
                    dvm.catalog = catalogManagerService;

                    dvm.sortOptions = [];
                    dvm.catalog.getSortOptions()
                        .then(function(options) {
                            _.forEach(options, function(option) {
                                var label = ontologyManagerService.getBeautifulIRI(option);
                                dvm.sortOptions.push({
                                    field: option,
                                    asc: true,
                                    label: label + ' (asc)'
                                });
                                dvm.sortOptions.push({
                                    field: option,
                                    asc: false,
                                    label: label + ' (desc)'
                                });
                            });
                            dvm.sortOption = dvm.sortOptions[0];
                        });

                    dvm.getEndingNumber = function() {
                        return _.min([dvm.catalog.results.totalSize, dvm.catalog.results.start + dvm.catalog.results.limit]);
                    }
                    dvm.changeSort = function() {
                        dvm.catalog.sortBy = dvm.sortOption.field;
                        dvm.catalog.asc = dvm.sortOption.asc;
                        dvm.catalog.getResources();
                    }
                    dvm.getDate = function(date) {
                        var jsDate = catalogManagerService.getDate(date);
                        return jsDate.toDateString();
                    }
                    dvm.getPage = function(direction) {
                        if (direction === 'next') {
                            dvm.catalog.currentPage += 1;
                            dvm.catalog.getResultsPage(dvm.catalog.results.links.base + dvm.catalog.results.links.next);
                        } else {
                            dvm.catalog.currentPage -= 1;
                            dvm.catalog.getResultsPage(dvm.catalog.results.links.base + dvm.catalog.results.links.prev);
                        }
                    }
                },
                templateUrl: 'modules/catalog/directives/resultList/resultList.html'
            }
        }
})();
