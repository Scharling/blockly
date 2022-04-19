/**
 * @fileoverview Generating F# for type blocks.
 */
'use strict';

goog.module('Blockly.FSharp.types');
const typeUtils = goog.require('Blockly.extra.utils.types')

const FSharp = goog.require('Blockly.FSharp');

FSharp['type_unit'] = function (block) {
    const type = typeUtils.createTypeFromBlock(block);
    return [type.getFSharpType(), FSharp.ORDER_ATOMIC];
};

FSharp['type_int'] = FSharp['type_unit'];
FSharp['type_float'] = FSharp['type_unit'];
FSharp['type_string'] = FSharp['type_unit'];
FSharp['type_bool'] = FSharp['type_unit'];
FSharp['type_unit'] = FSharp['type_unit'];
FSharp['type_tuple'] = FSharp['type_unit'];
FSharp['type_function'] = FSharp['type_unit'];
FSharp['type_poly'] = FSharp['type_unit'];