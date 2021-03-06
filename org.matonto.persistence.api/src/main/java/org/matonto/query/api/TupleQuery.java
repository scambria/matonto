package org.matonto.query.api;

/*-
 * #%L
 * org.matonto.persistence.api
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

import org.matonto.query.TupleQueryResult;
import org.matonto.query.exception.QueryEvaluationException;

public interface TupleQuery extends Operation {

    /**
     * Evaluates the SPARQL tuple query and returns the result.
     * @return a TupleQueryResult with the results of the query
     * @throws QueryEvaluationException if there is an error processing the query
     */
    TupleQueryResult evaluate() throws QueryEvaluationException;

}
