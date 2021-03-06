package org.matonto.itests.orm;

/*-
 * #%L
 * itests-orm
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

import com.xmlns.foaf._0._1.Agent;
import com.xmlns.foaf._0._1.AgentFactory;
import com.xmlns.foaf._0._1.OnlineChatAccount;
import com.xmlns.foaf._0._1.OnlineChatAccountFactory;
import org.apache.commons.io.FileUtils;
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
import org.matonto.rdf.orm.generate.GraphReadingUtility;
import org.matonto.rdf.orm.generate.SourceGenerator;
import org.matonto.rdf.orm.impl.ThingFactory;

import java.io.File;
import java.util.ArrayList;
import java.util.Set;

import static org.junit.Assert.*;

public class SourceGeneratorTest {

    private static ValueFactory valueFactory;

    private static ValueConverterRegistry valueConverterRegistry;

    private static ModelFactory modelFactory;

    private Model model;

    @BeforeClass
    public static void beforeTest() {
        valueFactory = new ValueFactoryService();
        modelFactory = new LinkedHashModelFactoryService();
        valueConverterRegistry = new DefaultValueConverterRegistry();
        valueConverterRegistry.registerValueConverter(new DoubleValueConverter());
        valueConverterRegistry.registerValueConverter(new IntegerValueConverter());
        valueConverterRegistry.registerValueConverter(new FloatValueConverter());
        valueConverterRegistry.registerValueConverter(new ShortValueConverter());
        valueConverterRegistry.registerValueConverter(new StringValueConverter());
        valueConverterRegistry.registerValueConverter(new ValueValueConverter());
        valueConverterRegistry.registerValueConverter(new LiteralValueConverter());
        valueConverterRegistry.registerValueConverter(new ThingFactory());
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
                valueFactory.createIRI("http://xmlns.com/foaf/0.1/age"), valueFactory.createLiteral(100),
                valueFactory.createIRI("urn://matonto.org/orm/test/testAgent"));
        model.add(valueFactory.createIRI("urn://matonto.org/orm/test/testAgent"),
                valueFactory.createIRI("http://xmlns.com/foaf/0.1/mbox"),
                valueFactory.createIRI("urn://matonto.org/orm/test/account"),
                valueFactory.createIRI("urn://matonto.org/orm/test/testAgent"));

        model.add(valueFactory.createIRI("urn://matonto.org/orm/test/account"),
                valueFactory.createIRI("http://www.w3.org/1999/02/22-rdf-syntax-ns#type"),
                valueFactory.createIRI("http://xmlns.com/foaf/0.1/OnlineAccount"),
                valueFactory.createIRI("urn://matonto.org/orm/test/account"));
        model.add(valueFactory.createIRI("urn://matonto.org/orm/test/account"),
                valueFactory.createIRI("http://xmlns.com/foaf/0.1/accountName"),
                valueFactory.createLiteral("tester@gmail.com"),
                valueFactory.createIRI("urn://matonto.org/orm/test/account"));
    }

    @Test
    public void testAgent() {
        final AgentFactory factory = new AgentFactory();
        final Agent a = factory.getExisting(valueFactory.createIRI("urn://matonto.org/orm/test/testAgent"), model,
                valueFactory, valueConverterRegistry);
        assertEquals(valueFactory.createLiteral(100), a.getAge().get());
        assertEquals(valueFactory.createLiteral("male"), a.getGender().get());
        final Set<Thing> mboxes = a.getMbox();
        assertNotNull(mboxes);
        assertFalse(mboxes.isEmpty());
        final Thing mbox = mboxes.iterator().next();

        Value mboxValue = mbox.getProperty(valueFactory.createIRI("http://xmlns.com/foaf/0.1/accountName"),
                valueFactory.createIRI("urn://matonto.org/orm/test/account")).get();
        assertEquals(valueFactory.createLiteral("tester@gmail.com"), mboxValue);

        assertEquals(valueFactory.createIRI("urn://matonto.org/orm/test/account"), mbox.getResource());
    }

    @Test
    public void testMultiType(){
        final OnlineChatAccountFactory factory = new OnlineChatAccountFactory();
        factory.setValueFactory(valueFactory);
        OnlineChatAccount account = factory.createNew(valueFactory.createIRI("urn://matonto.org/orm/test/testOCA"),model,valueFactory,valueConverterRegistry);
        account.getModel().filter(account.getResource(),null,null).forEach(stmt -> System.out.println(stmt));
    }
}