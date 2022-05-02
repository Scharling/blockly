/**
 * @fileoverview Generating FSharp for list blocks.
 */
'use strict';

goog.module('Blockly.FSharp.lists');

const FSharp = goog.require('Blockly.FSharp');
const stringUtils = goog.require('Blockly.utils.string');
const { NameType } = goog.require('Blockly.Names');


FSharp['lists_create_with'] = function (block) {
    // Create a list with any number of elements of any type.
    const elements = new Array(block.itemCount_);
    for (let i = 0; i < block.itemCount_; i++) {
        elements[i] =
            FSharp.valueToCode(block, 'ADD' + i, FSharp.ORDER_NONE) || null;
    }
    const filteredElements = elements.filter(e => e !== null);
    const code = '[' + filteredElements.join('; ') + ']';
    return [code, FSharp.ORDER_ATOMIC];
};

FSharp['lists_length'] = function (block) {
    // String or array length.
    const list = FSharp.valueToCode(block, 'VALUE', FSharp.ORDER_NONE) || '[]';
    const code = list + '.Length';
    return [code, FSharp.ORDER_FUNCTION_APPLICATION];
};

FSharp['lists_isEmpty'] = function (block) {
    // Is the string null or array empty?
    const list = FSharp.valueToCode(block, 'VALUE', FSharp.ORDER_NONE) || '[]';
    const code = list + '.IsEmpty';
    return [code, FSharp.ORDER_FUNCTION_APPLICATION];
};

FSharp['lists_sort'] = function (block) {
    const list = FSharp.valueToCode(block, 'VALUE', FSharp.ORDER_NONE) || '[]';
    const code = 'List.sort ' + list;
    return [code, FSharp.ORDER_FUNCTION_APPLICATION];
};

FSharp['lists_cons'] = function (block) {
    const value = FSharp.valueToCode(block, 'VALUE', FSharp.ORDER_NONE) || null;
    const list = FSharp.valueToCode(block, 'LIST', FSharp.ORDER_NONE) || '[]';
    const code = value === null ? list : value + '::' + list;
    return [code, FSharp.ORDER_ADDITIVE];
};

FSharp['lists_append'] = function (block) {
    const list1 = FSharp.valueToCode(block, 'LIST1', FSharp.ORDER_NONE) || '[]';
    const list2 = FSharp.valueToCode(block, 'LIST2', FSharp.ORDER_NONE) || '[]';
    const code = list1 + '@' + list2;
    return [code, FSharp.ORDER_ADDITIVE];
};

FSharp['lists_getHead'] = function (block) {
    const list = FSharp.valueToCode(block, 'VALUE', FSharp.ORDER_NONE) || '[]';
    const code = list + '.Head';
    return [code, FSharp.ORDER_FUNCTION_APPLICATION];
};

FSharp['lists_getTail'] = function (block) {
    const list = FSharp.valueToCode(block, 'VALUE', FSharp.ORDER_NONE) || '[]';
    const code = list + '.Tail';
    return [code, FSharp.ORDER_FUNCTION_APPLICATION];
};

// Python['lists_indexOf'] = function(block) {
//   // Find an item in the list.
//   const item = Python.valueToCode(block, 'FIND', Python.ORDER_NONE) || '[]';
//   const list = Python.valueToCode(block, 'VALUE', Python.ORDER_NONE) || '\'\'';
//   let errorIndex = ' -1';
//   let firstIndexAdjustment = '';
//   let lastIndexAdjustment = ' - 1';

//   if (block.workspace.options.oneBasedIndex) {
//     errorIndex = ' 0';
//     firstIndexAdjustment = ' + 1';
//     lastIndexAdjustment = '';
//   }

//   if (block.getFieldValue('END') === 'FIRST') {
//     const functionName = Python.provideFunction_('first_index', [
//       'def ' + Python.FUNCTION_NAME_PLACEHOLDER_ + '(my_list, elem):',
//       '  try: index = my_list.index(elem)' + firstIndexAdjustment,
//       '  except: index =' + errorIndex, '  return index'
//     ]);
//     const code = functionName + '(' + list + ', ' + item + ')';
//     return [code, Python.ORDER_FUNCTION_CALL];
//   }
//   const functionName = Python.provideFunction_('last_index', [
//     'def ' + Python.FUNCTION_NAME_PLACEHOLDER_ + '(my_list, elem):',
//     '  try: index = len(my_list) - my_list[::-1].index(elem)' +
//         lastIndexAdjustment,
//     '  except: index =' + errorIndex, '  return index'
//   ]);
//   const code = functionName + '(' + list + ', ' + item + ')';
//   return [code, Python.ORDER_FUNCTION_CALL];
// };

