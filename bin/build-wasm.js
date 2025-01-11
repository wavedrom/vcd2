#!/usr/bin/env node
'use strict';

const childProcess = require('child_process');
const process = require('process');
const fs = require('fs');

const commander = require('commander');
const chokidar = require('chokidar');

const clangOptions = (args, opts) => [
  '-std=c11',
  '-Os',
  '-flto',
  '-pthread',
  '--target=wasm32',
  '--no-standard-libraries',
  '--sysroot', '.',
  '-mbulk-memory',
  // https://lld.llvm.org/WebAssembly.html
  '-Wl,--shared-memory',
  '-Wl,--export-memory',
  '-Wl,--import-memory',
  '-Wl,--initial-memory=' + 0x1000000, // 16MiB
  '-Wl,--max-memory=' + 0x100000000, // 4GiB'
  '-Wl,--no-entry',
  '-Wl,--export=init',
  '-Wl,--export=chunk',
  '-Isrc',
  '-o', opts.output,
  ...args
];

const compile = (opts, clangOpts) => {
  const clang = childProcess.spawn('clang-18', clangOpts);
  clang.stdout.on('data', (data) => {
    console.log(`stdout: ${data}`);
  });

  clang.stderr.on('data', (data) => {
    console.error(`stderr: ${data}`);
  });
  clang.on('close', () => {
    fs.stat(opts.output, (err, stats) => {
      if (err) {
        console.log('clang-18 ' + clangOpts.join(' '));
        throw new Error(err);
      }
      if (opts.verbose) {
        console.log(opts.output, stats.size);
      }
    });
  });
};

function increaseVerbosity(dummyValue, previous) {
  return previous + 1;
}

const build = async () => {
  const program = new commander.Command();

  program
    .option('-v, --verbose', 'verbosity that can be increased', increaseVerbosity, 0)
    .option('-w, --watch', 'keep watching for source file changes')
    .requiredOption('-o, --output <file>', 'output WASM file path')
    .argument('<files...>', 'GLOB expressions or source file names')
    .parse(process.argv);

  const args = program.args;
  const opts = program.opts();
  const clangOpts = clangOptions(args, opts);

  if (opts.watch) {
    const watcher = chokidar.watch(args, {
      ignored: /(^|[/\\])\../, // ignore dotfiles
      persistent: true
    });
    watcher.on('change', async (filename) => {
      if (opts.verbose) {
        process.stdout.write(`File ${filename} changed : `);
      }
      compile(opts, clangOpts);
    });
  } else {
    compile(opts, clangOpts);
  }
};

build();
