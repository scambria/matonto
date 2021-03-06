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
describe('Mapping Manager service', function() {
    var $httpBackend,
        mappingManagerSvc,
        ontologyManagerSvc,
        uuidSvc,
        windowSvc,
        prefixes,
        $q,
        $timeout;

    beforeEach(function() {
        module('mappingManager');
        mockPrefixes();
        injectSplitIRIFilter();
        mockOntologyManager();

        module(function($provide) {
            $provide.service('$window', function() {
                this.location = '';
            });
            $provide.service('uuid', function() {
                this.v4 = jasmine.createSpy('v4').and.returnValue('');
            });
        });

        inject(function(mappingManagerService, _ontologyManagerService_, _uuid_, _$httpBackend_, _$window_, _prefixes_, _$q_, _$timeout_) {
            mappingManagerSvc = mappingManagerService;
            ontologyManagerSvc = _ontologyManagerService_;
            uuidSvc = _uuid_;
            $httpBackend = _$httpBackend_;
            windowSvc = _$window_;
            prefixes = _prefixes_;
            $q = _$q_;
            $timeout = _$timeout_;
        });
    });

    it('should reset the service', function() {
        mappingManagerSvc.mappingIds = [''];
        mappingManagerSvc.reset();
        expect(mappingManagerSvc.mappingIds).toEqual([]);
    });
    describe('should initialize the list of saved mapping ids', function() {
        beforeEach(function() {
            this.mappings = ['mapping1', 'mapping2'];
        });
        it('unless an error occurs', function() {
            $httpBackend.whenGET('/matontorest/mappings').respond(function(method, url, data, headers) {
                return [400, '', {}, 'Error Message'];
            });
            mappingManagerSvc.initialize();
            $httpBackend.flush();
            expect(mappingManagerSvc.mappingIds).toEqual([]);
        });
        it('successfully', function() {
            $httpBackend.whenGET('/matontorest/mappings').respond(200, this.mappings);
            mappingManagerSvc.initialize();
            $httpBackend.flush();
            expect(mappingManagerSvc.mappingIds).toEqual(this.mappings);
        });
    });
    describe('should upload a mapping', function() {
        it('unless an error occurs', function(done) {
            $httpBackend.expectPOST('/matontorest/mappings',
                function(data) {
                    return data instanceof FormData;
                }, function(headers) {
                    return headers['Content-Type'] === undefined && headers['Accept'] === 'text/plain';
                }).respond(function(method, url, data, headers) {
                    return [400, '', {}, 'Error Message'];
                });
            mappingManagerSvc.upload([]).then(function(response) {
                fail('Promise should have rejected');
                done();
            }, function(response) {
                expect(response).toBe('Error Message');
                done();
            });
            $httpBackend.flush();
        });
        it('successfully', function(done) {
            $httpBackend.expectPOST('/matontorest/mappings',
                function(data) {
                    return data instanceof FormData;
                }, function(headers) {
                    return headers['Content-Type'] === undefined && headers['Accept'] === 'text/plain';
                }).respond(200, 'mapping');
            mappingManagerSvc.upload([]).then(function(response) {
                expect(response).toBe('mapping');
                expect(mappingManagerSvc.mappingIds).toContain('mapping');
                done();
            }, function(response) {
                fail('Promise should have resolved');
                done();
            });
            $httpBackend.flush();
        });
        it('replacing an existing one', function(done) {
            var name = 'mappingname';
            mappingManagerSvc.mappingIds = [name];
            $httpBackend.expectPOST('/matontorest/mappings',
                function(data) {
                    return data instanceof FormData;
                }, function(headers) {
                    return headers['Content-Type'] === undefined && headers['Accept'] === 'text/plain';
                }).respond(200, name);
            mappingManagerSvc.upload([]).then(function(response) {
                expect(response).toBe(name);
                expect(mappingManagerSvc.mappingIds).toEqual([name]);
                done();
            }, function(response) {
                fail('Promise should have resolved');
                done();
            });
            $httpBackend.flush();
        });
    });
    describe('should retrieve a mapping by id', function() {
        beforeEach(function() {
            this.id = 'mappingname';
        });
        it('unless an error occurs', function(done) {
            $httpBackend.expectGET('/matontorest/mappings/' + this.id).respond(function(method, url, data, headers) {
                return [400, '', {}, 'Error Message'];
            });
            mappingManagerSvc.getMapping(this.id).then(function(response) {
                fail('Promise should have rejected');
                done();
            }, function(response) {
                expect(response).toBe('Error Message');
                done();
            });
            $httpBackend.flush();
        });
        it('successfully', function(done) {
            $httpBackend.expectGET('/matontorest/mappings/' + this.id).respond(200, {'@graph': []});
            mappingManagerSvc.getMapping(this.id).then(function(response) {
                expect(response).toEqual([]);
                done();
            }, function(response) {
                fail('Promise should have resolved');
                done();
            });
            $httpBackend.flush();
        });
    });
    it('should download a mapping by id', function() {
        mappingManagerSvc.downloadMapping('mapping', 'jsonld');
        expect(windowSvc.location).toBe('/matontorest/mappings/mapping?format=jsonld');
    });
    describe('should delete a mapping by id', function() {
        beforeEach(function() {
            this.id = 'mappingname';
        });
        it('unless an error occurs', function(done) {
            $httpBackend.expectDELETE('/matontorest/mappings/' + this.id).respond(function(method, url, data, headers) {
                return [400, '', {}, 'Error Message'];
            });
            mappingManagerSvc.deleteMapping(this.id).then(function(response) {
                fail('Promise should have rejected');
                done();
            }, function(response) {
                expect(response).toBe('Error Message');
                done();
            });
            $httpBackend.flush();
        });
        it('successfully', function(done) {
            mappingManagerSvc.mappingIds = [name];
            $httpBackend.expectDELETE('/matontorest/mappings/' + this.id).respond(200, '');
            mappingManagerSvc.deleteMapping(this.id).then(function(response) {
                expect(mappingManagerSvc.mappingIds).not.toContain(this.id);
                done();
            }, function(response) {
                fail('Promise should have resolved');
                done();
            });
            $httpBackend.flush();
        });
    });
    it('should create a new mapping', function() {
        var result = mappingManagerSvc.createNewMapping('mappingname');
        expect(_.isArray(result)).toBe(true);
        var obj = _.find(result, {'@id': 'mappingname'});
        expect(obj).toBeTruthy();
        expect(obj['@type']).toEqual(['Mapping']);
    });
    it('should set the source ontology of a mapping', function() {
        var mapping = [{'@id': 'mappingname', '@type': ['Mapping']}];
        mappingManagerSvc.setSourceOntology(mapping, 'ontology');
        var mappingObj = _.find(mapping, {'@id': 'mappingname'});
        expect(mappingObj.sourceOntology).toEqual([{'@id': 'ontology'}]);
    });
    it('should create a copy of a mapping', function() {
        var mappingEntity = {'@id': 'originalMapping', '@type': [prefixes.delim + 'Mapping'], id: 'mapping'};
        var classMapping1 = {'@id': 'class1', 'id': 'class1'};
        var classMapping2 = {'@id': 'class2', 'id': 'class2'};
        var objectMapping = {'@id': 'object', 'id': 'object'};
        objectMapping[prefixes.delim + 'classMapping'] = [angular.copy(classMapping2)];
        var dataMapping = {'@id': 'data', 'id': 'data'};
        spyOn(mappingManagerSvc, 'getAllClassMappings').and.returnValue([classMapping1, classMapping2]);
        spyOn(mappingManagerSvc, 'getAllObjectMappings').and.returnValue([objectMapping]);
        spyOn(mappingManagerSvc, 'getAllDataMappings').and.returnValue([dataMapping]);
        spyOn(mappingManagerSvc, 'isObjectMapping').and.callFake(function(entity) {
            return entity.id === objectMapping.id;
        });
        var changedMapping = [classMapping1, classMapping2, objectMapping, dataMapping];
        var mapping = _.concat(angular.copy(changedMapping), mappingEntity);
        var result = mappingManagerSvc.copyMapping(mapping, 'newMapping');
        expect(result.length).toBe(mapping.length);
        expect(_.find(result, {id: 'mapping'})['@id']).toBe('newMapping');
        _.forEach(changedMapping, function(entity) {
            var original = _.find(mapping, {'id': entity.id});
            expect(original['@id']).not.toBe(entity['@id']);
            if (_.has(entity, "['" + prefixes.delim + "classMapping']")){
                expect(entity[prefixes.delim + 'classMapping']).not.toEqual(original[prefixes.delim + 'classMapping']);
            }
        });
    });
    describe('should add a class mapping to a mapping', function() {
        beforeEach(function() {
            this.mapping = [{'@id': 'mappingname', '@type': ['Mapping']}];
        });
        it('unless the class does not exist in the passed ontology', function() {
            ontologyManagerSvc.getEntity.and.returnValue(undefined);
            var result = mappingManagerSvc.addClass(this.mapping, {}, 'classid');
            expect(result).toBeUndefined();
            expect(this.mapping).not.toContain(result);
        });
        it('if the class exists in the passed ontology', function() {
            var result = mappingManagerSvc.addClass(this.mapping, {}, 'classid');
            expect(this.mapping).toContain(result);
            expect(uuidSvc.v4).toHaveBeenCalled();
            expect(result['@type']).toContain(prefixes.delim + 'ClassMapping');
            expect(result[prefixes.delim + 'localName']).toEqual([{'@value': '${UUID}'}]);
            expect(result[prefixes.delim + 'mapsTo']).toEqual([{'@id': 'classid'}]);
        });
    });
    describe('should set the IRI template of a class mapping', function() {
        beforeEach(function() {
            this.mapping = [{'@id': 'mappingname', '@type': ['Mapping']}];
        });
        it('unless it does not exist in the mapping', function() {
            var mapping = angular.copy(this.mapping);
            mappingManagerSvc.editIriTemplate(this.mapping, 'classId', 'test/', '${0}');
            expect(mapping).toEqual(this.mapping);
        });
        it('successfully', function() {
            var classMapping = {'@id': 'classId'};
            spyOn(mappingManagerSvc, 'getSourceOntologyId').and.returnValue('ontology');
            this.mapping.push(classMapping);
            mappingManagerSvc.editIriTemplate(this.mapping, classMapping['@id'], 'test/', '${0}');
            expect(classMapping[prefixes.delim + 'hasPrefix']).toEqual([{'@value': 'ontology/test/'}]);
            expect(classMapping[prefixes.delim + 'localName']).toEqual([{'@value': '${0}'}]);
        });
    });
    describe('should add a data property mapping to a mapping', function() {
        beforeEach(function() {
            this.classMapping = {'@id': 'classId'};
            this.mapping = [{'@id': 'mappingname', '@type': ['Mapping']}, this.classMapping];
        });
        it('unless the parent class mapping does not exist in the mapping', function() {
            var result = mappingManagerSvc.addDataProp(this.mapping, {}, this.classMapping['@id'], 'propId', 0);
            expect(result).toBeUndefined();
            expect(this.mapping).not.toContain(result);
        });
        it('unless the property does not exist in the passed ontology', function() {
            ontologyManagerSvc.getEntity.and.returnValue(undefined);
            var result = mappingManagerSvc.addDataProp(this.mapping, {}, this.classMapping['@id'], 'propId', 0);
            expect(result).toBeUndefined();
            expect(this.mapping).not.toContain(result);
        });
        it('unless the IRI passed is not for a data property', function() {
            ontologyManagerSvc.isDataTypeProperty.and.returnValue(false);
            var result = mappingManagerSvc.addDataProp(this.mapping, {}, this.classMapping['@id'], 'propId', 0);
            expect(result).toBeUndefined();
            expect(this.mapping).not.toContain(result);
        });
        it('if the data property exists in the passed ontology', function() {
            ontologyManagerSvc.isDataTypeProperty.and.returnValue(true);
            var result = mappingManagerSvc.addDataProp(this.mapping, {}, this.classMapping['@id'], 'propId', 0);
            expect(this.mapping).toContain(result);
            expect(uuidSvc.v4).toHaveBeenCalled();
            expect(result['@type']).toContain(prefixes.delim + 'DataMapping');
            expect(result[prefixes.delim + 'columnIndex']).toEqual([{'@value': '0'}]);
            expect(result[prefixes.delim + 'hasProperty']).toEqual([{'@id': 'propId'}]);
            expect(_.isArray(this.classMapping[prefixes.delim + 'dataProperty'])).toBe(true);
            expect(this.classMapping[prefixes.delim + 'dataProperty']).toContain({'@id': result['@id']});
        });
    });
    describe('should add an object property mapping to a mapping', function() {
        beforeEach(function() {
            this.parentClassMapping = {'@id': 'class1'};
            this.rangeClassMapping = {'@id': 'class2'};
            this.rangeClassMapping[prefixes.delim + 'mapsTo'] = [{'@id': 'classId'}];
            this.mapping = [{'@id': 'mappingname', '@type': ['Mapping']}, this.parentClassMapping, this.rangeClassMapping];
        });
        it('unless the parent class mapping does not exist in the mapping', function() {
            var result = mappingManagerSvc.addObjectProp([], [], this.parentClassMapping['@id'], 'propId', this.rangeClassMapping['@id']);
            expect(result).toBeUndefined();
        });
        it('unless the range class mapping does not exist in the mapping', function() {
            var result = mappingManagerSvc.addObjectProp([this.parentClassMapping], [], this.parentClassMapping['@id'], 'propId', this.rangeClassMapping['@id']);
            expect(result).toBeUndefined();
        });
        it('unless the property does not exist in the passed ontology', function() {
            ontologyManagerSvc.getEntity.and.returnValue(undefined);
            var result = mappingManagerSvc.addObjectProp(this.mapping, [], this.parentClassMapping['@id'], 'propId', this.rangeClassMapping['@id']);
            expect(this.mapping).not.toContain(result);
            expect(result).toBeUndefined();
        });
        it('unless the IRI is not for an object property', function() {
            ontologyManagerSvc.isObjectProperty.and.returnValue(false);
            var result = mappingManagerSvc.addObjectProp(this.mapping, [], this.parentClassMapping['@id'], 'propId', this.rangeClassMapping['@id']);
            expect(this.mapping).not.toContain(result);
            expect(result).toBeUndefined();
        });
        it('unless the range of the object property does not matched the range class mapping', function() {
            ontologyManagerSvc.isObjectProperty.and.returnValue(true);
            var obj = {};
            obj[prefixes.rdfs + 'range'] = [{'@id': ''}];
            ontologyManagerSvc.getEntity.and.returnValue(obj);
            var result = mappingManagerSvc.addObjectProp(this.mapping, [], this.parentClassMapping['@id'], 'propId', this.rangeClassMapping['@id']);
            expect(this.mapping).not.toContain(result);
            expect(result).toBeUndefined();
        });
        it('if the object property exists in the passed ontology', function() {
            ontologyManagerSvc.isObjectProperty.and.returnValue(true);
            var obj = {};
            obj[prefixes.rdfs + 'range'] = angular.copy(this.rangeClassMapping[prefixes.delim + 'mapsTo']);
            ontologyManagerSvc.getEntity.and.returnValue(obj);
            var result = mappingManagerSvc.addObjectProp(this.mapping, [], this.parentClassMapping['@id'], 'propId', this.rangeClassMapping['@id']);
            expect(uuidSvc.v4).toHaveBeenCalled();
            expect(_.isArray(this.parentClassMapping.objectProperty)).toBe(true);
            expect(this.parentClassMapping.objectProperty).toContain({'@id': result['@id']});
            expect(result[prefixes.delim + 'classMapping']).toEqual([{'@id': this.rangeClassMapping['@id']}]);
            expect(result[prefixes.delim + 'hasProperty']).toEqual([{'@id': 'propId'}]);
        });
    });
    describe('should remove a property mapping from a mapping', function() {
        beforeEach(function() {
            this.mapping = [];
        });
        it('unless the property mapping does not exist in the mapping', function() {
            mappingManagerSvc.removeProp(this.mapping, 'classId', 'propId');
            expect(this.mapping).toEqual([]);
        });
        describe('if the property mapping exists in mapping and is a data mapping', function() {
            beforeEach(function() {
                this.propMapping = {'@id': 'propId'};
                this.classMapping = {'@id': 'classId'};
            });
            it('and is a data property', function() {
                this.classMapping.dataProperty = [{}, this.propMapping]
                spyOn(mappingManagerSvc, 'isObjectMapping').and.returnValue(false);
                this.mapping = [this.classMapping, this.propMapping];
                mappingManagerSvc.removeProp(this.mapping, 'classId', this.propMapping['@id']);
                expect(this.mapping).not.toContain(this.propMapping);
                expect(_.isArray(this.classMapping.dataProperty)).toBe(true);
                expect(this.classMapping.dataProperty).not.toContain(this.propMapping);
            });
            it('and is an object property', function() {
                this.classMapping.objectProperty = [{}, this.propMapping];
                spyOn(mappingManagerSvc, 'isObjectMapping').and.returnValue(true);
                this.mapping = [this.classMapping, this.propMapping];
                mappingManagerSvc.removeProp(this.mapping, 'classId', this.propMapping['@id']);
                expect(this.mapping).not.toContain(this.propMapping);
                expect(_.isArray(this.classMapping.objectProperty)).toBe(true);
                expect(this.classMapping.objectProperty).not.toContain(this.propMapping);
            });
        });
    });
    describe('should remove a class mapping from a mapping', function() {
        beforeEach(function() {
            this.mapping = [];
        });
        it('unless the class mapping does not exist in the mapping', function() {
            var result = mappingManagerSvc.removeClass(this.mapping, 'classId');
            expect(this.mapping).toEqual([]);
        });
        describe('if the class mapping exists', function() {
            beforeEach(function() {
                this.classMapping = {'@id': 'classId'};
                this.mapping.push(this.classMapping);
            });
            it('and no object mappings use it', function() {
                mappingManagerSvc.removeClass(this.mapping, 'classId');
                expect(this.mapping).not.toContain(this.classMapping);
            });
            it('and object mappings use it', function() {
                var propMapping = {'@id': 'propId', 'classMapping': [this.classMapping]};
                var classMapping2 = {'@id': 'class2', 'objectProperty': [{}, {'@id': propMapping['@id']}]};
                spyOn(mappingManagerSvc, 'getAllObjectMappings').and.returnValue([propMapping]);
                spyOn(mappingManagerSvc, 'findClassWithObjectMapping').and.returnValue(classMapping2);
                this.mapping = _.concat(this.mapping, [propMapping, classMapping2]);
                mappingManagerSvc.removeClass(this.mapping, this.classMapping['@id']);
                expect(_.isArray(classMapping2.objectProperty)).toBe(true);
                expect(classMapping2.objectProperty).not.toContain({'@id': 'propId'});
                expect(this.mapping).not.toContain(propMapping);
                expect(this.mapping).not.toContain(this.classMapping);
            });
            it('along with all its properties', function() {
                var objectMapping = {'@id': 'objectId', '@type': ['ObjectMapping']};
                var dataMapping = {'@id': 'dataId', '@type': ['DataMapping']};
                this.classMapping.objectProperty = [{}, objectMapping];
                this.classMapping.dataProperty = [{}, dataMapping];
                this.mapping = _.concat(this.mapping, [objectMapping, dataMapping]);
                mappingManagerSvc.removeClass(this.mapping, 'classId');
                expect(this.mapping).not.toContain(this.classMapping);
                expect(this.mapping).not.toContain(dataMapping);
                expect(this.mapping).not.toContain(objectMapping);
            });
        });
    });
    it('should get the class id of a class mapping by its id', function() {
        var classMapping = {'@id': 'classId'};
        spyOn(mappingManagerSvc, 'getClassIdByMapping').and.returnValue('');
        var result = mappingManagerSvc.getClassIdByMappingId([classMapping], classMapping['@id']);
        expect(mappingManagerSvc.getClassIdByMapping).toHaveBeenCalledWith(classMapping);
        expect(typeof result).toBe('string');
    });
    it('should get the class id of a class mapping', function() {
        var classMapping = {'@id': 'classId', 'mapsTo': [{'@id': 'class'}]};
        var result = mappingManagerSvc.getClassIdByMapping(classMapping);
        expect(result).toBe('class');
    });
    it('should get the property id of a property mapping by its id', function() {
        var propMapping = {'@id': 'classId'};
        spyOn(mappingManagerSvc, 'getPropIdByMapping').and.returnValue('');
        var result = mappingManagerSvc.getPropIdByMappingId([propMapping], propMapping['@id']);
        expect(mappingManagerSvc.getPropIdByMapping).toHaveBeenCalledWith(propMapping);
        expect(typeof result).toBe('string');
    });
    it('should get the property id of a property mapping', function() {
        var propMapping = {'@id': 'propId', 'hasProperty': [{'@id': 'prop'}]};
        var result = mappingManagerSvc.getPropIdByMapping(propMapping);
        expect(result).toBe('prop');
    });
    describe('should get an ontology in the correct structure', function() {
        it('unless an error occurs', function(done) {
            ontologyManagerSvc.getOntology.and.returnValue($q.reject({statusText: 'Error message'}));
            mappingManagerSvc.getOntology('').then(function() {
                fail('Promise should have rejected');
                done();
            }, function(error) {
                expect(error).toBe('Error message');
                done();
            });
            $timeout.flush();
        });
        it('unless something went wrong', function(done) {
            ontologyManagerSvc.getOntology.and.returnValue($q.when({status: 206, statusText: 'Error message'}));
            mappingManagerSvc.getOntology('').then(function() {
                fail('Promise should have rejected');
                done();
            }, function(error) {
                expect(error).toBe('Error message');
                done();
            });
            $timeout.flush();
        });
        it('successfully', function(done) {
            var ontology = {id: '', ontology: []};
            ontologyManagerSvc.getOntology.and.returnValue($q.when({status: 200, data: ontology}));
            mappingManagerSvc.getOntology('').then(function(response) {
                expect(typeof response).toBe('object');
                expect(response.id).toBe(ontology.id);
                expect(response.entities).toBe(ontology.ontology);
                done();
            });
            $timeout.flush();
        });
    });
    describe('should get the list of source ontologies from the imports closure of the specified ontology', function() {
        beforeEach(function() {
            this.mapping = {jsonld: []};
            this.ontology = {id: 'ontology', entities: []};
            this.importedOntology = {id: 'imported', entities: []};
        });
        it('unless an id was not passed', function(done) {
            mappingManagerSvc.getSourceOntologies('').then(function(arr) {
                expect(arr).toEqual([]);
                done();
            });
            $timeout.flush();
        });
        describe('if the ontology is open', function() {
            beforeEach(function() {
                ontologyManagerSvc.list = [{ontologyId: this.ontology.id, ontology: this.ontology.entities}];
                spyOn(mappingManagerSvc, 'getOntology');
            });
            it('unless an error occurs', function(done) {
                var test = this;
                ontologyManagerSvc.getImportedOntologies.and.returnValue($q.reject('Error message'));
                mappingManagerSvc.getSourceOntologies(test.ontology.id).then(function() {
                    fail('The promise should have rejected');
                    done();
                }, function(errorMessage) {
                    expect(mappingManagerSvc.getOntology).not.toHaveBeenCalled();
                    expect(ontologyManagerSvc.getImportedOntologies).toHaveBeenCalledWith(test.ontology.id);
                    expect(errorMessage).toBe('Error message');
                    done();
                });
                $timeout.flush();
            });
            it('successfully', function(done) {
                var test = this;
                ontologyManagerSvc.getImportedOntologies.and.returnValue($q.when([{ontologyId: test.importedOntology.id, ontology: test.importedOntology.entities}]));
                mappingManagerSvc.getSourceOntologies(test.ontology.id).then(function(ontologies) {
                    expect(mappingManagerSvc.getOntology).not.toHaveBeenCalled();
                    expect(ontologyManagerSvc.getImportedOntologies).toHaveBeenCalledWith(test.ontology.id);
                    expect(ontologies).toContain(test.ontology);
                    expect(ontologies).toContain(test.importedOntology);
                    done();
                });
                $timeout.flush();
            });
        });
        describe('if the ontology is not open', function() {
            beforeEach(function() {
                ontologyManagerSvc.getImportedOntologies.and.returnValue($q.when([{ontologyId: this.importedOntology.id, ontology: this.importedOntology.entities}]));
            });
            it('unless an error occurs', function(done) {
                var test = this;
                spyOn(mappingManagerSvc, 'getOntology').and.returnValue($q.reject('Error message'));
                mappingManagerSvc.getSourceOntologies(test.ontology.id).then(function() {
                    fail('The promise should have rejected');
                    done();
                }, function(errorMessage) {
                    expect(mappingManagerSvc.getOntology).toHaveBeenCalledWith(test.ontology.id);
                    expect(ontologyManagerSvc.getImportedOntologies).not.toHaveBeenCalledWith();
                    expect(errorMessage).toBe('Error message');
                    done();
                });
                $timeout.flush();
            });
            it('successfully', function(done) {
                var test = this;
                spyOn(mappingManagerSvc, 'getOntology').and.returnValue($q.when(test.ontology));
                mappingManagerSvc.getSourceOntologies(test.ontology.id).then(function(ontologies) {
                    expect(mappingManagerSvc.getOntology).toHaveBeenCalledWith(test.ontology.id);
                    expect(ontologyManagerSvc.getImportedOntologies).toHaveBeenCalledWith(test.ontology.id);
                    expect(ontologies).toContain(test.ontology);
                    expect(ontologies).toContain(test.importedOntology);
                    done();
                });
                $timeout.flush();
            });
        });
    });
    it('should get the id of the source ontology of a mapping', function() {
        var result = mappingManagerSvc.getSourceOntologyId([{'@id': 'mappingname', '@type': ['Mapping'], 'sourceOntology': [{'@id': 'ontology'}]}]);
        expect(result).toBe('ontology');
    });
    it('should get the source ontology of a mapping', function() {
        var ontology = {id: 'ontology'};
        var sourceOntologies = [ontology]
        spyOn(mappingManagerSvc, 'getSourceOntologyId').and.returnValue('ontology')
        var result = mappingManagerSvc.getSourceOntology([], sourceOntologies);
        expect(result).toEqual(ontology);
    });
    it('should find the source ontology with a certain class', function() {
        var ontology = {};
        var sourceOntologies = [ontology];
        ontologyManagerSvc.getClasses.and.returnValue([{'@id': 'class'}]);
        var result = mappingManagerSvc.findSourceOntologyWithClass('class', sourceOntologies);
        expect(result).toEqual(ontology);

        ontologyManagerSvc.getClasses.and.returnValue([]);
        result = mappingManagerSvc.findSourceOntologyWithClass('class', sourceOntologies);
        expect(result).toBeUndefined();
    });
    it('should find the source ontology with a certain property', function() {
        var ontology = {};
        var sourceOntologies = [ontology];
        ontologyManagerSvc.getDataTypeProperties.and.returnValue([{'@id': 'prop'}]);
        var result = mappingManagerSvc.findSourceOntologyWithProp('prop', sourceOntologies);
        expect(result).toEqual(ontology);

        ontologyManagerSvc.getDataTypeProperties.and.returnValue([]);
        ontologyManagerSvc.getObjectProperties.and.returnValue([{'@id': 'prop'}]);
        result = mappingManagerSvc.findSourceOntologyWithProp('prop', sourceOntologies);
        expect(result).toEqual(ontology);

        ontologyManagerSvc.getObjectProperties.and.returnValue([]);
        result = mappingManagerSvc.findSourceOntologyWithProp('prop', sourceOntologies);
        expect(result).toBeUndefined();
    });
    it('should test whether a mapping and its source ontologies are compatible', function() {
        var mapping = {jsonld: []};
        var sourceOntologies = [{}];
        spyOn(mappingManagerSvc, 'getAllClassMappings').and.returnValue([{}]);
        spyOn(mappingManagerSvc, 'getClassIdByMapping').and.returnValue('');
        spyOn(mappingManagerSvc, 'findSourceOntologyWithClass').and.returnValue(undefined);
        var result = mappingManagerSvc.areCompatible(mapping, sourceOntologies);
        expect(result).toBe(false);

        mappingManagerSvc.findSourceOntologyWithClass.and.returnValue({});
        spyOn(mappingManagerSvc, 'getPropMappingsByClass').and.returnValue([{}]);
        spyOn(mappingManagerSvc, 'getPropIdByMapping').and.returnValue('');
        spyOn(mappingManagerSvc, 'findSourceOntologyWithProp').and.returnValue(undefined);
        result = mappingManagerSvc.areCompatible(mapping, sourceOntologies);
        expect(result).toBe(false);

        mappingManagerSvc.findSourceOntologyWithProp.and.returnValue({});
        ontologyManagerSvc.isObjectProperty.and.returnValue(true);
        spyOn(mappingManagerSvc, 'isDataMapping').and.returnValue(true);
        result = mappingManagerSvc.areCompatible(mapping, sourceOntologies);
        expect(result).toBe(false);

        ontologyManagerSvc.isObjectProperty.and.returnValue(false);
        ontologyManagerSvc.isDataTypeProperty.and.returnValue(true);
        spyOn(mappingManagerSvc, 'isObjectMapping').and.returnValue(true);
        result = mappingManagerSvc.areCompatible(mapping, sourceOntologies);
        expect(result).toBe(false);

        ontologyManagerSvc.isDataTypeProperty.and.returnValue(false);
        result = mappingManagerSvc.areCompatible(mapping, sourceOntologies);
        expect(result).toBe(true);
    });
    describe('should get a data mapping from a class mapping', function() {
        it('unless it does not exist', function() {
            var classMapping = {'@id': 'classId'};
            var result = mappingManagerSvc.getDataMappingFromClass([classMapping], 'classId', 'propId');
            expect(result).toBe(undefined);
        });
        it('if it exists', function() {
            var dataMapping = {'@id': 'dataMapping', '@type': ['DataMapping'], 'hasProperty': [{'@id': 'propId'}]};
            var classMapping = {'@id': 'classId', 'dataProperty': [{'@id': dataMapping['@id']}]};
            var result = mappingManagerSvc.getDataMappingFromClass([classMapping, dataMapping], 'classId', 'propId');
            expect(result).toEqual(dataMapping);
        });
    });
    it('should get all class mappings in a mapping', function() {
        var result = mappingManagerSvc.getAllClassMappings([{'@type': ['ClassMapping']}]);
        expect(result.length).toBe(1);
    });
    it('should get all object mappings in a mapping', function() {
        var result = mappingManagerSvc.getAllObjectMappings([{'@type': ['ObjectMapping']}]);
        expect(result.length).toBe(1);
    });
    it('should get all data mappings in a mapping', function() {
        var result = mappingManagerSvc.getAllDataMappings([{'@type': ['DataMapping']}]);
        expect(result.length).toBe(1);
    });
    it('should get all the property mappings for a class mapping in a mapping', function() {
        var dataMapping = {'@id': 'data'};
        var objectMapping = {'@id': 'object'};
        var classMapping = {'@id': 'classId', 'dataProperty': [dataMapping], 'objectProperty': [objectMapping]};
        var result = mappingManagerSvc.getPropMappingsByClass([classMapping, dataMapping, objectMapping], classMapping['@id']);
        expect(result.length).toBe(2);
    });
    it('should test whether a mapping entity is a class mapping', function() {
        var result = mappingManagerSvc.isClassMapping({});
        expect(result).toBe(false);
        result = mappingManagerSvc.isClassMapping({'@type': ['ClassMapping']});
        expect(result).toBe(true);
    });
    it('should test whether a mapping entity is an object mapping', function() {
        var result = mappingManagerSvc.isObjectMapping({});
        expect(result).toBe(false);
        result = mappingManagerSvc.isObjectMapping({'@type': ['ObjectMapping']});
        expect(result).toBe(true);
    });
    it('should test whether a mapping entity is a data mapping', function() {
        var result = mappingManagerSvc.isDataMapping({});
        expect(result).toBe(false);
        result = mappingManagerSvc.isDataMapping({'@type': ['DataMapping']});
        expect(result).toBe(true);
    });
    it('should find the parent class mapping for a data mapping', function() {
        var classMapping = {'@id': 'classId', '@type': ['ClassMapping'], 'dataProperty': [{'@id': 'propId'}]};
        var result = mappingManagerSvc.findClassWithDataMapping([classMapping], 'propId');
        expect(result).toEqual(classMapping);
    });
    it('should find the parent class mapping for an object mapping', function() {
        var classMapping = {'@id': 'classId', '@type': ['ClassMapping'], 'objectProperty': [{'@id': 'propId'}]};
        var result = mappingManagerSvc.findClassWithObjectMapping([classMapping], 'propId');
        expect(result).toEqual(classMapping);
    });
    it('should find all object property mappings that link to a specified class mapping', function() {
        var classMappingId = 'class';
        var prop = {};
        prop[prefixes.delim + 'classMapping'] = [{'@id': classMappingId}];
        spyOn(mappingManagerSvc, 'getAllObjectMappings').and.returnValue([prop]);
        var result = mappingManagerSvc.getPropsLinkingToClass([], classMappingId);
        expect(result).toContain(prop);
    });
    it('should return the title of a property mapping', function() {
        var result = mappingManagerSvc.getPropMappingTitle('class', 'prop');
        expect(typeof result).toBe('string');
    });
    it('should get the base class mapping of a mapping', function() {
        var classMapping1 = {'@id': 'class1'};
        var classMapping2 = {'@id': 'class2'};
        var objectMapping = {};
        objectMapping[prefixes.delim + 'classMapping'] = [classMapping2];
        spyOn(mappingManagerSvc, 'getAllClassMappings').and.returnValue([classMapping1, classMapping2]);
        spyOn(mappingManagerSvc, 'getAllObjectMappings').and.returnValue([objectMapping]);
        var result = mappingManagerSvc.getBaseClass([]);
        expect(result).toEqual(classMapping1);
    });
});
