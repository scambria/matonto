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
describe('Serialization Select directive', function() {
    var $compile,
        scope,
        element;

    beforeEach(function() {
        module('templates');
        module('serializationSelect');

        inject(function(_$compile_, _$rootScope_) {
            $compile = _$compile_;
            scope = _$rootScope_;
        });
    });

    beforeEach(function() {
        scope.bindModel = '';

        element = $compile(angular.element('<serialization-select ng-model="bindModel"></serialization-select>'))(scope);
        scope.$digest();
    });

    describe('in isolated scope', function() {
        it('bindModel should be two way bound', function() {
            var isolatedScope = element.isolateScope();
            isolatedScope.bindModel = 'turtle';
            scope.$digest();
            expect(scope.bindModel).toEqual('turtle');
        });
    });
    describe('replaces the element with the correct html', function() {
        it('for a DIV', function() {
            expect(element.prop('tagName')).toBe('DIV');
        });
        it('based on select', function() {
            var selects = element.find('select');
            expect(selects.length).toBe(1);
        });
        it('based on options', function() {
            var options = element.find('option');
            expect(options.length).toBe(5);
        });
    });
});