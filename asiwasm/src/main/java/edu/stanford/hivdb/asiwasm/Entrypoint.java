package edu.stanford.hivdb.asiwasm;

import de.inetsoftware.jwebassembly.api.annotation.Export;


public class Entrypoint {
	
	@Export
	public static int /*DrugResistanceAlgorithm*/ parseASI(String xmlText) {
		return 123;
		// return new DrugResistanceAlgorithm(xmlText);
	}

}
