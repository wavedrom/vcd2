'use strict';

const fs = require('fs');
const path = require('path');
const childProcess = require('child_process');

const staticClangOpts = [
  '-std=c99', // should I use c11 ?
  '-Wall',
  '-Werror',
  '-Os',
  '-flto',
  '-pthread',
  '--target=wasm32',
  '--no-standard-libraries',
  // '-fsanitize=address',
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
  '-Wl,--export=chunk'
  // '-I.',
];

const runClangWasm = (inputs, output, opts) => new Promise((resolve /* , reject */) => {
  inputs = inputs.map(p => path.resolve(p));
  output = path.resolve(output);

  const clangOpts = [...staticClangOpts, '-o', output, ...inputs];
  const clang = childProcess.spawn('clang', clangOpts);

  clang.stdout.on('data', (data) => {
    console.log(`stdout: ${data}`);
  });

  clang.stderr.on('data', (data) => {
    console.error(`stderr: ${data}`);
  });

  clang.on('close', async () => {
    if (opts.verbose) {
      console.log('\nrun clang-wasm');
      // console.log('clang-18', clangOpts.join(' '));
      for (const input of inputs) {
        console.log(input, (await fs.promises.stat(input)).size);
      }
      console.log(output, (await fs.promises.stat(output)).size);
    }
    resolve();
  });

});

module.exports = runClangWasm;

/* eslint no-console: 0 */
