/**
 * @license
 * Copyright 2012 Google LLC
 * SPDX-License-Identifier: Apache-2.0
 */

/**
 * @fileoverview Generating FSharp for math blocks.
 */
'use strict';

goog.module('Blockly.FSharp.math');

const FSharp = goog.require('Blockly.FSharp');
const { NameType } = goog.require('Blockly.Names');


// If any new block imports any library, add that library name here.
FSharp.addReservedWords('math,random,Number');

FSharp['math_number'] = function (block) {
  // Numeric value.
  let code = Number(block.getFieldValue('NUM'));
  let order;
  if (code === Infinity) {
    code = 'infinity';
    order = FSharp.ORDER_ATOMIC;
  } else if (code === -Infinity) {
    code = '-infinity';
    order = FSharp.ORDER_PREFIX_OPERATORS;
  } else {
    order = code < 0 ? FSharp.ORDER_PREFIX_OPERATORS : FSharp.ORDER_ATOMIC;
  }
  return [code, order];
};

FSharp['math_arithmetic'] = function (block) {
  // Basic arithmetic operators, and power.
  const OPERATORS = {
    'ADD': [' + ', FSharp.ORDER_ADDITIVE],
    'MINUS': [' - ', FSharp.ORDER_ADDITIVE],
    'MULTIPLY': [' * ', FSharp.ORDER_MULTIPLICATIVE],
    'DIVIDE': [' / ', FSharp.ORDER_MULTIPLICATIVE],
    'POWER': [' ** ', FSharp.ORDER_EXPONENT]
  };
  const tuple = OPERATORS[block.getFieldValue('OP')];
  const operator = tuple[0];
  const order = tuple[1];
  const argument0 = FSharp.valueToCode(block, 'A', order) || '0';
  const argument1 = FSharp.valueToCode(block, 'B', order) || '0';

  // const arg0IsInt = FSharp.numberIsInt(argument0);
  // const arg1IsInt = FSharp.numberIsInt(argument1);

  // let code;
  // console.log(FSharp.isNumber(argument0));
  // console.log(FSharp.isNumber(argument1));
  // console.log(arg0IsInt === arg1IsInt);
  // if (FSharp.isNumber(argument0) && FSharp.isNumber(argument1)) {
  //   if (!arg0IsInt && arg1IsInt) {
  //     code = argument0 + operator + 'float ' + argument1;
  //   } else if (arg0IsInt && !arg1IsInt) {
  //     code = 'float ' + argument0 + operator + argument1;
  //   } else {
  //     code = argument0 + operator + argument1;
  //   }
  // } else {
  //   code = 'float ' + argument0 + operator + 'float ' + argument1;
  // }

  const code = argument0 + operator + argument1;

  return [code, order];
};

FSharp['math_single'] = function (block) {
  // Math operators with single operand.
  const operator = block.getFieldValue('OP');
  let code;
  let arg;
  if (operator === 'NEG') {
    // Negation is a special case given its different operator precedence.
    code = FSharp.valueToCode(block, 'NUM', FSharp.ORDER_PREFIX_OPERATORS) || '0';
    return ['-' + code, FSharp.ORDER_PREFIX_OPERATORS];
  }
  FSharp.definitions_['open_system'] = 'open System';
  if (operator === 'SIN' || operator === 'COS' || operator === 'TAN') {
    arg = FSharp.valueToCode(block, 'NUM', FSharp.ORDER_MULTIPLICATIVE) || '0';
  } else {
    arg = FSharp.valueToCode(block, 'NUM', FSharp.ORDER_NONE) || '0';
  }
  // First, handle cases which generate values that don't need parentheses
  // wrapping the code.
  switch (operator) {
    case 'ABS':
      code = 'Math.Abs ' + arg;
      break;
    case 'ROOT':
      code = 'Math.Sqrt ' + arg;
      break;
    case 'LN':
      code = 'Math.Log ' + arg;
      break;
    case 'LOG10':
      code = 'Math.Log10 ' + arg;
      break;
    case 'EXP':
      code = 'Math.Exp ' + arg;
      break;
    case 'POW10':
      code = 'Math.Pow(10,' + arg + ')';
      break;
    case 'ROUND':
      code = 'Math.Round ' + arg;
      break;
    case 'ROUNDUP':
      code = 'Math.Ceiling ' + arg;
      break;
    case 'ROUNDDOWN':
      code = 'Math.Floor ' + arg;
      break;
    case 'SIN':
      code = 'Math.Sin(' + arg + ' / 180.0 * Math.PI)';
      break;
    case 'COS':
      code = 'Math.Cos(' + arg + ' / 180.0 * Math.PI)';
      break;
    case 'TAN':
      code = 'Math.Tan(' + arg + ' / 180.0 * Math.PI)';
      break;
  }
  if (code) {
    return [code, FSharp.ORDER_FUNCTION_APPLICATION];
  }
  // Second, handle cases which generate values that may need parentheses
  // wrapping the code.
  switch (operator) {
    case 'ASIN':
      code = 'Math.Asin(' + arg + ') / math.pi * 180.0';
      break;
    case 'ACOS':
      code = 'Math.Acos(' + arg + ') / math.pi * 180.0';
      break;
    case 'ATAN':
      code = 'Math.Atan(' + arg + ') / math.pi * 180.0';
      break;
    default:
      throw Error('Unknown math operator: ' + operator);
  }
  return [code, FSharp.ORDER_MULTIPLICATIVE];
};

