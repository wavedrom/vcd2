'use strict';

const vcd2wasm = require('./vcd2.wasm.js');
const addWasmMemoryViews = require('./lib/add-wasm-memory-views.js');
const commandHandler = require('./lib/command-handler.js');
const initState = require('./lib/init-vcd-worker-state.js');
const loadWasmNode = require('./lib/load-wasm-node.js');
const memmap = require('./lib/memmap.js');
const props = require('./lib/props.js');

exports.vcd2wasm = vcd2wasm;
exports.addWasmMemoryViews = addWasmMemoryViews;
exports.commandHandler = commandHandler;
exports.initState = initState;
exports.loadWasmNode = loadWasmNode;
exports.memmap = memmap;
exports.props = props;
