import React from 'react';
import PropTypes from 'prop-types';
import {Tab, Tabs, TabList, TabPanel} from 'react-tabs';

import CheckboxInput from 'icosa/components/checkbox-input';
import RadioInput from 'icosa/components/radio-input';
import SimpleTable, {ColumnDef} from 'icosa/components/simple-table';

import style from './style.module.scss';


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
    </strong> : <span className={style.gray}>
      <NA>{newScore}</NA>
    </span>;
}


DrugSIRCell.propTypes = {
  drug: drugShape.isRequired
};

function DrugSIRCell({drug}) {
  const {oldSIR, newSIR, sirChanged} = drug;
  return sirChanged ?
    <strong>
      <NA>{oldSIR}</NA> => <NA>{newSIR}</NA>
    </strong> : <span className={style.gray}>
      <NA>{newSIR}</NA>
    </span>;
}


DrugLevelCell.propTypes = {
  drug: drugShape.isRequired
};

function DrugLevelCell({drug}) {
  const {oldLevel, newLevel, levelChanged} = drug;
  return levelChanged ?
    <strong>
      <NA>{oldLevel}</NA> => <NA>{newLevel}</NA>
    </strong> : <span className={style.gray}>
      <NA>{newLevel}</NA>
    </span>;
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
      pattern: PropTypes.arrayOf(
        PropTypes.string.isRequired
      ).isRequired,
      count: PropTypes.number.isRequired,
      genes: PropTypes.arrayOf(geneShape.isRequired).isRequired
    }).isRequired
  ).isRequired
};

export default function ASIComparison({cacheKey, comparisonResults}) {

  const [selectedIndex, setSelectedIndex] = React.useState(0);
  const [onlyDiffs, toggleOnlyDiffs] = React.useReducer(f => !f, true);
  const [cmpCol, setCmpCol] = React.useState('score');

  const colDefsByDrugClass = React.useMemo(
    () => {
      const colDefsByDrugClass = {};
      for (const {genes} of comparisonResults) {
        for (const {drugClasses} of genes) {
          for (const {drugClassName, drugs} of drugClasses) {
            if (!(drugClassName in colDefsByDrugClass)) {
              colDefsByDrugClass[drugClassName] = {
                $pattern: new ColumnDef({name: 'pattern', label: 'Pattern'}),
                $count: new ColumnDef({name: 'count', label: '#'})
              };
            }
            const colDefMap = colDefsByDrugClass[drugClassName];
            for (const {drugName} of drugs) {
              if (!(`$${drugName}` in colDefMap)) {
                colDefMap[`$${drugName}`] = new ColumnDef({
                  name: drugName,
                  label: drugName,
                  ...(
                    cmpCol === 'score' ? {
                      render: drug => <DrugScoreCell drug={drug} />
                    } : cmpCol === 'SIR' ? {
                      render: drug => <DrugSIRCell drug={drug} />
                    } : {
                      render: drug => <DrugLevelCell drug={drug} />
                    }
                  ),
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
    [comparisonResults, cmpCol]
  );

  const dataByDrugClass = React.useMemo(
    () => {
      const dataByDrugClass = {};
      for (const {pattern, count, genes} of comparisonResults) {
        for (const {drugClasses} of genes) {
          for (const {drugClassName, drugs} of drugClasses) {
            if (!(drugClassName in dataByDrugClass)) {
              dataByDrugClass[drugClassName] = [];
            }
            const rows = dataByDrugClass[drugClassName];
            const row = {pattern: pattern.join(' + '), count};
            let everChanged = false;
            for (const dr of drugs) {
              row[dr.drugName] = dr;
              if (cmpCol === 'score' && dr.scoreChanged) {
                everChanged = true;
              }
              else if (cmpCol === 'SIR' && dr.sirChanged) {
                everChanged = true;
              }
              else if (cmpCol === 'level' && dr.levelChanged) {
                everChanged = true;
              }
            }
            if (everChanged || !onlyDiffs) {
              rows.push(row);
            }
          }
        }
      }
      return dataByDrugClass;
    },
    [comparisonResults, cmpCol, onlyDiffs]
  );

  return <div className={style['asi-comparison']}>
    <p>
      <CheckboxInput
       id="only-changes-toggler"
       name="only-changes-toggler"
       onChange={toggleOnlyDiffs}
       checked={onlyDiffs}>
        Shows only patterns with changed results
      </CheckboxInput>
    </p>
    <p>
      <label>Compare: </label>
      <RadioInput
       id="cmp-col-score"
       name="cmp-col"
       onChange={() => setCmpCol('score')}
       checked={cmpCol === 'score'}>
        score
      </RadioInput>
      <RadioInput
       id="cmp-col-sir"
       name="cmp-col"
       onChange={() => setCmpCol('SIR')}
       checked={cmpCol === 'SIR'}>
        SIR
      </RadioInput>
      <RadioInput
       id="cmp-col-level"
       name="cmp-col"
       onChange={() => setCmpCol('level')}
       checked={cmpCol === 'level'}>
        level
      </RadioInput>
    </p>
    <Tabs
     onSelect={setSelectedIndex}
     selectedIndex={selectedIndex}>
      <TabList>
        {Object.keys(dataByDrugClass).map(
          dcName => <Tab key={dcName}>{dcName}</Tab>
        )}
      </TabList>
      {Object.entries(dataByDrugClass).map(
        ([dcName, data]) => <TabPanel key={dcName}>
          {data.length === 0 ?
            <em>
              No {onlyDiffs ?
              'changes were found for this drug class' :
              'patterns were available for this drug class'}
            </em> :
            <SimpleTable
             noHeaderOverlapping
             key={`${dcName}-${onlyDiffs}-${cacheKey}`}
             cacheKey={`${dcName}-${cacheKey}`}
             columnDefs={colDefsByDrugClass[dcName]}
             data={data} />}
        </TabPanel>
      )}
    </Tabs>
  </div>;
}
