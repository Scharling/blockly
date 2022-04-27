/**
 * @license
 * Copyright 2012 Google LLC
 * SPDX-License-Identifier: Apache-2.0
 */

/**
 * @fileoverview Generating Python for text blocks.
 */
'use strict';

goog.module('Blockly.FSharp.texts');

const FSharp = goog.require('Blockly.FSharp');
const stringUtils = goog.require('Blockly.utils.string');
const { NameType } = goog.require('Blockly.Names');

// If any new block imports any library, add that library name here.
FSharp.addReservedWords('System');


FSharp['text'] = function (block) {
  // Text value.
  const code = FSharp.quote_(block.getFieldValue('TEXT'));
  return [code, FSharp.ORDER_ATOMIC];
};

// FSharp['text_multiline'] = function(block) {
//   // Text value.
//   const code = Python.multiline_quote_(block.getFieldValue('TEXT'));
//   const order =
//       code.indexOf('+') !== -1 ? Python.ORDER_ADDITIVE : Python.ORDER_ATOMIC;
//   return [code, order];
// };

/**
 * Regular expression to detect a single-quoted string literal.
 */
const strRegExp = /^\s*'([^']|\\')*'\s*$/;

/**
 * Enclose the provided value in 'str(...)' function.
 * Leave string literals alone.
 * @param {string} value Code evaluating to a value.
 * @return {Array<string|number>} Array containing code evaluating to a string
 *     and
 *    the order of the returned code.[string, number]
 */
const forceString = function (value) {
  if (strRegExp.test(value)) {
    return [value, FSharp.ORDER_ATOMIC];
  }
  return ['string (' + value + ')', FSharp.ORDER_FUNCTION_CALL];
};

FSharp['text_join'] = function (block) {
  // Create a string made up of any number of elements of any type.
  // Should we allow joining by '-' or ',' or any other characters?
  switch (block.itemCount_) {
    case 0:
      return ['""', FSharp.ORDER_ATOMIC];
    case 1: {
      const element =
        FSharp.valueToCode(block, 'ADD0', FSharp.ORDER_NONE) || '""';
      const codeAndOrder = forceString(element);
      return codeAndOrder;
    }
    case 2: {
      const element0 =
        FSharp.valueToCode(block, 'ADD0', FSharp.ORDER_NONE) || '""';
      const element1 =
        FSharp.valueToCode(block, 'ADD1', FSharp.ORDER_NONE) || '""';
      const code = forceString(element0)[0] + " + " + forceString(element1)[0];
      return [code, FSharp.ORDER_ADDITIVE];
    }
    default: {
      const elements = [];
      for (let i = 0; i < block.itemCount_; i++) {
        elements[i] =
          FSharp.valueToCode(block, 'ADD' + i, FSharp.ORDER_NONE) || '""';
      }
      const tempVar = FSharp.nameDB_.getDistinctName('x', NameType.VARIABLE);
      // const code = '"".join([str(' + tempVar + ') for ' + tempVar + ' in [' +
      //   elements.join(', ') + ']])';
      const code = '[' + elements.join(', ') + '] |> String.concat "+"'
      return [code, FSharp.ORDER_FUNCTION_CALL];
    }
  }
};

FSharp['text_length'] = function (block) {
  // Is the string null or array empty?
  const text = FSharp.valueToCode(block, 'VALUE', FSharp.ORDER_NONE) || '\'\'';
  return ['String.length ' + text, FSharp.ORDER_FUNCTION_APPLICATION];
};

FSharp['text_isEmpty'] = function (block) {
  // Is the string null or array empty?
  const text = FSharp.valueToCode(block, 'VALUE', FSharp.ORDER_NONE) || '\'\'';
  const code = 'String.length ' + text + ' = 0';
  return [code, FSharp.ORDER_RELATIONAL];
};

