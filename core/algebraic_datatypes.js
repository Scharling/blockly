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
 * @alias Blockly.AlgebraicDatatypes.DatatypeBlock
 */
let DatatypeBlock;
exports.DatatypeBlock = DatatypeBlock;

/**
 * Find all user-created algebraic datatype definitions in a workspace.
 * @param {!Workspace} root Root workspace.
 * @return {!Array<!Array>} Array wtih type definitions.
 *      Each type is defined by a three-element list of name,
 *      number of types inputs, and list of cases.
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

    const legalName = findLegalName(
        name,
         /** @type {!Block} */(this.getSourceBlock()));
    //const legalName = name;
    const oldName = this.getValue();
    if (oldName !== name && oldName !== legalName) {
        // Rename any references.
        const blocks = this.getSourceBlock().workspace.getAllBlocks(false);
        for (let i = 0; i < blocks.length; i++) {
            if (blocks[i].rename) {
                const datatypeBlock = /** @type {!DatatypeBlock} */ (blocks[i]);
                datatypeBlock.rename(
              /** @type {string} */(oldName), legalName);
            }
        }
    }
    return legalName;
};
exports.rename = rename;

/**
 * Ensure two identically-named algebraic datatypes don't exist.
 * Take the proposed algebraic datatype name, and return a legal name i.e. one that
 * is not empty and doesn't collide with other algebraic datatypes.
 * @param {string} name Proposed algebraic datatype name.
 * @param {!Block} block Block to disambiguate.
 * @return {string} Non-colliding name.
 * @alias Blockly.AlgebraicDatatypes.findLegalName
 */
const findLegalName = function (name, block) {
    if (block.isInFlyout) {
        // Flyouts can have multiple procedures called 'do something'.
        return name;
    }
    name = name || Msg['UNNAMED_KEY'] || 'unnamed';
    while (!isLegalName(name, block.workspace, block)) {
        // Collision with another procedure.
        const r = name.match(/^(.*?)(\d+)$/);
        if (!r) {
            name += '2';
        } else {
            name = r[1] + (parseInt(r[2], 10) + 1);
        }
    }
    return name;
};
exports.findLegalName = findLegalName;

/**
* Does this algebraic datatype have a legal name?  Illegal names include names of
* algebraic datatypes already defined.
* @param {string} name The questionable name.
* @param {!Workspace} workspace The workspace to scan for collisions.
* @param {Block=} opt_exclude Optional block to exclude from
*     comparisons (one doesn't want to collide with oneself).
* @return {boolean} True if the name is legal.
*/
const isLegalName = function (name, workspace, opt_exclude) {
    return !isNameUsed(name, workspace, opt_exclude);
};

/**
 * Return if the given name is already a algebraic datatype name.
 * @param {string} name The questionable name.
 * @param {!Workspace} workspace The workspace to scan for collisions.
 * @param {Block=} opt_exclude Optional block to exclude from
 *     comparisons (one doesn't want to collide with oneself).
 * @return {boolean} True if the name is used, otherwise return false.
 * @alias Blockly.AlgebraicDatatypes.isNameUsed
 */
const isNameUsed = function (name, workspace, opt_exclude) {
    const blocks = workspace.getAllBlocks(false);
    // Iterate through every block and check the name.
    for (let i = 0; i < blocks.length; i++) {
        if (blocks[i] === opt_exclude) {
            continue;
        }
        if (blocks[i].getDatatypeDef) {
            const datatypeBlock = /** @type {!DatatypeBlock} */ (blocks[i]);
            const datatypeName = datatypeBlock.getDatatypeDef();
            if (Names.equals(datatypeName[0], name)) {
                return true;
            }
        }
    }
    return false;
};
exports.isNameUsed = isNameUsed;

/**
 * Construct the blocks required by the flyout for the
 * algebraic datatypes category.
 * @param {!Workspace} workspace The workspace containing algebraic datatypes.
 * @return {!Array<!Element>} Array of XML elements.
 * @alias Blockly.AlgebraicDatatypes.flyoutCategory
 */
