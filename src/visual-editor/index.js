import React from 'react';
import PropTypes from 'prop-types';

import {H2} from 'icosa/components/heading-tags';

import CommentsEditor from './comments-editor';
import RulesEditor from './rules-editor';
import {
  commentsFromASI,
  rulesFromASI,
  updateASIComments,
  updateASIRules
} from './asi-parser';
import style from './style.module.scss';

VisualEditor.propTypes = {
  fileName: PropTypes.string,
  value: PropTypes.string,
  onChange: PropTypes.func.isRequired
};

export default function VisualEditor({fileName, value, onChange}) {

  const fileNamePrefix = React.useMemo(
    () => fileName.replace(/\.[^.]+$/, ''),
    [fileName]
  );
  const comments = React.useMemo(
    () => commentsFromASI(value),
    [value]
  );
  const dcRules = React.useMemo(
    () => rulesFromASI(value),
    [value]
  );

  const handleCommentsChange = React.useCallback(
    comments => onChange(updateASIComments(value, comments)),
    [value, onChange]
  );

  const handleRulesChange = React.useCallback(
    (drugClass, rules) => onChange(updateASIRules(value, drugClass, rules)),
    [value, onChange]
  );

  return (
    <div className={style['asi-visual-editor']}>
      <H2 disableAnchor>
        Editing {fileName}
      </H2>
      <CommentsEditor
       fileNamePrefix={fileNamePrefix}
       comments={comments}
       onChange={handleCommentsChange} />
      {dcRules.map(({drugClass, rules}) => <React.Fragment key={drugClass}>
        <hr />
        <RulesEditor
         drugClass={drugClass}
         fileNamePrefix={fileNamePrefix}
         rules={rules}
         onChange={handleRulesChange} />
      </React.Fragment>)}
    </div>
  );
}
