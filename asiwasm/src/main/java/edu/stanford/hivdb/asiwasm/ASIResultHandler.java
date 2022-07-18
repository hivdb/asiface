package edu.stanford.hivdb.asiwasm;

import java.util.ArrayList;
import java.util.Collection;
import java.util.Collections;
import java.util.HashMap;
import java.util.LinkedHashSet;
import java.util.List;
import java.util.Map;
import java.util.Set;
import java.util.SortedSet;
import java.util.TreeMap;
import java.util.TreeSet;
import java.util.regex.Pattern;
import java.util.stream.Collectors;

import org.fstrf.stanfordAsiInterpreter.resistance.definition.CommentDefinition;
import org.fstrf.stanfordAsiInterpreter.resistance.definition.DrugClass;
import org.fstrf.stanfordAsiInterpreter.resistance.definition.Gene;
import org.fstrf.stanfordAsiInterpreter.resistance.definition.LevelDefinition;
import org.fstrf.stanfordAsiInterpreter.resistance.evaluate.EvaluatedCondition;
import org.fstrf.stanfordAsiInterpreter.resistance.evaluate.EvaluatedDrug;
import org.fstrf.stanfordAsiInterpreter.resistance.evaluate.EvaluatedDrugClass;
import org.fstrf.stanfordAsiInterpreter.resistance.evaluate.EvaluatedGene;
import org.fstrf.stanfordAsiInterpreter.resistance.grammar.AsiGrammarAdapter.ScoredItem;
import org.fstrf.stanfordAsiInterpreter.resistance.grammar.MutationComparator;
import org.fstrf.stanfordAsiInterpreter.resistance.grammar.StringMutationComparator;


public class ASIResultHandler {
	
	private final static Pattern positionPattern = Pattern.compile("\\d+"); 
	
	private final static Set<String> sortedMutations(Set<?> mutations) {
		return mutations.stream()
			.map(m -> (String) m)
			.sorted((a, b) -> (
				Integer.parseInt(positionPattern.matcher(a).group(0))
				-
				Integer.parseInt(positionPattern.matcher(b).group(0))
			))
			.collect(Collectors.toCollection(LinkedHashSet::new));
	}
	
