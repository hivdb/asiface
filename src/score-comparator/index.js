import React from 'react';
import PropTypes from 'prop-types';
import Button from 'icosa/components/button';
import useMounted from 'icosa/utils/use-mounted';
import sha256 from 'crypto-js/sha256';
import encHex from 'crypto-js/enc-hex';

import ASIJs from 'asi_interpreter';
import style from '../style.module.scss';
import ASILoader from '../asi-loader';

import AlgorithmInfo from './algorithm-info';
import compareASIs from './compare-asis';
import ASIComparison from './asi-comparison';


ScoreComparator.propTypes = {
  preloads: PropTypes.array.isRequired,
  patterns: PropTypes.arrayOf(
    PropTypes.shape({
      gene: PropTypes.string.isRequired,
      drugClass: PropTypes.string.isRequired,
      pattern: PropTypes.arrayOf(PropTypes.string.isRequired).isRequired,
      count: PropTypes.number.isRequired
    }).isRequired
  ).isRequired,
  asiXml: PropTypes.string
};

export default function ScoreComparator({preloads, patterns, asiXml}) {

  const isMounted = useMounted();
  const evaluatorRef = React.useRef();
  const [oldAsiXml, setOldAsiXml] = React.useState(null);
  const [algorithmInfo, setAlgorithmInfo] = React.useState(null);
  const [oldAlgorithmInfo, setOldAlgorithmInfo] = React.useState(null);
  const [comparisonResults, setComparisonResults] = React.useState(null);
  const [error, setError] = React.useState(null);

  const handleOldAsiChange = React.useCallback(
    async ({asiXml, url}) => {
      if (asiXml !== undefined) {
        setOldAsiXml(asiXml);
      }
      else {
        const resp = await fetch(url);
        const xml = await resp.text();
        if (isMounted()) {
          setOldAsiXml(xml);
        }
      }
    },
    [isMounted]
  );

  const handleRefresh = React.useCallback(
    () => {
      if (!asiXml) {
        setError('ASI XML is empty');
        return;
      }
      if (!oldAsiXml) {
        setError('Old ASI XML is empty');
        return;
      }
      let errorTitle = 'New ASI';
      try {
        const asi = new ASIJs(asiXml);
        setAlgorithmInfo(asi.getAlgorithmInfo());
        errorTitle = 'Original ASI';
        const oldAsi = new ASIJs(oldAsiXml);
        setOldAlgorithmInfo(oldAsi.getAlgorithmInfo());
        errorTitle = 'Comparsion';
        setComparisonResults(compareASIs(oldAsi, asi, patterns));
        setError(null);
      }
      catch (err) {
        setError(`(${errorTitle}) ${err.message}`);
        setAlgorithmInfo(null);
        setOldAlgorithmInfo(null);
        return;
      }
    },
    [asiXml, oldAsiXml, patterns]
  );

  const cacheKey = React.useMemo(
    () => `${
      sha256(JSON.stringify(patterns)).toString(encHex)
    }-${
      sha256(oldAsiXml || '').toString(encHex)
    }-${
      sha256(asiXml || '').toString(encHex)
    }`,
    [patterns, oldAsiXml, asiXml]
  );

  return <div ref={evaluatorRef} className={style['asiface-cell-evaluator']}>
    {error ? <div className={style['evaluator-error']}>
      {error}
    </div> : null}
    <div className={style['old-asi-loader']}>
      <label>Original ASI:</label>
      <ASILoader allowClear preloads={preloads} onChange={handleOldAsiChange} />
      <Button
       btnStyle="primary"
       onClick={handleRefresh}>
        Compare
      </Button>
    </div>
    {oldAlgorithmInfo ?
      <AlgorithmInfo
       oldInfo={oldAlgorithmInfo?.ALGNAME_ALGVERSION}
       newInfo={algorithmInfo?.ALGNAME_ALGVERSION} /> : null}
    {comparisonResults ?
      <ASIComparison
       cacheKey={cacheKey}
       comparisonResults={comparisonResults} /> : null}
  </div>;
}
