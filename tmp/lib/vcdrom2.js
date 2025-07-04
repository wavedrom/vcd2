'use strict';

const memmap = require('../../lib/memmap.js');
const initState = require('../../lib/init-state.js');
const traceGlPages = require('./trace-gl-pages.js');

global.TestVCD = async () => {
  // need to be true
  console.log({crossOriginIsolated: window.crossOriginIsolated});

  document.body.innerHTML = '<div id="container"></div>';
  const container = document.getElementById('container');
  const urlSearchParams = new URLSearchParams(window.location.search);
  const vcdWorker = new Worker('vcd-worker.js');

  const $ = {}; // empty state

  const handlers = {
    wasmMemory: async (e) => {
      console.log('wasmMemory');
      initState($, e.data.data);
      for (const [key, value] of urlSearchParams) {
        if (key === 'vcd') { // ...:8080/?vcd=foo.vcd
          vcdWorker.postMessage({cmd: 'loadVcd', data: value});
          break;
        }
      }
    },
    enddefinitions: async (e) => {
      $.enddefinitions = e.data.data;
      console.log(e.data);
    },
    stats: async () => {
      if ($.enddefinitions) {
        const timescaleString = $.enddefinitions.timescale;
        const m = timescaleString.trim().match(/^(\d+)\s*(\w+)$/);
        const time = $.memI64[memmap.time] * BigInt(m[1]);
        container.innerHTML = time.toLocaleString() + ' ' + m[2];
      } else {
        container.innerHTML = '0';
      }
    },
    loadVcdDone: async () => {
      traceGlPages($);
    }
  };

  vcdWorker.onmessage = async (e) => {
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

  vcdWorker.postMessage({cmd: 'loadWasm'});

};

/* eslint-env browser */
