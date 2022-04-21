/**
 * @fileoverview Generating Python for computation expression blocks.
 */
'use strict';

goog.module('Blockly.FSharp.computationExpression');

const FSharp = goog.require('Blockly.FSharp');

FSharp['comp_builder'] = function (block) {
    return '';
}

FSharp['comp_workflow'] = FSharp['comp_builder'];
FSharp['comp_let'] = FSharp['comp_builder'];
FSharp['comp_return'] = FSharp['comp_builder'];