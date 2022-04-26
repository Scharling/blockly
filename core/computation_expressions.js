/**
 * @fileoverview Utility functions for handling computation expressions.
 */
'use strict';

/**
 * Utility functions for handling variables.
 * @namespace Blockly.ComputationExpressions
 */
goog.module('Blockly.ComputationExpressions');

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
 * @alias Blockly.ComputationExpressions.CATEGORY_NAME
 */
const CATEGORY_NAME = 'COMPUTATIONEXPRESSION';
exports.CATEGORY_NAME = CATEGORY_NAME;

/**
 * Find all user-created computation expression builders in a workspace.
 * @param {!Workspace} root Root workspace.
 * @return {!Array<!Array>} Array with builder definitions.
 *      Each type is defined by a name (an extension would include which keywords are implemented).
 * @alias Blockly.ComputationExpressions.allCompExpressions
 */
const allCompExpressions = function (root) {
    const compExps =
        root.getBlocksByType('comp_builder', false)
            .map(function (block) {
                return /** @type {!CompBlock} */ (block).getCompDef();
            });
    compExps.sort(procTupleComparator);
    return compExps;
};
exports.allCompExpressions = allCompExpressions;

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
 * Rename a computation expression.  Called by the editable field.
 * @param {string} name The proposed new name.
 * @return {string} The accepted name.
 * @this {Field}
 * @alias Blockly.ComputationExpressions.rename
 */
const rename = function (name) {
    // Strip leading and trailing whitespace.  Beyond this, all names are legal.
    name = name.trim();

    const legalName = findLegalName(
        name,
         /** @type {!Block} */(this.getSourceBlock()));
    const oldName = this.getValue();
    if (oldName !== name && oldName !== legalName) {
        // Rename any references.
        const blocks = this.getSourceBlock().workspace.getAllBlocks(false);
        for (let i = 0; i < blocks.length; i++) {
            if (blocks[i].renameComp) {
                const compBlock = /** @type {!CompBlock} */ (blocks[i]);
                compBlock.renameComp(
              /** @type {string} */(oldName), legalName);
            }
        }
    }
    return legalName;
};
exports.rename = rename;

/**
 * Ensure two identically-named computations expressions don't exist.
 * Take the proposed algebraic datatype name, and return a legal name i.e. one that
 * is not empty and doesn't collide with other computations expressions.
 * @param {string} name Proposed computations expressions name.
 * @param {!Block} block Block to disambiguate.
 * @return {string} Non-colliding name.
 * @alias Blockly.ComputationExpressions.findLegalName
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
* Does this computations expression have a legal name?  Illegal names include names of
* computations expressions already defined.
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
 * Return if the given name is already a computations expressions name.
 * @param {string} name The questionable name.
 * @param {!Workspace} workspace The workspace to scan for collisions.
 * @param {Block=} opt_exclude Optional block to exclude from
 *     comparisons (one doesn't want to collide with oneself).
 * @return {boolean} True if the name is used, otherwise return false.
 * @alias Blockly.ComputationExpressions.isNameUsed
 */
const isNameUsed = function (name, workspace, opt_exclude) {
    const blocks = workspace.getAllBlocks(false);
    // Iterate through every block and check the name.
    for (let i = 0; i < blocks.length; i++) {
        if (blocks[i] === opt_exclude) {
            continue;
        }
        if (blocks[i].getCompDef) {
            const compBlock = /** @type {!CompBlock} */ (blocks[i]);
            const compName = compBlock.getCompDef();
            if (Names.equals(compName, name)) {
                return true;
            }
        }
    }
    return false;
};
exports.isNameUsed = isNameUsed;

/**
 * Construct the blocks required by the flyout for the
 * computation expressions category.
 * @param {!Workspace} workspace The workspace containing computation expressions.
 * @return {!Array<!Element>} Array of XML elements.
 * @alias Blockly.ComputationExpressions.flyoutCategory
 */
const flyoutCategory = function (workspace) {
    let xmlList = [];
    if (Blocks['comp_builder']) {
        // <block type="comp_builder" gap="16"></block>
        const block = utilsXml.createElement('block');
        block.setAttribute('type', 'comp_builder');
        block.setAttribute('gap', 16);

        const value1 = utilsXml.createElement('value');
        value1.setAttribute('name', 'BIND');

        const bindBlock = utilsXml.createElement('block');
        bindBlock.setAttribute('type', 'procedures_anonymous');

        const bindMutation = utilsXml.createElement('mutation');
        bindMutation.setAttribute('name', 'Bind');

        const bindArgM = utilsXml.createElement('arg');
        bindArgM.setAttribute('name', 'm');
        const bindArgF = utilsXml.createElement('arg');
        bindArgF.setAttribute('name', 'f');
        bindMutation.appendChild(bindArgM);
        bindMutation.appendChild(bindArgF);

        workspace.createVariable('m', null, null, true);
        workspace.createVariable('f',  null, null, true);


        bindBlock.appendChild(bindMutation);

        value1.appendChild(bindBlock);

        block.appendChild(value1);

        const value2 = utilsXml.createElement('value');
        value2.setAttribute('name', 'RETURN');

        const returnBlock = utilsXml.createElement('block');
        returnBlock.setAttribute('type', 'procedures_anonymous');

        const returnMutation = utilsXml.createElement('mutation');
        returnMutation.setAttribute('name', 'Return');

        const returnArg = utilsXml.createElement('arg');
        returnArg.setAttribute('name', 'x');
        returnMutation.appendChild(returnArg);

        workspace.createVariable('x',  null, null, true);

        returnBlock.appendChild(returnMutation);

        value2.appendChild(returnBlock);

        block.appendChild(value2);
        
        xmlList.push(block);
    }
    if (Blocks['comp_let']) {
        // <block type="comp_let" gap="16"></block>
        const block = utilsXml.createElement('block');
        block.setAttribute('type', 'comp_let');
        block.setAttribute('gap', 16);
        xmlList.push(block);
    }
    if (Blocks['comp_return']) {
        // <block type="comp_return" gap="16"></block>
        const block = utilsXml.createElement('block');
        block.setAttribute('type', 'comp_return');
        block.setAttribute('gap', 16);
        xmlList.push(block);
    }
    if (xmlList.length) {
        // Add slightly larger gap between system blocks and user calls.
        xmlList[xmlList.length - 1].setAttribute('gap', 24);
    }

    /**
   * Add items to xmlList for each listed comp exp.
   * @param {!Array<!Array>} datatypeList A list of computation expressions
   * @param {string} templateName The type of the block to generate.
   */
    function populateWorkflows(compList) {
        for (let i = 0; i < compList.length; i++) {
            // <block type="comp_workflow" gap="16">
            //   <mutation name="name" items=0></mutation>
            // </block>
            const block = utilsXml.createElement('block');
            block.setAttribute('type', 'comp_workflow');
            block.setAttribute('gap', 16);

            const mutation = utilsXml.createElement('mutation');
            mutation.setAttribute('name', compList[i]);
            block.appendChild(mutation);
            xmlList.push(block);
        }
    }

    const compExps = allCompExpressions(workspace);
    populateWorkflows(compExps);
    return xmlList;
};
exports.flyoutCategory = flyoutCategory;
