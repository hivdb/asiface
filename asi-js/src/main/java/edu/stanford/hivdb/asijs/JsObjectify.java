package edu.stanford.hivdb.asijs;

import java.util.Collection;
import java.util.Map;
import java.util.stream.Collectors;

import org.fstrf.stanfordAsiInterpreter.resistance.definition.CommentDefinition;
import org.fstrf.stanfordAsiInterpreter.resistance.definition.Definition;
import org.fstrf.stanfordAsiInterpreter.resistance.definition.Drug;
import org.fstrf.stanfordAsiInterpreter.resistance.definition.LevelDefinition;
import org.fstrf.stanfordAsiInterpreter.resistance.definition.ResultCommentRule;
import org.fstrf.stanfordAsiInterpreter.resistance.evaluate.EvaluatedCondition;
import org.fstrf.stanfordAsiInterpreter.resistance.evaluate.EvaluatedDrug;
import org.fstrf.stanfordAsiInterpreter.resistance.evaluate.EvaluatedDrugClass;
import org.fstrf.stanfordAsiInterpreter.resistance.evaluate.EvaluatedGene;
import org.fstrf.stanfordAsiInterpreter.resistance.evaluate.EvaluatedResultCommentRule;
import org.fstrf.stanfordAsiInterpreter.resistance.grammar.AsiGrammarAdapter.ScoredItem;
import org.fstrf.stanfordAsiInterpreter.resistance.grammar.AsiGrammarEvaluator;

import elemental2.core.JsArray;
import jsinterop.base.JsPropertyMap;

public class JsObjectify {

    private final static JsPropertyMap<Object> toJsPropertyMap(Map<?, ?> input) {
        JsPropertyMap<Object> jsmap = JsPropertyMap.of();

        for (Map.Entry<?, ?> entry : input.entrySet()) {
            String key = entry.getKey().toString();
            Object val = of(entry.getValue());
            jsmap.set(key, val);
        }

        return jsmap;
    }

    private final static JsArray<Object> toJsArray(Collection<?> input) {
        return new JsArray<>(
            input
                .stream()
                .map(val -> of(val))
                .toArray());
    }

    public final static Object of(Object input) {
        if (input instanceof Map) {
            return toJsPropertyMap((Map<?, ?>) input);
        }
        else if (input instanceof Collection) {
            return toJsArray((Collection<?>) input);
        // Only double values are represented correctly
        // TODO: figure out why
        }
        else if (input instanceof Integer) {
            return ((Integer) input).doubleValue();
        }
        else if (input instanceof Float) {
            return ((Float) input).doubleValue();
        }
        else if (input instanceof Long) {
            return ((Long) input).doubleValue();
        }
        else if (input instanceof Double) {
            return ((Double) input).doubleValue();
        }
        else if (input instanceof LevelDefinition) {
            return toJsPropertyMap((LevelDefinition) input);
        }
        else if (input instanceof CommentDefinition) {
            return toJsPropertyMap((CommentDefinition) input);
        }
        else if (input instanceof Definition) {
            return toJsPropertyMap((Definition) input);
        }
        else if (input instanceof EvaluatedDrug) {
            return toJsPropertyMap((EvaluatedDrug) input);
        }
        else if (input instanceof EvaluatedDrugClass) {
            return toJsPropertyMap((EvaluatedDrugClass) input);
        }
        else if (input instanceof ScoredItem) {
            return toJsPropertyMap((ScoredItem) input);
        }
        else if (input instanceof EvaluatedCondition) {
            return toJsPropertyMap((EvaluatedCondition) input);
        }
        else if (input instanceof EvaluatedGene) {
            return toJsPropertyMap((EvaluatedGene) input);
        }
        else if (input instanceof EvaluatedResultCommentRule) {
            return toJsPropertyMap((EvaluatedResultCommentRule) input);
        }

        return input;
    }

    private final static JsPropertyMap<Object> toJsPropertyMap(LevelDefinition level) {
        JsPropertyMap<Object> levelResult = JsPropertyMap.of();
        levelResult.set("resistance", level.getResistance());
        levelResult.set("order", level.getOrder().doubleValue());
        levelResult.set("SIR", level.getSir());
        levelResult.set("text", level.getText());
        return levelResult; 
    }

