'use strict';

const memmap = require('./memmap.js');
const commandHandler = require('./command-handler.js');

const align = (val, ali) => (val + (ali - 1)) & -ali;

const initState = () => {
  const $ = {
    wires: {kind: 'scope', type: '.', name: '.', body: []},
    hashTable: [],
    ido: {},
    nextId: 1
  };
  $.stack = [$.wires];
  $.getString = (p) => {
    let endp = p + 100;
    for (let i = p; i < endp; i++) {
      if ($.memU8[i] === 0) {
        endp = i;
        break;
      }
    }
    return new TextDecoder().decode($.memU8.slice(p, endp));
  };
  $.genOnCommand = (command, p) => {
    commandHandler($, command, $.getString(p));
  };
  $.endDefinitions = () => {
    // create hashArray from hashTable
    const { hashTable } = $;
    const hashArray = Array.from({length: hashTable.length});
    let top = hashTable.length;
    for (let i = 0; i < hashTable.length; i++) {
      const elo = hashTable[i];
      if (elo === undefined) { // unreachable
        hashArray[i] = 0;
      } else {
        const keys = Object.keys(elo).sort();
        if (keys.length === 0) { // unreachable
          throw new Error('strange empty object');
          // hashArray[i] = 0; // unreachable
        } else if (keys.length === 1) {  // one choice
          hashArray[i] = elo[keys[0]];
        } else { // more then one choice
          hashArray[i] = -top; // -index
          for (let j = 0; j < (keys.length - 1); j++) {
            const key = keys[j];
            const clen = align(key.length, 4); // [bytes]
            const keyArr8 = new TextEncoder().encode(key);
            const keyArr8A = new Uint8Array(clen);
            keyArr8A.set(keyArr8);
            const keyArr32 = new Uint32Array(keyArr8A.buffer);
            top += 2 + clen / 4;
            hashArray.push(elo[key]); // ID if true
            if (j === (keys.length - 2)) {
              hashArray.push(elo[keys[j + 1]]); // ID if false
            } else {
              hashArray.push(-top); // -indexID if false
            }
            for (const e of keyArr32) {
              hashArray.push(e); // test string
            }
          }
        }
      }
    }
    console.log(hashArray);
    $.hashArray = Int32Array.from(hashArray);
    console.log($.hashArray);

    $.memI32.set($.hashArray, memmap.definitions / 4);
    $.memI32[memmap.num_ids] = $.nextId;

    const output_idx_addr = align(
      memmap.definitions + $.hashArray.length * 4,
      32
    );
    $.memI32[memmap.output_idx_ptr] = output_idx_addr;

    const free_page_addr = align(
      output_idx_addr + $.nextId * 16, /* output_idx_size */
      0x10000
    );
    $.memI32[memmap.free_page_ptr] = free_page_addr;

    console.log('$enddefinitions', $);
    postMessage({cmd: 'enddefinitions', data: {
      wires: $.wires,
      timescale: $.timescale
    }});
  };
  return $;
};

module.exports = initState;
/* eslint-env worker */
