package org.matonto.ontology.core.impl.owlapi.axiom;

/*-
 * #%L
 * org.matonto.ontology.core.impl.owlapi
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

import java.util.Set;
import javax.annotation.Nonnull;
import org.matonto.ontology.core.api.Annotation;
import org.matonto.ontology.core.api.Individual;
import org.matonto.ontology.core.api.axiom.ObjectPropertyAssertionAxiom;
import org.matonto.ontology.core.api.propertyexpression.ObjectPropertyExpression;
import org.matonto.ontology.core.api.types.AxiomType;


public class SimpleObjectPropertyAssertionAxiom 
	extends SimpleAxiom 
	implements ObjectPropertyAssertionAxiom {

	
	private Individual subject;
	private ObjectPropertyExpression property;
	private Individual object;
	
	
	public SimpleObjectPropertyAssertionAxiom(@Nonnull Individual subject, @Nonnull ObjectPropertyExpression property, @Nonnull Individual object, Set<Annotation> annotations) 
	{
		super(annotations);
		this.subject = subject;
		this.property = property;
		this.object = object;
	}

	
	@Override
	public ObjectPropertyAssertionAxiom getAxiomWithoutAnnotations() 
	{
		if(!isAnnotated())
			return this;
		
		return new SimpleObjectPropertyAssertionAxiom(subject, property, object, NO_ANNOTATIONS);	
	}

	
	@Override
	public ObjectPropertyAssertionAxiom getAnnotatedAxiom(@Nonnull Set<Annotation> annotations) 
	{
		return new SimpleObjectPropertyAssertionAxiom(subject, property, object, mergeAnnos(annotations));
	}

	
	@Override
	public AxiomType getAxiomType()
	{
		return AxiomType.OBJECT_PROPERTY_ASSERTION;
	}
	

	@Override
	public Individual getSubject() 
	{
		return subject;
	}

	
	@Override
	public ObjectPropertyExpression getProperty() 
	{
		return property;
	}

	
	@Override
	public Individual getObject() 
	{
		return object;
	}
	
	
	@Override
	public boolean containsAnonymousIndividuals()
	{
		return (subject.isAnonymous() || object.isAnonymous());
	}
	
	
	@Override
	public boolean equals(Object obj)
	{
		if (this == obj) 
		    return true;
		
		if (!super.equals(obj)) 
			return false;
		
		if (obj instanceof ObjectPropertyAssertionAxiom) {
			ObjectPropertyAssertionAxiom other = (ObjectPropertyAssertionAxiom)obj;			 
			return ((subject.equals(other.getSubject())) && (property.equals(other.getProperty())) && (object.equals(other.getObject())));
		}
		
		return false;
	}

}
