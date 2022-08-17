import React from 'react';
import PropTypes from 'prop-types';
import maxBy from 'lodash/maxBy';
import SimpleTable, {ColumnDef} from 'icosa/components/simple-table';

import {levelShape} from './prop-types';
import {sortMutations} from './mutations';


DrugClassLevels.propTypes = {
  drugs: PropTypes.arrayOf(
    PropTypes.shape({
      drugName: PropTypes.string.isRequired,
      highestLevel: levelShape,
      conditions: PropTypes.arrayOf(
        PropTypes.shape({
          result: PropTypes.oneOfType([
            PropTypes.bool.isRequired,
            PropTypes.number.isRequired
          ]).isRequired,
          scoredMutations: PropTypes.arrayOf(
            PropTypes.string.isRequired
          ).isRequired,
          scoredItems: PropTypes.arrayOf(
            PropTypes.shape({
              mutations: PropTypes.arrayOf(
                PropTypes.string.isRequired
              ).isRequired,
              value: PropTypes.string.isRequired,
              score: PropTypes.number.isRequired
            }).isRequired
          ).isRequired,
          definitions: PropTypes.arrayOf(levelShape.isRequired).isRequired
        }).isRequired
      ).isRequired
    }).isRequired
  ).isRequired,
  algorithmInfo: PropTypes.shape({
    ORDER1_ORIGINAL_SIR: PropTypes.shape({
      ORIGINAL: PropTypes.string.isRequired
    }).isRequired
  }).isRequired
};

export default function DrugClassLevels({
  drugs,
  algorithmInfo: {
    ORDER1_ORIGINAL_SIR: {
      ORIGINAL: order1LevelText
    }
  }
}) {

  const data = React.useMemo(
    () => {
      const totalRow = {rule: 'Total'};
      const rows = {};
      for (const drug of drugs) {
        const {drugName, highestLevel, conditions} = drug;
        const highestCondition = maxBy(conditions, 'result');
        const {
          result,
          definitions,
          scoredMutations,
          scoredItems
        } = highestCondition;

        if (typeof result === 'number') {
          totalRow[drugName] = result;
          totalRow.isNumber = true;
          for (const {mutations, score} of scoredItems) {
            const mutKey = sortMutations(mutations).join(' + ');
            rows[mutKey] = rows[mutKey] || {rule: mutKey};
            rows[mutKey][drugName] = score;
            rows[mutKey].isNumber = true;
          }
        }
        else {
          totalRow[drugName] = highestLevel?.text;
          if (result === true) {
            // only shows when condition is triggerred
            const mutKey = sortMutations(scoredMutations).join(' + ');
            rows[mutKey] = rows[mutKey] || {rule: mutKey};
            rows[mutKey][drugName] = maxBy(definitions, 'order').text;
            rows[mutKey].isNumber = false;
          }
        }
      }
      return [
        ...Object.values(rows),
        ...(Object.keys(rows).length === 0 ? [{
          rule: 'No match'
        }] : []),
        totalRow
      ];
    },
    [drugs]
  );

  const colDefs = React.useMemo(
    () => [
      new ColumnDef({
        name: 'rule',
        render: rule => <>
          {rule === 'No match' ? <em>No match</em> : rule}
        </>
      }),
      ...(drugs.map(
        ({drugName}) => new ColumnDef({
          name: drugName,
          label: drugName,
          render: (result, {isNumber, rule}) => {
            const display = result || (isNumber ? 0 : order1LevelText);
            if (rule === 'Total') {
              return display;
            }
            else {
              return <em>{display}</em>;
            }
          }
        })
      ))
    ],
    [drugs, order1LevelText]
  );

  const cacheKey = React.useMemo(() => JSON.stringify(data), [data]);

  return (
    <SimpleTable
     key={cacheKey}
     cacheKey={cacheKey}
     compact lastCompact
     columnDefs={colDefs}
     data={data} />
  );
}
