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

Blockly.Blocks['comp_builder'] = {
    init: function () {
        const nameField = new FieldTextInput('name', ComputationExpressions.rename);
        this.appendDummyInput()
            .appendField("???")
            .appendField(nameField, "NAME");
        this.setColour(20);
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
            .appendField('', 'NAME');
        this.appendStatementInput("WORKFLOW");
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
    /**
     * Create XML to represent the (non-editable) name and arguments.
     * Backwards compatible serialization implementation.
     * @return {!Element} XML storage element.
     * @this {Block}
     */
    mutationToDom: function () {
        const container = xmlUtils.createElement('mutation');
        container.setAttribute('name', this.getWorkflowName());
        return container;
    },
    /**
     * Parse XML to restore the (non-editable) name and parameters.
     * Backwards compatible serialization implementation.
     * @param {!Element} xmlElement XML storage element.
     * @this {Block}
     */
    domToMutation: function (xmlElement) {
        const name = xmlElement.getAttribute('name');
        this.renameComp(this.getWorkflowName(), name);
    },
    /**
     * Returns the state of this block as a JSON serializable object.
     * @return {{name: string, params:(!Array<string>|undefined)}} The state of
     *     this block, ie the params and procedure name.
     */
    saveExtraState: function () {
        const state = Object.create(null);
        state['name'] = this.getWorkflowName();
        return state;
    },
    /**
     * Applies the given state to this block.
     * @param {*} state The state to apply to this block, ie the params and
     *     procedure name.
     */
    loadExtraState: function (state) {
        this.renameComp(this.getWorkflowName(), state['name']);
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
    },
    /**
     * Called whenever anything on the workspace changes.
     * Add warning if this case block is not nested inside a type workflow block.
     * @param {!AbstractEvent} _e Change event.
     * @this {Block}
     */
    onchange: function (_e) {
        if (this.workspace.isDragging && this.workspace.isDragging()) {
            return;  // Don't change state at the start of a drag.
        }
        let legal = false;
        // Is the block nested in a procedure?
        let block = this;
        do {
            if (block.type === 'comp_workflow') {
                legal = true;
                break;
            }
            block = block.getSurroundParent();
        } while (block);
        if (legal) {
            this.setWarningText(null);
            if (!this.isInFlyout) {
                this.setEnabled(true);
            }
        } else {
            this.setWarningText('Warning: This block may be used only within a computation expression workflow block.');
            if (!this.isInFlyout && !this.getInheritedDisabled()) {
                this.setEnabled(false);
            }
        }
    },
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
    },
    /**
     * Called whenever anything on the workspace changes.
     * Add warning if this case block is not nested inside a type workflow block.
     * @param {!AbstractEvent} _e Change event.
     * @this {Block}
     */
    onchange: function (_e) {
        if (this.workspace.isDragging && this.workspace.isDragging()) {
            return;  // Don't change state at the start of a drag.
        }
        let legal = false;
        // Is the block nested in a procedure?
        let block = this;
        do {
            if (block.type === 'comp_workflow') {
                legal = true;
                break;
            }
            block = block.getSurroundParent();
        } while (block);
        if (legal) {
            this.setWarningText(null);
            if (!this.isInFlyout) {
                this.setEnabled(true);
            }
        } else {
            this.setWarningText('Warning: This block may be used only within a computation expression workflow block.');
            if (!this.isInFlyout && !this.getInheritedDisabled()) {
                this.setEnabled(false);
            }
        }
    },
};