#!/usr/bin/env node
'use strict';

const fs = require('fs');
const path = require('path');
const vcdLlparse = require('../lib/vcd-llparse.js');

const generate = () => {
  const prj = 'vcd_parser';
  const artifacts = vcdLlparse(prj);
  const srcPath = path.resolve(__dirname, '..', 'src');
  fs.writeFileSync(srcPath + '/' + prj + '.h', artifacts.header);
  // fs.writeFileSync('verilog_preprocessor.bc', artifacts.bitcode);
  fs.writeFileSync(srcPath + '/' + prj + '.c', artifacts.c);
  // const dot = new llparseDot.Dot();
  // fs.writeFileSync(prj + '.dot', dot.build(declaration));
};

generate();

/* eslint camelcase: 0 */
