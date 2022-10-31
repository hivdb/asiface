import React from 'react';
import PropTypes from 'prop-types';
import FileInput from 'icosa/components/file-input';
import Button from 'icosa/components/button';
import readFile from 'icosa/utils/read-file';
import useMounted from 'icosa/utils/use-mounted';
import {csvParse, csvStringify} from 'icosa/utils/csv';
import {makeDownload} from 'icosa/utils/download';

import style from './style.module.scss';


function splitMutations(mutations) {
  return mutations.split(/[,;+ \t]+/g).filter(mut => mut);
}


function patternsToCSV(patterns) {
  const header = ['gene', 'drugClass', 'pattern', 'count'];
  return [
    csvStringify(header),
    ...patterns.map(
      ({pattern, ...row}) => csvStringify({
        pattern: pattern.join('+'),
        ...row
      }, {header})
    )
  ].join('\n');
}


function csvToPatterns(csvPatterns) {
  return csvParse(csvPatterns)
    .map(
      row => {
        if ('drug_class' in row) {
          row.drugClass = row['drug_class'];
          delete row['drug_class'];
        }
        row.pattern = splitMutations(row.pattern)
          .map(mut => mut.replace('-', 'd').replace('_', 'i'));
        row.count = Number.parseInt(row.count);
        return row;
      }
    );
}


PatternLoader.propTypes = {
  countLimit: PropTypes.number.isRequired,
  setCountLimit: PropTypes.func.isRequired,
  patterns: PropTypes.array.isRequired,
  onUpload: PropTypes.func.isRequired
};

function PatternLoader({
  countLimit,
  setCountLimit,
  patterns,
  onUpload
}) {
  const handleCountLimitChange = React.useCallback(
    event => setCountLimit(Number.parseInt(event.currentTarget.value)),
    [setCountLimit]
  );

  const handleDownload = React.useCallback(
    () => {
      const csvPatterns = patternsToCSV(patterns);
      makeDownload('patterns.csv', 'text/csv', csvPatterns);
    },
    [patterns]
  );

  return (
    <div className={style['asiface-cell-patterns-loader']}>
      <label>
        {patterns.length.toLocaleString('en-US')}
        {' '}pattern were loaded:{' '}
      </label>
      <FileInput
       hideSelected
       btnSize="small"
       id="patterns-input"
       name="patterns-input"
       className={style['patterns-input']}
       onChange={onUpload}
       accept="*.csv">
        Upload
      </FileInput>
      <Button
       btnSize="small"
       btnStyle="default"
       id="patterns-output"
       name="patterns-output"
       className={style['patterns-output']}
       onClick={handleDownload}>
        Download
      </Button>
      <br />
      <br />
      <label htmlFor="count-limit">
        Only use patterns when # ≥ {' '}
      </label>
      <input
       type="number"
       name="count-limit"
       min={1}
       step={10}
       onChange={handleCountLimitChange}
       value={countLimit} />
      {' '}Therefore, {patterns.filter(
        ({count}) => count < countLimit
      ).length.toLocaleString('en-US')
      } patterns were not used.
    </div>
  );
}


export default function usePatternLoader(defaultPatternsURL) {
  const isMounted = useMounted();
  const [countLimit, setCountLimit] = React.useState(50);
  const [patterns, setPatterns] = React.useState([]);

  React.useEffect(
    () => {
      fetch(defaultPatternsURL)
        .then(resp => resp.text()
          .then(payload => isMounted() &&
          setPatterns(csvToPatterns(payload))));
    },
    [isMounted, defaultPatternsURL]
  );

  const handleUpload = React.useCallback(
    async ([file]) => {
      if (!file || !(/^text\/.+$/.test(file.type))) {
        return;
      }
      const payload = await readFile(file);
      if (isMounted()) {
        setPatterns(csvToPatterns(payload));
      }
    },
    [isMounted]
  );

  return [
    patterns.filter(({count}) => count >= countLimit),
    <PatternLoader
     countLimit={countLimit}
     setCountLimit={setCountLimit}
     patterns={patterns}
     onUpload={handleUpload} />
  ];
}
