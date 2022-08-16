import React from 'react';
import PropTypes from 'prop-types';

import PreloadSelector, {useFetchAndSet} from './preload-selector';
import XMLEditor from './xml-editor';
import MutationEditor from './mutation-editor';
import Evaluator from './evaluator';
import style from './style.module.scss';

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

  const fetchAndSet = useFetchAndSet(setAsiXml);

  React.useEffect(
    () => fetchAndSet(defaultPreload.url),
    [defaultPreload.url, fetchAndSet]
  );

  return (
    <div className={style['asiface-grid']} style={{'--height': height}}>
      <PreloadSelector preloads={config.preloads} onChange={setAsiXml} />
      <XMLEditor onChange={setAsiXml}>{asiXml}</XMLEditor>
      <MutationEditor onChange={setMutations}>{mutations}</MutationEditor>
      <Evaluator asiXml={asiXml} mutations={mutations} />
      <div className={style['asiface-gap-vertical']} />
      <div className={style['asiface-gap-horizontal']} />
    </div>
  );
}
