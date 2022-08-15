package edu.stanford.hivdb.asijs;

import java.util.Collection;
import java.util.List;
import java.util.Map;

import org.fstrf.stanfordAsiInterpreter.resistance.ASIEvaluationException;
import org.fstrf.stanfordAsiInterpreter.resistance.ASIParsingException;
import org.fstrf.stanfordAsiInterpreter.resistance.definition.Gene;
import org.fstrf.stanfordAsiInterpreter.resistance.definition.LevelDefinition;
import org.fstrf.stanfordAsiInterpreter.resistance.evaluate.EvaluatedDrug;
import org.fstrf.stanfordAsiInterpreter.resistance.evaluate.EvaluatedDrugClass;
import org.fstrf.stanfordAsiInterpreter.resistance.evaluate.EvaluatedGene;
import org.fstrf.stanfordAsiInterpreter.resistance.grammar.MutationComparator;
import org.fstrf.stanfordAsiInterpreter.resistance.grammar.StringMutationComparator;
import org.fstrf.stanfordAsiInterpreter.resistance.xml.XmlAsiTransformer;

import com.google.common.base.Strings;

import elemental2.core.JsArray;
import jsinterop.annotations.JsPackage;
import jsinterop.annotations.JsProperty;
import jsinterop.annotations.JsType;

@JsType(name = "default", namespace = JsPackage.GLOBAL)
public class ASIJs {

    private final String xmlString;
    private final Map<String, Gene> genes;

    @JsProperty
    private final Map<String, Map<String, ?>> algorithmInfo;

    public ASIJs(String xmlString) throws ASIParsingException {
        this.xmlString = xmlString;
        XmlAsiTransformer transformer = new XmlAsiTransformer();
        genes = transformer.transform(xmlString);
        algorithmInfo = transformer.getAlgorithmInfo(xmlString);

    }

    public String getXMLString() {
        return xmlString;
    }
    public Map<String, Gene> getTransformResults() {
        return genes;
    }

    public Object getAlgorithmInfo() {
        return JsObjectify.toJavascript(algorithmInfo);
        // return JsObject.create(getAlgorithmInfo());
    }

    public String evaluateGene(String geneName, JsArray<String> mutations) throws ASIEvaluationException {
        List<String> mutList = mutations.asList();
        Gene gene = genes.get(geneName);

        MutationComparator<String> mutationComparator = new StringMutationComparator(false);
        if (!mutationComparator.areMutationsValid(mutList)) {
            throw new RuntimeException(
                Strings.lenientFormat("Invalid list of mutations: %s",
                    mutations.toString()));
        }
        EvaluatedGene evalGene = gene.evaluate(mutList, mutationComparator);
        return evalGene.toString();
        // Collection<EvaluatedDrugClass> evalDCs = evalGene.getEvaluatedDrugClasses();
        // for (EvaluatedDrugClass evalDC : evalDCs) {
        //     Collection<EvaluatedDrug> evalDrugs = evalDC.getEvaluatedDrugs();
        //     for (EvaluatedDrug evalDrug : evalDrugs) {
        //         LevelDefinition level = evalDrug.getHighestLevelDefinition();
        //         level.getOrder()
        //     }
        // }
    }

}