FSharp['lists_getIndex'] = function (block) {
    const listOrder = FSharp.ORDER_MEMBER;
    const list = FSharp.valueToCode(block, 'VALUE', listOrder) || '[]';
    const at = FSharp.getAdjustedInt(block, 'AT');
    const code = list + '[' + at + ']';
    return [code, FSharp.ORDER_MEMBER];
};

FSharp['lists_exists'] = function (block) {
    const listOrder = FSharp.ORDER_MEMBER;
    const list = FSharp.valueToCode(block, 'LIST', listOrder) || '[]';
    const func = FSharp.valueToCode(block, 'FUNCTION', listOrder) || "fun elem -> true";
    const code = 'List.exists' + ' (' + func + ') ' + list;
    return [code, FSharp.ORDER_FUNCTION_APPLICATION];
};

FSharp['lists_map'] = function (block) {
    const listOrder = FSharp.ORDER_MEMBER;
    const list = FSharp.valueToCode(block, 'LIST', listOrder) || '[]';
    const func = FSharp.valueToCode(block, 'FUNCTION', listOrder) || "fun elem -> elem";
    const code = 'List.map' + ' (' + func + ') ' + list;
    return [code, FSharp.ORDER_FUNCTION_APPLICATION];
};

FSharp['lists_filter'] = function (block) {
    const listOrder = FSharp.ORDER_MEMBER;
    const list = FSharp.valueToCode(block, 'LIST', listOrder) || '[]';
    const func = FSharp.valueToCode(block, 'FUNCTION', listOrder) || "fun elem -> true";
    const code = 'List.filter' + ' (' + func + ') ' + list;
    return [code, FSharp.ORDER_FUNCTION_APPLICATION];
};

FSharp['lists_fold'] = function (block) {
    const listOrder = FSharp.ORDER_MEMBER;
    const list = FSharp.valueToCode(block, 'LIST', listOrder) || '[]';
    const func = FSharp.valueToCode(block, 'FUNCTION', listOrder) || "fun acc elem -> acc";
    const acc = FSharp.valueToCode(block, 'VALUE', listOrder) || "0";
    const code = 'List.fold' + ' (' + func + ') ' + acc + ' ' + list;
    return [code, FSharp.ORDER_FUNCTION_APPLICATION];
};

// Python['lists_setIndex'] = function(block) {
//   // Set element at index.
//   // Note: Until February 2013 this block did not have MODE or WHERE inputs.
//   let list = Python.valueToCode(block, 'LIST', Python.ORDER_MEMBER) || '[]';
//   const mode = block.getFieldValue('MODE') || 'GET';
//   const where = block.getFieldValue('WHERE') || 'FROM_START';
//   const value = Python.valueToCode(block, 'TO', Python.ORDER_NONE) || 'None';
//   // Cache non-trivial values to variables to prevent repeated look-ups.
//   // Closure, which accesses and modifies 'list'.
//   function cacheList() {
//     if (list.match(/^\w+$/)) {
//       return '';
//     }
//     const listVar =
//         Python.nameDB_.getDistinctName('tmp_list', NameType.VARIABLE);
//     const code = listVar + ' = ' + list + '\n';
//     list = listVar;
//     return code;
//   }

//   switch (where) {
//     case 'FIRST':
//       if (mode === 'SET') {
//         return list + '[0] = ' + value + '\n';
//       } else if (mode === 'INSERT') {
//         return list + '.insert(0, ' + value + ')\n';
//       }
//       break;
//     case 'LAST':
//       if (mode === 'SET') {
//         return list + '[-1] = ' + value + '\n';
//       } else if (mode === 'INSERT') {
//         return list + '.append(' + value + ')\n';
//       }
//       break;
//     case 'FROM_START': {
//       const at = Python.getAdjustedInt(block, 'AT');
//       if (mode === 'SET') {
//         return list + '[' + at + '] = ' + value + '\n';
//       } else if (mode === 'INSERT') {
//         return list + '.insert(' + at + ', ' + value + ')\n';
//       }
//       break;
//     }
//     case 'FROM_END': {
//       const at = Python.getAdjustedInt(block, 'AT', 1, true);
//       if (mode === 'SET') {
//         return list + '[' + at + '] = ' + value + '\n';
//       } else if (mode === 'INSERT') {
//         return list + '.insert(' + at + ', ' + value + ')\n';
//       }
//       break;
//     }
//     case 'RANDOM': {
//       Python.definitions_['import_random'] = 'import random';
//       let code = cacheList();
//       const xVar = Python.nameDB_.getDistinctName('tmp_x', NameType.VARIABLE);
//       code += xVar + ' = int(random.random() * len(' + list + '))\n';
//       if (mode === 'SET') {
//         code += list + '[' + xVar + '] = ' + value + '\n';
//         return code;
//       } else if (mode === 'INSERT') {
//         code += list + '.insert(' + xVar + ', ' + value + ')\n';
//         return code;
//       }
//       break;
//     }
//   }
//   throw Error('Unhandled combination (lists_setIndex).');
// };

