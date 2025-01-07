#!/usr/bin/env node
'use strict';

const cp = require('child_process');
const fs = require('fs');
// const process = require('process');
// const path = require('path');

// const commander = require('commander');
// const chokidar = require('chokidar');

const options = [
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
  '-o', './app/vcd.wasm',
  './src/vcd_parser.c',
  './src/vcd_wasm.c'
];

const build = () => {
  const clang = cp.spawn('clang-18', options);
  clang.stdout.on('data', (data) => {
    console.log(`stdout: ${data}`);
  });

  clang.stderr.on('data', (data) => {
    console.error(`stderr: ${data}`);
  });
  clang.on('close', () => {
    const wasmName = './app/vcd.wasm';
    fs.stat(wasmName, (err, stats) => {
      if (err) {
        console.log('clang-18 ' + options.join(' '));
        throw new Error(err);
      }
      console.log(wasmName, stats.size);
    });
  });
};

// const watch = async () => {
//   console.log('clang', options.join(' '));
//   // One-liner for current directory

//   const watcher = chokidar.watch([
//     'vcd_parser.h',
//     'vcd_parser.c',
//   ]);
//   watcher.on('all', (event, fileName) => {
//     build();
//   });
// };

build();
