/**
 * @fileoverview Computation Expression blocks for Blockly.
 */
'use strict';

goog.module('Blockly.blocks.computationExpressions');

const ComputationExpressions = goog.require('Blockly.ComputationExpressions');

/* eslint-disable-next-line no-unused-vars */
const AbstractEvent = goog.requireType('Blockly.Events.Abstract');
const ContextMenu = goog.require('Blockly.ContextMenu');
const Events = goog.require('Blockly.Events');
const Variables = goog.require('Blockly.Variables');
const Xml = goog.require('Blockly.Xml');
const internalConstants = goog.require('Blockly.internalConstants');
const xmlUtils = goog.require('Blockly.utils.xml');
const { Align } = goog.require('Blockly.Input');
/* eslint-disable-next-line no-unused-vars */
const { Block } = goog.requireType('Blockly.Block');
const { Blocks } = goog.require('Blockly.blocks');
/* eslint-disable-next-line no-unused-vars */
const { FieldCheckbox } = goog.require('Blockly.FieldCheckbox');
const { FieldLabel } = goog.require('Blockly.FieldLabel');
const { FieldTextInput } = goog.require('Blockly.FieldTextInput');
const { Msg } = goog.require('Blockly.Msg');
const { Mutator } = goog.require('Blockly.Mutator');
const { Names } = goog.require('Blockly.Names');
/* eslint-disable-next-line no-unused-vars */
const { VariableModel } = goog.requireType('Blockly.VariableModel');
/* eslint-disable-next-line no-unused-vars */
const { Workspace } = goog.requireType('Blockly.Workspace');
/** @suppress {extraRequire} */
goog.require('Blockly.Comment');
/** @suppress {extraRequire} */
goog.require('Blockly.Warning');

Blockly.Blocks['comp_let'] = {
    init: function () {
        this.appendValueInput("VALUE")
            .setCheck(null)
            .appendField("let!");
        this.setPreviousStatement(true, null);
        this.setNextStatement(true, null);
        this.setColour(20);
        this.setTooltip("");
        this.setHelpUrl("");
    }
};

Blockly.Blocks['comp_return'] = {
    init: function () {
        this.appendValueInput("VALUE")
            .setCheck(null)
            .appendField("return");
        this.setPreviousStatement(true, null);
        this.setNextStatement(true, null);
        this.setColour(20);
        this.setTooltip("");
        this.setHelpUrl("");
    }
};