/**
 * @fileoverview Generating F# for logic blocks.
 */
'use strict';

goog.module('Blockly.FSharp.logic');

const FSharp = goog.require('Blockly.FSharp');


// FSharp['controls_if'] = function (block) {
//   // If/elseif/else condition.
//   let n = 0;
//   let code = '', branchCode, conditionCode;
//   if (FSharp.STATEMENT_PREFIX) {
//     // Automatic prefix insertion is switched off for this block.  Add manually.
//     code += FSharp.injectId(FSharp.STATEMENT_PREFIX, block);
//   }
//   do {
//     conditionCode =
//       FSharp.valueToCode(block, 'IF' + n, FSharp.ORDER_NONE) || 'false';
//     branchCode = FSharp.statementToCode(block, 'DO' + n) || FSharp.PASS;
//     if (FSharp.STATEMENT_SUFFIX) {
//       branchCode =
//         FSharp.prefixLines(
//           FSharp.injectId(FSharp.STATEMENT_SUFFIX, block), FSharp.INDENT) +
//         branchCode;
//     }
//     code += (n === 0 ? 'if ' : 'elif ') + conditionCode + ' then \n' + branchCode;
//     n++;
//   } while (block.getInput('IF' + n));

//   if (block.getInput('ELSE') || FSharp.STATEMENT_SUFFIX) {
//     branchCode = FSharp.statementToCode(block, 'ELSE') || FSharp.PASS;
//     if (FSharp.STATEMENT_SUFFIX) {
//       branchCode =
//         FSharp.prefixLines(
//           FSharp.injectId(FSharp.STATEMENT_SUFFIX, block), FSharp.INDENT) +
//         branchCode;
//     }
//     code += 'else\n' + branchCode;
//   }
//   return code;
// };

FSharp['controls_ifelse'] = FSharp['controls_if'];

FSharp['logic_compare'] = function (block) {
  // Comparison operator.
  const OPERATORS =
    { 'EQ': '=', 'NEQ': '<>', 'LT': '<', 'LTE': '<=', 'GT': '>', 'GTE': '>=' };
  const operator = OPERATORS[block.getFieldValue('OP')];
  const order = FSharp.ORDER_RELATIONAL;
  const argument0 = FSharp.valueToCode(block, 'A', order) || '0';
  const argument1 = FSharp.valueToCode(block, 'B', order) || '0';
  const code = argument0 + ' ' + operator + ' ' + argument1;
  return [code, order];
};

FSharp['logic_operation'] = function (block) {
  // Operations 'and', 'or'.
  const operator = (block.getFieldValue('OP') === 'AND') ? '&&' : '||';
  const order =
    (operator === '&&') ? FSharp.ORDER_AND : FSharp.ORDER_OR;
  let argument0 = FSharp.valueToCode(block, 'A', order);
  let argument1 = FSharp.valueToCode(block, 'B', order);
  if (!argument0 && !argument1) {
    // If there are no arguments, then the return value is false.
    argument0 = 'false';
    argument1 = 'false';
  } else {
    // Single missing arguments have no effect on the return value.
    const defaultArgument = (operator === '&&') ? 'true' : 'false';
    if (!argument0) {
      argument0 = defaultArgument;
    }
    if (!argument1) {
      argument1 = defaultArgument;
    }
  }
  const code = argument0 + ' ' + operator + ' ' + argument1;
  return [code, order];
};

FSharp['logic_negate'] = function (block) {
  // Negation.
  const argument0 =
    FSharp.valueToCode(block, 'BOOL', FSharp.ORDER_NOT) || 'true';
  const code = 'not ' + argument0;
  return [code, FSharp.ORDER_NOT];
};

FSharp['logic_boolean'] = function (block) {
  // Boolean values true and false.
  const code = (block.getFieldValue('BOOL') === 'TRUE') ? 'true' : 'false';
  return [code, FSharp.ORDER_ATOMIC];
};

FSharp['logic_unit'] = function (block) {
  // Null data type.
  return ['()', FSharp.ORDER_ATOMIC];
};

FSharp['logic_ternary'] = function (block) {
  // Ternary operator.
  const value_if =
    FSharp.valueToCode(block, 'IF', FSharp.ORDER_IF) || 'false';
  const value_then =
    FSharp.valueToCode(block, 'THEN', FSharp.ORDER_IF) || '()';
  const value_else =
    FSharp.valueToCode(block, 'ELSE', FSharp.ORDER_IF) || '()';
  const code = 'if ' + value_if + ' then ' + value_then + ' else ' + value_else;
  return [code, FSharp.ORDER_IF];
};
