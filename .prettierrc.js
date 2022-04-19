// .prettierrc.js
const { getPrettierConfig } = require('@applint/spec');

// getPrettierConfig(rule: 'common' | 'rax' | 'react' | 'vue', customConfig?: PrettierConfig);
module.exports = getPrettierConfig('react');
