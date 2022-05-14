/**
 * @fileoverview Generating F# for option blocks.
 */
'use strict';

goog.module('Blockly.FSharp.option');

const FSharp = goog.require('Blockly.FSharp');
const stringUtils = goog.require('Blockly.utils.string');
const { NameType } = goog.require('Blockly.Names');

FSharp['option_none'] = function (block) {
    return ['None', FSharp.ORDER_NONE];
};

FSharp['option_some'] = function (block) {
    const value = FSharp.valueToCode(block, 'VALUE', FSharp.ORDER_NONE) || 'None';
    const code = value === 'None' ? 'None' : 'Some ' + value;
    return [code, FSharp.ORDER_NONE];
};