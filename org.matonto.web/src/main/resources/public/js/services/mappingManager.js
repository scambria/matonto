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
         * @name mappingManager
         *
         * @description
         * The `mappingManager` module only provides the `mappingManagerService` service which
         * provides access to the MatOnto mapping REST endpoints and utility functions for
         * manipulating mapping arrays
         */
        .module('mappingManager', [])
        /**
         * @ngdoc service
         * @name mappingManager.service:mappingManagerService
         * @requires $window
         * @requires $rootScope
         * @requires $filter
         * @requires $http
         * @requires $q
         * @requires prefixes.service:prefixes
         * @requires ontologyManager.service:ontologyManagerService
         * @requires uuid
         *
         * @description
         * `mappingManagerService` is a service that provides access to the MatOnto mapping REST
         * endpoints and utility functions for editing/creating mapping arrays and accessing
         * various aspects of mapping arrays.
         */
        .service('mappingManagerService', mappingManagerService);

        mappingManagerService.$inject = ['$window', '$rootScope', '$filter', '$http', '$q', 'ontologyManagerService', 'prefixes', 'uuid'];

        function mappingManagerService($window, $rootScope, $filter, $http, $q, ontologyManagerService, prefixes, uuid) {
            var self = this,
                prefix = '/matontorest/mappings';

            /**
             * @ngdoc property
             * @name mappingIds
             * @propertyOf mappingManager.service:mappingManagerService
             * @type {string[]}
             *
             * @description
             * `mappingIds` holds an array of the local names of all saved mappings in the
             * MatOnto repository
             */
            self.mappingIds = [];

            /**
             * @ngdoc method
             * @name reset
             * @propertyOf mappingManager.service:mappingManagerService
             *
             * @description
             * Resets all state variables.
             */
            self.reset = function() {
                self.mappingIds = [];
            }
            /**
             * @ngdoc method
             * @name initialize
             * @propertyOf mappingManager.service:mappingManagerService
             *
             * @description
             * Initializes the `mappingManagerService` by setting the list of
             * {@link mappingManager.service:mappingManagerService#mappingIds mapping ids}.
             */
            self.initialize = function() {
                $rootScope.showSpinner = true;
                $http.get(prefix)
                    .then(response => {
                        self.mappingIds = _.get(response, 'data', []);
                    }, response => {
                        console.log(_.get(response, 'statusText', 'Something went wrong. Could not load mapping ids'));
                    })
                    .then(() => $rootScope.showSpinner = false);
            }

            // REST endpoint calls
            /**
             * @ngdoc method
             * @name upload
             * @methodOf mappingManager.service:mappingManagerService
             *
             * @description
             * Calls the POST /matontorest/mappings endpoint which uploads a mapping to the MatOnto
             * repository with a generated IRI. Returns a promise with the IRI of the newly uploaded
             * mapping.
             *
             * @param {Object[]} mapping The JSON-LD object of a mapping
             * @returns {Promise} A promise with the IRI of the uploaded mapping
             */
            self.upload = function(mapping) {
                var deferred = $q.defer(),
                    fd = new FormData(),
                    config = {
                        transformRequest: angular.identity,
                        headers: {
                            'Content-Type': undefined,
                            'Accept': 'text/plain'
                        }
                    };
                fd.append('jsonld', angular.toJson(mapping));

                $rootScope.showSpinner = true;
                $http.post(prefix, fd, config)
                    .then(response => {
                        self.mappingIds = _.union(self.mappingIds, [response.data]);
                        deferred.resolve(response.data);
                    }, response => {
                        deferred.reject(_.get(response, 'statusText', ''));
                    }).then(() => {
                        $rootScope.showSpinner = false;
                    });
                return deferred.promise;
            }

            /**
             * @ngdoc method
             * @name getMapping
             * @methodOf mappingManager.service:mappingManagerService
             *
             * @description
             * Calls the GET /matontorest/mappings/{mappingName} endpoint which returns the JSONL-LD
             * of a saved mapping. Returns a promise with "@graph" of the mapping.
             *
             * @param {string} mappingName The IRI for the mapping with the user-defined local name
             * @returns {Promise} A promise with the JSON-LD of the uploaded mapping
             */
            self.getMapping = function(mappingId) {
                var deferred = $q.defer();
                $rootScope.showSpinner = true;
                $http.get(prefix + '/' + encodeURIComponent(mappingId))
                    .then(response => {
                        deferred.resolve(_.get(response.data, '@graph', []));
                    }, response => {
                        deferred.reject(_.get(response, 'statusText', ''));
                    }).then(() => {
                        $rootScope.showSpinner = false;
                    });
                return deferred.promise;
            }
            /**
             * @ngdoc method
             * @name downloadMapping
             * @methodOf mappingManager.service:mappingManagerService
             *
             * @description
             * Calls the GET /matontorest/mappings/{mappingName} endpoint using the `window.location` function
             * which will start a download of the JSON-LD of a saved mapping.
             *
             * @param {string} mappingName The IRI for the mapping with the user-defined local name
             * @param {string} format the RDF serialization to retrieve the mapping in
             */
            self.downloadMapping = function(mappingId, format) {
                $window.location = prefix + '/' + encodeURIComponent(mappingId) + '?format=' + format;
            }
            /**
             * @ngdoc method
             * @name deleteMapping
             * @methodOf mappingManager.service:mappingManagerService
             *
             * @description
             * Calls the DELETE /matontorest/mappings/{mappingName} endpoint which deleted the specified
             * mapping from the MatOnto repository. Returns a promise with the success of the deletion.
             *
             * @param {string} mappingName The IRI for the mapping with the user-defined local name
             * @returns {Promise} A promise with a boolean indication the success of the deletion.
             */
            self.deleteMapping = function(mappingId) {
                var deferred = $q.defer();
                $rootScope.showSpinner = true;
                $http.delete(prefix + '/' + encodeURIComponent(mappingId))
                    .then(response => {
                        _.pull(self.mappingIds, mappingId);
                        deferred.resolve();
                    }, response => {
                        deferred.reject(_.get(response, 'statusText', ''));
                    }).then(() => {
                        $rootScope.showSpinner = false;
                    });
                return deferred.promise;
            }

            /**
             * @ngdoc method
             * @name getMappingId
             * @methodOf mappingManager.service:mappingManagerService
             *
             * @description
             * Creates a mapping id from the display (local) name of a mapping.
             *
             * @param {string} mappingName The display (local) name of a mapping
             * @return {string} A mapping id made from the display (local) name of a mapping
             */
            self.getMappingId = function(mappingName) {
                return prefixes.mappings + mappingName;
            }

            // Edit mapping methods
            /**
             * @ngdoc method
             * @name createNewMapping
             * @methodOf mappingManager.service:mappingManagerService
             *
             * @description
             * Creates a new mapping array with only the mapping entity defined with the passed IRI.
             *
             * @param {string} iri The IRI of the new mapping
             * @returns {Object[]} A new mapping array
             */
            self.createNewMapping = function(iri) {
                var jsonld = [];
                var mappingEntity = {
                    '@id': iri,
                    '@type': [prefixes.delim + 'Mapping']
                };
                jsonld.push(mappingEntity);
                return jsonld;
            }
            /**
             * @ngdoc method
             * @name setSourceOntology
             * @methodOf mappingManager.service:mappingManagerService
             *
             * @description
             * Sets the `sourceOntology` property to a mapping's `Mapping` entity.
             *
             * @param {Object[]} mapping The mapping JSON-LD array
             * @param {string} ontologyId The id of the ontology to set as the source ontology
             */
            self.setSourceOntology = function(mapping, ontologyId) {
                var mappingEntity = getMappingEntity(mapping);
                mappingEntity[prefixes.delim + 'sourceOntology'] = [{'@id': ontologyId}];
            }
            /**
             * @ngdoc method
             * @name copyMapping
             * @methodOf mappingManager.service:mappingManagerService
             *
             * @description
             * Creates a copy of a mapping using the passed new id, updating all ids to use the new
             * mapping id.
             *
             * @param {Object[]} mapping A mapping JSON-LD array
             * @param {string} newId The id of the new mapping
             * @return {Object[]} A copy of the passed mapping with the new id
             */
            self.copyMapping = function(mapping, newId) {
                var newMapping = angular.copy(mapping);
                getMappingEntity(newMapping)['@id'] = newId;
                var idTransforms = {};
                _.forEach(self.getAllClassMappings(newMapping), classMapping => {
                    _.set(idTransforms, encodeURIComponent(classMapping['@id']), newId + '/' + uuid.v4());
                    classMapping['@id'] = _.get(idTransforms, encodeURIComponent(classMapping['@id']));
                    _.forEach(_.concat(getDataProperties(classMapping), getObjectProperties(classMapping)), propIdObj => {
                        _.set(idTransforms, encodeURIComponent(propIdObj['@id']), newId + '/' + uuid.v4());
                        propIdObj['@id'] = _.get(idTransforms, encodeURIComponent(propIdObj['@id']));
                    });
                });
                _.forEach(_.concat(self.getAllDataMappings(newMapping), self.getAllObjectMappings(newMapping)), propMapping => {
                    if (self.isObjectMapping(propMapping)) {
                        propMapping[prefixes.delim + 'classMapping'][0]['@id'] = _.get(idTransforms, encodeURIComponent(propMapping[prefixes.delim + 'classMapping'][0]['@id']));
                    }
                    propMapping['@id'] = _.get(idTransforms, encodeURIComponent(propMapping['@id']));
                });
                return newMapping;
            }
            /**
             * @ngdoc method
             * @name addClass
             * @methodOf mappingManager.service:mappingManagerService
             *
             * @description
             * Adds a class mapping to a mapping based on the given class id. The class must be present
             * in the passed ontology.
             *
             * @param {Object[]} mapping The mapping JSON-LD array
             * @param {Object[]} ontology The ontology array to search for the class in
             * @param {string} classId The id of the class in the ontology
             * @returns {Object} The new class mapping object
             */
            self.addClass = function(mapping, ontology, classId) {
                var classEntity = undefined;
                // Check if class exists in ontology
                if (ontologyManagerService.getEntity(ontology, classId)) {
                    // Collect IRI sections for prefix and create class mapping
                    var splitIri = $filter('splitIRI')(classId);
                    var ontologyDataName = ontologyManagerService.getBeautifulIRI(self.getSourceOntologyId(mapping)).toLowerCase();
                    classEntity = {
                        '@id': getMappingEntity(mapping)['@id'] + '/' + uuid.v4(),
                        '@type': [prefixes.delim + 'ClassMapping']
                    };
                    classEntity[prefixes.delim + 'mapsTo'] = [{'@id': classId}];
                    classEntity[prefixes.delim + 'hasPrefix'] = [{'@value': prefixes.data + ontologyDataName + '/' + splitIri.end.toLowerCase() + '/'}];
                    classEntity[prefixes.delim + 'localName'] = [{'@value': '${UUID}'}];
                    mapping.push(classEntity);
                }

                return classEntity;
            }
            /**
             * @ngdoc method
             * @name editIriTemplate
             * @methodOf mappingManager.service:mappingManagerService
             *
             * @description
             * Edits the IRI template of a class mapping specified by id in a mapping. Sets the `hasPrefix`
             * and `localName` properties of the class mapping.
             *
             * @param {Object[]} mapping The mapping JSON-LD array
             * @param {string} classMappingId The id of the class mapping whose IRI template will be edited
             * @param {string} prefixEnd The new end of the prefix
             * @param {string} localNamePattern The new local name pattern. Must be in the following format:
             * `${index/UUID}`
             */
            self.editIriTemplate = function(mapping, classMappingId, prefixEnd, localNamePattern) {
                // Check if class mapping exists in mapping
                if (entityExists(mapping, classMappingId)) {
                    var classMapping = getEntityById(mapping, classMappingId);
                    var ontologyDataName = ontologyManagerService.getBeautifulIRI(self.getSourceOntologyId(mapping)).toLowerCase();
                    classMapping[prefixes.delim + 'hasPrefix'] = [{'@value': prefixes.data + ontologyDataName + '/' + prefixEnd}];
                    classMapping[prefixes.delim + 'localName'] = [{'@value': localNamePattern}];
                }
            }
            /**
             * @ngdoc method
             * @name addDataProp
             * @methodOf mappingManager.service:mappingManagerService
             *
             * @description
             * Adds a data property mapping to a mapping for the specified class mapping. The class mapping
             * must already be in the mapping and the data property must exist in the passed ontology. Sets
             * the `columnIndex` of the data property mapping to the passed index.
             *
             * @param {Object[]} mapping The mapping JSON-LD array
             * @param {Object[]} ontology The ontology array to search for the property in
             * @param {string} classMappingId The id of the class mapping to add the data property mapping to
             * @param {string} propId The id of the data property in the ontology
             * @param {number} columnIndex The column index to set the data property mapping's `columnIndex`
             * property to
             * @returns {Object} The new data property mapping object
             */
            self.addDataProp = function(mapping, ontology, classMappingId, propId, columnIndex) {
                var dataEntity;
                // Check if class mapping exists and the property exists in the ontology
                var propObj = ontologyManagerService.getEntity(ontology, propId);
                if (entityExists(mapping, classMappingId) && propObj && ontologyManagerService.isDataTypeProperty(propObj)) {
                    // Add new data mapping id to data properties of class mapping
                    dataEntity = {
                        '@id': getMappingEntity(mapping)['@id'] + '/' + uuid.v4()
                    };
                    var classMapping = getEntityById(mapping, classMappingId);
                    // Sets the dataProperty key if not already present
                    classMapping[prefixes.delim + 'dataProperty'] = getDataProperties(classMapping);
                    classMapping[prefixes.delim + 'dataProperty'].push(angular.copy(dataEntity));
                    // Create data mapping
                    dataEntity['@type'] = [prefixes.delim + 'DataMapping'];
                    dataEntity[prefixes.delim + 'columnIndex'] = [{'@value': `${columnIndex}`}];
                    dataEntity[prefixes.delim + 'hasProperty'] = [{'@id': propId}];
                    mapping.push(dataEntity);
                }

                return dataEntity;
            }
            /**
             * @ngdoc method
             * @name addObjectProp
             * @methodOf mappingManager.service:mappingManagerService
             *
             * @description
             * Adds a object property mapping to a mapping for the specified class mapping. The class mapping
             * and the range class mapping must already be in the mapping, the object property must exist in
             * the passed ontology, and the object property range must match the type of the range class mapping.
             *
             * @param {Object[]} mapping The mapping JSON-LD array
             * @param {Object[]} ontology The ontology array to search for the property in
             * @param {string} classMappingId The id of the class mapping to add the object property mapping to
             * @param {string} propId The id of the object property in the ontology
             * @param {string} rangeClassMappingId The id of the class mapping to set as the range of the new
             * object property mapping
             * @returns {Object} The new object property mapping
             */
            self.addObjectProp = function(mapping, ontology, classMappingId, propId, rangeClassMappingId) {
                var objectEntity;
                // Check if class mapping exists, range class mapping exists, object property exists in ontology,
                // and object property range matches the range class mapping
                var propObj = ontologyManagerService.getEntity(ontology, propId);
                if (entityExists(mapping, classMappingId) && entityExists(mapping, rangeClassMappingId) && propObj && ontologyManagerService.isObjectProperty(propObj)
                        && _.get(propObj, "['" + prefixes.rdfs + "range'][0]['@id']") === getEntityById(mapping, rangeClassMappingId)[prefixes.delim + 'mapsTo'][0]['@id']) {
                    // Add new object mapping id to object properties of class mapping
                    objectEntity = {
                        '@id': getMappingEntity(mapping)['@id'] + '/' + uuid.v4()
                    };
                    var classMapping = getEntityById(mapping, classMappingId);
                    classMapping[prefixes.delim + 'objectProperty'] = getObjectProperties(classMapping);
                    classMapping[prefixes.delim + 'objectProperty'].push(angular.copy(objectEntity));
                    // Create object mapping
                    objectEntity['@type'] = [prefixes.delim + 'ObjectMapping'];
                    objectEntity[prefixes.delim + 'classMapping'] = [{'@id': rangeClassMappingId}];
                    objectEntity[prefixes.delim + 'hasProperty'] = [{'@id': propId}];
                    mapping.push(objectEntity);
                }

                return objectEntity;
            }
            /**
             * @ngdoc method
             * @name removeProp
             * @methodOf mappingManager.service:mappingManagerService
             *
             * @description
             * Removes a property mapping from a mapping from the specified class mapping. The class mapping and
             * property mapping must already be in the mapping.
             *
             * @param {Object[]} mapping The mapping JSON-LD array
             * @param {string} classMappingId The id of the class mapping with the property mapping to remove
             * @param {string} propMappingId The id of the property mapping to remove
             */
            self.removeProp = function(mapping, classMappingId, propMappingId) {
                if (entityExists(mapping, propMappingId)) {
                    // Collect the property mapping and the class mapping
                    var propMapping = getEntityById(mapping, propMappingId);
                    var propType = self.isObjectMapping(propMapping) ? 'objectProperty' : 'dataProperty';
                    var classMapping = getEntityById(mapping, classMappingId);
                    // Remove the property mapping
                    _.pull(mapping, propMapping);
                    // Remove the property mapping id from the class mapping's properties
                    _.remove(classMapping[prefixes.delim + propType], {'@id': propMappingId});
                    cleanPropertyArray(classMapping, propType);
                }
            }
            /**
             * @ngdoc method
             * @name removeClass
             * @methodOf mappingManager.service:mappingManagerService
             *
             * @description
             * Removes a class mapping from a mapping. The class mapping must already be in the mapping.
             * Also removes every property mapping from the specified class mapping and any object property
             * mappings from other class mappings that point to it.
             *
             * @param {Object[]} mapping The mapping JSON-LD array
             * @param {string} classMappingId The id of the class mapping to remove
             */
            self.removeClass = function(mapping, classMappingId) {
                if (entityExists(mapping, classMappingId)) {
                    // Collect class mapping and any object mappings that use the class mapping
                    var classMapping = getEntityById(mapping, classMappingId);
                    var classId = self.getClassIdByMapping(classMapping);
                    var objectMappings = self.getPropsLinkingToClass(mapping, classMapping['@id']);
                    // If there are object mappings that use the class mapping, iterate through them
                    _.forEach(objectMappings, objectMapping => {
                        // Collect the class mapping that uses the object mapping
                        var classWithObjectMapping = self.findClassWithObjectMapping(mapping, objectMapping['@id']);
                        // Remove the object property for the object mapping
                        _.remove(classWithObjectMapping[prefixes.delim + 'objectProperty'], {'@id': objectMapping['@id']});
                        cleanPropertyArray(classWithObjectMapping, 'objectProperty');
                        //Replace class mapping
                        mapping.splice(_.findIndex(mapping, {'@id': classWithObjectMapping['@id']}), 1, classWithObjectMapping);
                        // Remove object mapping
                        _.remove(mapping, objectMapping);
                    });
                    // Remove all properties of the class mapping and the class mapping itself
                    _.forEach(_.concat(getDataProperties(classMapping), getObjectProperties(classMapping)), prop => {
                        self.removeProp(mapping, classMapping['@id'], prop['@id']);
                    });
                    _.remove(mapping, {'@id': classMapping['@id']});
                }
            }

            // Source Ontology methods
            /**
             * @ngdoc method
             * @name  getOntology
             * @methodOf mappingManager.service:mappingManagerService
             *
             * @description
             * Retrieves an ontology and structures it for the mappingManagerService with its id and the list of
             * entities within it. Returns a Promise with the structured ontology. The structure looks like:
             * ```
             * {
             *    id: 'http://example.com/ontology',
             *    entities: []
             * }
             * ```
             *
             * @param {string} ontologyId The id of the ontology to retrieve
             * @return {Promise} A Promise that resolves with a structured ontology if the call was successful;
             * rejects otherwise
             */
            self.getOntology = function(ontologyId) {
                $rootScope.showSpinner = true;
                var deferred = $q.defer();
                var onError = function(response) {
                    deferred.reject(_.get(response, 'statusText', ''));
                    $rootScope.showSpinner = false;
                };
                ontologyManagerService.getOntology(ontologyId).then(response => {
                    if (_.get(response, 'status') === 200) {
                        var obj = _.pick(response.data, ['ontology', 'id']);
                        deferred.resolve({id: obj.id, entities: obj.ontology});
                    } else {
                        onError(response);
                    }
                }, onError).then(() => {
                    $rootScope.showSpinner = false;
                });
                return deferred.promise;
            };
            /**
             * @ngdoc method
             * @name getSourceOntologies
             * @methodOf mappingManager.service:mappingManagerService
             *
             * @description
             * Gets the list of source ontologies from the imports closure of the ontology with the passed
             * id. If no id is passed, returns a promise with an empty array. If the ontologies are found
             * successfully, returns a promise the source ontologies. Otherwise, returns a promise that
             * rejects with an error message.
             *
             * @param {string} ontologyId The id of the ontology to collect the imports closure of
             * @returns {Promise} A promise that resolves to an array of objects if no id is passed or the
             * source ontologies are found; rejects otherwise
             */
            self.getSourceOntologies = function(ontologyId) {
                if (!ontologyId) {
                    return $q.when([]);
                }
                var deferred1 = $q.defer();
                var deferred2 = $q.defer();
                var ontology = _.find(ontologyManagerService.list, {ontologyId: ontologyId});
                if (ontology) {
                    var obj = _.pick(ontology, ['ontologyId', 'ontology']);
                    deferred1.resolve({id: obj.ontologyId, entities: obj.ontology});
                } else {
                    self.getOntology(ontologyId).then(ontology => {
                        deferred1.resolve(ontology);
                    }, error => {
                        deferred1.reject(error);
                    });
                }
                deferred1.promise.then(ontology => {
                    ontologyManagerService.getImportedOntologies(ontology.id).then(imported => {
                        var importedOntologies = _.map(imported, obj => {
                            return {id: obj.ontologyId, entities: obj.ontology};
                        });
                        deferred2.resolve(_.concat(ontology, importedOntologies));
                    }, error => {
                        deferred2.reject(error);
                    });
                }, error => {
                    deferred2.reject(error);
                });

                return deferred2.promise;
            }
            /**
             * @ngdoc method
             * @name getSourceOntologyId
             * @methodOf mappingManager.service:mappingManagerService
             *
             * @description
             * Collects the source ontology id of the passed mapping.
             *
             * @param {Object[]} mapping The mapping JSON-LD array
             * @returns {string} The id of the source ontology of a mapping
             */
            self.getSourceOntologyId = function(mapping) {
                return _.get(
                    getMappingEntity(mapping),
                    "['" + prefixes.delim + "sourceOntology'][0]['@id']",
                    ''
                );
            }
            /**
             * @ngdoc method
             * @name getSourceOntology
             * @methodOf mappingManager.service:mappingManagerService
             *
             * @description
             * Collects the source ontology of the passed mapping using the source ontology id and
             * the passed list of structured ontologies.
             *
             * @param {Object[]} mapping The mapping JSON-LD array
             * @param {Object[]} ontologies The list of ontologies to search through to find the
             * source ontology
             * @returns {Object} The source ontology of a mapping
             */
            self.getSourceOntology = function(mapping, ontologies) {
                return _.find(ontologies, {id: self.getSourceOntologyId(mapping)});
            }
            /**
             * @ngdoc method
             * @name findSourceOntologyWithClass
             * @methodOf mappingManager.service:mappingManagerService
             *
             * @description
             * Finds the ontology in the passed list of structured ontologies that contains the class
             * with the passed IRI.
             *
             * @param {string} classIRI The IRI of the class to search for
             * @param {Object[]} ontologies The list of ontologies to search for the class in
             * @return {Object} The ontology with the class with the passed IRI
             */
            self.findSourceOntologyWithClass = function(classIRI, ontologies) {
                return _.find(ontologies, ontology => _.findIndex(ontologyManagerService.getClasses(ontology.entities), {'@id': classIRI}) !== -1);
            }
            /**
             * @ngdoc method
             * @name findSourceOntologyWithProp
             * @methodOf mappingManager.service:mappingManagerService
             *
             * @description
             * Finds the ontology in the passed list of structured ontologies that contains the property
             * with the passed IRI.
             *
             * @param {string} propertyIRI The IRI of the property to search for
             * @param {Object[]} ontologies The list of ontologies to search for the property in
             * @return {Object} The ontology containing the property with the passed IRI
             */
            self.findSourceOntologyWithProp = function(propertyIRI, ontologies) {
                return _.find(ontologies, ontology => {
                    var properties = _.concat(ontologyManagerService.getDataTypeProperties(ontology.entities), ontologyManagerService.getObjectProperties(ontology.entities));
                    return _.findIndex(properties, {'@id': propertyIRI}) !== -1;
                });
            }
            /**
             * @ngdoc method
             * @name areCompatible
             * @methodOf mappingManager.service:mappingManagerService
             *
             * @description
             * Tests whether a mapping is compatible with the passed listed of structured ontologies. A mapping is
             * incompatible if mapped classes or properties no longer exist or mapped properties have changed
             * property type.
             *
             * @param {Object[]} mapping The mapping JSON-LD array
             * @param {Object[]} ontololgies The array of ontologies to test for compatibililty with
             * @return {boolean} True if the passed list of ontologies have not changed in an incompatible way;
             * false otherwise
             */
            self.areCompatible = function(mapping, ontologies) {
                return !_.some(self.getAllClassMappings(mapping), classMapping => {
                    if (!self.findSourceOntologyWithClass(self.getClassIdByMapping(classMapping), ontologies)) {
                        return true;
                    }
                    return _.some(self.getPropMappingsByClass(mapping, classMapping['@id']), propMapping => {
                        var propId = self.getPropIdByMapping(propMapping);
                        var ontology = self.findSourceOntologyWithProp(propId, ontologies);
                        if (!ontology) {
                            return true;
                        } else {
                            var propObj = ontologyManagerService.getEntity(ontology.entities, propId);
                            if (ontologyManagerService.isObjectProperty(propObj) && self.isDataMapping(propMapping)) {
                                return true;
                            }
                            if (ontologyManagerService.isDataTypeProperty(propObj) && self.isObjectMapping(propMapping)) {
                                return true;
                            }
                        }
                    });
                });
            }

            // Public helper methods
            /**
             * @ngdoc method
             * @name getClassIdByMappingId
             * @methodOf mappingManager.service:mappingManagerService
             *
             * @description
             * Collects the id of the class being mapped by a class mapping specified by id.
             *
             * @param {Object[]} mapping The mapping JSON-LD array
             * @param {string} classMappingId The id of the class mapping to collect the class id from
             * @returns {string} The id of the class mapped by the class mapping
             */
            self.getClassIdByMappingId = function(mapping, classMappingId) {
                return self.getClassIdByMapping(getEntityById(mapping, classMappingId));
            }
            /**
             * @ngdoc method
             * @name getClassIdByMapping
             * @methodOf mappingManager.service:mappingManagerService
             *
             * @description
             * Collects the id of the class being mapped by the passed class mapping.
             *
             * @param {Object} classMapping The the class mapping to collect the class id from
             * @returns {string} The id of the class mapped by the class mapping
             */
            self.getClassIdByMapping = function(classMapping) {
                return _.get(classMapping, "['" + prefixes.delim + "mapsTo'][0]['@id']", '');
            }
            /**
             * @ngdoc method
             * @name getPropIdByMappingId
             * @methodOf mappingManager.service:mappingManagerService
             *
             * @description
             * Collects the id of the property being mapped by a property mapping specified by id.
             *
             * @param {Object[]} mapping The mapping JSON-LD array
             * @param {string} propMappingId The id of the property mapping to collect the property
             * id from
             * @returns {string} The id of the property mapped by the property mapping
             */
            self.getPropIdByMappingId = function(mapping, propMappingId) {
                return self.getPropIdByMapping(getEntityById(mapping, propMappingId));
            }
            /**
             * @ngdoc method
             * @name getPropIdByMapping
             * @methodOf mappingManager.service:mappingManagerService
             *
             * @description
             * Collects the id of the property being mapped by the passed property mapping.
             *
             * @param {Object} propMapping The property mapping to collect the property id from
             * @returns {string} The id of the property mapped by the property mapping
             */
            self.getPropIdByMapping = function(propMapping) {
                return _.get(propMapping, "['" + prefixes.delim + "hasProperty'][0]['@id']", '');
            }
            /**
             * @ngdoc method
             * @name getDataMappingFromClass
             * @methodOf mappingManager.service:mappingManagerService
             *
             * @description
             * Retrieves the data mapping mapping the specified property from the specified class
             * mapping in a mapping.
             *
             * @param {Object[]} mapping The mapping JSON-LD array
             * @param {string} classMappingId The id of the class mapping with the requested data property
             * @param {string} propId The id of the requested data property
             * @returns {Object} The data property mapping which maps the specified data property
             */
            self.getDataMappingFromClass = function(mapping, classMappingId, propId) {
                var dataProperties = _.map(getDataProperties(getEntityById(mapping, classMappingId)), '@id');
                var dataMappings = getMappingsForProp(mapping, propId);
                if (dataProperties.length && dataMappings.length) {
                    return _.find(dataMappings, mapping => dataProperties.indexOf(mapping['@id']) >= 0);
                }
                return undefined;
            }
            /**
             * @ngdoc method
             * @name getAllClassMappings
             * @methodOf mappingManager.service:mappingManagerService
             *
             * @description
             * Retrieves all class mapping in the passed mapping array.
             *
             * @param {Object[]} mapping The mapping JSON-LD array
             * @returns {Object[]} An array of all the class mappings in the passed mapping array
             */
            self.getAllClassMappings = function(mapping) {
                return getEntitiesByType(mapping, 'ClassMapping');
            }
            /**
             * @ngdoc method
             * @name getAllDataMappings
             * @methodOf mappingManager.service:mappingManagerService
             *
             * @description
             * Retrieves all data property mapping in the passed mapping array.
             *
             * @param {Object[]} mapping The mapping JSON-LD array
             * @returns {Object[]} An array of all the data property mappings in the passed mapping array
             */
            self.getAllDataMappings = function(mapping) {
                return getEntitiesByType(mapping, 'DataMapping');
            }
            /**
             * @ngdoc method
             * @name getAllObjectMappings
             * @methodOf mappingManager.service:mappingManagerService
             *
             * @description
             * Retrieves all object property mapping in the passed mapping array.
             *
             * @param {Object[]} mapping The mapping JSON-LD array
             * @returns {Object[]} An array of all the object property mappings in the passed mapping array
             */
            self.getAllObjectMappings = function(mapping) {
                return getEntitiesByType(mapping, 'ObjectMapping');
            }
            /**
             * @ngdoc method
             * @name getAllObjectMappings
             * @methodOf mappingManager.service:mappingManagerService
             *
             * @description
             * Retrieves all property mappings for the specified class mapping in the passed mapping.
             *
             * @param {Object[]} mapping The mapping JSON-LD array
             * @param {string} classMappingId The id of the class mapping to collect property mappings from
             * @returns {Object[]} An array of all the property mappings for the specified class mapping
             */
            self.getPropMappingsByClass = function(mapping, classMappingId) {
                var classMapping = getEntityById(mapping, classMappingId);
                return _.intersectionBy(
                    mapping, _.concat(getDataProperties(classMapping), getObjectProperties(classMapping)),
                    '@id'
                );
            }
            /**
             * @ngdoc method
             * @name isClassMapping
             * @methodOf mappingManager.service:mappingManagerService
             *
             * @description
             * Tests whether the passed mapping entity is a class mapping.
             *
             * @param {Object} entity A mapping entity
             * @returns {boolean} A boolean indicating whether the entity is a class mapping
             */
            self.isClassMapping = function(entity) {
                return isType(entity, 'ClassMapping');
            }
            /**
             * @ngdoc method
             * @name isObjectMapping
             * @methodOf mappingManager.service:mappingManagerService
             *
             * @description
             * Tests whether the passed mapping entity is an object property mapping.
             *
             * @param {Object} entity A mapping entity
             * @returns {boolean} A boolean indicating whether the entity is an object property mapping
             */
            self.isObjectMapping = function(entity) {
                return isType(entity, 'ObjectMapping');
            }
            /**
             * @ngdoc method
             * @name isDataMapping
             * @methodOf mappingManager.service:mappingManagerService
             *
             * @description
             * Tests whether the passed mapping entity is a data property mapping.
             *
             * @param {Object} entity A mapping entity
             * @returns {boolean} A boolean indicating whether the entity is a data property mapping
             */
            self.isDataMapping = function(entity) {
                return isType(entity, 'DataMapping');
            }
            /**
             * @ngdoc method
             * @name findClassWithDataMapping
             * @methodOf mappingManager.service:mappingManagerService
             *
             * @description
             * Finds the class mapping which contains the specified data property mapping.
             *
             * @param {Object[]} mapping The mapping JSON-LD array
             * @param {string} dataMappingId The id of a data property mapping
             * @returns {Object} The class mapping which contains the specified data property mapping
             */
            self.findClassWithDataMapping = function(mapping, dataMappingId) {
                return findClassWithPropMapping(mapping, dataMappingId, 'dataProperty');
            }
            /**
             * @ngdoc method
             * @name findClassWithObjectMapping
             * @methodOf mappingManager.service:mappingManagerService
             *
             * @description
             * Finds the class mapping which contains the specified object property mapping.
             *
             * @param {Object[]} mapping The mapping JSON-LD array
             * @param {string} objectMappingId The id of a data property mapping
             * @returns {Object} The class mapping which contains the specified object property mapping
             */
            self.findClassWithObjectMapping = function(mapping, objectMappingId) {
                return findClassWithPropMapping(mapping, objectMappingId, 'objectProperty');
            }
            /**
             * @ngdoc method
             * @name getPropsLinkingToClass
             * @methodOf mappingManager.service:mappingManagerService
             *
             * @description
             * Finds all property mappings that link to the class mapping with the specified id.
             *
             * @param {Object[]} mapping The mapping JSON-LD array
             * @param {string} classMappingId The id of the class mapping to search for properties linking to
             * @return {Object[]} The property mappings that link to the specified class mapping
             */
            self.getPropsLinkingToClass = function(mapping, classMappingId) {
                return _.filter(
                    self.getAllObjectMappings(mapping),
                    ["['" + prefixes.delim + "classMapping'][0]['@id']", classMappingId]
                );
            }
            /**
             * @ngdoc method
             * @name getPropMappingTitle
             * @methodOf mappingManager.service:mappingManagerService
             *
             * @description
             * Creates a title for a property mapping using the passed class and property names.
             *
             * @param {string} className The name of the containing class
             * @param {string} propName The name of the property
             * @returns {string} A standardized title for a property mapping
             */
            self.getPropMappingTitle = function(className, propName) {
                return className + ': ' + propName;
            }
            /**
             * @ngdoc method
             * @name getBaseClass
             * @methodOf mappingManager.service:mappingManagerService
             *
             * @description
             * Finds the base class of a mapping by finding the class mapping that isn't used by an
             * object property mapping.
             *
             * @param {Object[]} mapping The mapping JSON-LD array
             * @return {Object} The base class mapping object
             */
            self.getBaseClass = function(mapping) {
                var classes = self.getAllClassMappings(mapping);
                var usedClasses = _.map(self.getAllObjectMappings(mapping), "['" + prefixes.delim + "classMapping'][0]['@id']");
                return _.get(_.filter(classes, classMap => !_.includes(usedClasses, classMap['@id'])), '0');
            }

            // Private helper methods
            function cleanPropertyArray(classMapping, propType) {
                if (_.get(classMapping, prefixes.delim + propType) && _.get(classMapping, prefixes.delim + propType).length === 0) {
                    delete classMapping[prefixes.delim + propType];
                }
            }
            function getEntitiesByType(mapping, type) {
                return _.filter(mapping, {'@type': [prefixes.delim + type]});
            }
            function getEntityById(mapping, id) {
                return _.find(mapping, {'@id': id});
            }
            function entityExists(mapping, id) {
                return !!getEntityById(mapping, id);
            }
            function getClassMappingsByClass(mapping, classId) {
                return _.filter(self.getAllClassMappings(mapping), ["['" + prefixes.delim + "mapsTo'][0]['@id']", classId]);
            }

            function getMappingsForProp(mapping, propId) {
                var propMappings = _.concat(self.getAllDataMappings(mapping), self.getAllObjectMappings(mapping));
                return _.filter(propMappings, [prefixes.delim + 'hasProperty', [{'@id': propId}]]);
            }
            function findClassWithPropMapping(mapping, propMappingId, type) {
                return _.find(self.getAllClassMappings(mapping), classMapping => _.map(getProperties(classMapping, type), '@id').indexOf(propMappingId) >= 0);
            }
            function getDataProperties(classMapping) {
                return getProperties(classMapping, 'dataProperty');
            }
            function getObjectProperties(classMapping) {
                return getProperties(classMapping, 'objectProperty');
            }
            function getProperties(classMapping, type) {
                return _.get(classMapping, "['" + prefixes.delim + type + "']", []);
            }
            function isType(entity, type) {
                return _.get(entity, "['@type'][0]") === prefixes.delim + type;
            }
            function getMappingEntity(mapping) {
                return _.get(getEntitiesByType(mapping, 'Mapping'), 0);
            }
        }
})();
