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
  var blockName = block.inputList[0].fieldRow[0].textContent_.data;
  var blockNameSanitized = blockName.replace(/\s/g /* all kinds of spaces*/,
                                        " " /* ordinary space */)
  var variable = block.workspace.getVariableMap().getVariableByName(blockNameSanitized)

  // Variable getter.
  const code =
    FSharp.nameDB_.getName(variable.displayName, NameType.VARIABLE);
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

FSharp['value_tuple'] = function (block) {
  var args = [];
  for (var i = 0; i < block.childBlocks_.length; i++) {
    args.push(FSharp.valueToCode(block, getTupleIndexName(i), FSharp.ORDER_ATOMIC))
  }
  let code = args.join(", ");

  if (code.length > 0) code = "(" + code + ")";

  return [code, FSharp.ORDER_ATOMIC];
};

function getTupleIndexName(index) {
  switch (index) {
    case 0:
      return "FST"
    case 1:
      return "SND"
    default:
      return "ADD" + (index - 2)
  }
}
