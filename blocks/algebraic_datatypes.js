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

const DEFS_COMMON = {
    /**
    * Create XML to represent inputs.
    * Backwards compatible serialization implementation.
    * @return {!Element} XML storage element.
    * @this {Block}
    */
    mutationToDom: function () {
        const container = Blockly.utils.xml.createElement('mutation');
        container.setAttribute('items', this.itemCount_);
        return container;
    },
    /**
     * Parse XML to restore the type inputs.
     * Backwards compatible serialization implementation.
     * @param {!Element} xmlElement XML storage element.
     * @this {Block}
     */
    domToMutation: function (xmlElement) {
        this.itemCount_ = parseInt(xmlElement.getAttribute('items'), 10);
        this.updateShape_();
        AlgebraicDatatypes.mutateUsers(this);
    },
    /**
     * Returns the state of this block as a JSON serializable object.
     * @return {{itemCount: number}} The state of this block, ie the item count.
     */
    saveExtraState: function () {
        return {
            'itemCount': this.itemCount_,
        };
    },
    /**
     * Applies the given state to this block.
     * @param {*} state The state to apply to this block, ie the item count.
     */
    loadExtraState: function (state) {
        this.itemCount_ = state['itemCount'];
        this.updateShape_();
        AlgebraicDatatypes.mutateUsers(this);
    },
}

Blockly.Blocks['typedefinition'] = {
    ...DEFS_COMMON,
    init: function () {
        const nameField = new FieldTextInput('typeName', AlgebraicDatatypes.rename);
        this.appendDummyInput()
            .appendField("Define Type")
            .appendField(nameField, "TYPENAME")
            .appendField('', 'PARAMS');
        this.appendStatementInput("CASES")
            .setCheck("String");
        this.setInputsInline(true);
        this.setColour(180);
        this.setTooltip("");
        this.setHelpUrl("");
        this.itemCount_ = 0;
        this.updateShape_();
        this.setMutator(new Blockly.Mutator(['typedefinition_create_with_item']));
    },
    /**
     * Populate the mutator's dialog with this block's components.
     * @param {!Workspace} workspace Mutator's workspace.
     * @return {!Block} Root block in mutator.
     * @this {Block}
     */
    decompose: function (workspace) {
        const containerBlock = workspace.newBlock('typedefinition_create_with_container');
        containerBlock.initSvg();
        let connection = containerBlock.getInput('STACK').connection;
        for (let i = 0; i < this.itemCount_; i++) {
            const itemBlock = workspace.newBlock('typedefinition_create_with_item');
            itemBlock.initSvg();
            connection.connect(itemBlock.previousConnection);
            connection = itemBlock.nextConnection;
        }
        AlgebraicDatatypes.mutateUsers(this);
        return containerBlock;
    },
    /**
     * Reconfigure this block based on the mutator dialog's components.
     * @param {!Block} containerBlock Root block in mutator.
     * @this {Block}
     */
    compose: function (containerBlock) {
        let itemBlock = containerBlock.getInputTargetBlock('STACK');
        // Count number of inputs.
        const connections = [];
        while (itemBlock && !itemBlock.isInsertionMarker()) {
            connections.push(itemBlock.valueConnection_);
            itemBlock =
                itemBlock.nextConnection && itemBlock.nextConnection.targetBlock();
        }
        this.itemCount_ = connections.length;
        this.updateShape_();
        AlgebraicDatatypes.mutateUsers(this);
    },
    /**
     * Modify this block to have the correct number of inputs.
     * @private
     * @this {Block}
     */
    updateShape_: function () {
        var output = "";
        if (this.itemCount_ > 0) {
            var args = [];
            for (var i = 0; i < this.itemCount_; i++) {
                args.push(getPolyType(i));
            }
            output = 'of ' + args.join(", ");
        } 

        this.setFieldValue(output, 'PARAMS');

    },
    getCases: function () {
        const cases = [];
        if (this.childBlocks_.length < 1) return cases;

        let caseBlock = this.childBlocks_[0];
        while (caseBlock && !caseBlock.isInsertionMarker()) {
            // try {
            //     validatorExternal(paramBlock, paramBlock.getFieldValue('NAME'), this);
            // } catch (error) {
            //     console.log(error);
            // }
            var types = [];
            for (var i = 0; i < caseBlock.childBlocks_.length; i++) {
                if (caseBlock.childBlocks_[i] && caseBlock.childBlocks_[i].type != null && (caseBlock.childBlocks_[i].type.startsWith("type_") || caseBlock.childBlocks_[i].type === "datatype")) {
                    const typedBlock = caseBlock.childBlocks_[i];
                    const type = typeUtils.createTypeFromBlock(typedBlock);
                    types.push(type);
                }
            }
            const caseName = caseBlock.getFieldValue('NAME');
            cases.push([caseName, types]);
            caseBlock =
                caseBlock.nextConnection && caseBlock.nextConnection.targetBlock();
        }
        return cases;
    },
    /**
     * Return the definition of this algebraic datatype.
     * @return {!Array} Tuple containing three elements:
     *     - the name of the data type
     * @this {Block}
     */
    getDatatypeDef: function () {
        const cases = this.getCases();
        return [this.getFieldValue('TYPENAME'), this.itemCount_, cases];
    },
    getDatatypeName: function () {
        return this.getFieldValue('TYPENAME');
    },
};

