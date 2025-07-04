'use strict';

const fs = require('fs');
const path = require('path');

const runWasm2js = async (input, output, opts) => {
  input = path.resolve(input);
  output = path.resolve(output);

  const data = await fs.promises.readFile(input);
  const dataStr = data.toString('base64');
  const jsStr = `'use strict';
module.exports = '${dataStr}';
`;
  await fs.promises.writeFile(output, jsStr, 'utf8');
  if (opts.verbose) {
    console.log('\nrun wasm2js');
    console.log(input,  (await fs.promises.stat(input)).size);
    console.log(output, (await fs.promises.stat(output)).size);
  }
};

module.exports = runWasm2js;

/* eslint no-console: 0 */
