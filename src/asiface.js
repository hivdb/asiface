import React from 'react';
import PropTypes from 'prop-types';
import createLocationState from 'icosa/utils/use-location-state';

import Header, {useFetchAndSet} from './header';
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
  const [horizontalPcnt, setHorizontalPcnt] = useHorizontalPcnt(0.618);
  const [mobilePcnt1, setMobilePcnt1] = useVerticalPcnt(0.3);
  const [mobilePcnt2, setMobilePcnt2] = useHorizontalPcnt(0.5);

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
       '--horizontal-pcnt': `${horizontalPcnt * 100}%`,
       '--mobile-pcnt-1': `${mobilePcnt1 * 100}%`,
       '--mobile-pcnt-2': `${mobilePcnt2 * 100}%`
     }}>
      <Header
       asiXml={asiXml}
       preloads={config.preloads}
       onChange={setAsiXml} />
      <XMLEditor onChange={setAsiXml}>{asiXml}</XMLEditor>
      <MutationEditor onChange={setMutations}>{mutations}</MutationEditor>
      <Evaluator asiXml={asiXml} mutations={mutations} />
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