const alphabet = "abcdefghijklmnopqrstuvwxyz"
function getPolyType(polyCounter) {
  return "'" + alphabet.charAt(polyCounter);
}

Blockly.Blocks['typedefinition_create_with_container'] = {
    /**
     * Mutator block for type definition container.
     * @this {Block}
     */
    init: function () {
        //this.setStyle('list_blocks');
        this.setColour(180);
        this.appendDummyInput().appendField("polymorphic types");
        this.appendStatementInput('STACK');
        this.setTooltip("Add or remove polymorphic types to be used in the type definition.");
        this.contextMenu = false;
    },
};

Blockly.Blocks['typedefinition_create_with_item'] = {
    /**
     * Mutator block for adding items.
     * @this {Block}
     */
    init: function () {
        this.setColour(180);
        this.appendDummyInput().appendField("item");
        this.setPreviousStatement(true);
        this.setNextStatement(true);
        this.setTooltip("Add a polymorphic type to be used in the type definition");
        this.contextMenu = false;
    },
};

Blockly.Blocks['case'] = {
    ...DEFS_COMMON,
    init: function () {
        const nameField = new FieldTextInput('name', AlgebraicDatatypes.rename);
        this.appendDummyInput()
            .appendField("case")
            .appendField(nameField, "NAME")
            .appendField('', 'OF');
        this.setInputsInline(true);
        this.setPreviousStatement(true, null);
        this.setNextStatement(true, null);
        this.setColour(180);
        this.setTooltip("");
        this.setHelpUrl("");
        this.itemCount_ = 0;
        this.updateShape_();
        this.setMutator(new Blockly.Mutator(['case_create_with_item']));
    },
    /**
     * Populate the mutator's dialog with this block's components.
     * @param {!Workspace} workspace Mutator's workspace.
     * @return {!Block} Root block in mutator.
     * @this {Block}
     */
    decompose: function (workspace) {
        const containerBlock = workspace.newBlock('case_create_with_container');
        containerBlock.initSvg();
        let connection = containerBlock.getInput('STACK').connection;
        for (let i = 0; i < this.itemCount_; i++) {
            const itemBlock = workspace.newBlock('case_create_with_item');
            itemBlock.initSvg();
            connection.connect(itemBlock.previousConnection);
            connection = itemBlock.nextConnection;
        }
        AlgebraicDatatypes.mutateUsers(this);
        return containerBlock;
    },
    /**
     * Reconfigure this block based on the mutator dialog's components.
     * @param {!Block} containerBlock Root block in mutator.
     * @this {Block}
     */
    compose: function (containerBlock) {
        let itemBlock = containerBlock.getInputTargetBlock('STACK');
        // Count number of inputs.
        const connections = [];
        while (itemBlock && !itemBlock.isInsertionMarker()) {
            connections.push(itemBlock.valueConnection_);
            itemBlock =
                itemBlock.nextConnection && itemBlock.nextConnection.targetBlock();
        }
        // Disconnect any children that don't belong.
        for (let i = 0; i < this.itemCount_; i++) {
            const connection = this.getInput('ADD' + i).connection.targetConnection;
            if (connection && connections.indexOf(connection) === -1) {
                connection.disconnect();
            }
        }
        this.itemCount_ = connections.length;
        this.updateShape_();
        AlgebraicDatatypes.mutateUsers(this);
        // Reconnect any child blocks.
        for (let i = 0; i < this.itemCount_; i++) {
            Blockly.Mutator.reconnect(connections[i], this, 'ADD' + i);
        }
    },
    /**
     * Store pointers to any connected child blocks.
     * @param {!Block} containerBlock Root block in mutator.
     * @this {Block}
     */
    saveConnections: function (containerBlock) {
        let itemBlock = containerBlock.getInputTargetBlock('STACK');
        let i = 0;
        while (itemBlock) {
            const input = this.getInput('ADD' + i);
            itemBlock.valueConnection_ = input && input.connection.targetConnection;
            itemBlock =
                itemBlock.nextConnection && itemBlock.nextConnection.targetBlock();
            i++;
        }
    },
    /**
     * Modify this block to have the correct number of inputs.
     * @private
     * @this {Block}
     */
    updateShape_: function () {
        if (this.itemCount_ > 0) {
            this.setFieldValue('of', 'OF');
        } else {
            this.setFieldValue('', 'OF');
        }
        // Add new inputs.
        for (let i = 0; i < this.itemCount_; i++) {
            if (!this.getInput('ADD' + i)) {
                const input = this.appendValueInput('ADD' + i);
                if (i > 0 && i < this.itemCount_) {
                    input.appendField("*");
                }
            }
        }
        // Remove deleted inputs.
        for (let i = this.itemCount_; this.getInput('ADD' + i); i++) {
            this.removeInput('ADD' + i);
        }
    },
    getDatatypeName: function () {
        return this.getFieldValue('NAME');
    },
};

