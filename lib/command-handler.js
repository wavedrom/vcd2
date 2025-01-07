'use strict';

const handleScope = (info, str) => {
  const [type, name] = str.split(/\s+/);
  const ero = {kind: 'scope', type, name, body: []};
  const current = info.stack[info.stack.length - 1];
  current.body.push(ero);
  info.stack.push(ero);
  // console.log(ero);
};

const handleUpScope = (info /* , str */) => {
  info.stack.pop();
  // console.log(['upscope', str]);
};

const updateIdTable = ($, link) => {
  if ($.ido[link] !== undefined) { // old Id
    return $.ido[link][0];
  }

  // polynomial rolling hash function
  let hash = 0;
  let poly = 1;
  for (let i = 0; i < link.length; i++) {
    const c = link.charCodeAt(i) - 33 + 1; // ! .. ~ (94 digits)
    hash = (hash + poly * c) & 0xfff;
    poly = (poly * 97) & 0xfff; // 89, 97
  }

  const newId = $.nextId;
  $.ido[link] = [newId, hash];

  // add entry to the Hash Table object
  if ($.hashTable[hash] === undefined) {
    $.hashTable[hash] = {};
  }

  $.hashTable[hash][link] = newId;
  $.nextId += 1;
  return newId;
};

const handleVar = ($, str) => {
  // reg 3 ( r_reg [2:0]
  // 0   1 2 3+
  const eroj = str.split(/\s+/);
  const link = eroj[2];
  const ero = {
    kind: 'var',
    type: eroj[0],
    size: parseInt(eroj[1]),
    link,
    name: eroj.slice(3).join(''),
    id: updateIdTable($, link)
  };
  {
    const m = ero.name.match('^(?<name>\\w+)\\[' + (ero.size - 1) + ':0]$');
    if (m) {
      ero.name = m.groups.name;
    }
  }
  const current = $.stack[$.stack.length - 1];
  current.body.push(ero);
  // console.log(ero);
};

const commandHandler = ($, cmd, str) => {
  str = str.trim();
  switch(cmd) {
  case 1:
    $.comment = str;
    // console.log(['comment', str]);
    break;
  case 2:
    $.date = str;
    // console.log(['date', str]);
    break;
  case 3:
    handleScope($, str);
    break;
  case 4:
    $.timescale = str;
    // console.log(['timescale', str]);
    break;
  case 5:
    handleUpScope($, str);
    break;
  case 6:
    handleVar($, str);
    break;
  case 7:
    $.version = str;
    // console.log(['version', str]);
    break;
  default:
    console.log([cmd, str]);
  }
};

module.exports = commandHandler;
