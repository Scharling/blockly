/**
 * @fileoverview Utility functions for handling algebraic datatypes.
 */
'use strict';

/**
 * Utility functions for handling variables.
 * @namespace Blockly.AlgebraicDatatypes
 */
goog.module('Blockly.AlgebraicDatatypes');

/* eslint-disable-next-line no-unused-vars */
const Abstract = goog.requireType('Blockly.Events.Abstract');
const Variables = goog.require('Blockly.Variables');
const Xml = goog.require('Blockly.Xml');
const eventUtils = goog.require('Blockly.Events.utils');
const utilsXml = goog.require('Blockly.utils.xml');
const { Blocks } = goog.require('Blockly.blocks');
/* eslint-disable-next-line no-unused-vars */
const { Block } = goog.requireType('Blockly.Block');
/* eslint-disable-next-line no-unused-vars */
const { Field } = goog.requireType('Blockly.Field');
const { Msg } = goog.require('Blockly.Msg');
const { Names } = goog.require('Blockly.Names');
/* eslint-disable-next-line no-unused-vars */
const { WorkspaceSvg } = goog.requireType('Blockly.WorkspaceSvg');
const { Workspace } = goog.require('Blockly.Workspace');

/**
 * String for use in the "custom" attribute of a category in toolbox XML.
 * This string indicates that the category should be dynamically populated with
 * algebraic datatype blocks.
 * See also Blockly.Procedures.CATEGORY_NAME and
 * Blockly.VariablesDynamic.CATEGORY_NAME.
 * @const {string}
 * @alias Blockly.AlgebraicDatatypes.CATEGORY_NAME
 */
const CATEGORY_NAME = 'ALGEBRAICDATATYPE';
exports.CATEGORY_NAME = CATEGORY_NAME;

/**
 * Algebraic Datatype block type.
 * @typedef {{
 *    getDatatypeName: function():string,
 *    renameType: function(string,string),
 *    getDatatypeDef: function():!Array
 * }}
 * @alias Blockly.Procedures.ProcedureBlock
 */
let DatatypeBlock;
exports.DatatypeBlock = DatatypeBlock;

/**
 * Find all user-created algebraic datatype definitions in a workspace.
 * @param {!Workspace} root Root workspace.
 * @return {!Array<!Array>} Pair of arrays, the
 *     first contains procedures without return variables, the second with.
 *     Each procedure is defined by a three-element list of name, parameter
 *     list, and return value boolean.
 * @alias Blockly.AlgebraicDatatypes.allDatatypes
 */
const allDatatypes = function (root) {
    const datatypes =
        root.getBlocksByType('typedefinition', false)
            .map(function (block) {
                return /** @type {!DatatypeBlock} */ (block).getDatatypeDef();
            });
    datatypes.sort(procTupleComparator);
    return datatypes;
};
exports.allDatatypes = allDatatypes;

/**
 * Comparison function for case-insensitive sorting of the first element of
 * a tuple.
 * @param {!Array} ta First tuple.
 * @param {!Array} tb Second tuple.
 * @return {number} -1, 0, or 1 to signify greater than, equality, or less than.
 */
const procTupleComparator = function (ta, tb) {
    return ta[0].localeCompare(tb[0], undefined, { sensitivity: 'base' });
};

/**
 * Rename a datatype.  Called by the editable field.
 * @param {string} name The proposed new name.
 * @return {string} The accepted name.
 * @this {Field}
 * @alias Blockly.AlgebraicDatatypes.rename
 */
const rename = function (name) {
    // Strip leading and trailing whitespace.  Beyond this, all names are legal.
    name = name.trim();

    // const legalName = findLegalName(
    //   name,
    //     /** @type {!Block} */(this.getSourceBlock()));
    const legalName = name;
    const oldName = this.getValue();
    if (oldName !== name && oldName !== legalName) {
        // Rename any references.
        const blocks = this.getSourceBlock().workspace.getAllBlocks(false);
        for (let i = 0; i < blocks.length; i++) {
            if (blocks[i].renameType) {
                const datatypeBlock = /** @type {!DatatypeBlock} */ (blocks[i]);
                datatypeBlock.renameType(
              /** @type {string} */(oldName), legalName);
            }
        }
    }
    return legalName;
};
exports.rename = rename;

