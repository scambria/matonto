package org.matonto.rdf.orm.impl;

/*-
 * #%L
 * RDF ORM
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

import junit.framework.TestCase;
import org.junit.Before;
import org.junit.BeforeClass;
import org.junit.Test;
import org.matonto.rdf.api.Model;
import org.matonto.rdf.api.ModelFactory;
import org.matonto.rdf.api.Value;
import org.matonto.rdf.api.ValueFactory;
import org.matonto.rdf.core.impl.sesame.LinkedHashModelFactoryService;
import org.matonto.rdf.core.impl.sesame.ValueFactoryService;
import org.matonto.rdf.orm.Thing;
import org.matonto.rdf.orm.conversion.ValueConverterRegistry;
import org.matonto.rdf.orm.conversion.impl.*;

public class TestCoreThingApi {

    private static final ThingFactory thingFactory = new ThingFactory();

    private static final ModelFactory modelFactory = new LinkedHashModelFactoryService();

    private static final ValueFactory valueFactory = new ValueFactoryService();
    private Model model;

    @BeforeClass
    public static void beforeClass() {
        final ValueConverterRegistry valueConverterRegistry = new DefaultValueConverterRegistry();
        valueConverterRegistry.registerValueConverter(new DoubleValueConverter());
        valueConverterRegistry.registerValueConverter(new IntegerValueConverter());
        valueConverterRegistry.registerValueConverter(new FloatValueConverter());
        valueConverterRegistry.registerValueConverter(new ShortValueConverter());
        valueConverterRegistry.registerValueConverter(new StringValueConverter());
        valueConverterRegistry.registerValueConverter(new ValueValueConverter());

        thingFactory.setModelFactory(modelFactory);
        thingFactory.setValueFactory(new ValueFactoryService());
        thingFactory.setValueConverterRegistry(valueConverterRegistry);
    }

    @Before
    public void before() {
        model = modelFactory.createModel();
        model.add(valueFactory.createIRI("urn://matonto.org/orm/test/testAgent"),
                valueFactory.createIRI("http://www.w3.org/1999/02/22-rdf-syntax-ns#type"),
                valueFactory.createIRI("http://xmlns.com/foaf/0.1/Agent"),
                valueFactory.createIRI("urn://matonto.org/orm/test/testAgent"));
        model.add(valueFactory.createIRI("urn://matonto.org/orm/test/testAgent"),
                valueFactory.createIRI("http://xmlns.com/foaf/0.1/gender"), valueFactory.createLiteral("male"),
                valueFactory.createIRI("urn://matonto.org/orm/test/testAgent"));
        model.add(valueFactory.createIRI("urn://matonto.org/orm/test/testAgent"),
                valueFactory.createIRI("http://xmlns.com/foaf/0.1/age"), valueFactory.createLiteral("100"),
                valueFactory.createIRI("urn://matonto.org/orm/test/testAgent"));
        model.add(valueFactory.createIRI("urn://matonto.org/orm/test/testAgent"),
                valueFactory.createIRI("http://xmlns.com/foaf/0.1/mbox"),
                valueFactory.createIRI("urn://matonto.org/orm/test/account"),
                valueFactory.createIRI("urn://matonto.org/orm/test/testAgent"));

    }

    @Test
    public void testBasic() {
        final Thing t = thingFactory.getExisting(valueFactory.createIRI("urn://matonto.org/orm/test/testAgent"), model,
                valueFactory);

        Value typeValue = t.getProperty(valueFactory.createIRI("http://www.w3.org/1999/02/22-rdf-syntax-ns#type")).get();
        TestCase.assertEquals(valueFactory.createIRI("http://xmlns.com/foaf/0.1/Agent"), typeValue);

        int ageValue = Integer.parseInt(t.getProperty(valueFactory.createIRI("http://xmlns.com/foaf/0.1/age")).get().stringValue());
        TestCase.assertEquals(100, ageValue);

        t.addProperty(valueFactory.createLiteral("Ben"), valueFactory.createIRI("urn://matonto.org/silly#myNameIs"),
                valueFactory.createIRI("urn://matonto.org/orm/test/testAgent"));
        String nameValue = t.getProperty(valueFactory.createIRI("urn://matonto.org/silly#myNameIs"),
                valueFactory.createIRI("urn://matonto.org/orm/test/testAgent")).get().stringValue();
        TestCase.assertEquals("Ben", nameValue);

        t.setProperty(valueFactory.createLiteral("John"), valueFactory.createIRI("urn://matonto.org/silly#myNameIs"),
                valueFactory.createIRI("urn://matonto.org/orm/test/testAgent"));
        TestCase.assertEquals(1, t.getModel().filter(t.getResource(),
                valueFactory.createIRI("urn://matonto.org/silly#myNameIs"), null, t.getResource()).size());
        TestCase.assertEquals("John",
                t.getModel().filter(t.getResource(), valueFactory.createIRI("urn://matonto.org/silly#myNameIs"), null,
                        t.getResource()).iterator().next().getObject().stringValue());
    }

}
