'use strict';

const props = require('./props.js');

const typo = {i8: 1, i16: 2, i32: 4, i64: 8, ptr: 4};

const memmap = props.reduce((res, e) => {
  const size = typo[e.type];
  const offset = res.here / size;
  if (offset !== (offset |0)) { // has to be integer number
    console.error(e, size, offset, res);
    throw new Error();
  }
  res[e.name] = offset;
  res.here += size;
  return res;
}, {
  context:      0,          // uint8_t* 64K uint8_t (minimum 29184)
  input:        0x10000,    // uint8_t 64M Bytes 64M (chrome: 2M, firefox: 16M)
  definitions:  0x4010000,  // uint8_t
  here: 32 // Internal Parser State
});

// console.log(memmap);


// const oldmap = {
//   context:               0, //            uint8_t* 64K uint8_t (minimum 29184)
//   t0:               32 / 8, // int64_t
//   time:             40 / 8, // int64_t
//   definitions_ptr:  48 / 4, // uint32_t / uint8_t*
//   output_idx_ptr:   52 / 4, // uint32_t / uint8_t*
//   free_page_ptr:    56 / 4, // uint32_t / uint8_t*
//   num_ids:          60 / 4, // int32_t

//   input:          0x10000, // uint8_t 64M Bytes 64M (chrome: 2M, firefox: 16M)
//   definitions:  0x4010000, // uint8_t

//   // output_idx:     'wrong', // Will move by the $enddefinition handler
//   // output:         'wrong'  // Will move by the $enddefinition handler
// };

module.exports = memmap;

/* eslint no-console: 0 */
