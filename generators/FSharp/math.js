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
  const code = argument0 + operator + argument1;
  return [code, order];
};

// FSharp['math_single'] = function(block) {
//   // Math operators with single operand.
//   const operator = block.getFieldValue('OP');
//   let code;
//   let arg;
//   if (operator === 'NEG') {
//     // Negation is a special case given its different operator precedence.
//     code = FSharp.valueToCode(block, 'NUM', FSharp.ORDER_PREFIX_OPERATORS) || '0';
//     return ['-' + code, FSharp.ORDER_PREFIX_OPERATORS];
//   }
//   FSharp.definitions_['import_math'] = 'import math';
//   if (operator === 'SIN' || operator === 'COS' || operator === 'TAN') {
//     arg = FSharp.valueToCode(block, 'NUM', FSharp.ORDER_MULTIPLICATIVE) || '0';
//   } else {
//     arg = FSharp.valueToCode(block, 'NUM', FSharp.ORDER_NONE) || '0';
//   }
//   // First, handle cases which generate values that don't need parentheses
//   // wrapping the code.
//   switch (operator) {
//     case 'ABS':
//       code = 'math.fabs(' + arg + ')';
//       break;
//     case 'ROOT':
//       code = 'math.sqrt(' + arg + ')';
//       break;
//     case 'LN':
//       code = 'math.log(' + arg + ')';
//       break;
//     case 'LOG10':
//       code = 'math.log10(' + arg + ')';
//       break;
//     case 'EXP':
//       code = 'math.exp(' + arg + ')';
//       break;
//     case 'POW10':
//       code = 'math.pow(10,' + arg + ')';
//       break;
//     case 'ROUND':
//       code = 'round(' + arg + ')';
//       break;
//     case 'ROUNDUP':
//       code = 'math.ceil(' + arg + ')';
//       break;
//     case 'ROUNDDOWN':
//       code = 'math.floor(' + arg + ')';
//       break;
//     case 'SIN':
//       code = 'math.sin(' + arg + ' / 180.0 * math.pi)';
//       break;
//     case 'COS':
//       code = 'math.cos(' + arg + ' / 180.0 * math.pi)';
//       break;
//     case 'TAN':
//       code = 'math.tan(' + arg + ' / 180.0 * math.pi)';
//       break;
//   }
//   if (code) {
//     return [code, Python.ORDER_FUNCTION_CALL];
//   }
//   // Second, handle cases which generate values that may need parentheses
//   // wrapping the code.
//   switch (operator) {
//     case 'ASIN':
//       code = 'math.asin(' + arg + ') / math.pi * 180';
//       break;
//     case 'ACOS':
//       code = 'math.acos(' + arg + ') / math.pi * 180';
//       break;
//     case 'ATAN':
//       code = 'math.atan(' + arg + ') / math.pi * 180';
//       break;
//     default:
//       throw Error('Unknown math operator: ' + operator);
//   }
//   return [code, Python.ORDER_MULTIPLICATIVE];
// };

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

// Python['math_number_property'] = function(block) {
//   // Check if a number is even, odd, prime, whole, positive, or negative
//   // or if it is divisible by certain number. Returns true or false.
//   const number_to_check =
//       Python.valueToCode(
//           block, 'NUMBER_TO_CHECK', Python.ORDER_MULTIPLICATIVE) ||
//       '0';
//   const dropdown_property = block.getFieldValue('PROPERTY');
//   let code;
//   if (dropdown_property === 'PRIME') {
//     Python.definitions_['import_math'] = 'import math';
//     Python.definitions_['from_numbers_import_Number'] =
//         'from numbers import Number';
//     const functionName = Python.provideFunction_('math_isPrime', [
//       'def ' + Python.FUNCTION_NAME_PLACEHOLDER_ + '(n):',
//       '  # https://en.wikipedia.org/wiki/Primality_test#Naive_methods',
//       '  # If n is not a number but a string, try parsing it.',
//       '  if not isinstance(n, Number):', '    try:', '      n = float(n)',
//       '    except:', '      return False',
//       '  if n == 2 or n == 3:', '    return True',
//       '  # False if n is negative, is 1, or not whole,' +
//           ' or if n is divisible by 2 or 3.',
//       '  if n <= 1 or n % 1 != 0 or n % 2 == 0 or n % 3 == 0:',
//       '    return False',
//       '  # Check all the numbers of form 6k +/- 1, up to sqrt(n).',
//       '  for x in range(6, int(math.sqrt(n)) + 2, 6):',
//       '    if n % (x - 1) == 0 or n % (x + 1) == 0:', '      return False',
//       '  return True'
//     ]);
//     code = functionName + '(' + number_to_check + ')';
//     return [code, Python.ORDER_FUNCTION_CALL];
//   }
//   switch (dropdown_property) {
//     case 'EVEN':
//       code = number_to_check + ' % 2 == 0';
//       break;
//     case 'ODD':
//       code = number_to_check + ' % 2 == 1';
//       break;
//     case 'WHOLE':
//       code = number_to_check + ' % 1 == 0';
//       break;
//     case 'POSITIVE':
//       code = number_to_check + ' > 0';
//       break;
//     case 'NEGATIVE':
//       code = number_to_check + ' < 0';
//       break;
//     case 'DIVISIBLE_BY': {
//       const divisor =
//           Python.valueToCode(block, 'DIVISOR', Python.ORDER_MULTIPLICATIVE);
//       // If 'divisor' is some code that evals to 0, Python will raise an error.
//       if (!divisor || divisor === '0') {
//         return ['False', Python.ORDER_ATOMIC];
//       }
//       code = number_to_check + ' % ' + divisor + ' == 0';
//       break;
//     }
//   }
//   return [code, Python.ORDER_RELATIONAL];
// };

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

// Python['math_random_int'] = function(block) {
//   // Random integer between [X] and [Y].
//   Python.definitions_['import_random'] = 'import random';
//   const argument0 = Python.valueToCode(block, 'FROM', Python.ORDER_NONE) || '0';
//   const argument1 = Python.valueToCode(block, 'TO', Python.ORDER_NONE) || '0';
//   const code = 'random.randint(' + argument0 + ', ' + argument1 + ')';
//   return [code, Python.ORDER_FUNCTION_CALL];
// };

// Python['math_random_float'] = function(block) {
//   // Random fraction between 0 and 1.
//   Python.definitions_['import_random'] = 'import random';
//   return ['random.random()', Python.ORDER_FUNCTION_CALL];
// };

// Python['math_atan2'] = function(block) {
//   // Arctangent of point (X, Y) in degrees from -180 to 180.
//   Python.definitions_['import_math'] = 'import math';
//   const argument0 = Python.valueToCode(block, 'X', Python.ORDER_NONE) || '0';
//   const argument1 = Python.valueToCode(block, 'Y', Python.ORDER_NONE) || '0';
//   return [
//     'math.atan2(' + argument1 + ', ' + argument0 + ') / math.pi * 180',
//     Python.ORDER_MULTIPLICATIVE
//   ];
// };
