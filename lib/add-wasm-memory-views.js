'use strict';

const addWasmMemoryViews = ($) => {
  const mem = $.wasmInstance.exports.memory;
  $.memU8 = new Uint8Array(mem.buffer);
  $.memU32 = new Uint32Array(mem.buffer);
  $.memI32 = new Int32Array(mem.buffer);
  $.memU64 = new BigUint64Array(mem.buffer);
  $.memI64 = new BigInt64Array(mem.buffer);
  return mem;
};

module.exports = addWasmMemoryViews;