Blockly.Blocks['case_create_with_container'] = {
    /**
     * Mutator block for type definition container.
     * @this {Block}
     */
    init: function () {
        //this.setStyle('list_blocks');
        this.setColour(180);
        this.appendDummyInput().appendField("Types for case");
        this.appendStatementInput('STACK');
        this.setTooltip("Add or remove types to the case.");
        this.contextMenu = false;
    },
};

Blockly.Blocks['case_create_with_item'] = {
    /**
     * Mutator block for adding items.
     * @this {Block}
     */
    init: function () {
        this.setColour(180);
        this.appendDummyInput().appendField("type");
        this.setPreviousStatement(true);
        this.setNextStatement(true);
        this.setTooltip("Add a type to the case");
        this.contextMenu = false;
    },
    defType_: 'typedefinition'
};

const COMMON = {
    /**
     * Returns the name of the algebraic datatype this block refers.
     * @return {string} Datatype name.
     * @this {Block}
     */
    getUsageName: function () {
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
    rename: function (oldName, newName) {
        if (Names.equals(oldName, this.getUsageName())) {
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
        container.setAttribute('name', this.getUsageName());
        container.setAttribute('items', this.itemCount_);
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
        this.rename(this.getUsageName(), name);
        const itemCount = xmlElement.getAttribute('items');
        this.itemCount_ = itemCount;
        this.updateShape_();
    },
    /**
     * Returns the state of this block as a JSON serializable object.
     * @return {{name: string, params:(!Array<string>|undefined)}} The state of
     *     this block, ie the params and procedure name.
     */
    saveExtraState: function () {
        const state = Object.create(null);
        state['name'] = this.getUsageName();
        state['items'] = this.itemCount_;
        return state;
    },
    /**
     * Applies the given state to this block.
     * @param {*} state The state to apply to this block, ie the params and
     *     procedure name.
     */
    loadExtraState: function (state) {
        this.rename(this.getUsageName(), state['name']);
        this.itemCount_ = state['items'];
        this.updateShape_();
    },
}

Blockly.Blocks['datatype'] = {
    ...COMMON,
    init: function () {
        this.appendDummyInput().appendField('', 'NAME').appendField('', 'OF');
        this.setInputsInline(true);
        this.setOutput(true, null);
        this.setColour(60);
        this.setTooltip("");
        this.setHelpUrl("");
        this.itemCount_ = 0;
    },
    defType_: 'typedefinition',
    /**
   * Modify this block to have the correct number of arguments.
   * @private
   * @this {Block}
   */
    updateShape_: function () {
        if (this.itemCount_ > 0) {
            this.setFieldValue('of', 'OF');
        } else {
            this.setFieldValue('', 'OF');
        }
        // Add new inputs.
        for (let i = 0; i < this.itemCount_; i++) {
            if (!this.getInput('ADD' + i)) {
                const input = this.appendValueInput('ADD' + i);
                if (i > 0 && i < this.itemCount_) {
                    input.appendField(",");
                }
            }
        }
        // Remove deleted inputs.
        for (let i = this.itemCount_; this.getInput('ADD' + i); i++) {
            this.removeInput('ADD' + i);
        }
    },
};

Blockly.Blocks['type_builder'] = {
    ...COMMON,
    init: function () {
        this.appendDummyInput().appendField('', 'NAME');
        this.setInputsInline(true);
        this.setOutput(true, null);
        this.setColour(180);
        this.setTooltip("");
        this.setHelpUrl("");
        this.itemCount_ = 0;
    },
    /**
   * Modify this block to have the correct number of arguments.
   * @private
   * @this {Block}
   */
    updateShape_: function () {
        // Add new inputs.
        for (let i = 0; i < this.itemCount_; i++) {
            if (!this.getInput('ADD' + i)) {
                const input = this.appendValueInput('ADD' + i);
                if (i > 0 && i < this.itemCount_) {
                    input.appendField(",");
                }
            }
        }
        // Remove deleted inputs.
        for (let i = this.itemCount_; this.getInput('ADD' + i); i++) {
            this.removeInput('ADD' + i);
        }
    },
};