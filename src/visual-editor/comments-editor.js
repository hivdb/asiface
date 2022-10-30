import React from 'react';
import PropTypes from 'prop-types';
import FileInput from 'icosa/components/file-input';
import Button from 'icosa/components/button';

import readFile from 'icosa/utils/read-file';
import {csvStringify, csvParse} from 'icosa/utils/csv';
import {makeDownload} from 'icosa/utils/download';
import useMounted from 'icosa/utils/use-mounted';

import style from './style.module.scss';


function commentsToCSV(comments) {
  const header = [
    'id',
    'gene',
    'drugClass',
    'text',
    'sortTag',
    'conditionType',
    'condition',
    'date'
  ];
  return [
    csvStringify(header),
    ...comments.map(
      comment => csvStringify(comment, {header})
    )
  ].join('\n');
}


function normDate(date) {
  const match = /^([1-9]|10|11|12)\/([12]?[1-9]|30|31)\/(\d\d)$/.exec(date);
  if (match) {
    let [, day, month, year] = match;
    const century = Math.floor(new Date().getFullYear() / 100) * 100;
    year = century + Number.parseInt(year);
    month = month.length === 1 ? `0${month}` : month;
    day = day.length === 1 ? `0${day}` : day;
    return `${year}-${month}-${day}`;
  }
  return date;
}


function validateComments(comments) {
  const allErrors = [];
  const uniqCmtIds = {};
  for (let rowId = 0; rowId < comments.length; rowId ++) {
    const comment = comments[rowId];
    const errors = [];

    /* gene */
    if (!comment.gene) {
      errors.push(`column 'gene' is empty`);
    }

    /* condition */
    if (!comment.condition) {
      errors.push(`column 'condition' is empty`);
    }

    /* comment ID */
    if (!comment.id) {
      comment.id = `${comment.gene}${comment.condition}`;
    }
    if (comment.id in uniqCmtIds) {
      errors.push(`duplicated comment ID '${
        comment.id
      }' already used at row ${uniqCmtIds[comment.id] + 2 }`);
    }
    else {
      uniqCmtIds[comment.id] = rowId;
    }

    /* text */
    if (!comment.text) {
      errors.push(`column 'text' is empty`);
    }

    /* conditionType */
    if (!comment.conditionType) {
      errors.push(`column 'conditionType' is empty`);
    }
    else if (!(['MUTATION', 'DRUGLEVEL'].includes(comment.conditionType))) {
      errors.push(
        `column 'conditionType' can only be 'MUTATION' or 'DRUGLEVEL'`
      );
    }

    /* date */
    if (!comment.date) {
      errors.push(`column 'date' is empty`);
    }
    comment.date = normDate(comment.date);
    if (errors.length > 0) {
      allErrors.push(`Row ${rowId + 2}: ${errors.join('; ')}`);
    }
  }
  return [comments, allErrors];
}


export function csvToComments(csvComments) {
  return csvParse(csvComments);
}


CommentsEditor.propTypes = {
  fileNamePrefix: PropTypes.string.isRequired,
  comments: PropTypes.arrayOf(
    PropTypes.shape({
      id: PropTypes.string,
      gene: PropTypes.string,
      drugClass: PropTypes.string,
      text: PropTypes.string,
      sortTag: PropTypes.string,
      conditionType: PropTypes.oneOf(['MUTATION', 'DRUGLEVEL']),
      condition: PropTypes.string,
      date: PropTypes.string
    }).isRequired
  ).isRequired,
  onChange: PropTypes.func.isRequired
};

export default function CommentsEditor({fileNamePrefix, comments, onChange}) {

  const isMounted = useMounted();

  const [sanitizedComments, errors] = React.useMemo(
    () => validateComments(comments),
    [comments]
  );

  const handleUpload = React.useCallback(
    async ([file]) => {
      if (!file || !(/^text\/.+$/.test(file.type))) {
        return;
      }
      const csvComments = await readFile(file);
      if (isMounted()) {
        onChange(csvToComments(csvComments));
      }
    },
    [onChange, isMounted]
  );

  const handleDownload = React.useCallback(
    () => {
      const csvComments = commentsToCSV(sanitizedComments);
      makeDownload(`${fileNamePrefix}-comments.csv`, 'text/csv', csvComments);
    },
    [fileNamePrefix, sanitizedComments]
  );

  return (
    <div className={style['comments-editor']}>
      <div className={style['option-row']}>
        <label htmlFor="comments-input">Comments CSV:</label>
        <FileInput
         hideSelected
         btnSize="small"
         id="comments-input"
         name="comments-input"
         className={style['comments-input']}
         onChange={handleUpload}
         accept="*.csv">
          Upload
        </FileInput>
        <Button
         btnSize="small"
         btnStyle="default"
         id="comments-output"
         name="comments-output"
         className={style['comments-output']}
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
