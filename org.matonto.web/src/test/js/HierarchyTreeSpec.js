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


describe('Hierarchy Tree directive', function() {
    var $compile,
        scope,
        element,
        isolatedScope,
        ontologyStateSvc;

    beforeEach(function() {
        module('templates');
        module('hierarchyTree');
        mockOntologyState();
        mockOntologyManager();

        inject(function(_$compile_, _$rootScope_, _ontologyStateService_) {
            $compile = _$compile_;
            scope = _$rootScope_;
            ontologyStateSvc = _ontologyStateService_;
        });

        ontologyStateSvc.getOpened.and.returnValue(true);
        scope.hierarchy = [{
            entityIRI: 'class1',
            subEntities: [{
                entityIRI: 'class2'
            }]
        },
        {
            entityIRI: 'class3'
        }];
        element = $compile(angular.element('<hierarchy-tree hierarchy="hierarchy"></hierarchy-tree>'))(scope);
        scope.$digest();
    });

    describe('in isolated scope', function() {
        beforeEach(function() {
            isolatedScope = element.isolateScope();
        });
        it('hierarchy should be one way bound', function() {
            isolatedScope.hierarchy = [];
            scope.$digest();
            expect(scope.hierarchy).toEqual([{
                entityIRI: 'class1',
                subEntities: [{
                    entityIRI: 'class2'
                }]
            },
            {
                entityIRI: 'class3'
            }]);
        });
    });

    describe('replaces the element with the correct html', function() {
        it('for a DIV', function() {
            expect(element.prop('tagName')).toBe('DIV');
        });
        it('based on tree class', function() {
            expect(element.hasClass('tree')).toBe(true);
        });
        it('based on container class', function() {
            var container = element.querySelectorAll('.container');
            expect(container.length).toBe(1);
        });
        it('based on ul', function() {
            var uls = element.find('ul');
            expect(uls.length).toBe(3);
        });
        it('based on container tree-items', function() {
            var lis = element.querySelectorAll('.container tree-item');
            expect(lis.length).toBe(1);
        });
    });
});
