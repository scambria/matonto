package org.matonto.catalog.impl;

/*-
 * #%L
 * org.matonto.catalog.impl
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

import aQute.bnd.annotation.component.*;
import aQute.bnd.annotation.metatype.Configurable;
import org.apache.commons.io.IOUtils;
import org.apache.commons.lang3.StringUtils;
import org.apache.log4j.Logger;
import org.matonto.catalog.api.*;
import org.matonto.catalog.config.CatalogConfig;
import org.matonto.catalog.util.SearchResults;
import org.matonto.exception.MatOntoException;
import org.matonto.persistence.utils.Bindings;
import org.matonto.persistence.utils.Models;
import org.matonto.persistence.utils.RepositoryResults;
import org.matonto.query.TupleQueryResult;
import org.matonto.query.api.BindingSet;
import org.matonto.query.api.TupleQuery;
import org.matonto.rdf.api.*;
import org.matonto.repository.api.Repository;
import org.matonto.repository.api.RepositoryConnection;

import java.io.IOException;
import java.time.OffsetDateTime;
import java.util.*;

@Component(
        configurationPolicy = ConfigurationPolicy.require,
        designateFactory = CatalogConfig.class,
        name = "org.matonto.catalog.api.CatalogManager"
)
public class SimpleCatalogManager implements CatalogManager {

    private Repository repository;
    private ValueFactory vf;
    private ModelFactory mf;
    private NamedGraphFactory ngf;

    private Map<Resource, String> sortingOptions = new HashMap<>();

    private final Logger log = Logger.getLogger(SimpleCatalogManager.class);

    @Reference(name = "repository")
    protected void setRepository(Repository repository) {
        this.repository = repository;
    }

    @Reference
    protected void setValueFactory(ValueFactory valueFactory) {
        vf = valueFactory;
    }

    @Reference
    protected void setModelFactory(ModelFactory modelFactory) {
        mf = modelFactory;
    }

    @Reference
    protected void setNamedGraphFactory(NamedGraphFactory namedGraphFactory) {
        ngf = namedGraphFactory;
    }

    private static final String GET_RESOURCE_QUERY;
    private static final String FIND_RESOURCES_QUERY;
    private static final String FIND_RESOURCES_TYPE_FILTER_QUERY;
    private static final String COUNT_RESOURCES_QUERY;
    private static final String COUNT_RESOURCES_TYPE_FILTER_QUERY;
    private static final String RESOURCE_BINDING = "resource";
    private static final String RESOURCE_COUNT_BINDING = "resource_count";
    private static final String TYPE_FILTER_BINDING = "type_filter";

    static {
        try {
            GET_RESOURCE_QUERY = IOUtils.toString(
                    SimpleCatalogManager.class.getResourceAsStream("/get-resource.rq"),
                    "UTF-8"
            );
            FIND_RESOURCES_QUERY = IOUtils.toString(
                    SimpleCatalogManager.class.getResourceAsStream("/find-resources.rq"),
                    "UTF-8"
            );
            FIND_RESOURCES_TYPE_FILTER_QUERY = IOUtils.toString(
                    SimpleCatalogManager.class.getResourceAsStream("/find-resources-type-filter.rq"),
                    "UTF-8"
            );
            COUNT_RESOURCES_QUERY = IOUtils.toString(
                    SimpleCatalogManager.class.getResourceAsStream("/count-resources.rq"),
                    "UTF-8"
            );
            COUNT_RESOURCES_TYPE_FILTER_QUERY = IOUtils.toString(
                    SimpleCatalogManager.class.getResourceAsStream("/count-resources-type-filter.rq"),
                    "UTF-8"
            );
        } catch (IOException e) {
            throw new MatOntoException(e);
        }
    }

    private static final String RDF_TYPE = "http://www.w3.org/1999/02/22-rdf-syntax-ns#type";
    private static final String CATALOG_TYPE = "http://www.w3.org/ns/dcat#Catalog";
    private static final String DC = "http://purl.org/dc/terms/";
    private static final String DCAT = "http://www.w3.org/ns/dcat#";
    private static final String MATONTO_CAT = "http://matonto.org/ontologies/catalog#";

    @Activate
    protected void start(Map<String, Object> props) {
        CatalogConfig config = Configurable.createConfigurable(CatalogConfig.class, props);
        IRI catalogIri = vf.createIRI(config.iri());
        createSortingOptions();

        // Create Catalog if it doesn't exist
        if (!resourceExists(catalogIri)) {
            log.debug("Initializing MatOnto Catalog.");
            OffsetDateTime now = OffsetDateTime.now();

            NamedGraph namedGraph = ngf.createNamedGraph(catalogIri);
            namedGraph.add(catalogIri, vf.createIRI(RDF_TYPE), vf.createIRI(CATALOG_TYPE));
            namedGraph.add(catalogIri, vf.createIRI(DC + "title"), vf.createLiteral(config.title()));
            namedGraph.add(catalogIri, vf.createIRI(DC + "description"), vf.createLiteral(config.description()));
            namedGraph.add(catalogIri, vf.createIRI(DC + "issued"), vf.createLiteral(now));
            namedGraph.add(catalogIri, vf.createIRI(DC + "modified"), vf.createLiteral(now));

            RepositoryConnection conn = repository.getConnection();
            conn.add(namedGraph);
            conn.close();
        }
    }

    @Modified
    protected void modified(Map<String, Object> props) {
        start(props);
    }

    @Override
    public PaginatedSearchResults<PublishedResource> findResource(PaginatedSearchParams searchParams) {
        RepositoryConnection conn = repository.getConnection();
        Optional<Resource> typeParam = searchParams.getTypeFilter();

        // Get Total Count
        TupleQuery countQuery;
        if (typeParam.isPresent()) {
            countQuery = conn.prepareTupleQuery(COUNT_RESOURCES_TYPE_FILTER_QUERY);
            countQuery.setBinding(TYPE_FILTER_BINDING, typeParam.get());
        } else {
            countQuery = conn.prepareTupleQuery(COUNT_RESOURCES_QUERY);
        }

        TupleQueryResult countResults = countQuery.evaluate();

        int totalCount;
        BindingSet countBindingSet;
        if (countResults.hasNext()
                && (countBindingSet = countResults.next()).getBindingNames().contains(RESOURCE_COUNT_BINDING)) {
            totalCount = Bindings.requiredLiteral(countBindingSet, RESOURCE_COUNT_BINDING).intValue();
            countResults.close();
        } else {
            countResults.close();
            conn.close();
            return SearchResults.emptyResults();
        }

        log.debug("Resource count: " + totalCount);

        // Prepare Query
        int limit = searchParams.getLimit();
        int offset = searchParams.getOffset();

        String sortBinding;
        Resource sortByParam = searchParams.getSortBy();
        if (sortingOptions.get(sortByParam) != null) {
            sortBinding = sortingOptions.get(sortByParam);
        } else {
            log.warn("sortBy parameter must be in the allowed list. Sorting by modified date instead.");
            sortBinding = "modified";
        }

        String querySuffix;
        Optional<Boolean> ascendingParam = searchParams.getAscending();
        if (ascendingParam.isPresent() && ascendingParam.get()) {
            querySuffix = String.format("\nORDER BY ?%s\nLIMIT %d\nOFFSET %d", sortBinding,
                    limit, offset);
        } else {
            querySuffix = String.format("\nORDER BY DESC(?%s)\nLIMIT %d\nOFFSET %d",
                    sortBinding, limit, offset);
        }

        String queryString;
        TupleQuery query;
        if (typeParam.isPresent()) {
            queryString = FIND_RESOURCES_TYPE_FILTER_QUERY + querySuffix;
            query = conn.prepareTupleQuery(queryString);
            query.setBinding(TYPE_FILTER_BINDING, typeParam.get());
        } else {
            queryString = FIND_RESOURCES_QUERY + querySuffix;
            query = conn.prepareTupleQuery(queryString);
        }

        log.debug("Query String:\n" + queryString);
        log.debug("Query Plan:\n" + query);

        // Get Results
        TupleQueryResult result = query.evaluate();

        List<PublishedResource> resources = new ArrayList<>();
        BindingSet resultsBindingSet;
        while (result.hasNext() && (resultsBindingSet = result.next()).getBindingNames().contains(RESOURCE_BINDING)) {
            Resource resource = vf.createIRI(Bindings.requiredResource(resultsBindingSet, RESOURCE_BINDING).stringValue());
            PublishedResource publishedResource = processResourceBindingSet(resultsBindingSet, resource, conn);
            resources.add(publishedResource);
        }

        result.close();
        conn.close();

        log.debug("Result set size: " + resources.size());

        int pageNumber = (offset / limit) + 1;

        if (resources.size() > 0) {
            return new SimpleSearchResults<>(resources, totalCount, limit, pageNumber);
        } else {
            return SearchResults.emptyResults();
        }
    }

    @Override
    public Optional<PublishedResource> getResource(Resource resource) {
        RepositoryConnection conn = repository.getConnection();

        TupleQuery query = conn.prepareTupleQuery(GET_RESOURCE_QUERY);
        query.setBinding(RESOURCE_BINDING, resource);

        TupleQueryResult result = query.evaluate();

        // TODO: Handle more than one result (warn?)
        BindingSet bindingSet;
        if (result.hasNext() && (bindingSet = result.next()).getBindingNames().contains(RESOURCE_BINDING)) {
            PublishedResource publishedResource = processResourceBindingSet(bindingSet, resource, conn);

            result.close();
            conn.close();
            return Optional.of(publishedResource);
        } else {
            result.close();
            conn.close();
            return Optional.empty();
        }
    }

    @Override
    public void removeResource(PublishedResource resource) {
    }

    @Override
    public void createOntology(Ontology ontology) {
        Resource resource = ontology.getResource();

        if (resourceExists(resource)) {
            throw new IllegalArgumentException("Published Resource [" + resource.stringValue() + "] already exists.");
        }

        NamedGraph namedGraph = ngf.createNamedGraph(resource);
        namedGraph.add(resource, vf.createIRI(RDF_TYPE), vf.createIRI(MATONTO_CAT + "Ontology"));
        namedGraph.add(resource, vf.createIRI(DC + "title"), vf.createLiteral(ontology.getTitle()));
        namedGraph.add(resource, vf.createIRI(DC + "description"), vf.createLiteral(ontology.getDescription()));
        namedGraph.add(resource, vf.createIRI(DC + "issued"), vf.createLiteral(ontology.getIssued()));
        namedGraph.add(resource, vf.createIRI(DC + "modified"), vf.createLiteral(ontology.getModified()));

        ontology.getDistributions().forEach(distribution ->
                namedGraph.add(resource, vf.createIRI(DCAT + "distribution"), distribution.getResource()));

        RepositoryConnection conn = repository.getConnection();
        conn.add(namedGraph);
        conn.close();
    }

    private boolean resourceExists(Resource resource) {
        RepositoryConnection conn = repository.getConnection();
        boolean catalogExists = conn.getStatements(null, null, null, resource).hasNext();
        conn.close();
        return catalogExists;
    }

    private Optional<Literal> getOptionalLiteral(Model model, String propertyName) {
        return Models.objectLiteral(model.filter(null, vf.createIRI(propertyName), null));
    }

    private Literal getLiteral(Model model, String propertyName) {
        return Models.objectLiteral(model.filter(null, vf.createIRI(propertyName), null))
                .orElseThrow(() -> missingRequiredProperty(propertyName));
    }

    private RuntimeException missingRequiredProperty(String propertyName) {
        return new IllegalStateException(String.format("Required property \"%s\" was not present.", propertyName));
    }

    private PublishedResource processResourceBindingSet(BindingSet bindingSet, Resource resource,
                                                        RepositoryConnection conn) {
        // Get Required Params
        String title = Bindings.requiredLiteral(bindingSet, "title").stringValue();

        SimplePublishedResourceBuilder builder = new SimplePublishedResourceBuilder(resource, title);
        builder.issued(Bindings.requiredLiteral(bindingSet, "issued").dateTimeValue());
        builder.modified(Bindings.requiredLiteral(bindingSet, "modified").dateTimeValue());

        bindingSet.getBinding("description").ifPresent(binding ->
                builder.description(binding.getValue().stringValue()));

        bindingSet.getBinding("identifier").ifPresent(binding ->
                builder.identifier(binding.getValue().stringValue()));

        bindingSet.getBinding("keywords").ifPresent(binding -> {
            String[] keywords = StringUtils.split(binding.getValue().stringValue(), ",");

            for (String keyword : keywords) {
                builder.addKeyword(keyword);
            }
        });

        bindingSet.getBinding("distributions").ifPresent(binding -> {
            String[] distributions = StringUtils.split(binding.getValue().stringValue(), ",");

            for (String distribution : distributions) {
                Resource distIRI = vf.createIRI(distribution);

                Model distModel = RepositoryResults.asModel(conn.getStatements(distIRI, null, null), mf);
                String distTitle = getLiteral(distModel, DC + "title").stringValue();

                SimpleDistribution.Builder distBuilder = new SimpleDistribution.Builder(distIRI, distTitle);

                distBuilder.issued(getLiteral(distModel, DC + "issued").dateTimeValue());
                distBuilder.modified(getLiteral(distModel, DC + "modified").dateTimeValue());

                getOptionalLiteral(distModel, DC + "description").ifPresent(literal ->
                        distBuilder.description(literal.stringValue()));

                builder.addDistribution(distBuilder.build());
            }
        });

        bindingSet.getBinding("types").ifPresent(binding -> {
            String[] types = StringUtils.split(binding.getValue().stringValue(), ",");

            for (String type : types) {
                builder.addType(vf.createIRI(type));
            }
        });

        return builder.build();
    }

    private void createSortingOptions() {
        sortingOptions.put(vf.createIRI(DC + "modified"), "modified");
        sortingOptions.put(vf.createIRI(DC + "issued"), "issued");
        sortingOptions.put(vf.createIRI(DC + "title"), "title");
    }
}
