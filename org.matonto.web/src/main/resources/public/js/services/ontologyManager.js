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
         * @name ontologyManager
         *
         * @description
         * The `ontologyManager` module only provides the `ontologyManagerService` service which
         * provides access to the MatOnto ontology REST endpoints and utility functions for
         * manipulating ontologies
         */
        .module('ontologyManager', [])
        /**
         * @ngdoc service
         * @name ontologyManager.service:ontologyManagerService
         * @requires $rootScope
         * @requires $window
         * @requires $http
         * @requires $q
         * @requires $timeout
         * @requires $filter
         * @requires prefixes.service:prefixes
         * @requires uuid
         * @requires propertyManager.service:propertyManagerService
         *
         * @description
         * `ontologyManagerService` is a service that provides access to the MatOnto ontology REST
         * endpoints and utility functions for editing/creating ontologies and accessing
         * various entities within the ontology.
         */
        .service('ontologyManagerService', ontologyManagerService);

        ontologyManagerService.$inject = ['$rootScope', '$window', '$http', '$q', '$timeout', '$filter', 'prefixes',
            'uuid', 'propertyManagerService'];

        function ontologyManagerService($rootScope, $window, $http, $q, $timeout, $filter, prefixes, uuid,
            propertyManagerService) {
            var self = this;
            var prefix = '/matontorest/ontologies/';
            var defaultDatatypes = _.map(['anyURI', 'boolean', 'byte', 'dateTime', 'decimal', 'double', 'float', 'int',
                'integer', 'language', 'long', 'string'], function(item) {
                return {
                    'namespace': prefixes.xsd,
                    'localName': item
                }
            });
            var defaultErrorMessage = defaultErrorMessage;
            var ontologyListItemTemplate = {
                ontology: [],
                ontologyId: '',
                annotations: angular.copy(propertyManagerService.defaultAnnotations),
                dataPropertyRange: defaultDatatypes,
                subClasses: [],
                subDataProperties: [],
                subObjectProperties: [],
                individuals: [],
                classHierarchy: [],
                classIndex: {},
                dataPropertyHierarchy: [],
                dataPropertyIndex: {},
                objectPropertyHierarchy: [],
                objectPropertyIndex: {},
                classesWithIndividuals: [],
                blankNodes: {},
                index: {}
            };
            var vocabularyListItemTemplate = {
                ontology: [],
                ontologyId: '',
                annotations: angular.copy(_.union(propertyManagerService.defaultAnnotations, propertyManagerService.skosAnnotations)),
                conceptHierarchy: [],
                conceptIndex: {},
                index: {}
            };

            /**
             * @ngdoc property
             * @name ontologyIds
             * @propertyOf ontologyManager.service:ontologyManagerService
             * @type {string[]}
             *
             * @description
             * `ontologyIds` holds an array of the unopened ontology ids in the MatOnto repository.
             */
            self.ontologyIds = [];
            /**
             * @ngdoc property
             * @name list
             * @propertyOf ontologyManager.service:ontologyManagerService
             * @type {Object[]}
             *
             * @description
             * `list` holds an array of ontology objects which contain properties associated with the ontology.
             * The structure of the ontology object is:
             * ```
             * {
             *      ontologyId: '',
             *      ontology: [],
             *      annotations: [],
             *      subDataProperties: [],
             *      subObjectProperties: [],
             *      dataPropertyRange: [],
             *      classHierarchy: [],
             *      individuals: [],
             *      classesWithIndividuals: [],
             *      subClasses: [],
             *      blankNodes: {},
             *      index: {}
             * }
             * ```
             */
            self.list = [];
            /**
             * @ngdoc property
             * @name propertyTypes
             * @propertyOf ontologyManager.service:ontologyManagerService
             * @type {string[]}
             *
             * @description
             * `propertyTypes` holds an array of the property types available to be added to the property entities
             * within the ontology.
             */
            self.propertyTypes = [
                prefixes.owl + 'DatatypeProperty',
                prefixes.owl + 'ObjectProperty'
            ];
            /**
             * @ngdoc property
             * @name ontologyProperties
             * @propertyOf ontologyManager.service:ontologyManagerService
             * @type {Object[]}
             *
             * @description
             * `ontologyProperties` holds an array of the property types available to be added to the ontology entity
             * within the ontology.
             */
            self.ontologyProperties = _.map(['priorVersion', 'backwardCompatibleWith', 'incompatibleWith'], item => {
                return {
                    'namespace': prefixes.owl,
                    'localName': item
                }
            });
            /**
             * @ngdoc property
             * @name conceptRelationshipList
             * @propertyOf ontologyManager.service:ontologyManagerService
             * @type {Object[]}
             *
             * @description
             * `conceptRelationshipList` holds an array of the relationships that skos:Concepts can have with other
             * entities.
             */
            var conceptListRelationships = _.map(['broaderTransitive', 'broader', 'broadMatch', 'narrowerTransitive',
                'narrower', 'narrowMatch', 'related', 'relatedMatch', 'semanticRelation', 'mappingRelation',
                'closeMatch', 'exactMatch'], item => {
                    return {
                        namespace: prefixes.skos,
                        localName: item,
                        values: 'conceptList'
                    }
                });
            self.conceptRelationshipList = _.concat(
                conceptListRelationships,
                [{
                    namespace: prefixes.skos,
                    localName: 'inScheme',
                    values: 'schemeList'
                }]
            );
            /**
             * @ngdoc property
             * @name schemeRelationshipList
             * @propertyOf ontologyManager.service:ontologyManagerService
             * @type {Object[]}
             *
             * @description
             * `schemeRelationshipList` holds an array of the relationships that skos:ConceptSchemes can have with other
             * entities.
             */
            self.schemeRelationshipList = [
                {
                    namespace: prefixes.skos,
                    localName: 'hasTopConcept',
                    values: 'conceptList'
                }
            ];

            /**
             * @ngdoc method
             * @name reset
             * @methodOf ontologyManager.service:ontologyManagerService
             *
             * @description
             * Resets all state variables.
             */
            self.reset = function() {
                self.ontologyIds = [];
                self.list = [];
            }
            /**
             * @ngdoc method
             * @name initialize
             * @methodOf ontologyManager.service:ontologyManagerService
             *
             * @description
             * Initializes the `ontologyManagerService` by setting the list of
             * {@link ontologyManager.service:ontologyManagerService#ontologyIds ontology ids}.
             */
            self.initialize = function() {
                $rootScope.showSpinner = true;
                self.getAllOntologyIds()
                    .then(response => {
                        self.ontologyIds = _.get(response, 'data', []);
                    }, response => {
                        console.log(_.get(response, 'statusText'), 'Something went wrong. Could not load ontology ids.');
                    })
                    .then(() => {
                        $rootScope.showSpinner = false;
                    });
            }
            /**
             * @ngdoc method
             * @name getAllOntologyIds
             * @methodOf ontologyManager.service:ontologyManagerService
             *
             * @description
             * Calls the GET /matontorest/ontologies/ontologyids endpoint which gets the list of ontology ids in the
             * MatOnto repository. Returns a promise with an array of the ontology ids.
             *
             * @returns {Promise} A promise with an array of the ontology ids.
             */
            self.getAllOntologyIds = function() {
                return $http.get(prefix + 'ontologyids');
            }
            /**
             * @ngdoc method
             * @name uploadFile
             * @methodOf ontologyManager.service:ontologyManagerService
             *
             * @description
             * Calls the POST /matontorest/ontologies endpoint which uploads an ontology to the MatOnto repository
             * with the file provided. Returns a promise indicating whether the ontology was persisted.
             *
             * @param {File} file The ontology file.
             * @returns {Promise} A promise indicating whether the ontology was persisted.
             */
            self.uploadFile = function(file) {
                var fd = new FormData(),
                    config = {
                        transformRequest: angular.identity,
                        headers: {
                            'Content-Type': undefined
                        }
                    };
                fd.append('file', file);
                return $http.post(prefix, fd, config);
            }
            /**
             * @ngdoc method
             * @name getOntology
             * @methodOf ontologyManager.service:ontologyManagerService
             *
             * @description
             * Calls the GET /matontorest/ontologies/{ontologyId} endpoint which gets an ontology from the MatOnto
             * repository with the JSON-LD ontology string provided. Returns a promise which includes the serialized
             * ontology.
             *
             * @param {string} ontologyId The ontology ID of the ontology you want to get from the repository.
             * @param {string} [rdfFormat='jsonld'] The format string to identify the serialization requested.
             * @returns {Promise} A promise containing the ontology id and JSON-LD serialization of the ontology.
             */
            self.getOntology = function(ontologyId, rdfFormat = 'jsonld') {
                var config = {
                    params: {
                        rdfformat: rdfFormat
                    }
                };
                return $http.get(prefix + encodeURIComponent(ontologyId), config);
            }
            /**
             * @ngdoc method
             * @name downloadOntologyFile
             * @methodOf ontologyManager.service:ontologyManagerService
             *
             * @description
             * Calls the GET /matontorest/ontologies/{ontologyId} endpoint using the `window.location` function which
             * will start a download of the specified ontology.
             *
             * @param {string} ontologyId The ontology ID of the ontology you want to download.
             * @param {string} [rdfFormat='jsonld'] The format string to identify the serialization requested.
             * @param {string} [fileName='ontology'] The ontology file name specified.
             * @returns {Promise} A promise indicating whether the ontology was persisted.
             */
            self.downloadOntologyFile = function(ontologyId, rdfFormat = 'jsonld', fileName = 'ontology') {
                $window.location = prefix + encodeURIComponent(ontologyId)
                    + `?rdfFormat=${rdfFormat}&fileName=${fileName}`;
            }

            /**
             * @ngdoc method
             * @name uploadThenGet
             * @methodOf ontologyManager.service:ontologyManagerService
             *
             * @description
             * Calls the POST /matontorest/ontologies endpoint which uploads an ontology to the MatOnto repository
             * with the file provided and then calls {@link ontologyManager.service:ontologyManagerService#getOntology getOntology}
             * to get the ontology they just uploaded. Returns a promise.
             *
             * @param {File} file The ontology file.
             * @returns {Promise} A promise with the ontology ID or error message.
             */
            self.uploadThenGet = function(file, type='ontology') {
                $rootScope.showSpinner = true;
                var deferred = $q.defer();
                var onError = function(response) {
                    deferred.reject(response);
                    $rootScope.showSpinner = false;
                };
                var onAddSuccess = function(ontologyId) {
                    $rootScope.showSpinner = false;
                    deferred.resolve(ontologyId);
                }
                var onUploadSuccess = function(ontologyId) {
                    self.getOntology(ontologyId)
                        .then(response => {
                            if (_.get(response, 'status') === 200 && _.has(response, 'data.id')
                                && _.has(response, 'data.ontology')) {
                                if (type === 'ontology') {
                                    addOntologyToList(response.data.id, response.data.ontology).then(() => onAddSuccess(ontologyId));
                                } else if (type === 'vocabulary') {
                                    addVocabularyToList(response.data.id, response.data.ontology).then(() => onAddSuccess(ontologyId));
                                }
                            } else {
                                onError(response);
                            }
                        }, response => {
                            onError(response);
                        });
                };
                self.uploadFile(file)
                    .then(response => {
                        if (_.get(response, 'status') === 200 && _.get(response, 'data.persisted')
                            && _.has(response, 'data.ontologyId')) {
                            onUploadSuccess(response.data.ontologyId);
                        } else {
                            onError(response);
                        }
                    }, response => {
                        onError(response);
                    });
                return deferred.promise;
            }
            /**
             * @ngdoc method
             * @name openOntology
             * @methodOf ontologyManager.service:ontologyManagerService
             *
             * @description
             * Used to open an ontology from the MatOnto repository. It calls {@link ontologyManager.service:ontologyManagerService#getOntology getOntology}
             * to get the specified ontology from the MatOnto repository. Returns a promise.
             *
             * @param {string} ontologyId The ontology ID of the requested ontology.
             * @returns {Promise} A promise with with the ontology ID or error message.
             */
            self.openOntology = function(ontologyId, type='ontology') {
                $rootScope.showSpinner = true;
                var deferred = $q.defer();
                var onAddSuccess = function() {
                    _.pull(self.ontologyIds, ontologyId);
                    deferred.resolve(ontologyId);
                }
                self.getOntology(ontologyId)
                    .then(response => {
                        if (_.get(response, 'status') === 200 && _.has(response, 'data.id')
                            && _.has(response, 'data.ontology')) {
                            if (type === 'ontology') {
                                addOntologyToList(response.data.id, response.data.ontology).then(onAddSuccess);
                            } else if (type === 'vocabulary') {
                                addVocabularyToList(response.data.id, response.data.ontology).then(onAddSuccess);
                            }
                        } else {
                            deferred.reject(_.get(response, 'statusText'));
                        }
                    }, response => {
                        deferred.reject(_.get(response, 'statusText'));
                    });
                deferred.promise.then(() => {
                    $rootScope.showSpinner = false;
                });
                return deferred.promise;
            }
            /**
             * @ngdoc method
             * @name closeOntology
             * @methodOf ontologyManager.service:ontologyManagerService
             *
             * @description
             * Used to close an ontology from the MatOnto application. It removes the ontology list item from the
             * {@link ontologyManager.service:ontologyManagerService#list list} and adds the ontology ID to the
             * {@link ontologyManager.service:ontologyManagerService#ontologyIds ontologyIds array} so that it
             * can be opened later if necessary.
             *
             * @param {string} ontologyId The ontology ID of the requested ontology.
             */
            self.closeOntology = function(ontologyId) {
                _.remove(self.list, item => _.get(item, 'ontologyId') === ontologyId);
                self.ontologyIds.push(ontologyId);
            }
            /**
             * @ngdoc method
             * @name getPreview
             * @methodOf ontologyManager.service:ontologyManagerService
             *
             * @description
             * Used to get the string representation of the requested serialization of the ontology. It calls
             * {@link ontologyManager.service:ontologyManagerService#getOntology getOntology} to get the specified
             * ontology from the MatOnto repository. Returns a promise with the string representation of the ontology.
             *
             * @param {string} ontologyId The ontology ID of the requested ontology.
             * @param {string} [rdfFormat='jsonld'] The format string to identify the serialization requested.
             * @returns {Promise} A promise with the string representation of the ontology.
             */
            self.getPreview = function(ontologyId, rdfFormat = 'jsonld') {
                $rootScope.showSpinner = true;
                var deferred = $q.defer();
                self.getOntology(ontologyId, rdfFormat)
                    .then(response => {
                        if (_.get(response, 'status') === 200 && _.has(response, 'data.ontology')) {
                            deferred.resolve((rdfFormat === 'jsonld') ? $filter('json')(response.data.ontology)
                                : response.data.ontology);
                        } else {
                            deferred.reject('No data was returned. This typically happens whenever you try to preview'
                                + 'a new, unsaved ontology. Please try again after you save the ontology.');
                        }
                    }, response => {
                        deferred.reject('An error has occurred, please try again later');
                    })
                    .then(() => {
                        $rootScope.showSpinner = false;
                    });
                return deferred.promise;
            }
            /**
             * @ngdoc method
             * @name saveChanges
             * @methodOf ontologyManager.service:ontologyManagerService
             *
             * @description
             * Saves all changes to the ontology with the specified ontology ID. It calls the POST
             * /matontorest/ontology/{ontologyId} for each of the unsaved entities. Returns a promise with the new
             * ontology ID.
             *
             * @param {string} ontologyId The ontology ID of the requested ontology.
             * @param {Object[]} unsavedEntities The array of ontology entities with unsaved changes.
             * @returns {Promise} A promise with the ontology ID.
             */
            self.saveChanges = function(ontologyId, unsavedEntities, createdEntities, deletedEntities) {
                var deferred = $q.defer();
                var promises = [];
                var config = {};
                _.forEach(unsavedEntities, entity => {
                    config = {
                        params: {
                            resourceid: _.get(entity, 'matonto.originalIRI'),
                            resourcejson: $filter('removeMatonto')(entity)
                        }
                    };
                    promises.push($http.post(prefix + encodeURIComponent(ontologyId), null, config));
                    // TODO: the following calls should only be done on successful save
                    // This will be addressed in a future branch dealing with $q.all()
                    _.set(entity, 'matonto.unsaved', false);
                    if (_.has(entity, '@id')) {
                        _.set(entity, 'matonto.originalIRI', entity['@id']);
                    }
                });
                _.forEach(createdEntities, entity => {
                    var newEntity = $filter('removeMatonto')(entity);
                    if (self.isClass(entity)) {
                        promises.push(self.createClass(ontologyId, newEntity));
                    } else if (self.isObjectProperty(entity)) {
                        promises.push(self.createObjectProperty(ontologyId, newEntity));
                    } else if (self.isDataTypeProperty(entity)) {
                        promises.push(self.createDataTypeProperty(ontologyId, newEntity));
                    } else if (self.isIndividual(entity)) {
                        promises.push(self.createIndividual(ontologyId, newEntity));
                    }
                    _.set(entity, 'matonto.created', false);
                });
                _.forEach(deletedEntities, entity => {
                    if (self.isClass(entity)) {
                        promises.push(self.deleteClass(ontologyId, entity.matonto.originalIRI));
                    } else if (self.isObjectProperty(entity)) {
                        promises.push(self.deleteObjectProperty(ontologyId, entity.matonto.originalIRI));
                    } else if (self.isDataTypeProperty(entity)) {
                        promises.push(self.deleteDataTypeProperty(ontologyId, entity.matonto.originalIRI));
                    } else if (self.isIndividual(entity)) {
                        promises.push(self.deleteIndividual(ontologyId, entity.matonto.originalIRI));
                    }
                });
                $q.all(promises)
                    .then(responses => {
                        if (!_.some(responses, {data: {updated: false}})) {
                            var newId = _.get(_.find(responses, response => _.has(response, 'data.id')), 'data.id', ontologyId);
                            if (ontologyId !== newId) {
                                self.setOntologyId(ontologyId, newId);
                            }
                            deferred.resolve(newId);
                        } else {
                            // TODO: find a useful error message if this did go wrong
                            deferred.reject('An error has occurred.');
                        }
                    }, response => {
                        // TODO: find a more useful error message
                        deferred.reject('An error has occurred.');
                    });
                return deferred.promise;
            }
            /**
             * @ngdoc method
             * @name getListItemById
             * @methodOf ontologyManager.service:ontologyManagerService
             *
             * @description
             * Gets the associated object from the {@link ontologyManager.service:ontologyManagerService#list list} that
             * contains the requested ontology ID. Returns the list item.
             *
             * @param {string} ontologyId The ontology ID of the requested ontology.
             * @returns {Object} The associated Object from the
             * {@link ontologyManager.service:ontologyManagerService#list list}.
             */
            self.getListItemById = function(ontologyId) {
                return _.find(self.list, {ontologyId: ontologyId});
            }
            /**
             * @ngdoc method
             * @name setOntologyId
             * @methodOf ontologyManager.service:ontologyManagerService
             *
             * @description
             * Sets the ontology ID in the list item to a new value.
             *
             * @param {string} oldId The old ontology ID that will be changed.
             * @param {string} newId The new ontology ID that it will be changed to.
             */
            self.setOntologyId = function(oldId, newId) {
                _.set(self.getListItemById(oldId), 'ontologyId', newId);
            }
            /**
             * @ngdoc method
             * @name getOntologyById
             * @methodOf ontologyManager.service:ontologyManagerService
             *
             * @description
             * Gets the ontology from the {@link ontologyManager.service:ontologyManagerService#list list} using the
             * requested ontology ID. Returns the JSON-LD of the ontology.
             *
             * @param {string} ontologyId The ontology ID of the requested ontology.
             * @returns {Object[]} The JSON-LD of the requested ontology.
             */
            self.getOntologyById = function(ontologyId) {
                return _.get(self.getListItemById(ontologyId), 'ontology', []);
            }
            /**
             * @ngdoc method
             * @name getIdByOntology
             * @methodOf ontologyManager.service:ontologyManagerService
             *
             * @description
             * Gets the ontology ID of the ontology requested. Returns the ontology ID.
             *
             * @param {Object[]} ontology The ontology you want to get the ID from.
             * @returns {string} The ontology ID for the requested ontology.
             */
            self.getIdByOntology = function(ontology) {
                return _.get(_.find(self.list, {ontology: ontology}), 'id', '');
            }
            /**
             * @ngdoc method
             * @name isOntology
             * @methodOf ontologyManager.service:ontologyManagerService
             *
             * @description
             * Checks if the provided entity is an owl:Ontology entity. Returns a boolean.
             *
             * @param {Object} entity The entity you want to check.
             * @returns {boolean} Returns true if it is an owl:Ontology entity, otherwise returns false.
             */
            self.isOntology = function(entity) {
                return _.includes(_.get(entity, '@type', []), prefixes.owl + 'Ontology');
            }
            /**
             * @ngdoc method
             * @name hasOntologyEntity
             * @methodOf ontologyManager.service:ontologyManagerService
             *
             * @description
             * Checks if the provided ontology contains an ontology entity. Returns a boolean.
             *
             * @param {Object[]} ontology The ontology to search through.
             * @returns {boolean} Returns true if it finds an entity with @type owl:Ontology entity, otherwise returns
             * false.
             */
            self.hasOntologyEntity = function(ontology) {
                return _.some(ontology, entity => self.isOntology(entity));
            }
            /**
             * @ngdoc method
             * @name getOntologyEntity
             * @methodOf ontologyManager.service:ontologyManagerService
             *
             * @description
             * Gets the ontology entity from the provided ontology. Returns an Object.
             *
             * @param {Object[]} ontology The ontology to search through.
             * @returns {Object} Returns the ontology entity.
             */
            self.getOntologyEntity = function(ontology) {
                return _.find(ontology, entity => self.isOntology(entity), {});
            }
            /**
             * @ngdoc method
             * @name getOntologyIRI
             * @methodOf ontologyManager.service:ontologyManagerService
             *
             * @description
             * Gets the ontology entity IRI from the provided ontology. Returns a string representing the ontology IRI.
             *
             * @param {Object[]} ontology The ontology to search through.
             * @returns {Object} Returns the ontology entity IRI.
             */
            self.getOntologyIRI = function(ontology) {
                var entity = self.getOntologyEntity(ontology);
                return _.get(entity, '@id', _.get('matonto.originalIRI', _.get(entity, 'matonto.anonymous', '')));
            }
            /**
             * @ngdoc method
             * @name deleteOntology
             * @methodOf ontologyManager.service:ontologyManagerService
             *
             * @description
             * Calls the DELETE /matontorest/ontology/{ontologyId} endpoint which deletes the specified ontology from
             * the MatOnto repository. Returns a promise with the success of the deletion.
             *
             * @param {string} ontologyId The ontology ID of the requested ontology.
             * @returns {Promise} A promise with a boolean indicating the success of the deletion.
             */
            self.deleteOntology = function(ontologyId) {
                $rootScope.showSpinner = true;
                var deferred = $q.defer();
                $http.delete(prefix + encodeURIComponent(ontologyId))
                    .then(response => {
                        if (_.get(response, 'data.deleted')) {
                            _.remove(self.ontologyIds, id => id === ontologyId);
                            deferred.resolve();
                        } else {
                            deferred.reject(_.get(response, 'statusText', defaultErrorMessage));
                        }
                    }, response => {
                        deferred.reject(_.get(response, 'data.error', defaultErrorMessage));
                    })
                    .then(() => {
                        $rootScope.showSpinner = false;
                    });
                return deferred.promise;
            }
            /**
             * @ngdoc method
             * @name createOntology
             * @methodOf ontologyManager.service:ontologyManagerService
             *
             * @description
             * Calls the POST /matontorest/ontologies endpoint which uploads an ontology to the MatOnto repository
             * with the JSON-LD ontology string provided. Returns a promise with the entityIRI and ontologyId for the
             * state of the newly created ontology.
             *
             * @param {string} ontologyJSON The JSON-LD representing the ontology.
             * @returns {Promise} A promise with the entityIRI and ontologyId for the state of the newly created
             * ontology.
             */
            self.createOntology = function(ontologyJSON, type='ontology') {
                $rootScope.showSpinner = true;
                var deferred = $q.defer();
                var config = {
                    params: {
                        ontologyjson: ontologyJSON
                    }
                };
                $http.post(prefix, null, config)
                    .then(response => {
                        if (_.has(response, 'data.persisted') && _.has(response, 'data.ontologyId')) {
                            _.set(ontologyJSON, 'matonto.originalIRI', ontologyJSON['@id']);
                            var listItem = (type === 'ontology') ? angular.copy(ontologyListItemTemplate)
                                : angular.copy(vocabularyListItemTemplate);
                            listItem.ontology.push(ontologyJSON);
                            listItem.ontologyId = response.data.ontologyId;
                            self.list.push(listItem);
                            deferred.resolve({
                                entityIRI: ontologyJSON['@id'],
                                ontologyId: response.data.ontologyId
                            });
                        } else {
                            deferred.reject(_.get(response, 'statusText', defaultErrorMessage));
                        }
                    }, response => {
                        deferred.reject(_.get(response, 'statusText', defaultErrorMessage));
                    })
                    .then(() => {
                        $rootScope.showSpinner = false;
                    });
                return deferred.promise;
            }
            /**
             * @ngdoc method
             * @name isClass
             * @methodOf ontologyManager.service:ontologyManagerService
             *
             * @description
             * Checks if the provided entity is an owl:Class entity. Returns a boolean.
             *
             * @param {Object} entity The entity you want to check.
             * @returns {boolean} Returns true if it is an owl:Class entity, otherwise returns false.
             */
            self.isClass = function(entity) {
                return _.includes(_.get(entity, '@type', []), prefixes.owl + 'Class');
            }
            /**
             * @ngdoc method
             * @name hasClasses
             * @methodOf ontologyManager.service:ontologyManagerService
             *
             * @description
             * Checks if the provided ontology contains any owl:Class entities. Returns a boolean.
             *
             * @param {Object[]} ontology The ontology you want to check.
             * @returns {boolean} Returns true if there are any owl:Class entities in the ontology, otherwise returns
             * false.
             */
            self.hasClasses = function(ontology) {
                return _.some(ontology, entity => self.isClass(entity) && !self.isBlankNode(entity));
            }
            /**
             * @ngdoc method
             * @name getClasses
             * @methodOf ontologyManager.service:ontologyManagerService
             *
             * @description
             * Gets the list of all owl:Class entities within the provided ontology that are not blank nodes. Returns
             * an Object[].
             *
             * @param {Object[]} ontology The ontology you want to check.
             * @returns {Object[]} An array of all owl:Class entities within the ontology.
             */
            self.getClasses = function(ontology) {
                return _.filter(ontology, entity => self.isClass(entity) && !self.isBlankNode(entity));
            }
            /**
             * @ngdoc method
             * @name getClassIRIs
             * @methodOf ontologyManager.service:ontologyManagerService
             *
             * @description
             * Gets the list of all owl:Class entity IRIs within the provided ontology that are not blank nodes. Returns
             * an string[].
             *
             * @param {Object[]} ontology The ontology you want to check.
             * @returns {string[]} An array of all owl:Class entity IRI strings within the ontology.
             */
            self.getClassIRIs = function(ontology) {
                return _.map(self.getClasses(ontology), 'matonto.originalIRI');
            }
            /**
             * @ngdoc method
             * @name deleteClass
             * @methodOf ontologyManager.service:ontologyManagerService
             *
             * @description
             * Calls the DELETE /matontorest/ontology/{ontologyId}/classes/{classId} endpoint which deletes the
             * specified class from the ontology in the MatOnto repository. Returns a promise with the success of the
             * deletion.
             *
             * @param {string} ontologyId The ontology ID of the requested ontology.
             * @returns {Promise} A promise with a boolean indicating the success of the deletion.
             */
            self.deleteClass = function(ontologyId, classIRI) {
                return $http.delete(prefix + encodeURIComponent(ontologyId) + '/classes/' + encodeURIComponent(classIRI));
            }
            /**
             * @ngdoc method
             * @name createClass
             * @methodOf ontologyManager.service:ontologyManagerService
             *
             * @description
             * Calls the POST /matontorest/ontologies/{ontologyId}/classes endpoint which adds the provided class to
             * the ontology within the MatOnto repository. Returns a promise with the entityIRI and ontologyId for the
             * state of the newly created class.
             *
             * @param {string} ontologyId The ontology ID of the requested ontology.
             * @param {string} classJSON The JSON-LD representing the owl:Class to create.
             * @returns {Promise} A promise with the $http response of the POST.
             */
            self.createClass = function(ontologyId, classJSON) {
                var config = {
                    params: {
                        resourcejson: classJSON
                    }
                };
                return $http.post(prefix + encodeURIComponent(ontologyId) + '/classes', null, config);
            }
            /**
             * @ngdoc method
             * @name updateClassHierarchies
             * @methodOf ontologyManager.service:ontologyManagerService
             *
             * @description
             * Calls the GET /matontorest/ontologies/{ontologyId}/class-hierarchies endpoint which gets the class
             * hierarchy of the ontology for the provided ontology ID and uses the response data to update the list
             * item's class hierarchy associated with the provided ontology ID.
             *
             * @param {string} ontologyId The ontology ID of the requested ontology.
             * @returns {Promise} An empty promise
             */
            self.updateClassHierarchies = function(ontologyId) {
                var deferred = $q.defer();
                $http.get(prefix + encodeURIComponent(ontologyId) + '/class-hierarchies')
                    .then(hierarchyResponse => {
                        if (_.get(hierarchyResponse, 'status') === 200) {
                            var listItem = self.getListItemById(ontologyId);
                            listItem.classHierarchy = hierarchyResponse.data.hierarchy;
                            listItem.classIndex = hierarchyResponse.data.index;
                        }
                        deferred.resolve();
                    }, () => {
                        // TODO: perhaps use a toast to let the user know this in the future
                        console.log('Unable to update class hierarchy');
                        deferred.resolve();
                    });
                return deferred.promise;
            }
            /**
             * @ngdoc method
             * @name hasClassProperties
             * @methodOf ontologyManager.service:ontologyManagerService
             *
             * @description
             * Checks to see if the class within the provided ontology has an properties associated it via the
             * rdfs:domain axiom. Returns a boolean indicating the existence of those properties.
             *
             * @param {Object[]} ontology The ontology you want to check.
             * @param {string} classIRI The class IRI of the class you want to check about.
             * @returns {boolean} Returns true if it does have properties, otherwise returns false.
             */
            self.hasClassProperties = function(ontology, classIRI) {
                return _.some(ontology, {[prefixes.rdfs + 'domain']: [{'@id': classIRI}]});
            }
            /**
             * @ngdoc method
             * @name getClassProperties
             * @methodOf ontologyManager.service:ontologyManagerService
             *
             * @description
             * Gets the properties associated with the class within the provided ontology by the rdfs:domain axiom.
             * Returns an array of all the properties associated with the provided class IRI.
             *
             * @param {Object[]} ontology The ontology you want to check.
             * @param {string} classIRI The class IRI of the class you want to check about.
             * @returns {Object[]} Returns an array of all the properties associated with the provided class IRI.
             */
            self.getClassProperties = function(ontology, classIRI) {
                return _.filter(ontology, {[prefixes.rdfs + 'domain']: [{'@id': classIRI}]});
            }
            /**
             * @ngdoc method
             * @name getClassProperties
             * @methodOf ontologyManager.service:ontologyManagerService
             *
             * @description
             * Gets the property IRIs associated with the class within the provided ontology by the rdfs:domain axiom.
             * Returns an array of all the property IRIs associated with the provided class IRI.
             *
             * @param {Object[]} ontology The ontology you want to check.
             * @param {string} classIRI The class IRI of the class you want to check about.
             * @returns {string[]} Returns an array of all the property IRIs associated with the provided class IRI.
             */
            self.getClassPropertyIRIs = function(ontology, classIRI) {
                return _.map(self.getClassProperties(ontology, classIRI), 'matonto.originalIRI');
            }
            /**
             * @ngdoc method
             * @name isObjectProperty
             * @methodOf ontologyManager.service:ontologyManagerService
             *
             * @description
             * Checks if the provided entity is an owl:ObjectProperty entity. Returns a boolean.
             *
             * @param {Object} entity The entity you want to check.
             * @returns {boolean} Returns true if it is an owl:ObjectProperty entity, otherwise returns false.
             */
            self.isObjectProperty = function(entity) {
                return _.includes(_.get(entity, '@type', []), prefixes.owl + 'ObjectProperty');
            }
            /**
             * @ngdoc method
             * @name isDataTypeProperty
             * @methodOf ontologyManager.service:ontologyManagerService
             *
             * @description
             * Checks if the provided entity is an owl:DatatypeProperty entity. Returns a boolean.
             *
             * @param {Object} entity The entity you want to check.
             * @returns {boolean} Returns true if it is an owl:DatatypeProperty entity, otherwise returns false.
             */
            self.isDataTypeProperty = function(entity) {
                var types = _.get(entity, '@type', []);
                return _.includes(types, prefixes.owl + 'DatatypeProperty')
                    || _.includes(types, prefixes.owl + 'DataTypeProperty');
            }
            /**
             * @ngdoc method
             * @name isProperty
             * @methodOf ontologyManager.service:ontologyManagerService
             *
             * @description
             * Checks if the provided entity is an owl:DatatypeProperty or owl:ObjectProperty entity. Returns a boolean.
             *
             * @param {Object} entity The entity you want to check.
             * @returns {boolean} Returns true if it is an owl:DatatypeProperty or owl:ObjectProperty entity, otherwise
             * returns false.
             */
            self.isProperty = function(entity) {
                return self.isObjectProperty(entity) || self.isDataTypeProperty(entity);
            }
            /**
             * @ngdoc method
             * @name hasNoDomainProperties
             * @methodOf ontologyManager.service:ontologyManagerService
             *
             * @description
             * Checks if the provided ontology has any property that is not associated with a class by the rdfs:domain
             * axiom. Return a boolean indicating if any such properties exist.
             *
             * @param {Object[]} ontology The ontology you want to check.
             * @returns {boolean} Returns true if it contains properties without an rdfs:domain set, otherwise returns
             * false.
             */
            self.hasNoDomainProperties = function(ontology) {
                return _.some(ontology, entity => self.isProperty(entity) && !_.has(entity, prefixes.rdfs + 'domain'));
            }
            /**
             * @ngdoc method
             * @name getNoDomainProperties
             * @methodOf ontologyManager.service:ontologyManagerService
             *
             * @description
             * Gets the list of properties that are not associated with a class by the rdfs:domain axiom. Returns an
             * array of the properties not associated with a class.
             *
             * @param {Object[]} ontology The ontology you want to check.
             * @returns {Object[]} Returns an array of properties not associated with a class.
             */
            self.getNoDomainProperties = function(ontology) {
                return _.filter(ontology, entity => self.isProperty(entity) && !_.has(entity, prefixes.rdfs + 'domain'));
            }
            /**
             * @ngdoc method
             * @name getNoDomainPropertyIRIs
             * @methodOf ontologyManager.service:ontologyManagerService
             *
             * @description
             * Gets the list of property IRIs that are not associated with a class by the rdfs:domain axiom. Returns an
             * array of the property IRIs not associated with a class.
             *
             * @param {Object[]} ontology The ontology you want to check.
             * @returns {string[]} Returns an array of property IRIs not associated with a class.
             */
            self.getNoDomainPropertyIRIs = function(ontology) {
                return _.map(self.getNoDomainProperties(ontology), 'matonto.originalIRI');
            }
            /**
             * @ngdoc method
             * @name hasObjectProperties
             * @methodOf ontologyManager.service:ontologyManagerService
             *
             * @description
             * Checks if the provided ontology contains any owl:ObjectProperty entities. Returns a boolean.
             *
             * @param {Object[]} ontology The ontology you want to check.
             * @returns {boolean} Returns true if there are any owl:ObjectProperty entities in the ontology, otherwise
             * returns false.
             */
            self.hasObjectProperties = function(ontology) {
                return _.some(ontology, entity => self.isObjectProperty(entity) && !self.isBlankNode(entity));
            }
            /**
             * @ngdoc method
             * @name getObjectProperties
             * @methodOf ontologyManager.service:ontologyManagerService
             *
             * @description
             * Gets the list of all owl:ObjectProperty entities within the provided ontology that are not blank nodes.
             * Returns an Object[].
             *
             * @param {Object[]} ontology The ontology you want to check.
             * @returns {Object[]} An array of all owl:ObjectProperty entities within the ontology.
             */
            self.getObjectProperties = function(ontology) {
                return _.filter(ontology, entity => self.isObjectProperty(entity) && !self.isBlankNode(entity));
            }
            /**
             * @ngdoc method
             * @name getObjectPropertyIRIs
             * @methodOf ontologyManager.service:ontologyManagerService
             *
             * @description
             * Gets the list of all owl:ObjectProperty entity IRIs within the provided ontology that are not blank
             * nodes. Returns an string[].
             *
             * @param {Object[]} ontology The ontology you want to check.
             * @returns {string[]} An array of all owl:ObjectProperty entity IRI strings within the ontology.
             */
            self.getObjectPropertyIRIs = function(ontology) {
                return _.map(self.getObjectProperties(ontology), 'matonto.originalIRI');
            }
            /**
             * @ngdoc method
             * @name deleteObjectProperty
             * @methodOf ontologyManager.service:ontologyManagerService
             *
             * @description
             * Calls the DELETE /matontorest/ontology/{ontologyId}/object-properties/{propertyId} endpoint which
             * deletes the specified property from the ontology in the MatOnto repository. Returns a promise with the
             * success of the deletion.
             *
             * @param {string} ontologyId The ontology ID of the requested ontology.
             * @param {string} propertyIRI The IRI of the object property you want to delete.
             * @returns {Promise} A promise with a boolean indicating the success of the deletion.
             */
            self.deleteObjectProperty = function(ontologyId, propertyIRI) {
                return $http.delete(prefix + encodeURIComponent(ontologyId) + '/object-properties/' + encodeURIComponent(propertyIRI));
            }
            /**
             * @ngdoc method
             * @name createObjectProperty
             * @methodOf ontologyManager.service:ontologyManagerService
             *
             * @description
             * Calls the POST /matontorest/ontology/{ontologyId}/object-properties endpoint which adds the provided
             * object property to the ontology within the MatOnto repository. Returns a promise with the entityIRI and
             * ontologyId for the state of the newly created object property.
             *
             * @param {string} ontologyId The ontology ID of the requested ontology.
             * @param {string} propertyJSON The JSON-LD representing the owl:ObjectProperty to create.
             * @returns {Promise} A promise with the entityIRI and ontologyId for the state of the newly created
             * property.
             */
            self.createObjectProperty = function(ontologyId, propertyJSON) {
                var config = {
                    params: {
                        resourcejson: propertyJSON
                    }
                };
                return $http.post(prefix + encodeURIComponent(ontologyId) + '/object-properties', null, config);
            }
            /**
             * @ngdoc method
             * @name hasDataTypeProperties
             * @methodOf ontologyManager.service:ontologyManagerService
             *
             * @description
             * Checks if the provided ontology contains any owl:DatatypeProperty entities. Returns a boolean.
             *
             * @param {Object[]} ontology The ontology you want to check.
             * @returns {boolean} Returns true if there are any owl:DatatypeProperty entities in the ontology, otherwise
             * returns false.
             */
            self.hasDataTypeProperties = function(ontology) {
                return _.some(ontology, entity =>  self.isDataTypeProperty(entity));
            }
            /**
             * @ngdoc method
             * @name getDataTypeProperties
             * @methodOf ontologyManager.service:ontologyManagerService
             *
             * @description
             * Gets the list of all owl:DatatypeProperty entities within the provided ontology that are not blank nodes.
             * Returns an Object[].
             *
             * @param {Object[]} ontology The ontology you want to check.
             * @returns {Object[]} An array of all owl:DatatypeProperty entities within the ontology.
             */
            self.getDataTypeProperties = function(ontology) {
                return _.filter(ontology, entity => self.isDataTypeProperty(entity) && !self.isBlankNode(entity));
            }
            /**
             * @ngdoc method
             * @name getDataTypePropertyIRIs
             * @methodOf ontologyManager.service:ontologyManagerService
             *
             * @description
             * Gets the list of all owl:DatatypeProperty entity IRIs within the provided ontology that are not blank
             * nodes. Returns an string[].
             *
             * @param {Object[]} ontology The ontology you want to check.
             * @returns {string[]} An array of all owl:DatatypeProperty entity IRI strings within the ontology.
             */
            self.getDataTypePropertyIRIs = function(ontology) {
                return _.map(self.getDataTypeProperties(ontology), 'matonto.originalIRI');
            }
            /**
             * @ngdoc method
             * @name deleteDataTypeProperty
             * @methodOf ontologyManager.service:ontologyManagerService
             *
             * @description
             * Calls the DELETE /matontorest/ontology/{ontologyId}/data-properties/{propertyId} endpoint which
             * deletes the specified property from the ontology in the MatOnto repository. Returns a promise with the
             * success of the deletion.
             *
             * @param {string} ontologyId The ontology ID of the requested ontology.
             * @param {string} propertyIRI The IRI of the datatype property you want to delete.
             * @returns {Promise} A promise with a boolean indicating the success of the deletion.
             */
            self.deleteDataTypeProperty = function(ontologyId, propertyIRI) {
                return $http.delete(prefix + encodeURIComponent(ontologyId) + '/data-properties/' + encodeURIComponent(propertyIRI));
            }
            /**
             * @ngdoc method
             * @name createDataTypeProperty
             * @methodOf ontologyManager.service:ontologyManagerService
             *
             * @description
             * Calls the POST /matontorest/ontology/{ontologyId}/data-properties endpoint which adds the provided
             * object property to the ontology within the MatOnto repository. Returns a promise with the entityIRI and
             * ontologyId for the state of the newly created object property.
             *
             * @param {string} ontologyId The ontology ID of the requested ontology.
             * @param {string} propertyJSON The JSON-LD representing the owl:ObjectProperty to create.
             * @returns {Promise} A promise with the entityIRI and ontologyId for the state of the newly created
             * property.
             */
            self.createDataTypeProperty = function(ontologyId, propertyJSON) {
                var config = {
                    params: {
                        resourcejson: propertyJSON
                    }
                };
                return $http.post(prefix + encodeURIComponent(ontologyId) + '/data-properties', null, config);
            }
            /**
             * @ngdoc method
             * @name hasAnnotations
             * @methodOf ontologyManager.service:ontologyManagerService
             *
             * @description
             * Checks if the provided ontology contains any owl:AnnotationProperty entities. Returns a boolean.
             *
             * @param {Object[]} ontology The ontology you want to check.
             * @returns {boolean} Returns true if there are any owl:AnnotationProperty entities in the ontology,
             * otherwise returns false.
             */
            self.hasAnnotations = function(ontology) {
                return _.some(ontology, {'@type': [prefixes.owl + 'AnnotationProperty']});
            }
            /**
             * @ngdoc method
             * @name getAnnotations
             * @methodOf ontologyManager.service:ontologyManagerService
             *
             * @description
             * Gets the list of all owl:AnnotationProperty entities within the provided ontology. Returns an Object[].
             *
             * @param {Object[]} ontology The ontology you want to check.
             * @returns {Object[]} An array of all owl:AnnotationProperty entities within the ontology.
             */
            self.getAnnotations = function(ontology) {
                return _.filter(ontology, {'@type': [prefixes.owl + 'AnnotationProperty']});
            }
            /**
             * @ngdoc method
             * @name getAnnotationIRIs
             * @methodOf ontologyManager.service:ontologyManagerService
             *
             * @description
             * Gets the list of all owl:AnnotationProperty entity IRIs within the provided ontology that are not blank
             * nodes. Returns an string[].
             *
             * @param {Object[]} ontology The ontology you want to check.
             * @returns {string[]} An array of all owl:AnnotationProperty entity IRI strings within the ontology.
             */
            self.getAnnotationIRIs = function(ontology) {
                return _.map(self.getAnnotations(ontology), 'matonto.originalIRI');
            }
            /**
             * @ngdoc method
             * @name isIndividual
             * @methodOf ontologyManager.service:ontologyManagerService
             *
             * @description
             * Checks if the provided entity is an owl:NamedIndividual entity. Returns a boolean.
             *
             * @param {Object} entity The entity you want to check.
             * @returns {boolean} Returns true if it is an owl:NamedIndividual entity, otherwise returns false.
             */
            self.isIndividual = function(entity) {
                return _.includes(_.get(entity, '@type', []), prefixes.owl + 'NamedIndividual');
            }
            /**
             * @ngdoc method
             * @name hasIndividuals
             * @methodOf ontologyManager.service:ontologyManagerService
             *
             * @description
             * Checks to see if the ontology has individuals. Returns a boolean indicating the existence of those
             * individuals.
             *
             * @param {Object[]} ontology The ontology you want to check.
             * @returns {boolean} Returns true if it does have individuals, otherwise returns false.
             */
            self.hasIndividuals = function(ontology) {
                return _.some(ontology, entity => self.isIndividual(entity));
            }
            /**
             * @ngdoc method
             * @name getIndividuals
             * @methodOf ontologyManager.service:ontologyManagerService
             *
             * @description
             * Gets the list of all owl:NamedIndividual entities within the provided ontology. Returns an Object[].
             *
             * @param {Object[]} ontology The ontology you want to check.
             * @returns {Object[]} An array of all owl:NamedIndividual entities within the ontology.
             */
            self.getIndividuals = function(ontology) {
                return _.filter(ontology, entity => self.isIndividual(entity));
            }
            /**
             * @ngdoc method
             * @name hasNoTypeIndividuals
             * @methodOf ontologyManager.service:ontologyManagerService
             *
             * @description
             * Checks to see if the ontology has individuals with no other type. Returns a boolean indicating the
             * existence of those individuals.
             *
             * @param {Object[]} ontology The ontology you want to check.
             * @returns {boolean} Returns true if it does have individuals with no other type, otherwise returns false.
             */
            self.hasNoTypeIndividuals = function(ontology) {
                return _.some(ontology, entity => self.isIndividual(entity) && entity['@type'].length === 1);
            }
            /**
             * @ngdoc method
             * @name getNoTypeIndividuals
             * @methodOf ontologyManager.service:ontologyManagerService
             *
             * @description
             * Gets the list of all owl:NamedIndividual entities within the provided ontology that have no other type.
             * Returns an Object[].
             *
             * @param {Object[]} ontology The ontology you want to check.
             * @returns {Object[]} An array of all owl:NamedIndividual entities with no other type within the ontology.
             */
            self.getNoTypeIndividuals = function(ontology) {
                return _.filter(ontology, entity => self.isIndividual(entity) && entity['@type'].length === 1);
            }
            /**
             * @ngdoc method
             * @name hasClassIndividuals
             * @methodOf ontologyManager.service:ontologyManagerService
             *
             * @description
             * Checks to see if the class within the provided ontology has individuals with that type. Returns a
             * boolean indicating the existence of those individuals.
             *
             * @param {Object[]} ontology The ontology you want to check.
             * @param {string} classIRI The class IRI of the class you want to check about.
             * @returns {boolean} Returns true if it does have individuals, otherwise returns false.
             */
            self.hasClassIndividuals = function(ontology, classIRI) {
                return _.some(self.getIndividuals(ontology), {'@type': [classIRI]});
            }
            /**
             * @ngdoc method
             * @name getClassIndividuals
             * @methodOf ontologyManager.service:ontologyManagerService
             *
             * @description
             * Gets the individuals associated with the class within the provided ontology by the type. Returns an
             * array of all the properties associated with the provided class IRI.
             *
             * @param {Object[]} ontology The ontology you want to check.
             * @param {string} classIRI The class IRI of the class you want to check about.
             * @returns {Object[]} Returns an array of all the individuals associated with the provided class IRI.
             */
            self.getClassIndividuals = function(ontology, classIRI) {
                return _.filter(self.getIndividuals(ontology), {'@type': [classIRI]});
            }
            /**
             * @ngdoc method
             * @name deleteIndividual
             * @methodOf ontologyManager.service:ontologyManagerService
             *
             * @description
             * Calls the DELETE /matontorest/ontology/{ontologyId}/named-individuals/{individualId} endpoint which
             * deletes the specified individual from the ontology in the MatOnto repository. Returns a promise with the
             * success of the deletion.
             *
             * @param {string} ontologyId The ontology ID of the requested ontology.
             * @param {string} individualIRI The IRI of the individual you want to delete.
             * @returns {Promise} A promise with a boolean indicating the success of the deletion.
             */
            self.deleteIndividual = function(ontologyId, individualIRI) {
                return $http.delete(prefix + encodeURIComponent(ontologyId) + '/named-individuals/' + encodeURIComponent(individualIRI));
            }
            /**
             * @ngdoc method
             * @name createIndividual
             * @methodOf ontologyManager.service:ontologyManagerService
             *
             * @description
             * Calls the POST /matontorest/ontology/{ontologyId}/named-individuals endpoint which adds the provided
             * individual to the ontology within the MatOnto repository. Returns a promise with the entityIRI and
             * ontologyId for the state of the newly created individual.
             *
             * @param {string} ontologyId The ontology ID of the requested ontology.
             * @param {string} individualJSON The JSON-LD representing the owl:NamedIndividual to create.
             * @returns {Promise} A promise with the entityIRI and ontologyId for the state of the newly created
             * property.
             */
            self.createIndividual = function(ontologyId, individualJSON) {
                var config = {
                    params: {
                        resourcejson: individualJSON
                    }
                };
                return $http.post(prefix + encodeURIComponent(ontologyId) + '/named-individuals', null, config);
            }
            /**
             * @ngdoc method
             * @name isRestriction
             * @methodOf ontologyManager.service:ontologyManagerService
             *
             * @description
             * Checks if the provided entity is an owl:Restriction. Returns a boolean.
             *
             * @param {Object} entity The entity you want to check.
             * @returns {boolean} Returns true if it is an owl:Restriction entity, otherwise returns false.
             */
            self.isRestriction = function(entity) {
                return _.includes(_.get(entity, '@type', []), prefixes.owl + 'Restriction');
            }
            /**
             * @ngdoc method
             * @name getRestrictions
             * @methodOf ontologyManager.service:ontologyManagerService
             *
             * @description
             * Gets the list of all owl:Restriction entities within the provided ontology. Returns an Object[].
             *
             * @param {Object[]} ontology The ontology you want to check.
             * @returns {Object[]} An array of all owl:Restriction entities within the ontology.
             */
            self.getRestrictions = function(ontology) {
                return _.filter(ontology, entity => self.isRestriction(entity));
            }
            /**
             * @ngdoc method
             * @name isBlankNode
             * @methodOf ontologyManager.service:ontologyManagerService
             *
             * @description
             * Checks if the provided entity is blank node. Returns a boolean.
             *
             * @param {Object} entity The entity you want to check.
             * @returns {boolean} Returns true if it is a blank node entity, otherwise returns false.
             */
            self.isBlankNode = function(entity) {
                return _.includes(_.get(entity, '@id', ''), '_:b');
            }
            /**
             * @ngdoc method
             * @name getBlankNodes
             * @methodOf ontologyManager.service:ontologyManagerService
             *
             * @description
             * Gets the list of all entities within the provided ontology that are blank nodes. Returns an Object[].
             *
             * @param {Object[]} ontology The ontology you want to check.
             * @returns {Object[]} An array of all owl:Restriction entities within the ontology.
             */
            self.getBlankNodes = function(ontology) {
                return _.filter(ontology, entity => self.isBlankNode(entity));
            }
            /**
             * @ngdoc method
             * @name getEntity
             * @methodOf ontologyManager.service:ontologyManagerService
             *
             * @description
             * Gets entity with the provided IRI from the provided ontology in the MatOnto repository. Returns the
             * entity Object.
             *
             * @param {Object[]} ontology The ontology you want to check.
             * @param {string} entityIRI The IRI of the entity that you want.
             * @returns {Object} An Object which represents the requested entity.
             */
            self.getEntity = function(ontology, entityIRI) {
                return _.find(ontology, {matonto:{originalIRI: entityIRI}}) || _.find(ontology, {'@id': entityIRI});
            }
            /**
             * @ngdoc method
             * @name getEntityById
             * @methodOf ontologyManager.service:ontologyManagerService
             *
             * @description
             * Gets entity with the provided IRI from the ontology linked to the provided ontologyId in the MatOnto
             * repository. Returns the entity Object.
             *
             * @param {string} ontologyId The ontologyId linked to the ontology you want to check.
             * @param {string} entityIRI The IRI of the entity that you want.
             * @returns {Object} An Object which represents the requested entity.
             */
            self.getEntityById = function(ontologyId, entityIRI) {
                var index = _.get(self.getListItemById(ontologyId), 'index');
                var ontology = self.getOntologyById(ontologyId);
                if (_.has(index, entityIRI)) {
                    return ontology[_.get(index, entityIRI)];
                } else {
                    return self.getEntity(ontology, entityIRI);
                }
            }
            /**
             * @ngdoc method
             * @name removeEntity
             * @methodOf ontologyManager.service:ontologyManagerService
             *
             * @description
             * Removes the entity with the provided IRI from the ontology with the provided ontology ID in the MatOnto
             * repository. Returns the entity Object.
             *
             * @param {Object[]} ontology The ontology you want to check.
             * @returns {Object} An Object which represents the requested entity.
             */
            self.removeEntity = function(ontology, entityIRI) {
                return _.remove(ontology, {matonto:{originalIRI: entityIRI}});
            }
            /**
             * @ngdoc method
             * @name addEntity
             * @methodOf ontologyManager.service:ontologyManagerService
             *
             * @description
             * Adds the entity represented by the entityJSON to the ontology with the provided ontology ID in the
             * MatOnto repository.
             *
             * @param {Object[]} ontology The ontology you want to check.
             */
            self.addEntity = function(ontology, entityJSON) {
                ontology.push(entityJSON);
            }
            /**
             * @ngdoc method
             * @name getBeautifulIRI
             * @methodOf ontologyManager.service:ontologyManagerService
             *
             * @description
             * Gets the "beautified" IRI representation for the iri passed. Returns the modified IRI.
             *
             * @param {string} iri The IRI string that you want to beautify.
             * @returns {string} The beautified IRI string.
             */
            self.getBeautifulIRI = function(iri) {
                var splitEnd = $filter('splitIRI')(iri).end;
                return splitEnd ? $filter('beautify')(splitEnd) : iri;
            }
            /**
             * @ngdoc method
             * @name getEntityName
             * @methodOf ontologyManager.service:ontologyManagerService
             *
             * @description
             * Gets the provided entity's name. This name is either the `rdfs:label`, `dcterms:title`, or `dc:title`.
             * If none of those annotations exist, it returns the beautified `@id`. Returns a string for the entity
             * name.
             *
             * @param {Object} entity The entity you want the name of.
             * @returns {string} The beautified IRI string.
             */
            self.getEntityName = function(entity, type='ontology') {
                var result = _.get(entity, "['" + prefixes.rdfs + "label'][0]['@value']") || _.get(entity, "['"
                    + prefixes.dcterms + "title'][0]['@value']") || _.get(entity, "['" + prefixes.dc
                    + "title'][0]['@value']");
                if (!result) {
                    if (_.has(entity, '@id')) {
                        result = self.getBeautifulIRI(entity['@id']);
                    } else {
                        result = _.get(entity, 'matonto.anonymous');
                    }
                }
                if (type === 'vocabulary') {
                    result = _.get(entity, "['" + prefixes.skos + "prefLabel'][0]['@value']") || _.get(entity, "['"
                        + prefixes.skos + "altLabel'][0]['@value']") || result;
                }
                return result;
            }
            /**
             * @ngdoc method
             * @name getEntityDescription
             * @methodOf ontologyManager.service:ontologyManagerService
             *
             * @description
             * Gets the provided entity's description. This description is either the `rdfs:comment`,
             * `dcterms:description`, or `dc:description`. If none of those annotations exist, it returns undefined.
             *
             * @param {Object} entity The entity you want the description of.
             * @returns {string} The entity's description text.
             */
            self.getEntityDescription = function(entity) {
                return _.get(entity, "['" + prefixes.rdfs + "comment'][0]['@value']",
                    _.get(entity, "['" + prefixes.dcterms + "description'][0]['@value']",
                    _.get(entity, "['" + prefixes.dc + "description'][0]['@value']")));
            }
            /**
             * @ngdoc method
             * @name getImportedOntologies
             * @methodOf ontologyManager.service:ontologyManagerService
             *
             * @description
             * Calls the GET /matontorest/ontologies/{ontologyId}/imported-ontologies endpoint which gets the list of
             * all ontologies imported by the ontology with the requested ontology ID.
             *
             * @param {string} ontologyId The ontology ID of the ontology you want to get from the repository.
             * @param {string} [rdfFormat='jsonld'] The format string to identify the serialization requested.
             * @returns {Promise} A promise containing the list of ontologies that are imported by the requested
             * ontology.
             */
            self.getImportedOntologies = function(ontologyId, rdfFormat = 'jsonld') {
                $rootScope.showSpinner = true;
                var deferred = $q.defer();
                var config = {
                    params: {
                        rdfformat: rdfFormat
                    }
                };
                $http.get(prefix + encodeURIComponent(ontologyId) + '/imported-ontologies', null, config)
                    .then(response => {
                        if(_.get(response, 'status') === 200 && _.has(response, 'data')) {
                            deferred.resolve(response.data);
                        } else if (_.get(response, 'status') === 204) {
                            deferred.resolve([]);
                        } else {
                            deferred.reject(_.get(response, 'statusText', defaultErrorMessage));
                        }
                    }, response => {
                        deferred.reject(_.get(response, 'statusText', defaultErrorMessage))
                    })
                    .then(() => {
                        $rootScope.showSpinner = false;
                    });
                return deferred.promise;
            }
            /**
             * @ngdoc method
             * @name getEntityUsages
             * @methodOf ontologyManager.service:ontologyManagerService
             *
             * @description
             * Calls the GET /matontorest/ontologies/{ontologyId}/entity-usages/{entityIRI} endpoint which gets the
             * JSON SPARQL query results for all statements which have the provided entityIRI as an object.
             *
             * @param {string} ontologyId The ontology ID of the ontology you want to get from the repository.
             * @param {string} entityIRI The entity IRI of the entity you want the usages for from the repository.
             * @returns {Promise} A promise containing the JSON SPARQL query results bindings.
             */
            self.getEntityUsages = function(ontologyId, entityIRI) {
                var deferred = $q.defer();
                $http.get(prefix + encodeURIComponent(ontologyId) + '/entity-usages/' + encodeURIComponent(entityIRI))
                    .then(response => {
                        if(_.get(response, 'status') === 200) {
                            deferred.resolve(response.data.results.bindings);
                        } else if (_.get(response, 'status') === 204) {
                            deferred.resolve([]);
                        } else {
                            deferred.reject();
                        }
                    }, () => deferred.reject());
                return deferred.promise;
            }
            /**
             * @ngdoc method
             * @name isConcept
             * @methodOf ontologyManager.service:ontologyManagerService
             *
             * @description
             * Checks if the provided entity is an skos:Concept entity. Returns a boolean.
             *
             * @param {Object} entity The entity you want to check.
             * @returns {boolean} Returns true if it is an skos:Concept entity, otherwise returns false.
             */
            self.isConcept = function(entity) {
                return _.includes(_.get(entity, '@type', []), prefixes.skos + 'Concept');
            }
            /**
             * @ngdoc method
             * @name hasConcepts
             * @methodOf ontologyManager.service:ontologyManagerService
             *
             * @description
             * Checks if the provided ontology contains any skos:Concept entities. Returns a boolean.
             *
             * @param {Object[]} ontology The ontology you want to check.
             * @returns {boolean} Returns true if there are any skos:Concept entities in the ontology, otherwise returns
             * false.
             */
            self.hasConcepts = function(ontology) {
                return _.some(ontology, entity => self.isConcept(entity) && !self.isBlankNode(entity));
            }
            /**
             * @ngdoc method
             * @name getConcepts
             * @methodOf ontologyManager.service:ontologyManagerService
             *
             * @description
             * Gets the list of all skos:Concept entities within the provided ontology that are not blank nodes. Returns
             * an Object[].
             *
             * @param {Object[]} ontology The ontology you want to check.
             * @returns {Object[]} An array of all skos:Concept entities within the ontology.
             */
            self.getConcepts = function(ontology) {
                return _.filter(ontology, entity => self.isConcept(entity) && !self.isBlankNode(entity));
            }
            /**
             * @ngdoc method
             * @name getConceptIRIs
             * @methodOf ontologyManager.service:ontologyManagerService
             *
             * @description
             * Gets the list of all skos:Concept entity IRIs within the provided ontology that are not blank nodes.
             * Returns an string[].
             *
             * @param {Object[]} ontology The ontology you want to check.
             * @returns {string[]} An array of all skos:Concept entity IRI strings within the ontology.
             */
            self.getConceptIRIs = function(ontology) {
                return _.map(self.getConcepts(ontology), 'matonto.originalIRI');
            }
            /**
             * @ngdoc method
             * @name isConceptScheme
             * @methodOf ontologyManager.service:ontologyManagerService
             *
             * @description
             * Checks if the provided entity is an skos:ConceptScheme entity. Returns a boolean.
             *
             * @param {Object} entity The entity you want to check.
             * @returns {boolean} Returns true if it is an skos:ConceptScheme entity, otherwise returns false.
             */
            self.isConceptScheme = function(entity) {
                return _.includes(_.get(entity, '@type', []), prefixes.skos + 'ConceptScheme');
            }
            /**
             * @ngdoc method
             * @name hasConceptSchemes
             * @methodOf ontologyManager.service:ontologyManagerService
             *
             * @description
             * Checks if the provided ontology contains any skos:ConceptScheme entities. Returns a boolean.
             *
             * @param {Object[]} ontology The ontology you want to check.
             * @returns {boolean} Returns true if there are any skos:ConceptScheme entities in the ontology, otherwise
             * returns false.
             */
            self.hasConceptSchemes = function(ontology) {
                return _.some(ontology, entity => self.isConceptScheme(entity) && !self.isBlankNode(entity));
            }
            /**
             * @ngdoc method
             * @name getConceptSchemes
             * @methodOf ontologyManager.service:ontologyManagerService
             *
             * @description
             * Gets the list of all skos:ConceptScheme entities within the provided ontology that are not blank nodes.
             * Returns an Object[].
             *
             * @param {Object[]} ontology The ontology you want to check.
             * @returns {Object[]} An array of all skos:ConceptScheme entities within the ontology.
             */
            self.getConceptSchemes = function(ontology) {
                return _.filter(ontology, entity => self.isConceptScheme(entity) && !self.isBlankNode(entity));
            }
            /**
             * @ngdoc method
             * @name getConceptSchemeIRIs
             * @methodOf ontologyManager.service:ontologyManagerService
             *
             * @description
             * Gets the list of all skos:ConceptScheme entity IRIs within the provided ontology that are not blank nodes.
             * Returns an string[].
             *
             * @param {Object[]} ontology The ontology you want to check.
             * @returns {string[]} An array of all skos:ConceptScheme entity IRI strings within the ontology.
             */
            self.getConceptSchemeIRIs = function(ontology) {
                return _.map(self.getConceptSchemes(ontology), 'matonto.originalIRI');
            }
            /**
             * @ngdoc method
             * @name getSearchResults
             * @methodOf ontologyManager.service:ontologyManagerService
             *
             * @description
             * Gets the search results for literals that contain the requested search text.
             *
             * @param {string} ontologyId The ontology ID of the ontology you want to get from the repository.
             * @param {string} searchText The text that you are searching for in the ontology entity literal values.
             * @returns {Promise} A promise containing the SPARQL query results.
             */
            self.getSearchResults = function(ontologyId, searchText) {
                var defaultErrorMessage = 'An error has occurred with your search.';
                var deferred = $q.defer();
                var config = {
                    params: {searchText}
                };
                $rootScope.showSpinner = true;
                $http.get(prefix + encodeURIComponent(ontologyId) + '/search-results', config)
                    .then(response => {
                        if(_.get(response, 'status') === 200) {
                            deferred.resolve(response.data);
                        } else if (_.get(response, 'status') === 204) {
                            deferred.resolve([]);
                        } else {
                            deferred.reject(defaultErrorMessage);
                        }
                    }, response => {
                        deferred.reject(_.get(response, 'statusText', defaultErrorMessage));
                    })
                    .then(() => {
                        $rootScope.showSpinner = false;
                    });
                return deferred.promise;
            }

            /* Private helper functions */
            function updateModels(response) {
                if(_.has(response, 'data.models', [])) {
                    _.forEach(response.data.models, model => {
                        var ontology = self.getOntologyById(_.get(model, "[0]['@id']"));
                        var newEntity = _.get(model, "[0]['@graph'][0]");
                        var newEntityIRI = _.get(newEntity, '@id');
                        var oldEntity = self.getEntity(ontology, newEntityIRI);
                        if (_.has(oldEntity, 'matonto.icon')) {
                            _.set(newEntity, 'matonto.icon', oldEntity.matonto.icon);
                        }
                        _.set(newEntity, 'matonto.originalIRI', newEntityIRI);
                        self.removeEntity(ontology, oldEntity.matonto.originalIRI);
                        self.addEntity(ontology, newEntity);
                    });
                }
            }
            function getIcon(property) {
                var range = _.get(property, prefixes.rdfs + 'range');
                var icon = 'fa-square-o';
                if (range) {
                    if (range.length === 1) {
                        switch(range[0]['@id']) {
                            case prefixes.xsd + 'string':
                                icon = 'fa-font';
                                break;
                            case prefixes.xsd + 'decimal':
                            case prefixes.xsd + 'double':
                            case prefixes.xsd + 'float':
                            case prefixes.xsd + 'int':
                            case prefixes.xsd + 'integer':
                            case prefixes.xsd + 'long':
                            case prefixes.xsd + 'nonNegativeInteger':
                                icon = 'fa-calculator';
                                break;
                            case prefixes.xsd + 'language':
                                icon = 'fa-language';
                                break;
                            case prefixes.xsd + 'anyURI':
                                icon = 'fa-external-link';
                                break;
                            case prefixes.xsd + 'dateTime':
                                icon = 'fa-clock-o';
                                break;
                            case prefixes.xsd + 'boolean':
                            case prefixes.xsd + 'byte':
                                icon = 'fa-signal';
                                break;
                            default:
                                icon = 'fa-link';
                                break;
                        }
                    } else {
                        icon = 'fa-cubes';
                    }
                }
                return icon;
            }
            function addOntologyIdToArray(arr, ontologyId) {
                return _.forEach(arr, item => _.set(item, 'ontologyId', ontologyId));
            }
            function compareListItems(obj1, obj2) {
                return _.isEqual(_.get(obj1, 'localName'), _.get(obj2, 'localName'))
                    && _.isEqual(_.get(obj1, 'namespace'), _.get(obj2, 'namespace'));
            }
            function getReadableRestrictionText(restrictionId, restriction) {
                var readableText = restrictionId;
                var keys = _.keys(restriction);
                _.pull(keys, prefixes.owl + 'onProperty', prefixes.owl + 'onClass', '@id', '@type', 'matonto');
                if (keys.length === 1 && _.isArray(restriction[keys[0]]) && restriction[keys[0]].length === 1) {
                    var detailedKey = keys[0];
                    var detailedValue = restriction[detailedKey][0];
                    var onValue = _.get(restriction, prefixes.owl + 'onProperty',
                        _.get(restriction, prefixes.owl + 'onClass'));
                    if (onValue && _.isArray(onValue) && onValue.length === 1) {
                        var onId = _.get(onValue[0], '@id');
                        readableText = $filter('splitIRI')(onId).end + ' ' + $filter('splitIRI')(detailedKey).end + ' ';
                        if (_.has(detailedValue, '@id')) {
                            readableText += $filter('splitIRI')(detailedValue['@id']).end;
                        } else if (_.has(detailedValue, '@value') && _.has(detailedValue, '@type')) {
                            readableText += detailedValue['@value'] + ' '
                                + $filter('splitIRI')(detailedValue['@type']).end;
                        }
                    }
                }
                return readableText;
            }
            function getReadableBlankNodeText(blankNodeId, blankNode) {
                var readableText = blankNodeId;
                var list = [];
                var joiningWord;
                if (_.has(blankNode, prefixes.owl + 'unionOf')) {
                    list = _.get(blankNode[prefixes.owl + 'unionOf'], "[0]['@list']", []);
                    joiningWord = ' or ';
                } else if (_.has(blankNode, prefixes.owl + 'intersectionOf')) {
                    list = _.get(blankNode[prefixes.owl + 'intersectionOf'], "[0]['@list']", []);
                    joiningWord = ' and ';
                }
                if (list.length) {
                    readableText = _.join(_.map(list, item => {
                        return $filter('splitIRI')(_.get(item, '@id')).end;
                    }), joiningWord);
                }
                return readableText;
            }
            function setupListItem(ontologyId, ontology, template) {
                var listItem = angular.copy(template);
                var blankNodes = {};
                var index = {};
                _.forEach(ontology, (entity, i) => {
                    if (_.has(entity, '@id')) {
                        _.set(entity, 'matonto.originalIRI', entity['@id']);
                        index[entity['@id']] = i;
                    } else {
                        _.set(entity, 'matonto.anonymous', ontologyId + ' (Anonymous Ontology)');
                    }
                    if (self.isProperty(entity)) {
                        _.set(entity, 'matonto.icon', getIcon(entity));
                    } else if (self.isRestriction(entity)) {
                        let id = _.get(entity, '@id');
                        _.set(blankNodes, id, getReadableRestrictionText(id, entity));
                    } else if (self.isBlankNode(entity)) {
                        let id = _.get(entity, '@id');
                        _.set(blankNodes, id, getReadableBlankNodeText(id, entity));
                    }
                });
                listItem.ontologyId = ontologyId;
                listItem.ontology = ontology;
                listItem.blankNodes = blankNodes;
                listItem.index = index;
                return listItem;
            }
            function addOntologyToList(ontologyId, ontology) {
                var deferred = $q.defer();
                var listItem = setupListItem(ontologyId, ontology, ontologyListItemTemplate);
                $q.all([
                    $http.get(prefix + encodeURIComponent(ontologyId) + '/iris'),
                    $http.get(prefix + encodeURIComponent(ontologyId) + '/imported-iris'),
                    $http.get(prefix + encodeURIComponent(ontologyId) + '/class-hierarchies'),
                    $http.get(prefix + encodeURIComponent(ontologyId) + '/classes-with-individuals'),
                    $http.get(prefix + encodeURIComponent(ontologyId) + '/data-property-hierarchies'),
                    $http.get(prefix + encodeURIComponent(ontologyId) + '/object-property-hierarchies')
                ]).then(response => {
                    var irisResponse = response[0];
                    if (_.get(irisResponse, 'status') === 200) {
                        listItem.annotations = _.unionWith(
                            _.get(irisResponse, 'data.annotationProperties'),
                            propertyManagerService.defaultAnnotations,
                            _.isMatch
                        );
                        listItem.subClasses = _.get(irisResponse, 'data.classes');
                        listItem.subDataProperties = _.get(irisResponse, 'data.dataProperties');
                        listItem.subObjectProperties = _.get(irisResponse, 'data.objectProperties');
                        listItem.individuals = _.get(irisResponse, 'data.namedIndividuals');
                        listItem.dataPropertyRange = _.unionWith(
                            _.get(irisResponse, 'data.datatypes'),
                            defaultDatatypes,
                            _.isMatch
                        );
                        var importedIrisResponse = response[1];
                        if (_.get(importedIrisResponse, 'status') === 200) {
                            _.forEach(importedIrisResponse.data, iriList => {
                                listItem.annotations = _.unionWith(
                                    addOntologyIdToArray(iriList.annotationProperties, iriList.id),
                                    listItem.annotations,
                                    compareListItems
                                );
                                listItem.subClasses = _.unionWith(
                                    addOntologyIdToArray(iriList.classes, iriList.id),
                                    listItem.subClasses,
                                    compareListItems
                                );
                                listItem.subDataProperties = _.unionWith(
                                    addOntologyIdToArray(iriList.dataProperties, iriList.id),
                                    listItem.subDataProperties,
                                    compareListItems
                                );
                                listItem.subObjectProperties = _.unionWith(
                                    addOntologyIdToArray(iriList.objectProperties, iriList.id),
                                    listItem.subObjectProperties,
                                    compareListItems
                                );
                                listItem.individuals = _.unionWith(
                                    addOntologyIdToArray(iriList.individuals, iriList.id),
                                    listItem.individuals,
                                    compareListItems
                                );
                                listItem.dataPropertyRange = _.unionWith(
                                    addOntologyIdToArray(iriList.datatypes, iriList.id),
                                    listItem.dataPropertyRange,
                                    compareListItems
                                );
                            });
                        }
                        var classHierarchyResponse = response[2];
                        if (_.get(classHierarchyResponse, 'status') === 200) {
                            listItem.classHierarchy = classHierarchyResponse.data.hierarchy;
                            listItem.classIndex = classHierarchyResponse.data.index;
                        }
                        var classesWithIndividualsResponse = response[3];
                        if (_.get(classesWithIndividualsResponse, 'status') === 200) {
                            listItem.classesWithIndividuals = classesWithIndividualsResponse.data.hierarchy;
                            listItem.classesWithIndividualsIndex = classesWithIndividualsResponse.data.index;
                        }
                        var dataPropertyHierarchyResponse = response[4];
                        if (_.get(dataPropertyHierarchyResponse, 'status') === 200) {
                            listItem.dataPropertyHierarchy = dataPropertyHierarchyResponse.data.hierarchy;
                            listItem.dataPropertyIndex = dataPropertyHierarchyResponse.data.index;
                        }
                        var objectPropertyHierarchyResponse = response[5];
                        if (_.get(objectPropertyHierarchyResponse, 'status') === 200) {
                            listItem.objectPropertyHierarchy = objectPropertyHierarchyResponse.data.hierarchy;
                            listItem.objectPropertyIndex = objectPropertyHierarchyResponse.data.index;
                        }
                        _.pullAllWith(
                            listItem.annotations,
                            _.concat(self.ontologyProperties, listItem.subDataProperties, listItem.subObjectProperties),
                            compareListItems
                        );
                        self.list.push(listItem);
                        deferred.resolve();
                    } else {
                        deferred.reject();
                    }
                }, () => {
                    deferred.reject();
                });
                return deferred.promise;
            }
            function addVocabularyToList(ontologyId, ontology) {
                var deferred = $q.defer();
                var listItem = setupListItem(ontologyId, ontology, vocabularyListItemTemplate);
                $q.all([
                    $http.get(prefix + encodeURIComponent(ontologyId) + '/iris'),
                    $http.get(prefix + encodeURIComponent(ontologyId) + '/imported-iris'),
                    $http.get(prefix + encodeURIComponent(ontologyId) + '/concept-hierarchies')
                ]).then(response => {
                    var irisResponse = response[0];
                    if (_.get(irisResponse, 'status') === 200) {
                        listItem.subDataProperties = _.get(irisResponse, 'data.dataProperties');
                        listItem.subObjectProperties = _.get(irisResponse, 'data.objectProperties');
                        listItem.annotations = _.unionWith(
                            _.get(irisResponse, 'data.annotationProperties'),
                            propertyManagerService.defaultAnnotations,
                            angular.copy(propertyManagerService.skosAnnotations),
                            _.isMatch
                        );
                        listItem.dataPropertyRange = _.unionWith(
                            _.get(irisResponse, 'data.datatypes'),
                            defaultDatatypes,
                            _.isMatch
                        );
                        var importedIrisResponse = response[1];
                        if (_.get(importedIrisResponse, 'status') === 200) {
                            _.forEach(importedIrisResponse.data, iriList => {
                                listItem.annotations = _.unionWith(
                                    addOntologyIdToArray(iriList.annotationProperties, iriList.id),
                                    listItem.annotations,
                                    compareListItems
                                );
                                listItem.subDataProperties = _.unionWith(
                                    addOntologyIdToArray(iriList.dataProperties, iriList.id),
                                    listItem.subDataProperties,
                                    compareListItems
                                );
                                listItem.subObjectProperties = _.unionWith(
                                    addOntologyIdToArray(iriList.objectProperties, iriList.id),
                                    listItem.subObjectProperties,
                                    compareListItems
                                );
                            });
                        }
                        var conceptHierarchyResponse = response[2];
                        if (_.get(conceptHierarchyResponse, 'status') === 200) {
                            listItem.conceptHierarchy = conceptHierarchyResponse.data.hierarchy;
                            listItem.conceptIndex = conceptHierarchyResponse.data.index;
                        }
                        _.pullAllWith(
                            listItem.annotations,
                            _.concat(self.ontologyProperties, listItem.subDataProperties, listItem.subObjectProperties,
                                angular.copy(self.conceptRelationshipList), angular.copy(self.schemeRelationshipList)),
                            compareListItems
                        );
                        self.list.push(listItem);
                        deferred.resolve();
                    } else {
                        deferred.reject();
                    }
                }, () => {
                    deferred.reject();
                });
                return deferred.promise;
            }
        }
})();
