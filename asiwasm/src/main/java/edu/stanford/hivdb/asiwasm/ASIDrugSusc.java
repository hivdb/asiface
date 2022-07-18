package edu.stanford.hivdb.asiwasm;

import java.io.Serializable;
import java.util.Collections;
import java.util.LinkedHashMap;
import java.util.Map;
import java.util.Objects;
import java.util.Set;
import java.util.stream.Collectors;

import org.fstrf.stanfordAsiInterpreter.resistance.definition.Drug;
import org.fstrf.stanfordAsiInterpreter.resistance.definition.DrugClass;


public class ASIDrugSusc implements Comparable<ASIDrugSusc>, Serializable {

	private static final long serialVersionUID = 6192833587557227063L;
	private final Drug drug;
	private final DrugClass drugClass;
	private final DrugResistanceAlgorithm algorithm;
	private final Double score;
	private final Integer level;
	private final String levelText;
	private final SIREnum sir;
	private final Map<Set<String>, Double> partialScores;
	private final String statement;
	private final boolean triggered;
	
	public ASIDrugSusc(
		Drug drug,
		org.fstrf.stanfordAsiInterpreter.resistance.definition.DrugClass drugClass,
		DrugResistanceAlgorithm algorithm,
		Double score,
		Integer level,
		String levelText,
		SIREnum sir,
		Map<Set<String>, Double> partialScores,
		String statement,
		boolean triggered
	) {
		this.drug = drug;
		this.drugClass = drugClass;
		this.algorithm = algorithm;
		this.score = score == null ? null : Math.round(score * 100) / 100.0;
		this.level = level;
		this.levelText = levelText;
		this.sir = sir;
		this.partialScores = Collections.unmodifiableMap(partialScores);
		this.statement = statement;
		this.triggered = triggered;
	}
	
	public boolean isTriggered() {
		return triggered;
	}
	
	public Drug getDrug() {
		return drug;
	}
	
	public String getAlgorithmName() {
		return algorithm.getName();
	}
	
	public DrugResistanceAlgorithm getAlgorithmObj() {
		return algorithm;
	}

	public Boolean drugIs(String name) {
		return getDrug().getDrugName().equals(name);
	}

	public Boolean drugIs(Drug drug) {
		return getDrug().equals(drug);
	}
	
	public DrugClass getDrugClass() {
		return drugClass;
	}
	
	public Boolean drugClassIs(String name) {
		return getDrugClass().toString().equals(name);
	}
	
	public Boolean drugClassIs(DrugClass drugClass) {
		return getDrugClass().equals(drugClass);
	}
	
	public Double getScore() {
		return score;
	}

	public Integer getLevel() {
		return level;
	}

	public String getLevelText() {
		return levelText;
	}
	
	public SIREnum getSIR() {
		return sir;
	}

	public String getInterpretation() {
		return levelText;
	}
	
	public String getExplanation() {
		String explanation = "";

		if (triggered) {
			String textPartialScores = (
				getPartialScores().entrySet()
				.stream()
				.map(pair -> String.format(
					"%s (%.1f)",
					String.join(" + ", pair.getKey()),
					pair.getValue()
				))
				.collect(Collectors.joining(", "))
			);
			if (textPartialScores.isEmpty()) {
				// rule was triggered but not partial score description
				// describe the statement and result instead
				explanation = String.format(
					"%s (%s)",
					statement.replace("+", " + ").replace(",", ", "),
					levelText
				);
			}
			else {
				explanation = String.format(
					"Total score: %.1f\n%s",
					score,
					textPartialScores
				);
			}
		}
		else {
			explanation = "No rules were triggered";
		}
		return explanation;
	}

	public Map<Set<String>, Double> getPartialScores() {
		return partialScores;
	}
	
	public String getStatement() {
		return statement;
	}

	public Boolean hasSingleMutPartialScore() {
		return (
			partialScores
			.keySet()
			.stream()
			.anyMatch(muts -> muts.size() == 1)
		);
	}
	
	public Map<String, Double> getSingleMutPartialScores() {
		return (
			partialScores
			.entrySet()
			.stream()
			.filter(e -> e.getKey().size() == 1)
			.collect(Collectors.toMap(
				e -> e.getKey().iterator().next(),
				e -> e.getValue(),
				(a, b) -> a,
				LinkedHashMap::new
			))
		);
	}
	
	public Boolean hasMultiMutsPartialScore() {
		return (
			partialScores
			.keySet()
			.stream()
			.anyMatch(muts -> muts.size() > 1)
		);
	}
	
	public Map<Set<String>, Double> getMultiMutsPartialScores() {
		return (
			partialScores
			.entrySet()
			.stream()
			.filter(e -> e.getKey().size() > 1)
			.collect(Collectors.toMap(
				e -> e.getKey(),
				e -> e.getValue(),
				(a, b) -> a,
				LinkedHashMap::new
			))
		);
	}


	@Override
	public String toString() {
		return String.format("%s (%s): %s, %s, %.1f", drug, algorithm.getName(), sir, levelText, score);
	}
	
	@Override
	public int compareTo(ASIDrugSusc other) {
		int cmp = algorithm.compareTo(other.algorithm);
		if (cmp == 0) {
			cmp = drug.getDrugName().compareTo(other.drug.getDrugName());
		}
		if (cmp == 0) {
			cmp = sir.compareTo(other.sir);
		}
		if (cmp == 0) {
			cmp = -score.compareTo(other.score);
		}
		if (cmp == 0) {
			cmp = -level.compareTo(other.level);
		}
		if (cmp == 0) {
			cmp = levelText.compareTo(other.levelText);
		}
		if (cmp == 0) {
			cmp = statement.compareTo(other.statement);
		}
		return cmp;
	}

	@Override
	public boolean equals(final Object obj) {
		if (obj == this) { return true; }
		if (obj == null) { return false; }
		if (!(obj instanceof ASIDrugSusc)) { return false; }
		final ASIDrugSusc other = (ASIDrugSusc) obj;
		
		return (
			algorithm.equals(other.algorithm) &&
			drug.getDrugName().equals(other.drug.getDrugName()) &&
			sir.equals(other.sir) &&
			score == other.score &&
			level == other.level &&
			levelText.equals(other.levelText) &&
			statement.equals(other.statement)
		);
    }

	@Override
	public int hashCode() {
		return Objects.hash(
			algorithm,
			drug,
			sir,
			score,
			level,
			levelText,
			statement
		);
	}

}
