package org.matonto.rdf.core.impl.sesame;

/*-
 * #%L
 * org.matonto.rdf.impl.sesame
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

import org.matonto.rdf.api.IRI;
import org.matonto.rdf.api.Resource;
import org.matonto.rdf.api.Statement;
import org.matonto.rdf.api.Value;
import org.matonto.rdf.core.utils.Values;

import java.util.Objects;
import java.util.Optional;

public class SimpleStatement implements Statement {

    private static final org.openrdf.model.ValueFactory SESAME_VF = org.openrdf.model.impl.SimpleValueFactory.getInstance();
    private static final long serialVersionUID = -6157353529575653321L;

    private org.openrdf.model.Statement sesameStmt;

    public SimpleStatement(Resource subject, IRI predicate, Value object) {
        constructSesameStmt(subject, predicate, object, null);
    }

    public SimpleStatement(Resource subject, IRI predicate, Value object, Resource context) {
        constructSesameStmt(subject, predicate, object, context);
    }

    private void constructSesameStmt(Resource subject, IRI predicate, Value object, Resource context) {
        if (context == null) {
            this.sesameStmt = SESAME_VF.createStatement(Values.sesameResource(subject), Values.sesameIRI(predicate),
                    Values.sesameValue(object));
        } else {
            this.sesameStmt = SESAME_VF.createStatement(Values.sesameResource(subject), Values.sesameIRI(predicate),
                    Values.sesameValue(object), Values.sesameResource(context));
        }
    }

    @Override
    public Optional<Resource> getContext() {
        org.openrdf.model.Resource context = sesameStmt.getContext();

        if (context == null) {
            return Optional.empty();
        } else {
            return Optional.of(Values.matontoResource(context));
        }
    }

    @Override
    public Value getObject() {
        return Values.matontoValue(sesameStmt.getObject());
    }

    @Override
    public IRI getPredicate() {
        return Values.matontoIRI(sesameStmt.getPredicate());
    }

    @Override
    public Resource getSubject() {
        return Values.matontoResource(sesameStmt.getSubject());
    }

    @Override
    public boolean equals(Object o) {
        if (this == o) {
            return true;
        }

        if (o instanceof Statement) {
            Statement that = (Statement) o;

			/* We check  object equality first since it's most likely to be different.
			 *
			 * In general the number of different predicates and contexts in sets of
			 * statements are the smallest (and therefore most likely to be identical), so
			 * these are checked last.
			 */
            return this.getObject().equals(that.getObject()) &&
                    this.getSubject().equals(that.getSubject()) &&
                    this.getPredicate().equals(that.getPredicate()) &&
                    Objects.equals(getContext(), that.getContext());
        }

        return false;
    }

    @Override
    public int hashCode() {
        return sesameStmt.hashCode();
    }

    public String toString() {
        if (getContext().isPresent()) {
            return "(" + getSubject() + ", " + getPredicate() + ", " + getObject() + ", " + getContext().get() + ")";
        } else {
            return "(" + getSubject() + ", " + getPredicate() + ", " + getObject() + ")";
        }
    }
}
