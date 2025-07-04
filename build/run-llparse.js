'use strict';

const fs = require('fs');
const path = require('path');

const vcdLlparse = require('./vcd-llparse.js');
const props = require('../lib/props.js');

const runLlparse = async (outputPath, opts) => {
  const prj = 'vcd_parser';
  const artifacts = vcdLlparse(prj, props);
  const oh = path.resolve(outputPath, prj + '.h');
  const oc = path.resolve(outputPath, prj + '.c');
  await fs.promises.writeFile(oh, artifacts.header, 'utf8');
  await fs.promises.writeFile(oc, artifacts.c, 'utf8');
  if (opts.verbose) {
    console.log('\nrun llparse');
    console.log(oh, (await fs.promises.stat(oh)).size);
    console.log(oc, (await fs.promises.stat(oc)).size);
  }
  // fs.writeFileSync('verilog_preprocessor.bc', artifacts.bitcode);
  // const dot = new llparseDot.Dot();
  // fs.writeFileSync(prj + '.dot', dot.build(declaration));
};

module.exports = runLlparse;

/* eslint no-console: 0 */
