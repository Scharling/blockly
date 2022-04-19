/**
 * @fileoverview Algebraic datatype blocks for Blockly.
 */
'use strict';

goog.module('Blockly.blocks.algebraicDatatypes');

const AlgebraicDatatypes = goog.require('Blockly.AlgebraicDatatypes');

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

const typeUtils = goog.require('Blockly.extra.utils.types');

Blockly.Blocks['typedefinition'] = {
    init: function () {
        const nameField = new FieldTextInput('typeName', AlgebraicDatatypes.rename);
        this.appendValueInput("TYPE")
            .appendField("Define Type")
            .appendField(nameField, "TYPENAME")
            .appendField("of")
            .setCheck("type");
        this.appendStatementInput("CASES")
            .setCheck("String");
        this.setInputsInline(true);
        this.setColour(180);
        this.setTooltip("");
        this.setHelpUrl("");
    },
    /**
   * Return the definition of this algebraic datatype.
   * @return {!Array} Tuple containing three elements:
   *     - the name of the data type
   * @this {Block}
   */
    getDatatypeDef: function () {
        return [this.getFieldValue('TYPENAME')];
    },
};

Blockly.Blocks['casewithouttype'] = {
    init: function () {
        this.appendDummyInput()
            .appendField("case")
            .appendField(new Blockly.FieldTextInput("name"), "NAME");
        this.setInputsInline(true);
        this.setPreviousStatement(true, null);
        this.setNextStatement(true, null);
        this.setColour(180);
        this.setTooltip("");
        this.setHelpUrl("");
    }
};

Blockly.Blocks['casewithtype'] = {
    init: function () {
        this.appendValueInput("TYPE")
            .setCheck("type")
            .appendField("case")
            .appendField(new Blockly.FieldTextInput("name"), "NAME")
            .appendField("of");
        this.setInputsInline(true);
        this.setPreviousStatement(true, null);
        this.setNextStatement(true, null);
        this.setColour(180);
        this.setTooltip("");
        this.setHelpUrl("");
    }
};

Blockly.Blocks['datatype'] = {
    init: function () {
        this.appendDummyInput().appendField('', 'NAME');
        this.setInputsInline(true);
        this.setOutput(true, null);
        this.setColour(180);
        this.setTooltip("");
        this.setHelpUrl("");
    },
    defType_: 'typedefinition',
    getFSharpType() {
        return this.getDatatypeName();
    },
    /**
   * Returns the name of the algebraic datatype this block refers.
   * @return {string} Datatype name.
   * @this {Block}
   */
    getDatatypeName: function () {
        // The NAME field is guaranteed to exist, null will never be returned.
        return /** @type {string} */ (this.getFieldValue('NAME'));
    },
    /**
     * Notification that a datatype is renaming.
     * If the name matches this block's datatype, rename it.
     * @param {string} oldName Previous name of datatype.
     * @param {string} newName Renamed datatype.
     * @this {Block}
     */
    renameType: function (oldName, newName) {
        if (Names.equals(oldName, this.getDatatypeName())) {
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
        container.setAttribute('name', this.getDatatypeName());
        // container.setAttribute('argCount', this.argCount_);
        // for (let i = 0; i < this.arguments_.length; i++) {
        //   const parameter = xmlUtils.createElement('arg');
        //   parameter.setAttribute('name', this.arguments_[i]);
        //   container.appendChild(parameter);
        // }
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
        this.renameType(this.getDatatypeName(), name);
        // const argCount = xmlElement.getAttribute('argCount');
        // this.argCount_ = argCount ?? 'ALL';
        // const args = [];
        // const paramIds = [];
        // for (let i = 0, childNode; (childNode = xmlElement.childNodes[i]); i++) {
        //   if (childNode.nodeName.toLowerCase() === 'arg') {
        //     args.push(childNode.getAttribute('name'));
        //     paramIds.push(childNode.getAttribute('paramId'));
        //   }
        // }
        // this.setProcedureParameters_(args, paramIds);
    },
    /**
     * Returns the state of this block as a JSON serializable object.
     * @return {{name: string, params:(!Array<string>|undefined)}} The state of
     *     this block, ie the params and procedure name.
     */
    saveExtraState: function () {
        const state = Object.create(null);
        state['name'] = this.getDatatypeName();
        // state['argCount'] = this.argCount_
        // if (this.arguments_.length) {
        //     state['params'] = this.arguments_;
        // }
        return state;
    },
    /**
     * Applies the given state to this block.
     * @param {*} state The state to apply to this block, ie the params and
     *     procedure name.
     */
    loadExtraState: function (state) {
        this.renameType(this.getDatatypeName(), state['name']);
        // this.argCount_ = state['argCount'];
        // const params = state['params'];
        // if (params) {
        //     const ids = [];
        //     ids.length = params.length;
        //     ids.fill(null);
        //     this.setProcedureParameters_(params, ids);
        // }
    },
};