FSharp['math_constant'] = function (block) {
  // Constants: PI, E, the Golden Ratio, sqrt(2), 1/sqrt(2), INFINITY.
  const CONSTANTS = {
    'PI': ['Math.PI', FSharp.ORDER_MEMBER],
    'E': ['math.E', FSharp.ORDER_MEMBER],
    'GOLDEN_RATIO': ['(1.0 + Math.Sqrt 5) / 2.0', FSharp.ORDER_MULTIPLICATIVE],
    'SQRT2': ['Math.Sqrt 2', FSharp.ORDER_MEMBER],
    'SQRT1_2': ['Math.Sqrt (1.0 / 2.0)', FSharp.ORDER_MEMBER],
    'INFINITY': ['infinity', FSharp.ORDER_ATOMIC]
  };
  const constant = block.getFieldValue('CONSTANT');
  if (constant !== 'INFINITY') {
    FSharp.definitions_['open_system'] = 'open System';
  }
  return CONSTANTS[constant];
};

FSharp['math_number_property'] = function (block) {
  // Check if a number is even, odd, prime, whole, positive, or negative
  // or if it is divisible by certain number. Returns true or false.
  const number_to_check =
    FSharp.valueToCode(
      block, 'NUMBER_TO_CHECK', FSharp.ORDER_MULTIPLICATIVE) ||
    '0';
  const dropdown_property = block.getFieldValue('PROPERTY');
  let code;
  if (dropdown_property === 'PRIME') {
    FSharp.definitions_['open_system'] = 'open System';
    const functionName = FSharp.provideFunction_('math_isPrime', [
      'let ' + FSharp.FUNCTION_NAME_PLACEHOLDER_ + ' n =',
      ' let sqrt = Math.Sqrt n |> int // square root of integer',
      ' [ 2 .. sqrt ] |> List.forall (fun x -> n % x <> 0) // no divisors',
    ]);
    code = functionName + ' ' + number_to_check;
    return [code, FSharp.ORDER_FUNCTION_CALL];
  }
  switch (dropdown_property) {
    case 'EVEN':
      code = number_to_check + ' % 2 = 0';
      break;
    case 'ODD':
      code = number_to_check + ' % 2 = 1';
      break;
    case 'WHOLE':
      code = number_to_check + ' % 1 = 0';
      break;
    case 'POSITIVE':
      code = number_to_check + ' > 0';
      break;
    case 'NEGATIVE':
      code = number_to_check + ' < 0';
      break;
    case 'DIVISIBLE_BY': {
      const divisor =
        FSharp.valueToCode(block, 'DIVISOR', FSharp.ORDER_MULTIPLICATIVE);
      // If 'divisor' is some code that evals to 0, F# will raise an error.
      if (!divisor || divisor === '0') {
        return ['false', FSharp.ORDER_ATOMIC];
      }
      code = number_to_check + ' % ' + divisor + ' = 0';
      break;
    }
  }
  return [code, FSharp.ORDER_RELATIONAL];
};

// Rounding functions have a single operand.
FSharp['math_round'] = FSharp['math_single'];
// Trigonometry functions have a single operand.
FSharp['math_trig'] = FSharp['math_single'];

