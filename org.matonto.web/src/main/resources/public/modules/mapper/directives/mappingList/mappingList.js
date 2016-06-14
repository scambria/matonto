(function() {
    'use strict';

    angular
        /**
         * @ngdoc overview
         * @name mappingList
         * @requires  mappingManager
         * @requires  mapperState
         *
         * @description 
         * The `mappingList` module only provides the `mappingList` directive which creates
         * a "boxed" area with a list of saved mappings in the repository.
         */
        .module('mappingList', ['mappingManager', 'mapperState'])
        /**
         * @ngdoc directive
         * @name mappingList.directive:mappingList
         * @scope
         * @restrict E
         * @requires  mappingManager.service:mappingManagerService
         * @requires  mapperState.service:mapperStateService
         *
         * @description 
         * `mappingList` is a directive that creates a "boxed" div with an unordered list of the 
         * all the saved mappings in the repository. Each mapping name is clickable and sets the
         * selected mapping for the mapping tool. The directive is replaced by the contents of 
         * its template.
         */
        .directive('mappingList', mappingList);

        mappingList.$inject = ['mappingManagerService', 'mapperStateService'];

        function mappingList(mappingManagerService, mapperStateService) {
            return {
                restrict: 'E',
                controllerAs: 'dvm',
                replace: true,
                scope: {},
                controller: function() {
                    var dvm = this;
                    var openedMappings = [];
                    dvm.state = mapperStateService;
                    dvm.mm = mappingManagerService;

                    dvm.onClick = function(mappingName) {
                        var openedMapping = _.find(openedMappings, {name: mappingName});
                        if (openedMapping) {
                            dvm.mm.mapping = openedMapping;
                        } else {
                            dvm.mm.getMapping(mappingName).then(jsonld => {
                                var mapping = {
                                    jsonld,
                                    name: mappingName
                                };
                                dvm.mm.mapping = mapping;
                                openedMappings.push(mapping);
                            }, errorMessage => {
                                console.log(errorMessage);
                            });
                        }
                        _.remove(openedMappings, mapping => dvm.mm.previousMappingNames.indexOf(mapping.name) < 0);
                    }
                },
                templateUrl: 'modules/mapper/directives/mappingList/mappingList.html'
            }
        }
})();