	public final static ASIDrugSusc extractDrugSusc(
		DrugClass drugClass,
		EvaluatedDrug evalDrug,
		DrugResistanceAlgorithm algorithm
	) {
		
		org.fstrf.stanfordAsiInterpreter.resistance.definition.Drug drug = evalDrug.getDrug();
		Map<String, Set<String>> gpMutations = new TreeMap<>();
		Map<String, Double> gpPartialScores = new HashMap<>();

		LevelDefinition levelDef = evalDrug.getHighestLevelDefinition();
		Double highestTotalScore = Double.NEGATIVE_INFINITY;
		String ruleStatement = "";
		boolean isTriggered = false;

		for(Object condObj : evalDrug.getEvaluatedConditions()) {
			EvaluatedCondition evalCond = (EvaluatedCondition) condObj;
			Object evaluatedResult = evalCond.getEvaluator().getResult();
			String tmpRuleStatement = (
				evalCond
				.getRuleCondition().toString()
				.replaceAll("\\s+", " ")
			);
			if (evaluatedResult instanceof Double) {
				// score rules available
				Double totalScore = (Double) evaluatedResult;

				if (totalScore <= highestTotalScore) {
					continue;
				}
				Collection<?> scoredItemObjs = evalCond.getEvaluator().getScoredItems();
				if (scoredItemObjs.size() > 0) {
					isTriggered = true;
					highestTotalScore = totalScore;
					ruleStatement = tmpRuleStatement;
				}

				for (Object scoredItemObj : scoredItemObjs) {
					ScoredItem scoredItem = (ScoredItem) scoredItemObj;

					Set<?> untypedMuts = scoredItem.getMutations();
					Set<String> mutations = sortedMutations(untypedMuts);
					
					// aggregate scores by positions instead of mutations
					String gpKey = mutations.stream()
						.map(mut -> Integer.parseInt(positionPattern.matcher(mut).group(0)))
						.map(pos -> String.valueOf(pos))
						.collect(Collectors.joining("+"));

					Set<String> prevMuts = gpMutations.getOrDefault(gpKey, Collections.emptySet());
					mutations.addAll(prevMuts);

					gpMutations.put(gpKey, sortedMutations(mutations));
					Double newScore = scoredItem.getScore();
					if (Math.abs(newScore) > 1e-5) {
						gpPartialScores.put(
							gpKey,
							Math.max(gpPartialScores.getOrDefault(gpKey, Double.NEGATIVE_INFINITY), newScore)
						);
					}
				}
				
			}
			else if (evaluatedResult instanceof Boolean) {
				// level rules available
				Boolean tmpTriggered = (Boolean) evaluatedResult;
				if (highestTotalScore > Double.NEGATIVE_INFINITY) {
					/**
					 * don't save level rules for a drug already with scores
					 *
					 * The rationale:
					 * For Rega HIV1, the NRTIs have rules. The NNRTIs, PIs, and INSTIs have scores.
					 * However, the PIs also have an extra rule "SELECT ATLEAST 0 FROM (1P)" leading
					 * to level 2.
					 */
					continue;
				}
				if (!tmpTriggered) {
					continue;
				}
				isTriggered = true;
				ruleStatement = tmpRuleStatement;
			}
		}

		Map<Set<String>, Double> partialScores = new TreeMap<>();
		for (String gpKey : gpMutations.keySet()) {
			partialScores.put(gpMutations.get(gpKey), gpPartialScores.get(gpKey));
		}
		
		return new ASIDrugSusc(
			drug,
			drugClass,
			algorithm,
			highestTotalScore == Double.NEGATIVE_INFINITY ? 0 : highestTotalScore,
			levelDef == null ? 1 : levelDef.getOrder(),
			levelDef == null ? algorithm.getOriginalLevelText() : levelDef.getText(),
			levelDef == null ? algorithm.getOriginalLevelSIR() : SIREnum.valueOf(levelDef.getSir()),
			partialScores,
			ruleStatement,
			isTriggered
		);
	}

	public final static EvaluatedGene evalutateGeneMutations(
		Gene gene,
		Collection<String> mutations,
		DrugResistanceAlgorithm algorithm
	) {
		List<String> mutList = new ArrayList<>(mutations);

		MutationComparator mutationComparator = new StringMutationComparator(false);
		if (!mutationComparator.areMutationsValid(mutList)) {
			throw new RuntimeException(
				String.format("Invalid list of mutations: %s",
				mutations.toString()
			));
		}

		try {
			return gene.evaluate(mutList, mutationComparator);
		}
		catch (Exception e) {
			throw new RuntimeException(e);
		}
	}

	public final static SortedSet<ASIDrugSusc> extractDrugSuscs(
		EvaluatedGene evaluatedGene, DrugResistanceAlgorithm algorithm
	) {
		if (evaluatedGene == null) {
			// the current algorithm doesn't support targetGene
			return Collections.emptySortedSet();
		}
		SortedSet<ASIDrugSusc> asiDrugSuscs = new TreeSet<>();
		for(Object drugClassObj : evaluatedGene.getEvaluatedDrugClasses()) {
			EvaluatedDrugClass evalDrugClass = (EvaluatedDrugClass) drugClassObj;

			for (Object drugObj : evalDrugClass.getEvaluatedDrugs()) {
				EvaluatedDrug evalDrug = (EvaluatedDrug) drugObj;
				ASIDrugSusc drugSusc = extractDrugSusc(
					evalDrugClass.getDrugClass(), evalDrug, algorithm
				);
				if (drugSusc != null) {
					asiDrugSuscs.add(drugSusc);
				}
			}
			
		}
		return asiDrugSuscs;
	}

	public static List<CommentDefinition> extractComments(Collection<?> defs) {
		return defs.stream()
			.map(def -> (CommentDefinition) def)
			.collect(Collectors.toList());
	}
	
}