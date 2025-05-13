// New version Electron CLI passes the script directly to the internal Node VM
// without ensuring pre-transpilation with `-r ts-node/register/transpile-only`.
// This bootstrap file is a workaround then.
require('ts-node/register/transpile-only');
require('./main.ts');