// Python['lists_getSublist'] = function(block) {
//   // Get sublist.
//   const list = Python.valueToCode(block, 'LIST', Python.ORDER_MEMBER) || '[]';
//   const where1 = block.getFieldValue('WHERE1');
//   const where2 = block.getFieldValue('WHERE2');
//   let at1;
//   switch (where1) {
//     case 'FROM_START':
//       at1 = Python.getAdjustedInt(block, 'AT1');
//       if (at1 === 0) {
//         at1 = '';
//       }
//       break;
//     case 'FROM_END':
//       at1 = Python.getAdjustedInt(block, 'AT1', 1, true);
//       break;
//     case 'FIRST':
//       at1 = '';
//       break;
//     default:
//       throw Error('Unhandled option (lists_getSublist)');
//   }

//   let at2;
//   switch (where2) {
//     case 'FROM_START':
//       at2 = Python.getAdjustedInt(block, 'AT2', 1);
//       break;
//     case 'FROM_END':
//       at2 = Python.getAdjustedInt(block, 'AT2', 0, true);
//       // Ensure that if the result calculated is 0 that sub-sequence will
//       // include all elements as expected.
//       if (!stringUtils.isNumber(String(at2))) {
//         Python.definitions_['import_sys'] = 'import sys';
//         at2 += ' or sys.maxsize';
//       } else if (at2 === 0) {
//         at2 = '';
//       }
//       break;
//     case 'LAST':
//       at2 = '';
//       break;
//     default:
//       throw Error('Unhandled option (lists_getSublist)');
//   }
//   const code = list + '[' + at1 + ' : ' + at2 + ']';
//   return [code, Python.ORDER_MEMBER];
// };

// Python['lists_sort'] = function(block) {
//   // Block for sorting a list.
//   const list = (Python.valueToCode(block, 'LIST', Python.ORDER_NONE) || '[]');
//   const type = block.getFieldValue('TYPE');
//   const reverse = block.getFieldValue('DIRECTION') === '1' ? 'False' : 'True';
//   const sortFunctionName = Python.provideFunction_('lists_sort', [
//     'def ' + Python.FUNCTION_NAME_PLACEHOLDER_ + '(my_list, type, reverse):',
//     '  def try_float(s):', '    try:', '      return float(s)', '    except:',
//     '      return 0', '  key_funcs = {', '    "NUMERIC": try_float,',
//     '    "TEXT": str,', '    "IGNORE_CASE": lambda s: str(s).lower()', '  }',
//     '  key_func = key_funcs[type]',
//     '  list_cpy = list(my_list)',  // Clone the list.
//     '  return sorted(list_cpy, key=key_func, reverse=reverse)'
//   ]);

//   const code =
//       sortFunctionName + '(' + list + ', "' + type + '", ' + reverse + ')';
//   return [code, Python.ORDER_FUNCTION_CALL];
// };

// Python['lists_split'] = function(block) {
//   // Block for splitting text into a list, or joining a list into text.
//   const mode = block.getFieldValue('MODE');
//   let code;
//   if (mode === 'SPLIT') {
//     const value_input =
//         Python.valueToCode(block, 'INPUT', Python.ORDER_MEMBER) || '\'\'';
//     const value_delim = Python.valueToCode(block, 'DELIM', Python.ORDER_NONE);
//     code = value_input + '.split(' + value_delim + ')';
//   } else if (mode === 'JOIN') {
//     const value_input =
//         Python.valueToCode(block, 'INPUT', Python.ORDER_NONE) || '[]';
//     const value_delim =
//         Python.valueToCode(block, 'DELIM', Python.ORDER_MEMBER) || '\'\'';
//     code = value_delim + '.join(' + value_input + ')';
//   } else {
//     throw Error('Unknown mode: ' + mode);
//   }
//   return [code, Python.ORDER_FUNCTION_CALL];
// };

// Python['lists_reverse'] = function(block) {
//   // Block for reversing a list.
//   const list = Python.valueToCode(block, 'LIST', Python.ORDER_NONE) || '[]';
//   const code = 'list(reversed(' + list + '))';
//   return [code, Python.ORDER_FUNCTION_CALL];
// };
