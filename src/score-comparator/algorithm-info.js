import React from 'react';
import PropTypes from 'prop-types';

import style from '../style.module.scss';


AlgorithmInfo.propTypes = {
  oldInfo: PropTypes.shape({
    ALGDATE: PropTypes.string.isRequired,
    ALGNAME: PropTypes.string.isRequired,
    ALGVERSION: PropTypes.string.isRequired
  }),
  newInfo: PropTypes.shape({
    ALGDATE: PropTypes.string.isRequired,
    ALGNAME: PropTypes.string.isRequired,
    ALGVERSION: PropTypes.string.isRequired
  })
};

export default function AlgorithmInfo({oldInfo, newInfo}) {

  return <div className={style['algorithm-info']}>
    {oldInfo && newInfo ? <>
      Modifies are compared between{' '}
      {oldInfo.ALGNAME} {oldInfo.ALGVERSION} ({oldInfo.ALGDATE})
      {' and '}
      {newInfo.ALGNAME} {newInfo.ALGVERSION} ({newInfo.ALGDATE}).
    </> : null}
  </div>;
}
