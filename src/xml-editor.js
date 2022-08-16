import React from 'react';
import PropTypes from 'prop-types';
import Editor from "@monaco-editor/react";

import style from './style.module.scss';

XMLEditor.propTypes = {
  children: PropTypes.string,
  onChange: PropTypes.func.isRequired
};

export default function XMLEditor({children, onChange}) {
  return (
    <div className={style['asiface-cell-xml-editor']}>
      <Editor
       language="xml"
       onChange={onChange}
       value={children}
      />
    </div>
  );
}