FSharp['text_indexOf'] = function (block) {
  // Search the text for a substring.
  // Should we allow for non-case sensitive???
  const operator = block.getFieldValue('END') === 'FIRST' ? 'IndexOf' : 'LastIndexOf';
  const substring =
    FSharp.valueToCode(block, 'FIND', FSharp.ORDER_NONE) || '\'\'';
  const text =
    FSharp.valueToCode(block, 'VALUE', FSharp.ORDER_MEMBER) || '\'\'';
  const code = text + '.' + operator + ' ' + substring;
  if (block.workspace.options.oneBasedIndex) {
    return [code + ' + 1', FSharp.ORDER_ADDITIVE];
  }
  return [code, FSharp.ORDER_FUNCTION_CALL];
};

FSharp['text_charAt'] = function (block) {
  // Get letter at index.
  // Note: Until January 2013 this block did not have the WHERE input.
  const where = block.getFieldValue('WHERE') || 'FROM_START';
  const textOrder =
    (where === 'RANDOM') ? FSharp.ORDER_NONE : FSharp.ORDER_MEMBER;
  const text = FSharp.valueToCode(block, 'VALUE', textOrder) || '\'\'';
  switch (where) {
    case 'FIRST': {
      const code = text + '[0]';
      return [code, FSharp.ORDER_MEMBER];
    }
    case 'LAST': {
      const functionName = FSharp.provideFunction_('last_char_of_string', [
        'let ' + FSharp.FUNCTION_NAME_PLACEHOLDER_ + ' (str:string) = str[str.Length - 1]'
      ]);
      code = functionName + ' ' + text;
      return [code, FSharp.ORDER_MEMBER];
    }
    case 'FROM_START': {
      const at = FSharp.getAdjustedInt(block, 'AT');
      const code = text + '[' + at + ']';
      return [code, FSharp.ORDER_MEMBER];
    }
    case 'FROM_END': {
      const at = FSharp.getAdjustedInt(block, 'AT');
      const functionName = FSharp.provideFunction_('char_from_end', [
        'let ' + FSharp.FUNCTION_NAME_PLACEHOLDER_ + ' (str:string) at = str[str.Length - (1 + at)]'
      ]);
      const code = functionName + ' ' + text + ' ' + at;
      return [code, FSharp.ORDER_MEMBER];
    }
    case 'RANDOM': {
      FSharp.definitions_['import_random'] = 'import random';
      const functionName = FSharp.provideFunction_('string_random_letter', [
        'let ' + FSharp.FUNCTION_NAME_PLACEHOLDER_ + ' (str:string) =',
        ' let index = Random().NextDouble() * float str.Length |> int',
        ' str[index]'
      ]);
      const code = functionName + ' ' + text;
      return [code, FSharp.ORDER_FUNCTION_CALL];
    }
  }
  throw Error('Unhandled option (text_charAt).');
};

FSharp['text_getSubstring'] = function (block) {
  // Get substring.
  const where1 = block.getFieldValue('WHERE1');
  const where2 = block.getFieldValue('WHERE2');
  console.log(where1);
  console.log(where2);
  const text =
    FSharp.valueToCode(block, 'STRING', FSharp.ORDER_MEMBER) || '""';
  let at1;
  switch (where1) {
    case 'FROM_START':
      at1 = FSharp.getAdjustedInt(block, 'AT1');
      if (at1 === 0) {
        at1 = '0';
      }
      break;
    // case 'FROM_END':
    //   at1 = FSharp.getAdjustedInt(block, 'AT1', 1);
    //   at1 = text.length + at1;
    //   break;
    case 'FIRST':
      at1 = '';
      break;
    default:
      throw Error('Unhandled option (text_getSubstring)');
  }

  let at2;
  switch (where2) {
    case 'FROM_START':
      at2 = FSharp.getAdjustedInt(block, 'AT2');
      break;
    // case 'FROM_END':
    //   at2 = FSharp.getAdjustedInt(block, 'AT2', 0, true);
    //   // Ensure that if the result calculated is 0 that sub-sequence will
    //   // include all elements as expected.
    //   if (at2 === 0) {
    //     at2 = '';
    //   } else {
    //     at2 = at2;
    //   }
    //   break;
    case 'LAST':
      at2 = '';
      break;
    default:
      throw Error('Unhandled option (text_getSubstring)');
  }
  const code = where1 === 'FIRST' && where2 === 'LAST' ? text : text + '[' + at1 + '..' + at2 + ']';
  return [code, FSharp.ORDER_MEMBER];
};

