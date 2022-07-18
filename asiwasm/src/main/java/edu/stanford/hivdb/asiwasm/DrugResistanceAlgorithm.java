package edu.stanford.hivdb.asiwasm;

import java.io.ByteArrayInputStream;
import java.io.InputStream;
import java.io.Serializable;
import java.util.Collections;
import java.util.Map;
import java.util.stream.Collectors;

import org.fstrf.stanfordAsiInterpreter.resistance.definition.Gene;
import org.fstrf.stanfordAsiInterpreter.resistance.ASIParsingException;
import org.fstrf.stanfordAsiInterpreter.resistance.xml.XmlAsiTransformer;


public class DrugResistanceAlgorithm implements Comparable<DrugResistanceAlgorithm>, Serializable {
	
	private static final long serialVersionUID = -6177916093946091256L;
	final private String name;
	final private String family;
	final private String version;
	final private String publishDate;
	final private transient String xmlText;
	final private transient String originalLevelText;
	final private transient String originalLevelSIR;
	final private transient Map<String, Gene> geneMap;

	private static Map<String, Gene> initGeneMap(String xmlText) {
		InputStream resource = new ByteArrayInputStream(xmlText.getBytes());
		Map<?, ?> geneMap;
		XmlAsiTransformer transformer = new XmlAsiTransformer(true);
		try {
			geneMap = transformer.transform(resource);
		} catch (Exception e) {
			throw new ExceptionInInitializerError(e);
		}
		return Collections.unmodifiableMap(geneMap
			.entrySet()
			.stream()
			.collect(Collectors.toMap(
				e -> ((String) e.getKey()),
				e -> (Gene) e.getValue()
			))
		);
	}
	
	private static Map<?, ?> getAlgorithmInfo(String xmlText) {
		InputStream resource = new ByteArrayInputStream(xmlText.getBytes());
		XmlAsiTransformer transformer = new XmlAsiTransformer(true);
		try {
			Map<?, ?> algInfo = (Map<?, ?>) transformer.getAlgorithmInfo(resource);
			return algInfo;
		} catch (ASIParsingException e) {
			throw new ExceptionInInitializerError(e);
		}
	}
	
	public DrugResistanceAlgorithm(String xmlText) {
		this(null, null, null, null, xmlText);
	}
	
	public DrugResistanceAlgorithm(String name, String xmlText) {
		this(name, null, null, null, xmlText);
	}
	
	public DrugResistanceAlgorithm(
		String name, String family, String version,
		String publishDate, String xmlText
	) {
		Map<?, ?> algInfo = getAlgorithmInfo(xmlText);
		Map<?, ?> algNVD = (Map<?, ?>) algInfo.get("ALGNAME_ALGVERSION_ALGDATE");
		Map<?, ?> originalLevel = (Map<?, ?>) algInfo.get("ORDER1_ORIGINAL_SIR");
		this.name = name == null ? String.format("%s_%s", algNVD.get("ALGNAME"), algNVD.get("ALGVERSION")) : name;
		this.family = family == null ? (String) algNVD.get("ALGNAME") : family;
		this.version = version == null ? (String) algNVD.get("ALGVERSION") : version;
		this.publishDate = publishDate == null ? (String) algNVD.get("ALGDATE") : publishDate;
		this.originalLevelText = (String) originalLevel.get("ORIGINAL");
		this.originalLevelSIR = (String) originalLevel.get("SIR");
		this.xmlText = xmlText;
		this.geneMap = initGeneMap(xmlText);
	}
	
	public String getName() {
		return name;
	}
	
	public String getDisplay() {
		return String.format("%s %s", family, version);
	}
	
	public String name() {
		return name;
	}
	
	public String getFamily() {
		return family;
	}
	
	public String getVersion() {
		return version;
	}
	
	public String getPublishDate() {
		return publishDate;
	}
	
	public String getOriginalLevelText() {
		return originalLevelText;
	}

	public SIREnum getOriginalLevelSIR() {
		return SIREnum.valueOf(originalLevelSIR);
	}
	
	public Gene getGene(String geneName) {
		return geneMap.get(geneName);
	}
	
	public String getXMLText() {
		return xmlText;
	}
	
	@Override
	public String toString() {
		return getName();
	}

	@Override
	public int compareTo(DrugResistanceAlgorithm other) {
		int cmp = family.compareTo(other.family);
		if (cmp == 0) {
			cmp = version.compareTo(other.version);
		}
		if (cmp == 0) {
			cmp = publishDate.compareTo(other.publishDate);
		}
		return cmp;
	}

	@Override
	public boolean equals(final Object obj) {
		if (obj == this) { return true; }
		// require singleton
		return false;
    }

}
