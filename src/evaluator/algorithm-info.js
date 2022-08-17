import React from 'react';
import PropTypes from 'prop-types';

import style from '../style.module.scss';


AlgorithmInfo.propTypes = {
  ALGNAME_ALGVERSION: PropTypes.shape({
    ALGDATE: PropTypes.string.isRequired,
    ALGNAME: PropTypes.string.isRequired,
    ALGVERSION: PropTypes.string.isRequired
  })
};

export default function AlgorithmInfo({ALGNAME_ALGVERSION: alg}) {

  return <div className={style['algorithm-info']}>
    Report generated at {new Date().toLocaleString('en-US')}{' '}
    using {alg.ALGNAME} {alg.ALGVERSION} ({alg.ALGDATE})
  </div>;
}
