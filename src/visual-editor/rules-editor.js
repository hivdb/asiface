import React from 'react';
import PropTypes from 'prop-types';
import FileInput from 'icosa/components/file-input';
import Button from 'icosa/components/button';

import readFile from 'icosa/utils/read-file';
import {csvStringify, csvParse} from 'icosa/utils/csv';
import {makeDownload} from 'icosa/utils/download';
import useMounted from 'icosa/utils/use-mounted';

import {parseRule} from './asi-parser';
import style from './style.module.scss';


function rulesToCSV(rules) {
  const headerMap = {'rule': true};
  for (const rule of rules) {
    for (const col of Object.keys(rule)) {
      headerMap[col] = true;
    }
  }
  const header = Object.keys(headerMap);
  return [
    csvStringify(header),
    ...rules.map(
      rule => csvStringify(rule, {header})
    )
  ].join('\n');
}


function validateRules(rules) {
  const allErrors = [];
  for (const rule of rules) {
    try {
      parseRule(rule.rule);
    }
    catch (error) {
      allErrors.push(error.message);
    }
  }
  return [rules, allErrors];
}


export function csvToRules(csvRules) {
  return csvParse(csvRules);
}


RulesEditor.propTypes = {
  drugClass: PropTypes.string.isRequired,
  fileNamePrefix: PropTypes.string.isRequired,
  rules: PropTypes.arrayOf(
    PropTypes.shape({
      rule: PropTypes.string
    }).isRequired
  ).isRequired,
  onChange: PropTypes.func.isRequired
};

export default function RulesEditor({
  drugClass, fileNamePrefix, rules,
  onChange
}) {

  const isMounted = useMounted();

  const [sanitizedRules, errors] = React.useMemo(
    () => validateRules(rules),
    [rules]
  );

  const handleUpload = React.useCallback(
    async ([file]) => {
      if (!file || !(/^text\/.+$/.test(file.type))) {
        return;
      }
      const csvRules = await readFile(file);
      if (isMounted()) {
        onChange(drugClass, csvToRules(csvRules));
      }
    },
    [onChange, drugClass, isMounted]
  );

  const handleDownload = React.useCallback(
    () => {
      const csvRules = rulesToCSV(sanitizedRules);
      makeDownload(
        `${fileNamePrefix}-${drugClass}-rules.csv`,
        'text/csv',
        csvRules
      );
    },
    [drugClass, fileNamePrefix, sanitizedRules]
  );

  return (
    <div className={style['rules-editor']}>
      <div className={style['option-row']}>
        <label htmlFor="rules-input">{drugClass} Rules:</label>
        <FileInput
         hideSelected
         btnSize="small"
         id="rules-input"
         name="rules-input"
         className={style['rules-input']}
         onChange={handleUpload}
         accept="*.csv">
          Upload
        </FileInput>
        <Button
         btnSize="small"
         btnStyle="default"
         id="rules-output"
         name="rules-output"
         className={style['rules-output']}
         onClick={handleDownload}>
          Download
        </Button>
      </div>
      {errors && errors.length > 0 ?
        <ul className={style['errors']}>
          {errors.map(
            (text, idx) => <li key={idx}>
              {text}
            </li>
          )}
        </ul> : null}
    </div>
  );
}