FSharp['text_changeCase'] = function (block) {
  // Change capitalization.
  const OPERATORS = {
    'UPPERCASE': '.ToUpper()',
    'LOWERCASE': '.ToLower()',
    //'TITLECASE': '.title()'
  };
  const operator = OPERATORS[block.getFieldValue('CASE')];
  const text = FSharp.valueToCode(block, 'TEXT', FSharp.ORDER_MEMBER) || '\'\'';
  const code = text + operator;
  return [code, FSharp.ORDER_FUNCTION_CALL];
};

FSharp['text_trim'] = function (block) {
  // Trim spaces.
  const OPERATORS = {
    'LEFT': '.TrimStart()',
    'RIGHT': '.TrimEnd()',
    'BOTH': '.Trim()'
  };
  const operator = OPERATORS[block.getFieldValue('MODE')];
  const text = Python.valueToCode(block, 'TEXT', FSharp.ORDER_MEMBER) || '\'\'';
  const code = text + operator;
  return [code, FSharp.ORDER_FUNCTION_CALL];
};

FSharp['text_print'] = function (block) {
  // Print statement.
  FSharp.definitions_['open_system'] = 'open System';
  const msg = FSharp.valueToCode(block, 'TEXT', FSharp.ORDER_NONE) || '\'\'';
  return 'printf "%A" ' + msg + '\n';
};

FSharp['text_replace'] = function (block) {
  const text = FSharp.valueToCode(block, 'TEXT', FSharp.ORDER_MEMBER) || '\'\'';
  const from = FSharp.valueToCode(block, 'FROM', FSharp.ORDER_NONE) || '\'\'';
  const to = FSharp.valueToCode(block, 'TO', FSharp.ORDER_NONE) || '\'\'';
  const code = text + '.Replace(' + from + ', ' + to + ')';
  return [code, FSharp.ORDER_MEMBER];
};

FSharp['text_reverse'] = function (block) {
  const text = FSharp.valueToCode(block, 'TEXT', FSharp.ORDER_MEMBER) || '\'\'';
  const code = text + ' |> Seq.rev |> String.Concat';
  return [code, FSharp.ORDER_MEMBER];
};



// NOT INCLUDED

// Python['text_prompt_ext'] = function(block) {
//   // Prompt function.
//   const functionName = Python.provideFunction_('text_prompt', [
//     'def ' + Python.FUNCTION_NAME_PLACEHOLDER_ + '(msg):', '  try:',
//     '    return raw_input(msg)', '  except NameError:', '    return input(msg)'
//   ]);
//   let msg;
//   if (block.getField('TEXT')) {
//     // Internal message.
//     msg = Python.quote_(block.getFieldValue('TEXT'));
//   } else {
//     // External message.
//     msg = Python.valueToCode(block, 'TEXT', Python.ORDER_NONE) || '\'\'';
//   }
//   let code = functionName + '(' + msg + ')';
//   const toNumber = block.getFieldValue('TYPE') === 'NUMBER';
//   if (toNumber) {
//     code = 'float(' + code + ')';
//   }
//   return [code, Python.ORDER_FUNCTION_CALL];
// };

// Python['text_prompt'] = Python['text_prompt_ext'];

// Python['text_count'] = function(block) {
//   const text = Python.valueToCode(block, 'TEXT', Python.ORDER_MEMBER) || '\'\'';
//   const sub = Python.valueToCode(block, 'SUB', Python.ORDER_NONE) || '\'\'';
//   const code = text + '.count(' + sub + ')';
//   return [code, Python.ORDER_FUNCTION_CALL];
// };


// FSharp['text_append'] = function (block) {
//   // Append to a variable in place.
//   const varName =
//     FSharp.nameDB_.getName(block.getFieldValue('VAR'), NameType.VARIABLE);
//   const value = FSharp.valueToCode(block, 'TEXT', FSharp.ORDER_NONE) || '\'\'';
//   return varName + ' = sting ' + varName + ' + ' + forceString(value)[0] + '\n';
// };