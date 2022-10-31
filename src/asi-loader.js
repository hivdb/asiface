import React from 'react';
import PropTypes from 'prop-types';
import Select from 'icosa/components/select';
import readFile from 'icosa/utils/read-file';
import FileInput from 'icosa/components/file-input';
import useMounted from 'icosa/utils/use-mounted';

import style from './style.module.scss';


ASILoader.propTypes = {
  allowClear: PropTypes.bool,
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

export default function ASILoader({
  allowClear,
  preloads,
  onChange
}) {
  const [curOpt, setCurOpt] = React.useState(null);
  const isMounted = useMounted();

  const options = React.useMemo(
    () => [
      ...(allowClear ? [{value: 'clear', label: 'Clear'}] : []),
      ...(preloads ? preloads.map(
        ({family, version, date, url}) => ({
          value: `${family}_${version}`,
          label: `${family} ${version} (${date})`,
          group: family,
          url
        })
      ) : []
      )
    ],
    [allowClear, preloads]
  );

  const handleSelect = React.useCallback(
    opt => {
      if (opt.value === 'clear') {
        onChange({asiXml: null});
        setCurOpt(null);
      }
      else {
        onChange({url: opt.url});
        setCurOpt(opt);
      }
    },
    [onChange]
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
          if (isMounted()) {
            onChange({
              asiXml: xml,
              asiFileName: file.name
            });
          }
        });
    },
    [onChange, isMounted]
  );

  return <>
    <Select
     isSearchable
     options={grouppedOptions}
     className={style['asi-preload-dropdown']}
     name="asi-preload"
     classNamePrefix="asi-preload-dropdown"
     placeholder="Select a preloaded XML"
     value={curOpt}
     onChange={handleSelect} />
    <span className={style.or}>or</span>
    <FileInput
     name="asi-custom"
     accept={
       "application/x-gzip,text/xml,application/xml,.xml,.xml.gz"
     }
     onChange={handleFileSelect} />
  </>;
}
