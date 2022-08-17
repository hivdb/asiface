import React from 'react';
import sortBy from 'lodash/sortBy';
import PropTypes from 'prop-types';


export function sortMutations(mutations) {
  return sortBy(mutations, mut => {
    const match = /^[A-Zdi]?(\d+)[A-Zdi]+$/.exec(mut);
    return Number.parseInt(match[1]);
  });
}


Mutations.propTypes = {
  mutations: PropTypes.arrayOf(
    PropTypes.string.isRequired
  )
};

export default function Mutations({mutations}) {
  const sortedMutations = React.useMemo(
    () => sortMutations(mutations),
    [mutations]
  );
  return <div>{sortedMutations.join(', ') || <em>None</em>}</div>;
}
