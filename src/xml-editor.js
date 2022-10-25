import React from 'react';
import PropTypes from 'prop-types';
import Editor from "@monaco-editor/react";
import {Tab, Tabs, TabList, TabPanel} from 'react-tabs';

import VisualEditor from './visual-editor';

import style from './style.module.scss';

XMLEditor.propTypes = {
  fileName: PropTypes.string.isRequired,
  children: PropTypes.string,
  onChange: PropTypes.func.isRequired
};

export default function XMLEditor({fileName, children, onChange}) {

  const [selectedIndex, setSelectedIndex] = React.useState(0);

  return (
    <div className={style['asiface-cell-xml-editor']}>
      <Tabs
       onSelect={setSelectedIndex}
       selectedIndex={selectedIndex}>
        <TabList>
          <Tab>Source XML</Tab>
          <Tab>Spreadsheets</Tab>
        </TabList>
        <TabPanel>
          <Editor
           language="xml"
           onChange={onChange}
           value={children} />
        </TabPanel>
        <TabPanel>
          <VisualEditor
           fileName={fileName}
           value={children}
           onChange={onChange} />
        </TabPanel>
      </Tabs>
    </div>
  );
}
