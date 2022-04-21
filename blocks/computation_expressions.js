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

// Blockly.Blocks['comp_builder'] = {
//     init: function () {
//         const nameField = new FieldTextInput('name', ComputationExpressions.rename);
//         this.appendDummyInput()
//             .appendField("???")
//             .appendField(nameField, "NAME");
//         this.setColour(20);
//         this.setTooltip("");
//         this.setHelpUrl("");
//     }
// };

Blockly.Blocks['comp_builder'] = {
  init: function() {
    this.appendDummyInput()
        .appendField("Computation expression")
        .appendField(new Blockly.FieldTextInput("name", ComputationExpressions.rename), "NAME");
    this.appendValueInput("BIND")
        .setCheck(null)
        .setAlign(Blockly.ALIGN_RIGHT)
        .appendField("Bind(m, f)");
    this.appendValueInput("RETURN")
        .setCheck(null)
        .setAlign(Blockly.ALIGN_RIGHT)
        .appendField("Return(x)");
    this.setColour(230);
    this.setTooltip("");
    this.setHelpUrl("");
    },
  getCompDef: function () {
      return this.getFieldValue('NAME');
  },
};

Blockly.Blocks['comp_workflow'] = {
    init: function () {
        this.appendDummyInput()
            .appendField('lol', 'NAME');
        this.appendStatementInput("WORKFLOW");
        this.setPreviousStatement(true, null);
        this.setNextStatement(true, null);
        this.setOutput(true, null);
        this.setColour(20);
        this.setTooltip("");
        this.setHelpUrl("");
    },
    /**
     * Returns the name of the computation expression this block refers.
     * @return {string} Comp exp name.
     * @this {Block}
     */
    getWorkflowName: function () {
        // The NAME field is guaranteed to exist, null will never be returned.
        return /** @type {string} */ (this.getFieldValue('NAME'));
    },
    /**
     * Notification that a comp exp is renaming.
     * If the name matches this block, rename it.
     * @param {string} oldName Previous name of comp exp.
     * @param {string} newName Renamed comp exp.
     * @this {Block}
     */
    renameComp: function (oldName, newName) {
        if (Names.equals(oldName, this.getWorkflowName())) {
            this.setFieldValue(newName, 'NAME');
        }
    },
};

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