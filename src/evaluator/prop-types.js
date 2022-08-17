import PropTypes from 'prop-types';

const levelShape = PropTypes.shape({
  order: PropTypes.number.isRequired,
  SIR: PropTypes.string.isRequired,
  text: PropTypes.string.isRequired
});

const commentShape = PropTypes.shape({
  id: PropTypes.string.isRequired,
  sort: PropTypes.number.isRequired,
  text: PropTypes.string.isRequired
});


export {levelShape, commentShape};