// Python['math_on_list'] = function(block) {
//   // Math functions for lists.
//   const func = block.getFieldValue('OP');
//   const list = Python.valueToCode(block, 'LIST', Python.ORDER_NONE) || '[]';
//   let code;
//   switch (func) {
//     case 'SUM':
//       code = 'sum(' + list + ')';
//       break;
//     case 'MIN':
//       code = 'min(' + list + ')';
//       break;
//     case 'MAX':
//       code = 'max(' + list + ')';
//       break;
//     case 'AVERAGE': {
//       Python.definitions_['from_numbers_import_Number'] =
//           'from numbers import Number';
//       const functionName = Python.provideFunction_(
//           'math_mean',
//           // This operation excludes null and values that aren't int or float:
//           // math_mean([null, null, "aString", 1, 9]) -> 5.0
//           [
//             'def ' + Python.FUNCTION_NAME_PLACEHOLDER_ + '(myList):',
//             '  localList = [e for e in myList if isinstance(e, Number)]',
//             '  if not localList: return',
//             '  return float(sum(localList)) / len(localList)'
//           ]);
//       code = functionName + '(' + list + ')';
//       break;
//     }
//     case 'MEDIAN': {
//       Python.definitions_['from_numbers_import_Number'] =
//           'from numbers import Number';
//       const functionName = Python.provideFunction_(
//           'math_median',
//           // This operation excludes null values:
//           // math_median([null, null, 1, 3]) -> 2.0
//           [
//             'def ' + Python.FUNCTION_NAME_PLACEHOLDER_ + '(myList):',
//             '  localList = sorted([e for e in myList if isinstance(e, Number)])',
//             '  if not localList: return', '  if len(localList) % 2 == 0:',
//             '    return (localList[len(localList) // 2 - 1] + ' +
//                 'localList[len(localList) // 2]) / 2.0',
//             '  else:', '    return localList[(len(localList) - 1) // 2]'
//           ]);
//       code = functionName + '(' + list + ')';
//       break;
//     }
//     case 'MODE': {
//       const functionName = Python.provideFunction_(
//           'math_modes',
//           // As a list of numbers can contain more than one mode,
//           // the returned result is provided as an array.
//           // Mode of [3, 'x', 'x', 1, 1, 2, '3'] -> ['x', 1]
//           [
//             'def ' + Python.FUNCTION_NAME_PLACEHOLDER_ + '(some_list):',
//             '  modes = []',
//             '  # Using a lists of [item, count] to keep count rather than dict',
//             '  # to avoid "unhashable" errors when the counted item is ' +
//                 'itself a list or dict.',
//             '  counts = []', '  maxCount = 1', '  for item in some_list:',
//             '    found = False', '    for count in counts:',
//             '      if count[0] == item:', '        count[1] += 1',
//             '        maxCount = max(maxCount, count[1])',
//             '        found = True',
//             '    if not found:', '      counts.append([item, 1])',
//             '  for counted_item, item_count in counts:',
//             '    if item_count == maxCount:',
//             '      modes.append(counted_item)', '  return modes'
//           ]);
//       code = functionName + '(' + list + ')';
//       break;
//     }
//     case 'STD_DEV': {
//       Python.definitions_['import_math'] = 'import math';
//       const functionName = Python.provideFunction_('math_standard_deviation', [
//         'def ' + Python.FUNCTION_NAME_PLACEHOLDER_ + '(numbers):',
//         '  n = len(numbers)', '  if n == 0: return',
//         '  mean = float(sum(numbers)) / n',
//         '  variance = sum((x - mean) ** 2 for x in numbers) / n',
//         '  return math.sqrt(variance)'
//       ]);
//       code = functionName + '(' + list + ')';
//       break;
//     }
//     case 'RANDOM':
//       Python.definitions_['import_random'] = 'import random';
//       code = 'random.choice(' + list + ')';
//       break;
//     default:
//       throw Error('Unknown operator: ' + func);
//   }
//   return [code, Python.ORDER_FUNCTION_CALL];
// };

FSharp['math_modulo'] = function (block) {
  // Remainder computation.
  const argument0 =
    FSharp.valueToCode(block, 'DIVIDEND', FSharp.ORDER_MULTIPLICATIVE) || '0';
  const argument1 =
    FSharp.valueToCode(block, 'DIVISOR', FSharp.ORDER_MULTIPLICATIVE) || '0';
  const code = argument0 + ' % ' + argument1;
  return [code, FSharp.ORDER_MULTIPLICATIVE];
};

FSharp['math_constrain'] = function (block) {
  // Constrain a number between two limits.
  const argument0 =
    FSharp.valueToCode(block, 'VALUE', FSharp.ORDER_NONE) || '0';
  const argument1 = FSharp.valueToCode(block, 'LOW', FSharp.ORDER_NONE) || '0';
  const argument2 =
    FSharp.valueToCode(block, 'HIGH', FSharp.ORDER_NONE) || 'infinity';
  const code =
    'Math.Min(Math.Max(' + argument0 + ', ' + argument1 + '), ' + argument2 + ')';
  FSharp.definitions_['open_system'] = 'open System';
  return [code, FSharp.ORDER_FUNCTION_APPLICATION];
};

FSharp['math_random_int'] = function (block) {
  // Random integer between [X] and [Y].
  FSharp.definitions_['open_system'] = 'open System';
  const argument0 = FSharp.valueToCode(block, 'FROM', FSharp.ORDER_NONE) || '0';
  const argument1 = FSharp.valueToCode(block, 'TO', FSharp.ORDER_NONE) || '0';
  const code = 'Random().Next(' + argument0 + ', ' + argument1 + ' + 1)';
  return [code, FSharp.ORDER_FUNCTION_APPLICATION];
};

FSharp['math_random_float'] = function (block) {
  // Random fraction between 0 and 1.
  FSharp.definitions_['open_system'] = 'open System';
  return ['Random().NextDouble()', FSharp.ORDER_FUNCTION_APPLICATION];
};

FSharp['math_atan2'] = function (block) {
  // Arctangent of point (X, Y) in degrees from -180 to 180.
  FSharp.definitions_['open_system'] = 'open System';
  const argument0 = FSharp.valueToCode(block, 'X', FSharp.ORDER_NONE) || '0';
  const argument1 = FSharp.valueToCode(block, 'Y', FSharp.ORDER_NONE) || '0';
  return [
    'Math.Atan2(' + argument1 + ', ' + argument0 + ') / Math.PI * 180.0',
    FSharp.ORDER_MULTIPLICATIVE
  ];
};
