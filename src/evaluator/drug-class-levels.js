import React from 'react';
import PropTypes from 'prop-types';
import SimpleTable, {ColumnDef} from 'icosa/components/simple-table';

import {levelShape} from './prop-types';


DrugClassLevels.propTypes = {
  drugs: PropTypes.arrayOf(
    PropTypes.shape({
      drugName: PropTypes.string.isRequired,
      drugFullName: PropTypes.string.isRequired,
      highestLevel: levelShape
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

  const drugsTableColumns = React.useMemo(
    () => [
      new ColumnDef({
        name: 'drugName',
        label: 'Drug',
        render: (drugName, {drugFullName}) => <>
          {drugFullName} ({drugName})
        </>
      }),
      new ColumnDef({
        name: 'highestLevel',
        label: 'Level',
        render: level => <>
          {level?.text || order1LevelText}
        </>,
        sort: ['order']
      })
    ],
    [order1LevelText]
  );

  const cacheKey = React.useMemo(
    () => drugs.map(
      ({drugName, highestLevel: level}) => (
        `${drugName}-${level?.order}`
      )
    ).join('$$'),
    [drugs]
  );

  return (
    <SimpleTable
     key={cacheKey}
     cacheKey={cacheKey}
     compact
     columnDefs={drugsTableColumns}
     data={drugs} />
  );
}
