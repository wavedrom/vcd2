'use strict';

const loadWasm = require('../../lib/load-wasm.js');
const initVcdWorkerState = require('../../lib/init-vcd-worker-state.js');
const streamData = require('../../lib/stream-data.js');

const main = async () => {
  const t0 = Date.now();
  const $ = initVcdWorkerState();

  const handlers = {
    loadWasm: async () => {
      console.log('Loading Wasm');
      $.wasmInstance = (await loadWasm($, 'vcd.wasm')).instance;
      const mem = $.wasmInstance.exports.memory;
      $.memU8 = new Uint8Array(mem.buffer);
      $.memU32 = new Uint32Array(mem.buffer);
      $.memI32 = new Int32Array(mem.buffer);
      $.memU64 = new BigUint64Array(mem.buffer);
      $.memI64 = new BigInt64Array(mem.buffer);
      postMessage({cmd: 'wasmMemory', data: mem});
    },
    loadVcd: async (e) => {
      const t1 = Date.now();
      const stats = await streamData($, e.data.data);
      const t2 = Date.now();
      stats.tStream = t2 - t1;
      stats.tLoad = t1 - t0;
      stats[0] = 1000 * stats.totalLength / stats.tStream;
      console.log(stats);
      postMessage({cmd: 'loadVcdDone'});
    }
  };

  onmessage = async (e) => {
    if (
      (typeof e.data !== 'object') ||
      (e.data === null) ||
      (e.data.constructor.name !== 'Object')
    ) {
      console.log('UNKNOWN MSG', e);
    }
    const handler = handlers[e.data.cmd] || (async () => {
      console.log('UNKNOWN CMD', e.data);
    });
    await handler(e);
  };
};

main();

/* eslint-env worker */
