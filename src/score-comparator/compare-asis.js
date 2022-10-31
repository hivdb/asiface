import maxBy from 'lodash/maxBy';


function compareDrugResult(oldDR, newDR, drugName) {
  const oldSIR = oldDR?.highestLevel?.SIR || null;
  const newSIR = newDR?.highestLevel?.SIR || null;
  const oldLevel = oldDR?.highestLevel?.order || null;
  const newLevel = newDR?.highestLevel?.order || null;
  let oldScore = oldDR ?
    (maxBy(oldDR.conditions || [], 'result')?.result || 0) : null;
  if (typeof oldScore !== 'number') {
    oldScore = null;
  }
  let newScore = newDR ?
    (maxBy(newDR.conditions || [], 'result')?.result || 0) : null;
  if (typeof newScore !== 'number') {
    newScore = null;
  }
  return {
    drugName,
    oldSIR,
    newSIR,
    oldLevel,
    newLevel,
    oldScore,
    newScore,
    sirChanged: oldSIR !== newSIR,
    levelChanged: oldLevel !== newLevel,
    scoreChanged: oldScore !== newScore
  };
}


function compareDrugClassResult(oldDCR, newDCR, dcName) {
  const drugLookup = {};
  for (const dr of (oldDCR?.drugs || [])) {
    drugLookup[dr.drugName] = [dr, null];
  }
  for (const dr of (newDCR?.drugs || [])) {
    if (dr.drugName in drugLookup) {
      drugLookup[dr.drugName][1] = dr;
    }
    else {
      drugLookup[dr.drugName] = [null, dr];
    }
  }
  return {
    drugClassName: dcName,
    drugs: Object.entries(drugLookup)
      .map(([drugName, [oldDR, newDR]]) => (
        compareDrugResult(oldDR, newDR, drugName)
      ))
  };
}


function compareGeneResult(oldGR, newGR, geneName) {
  const drugClassLookup = {};
  for (const dcr of (oldGR?.drugClasses || [])) {
    drugClassLookup[dcr.drugClassName] = [dcr, null];
  }
  for (const dcr of (newGR?.drugClasses || [])) {
    if (dcr.drugClassName in drugClassLookup) {
      drugClassLookup[dcr.drugClassName][1] = dcr;
    }
    else {
      drugClassLookup[dcr.drugClassName] = [null, dcr];
    }
  }
  return {
    geneName,
    drugClasses: Object.entries(drugClassLookup)
      .map(([dcName, [oldDCR, newDCR]]) => (
        compareDrugClassResult(oldDCR, newDCR, dcName)
      ))
  };
}


function compareGeneResults(oldGeneResults, geneResults, pattern, count) {
  const geneLookup = {};
  for (const gr of oldGeneResults) {
    geneLookup[gr.geneName] = [gr, null];
  }
  for (const gr of geneResults) {
    if (gr.geneName in geneLookup) {
      geneLookup[gr.geneName][1] = gr;
    }
    else {
      geneLookup[gr.geneName] = [null, gr];
    }
  }
  return {
    pattern,
    count,
    genes: Object.entries(geneLookup)
      .map(([geneName, [oldGR, newGR]]) => (
        compareGeneResult(oldGR, newGR, geneName)
      ))
  };
}


export default function compareASIs(oldAsi, asi, patterns) {
  const results = [];
  for (const {gene, pattern, count} of patterns) {
    const muts = pattern.map(mut => `${gene}:${mut}`);
    const oldGeneResults = oldAsi.evaluate(muts);
    const geneResults = asi.evaluate(muts);
    results.push(
      compareGeneResults(oldGeneResults, geneResults, pattern, count)
    );
  }
  return results;
}
