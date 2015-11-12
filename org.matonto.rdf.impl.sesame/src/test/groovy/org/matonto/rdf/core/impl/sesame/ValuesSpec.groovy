package org.matonto.rdf.core.impl.sesame

import org.matonto.rdf.api.BNode
import org.matonto.rdf.api.IRI
import org.matonto.rdf.api.Literal
import org.openrdf.model.ValueFactory
import spock.lang.Specification

class ValuesSpec extends Specification {

    private static final ValueFactory SESAME_VF = org.openrdf.model.impl.SimpleValueFactory.getInstance();

    def "sesameResource(IRI) returns a Sesame IRI"() {
        setup:
        def resource = new SimpleIRI("http://test.com")
        def sesameResource = Values.sesameResource(resource)

        expect:
        sesameResource instanceof org.openrdf.model.IRI
    }

    def "sesameResource(BNode) returns a Sesame BNode"() {
        setup:
        def resource = new SimpleBNode("http://test.com")
        def sesameResource = Values.sesameResource(resource)

        expect:
        sesameResource instanceof org.openrdf.model.BNode
    }

    def "sesameResource(null) returns null"() {
        setup:
        def sesameResource = Values.sesameResource(null)

        expect:
        sesameResource == null
    }

    def "matontoResource(IRI) returns a MatOnto IRI"() {
        setup:
        def resource = SESAME_VF.createIRI("http://test.com")
        def matontoResource = Values.matontoResource(resource)

        expect:
        matontoResource instanceof IRI
    }

    def "matontoResource(BNode) returns a MatOnto BNode"() {
        setup:
        def resource = SESAME_VF.createBNode("http://test.com")
        def matontoResource = Values.matontoResource(resource)

        expect:
        matontoResource instanceof BNode
    }

    def "matontoResource(null) returns null"() {
        setup:
        def matontoResource = Values.matontoResource(null)

        expect:
        matontoResource == null
    }

    def "sesameIRI(IRI) returns a Sesame IRI"() {
        setup:
        def iri = new SimpleIRI("http://test.com")
        def sesameIRI = Values.sesameIRI(iri)

        expect:
        sesameIRI instanceof org.openrdf.model.IRI
    }

    def "sesameIRI(null) returns null"() {
        setup:
        def sesameIRI = Values.sesameIRI(null)

        expect:
        sesameIRI == null
    }

    def "matontoIRI(IRI) returns a MatOnto IRI"() {
        setup:
        def iri = SESAME_VF.createIRI("http://test.com")
        def matontoIRI = Values.matontoIRI(iri)

        expect:
        matontoIRI instanceof IRI
    }

    def "matontoIRI(null) returns null"() {
        setup:
        def matontoIRI = Values.matontoIRI(null)

        expect:
        matontoIRI == null
    }

    def "sesameValue(IRI) returns a Sesame IRI"() {
        setup:
        def value = new SimpleIRI("http://test.com")
        def sesameValue = Values.sesameValue(value)

        expect:
        sesameValue instanceof org.openrdf.model.IRI
    }

    def "sesameValue(BNode) returns a Sesame BNode"() {
        setup:
        def value = new SimpleBNode("http://test.com")
        def sesameValue = Values.sesameValue(value)

        expect:
        sesameValue instanceof org.openrdf.model.BNode
    }

    def "sesameValue(Literal) returns a Sesame Literal"() {
        setup:
        def value = new SimpleLiteral("MatOnto")
        def sesameValue = Values.sesameValue(value)

        expect:
        sesameValue instanceof org.openrdf.model.Literal
    }

    def "sesameValue(null) returns a Sesame Literal"() {
        setup:
        def sesameValue = Values.sesameValue(null)

        expect:
        sesameValue == null
    }

    def "matontoValue(IRI) returns a MatOnto IRI"() {
        setup:
        def value = SESAME_VF.createIRI("http://test.com")
        def matontoValue = Values.matontoValue(value)

        expect:
        matontoValue instanceof IRI
    }

    def "matontoValue(BNode) returns a MatOnto BNode"() {
        setup:
        def value = SESAME_VF.createBNode("http://test.com")
        def matontoValue = Values.matontoValue(value)

        expect:
        matontoValue instanceof BNode
    }

    def "matontoValue(Literal) returns a MatOnto Literal"() {
        setup:
        def value = SESAME_VF.createLiteral("MatOnto")
        def matontoValue = Values.matontoValue(value)

        expect:
        matontoValue instanceof Literal
    }

    def "matontoValue(null) returns a MatOnto Literal"() {
        setup:
        def matontoValue = Values.matontoValue(null)

        expect:
        matontoValue == null
    }

    def "sesameResources(c) returns a Sesame Resource[]"() {
        setup:
        def resource = new SimpleIRI("http://test.com")
        def sesameResources = Values.sesameResources(resource)

        expect:
        sesameResources.length == 1
        sesameResources[0] instanceof org.openrdf.model.IRI
    }

    def "sesameResources(c1, c2) returns a Sesame Resource[]"() {
        setup:
        def resource1 = new SimpleIRI("http://test.com")
        def resource2 = new SimpleIRI("http://test.com")
        def sesameResources = Values.sesameResources(resource1, resource2)

        expect:
        sesameResources.length == 2
        sesameResources[0] instanceof org.openrdf.model.IRI
        sesameResources[1] instanceof org.openrdf.model.IRI
    }

    def "sesameResources() returns empty Resource[]"() {
        setup:
        def sesameResources = Values.sesameResources()

        expect:
        sesameResources.length == 0
    }


    def "sesameResources(null) returns null"() {
        setup:
        def sesameResources = Values.sesameResources(null)

        expect:
        sesameResources == null
    }
}
