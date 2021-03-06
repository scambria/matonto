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
        .module('mapper', [
            /* Custom Directives */
            'classMappingDetails',
            'classMappingSelect',
            'classPreview',
            'columnSelect',
            'createMappingOverlay',
            'downloadMappingOverlay',
            'editMappingForm',
            'editMappingPage',
            'fileUploadPage',
            'fileUploadForm',
            'invalidOntologyOverlay',
            'iriTemplateOverlay',
            'mapperSerializationSelect',
            'mapperTabset',
            'mappingConfigOverlay',
            'mappingList',
            'mappingNameInput',
            'mappingNameOverlay',
            'mappingOverlays',
            'mappingPreview',
            'mappingSelectPage',
            'mappingTitle',
            'ontologyPreview',
            'previewDataGrid',
            'propMappingOverlay',
            'propSelect',
            'rdfPreviewForm',
            'runMappingOverlay'
        ]);
})();
