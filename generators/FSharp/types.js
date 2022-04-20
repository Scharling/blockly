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


FSharp['type_tuple'] = function (block) {
    var args = [];
    for (var i = 0; i < block.childBlocks_.length; i++) {
        args.push(FSharp.valueToCode(block, getTupleIndexName(i), FSharp.ORDER_ATOMIC))
    }
    const code = args.join(" * ");
    return [code, FSharp.ORDER_ATOMIC];
};

function getTupleIndexName(index) {
    switch (index) {
        case 0:
            return "FST"
        case 1:
            return "SND"
        default:
            return "ADD" + (index-2)
    }
}


FSharp['type_function'] = function (block) {
    var args = [];
    for (var i = 0; i < block.inputList.length; i++) {
        var element = block.inputList[i];
        if (element.name == "ARROW") continue;
        args.push(FSharp.valueToCode(block, element.name, FSharp.ORDER_ATOMIC))
    }

    const code = args.join(" -> ");
    return [code, FSharp.ORDER_FUNCTION_ARROW];
};


FSharp['type_int'] = FSharp['type_unit'];
FSharp['type_float'] = FSharp['type_unit'];
FSharp['type_string'] = FSharp['type_unit'];
FSharp['type_bool'] = FSharp['type_unit'];
FSharp['type_unit'] = FSharp['type_unit'];
FSharp['type_poly'] = FSharp['type_unit'];