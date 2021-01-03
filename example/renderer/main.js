'use strict';

import React from 'react';
import ReactDOM from 'react-dom';

import 'antd/dist/antd.css';
import StatusBoard from '../../src/index.jsx';

const container = document.querySelector('#app');

ReactDOM.render((
  <StatusBoard />
), container);