/**
 * Construct the blocks required by the flyout for the
 * algebraic datatypes category.
 * @param {!Workspace} workspace The workspace containing algebraic datatypes.
 * @return {!Array<!Element>} Array of XML elements.
 * @alias Blockly.AlgebraicDatatypes.flyoutCategory
 */
const flyoutCategory = function (workspace) {
    let xmlList = [];
    console.log("flyoutCategory bhyf");

    if (Blocks['typedefinition']) {
        // <block type="typedefinition" gap="16"></block>
        const block = utilsXml.createElement('block');
        block.setAttribute('type', 'typedefinition');
        block.setAttribute('gap', 16);
        xmlList.push(block);
    }
    if (Blocks['casewithouttype']) {
        // <block type="casewithouttype" gap="16"></block>
        const block = utilsXml.createElement('block');
        block.setAttribute('type', 'casewithouttype');
        block.setAttribute('gap', 16);
        xmlList.push(block);
    }
    if (Blocks['casewithtype']) {
        // <block type="casewithtype" gap="16"></block>
        const block = utilsXml.createElement('block');
        block.setAttribute('type', 'casewithtype');
        block.setAttribute('gap', 16);
        xmlList.push(block);
    }
    if (xmlList.length) {
        // Add slightly larger gap between system blocks and user calls.
        xmlList[xmlList.length - 1].setAttribute('gap', 24);
    }

    /**
   * Add items to xmlList for each listed datatype.
   * @param {!Array<!Array>} datatypeList A list of datatypes, each of which
   *     is defined by a three-element list of name, parameter list, and return
   *     value boolean.
   * @param {string} templateName The type of the block to generate.
   */
    function populateDatatypes(datatypeList, templateName) {
        for (let i = 0; i < datatypeList.length; i++) {
            const name = datatypeList[i][0];
            console.log(name, datatypeList);
            // const args = procedureList[i][1];
            // if (!procedureList[i][3]) {
            //     continue;
            // }

            // <block type="datatype" gap="16">
            //   <mutation name="name">
            //   </mutation>
            // </block>

            const block = utilsXml.createElement('block');
            block.setAttribute('type', templateName);
            block.setAttribute('gap', 16);

            const mutation = utilsXml.createElement('mutation');
            mutation.setAttribute('name', name);
            block.appendChild(mutation);

            // const nameField = utilsXml.createElement('field');
            // nameField.setAttribute('name', 'NAME');
            // const nameNode = utilsXml.createTextNode(name);
            // nameField.appendChild(nameNode);
            // block.appendChild(nameField);

            // const mutation = createCallMutation(name);
            // block.appendChild(mutation);
            // for (let j = 0; j < args.length; j++) {
            //     const arg = createCallArg(args[j].name);
            //     mutation.appendChild(arg);
            //     const type = args[j].type;
            //     if (type.block_name === "type_function") {
            //         const argNum = type.inputs.length;
            //         const subBlock = createCallBlock("args_callreturn");
            //         const subMutation = createCallMutation(args[j].name);
            //         subBlock.appendChild(subMutation);
            //         for (let k = 0; k < argNum; k++) {
            //             const subArg = createCallArg(("a" + k + " (" + type.inputs[k].getType() + ")"));
            //             subMutation.appendChild(subArg);
            //         }
            //         xmlList.push(subBlock);
            //     }
            // }
            xmlList.push(block);
        }
    }

    const datatypes = allDatatypes(workspace);
    populateDatatypes(datatypes, 'datatype');
    return xmlList;
};
exports.flyoutCategory = flyoutCategory;