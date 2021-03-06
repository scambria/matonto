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
import org.matonto.ontology.core.api.classexpression.ClassExpression;
import org.matonto.ontology.core.api.axiom.ObjectPropertyDomainAxiom;
import org.matonto.ontology.core.api.propertyexpression.ObjectPropertyExpression;
import org.matonto.ontology.core.api.types.AxiomType;


public class SimpleObjectPropertyDomainAxiom 
	extends SimpleAxiom 
	implements ObjectPropertyDomainAxiom {

	
	private ObjectPropertyExpression objectProperty;
	private ClassExpression domain;
	
	
	public SimpleObjectPropertyDomainAxiom(@Nonnull ObjectPropertyExpression objectProperty, @Nonnull ClassExpression domain, Set<Annotation> annotations) 
	{
		super(annotations);
		this.objectProperty = objectProperty;
		this.domain = domain;
	}

	
	@Override
	public ObjectPropertyDomainAxiom getAxiomWithoutAnnotations() 
	{
		if(!isAnnotated())
			return this;
		
		return new SimpleObjectPropertyDomainAxiom(objectProperty, domain, NO_ANNOTATIONS);	
	}

	
	@Override
	public ObjectPropertyDomainAxiom getAnnotatedAxiom(@Nonnull Set<Annotation> annotations) 
	{
		return new SimpleObjectPropertyDomainAxiom(objectProperty, domain, mergeAnnos(annotations));
	}


	@Override
	public AxiomType getAxiomType()
	{
		return AxiomType.OBJECT_PROPERTY_DOMAIN;
	}

	
	@Override
	public ObjectPropertyExpression getObjectProperty() 
	{
		return objectProperty;
	}

	
	@Override
	public ClassExpression getDomain() 
	{
		return domain;
	}
	
	
	@Override
	public boolean equals(Object obj)
	{
		if (this == obj) 
		    return true;
		
		if (!super.equals(obj)) 
			return false;
		
		if (obj instanceof ObjectPropertyDomainAxiom) {
			ObjectPropertyDomainAxiom other = (ObjectPropertyDomainAxiom)obj;			 
			return ((objectProperty.equals(other.getObjectProperty())) && (domain.equals(other.getDomain())));
		}
		
		return false;
	}

}
