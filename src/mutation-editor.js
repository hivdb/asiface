import React from 'react';
import PropTypes from 'prop-types';

import style from './style.module.scss';

MutationEditor.propTypes = {
  children: PropTypes.string,
  onChange: PropTypes.func.isRequired
};

export default function MutationEditor({children, onChange}) {
  const handleChange = React.useCallback(
    evt => onChange(evt.currentTarget.value),
    [onChange]
  );

  return (
    <div className={style['asiface-cell-mutation-editor']}>
      <strong>Enter mutations:</strong>
      <textarea
       onChange={handleChange}
       value={children || ''}
      />
    </div>
  );
}
