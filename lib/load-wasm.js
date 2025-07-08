'use strict';

const addWasmMemoryViews = require('./add-wasm-memory-views.js');

const loadWasm = async ($, stream) => {
  const url = 'data:application/wasm;base64,' + stream;
  const resp = fetch(url);

  const wasmInst = await WebAssembly.instantiateStreaming(resp, {env: $.env});
  $.wasmInstance = wasmInst.instance;
  $.memory = wasmInst.instance.exports.memory;
  addWasmMemoryViews($);
};

module.exports = loadWasm;
