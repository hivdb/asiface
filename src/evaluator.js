import React from 'react';
import PropTypes from 'prop-types';
import Button from 'icosa/components/button';

import ASIJs from './asi-js';
import style from './style.module.scss';


function splitMutations(mutations) {
  return Object.entries(
    mutations
      .split(/[,;+\s]+/g)
      .reduce((acc, geneMut) => {
        const [gene, mut] = geneMut.split(':', 2);
        acc[gene] = acc[gene] || [];
        acc[gene].push(mut);
        return acc;
      }, {})
  ).map(([gene, mutations]) => ({gene, mutations}));
}


ASIEvaluator.propTypes = {
  mutations: PropTypes.string,
  asiXml: PropTypes.string
};

export default function ASIEvaluator({mutations, asiXml}) {

  const evaluatorRef = React.useRef();
  const [geneResults, setGeneResults] = React.useState(null);

  const geneMuts = React.useMemo(
    () => mutations ? splitMutations(mutations) : [],
    [mutations]
  );

  const handleRefresh = React.useCallback(
    () => {
      if (!asiXml) {
        return [];
      }
      const asi = new ASIJs(asiXml);
      setGeneResults(
        geneMuts.map(
          ({gene, mutations}) => asi.evaluateGene(gene, mutations)
        )
      );
      evaluatorRef.current.scrollTop = 0;
    },
    [asiXml, geneMuts]
  );

  return <div ref={evaluatorRef} className={style['asiface-cell-evaluator']}>
    <pre>
      {JSON.stringify(geneResults, null, 2)}
    </pre>
    <Button
     className={style['evaluate-button']}
     btnStyle="primary"
     btnSize="xlarge"
     onClick={handleRefresh}>
      Evaluate
    </Button>
  </div>;
}
