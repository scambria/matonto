(function() {
    'use strict';

    angular
        .module('ontologyPreview', ['prefixes', 'ontologyManager'])
        .directive('ontologyPreview', ontologyPreview);

        ontologyPreview.$inject = ['prefixes', 'ontologyManagerService'];

        function ontologyPreview(prefixes, ontologyManagerService) {
            return {
                restrict: 'E',
                controllerAs: 'dvm',
                replace: true,
                scope: {},
                bindToController: {
                    ontology: '='
                },
                controller: function() {
                    var dvm = this;
                    var classList = [];
                    var ontologyId = '';
                    dvm.numClassPreview = 5;
                    dvm.full = false;

                    dvm.createTitle = function() {
                        return ontologyManagerService.getEntityName(dvm.ontology);
                    }
                    dvm.createDescription = function() {
                        return _.get(dvm.ontology, "['" + prefixes.dc + "description'][0]['@value']");
                    }
                    dvm.createClassList = function() {
                        var classes = _.get(dvm.ontology, 'matonto.classes');
                        if (!dvm.full) {
                            classes = _.take(classes, dvm.numClassPreview);
                        }
                        classList = _.map(classes, function(classObj) {
                            return ontologyManagerService.getEntityName(classObj);
                        });
                    }
                    dvm.getClassList = function() {
                        var classNames = (classList.length === 0 || ontologyId !== dvm.ontology['@id']) ? dvm.createClassList() : classList;
                        ontologyId = _.get(dvm.ontology, '@id', '');
                        return classNames;
                    }
                },
                templateUrl: 'modules/mapper/directives/ontologyPreview/ontologyPreview.html'
            }
        }
})();
