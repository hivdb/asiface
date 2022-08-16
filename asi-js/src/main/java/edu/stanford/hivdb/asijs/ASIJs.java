package edu.stanford.hivdb.asijs;

import java.util.ArrayList;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

import org.fstrf.stanfordAsiInterpreter.resistance.ASIEvaluationException;
import org.fstrf.stanfordAsiInterpreter.resistance.ASIParsingException;
import org.fstrf.stanfordAsiInterpreter.resistance.definition.Gene;
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
        return JsObjectify.of(algorithmInfo);
    }
    
    public Object evaluate(JsArray<String> mutations) throws ASIEvaluationException {
        List<String> mutList = mutations.asList();
        Map<String, List<String>> mutsByGene = mutList.stream()
            .map(mut -> mut.split(":", 2))
            .collect(Collectors.groupingBy(
                mut -> mut[0],
                LinkedHashMap::new,
                Collectors.mapping(mut -> mut.length > 1 ? mut[1] : "", Collectors.toList())
            ));
        List<EvaluatedGene> geneResults = new ArrayList<>();
        List<String> invalidMutations = new ArrayList<>();
        MutationComparator<String> mutationComparator = new StringMutationComparator(false);
        
        for (Map.Entry<String, List<String>> entry : mutsByGene.entrySet()) {
            String geneName = entry.getKey();
            List<String> geneMuts = entry.getValue();
            Gene gene = genes.get(geneName);
            for (String mut : geneMuts) {
                if (gene == null || !mutationComparator.isMutationValid(mut)) {
                    invalidMutations.add("'" + geneName + (mut == "" ? "" : ":" + mut) + "'");
                }
            }
            if (gene != null && invalidMutations.isEmpty()) {
                geneResults.add(gene.evaluate(geneMuts, mutationComparator));
            }
        }
        if (!invalidMutations.isEmpty()) {
            throw new ASIEvaluationException(
                Strings.lenientFormat("Invalid mutations: %s", String.join(", ", invalidMutations))
            );
        }
        return JsObjectify.of(geneResults);
    }

}