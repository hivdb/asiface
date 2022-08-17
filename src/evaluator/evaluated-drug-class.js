import React from 'react';
import PropTypes from 'prop-types';

import DrugClassLevels from './drug-class-levels';
import DrugClassDetails from './drug-class-details';
import style from './style.module.scss';


EvaluatedDrugClass.propTypes = {
  algorithmInfo: PropTypes.object.isRequired,
  drugClassName: PropTypes.string.isRequired,
  drugs: PropTypes.array.isRequired
};

export default function EvaluatedDrugClass({
  drugClassName,
  drugs,
  algorithmInfo
}) {

  return <section className={style['evaluated-drug-class']}>
    <h3>Drug class: {drugClassName}</h3>

    <DrugClassLevels drugs={drugs} algorithmInfo={algorithmInfo} />
    <DrugClassDetails drugs={drugs} algorithmInfo={algorithmInfo} />
  </section>;
}
