import React from 'react';
import PropTypes from 'prop-types';
import useMounted from 'icosa/utils/use-mounted';
import createLocationState from 'icosa/utils/use-location-state';
import createPersistedState from 'use-persisted-state/src';

import Header from './header';
import XMLEditor from './xml-editor';
import usePatternsLoader from './patterns-loader';
// import Evaluator from './evaluator';
import ScoreComparator from './score-comparator';
import ResizeBar from './resize-bar';

import style from './style.module.scss';

const useVerticalPcnt = createLocationState('vertical-pcnt');
const useHorizontalPcnt = createLocationState('horizontal-pcnt');
const useAsiXml = createPersistedState('asi-xml');
const useAsiFileName = createPersistedState('asi-file-name');
const useAutoSave = createPersistedState('asi-auto-save');


function getFileName(url) {
  return url.split('/').slice(-1)[0];
}


ASIFace.propTypes = {
  config: PropTypes.object.isRequired,
  height: PropTypes.string.isRequired
};

ASIFace.defaultProps = {
  height: '100vh'
};

export default function ASIFace({height, config}) {
  const [defaultPreload] = config.preloads;
  const [
    patterns,
    patternsLoader
  ] = usePatternsLoader(config.defaultPatternsURL);
  const [verticalPcnt, setVerticalPcnt] = useVerticalPcnt(0.05);
  const [horizontalPcnt, setHorizontalPcnt] = useHorizontalPcnt(0.618);
  const [mobilePcnt1, setMobilePcnt1] = useVerticalPcnt(0.3);
  const [mobilePcnt2, setMobilePcnt2] = useHorizontalPcnt(0.5);

  const [autoSave, setAutoSave] = useAutoSave(true);
  const [asiXml, setAsiXml] = useAsiXml(null);
  const [asiFileName, setAsiFileName] = useAsiFileName(null);

  const isMounted = useMounted();

  const fetchAndSet = React.useCallback(
    async (url) => {
      const resp = await fetch(url);
      const xml = await resp.text();
      if (isMounted()) {
        setAsiXml(xml);
        setAsiFileName(getFileName(url));
      }
    },
    [isMounted, setAsiXml, setAsiFileName]
  );

  React.useEffect(
    () => {
      if (!autoSave || !asiXml) {
        fetchAndSet(defaultPreload.url);
      }
    },
    [/* eslint-disable-line react-hooks/exhaustive-deps */]
  );

  const handleChange = React.useCallback(
    ({url, asiXml, asiFileName, autoSave}) => {
      if (url) {
        fetchAndSet(url);
      }
      else if (autoSave !== undefined) {
        setAutoSave(autoSave);
      }
      else {
        if (asiXml !== undefined) {
          setAsiXml(asiXml);
        }
        if (asiFileName !== undefined) {
          setAsiFileName(asiFileName);
        }
      }
    },
    [fetchAndSet, setAsiXml, setAsiFileName, setAutoSave]
  );

  return (
    <div
     className={style['asiface-grid']}
     style={{
       '--height': height,
       '--vertical-pcnt': `${verticalPcnt * 100}%`,
       '--horizontal-pcnt': `${horizontalPcnt * 100}%`,
       '--mobile-pcnt-1': `${mobilePcnt1 * 100}%`,
       '--mobile-pcnt-2': `${mobilePcnt2 * 100}%`
     }}>
      <Header
       autoSave={autoSave}
       asiXml={asiXml}
       asiFileName={asiFileName}
       preloads={config.preloads}
       onChange={handleChange} />
      <XMLEditor fileName={asiFileName} onChange={setAsiXml}>
        {asiXml}
      </XMLEditor>
      {patternsLoader}
      {/*<Evaluator
       preloads={config.preloads}
       asiXml={asiXml}
       mutations={mutations} />*/}
      <ScoreComparator
       preloads={config.preloads}
       asiXml={asiXml}
       patterns={patterns} />
      <ResizeBar
       name="row-divider"
       onChange={setVerticalPcnt}
       direction="vertical" />
      <ResizeBar
       name="col-divider"
       onChange={setHorizontalPcnt}
       direction="horizontal" />
      <ResizeBar
       name="mobile-divider-1"
       onChange={setMobilePcnt1}
       direction="vertical" />
      <ResizeBar
       name="mobile-divider-2"
       onChange={setMobilePcnt2}
       direction="vertical" />
    </div>
  );
}
