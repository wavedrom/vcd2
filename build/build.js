#!/usr/bin/env node
'use strict';

const path = require('path');
const process = require('process');

const commander = require('commander');
const chokidar = require('chokidar');

const runLlparse = require('./run-llparse.js');
const runClangWasm = require('./run-clang-wasm.js');
const wasm2js = require('./run-wasm2js.js');

const run = async (opts) => {
  if (opts.verbose) {
    console.log('run');
  }
  await runLlparse('./', opts);
  await runClangWasm(['./vcd_parser.c', './vcd_wasm.c'], './vcd2.wasm', opts);
  await wasm2js('./vcd2.wasm', './vcd2.wasm.js', opts);
};

const build = async () => {
  const program = new commander.Command();

  program
    .option('-v, --verbose', 'verbosity that can be increased', (_, v) => v + 1, 0)
    .option('-w, --watch', 'keep watching for source file changes')
    .parse(process.argv);

  const opts = program.opts();

  await run(opts);

  if (opts.watch) {
    const fullWatchPoints = ['./vcd_wasm.c', './lib/']
      .map(p => path.resolve(p));

    const watcher = chokidar.watch(fullWatchPoints, {
      ignored: /(^|[/\\])\../, // ignore dotfiles
      persistent: true
    });
    watcher.on('change', async (filename) => {
      if (opts.verbose) {
        process.stdout.write(`File ${filename} changed : `);
      }
      await run(opts);
    });
  }
};

build();

/* eslint no-console: 0 */
