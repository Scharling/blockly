/**
 * @license
 * Copyright 2012 Google LLC
 * SPDX-License-Identifier: Apache-2.0
 */

/**
 * @fileoverview Generating Python for procedure blocks.
 */
'use strict';

goog.module('Blockly.FSharp.procedures');

const FSharp = goog.require('Blockly.FSharp');
const Variables = goog.require('Blockly.Variables');
const { NameType } = goog.require('Blockly.Names');


FSharp['procedures_defreturn'] = function (block) {
  // Define a procedure with a return value.
  // First, add a 'global' statement for every variable that is not shadowed by
  // a local parameter.
  const globals = [];
  const workspace = block.workspace;
  const usedVariables = Variables.allUsedVarModels(workspace) || [];
  for (let i = 0, variable; (variable = usedVariables[i]); i++) {
    const varName = variable.name;
    if (block.getVars().indexOf(varName) === -1) {
      globals.push(FSharp.nameDB_.getName(varName, NameType.VARIABLE));
    }
  }
  // Add developer variables.
  const devVarList = Variables.allDeveloperVariables(workspace);
  for (let i = 0; i < devVarList.length; i++) {
    globals.push(
      FSharp.nameDB_.getName(devVarList[i], NameType.DEVELOPER_VARIABLE));
  }
  const funcName =
    FSharp.nameDB_.getName(block.getFieldValue('NAME'), NameType.PROCEDURE);
  let xfix1 = '';
  if (FSharp.STATEMENT_PREFIX) {
    xfix1 += FSharp.injectId(FSharp.STATEMENT_PREFIX, block);
  }
  if (FSharp.STATEMENT_SUFFIX) {
    xfix1 += FSharp.injectId(FSharp.STATEMENT_SUFFIX, block);
  }
  if (xfix1) {
    xfix1 = FSharp.prefixLines(xfix1, FSharp.INDENT);
  }
  let loopTrap = '';
  if (FSharp.INFINITE_LOOP_TRAP) {
    loopTrap = FSharp.prefixLines(
      FSharp.injectId(FSharp.INFINITE_LOOP_TRAP, block), FSharp.INDENT);
  }
  let branch = FSharp.statementToCode(block, 'STACK');
  let returnValue =
    FSharp.valueToCode(block, 'RETURN', FSharp.ORDER_NONE) || '';
  let xfix2 = '';
  if (branch && returnValue) {
    // After executing the function body, revisit this block for the return.
    xfix2 = xfix1;
  }
  if (returnValue) {
    returnValue = FSharp.INDENT + returnValue + '\n';
  } else if (!branch) {
    branch = FSharp.INDENT + 'failwith "function not implemented"';
  }
  const args = [];
  const variables = block.getVars();
  for (let i = 0; i < variables.length; i++) {
    args[i] = FSharp.nameDB_.getName(variables[i], NameType.VARIABLE);
  }
  let argsString = createArgsString(args, usedVariables);
  let recString = createRecString(block);

  let code = 'let ' + recString + funcName + ' ' + argsString + ' =\n' +
    xfix1 + loopTrap + branch + xfix2 + returnValue;
  code = FSharp.scrub_(block, code);
  // Add % so as not to collide with helper functions in definitions list.
  FSharp.definitions_['%' + funcName] = code;
  return null;
};


FSharp['procedures_anonymous'] = function (block) {
  // Define a procedure with a return value.
  // First, add a 'global' statement for every variable that is not shadowed by
  // a local parameter.
  const globals = [];
  const workspace = block.workspace;
  const usedVariables = Variables.allUsedVarModels(workspace) || [];
  for (let i = 0, variable; (variable = usedVariables[i]); i++) {
    const varName = variable.name;
    if (block.getVars().indexOf(varName) === -1) {
      globals.push(FSharp.nameDB_.getName(varName, NameType.VARIABLE));
    }
  }
  // Add developer variables.
  const devVarList = Variables.allDeveloperVariables(workspace);
  for (let i = 0; i < devVarList.length; i++) {
    globals.push(
      FSharp.nameDB_.getName(devVarList[i], NameType.DEVELOPER_VARIABLE));
  }

  // const globalString = globals.length ?
  //   FSharp.INDENT + 'global ' + globals.join(', ') + '\n' :
  //   '';
  const funcName =
    FSharp.nameDB_.getName(block.id, NameType.PROCEDURE);
  let xfix1 = '';
  if (FSharp.STATEMENT_PREFIX) {
    xfix1 += FSharp.injectId(FSharp.STATEMENT_PREFIX, block);
  }
  if (FSharp.STATEMENT_SUFFIX) {
    xfix1 += FSharp.injectId(FSharp.STATEMENT_SUFFIX, block);
  }
  if (xfix1) {
    xfix1 = FSharp.prefixLines(xfix1, FSharp.INDENT);
  }
  let loopTrap = '';
  if (FSharp.INFINITE_LOOP_TRAP) {
    loopTrap = FSharp.prefixLines(
      FSharp.injectId(FSharp.INFINITE_LOOP_TRAP, block), FSharp.INDENT);
  }
  let branch = FSharp.statementToCode(block, 'STACK');
  let returnValue =
    FSharp.valueToCode(block, 'RETURN', FSharp.ORDER_NONE) || '';
  let xfix2 = '';
  if (branch && returnValue) {
    // After executing the function body, revisit this block for the return.
    xfix2 = xfix1;
  }
  if (returnValue) {
    returnValue = FSharp.INDENT + returnValue + '\n';
  } else if (!branch) {
    branch = FSharp.INDENT + 'failwith "function not implemented"';
  }
  const args = [];
  const variables = block.getVars();
  for (let i = 0; i < variables.length; i++) {
    args[i] = FSharp.nameDB_.getName(variables[i], NameType.VARIABLE);
  }
  let argsString = createArgsString(args, usedVariables);
  let code = 'fun' + argsString + ' ->\n' +
    xfix1 + loopTrap + branch + xfix2 + returnValue;
  code = FSharp.scrub_(block, code);
  // Add % so as not to collide with helper functions in definitions list.
  //FSharp.definitions_['%' + funcName] = code;
  if (block.parentBlock_?.type === 'procedures_callreturn' || block.parentBlock_?.type === 'args_callreturn') {
    code = '(' + code + ')';
  }
  return [code, FSharp.ORDER_FUNCTION_MATCH_TRY];
};



