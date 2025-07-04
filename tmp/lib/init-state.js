'use strict';

const initState = ($, mem) => {
  $.memory = mem;
  $.memU8 = new Uint8Array(mem.buffer);
  $.memU32 = new Uint32Array(mem.buffer);
  $.memI32 = new Int32Array(mem.buffer);
  $.memU64 = new BigUint64Array(mem.buffer);
  $.memI64 = new BigInt64Array(mem.buffer);
};

module.exports = initState;
