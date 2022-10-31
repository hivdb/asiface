import React from 'react';
import PropTypes from 'prop-types';
import Button from 'icosa/components/button';
import CheckboxInput from 'icosa/components/checkbox-input';
import {makeDownload} from 'icosa/utils/download';

import ASILoader from './asi-loader';
import {ReactComponent as Logo} from './logo.svg';
import style from './style.module.scss';


Header.propTypes = {
  autoSave: PropTypes.bool.isRequired,
  asiXml: PropTypes.string,
  asiFileName: PropTypes.string,
  preloads: PropTypes.arrayOf(
    PropTypes.shape({
      family: PropTypes.string.isRequired,
      version: PropTypes.string.isRequired,
      date: PropTypes.string.isRequired,
      url: PropTypes.string.isRequired
    }).isRequired
  ).isRequired,
  onChange: PropTypes.func.isRequired
};

export default function Header({
  autoSave,
  asiXml,
  asiFileName,
  preloads,
  onChange
}) {

  const mounted = React.useRef();

  const handleToggleAutoSave = React.useCallback(
    event => onChange({
      autoSave: event.currentTarget.checked
    }),
    [onChange]
  );

  const handleSave = React.useCallback(
    () => makeDownload(asiFileName, 'application/xml', asiXml),
    [asiXml, asiFileName]
  );

  React.useEffect(
    () => {
      mounted.current = true;
      return () => mounted.current = false;
    },
    []
  );

  return (
    <header className={style['asiface-header']}>
      <h1><Logo /></h1>
      <ASILoader preloads={preloads} onChange={onChange} />
      {asiXml ? <Button
       name="asi-save"
       onClick={handleSave}
       className={style['asi-save']}>
        Save XML
      </Button> : null}
      <CheckboxInput
       id="asi-auto-save"
       className={style['asi-auto-save-checkbox']}
       onChange={handleToggleAutoSave}
       checked={autoSave}>
        Auto save
      </CheckboxInput>
    </header>
  );
}
