/**
 * @license
 * Copyright 2012 Google LLC
 * SPDX-License-Identifier: Apache-2.0
 */

/**
 * @fileoverview Generating Python for procedure blocks.
 */
'use strict';

goog.module('Blockly.FSharp.patternMatching');

const FSharp = goog.require('Blockly.FSharp');
const Variables = goog.require('Blockly.Variables');
const { NameType } = goog.require('Blockly.Names');


FSharp['match'] = function (block) {
  let matchingBlock = FSharp.valueToCode(block, "VARIABLE", FSharp.ORDER_ATOMIC);

  let branch = FSharp.statementToCode(block, 'CASES');
  let code = "\nmatch " + matchingBlock + " with" + branch;

  return [code, FSharp.ORDER_ATOMIC];
}

FSharp['matchcase'] = function (block) {

  const patternBlock = FSharp.valueToCode(block, "PATTERN", FSharp.ORDER_PIPE_PATTERN_MATCH);
  const thenBlock = FSharp.valueToCode(block, "THEN", FSharp.ORDER_FUNCTION_ARROW);

  const code = '\n  | ' + patternBlock + ' -> ' + thenBlock;
  return code;
}

FSharp['matchcase_wildcard'] = function (block) {
  return ["_", FSharp.ORDER_ATOMIC];
}