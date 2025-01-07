'use strict';

const loadWasm = async ($, fileName) => {
  return await WebAssembly.instantiateStreaming(fetch(fileName), {
    env: {
      abort: () => { console.error('Abort!'); },
      consoleLog: (val) => { console.log(val); },
      endDefinitions: $.endDefinitions,
      onCommand: $.genOnCommand,
      onTimeStamp: () => {
        console.log('#', $.memU32.slice(8, 10));
      },
      onIdString: (p, id, cmd, v, vlen, m, mlen) => {
        console.log({
          id,
          sId: $.getString(p),
          cmd,
          v: $.memU64[v / 8].toString(16),
          vlen,
          m: $.memU64[m / 8].toString(16),
          mlen
        });
      },
      memory: new WebAssembly.Memory({
        initial: 10000, // 64KiB blocks
        maximum: 65536,
        shared: true
      })
    }
  });
};

module.exports = loadWasm;