const flyoutCategory = function (workspace) {
    let xmlList = [];
    if (Blocks['typedefinition']) {
        // <block type="typedefinition" gap="16"></block>
        const block = utilsXml.createElement('block');
        block.setAttribute('type', 'typedefinition');
        block.setAttribute('gap', 16);
        xmlList.push(block);
    }
    if (Blocks['case']) {
        // <block type="casewithouttype" gap="16"></block>
        const block = utilsXml.createElement('block');
        block.setAttribute('type', 'case');
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
    function populateDatatypes(datatypeList) {
        for (let i = 0; i < datatypeList.length; i++) {

            xmlList.push(createBlock('datatype', datatypeList[i][0], datatypes[i][1]));

            const cases = datatypes[i][2];
            for (let j = 0; j < cases.length; j++) {
                xmlList.push(createBlock('type_builder', cases[j][0], cases[j][1].length));
            }
        }
    }

    function createBlock(templateName, name, typeNumber) {
        // <block type="datatype" gap="16">
        //   <mutation name="name" items=0></mutation>
        // </block>

        const block = utilsXml.createElement('block');
        block.setAttribute('type', templateName);
        block.setAttribute('gap', 16);

        const mutation = utilsXml.createElement('mutation');
        mutation.setAttribute('name', name);
        mutation.setAttribute('items', typeNumber);
        block.appendChild(mutation);
        return block;
    }

    const datatypes = allDatatypes(workspace);
    populateDatatypes(datatypes);
    return xmlList;
};
exports.flyoutCategory = flyoutCategory;

/**
 * Find all the usages of a type.
 * @param {string} name Name of type.
 * @param {!Workspace} workspace The workspace to find usages in.
 * @return {!Array<!Block>} Array of usage blocks.
 * @alias Blockly.AlgebraicDatatypes.getUsages
 */
const getUsages = function (name, workspace) {
    const usages = [];
    const blocks = workspace.getAllBlocks(false);
    // Iterate through every block and check the name.
    for (let i = 0; i < blocks.length; i++) {
        if (blocks[i].getUsageName) {
            const typeBlock = /** @type {!DatatypeBlock} */ (blocks[i]);
            const typeName = typeBlock.getUsageName();
            // Procedure name may be null if the block is only half-built.
            if (typeName && Names.equals(typeName, name)) {
                usages.push(blocks[i]);
            }
        }
    }
    return usages;
};
exports.getUsages = getUsages;

/**
 * When a type/case definition changes its type inputs, find and edit all its
 * usages.
 * @param {!Block} defBlock Type/case definition block.
 * @alias Blockly.AlgebraicDatatypes.mutateUsers
 */
const mutateUsers = function (defBlock) {
    const oldRecordUndo = eventUtils.getRecordUndo();
    const typeBlock = /** @type {!DatatypeBlock} */ (defBlock);
    const name = typeBlock.getDatatypeName();
    const xmlElement = defBlock.mutationToDom(true);
    const users = getUsages(name, defBlock.workspace);
    for (let i = 0, user; (user = users[i]); i++) {
        const oldMutationDom = user.mutationToDom();
        const oldMutation = oldMutationDom && Xml.domToText(oldMutationDom);
        user.domToMutation(xmlElement);
        const newMutationDom = user.mutationToDom();
        const newMutation = newMutationDom && Xml.domToText(newMutationDom);
        if (oldMutation !== newMutation) {
            // Fire a mutation on every caller block.  But don't record this as an
            // undo action since it is deterministically tied to the procedure's
            // definition mutation.
            eventUtils.setRecordUndo(false);
            eventUtils.fire(new (eventUtils.get(eventUtils.BLOCK_CHANGE))(
                user, 'mutation', null, oldMutation, newMutation));
            eventUtils.setRecordUndo(oldRecordUndo);
        }
    }
};
exports.mutateUsers = mutateUsers;