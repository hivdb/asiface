import React from 'react';
import {
  BrowserProtocol,
  queryMiddleware
} from 'farce';
import {
  createFarceRouter,
  createRender,
  makeRouteConfig,
  resolver,
  Route
} from 'found';

import ReactDOM from 'react-dom/client';
import './index.module.scss';
import ASIFace from './asiface';
import config from './testingConfig';
import reportWebVitals from './reportWebVitals';

const routes = (
  <Route
   path="/"
   render={
     (props) => <ASIFace {...props} config={config} />
   } />
);

const Router = createFarceRouter({
  historyProtocol: new BrowserProtocol(),
  historyMiddlewares: [queryMiddleware],
  routeConfig: makeRouteConfig(routes),
  render: createRender({})
});

const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(
  <React.StrictMode>
    <Router resolver={resolver} />
  </React.StrictMode>
);

// If you want to start measuring performance in your app, pass a function
// to log results (for example: reportWebVitals(console.log))
// or send to an analytics endpoint. Learn more: https://bit.ly/CRA-vitals
reportWebVitals();
