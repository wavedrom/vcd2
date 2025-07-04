'use strict';

const memmap = require('./memmap.js');

const streamData = async ($, dataFileName) => {
  const { init, chunk } = $.wasmInstance.exports;

  const contextLength = init(memmap.context);
  if (contextLength > 0x10000) { // 64 KiB
    console.error('VERY LAGE CONTEXT:', contextLength);
    throw new Error();
  }

  $.memU32[memmap.definitions_ptr] = memmap.definitions;

  const resp = await fetch(dataFileName, {
    headers: {'Accept-Encoding': 'br, deflate'}
  });
  const reader = resp.body.getReader();

  const stats = {numChunks: 0, maxLength: 0, totalLength: 0};

  for (let i = 0; i < 10000; i++) {
    const { value, done } = await reader.read();
    if (done) {
      break;
    }
    $.memU8.set(value, memmap.input);
    if (value.length > 0x4000000) { // 64 MiB
      console.error('VERY LAGE CHUNK:', value.length);
      throw new Error();
    }

    const error = chunk(memmap.context, memmap.input, memmap.input + value.length);
    if (error) {
      throw new Error(error);
    }

    stats.maxLength = Math.max(stats.maxLength, value.length);
    stats.totalLength += value.length;
    stats.numChunks++;
    postMessage({cmd: 'stats', data: stats});
  }
  // console.log($.memU32.slice($.context, 32)); // retrun context size
  console.log(stats);
  return stats;
};

module.exports = streamData;

/* eslint-env worker */
