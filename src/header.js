import React from 'react';
import PropTypes from 'prop-types';
import Select from 'icosa/components/select';
import readFile from 'icosa/utils/read-file';
import FileInput from 'icosa/components/file-input';

import {ReactComponent as Logo} from './logo.svg';
import style from './style.module.scss';

export function useFetchAndSet(setValue) {
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
          .then(payload => mounted.current && setValue(payload)));
    },
    [setValue]
  );

}

PreloadSelector.propTypes = {
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

export default function PreloadSelector({preloads, onChange}) {

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

  const fetchAndSet = useFetchAndSet(onChange);

  const handleChange = React.useCallback(
    opt => fetchAndSet(opt.url),
    [fetchAndSet]
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
        .then(xml => mounted.current && onChange(xml));
    },
    [onChange]
  );

  React.useEffect(
    () => {
      mounted.current = true;
      return () => mounted.current = false;
    },
    []
  );

  return (
    <div className={style['asiface-cell-preload-selector']}>
      <h1><Logo /></h1>
      <Select
       isSearchable
       options={grouppedOptions}
       className={style['asi-preload-dropdown']}
       name="asi-preload"
       classNamePrefix="asi-preload-dropdown"
       placeholder="Select a preloaded XML"
       onChange={handleChange} />
      <span className={style.or}>or</span>
      <FileInput
       name="asi-custom"
       accept={
         "application/x-gzip,text/xml,application/xml,.xml,.xml.gz"
       }
       onChange={handleFileSelect} />
    </div>
  );
}
