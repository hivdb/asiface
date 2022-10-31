import React from 'react';
import PropTypes from 'prop-types';

import SimpleTable, {ColumnDef} from 'icosa/components/simple-table';


NA.propTypes = {
  children: PropTypes.string
};

function NA({children}) {
  return <>
    {children === null ? 'NA' : children}
  </>;
}


const drugShape = PropTypes.shape({
  drugName: PropTypes.string.isRequired,
  oldSIR: PropTypes.oneOf(['S', 'I', 'R']),
  newSIR: PropTypes.oneOf(['S', 'I', 'R']),
  oldLevel: PropTypes.number,
  newLevel: PropTypes.number,
  oldScore: PropTypes.number,
  newScore: PropTypes.number,
  sirChanged: PropTypes.bool.isRequired,
  levelChanged: PropTypes.bool.isRequired,
  scoreChanged: PropTypes.bool.isRequired
});


DrugScoreCell.propTypes = {
  drug: drugShape.isRequired
};

function DrugScoreCell({drug}) {
  const {oldScore, newScore, scoreChanged} = drug;
  return scoreChanged ?
    <strong>
      <NA>{oldScore}</NA> => <NA>{newScore}</NA>
    </strong> : <NA>{newScore}</NA>;
}


const drugClassShape = PropTypes.shape({
  drugClassName: PropTypes.string.isRequired,
  drugs: PropTypes.arrayOf(drugShape.isRequired).isRequired
});


const geneShape = PropTypes.shape({
  geneName: PropTypes.string.isRequired,
  drugClasses: PropTypes.arrayOf(drugClassShape.isRequired).isRequired
});


ASIComparison.propTypes = {
  cacheKey: PropTypes.string.isRequired,
  comparisonResults: PropTypes.arrayOf(
    PropTypes.shape({
      mutations: PropTypes.arrayOf(
        PropTypes.string.isRequired
      ).isRequired,
      genes: PropTypes.arrayOf(geneShape.isRequired).isRequired
    }).isRequired
  ).isRequired
};

export default function ASIComparison({cacheKey, comparisonResults}) {

  const colDefsByDrugClass = React.useMemo(
    () => {
      const colDefsByDrugClass = {};
      for (const {genes} of comparisonResults) {
        for (const {drugClasses} of genes) {
          for (const {drugClassName, drugs} of drugClasses) {
            if (!(drugClassName in colDefsByDrugClass)) {
              colDefsByDrugClass[drugClassName] = {
                $pattern: new ColumnDef({name: 'pattern', label: 'Pattern'})
              };
            }
            const colDefMap = colDefsByDrugClass[drugClassName];
            for (const {drugName} of drugs) {
              if (!(`$${drugName}` in colDefMap)) {
                colDefMap[`$${drugName}`] = new ColumnDef({
                  name: drugName,
                  label: drugName,
                  render: drug => <DrugScoreCell drug={drug} />,
                  sortable: false
                });
              }
            }
          }
        }
      }
      return Object.entries(colDefsByDrugClass)
        .reduce((acc, [dcName, colDefMap]) => {
          acc[dcName] = Object.values(colDefMap);
          return acc;
        }, {});
    },
    [comparisonResults]
  );

  const dataByDrugClass = React.useMemo(
    () => {
      const dataByDrugClass = {};
      for (const {mutations, genes} of comparisonResults) {
        for (const {geneName, drugClasses} of genes) {
          const genePrefix = geneName + ':';
          const geneMuts = mutations
            .filter(mut => mut.startsWith(genePrefix))
            .map(mut => mut.replace(/^[^:]+:/, ''))
            .join(' + ');
          for (const {drugClassName, drugs} of drugClasses) {
            if (!(drugClassName in dataByDrugClass)) {
              dataByDrugClass[drugClassName] = [];
            }
            const rows = dataByDrugClass[drugClassName];
            const row = {pattern: geneMuts};
            for (const dr of drugs) {
              row[dr.drugName] = dr;
            }
            rows.push(row);
          }
        }
      }
      return dataByDrugClass;
    },
    [comparisonResults]
  );

  return <>
    {Object.entries(dataByDrugClass).map(
      ([dcName, data]) => <section>
        <h2>{dcName}</h2>
        <SimpleTable
         key={`${dcName}-${cacheKey}`}
         cacheKey={`${dcName}-${cacheKey}`}
         columnDefs={colDefsByDrugClass[dcName]}
         data={data} />
      </section>
    )}
  </>;
}
