'use strict';

const memmap = require('../../lib/memmap.js');

const traceGlPages = ($) => {

  const num_ids = $.memI32[memmap.num_ids];
  const output_idx_addr = $.memU32[memmap.output_idx_ptr];
  console.log(
    // e.data,
    // $.memory,
    // $,
    't0', $.memI64[memmap.t0],
    'time', $.memI64[memmap.time],
    'num_ids', num_ids,
    'definitions_ptr', $.memU32[memmap.definitions_ptr].toString(16),
    'output_idx_ptr', output_idx_addr.toString(16),
    'free_page_ptr', $.memU32[memmap.free_page_ptr].toString(16)
  );

  for (let i = 0; i < num_ids; i++) {
    let a0 = output_idx_addr / 4 + i * 4;
    // console.log(i, $.memI32.slice(a0, a0 + 4));

    // // // allocated pages
    let next = $.memI32[a0];
    const res = [i];

    while(1) {
      if (next === 0) {
        break;
      }
      res.push(
        $.memI64[next        / 8],  // time_start
        $.memI64[(next +  8) / 8],  // time_end
        next / 0x1000,              // page index
        // $.memI32[(next + 16) / 4],  // id
        $.memI32[(next + 20) / 4],  // length
        // $.memI32[(p0 + 24) / 4],  // next ->
        // $.memI32[(p0 + 28) / 4],  // prev ->
      );
      next = $.memI32[(next + 24) / 4];
    }

    console.log(res);
  }
};

module.exports = traceGlPages;
