import React from 'react';
import PropTypes from 'prop-types';
import createLocationState from 'icosa/utils/use-location-state';

import PreloadSelector, {useFetchAndSet} from './preload-selector';
import XMLEditor from './xml-editor';
import MutationEditor from './mutation-editor';
import Evaluator from './evaluator';
import ResizeBar from './resize-bar';

import style from './style.module.scss';

const useVerticalPcnt = createLocationState('vertical-pcnt');
const useHorizontalPcnt = createLocationState('horizontal-pcnt');

ASIFace.propTypes = {
  config: PropTypes.object.isRequired,
  height: PropTypes.string.isRequired
};

ASIFace.defaultProps = {
  height: '100vh'
};

export default function ASIFace({height, config}) {
  const [defaultPreload] = config.preloads;
  const [asiXml, setAsiXml] = React.useState(null);
  const [mutations, setMutations] = React.useState(config.mutations);
  const [verticalPcnt, setVerticalPcnt] = useVerticalPcnt(0.3);
  const [horizontalPcnt, setHorizontalPcnt] = useHorizontalPcnt(0.7);

  const fetchAndSet = useFetchAndSet(setAsiXml);

  React.useEffect(
    () => fetchAndSet(defaultPreload.url),
    [defaultPreload.url, fetchAndSet]
  );

  return (
    <div
     className={style['asiface-grid']}
     style={{
       '--height': height,
       '--vertical-pcnt': `${verticalPcnt * 100}%`,
       '--horizontal-pcnt': `${horizontalPcnt * 100}%`
     }}>
      <PreloadSelector preloads={config.preloads} onChange={setAsiXml} />
      <XMLEditor onChange={setAsiXml}>{asiXml}</XMLEditor>
      <MutationEditor onChange={setMutations}>{mutations}</MutationEditor>
      <Evaluator asiXml={asiXml} mutations={mutations} />
      <ResizeBar
       percent={verticalPcnt}
       onChange={setVerticalPcnt}
       direction="vertical" />
      <ResizeBar
       percent={horizontalPcnt}
       onChange={setHorizontalPcnt}
       direction="horizontal" />
    </div>
  );
}
