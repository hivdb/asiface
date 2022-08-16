import React from 'react';
import PropTypes from 'prop-types';

import style from './style.module.scss';

ResizeBar.propTypes = {
  onChange: PropTypes.func.isRequired,
  direction: PropTypes.oneOf(['horizontal', 'vertical']).isRequired
};

export default function ResizeBar({onChange, direction}) {

  const barRef = React.useRef();
  const [isDragging, setIsDragging] = React.useState(false);

  const handleMouseDown = React.useCallback(() => setIsDragging(true), []);
  const handleMouseUp = React.useCallback(() => setIsDragging(false), []);
  const attrClientX = direction === 'horizontal' ? 'clientX' : 'clientY';
  const attrOffsetWidth =
    direction === 'horizontal' ? 'offsetWidth' : 'offsetHeight';
  const attrOffsetLeft =
    direction === 'horizontal' ? 'offsetLeft' : 'offsetTop';

  const handleMouseMove = React.useCallback(
    evt => {
      if (isDragging) {
        const self = barRef.current;
        const parent = self.parentElement;
        const clientX = evt[attrClientX];
        const containerOffsetWidth = parent[attrOffsetWidth];
        const containerOffsetLeft = parent[attrOffsetLeft];
        onChange(Math.min(
          1,
          (clientX - containerOffsetLeft) / containerOffsetWidth
        ));
        evt.preventDefault() && evt.stopPropagation();
      }
    },
    [attrClientX, attrOffsetLeft, attrOffsetWidth, isDragging, onChange]
  );

  React.useEffect(
    () => {
      window.addEventListener('mousemove', handleMouseMove, false);
      window.addEventListener('mouseup', handleMouseUp, false);

      return () => {
        window.removeEventListener('mousemove', handleMouseMove, false);
        window.removeEventListener('mouseup', handleMouseUp, false);
      };
    },
    [handleMouseMove, handleMouseUp]
  );

  return (
    <div
     ref={barRef}
     onMouseDown={handleMouseDown}
     data-direction={direction}
     className={style['asiface-resize-bar']} />
  );
}
