/**
 * @license
 * Copyright 2012 Google LLC
 * SPDX-License-Identifier: Apache-2.0
 */

/**
 * @fileoverview Generating Python for procedure blocks.
 */
'use strict';

goog.module('Blockly.FSharp.algebraicDatatypes');

const FSharp = goog.require('Blockly.FSharp');
const Variables = goog.require('Blockly.Variables');
const { NameType } = goog.require('Blockly.Names');


FSharp['typedefinition'] = function (block) {

  
  const typeName =
    FSharp.nameDB_.getName(block.getFieldValue('TYPENAME'), NameType.ALGEBRAIC_DATATYPE);
  const polyArgs = "";
  
  let branch = FSharp.statementToCode(block, 'CASES');
  let code = "type " + typeName + polyArgs + " =\n" + branch;
  

  FSharp.definitions_['%%' + typeName] = code;
  return null;
}

FSharp['casewithouttype'] = function (block) {
  const caseName =
    FSharp.nameDB_.getName(block.getFieldValue('NAME'), NameType.ALGEBRAIC_DATATYPE);
  const code = '| ' + caseName + '\n';
  return code;
}

FSharp['case'] = function (block) {
  console.log("case", block);

  var inputs = block.inputList.slice(1);

  var args = [];
  for (var i = 0; i < inputs.length; i++) {
    var element = inputs[i];
    args.push(FSharp.valueToCode(block, element.name, FSharp.ORDER_OF))
  }

  const caseName =
    FSharp.nameDB_.getName(block.getFieldValue('NAME'), NameType.ALGEBRAIC_DATATYPE);
    
  const code = '| ' + caseName + " of " + args.join(" * ") + '\n';
  return code;
}

FSharp['casewithtype'] = function (block) {
  const caseName =
    FSharp.nameDB_.getName(block.getFieldValue('NAME'), NameType.ALGEBRAIC_DATATYPE);
  const blockValue = FSharp.valueToCode(block, 'TYPE', FSharp.ORDER_OF)
    
  const code = '| ' + caseName + " of " + blockValue + '\n';
  return code;
}

FSharp['datatype'] = function (block) {
  const datatypeName =
    FSharp.nameDB_.getName(block.getFieldValue('NAME'), NameType.ALGEBRAIC_DATATYPE);
  const code = datatypeName;
  return [code, FSharp.ORDER_ATOMIC];
}