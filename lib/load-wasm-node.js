'use strict';

const addWasmMemoryViews = require('./add-wasm-memory-views.js');

const loadWasmNode = async ($, stream) => {
  const resp = new Response(stream, {
    headers: {'Content-Type': 'application/wasm'}
  });
  const wasmInst = await WebAssembly.instantiateStreaming(resp, {env: $.env});
  $.wasmInstance = wasmInst.instance;
  addWasmMemoryViews($);
};

module.exports = loadWasmNode;
