package org.matonto.persistence.utils;

/*-
 * #%L
 * org.matonto.persistence.utils
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

import org.matonto.rdf.api.Model;
import org.matonto.rdf.api.ModelFactory;
import org.matonto.rdf.api.Statement;
import org.matonto.repository.base.RepositoryResult;

import java.util.ArrayList;
import java.util.List;

public class RepositoryResults {

    /**
     * Returns the Model containing all the Statements from a RepositoryResult.
     *
     * @param results - The RepositoryResult containing Statements for the Model
     * @param factory - The ModelFactory from which to create an empty Model
     * @return the Model containing all the Statements from a RepositoryResult.
     */
    public static Model asModel(RepositoryResult<Statement> results, ModelFactory factory) {
        Model model = factory.createModel();
        results.forEach(model::add);
        return model;
    }

    /**
     * Returns the List containing all the Objects from a RepositoryResult.
     *
     * @param results - The RepositoryResult containing the Objects for the List
     * @param <T> - The type of Objects contained in the RepositoryResult
     * @return the List containing all the Objects from a RepositoryResult.
     */
    public static <T> List<T> asList(RepositoryResult<T> results) {
        List<T> list = new ArrayList<>();
        results.forEach(list::add);
        return list;
    }
}