    private final static JsPropertyMap< Object> toJsPropertyMap(CommentDefinition cmt) {
        JsPropertyMap<Object> cmtResult = JsPropertyMap.of();
        cmtResult.set("id", cmt.getId());
        cmtResult.set("text", cmt.getText());
        cmtResult.set("sort", cmt.getSort().doubleValue());
        return cmtResult;
    }
    
    private final static JsPropertyMap<Object> toJsPropertyMap(Definition def) {
        JsPropertyMap<Object> defResult;
        if (def instanceof LevelDefinition) {
            defResult = toJsPropertyMap((LevelDefinition) def);
        }
        else if (def instanceof CommentDefinition) {
            defResult = toJsPropertyMap((CommentDefinition) def);
        }
        else {
            defResult = JsPropertyMap.of();
        }
        return defResult;
    }
    
    private final static JsPropertyMap<Object> toJsPropertyMap(EvaluatedResultCommentRule resultComment) {
        JsPropertyMap<Object> cmtResult = JsPropertyMap.of();
        cmtResult.set("result", resultComment.getResult());
        cmtResult.set("definitions", toJsArray(resultComment.getDefinitions()));
        ResultCommentRule rule = resultComment.getResultCommentRule();
        cmtResult.set("levelConditions", toJsArray(
            rule.getConditions().stream()
            .map(cond -> cond.toString())
            .collect(Collectors.toList())
        ));
        return cmtResult;
    }
    
    private final static JsPropertyMap<Object> toJsPropertyMap(EvaluatedDrug evalDrug) {
        JsPropertyMap<Object> drugResult = JsPropertyMap.of();
        Drug drug = evalDrug.getDrug();

        drugResult.set("drugName", drug.getDrugName());
        drugResult.set("drugFullName", drug.getDrugFullName());
        drugResult.set("highestLevel", toJsPropertyMap(evalDrug.getHighestLevelDefinition()));
        drugResult.set("levels", toJsArray(evalDrug.getLevelDefinitions()));
        drugResult.set("conditions", toJsArray(evalDrug.getEvaluatedConditions()));
        return drugResult;
    }
    
    private final static JsPropertyMap<Object> toJsPropertyMap(EvaluatedDrugClass evalDC) {
        JsPropertyMap<Object> dcResult = JsPropertyMap.of();
        dcResult.set("drugClassName", evalDC.getDrugClass().getClassName());
        dcResult.set("drugs", toJsArray(evalDC.getEvaluatedDrugs()));
        return dcResult;
    }
    
    private final static JsPropertyMap<Object> toJsPropertyMap(ScoredItem item) {
        JsPropertyMap<Object> itemResult = JsPropertyMap.of();
        itemResult.set("mutations", toJsArray(item.getMutations()));
        itemResult.set("value", item.getValue());
        itemResult.set("score", item.getScore());
        return itemResult;
    }
    
    private final static JsPropertyMap<Object> toJsPropertyMap(EvaluatedCondition evalCond) {
        JsPropertyMap<Object> condResult = JsPropertyMap.of();
        AsiGrammarEvaluator evaluator = evalCond.getEvaluator();
        condResult.set("result", evaluator.getResult());
        condResult.set("statement", evalCond.getRuleCondition().getStatement());
        condResult.set("scoredMutations", toJsArray(evaluator.getScoredMutations()));
        condResult.set("scoredItems", toJsArray(evaluator.getScoredItems()));
        condResult.set("definitions", toJsArray(evalCond.getDefinitions()));
        return condResult;
    }

    private final static JsPropertyMap<Object> toJsPropertyMap(EvaluatedGene evalGene) {
        JsPropertyMap<Object> geneResult = JsPropertyMap.of();
        geneResult.set("geneName", evalGene.getGene().getName());
        geneResult.set("drugClasses", toJsArray(evalGene.getEvaluatedDrugClasses()));
        geneResult.set("mutationComments", toJsArray(evalGene.getGeneCommentDefinitions()));
        geneResult.set("resultComments", toJsArray(evalGene.getEvaluatedResultCommentRules()));
        geneResult.set("scoredMutations", toJsArray(evalGene.getGeneScoredMutations()));
        return geneResult;
    }

}
