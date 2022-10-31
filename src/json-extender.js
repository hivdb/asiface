import React from 'react';
import maxBy from 'lodash/maxBy';
import PropTypes from 'prop-types';
import readFile from 'icosa/utils/read-file';
import FileInput from 'icosa/components/file-input';
import Button from 'icosa/components/button';
import {makeDownload} from 'icosa/utils/download';
import useMounted from 'icosa/utils/use-mounted';
import ASIJs from 'asi_interpreter';

import Header from './header';


function getFileName(url) {
  return url.split('/').slice(-1)[0];
}


export function useFetchAndSet(setAsiPayload) {
  const isMounted = useMounted();

  return React.useCallback(
    url => {
      fetch(url)
        .then(resp => resp.text()
          .then(xml => isMounted() && setAsiPayload({
            xml,
            fileName: getFileName(url)
          })));
    },
    [setAsiPayload, isMounted]
  );

}


JSONExtender.propTypes = {
  config: PropTypes.object.isRequired
};

export default function JSONExtender({config}) {
  const mounted = React.useRef();
  const [defaultPreload] = config.preloads;
  const [asiXml, setAsiXml] = React.useState(null);
  const [patterns, setPatterns] = React.useState(null);
  const [fileName, setFileName] = React.useState(null);
  const [error, setError] = React.useState(null);

  const fetchAndSet = useFetchAndSet(setAsiXml);

  React.useEffect(
    () => {
      mounted.current = true;
      return () => mounted.current = false;
    },
    []
  );

  const handleFileSelect = React.useCallback(
    ([file]) => {
      if (
        !file ||
        !(/^text\/.+$|^application\/(json|x-gzip)$|^$/.test(file.type))
      ) {
        return;
      }
      readFile(file)
        .then(json => {
          if (mounted.current) {
            setPatterns(JSON.parse(json));
            setFileName(file.name);
          }
        });
    },
    []
  );

  const asi = React.useMemo(
    () => {
      if (!asiXml) {
        setError('ASI XML is empty');
        return;
      }
      try {
        return new ASIJs(asiXml);
      }
      catch (err) {
        setError(err.message);
      }
      finally {
        setError(null);
      }
    },
    [asiXml]
  );

  const handleDownload = React.useCallback(
    () => {
      if (error) {
        alert(error);
        return;
      }
      if (!patterns) {
        alert('JSON file not selected');
      }
      const extendedPatterns = [];
      for (const pattern of patterns) {
        const mutations = pattern.pattern.split(/\s*\+\s*/g)
          .map(mut => `${pattern.gene}:${
            mut.replace('-', 'd').replace('_', 'i')
              .replace('*', 'Z')
          }`);
        const drugClass = pattern.drug_class;
        const result = asi.evaluate(mutations);
        for (const geneResult of result) {
          const dcResult = geneResult.drugClasses
            .find(({drugClassName: dc}) => dc === drugClass);
          if (!dcResult) {
            continue;
          }
          const extendedPattern = {...pattern};
          for (const {drugName, conditions} of dcResult.drugs) {
            extendedPattern[drugName] = maxBy(conditions, 'result').result;
          }
          extendedPatterns.push(extendedPattern);
        }
      }
      makeDownload(
        fileName,
        'application/json',
        JSON.stringify(extendedPatterns)
      );
    },
    [asi, error, fileName, patterns]
  );

  const algInfo = React.useMemo(
    () => {
      if (!asi) {
        return;
      }
      try {
        return asi.getAlgorithmInfo().ALGNAME_ALGVERSION;
      }
      catch (err) {
        setError(err.message);
      }
      finally {
        setError(null);
      }
    },
    [asi]
  );

  React.useEffect(
    () => fetchAndSet(defaultPreload.url),
    [defaultPreload.url, fetchAndSet]
  );

  return <main>
    <Header
     asiXml={asiXml}
     preloads={config.preloads}
     onChange={setAsiXml} />
    <br /><br />
    <div>
      {error ? `Error: ${error}` : 'ASI XML loaded: '}
      {algInfo ?
        `${algInfo.ALGNAME} ${algInfo.ALGVERSION} (${algInfo.ALGDATE})` :
        null}
    </div>
    <br />
    <div>
      <FileInput
       name="patterns-json"
       accept={
         "application/json"
       }
       onChange={handleFileSelect} />
    </div>
    <br />
    <div>
      <Button onClick={handleDownload}>
        Extend JSON
      </Button>
    </div>


    <div>{fileName}</div>
    <pre>
      {JSON.stringify(patterns, null, 2)}
    </pre>
  </main>;
}
