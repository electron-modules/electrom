import React from 'react';
import ReactDOM from 'react-dom';

import 'antd/dist/antd.css';

import StatusBoard from '../../src/index.jsx';

const container = document.querySelector('#app');

const params = new URLSearchParams(location.search);

ReactDOM.render(<StatusBoard eventChannelName={params.get('MONITOR_EVENT_CHANNEL_NAME')} />, container);
