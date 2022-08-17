import React from 'react';
import PropTypes from 'prop-types';

import Mutations from './mutations';
import EvaluatedDrugClass from './evaluated-drug-class';
import Comments from './comments';
import style from './style.module.scss';


EvaluatedGene.propTypes = {
  geneName: PropTypes.string.isRequired,
  drugClasses: PropTypes.array.isRequired,
  mutationComments: PropTypes.array.isRequired,
  resultComments: PropTypes.array.isRequired,
  scoredMutations: PropTypes.arrayOf(
    PropTypes.string.isRequired
  ),
  algorithmInfo: PropTypes.object.isRequired
};

export default function EvaluatedGene({
  geneName,
  drugClasses,
  mutationComments,
  resultComments,
  scoredMutations,
  algorithmInfo
}) {
  return <section className={style['evaluated-gene']}>
    <h2>Gene: {geneName}</h2>
    <section className={style['scored-mutations']}>
      <h3>Scored mutations</h3>
      <Mutations mutations={scoredMutations} />
    </section>
    {drugClasses.map(
      drugClass => (
        <EvaluatedDrugClass
         key={drugClass.drugClassName}
         algorithmInfo={algorithmInfo}
         {...drugClass} />
      )
    )}
    <Comments {...{mutationComments, resultComments}} />
  </section>;
}