function createArgsString(args, variableModels) {
  let str = "";
  for (var i = 0; i < args.length; i++) {
    let arg = args[i];
    for (var j = 0; j < variableModels.length; j++) {
      let varModel = variableModels[j];
      if (varModel.name == arg) {
        str = str + " (" + arg + " : " + varModel.type.getFSharpType() + ")"
        break;
      }
    }
  }
  return str;
};

function createRecString(block) {
  for (var i = 0; i < block.inputList.length; i++) {
    var input = block.inputList[i];
    for (var j = 0; j < input.fieldRow.length; j++) {
      var field = input.fieldRow[j];
      if (field.name == "REC") {
        if (field.value_) {
          return "rec "
        } else {
          return "";
        }
      }
    }
  }
  return "";
}

// Defining a procedure without a return value uses the same generator as
// a procedure with a return value.
//FSharp['procedures_defnoreturn'] = FSharp['procedures_defreturn'];

FSharp['procedures_callreturn'] = function (block) {
  // Call a procedure with a return value.
  const funcName =
    FSharp.nameDB_.getName(block.getFieldValue('NAME'), NameType.PROCEDURE);
  const args = [];
  const variables = block.getVars();

  const argCount = block.getFieldValue('ARGCOUNT') === 'ALL' ? variables.length : Number(block.getFieldValue('ARGCOUNT'));
  for (let i = 0; i < argCount; i++) {
    const argtext = FSharp.valueToCode(block, 'ARG' + i, FSharp.ORDER_ATOMIC);
    if (argtext) {
      args[i] = argtext;
    }
    //args[i] = FSharp.valueToCode(block, 'ARG' + i, FSharp.ORDER_NONE) || 'None';
  }
  const code = funcName + ' ' + args.join(' ');
  return [code, FSharp.ORDER_FUNCTION_APPLICATION];
};

FSharp['args_callreturn'] = function (block) {
  // Call a procedure with a return value.
  const funcName = block.getFieldValue('NAME');
  const args = [];
  const variables = block.getVars();

  const argCount = block.getFieldValue('ARGCOUNT') === 'ALL' ? variables.length : Number(block.getFieldValue('ARGCOUNT'));
  for (let i = 0; i < argCount; i++) {
    const argtext = FSharp.valueToCode(block, 'ARG' + i, FSharp.ORDER_ATOMIC);
    if (argtext) {
      args[i] = argtext;
    }
    //args[i] = FSharp.valueToCode(block, 'ARG' + i, FSharp.ORDER_NONE) || 'None';
  }
  const code = funcName + ' ' + args.join(' ');
  return [code, FSharp.ORDER_FUNCTION_APPLICATION];
};

// FSharp['procedures_callnoreturn'] = function (block) {
//   // Call a procedure with no return value.
//   // Generated code is for a function call as a statement is the same as a
//   // function call as a value, with the addition of line ending.
//   const tuple = FSharp['procedures_callreturn'](block);
//   return tuple[0] + '\n';
// };

FSharp['procedures_ifreturn'] = function (block) {
  // Conditionally return value from a procedure.
  const condition =
    FSharp.valueToCode(block, 'CONDITION', FSharp.ORDER_NONE) || 'False';
  let code = 'if ' + condition + ':\n';
  if (FSharp.STATEMENT_SUFFIX) {
    // Inject any statement suffix here since the regular one at the end
    // will not get executed if the return is triggered.
    code += FSharp.prefixLines(
      FSharp.injectId(FSharp.STATEMENT_SUFFIX, block), FSharp.INDENT);
  }
  if (block.hasReturnValue_) {
    const value =
      FSharp.valueToCode(block, 'VALUE', FSharp.ORDER_NONE) || 'None';
    code += FSharp.INDENT + 'return ' + value + '\n';
  } else {
    code += FSharp.INDENT + 'return\n';
  }
  return code;
};
