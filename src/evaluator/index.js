import React from 'react';
import PropTypes from 'prop-types';
import Button from 'icosa/components/button';

import ASIJs from 'asi_interpreter';
import style from '../style.module.scss';

import AlgorithmInfo from './algorithm-info';
import EvaluatedGene from './evaluated-gene';


function splitMutations(mutations) {
  return mutations.split(/[,;+\s]+/g);
}


ASIEvaluator.propTypes = {
  mutations: PropTypes.string,
  asiXml: PropTypes.string
};

export default function ASIEvaluator({mutations, asiXml}) {

  const evaluatorRef = React.useRef();
  const [algorithmInfo, setAlgorithmInfo] = React.useState(null);
  const [geneResults, setGeneResults] = React.useState(null);
  const [error, setError] = React.useState(null);

  const mutList = React.useMemo(
    () => mutations ? splitMutations(mutations) : [],
    [mutations]
  );

  const handleRefresh = React.useCallback(
    () => {
      if (!asiXml) {
        setError('ASI XML is empty');
        return [];
      }
      try {
        const asi = new ASIJs(asiXml);
        setError(null);
        const geneResults = asi.evaluate(mutList);
        const algInfo = asi.getAlgorithmInfo();
        setGeneResults(geneResults);
        setAlgorithmInfo(algInfo);
      }
      catch (err) {
        setError(err.message);
        setGeneResults(null);
        setAlgorithmInfo(null);
        if (process.env.NODE_ENV !== 'production') {
          console.error(err.stack);
        }
      }
      evaluatorRef.current.scrollTop = 0;
    },
    [asiXml, mutList]
  );

  return <div ref={evaluatorRef} className={style['asiface-cell-evaluator']}>
    {error ? <div className={style['evaluator-error']}>
      {error}
    </div> : null}
    {algorithmInfo ?
      <AlgorithmInfo {...algorithmInfo} /> : null}
    {geneResults ?
      geneResults.map(
        geneResult => (
          <EvaluatedGene
           key={geneResult.geneName}
           algorithmInfo={algorithmInfo}
           {...geneResult} />
        )
      ) : null}
    <div className={style['ending']} />
    <Button
     className={style['evaluate-button']}
     btnStyle="primary"
     btnSize="xlarge"
     onClick={handleRefresh}>
      Evaluate
    </Button>
  </div>;
}
