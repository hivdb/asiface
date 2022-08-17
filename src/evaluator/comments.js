import React from 'react';
import PropTypes from 'prop-types';

import {commentShape} from './prop-types';
import style from './style.module.scss';


Comments.propTypes = {
  mutationComments: PropTypes.arrayOf(
    commentShape.isRequired
  ).isRequired,
  resultComments: PropTypes.arrayOf(
    PropTypes.shape({
      result: PropTypes.bool.isRequired,
      definitions: PropTypes.arrayOf(
        commentShape.isRequired
      ).isRequired
    }).isRequired
  ).isRequired
};

export default function Comments({
  mutationComments,
  resultComments
}) {
  const hasComment = mutationComments.length > 0 ||
    resultComments.some(({result}) => result);
  return <section className={style['comments']}>
    <h3>Mutation & drug-level comments</h3>
    {hasComment ?
      <ul>
        {mutationComments.map(({id, text}) => (
          <li key={id}>{text}</li>
        ))}
        {resultComments
          .filter(({result}) => result)
          .map(({definitions}) => definitions.map(
            ({id, text}) => <li key={id}>
              {text}
            </li>
          ))}
      </ul> :
      <div><em>None</em></div>}
  </section>;
}
