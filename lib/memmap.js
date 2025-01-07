'use strict';

const memmap = {
  context:               0, //            uint8_t* 64K uint8_t (minimum 29184)
  t0:               32 / 8, // int64_t
  time:             40 / 8, // int64_t
  definitions_ptr:  48 / 4, // uint32_t / uint8_t*
  output_idx_ptr:   52 / 4, // uint32_t / uint8_t*
  free_page_ptr:    56 / 4, // uint32_t / uint8_t*
  num_ids:          60 / 4, // int32_t

  input:          0x10000, // uint8_t 64M Bytes 64M (chrome: 2M, firefox: 16M)
  definitions:  0x4010000, // uint8_t

  // output_idx:     'wrong', // Will move by the $enddefinition handler
  // output:         'wrong'  // Will move by the $enddefinition handler
};

module.exports = memmap;
