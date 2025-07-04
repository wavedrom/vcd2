'use strict';

const llparse = require('llparse');

const spaces = [' ', '\n', '\r', '\t'];
const lineSpaces = [' ', '\t'];

const objection = lut => arg => arg.split(/\s+/).reduce((res, key) => {
  if (lut[key] === undefined) {
    throw new Error(key);
  }
  res[key] = lut[key];
  return res;
}, {});

const grammar = (prj, props) => {

  const p = new llparse.LLParse(prj);

  props.map(({name, type}) => p.property(type, name));

  const {
    // scopeIdentifierSpan,
    // varSizeSpan, varIdSpan, varNameSpan,
    idSpan,
    commandSpan,
    timeSpan
  } = `
    idSpan
    commandSpan
    timeSpan
  `
    .trim().split(/\s+/)
    .reduce((res, n) => Object.assign(res, {[n]: p.span(p.code.span(n))}), {});

  // scopeIdentifierSpan

  const {
    declaration,
    // scopeType, scopeTypeEnd,
    // scopeIdentifier, scopeIdentifierEnd,
    // varType, varTypeEnd,
    // varSize, varSizeEnd,
    // varId, varIdEnd,
    // varName, varNameEnd,
    inDeclaration,
    simulation,
    inSimulation,
    simulationTime,
    simulationVector, simulationVectorEnd, simulationVectorRecovery,
    simulationId
  } = `
    declaration
    inDeclaration
    simulation
    inSimulation
    simulationTime
    simulationVector simulationVectorEnd simulationVectorRecovery
    simulationId
  `
    .trim().split(/\s+/)
    .reduce((res, n) => Object.assign(res, {[n]: p.node(n)}), {});

  // scopeType scopeTypeEnd
  // scopeIdentifier scopeIdentifierEnd

  const enddefinitions = p.node('inDeclarationEnd');

  const cmd = objection({
    $comment: 1,
    $date: 2,
    $scope: 3,
    $timescale: 4,
    $upscope: 5,
    $var: 6,
    $version: 7,
    $enddefinitions: 8,
    $dumpall: 9,
    $dumpoff: 10,
    $dumpon: 11,
    $dumpvars: 12,
    '#': 13,
    '0': 14, '1': 15,
    x: 16, X: 17,
    z: 18, Z: 19,
    u: 20, U: 21, // VHDL states
    w: 22, W: 23,
    l: 24, L: 25,
    h: 26, H: 27,
    '-': 28,
    b: 30, B: 31, r: 32, R: 33
  });

  declaration
    .match(spaces, declaration)
    // .select(cmd('$scope'),
    //   p.invoke(p.code.store('command'), commandSpan.start(scopeType)))
    // .select(cmd('$var'),
    //   p.invoke(p.code.store('command'), commandSpan.start(varType)))
    .select(cmd('$scope $var $upscope $comment $date $timescale $version'),
      p.invoke(p.code.store('command'), commandSpan.start(inDeclaration)))
    .select(cmd('$enddefinitions'),
      p.invoke(p.code.store('command'), commandSpan.start(enddefinitions)))
    .otherwise(p.error(1, 'Expected declaration command'));

  inDeclaration
    .match('$end', commandSpan.end(declaration))
    .skipTo(inDeclaration);

  enddefinitions
    .match('$end', commandSpan.end(simulation))
    .skipTo(enddefinitions);

  simulation
    .match([' ', '\r', '\n', '\t', '$dumpvars', '$end'], simulation)
    .select(cmd('$dumpall $dumpoff $dumpon $comment'),
      p.invoke(p.code.store('command'), commandSpan.start(inSimulation)))
    .select(cmd('#'),
      p.invoke(p.code.store('command'), timeSpan.start(simulationTime)))
    .select(cmd('0 1 x X z Z u U w W l L h H -'),
      p.invoke(p.code.store('command'), idSpan.start(simulationId)))
    .select(cmd('b B r R'),
      p.invoke(p.code.store('command'), simulationVector))
    .otherwise(p.error(4, 'Expected simulation command'));

  inSimulation
    .match('$end', commandSpan.end(simulation))
    .skipTo(inSimulation);

  simulationTime
    .match(spaces, timeSpan.end(p.invoke(p.code.span('onTime'), simulation)))
    .skipTo(simulationTime);

  simulationVector
    .select(
      {
        0: 0,
        1: 1,
        x: 2, X: 2,
        z: 3, Z: 3,
        u: 3, U: 3, // VHDL states
        w: 3, W: 3,
        l: 3, L: 3,
        h: 3, H: 3,
        '-': 3
      },
      p.invoke(
        // p.code.mulAdd('value', {base: 2, signed: false}),
        p.code.value('onDigit'),
        {1: p.error(5, 'Content-Length overflow')},
        simulationVector
      )
    )
    .otherwise(simulationVectorEnd);

  simulationVectorEnd
    .match(lineSpaces, idSpan.start(simulationId))
    .skipTo(simulationVectorRecovery);

  simulationVectorRecovery
    .select(
      {
        '\n': 1, '\r': 1
      },
      p.invoke(
        p.code.value('onRecover'),
        {1: p.error(6, 'recover')},
        simulation
      )
    )
    .skipTo(simulationVectorRecovery);

  simulationId
    .match(spaces, idSpan.end(p.invoke(p.code.span('onId'), simulation)))
    .skipTo(simulationId);

  const artifacts = p.build(declaration);
  return artifacts;
};

module.exports = grammar;
