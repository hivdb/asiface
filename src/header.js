import React from 'react';
import PropTypes from 'prop-types';
import Select from 'icosa/components/select';
import readFile from 'icosa/utils/read-file';
import FileInput from 'icosa/components/file-input';
import Button from 'icosa/components/button';
import CheckboxInput from 'icosa/components/checkbox-input';
import {makeDownload} from 'icosa/utils/download';

import {ReactComponent as Logo} from './logo.svg';
import style from './style.module.scss';


function getFileName(url) {
  return url.split('/').slice(-1)[0];
}


export function useFetchAndSet(setAsiPayload) {
  const mounted = React.useRef();

  React.useEffect(
    () => {
      mounted.current = true;
      return () => mounted.current = false;
    },
    []
  );

  return React.useCallback(
    url => {
      fetch(url)
        .then(resp => resp.text()
          .then(xml => mounted.current && setAsiPayload({
            xml,
            fileName: getFileName(url)
          })));
    },
    [setAsiPayload]
  );

}


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

  const options = React.useMemo(
    () => preloads ? preloads.map(
      ({family, version, date, url}) => ({
        value: `${family}_${version}`,
        label: `${family} ${version} (${date})`,
        group: family,
        url
      })
    ) : [],
    [preloads]
  );

  const grouppedOptions = React.useMemo(
    () => Object.values(options
      .reduce(
        (acc, option) => {
          acc[option.group] = acc[option.group] || {
            label: option.group,
            options: []
          };
          acc[option.group].options.push(option);
          return acc;
        },
        {}
      )),
    [options]
  );

  const handleFileSelect = React.useCallback(
    ([file]) => {
      if (
        !file ||
        !(/^text\/.+$|^application\/(xml|x-gzip)$|^$/.test(file.type))
      ) {
        return;
      }
      readFile(file)
        .then(xml => {
          if (mounted.current) {
            onChange({
              asiXml: xml,
              asiFileName: file.name
            });
          }
        });
    },
    [onChange]
  );

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
      <Select
       isSearchable
       options={grouppedOptions}
       className={style['asi-preload-dropdown']}
       name="asi-preload"
       classNamePrefix="asi-preload-dropdown"
       placeholder="Select a preloaded XML"
       onChange={onChange} />
      <span className={style.or}>or</span>
      <FileInput
       name="asi-custom"
       accept={
         "application/x-gzip,text/xml,application/xml,.xml,.xml.gz"
       }
       onChange={handleFileSelect} />
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
