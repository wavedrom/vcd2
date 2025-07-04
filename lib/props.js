'use strict';

const props = [
  {type: 'i64', name: 't0',    desc: 'start dump time'},          // API1: 8
  {type: 'i64', name: 'time',  desc: 'current simulation time'},  // API1: 10

  {type: 'ptr', name: 'definitions_ptr'},   // id hash LUT
  {type: 'ptr', name: 'triggers_ptr'}, // trigger LUT
  {type: 'ptr', name: 'output_idx_ptr'},    // index of first output data page
  {type: 'ptr', name: 'free_page_ptr'},     // index of free  output data page
  {type: 'i32', name: 'num_ids'},
  {type: 'i32', name: 'digitCount'},
  {type: 'i32', name: 'maskCount'},
  {type: 'i32', name: 'id_sum'},

  // {type: 'i32', name: 'size'},

  // {type: 'ptr', name: 'trigger'}, // API1:

  // {name: '//, type  triee:}        'ptr', // trigger event emitter
  // {name: '//, type  lifee:}        'ptr', // life cycle event emmiter
  // {name: '//, type  info:}         'ptr',

  {type: 'ptr', name: 'value'}, // API1: value of the signal on change event
  {type: 'ptr', name: 'mask'}, // API1: mask (x, z) of the signal on change event
  {type: 'ptr', name: 'tmpStr'}, // API1
  {type: 'ptr', name: 'timeStampStr'}, // API1
  {type: 'ptr', name: 'idStr'}, // API1
  {type: 'ptr', name: 'tmpStr2'}, // API1

  // {name: '//, type  stackPointer:} 'i32',
  // {name: '//, type  id:}           'ptr',
  // {name: '//, type  napi_env:}     'ptr', // ???
  // {name: '//, type  type:}         'i8'
  // {name: '//, type  small }missaligned scalar
  {type: 'i8', name: 'command'},  // PARSER
  {type: 'i8', name: 'trigger_enable'}
];

module.exports = props;
