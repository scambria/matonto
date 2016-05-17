package org.matonto.sparql.rest.jaxb;

import org.matonto.rest.util.jaxb.PaginatedResults;

import javax.xml.bind.annotation.XmlElement;
import javax.xml.bind.annotation.XmlRootElement;
import java.util.List;

@XmlRootElement
public class SparqlPaginatedResults<T> {

    private PaginatedResults<T> paginatedResults;
    private List<String> bindingNames;

    @XmlElement
    public PaginatedResults<T> getPaginatedResults() {
        return paginatedResults;
    }

    public void setPaginatedResults(PaginatedResults<T> paginatedResults) {
        this.paginatedResults = paginatedResults;
    }

    @XmlElement
    public List<String> getBindingNames() {
        return bindingNames;
    }

    public void setBindingNames(List<String> bindingNames) {
        this.bindingNames = bindingNames;
    }
}