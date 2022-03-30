/**
 * @license
 * Copyright 2012 Google LLC
 * SPDX-License-Identifier: Apache-2.0
 */

/**
 * @fileoverview Generating FSharp for variable blocks.
 */
'use strict';

goog.module('Blockly.FSharp.variables');

const FSharp = goog.require('Blockly.FSharp');
const { NameType } = goog.require('Blockly.Names');


FSharp['variables_get'] = function (block) {
  // Variable getter.
  const code =
    FSharp.nameDB_.getName(block.getFieldValue('VAR'), NameType.VARIABLE);
  return [code, FSharp.ORDER_ATOMIC];
};

FSharp['variables_set'] = function (block) {
  // Variable setter.
  const argument0 =
    FSharp.valueToCode(block, 'VALUE', FSharp.ORDER_NONE) || '0';
  const varName =
    FSharp.nameDB_.getName(block.getFieldValue('VAR'), NameType.VARIABLE);
  return 'let ' + varName + ' = ' + argument0 + '\n';
};
