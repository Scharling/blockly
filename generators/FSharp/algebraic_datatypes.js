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
  var polyArgs = "";

  if (block.itemCount_ > 0) {
    var args = [];
    for (var i = 0; i < block.itemCount_; i++) {
        args.push(getPolyType(i));
    }
    polyArgs = "<" + args.join(", ") + ">";
  } 


  console.log("typedef", block, polyArgs);
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

  var inputs = block.inputList.slice(1);

  var args = [];
  var polyCounter = 0;
  for (var i = 0; i < inputs.length; i++) {
    var element = inputs[i];
    var arg = FSharp.valueToCode(block, element.name, FSharp.ORDER_OF);
    if (arg == "") {
      arg = getPolyType(polyCounter++);
    }
    args.push(arg);
  }

  const code = datatypeName + "<" + args.join(", ") + ">";
  return [code, FSharp.ORDER_ATOMIC];
}


const alphabet = "abcdefghijklmnopqrstuvwxyz"
function getPolyType(polyCounter) {
  return "'" + alphabet.charAt(polyCounter);
}


FSharp['type_builder'] = function (block) {
  const builderName =
    FSharp.nameDB_.getName(block.getFieldValue('NAME'), NameType.ALGEBRAIC_DATATYPE);

  var inputs = block.inputList.slice(1);

  var args = [];
  var aCounter = 0;
  for (var i = 0; i < inputs.length; i++) {
    var element = inputs[i];
    var arg = FSharp.valueToCode(block, element.name, FSharp.ORDER_OF);
    if (arg != "") {
      args.push(arg);
    }
  }

  const code = builderName + "(" + args.join(", ") + ")";
  return [code, FSharp.ORDER_ATOMIC];
}