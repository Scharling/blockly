/**
 * @license
 * Copyright 2012 Google LLC
 * SPDX-License-Identifier: Apache-2.0
 */

/**
 * @fileoverview Procedure blocks for Blockly.
 * @suppress {checkTypes|visibility}
 */
'use strict';

goog.module('Blockly.blocks.procedures');


/* eslint-disable-next-line no-unused-vars */
const AbstractEvent = goog.requireType('Blockly.Events.Abstract');
const ContextMenu = goog.require('Blockly.ContextMenu');
const Events = goog.require('Blockly.Events');
const eventUtils = goog.require('Blockly.Events.utils');
const Procedures = goog.require('Blockly.Procedures');
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

const types = ['type_int', 'type_float', 'type_string', 'type_char', 'type_bool', 'type_unit', 'type_tuple', 'type_function', 'type_poly', 'type_option', 'type_list'];

/**
 * Common properties for the procedure_defnoreturn and
 * procedure_defreturn blocks.
 */
const PROCEDURE_DEF_COMMON = {
  /**
   * Add or remove the statement block from this function definition.
   * @param {boolean} hasStatements True if a statement block is needed.
   * @this {Block}
   */
  setStatements_: function (hasStatements) {
    if (this.hasStatements_ === hasStatements) {
      return;
    }
    if (hasStatements) {
      this.appendStatementInput('STACK').appendField(
        Msg['PROCEDURES_DEFNORETURN_DO']);
      if (this.getInput('RETURN')) {
        this.moveInputBefore('STACK', 'RETURN');
      }
    } else {
      this.removeInput('STACK', true);
    }
    this.hasStatements_ = hasStatements;
  },
  /**
   * Update the display of parameters for this procedure definition block.
   * @private
   * @this {Block}
   */
  updateParams_: function () {
    // Merge the arguments into a human-readable list.
    let paramString = '';
    if (this.arguments_.length) {
      paramString = Msg['PROCEDURES_BEFORE_PARAMS'] + ' ';
      for (var i = 0; i < this.arguments_.length; i++) {
        let arg = this.arguments_[i];
        let varName = "";
        if (this.getProcedureName()) {
          varName = this.procedureName + "." + arg;
        } else {
          varName = "anonymous." + arg;
        }

        let variable = this.workspace.getVariableMap().getVariableByName(varName);
        if (variable) {
          if (i > 0) {
            paramString += ", ";
          }
          if (variable.type.block_name !== typeUtils.createNullType().block_name) {
            paramString = paramString + variable.displayName + " : " + variable.type.getType();
          } else {
            paramString = paramString + variable.displayName;
          }
        }
      }
    }
    // The params field is deterministic based on the mutation,
    // no need to fire a change event.
    //Events.disable();
    try {
      this.setFieldValue(paramString, 'PARAMS');
    } finally {
      //Events.enable();
    }
  },
  updateIsRec_: function (isRec) {
    this.isRec_ = isRec;
    const recString = isRec ? "rec" : "";
    this.setFieldValue(recString, "REC");
  },
  /**
   * Update the display of return type for this procedure definition block.
   * @private
   * @this {Block}
   */
  updateReturnType_: function () {
    let returnTypeString = 'return';
    if (!!this.returnType_) {
      returnTypeString = "return: " + this.returnType_.getType();
    }
    // The return type field is deterministic based on the mutation,
    // no need to fire a change event.
    Events.disable();
    try {
      this.setFieldValue(returnTypeString, 'RETURNTYPE');
    } finally {
      Events.enable();
    }
  },
  /**
   * Create XML to represent the argument inputs.
   * Backwards compatible serialization implementation.
   * @param {boolean=} opt_paramIds If true include the IDs of the parameter
   *     quarks.  Used by Procedures.mutateCallers for reconnection.
   * @return {!Element} XML storage element.
   * @this {Block}
   */
  mutationToDom: function (opt_paramIds) {
    const container = xmlUtils.createElement('mutation');
    if (opt_paramIds) {
      container.setAttribute('name', this.getFieldValue('NAME'));
    }
    for (let i = 0; i < this.argumentVarModels_.length; i++) {
      const parameter = xmlUtils.createElement('arg');
      const argModel = this.argumentVarModels_[i];
      parameter.setAttribute('name', argModel.name);
      parameter.setAttribute('varid', argModel.getId());
      parameter.setAttribute('displayName', argModel.displayName);
      if (opt_paramIds && this.paramIds_) {
        parameter.setAttribute('paramId', this.paramIds_[i]);
      }
      container.appendChild(parameter);
    }

    if (!!this.returnType_) {
      const returnType = typeUtils.createXmlFromType(this.returnType_, 'returntype');
      container.appendChild(returnType);
    }

    // Save whether the statement input is visible.
    if (!this.hasStatements_) {
      container.setAttribute('statements', 'false');
    }

    container.setAttribute('isRec', this.isRec_);

    return container;
  },
  /**
   * Parse XML to restore the argument inputs.
   * Backwards compatible serialization implementation.
   * @param {!Element} xmlElement XML storage element.
   * @this {Block}
   */
  domToMutation: function (xmlElement) {
    this.arguments_ = [];
    this.returnType_ = null;
    this.argumentVarModels_ = [];
    for (let i = 0, childNode; (childNode = xmlElement.childNodes[i]); i++) {
      if (childNode.nodeName.toLowerCase() === 'arg') {
        const varName = childNode.getAttribute('name');
        const displayName = childNode.getAttribute('displayName');
        const type = childNode.getAttribute('type');
        const varId =
          childNode.getAttribute('varid') || childNode.getAttribute('varId');
        this.arguments_.push(displayName);
        const variable = Variables.getOrCreateVariablePackage(
          this.workspace, varId, varName, childNode.getAttribute('type'), childNode.getAttribute('displayName'));
        if (variable !== null) {
          this.argumentVarModels_.push(variable);
        } else {
          console.log(
            'Failed to create a variable with name ' + varName +
            ', ignoring.');
        }
      } else if (childNode.nodeName.toLowerCase() === 'returntype') {
        const returnType = typeUtils.createTypeFromXml(childNode);
        this.returnType_ = returnType;
      }
    }
    this.updateParams_();
    this.updateReturnType_();
    if (this.type === 'procedures_defreturn') this.updateIsRec_(xmlElement.getAttribute('isRec') !== 'false');
    Procedures.mutateCallers(this);

    // Show or hide the statement input.
    this.setStatements_(xmlElement.getAttribute('statements') !== 'false');

  },
  /**
   * Returns the state of this block as a JSON serializable object.
   * @return {?{params: (!Array<{name: string, id: string}>|undefined),
   *     hasStatements: (boolean|undefined)}} The state of this block, eg the
   *     parameters and statements.
   */
  saveExtraState: function () {
    if (!this.argumentVarModels_.length && this.hasStatements_ && !this.returnType_) {
      return null;
    }
    const state = Object.create(null);
    if (this.argumentVarModels_.length) {
      state['params'] = [];
      for (let i = 0; i < this.argumentVarModels_.length; i++) {
        state['params'].push({
          // We don't need to serialize the name, but just in case we decide
          // to separate params from variables.
          'name': this.argumentVarModels_[i].name,
          'id': this.argumentVarModels_[i].getId(),
          'type': this.argumentVarModels_[i].type,
          'displayName': this.argumentVarModels_[i].displayName
        });
      }
    }
    if (!!this.returnType_) {
      state['returntype'] = this.returnType_;
    }
    if (!this.hasStatements_) {
      state['hasStatements'] = false;
    }
    if (this.getProcedureName()) {
      state['procedureName'] = this.procedureName;
    }

    state['isRec'] = this.isRec_;
    return state;
  },
  /**
   * Applies the given state to this block.
   * @param {*} state The state to apply to this block, eg the parameters and
   *     statements.
   */
  loadExtraState: function (state) {
    this.arguments_ = [];
    this.argumentVarModels_ = [];
    if (state['params']) {
      for (let i = 0; i < state['params'].length; i++) {
        const param = state['params'][i];
        const variable = Variables.getOrCreateVariablePackage(
          this.workspace, param['id'], param['name'], param['type'], param['displayName']);
        this.arguments_.push(variable.displayName);
        this.argumentVarModels_.push(variable);
      }
    }
    if (state['returntype']) {
      this.returnType_ = state['returntype'];
    }
    if (state['procedureName']) {
      this.procedureName = state['procedureName']
    }
    this.updateParams_();
    this.updateReturnType_();
    if (this.type === 'procedures_defreturn') this.updateIsRec_(state['isRec']);
    Procedures.mutateCallers(this);
    this.setStatements_(state['hasStatements'] === false ? false : true);
  },
  /**
   * Populate the mutator's dialog with this block's components.
   * @param {!Workspace} workspace Mutator's workspace.
   * @return {!Block} Root block in mutator.
   * @this {Block}
   */
  decompose: function (workspace) {
    /*
     * Creates the following XML:
     * <block type="procedures_mutatorcontainer">
     *   <statement name="STACK">
     *     <block type="procedures_mutatorarg">
     *       <field name="NAME">arg1_name</field>
     *       <next>etc...</next>
     *     </block>
     *   </statement>
     *   <input name="RETURNTYPE">
     *     <block type=[return type]></block>
     *   </input>
     * </block>
     */
    const containerBlockNode = xmlUtils.createElement('block');
    containerBlockNode.setAttribute('type', 'procedures_mutatorcontainer');
    const statementNode = xmlUtils.createElement('statement');
    statementNode.setAttribute('name', 'STACK');
    containerBlockNode.appendChild(statementNode);

    this.procedureName = this.getFieldValue('NAME');
    const outerWs = Mutator.findParentWs(workspace);
    let node = statementNode;
    for (let i = 0; i < this.arguments_.length; i++) {
      const variableName = this.arguments_[i];
      const argBlockNode = xmlUtils.createElement('block');
      argBlockNode.setAttribute('type', 'procedures_mutatorarg');
      const fieldNode = xmlUtils.createElement('field');
      fieldNode.setAttribute('name', 'NAME');
      const argumentName = xmlUtils.createTextNode(variableName);
      fieldNode.appendChild(argumentName);
      argBlockNode.appendChild(fieldNode);
      const nextNode = xmlUtils.createElement('next');
      argBlockNode.appendChild(nextNode);

      const typeNode = xmlUtils.createElement('value');
      typeNode.setAttribute('name', 'TYPE');
      let varName = this.arguments_[i];
      if (!(this.arguments_[i].startsWith(this.procedureName + ".") || this.arguments_[i].startsWith("anonymous."))) {
        if (this.procedureName) {
          varName = this.procedureName + "." + this.arguments_[i];
        } else {
          varName = "anonymous." + this.arguments_[i];
        }
      }
      const varModel = this.argumentVarModels_[i];
      const variable = Variables.getOrCreateVariablePackage(outerWs, varModel.getId(), varName, varModel.type, varModel.displayName);
      const typeBlockNode = typeUtils.createBlockFromType(variable.type);

      if (typeBlockNode != null) {
        typeNode.appendChild(typeBlockNode);
        argBlockNode.appendChild(typeNode);
      }
      node.appendChild(argBlockNode);
      node = nextNode;
    }

    var procedureName = "";
    if (this.getProcedureName()) {
      procedureName = this.procedureName;
    } else {
      procedureName = "anonymous";
    }

    // Set return type block
    const returnNode = xmlUtils.createElement('value');
    returnNode.setAttribute('name', 'RETURNTYPE');
    containerBlockNode.appendChild(returnNode);
    if (!!this.returnType_) {
      const returnBlockNode = typeUtils.createBlockFromType(this.returnType_);
      returnNode.appendChild(returnBlockNode);
    }
    const containerBlock = Xml.domToBlock(containerBlockNode, workspace, procedureName);
    if (this.type === 'procedures_defreturn' || this.type === 'procedures_anonymous') {
      containerBlock.setFieldValue(this.hasStatements_, 'STATEMENTS');
    }
    if (this.type === 'procedures_defreturn') {
      containerBlock.setFieldValue(this.isRec_, 'REC');
    } else {
      //containerBlock.removeInput('STATEMENT_INPUT');
      containerBlock.removeInput('REC_INPUT');
    }

    // Initialize procedure's callers with blank IDs.
    Procedures.mutateCallers(this);
    return containerBlock;
  },
  /**
   * Reconfigure this block based on the mutator dialog's components.
   * @param {!Block} containerBlock Root block in mutator.
   * @this {Block}
   */
  compose: function (containerBlock) {
    // Parameter list.
    this.arguments_ = [];
    this.returnType_ = null;
    this.paramIds_ = [];
    this.argumentVarModels_ = [];
    let paramBlock = containerBlock.getInputTargetBlock('STACK');
    while (paramBlock && !paramBlock.isInsertionMarker()) {
      try {
        validatorExternal(paramBlock, paramBlock.getFieldValue('NAME'), this, false);
      } catch (error) {
        console.log(error);
      }
      var varType = typeUtils.createNullType();
      for (var i = 0; i < paramBlock.childBlocks_.length; i++) {
        if (isTypedBlock(paramBlock, i)) {
          const typedBlock = paramBlock.childBlocks_[i];
          varType = typeUtils.createTypeFromBlock(typedBlock);
          break;
        }
      }
      const varName = paramBlock.getFieldValue('NAME');
      this.arguments_.push(varName);

      var varMapName = "";
      if (this.getProcedureName()) {
        varMapName = this.procedureName + "." + varName;
      } else {
        varMapName = "anonymous." + varName;
      }

      const variable = this.workspace.getVariable(varMapName, varType);
      if (variable) {
        this.argumentVarModels_.push(variable);
      }
      this.paramIds_.push(paramBlock.id);
      paramBlock =
        paramBlock.nextConnection && paramBlock.nextConnection.targetBlock();
    }

    let returnTypeBlock = containerBlock.getInputTargetBlock('RETURNTYPE');
    if (!!returnTypeBlock) {
      this.returnType_ = typeUtils.createTypeFromBlock(returnTypeBlock);
    }

    this.updateParams_();
    this.updateReturnType_();
    if (this.type === 'procedures_defreturn') {
      let isRec = containerBlock.getFieldValue('REC');
      this.updateIsRec_(isRec === 'TRUE');
    }
    Procedures.mutateCallers(this);

    // Show/hide the statement input.
    let hasStatements = containerBlock.getFieldValue('STATEMENTS');
    if (hasStatements !== null) {
      hasStatements = hasStatements === 'TRUE';
      if (this.hasStatements_ !== hasStatements) {
        if (hasStatements) {
          this.setStatements_(true);
          // Restore the stack, if one was saved.
          Mutator.reconnect(this.statementConnection_, this, 'STACK');
          this.statementConnection_ = null;
        } else {
          // Save the stack, then disconnect it.
          const stackConnection = this.getInput('STACK').connection;
          this.statementConnection_ = stackConnection.targetConnection;
          if (this.statementConnection_) {
            const stackBlock = stackConnection.targetBlock();
            stackBlock.unplug();
            stackBlock.bumpNeighbours();
          }
          this.setStatements_(false);
        }
      }
    }
  },
  isRec: function () {
    return this.isRec_;
  },
  /**
   * Return all variables referenced by this block.
   * @return {!Array<string>} List of variable names.
   * @this {Block}
   */
  getVars: function () {
    return this.arguments_;
  },
  /**
  * Return all variables referenced by this block.
  * @return {!Array<string>} List of variable names.
  * @this {Block}
  */
  getPrefixedVars: function () {
    var procedureName = this.getFieldValue("NAME");
    return this.arguments_.map((element) => procedureName + "." + element);

  },
  /**
   * Return all variables referenced by this block.
   * @return {!Array<!VariableModel>} List of variable models.
   * @this {Block}
   */
  getVarModels: function () {
    return this.argumentVarModels_;
  },
  /**
   * Return procedureName.
   * @return {!String} procedureName
   * @this {Block}
   */
  getProcedureName: function () {
    if (this.procedureName) {
      return this.procedureName;
    } else {
      var procedureName = this.getFieldValue("NAME");
      this.procedureName = procedureName;
      return this.procedureName;
    }
  },
  /**
   * Notification that a variable is renaming.
   * If the ID matches one of this block's variables, rename it.
   * @param {string} oldId ID of variable to rename.
   * @param {string} newId ID of new variable.  May be the same as oldId, but
   *     with an updated name.  Guaranteed to be the same type as the old
   *     variable.
   * @override
   * @this {Block}
   */
  renameVarById: function (oldId, newId) {
    const oldVariable = this.workspace.getVariableById(oldId);
    if (oldVariable.type !== '') {
      // Procedure arguments always have the empty type.
      return;
    }
    const oldName = oldVariable.name;
    const newVar = this.workspace.getVariableById(newId);

    let change = false;
    for (let i = 0; i < this.argumentVarModels_.length; i++) {
      if (this.argumentVarModels_[i].getId() === oldId) {
        this.arguments_[i] = newVar.name;
        this.argumentVarModels_[i] = newVar;
        change = true;
      }
    }
    if (change) {
      this.displayRenamedVar_(oldName, newVar.name);
      Procedures.mutateCallers(this);
    }
  },
  /**
   * Notification that a variable is renaming but keeping the same ID.  If the
   * variable is in use on this block, rerender to show the new name.
   * @param {!VariableModel} variable The variable being renamed.
   * @package
   * @override
   * @this {Block}
   */
  updateVarName: function (variable) {
    const newName = variable.name;
    let change = false;
    let oldName;
    for (let i = 0; i < this.argumentVarModels_.length; i++) {
      if (this.argumentVarModels_[i].getId() === variable.getId()) {
        oldName = this.arguments_[i];
        this.arguments_[i] = newName;
        change = true;
      }
    }
    if (change) {
      this.displayRenamedVar_(oldName, newName);
      Procedures.mutateCallers(this);
    }
  },
  /**
   * Update the display to reflect a newly renamed argument.
   * @param {string} oldName The old display name of the argument.
   * @param {string} newName The new display name of the argument.
   * @private
   * @this {Block}
   */
  displayRenamedVar_: function (oldName, newName) {
    this.updateParams_();
    // Update the mutator's variables if the mutator is open.
    if (this.mutator && this.mutator.isVisible()) {
      const blocks = this.mutator.workspace_.getAllBlocks(false);
      for (let i = 0, block; (block = blocks[i]); i++) {
        if (block.type === 'procedures_mutatorarg' &&
          Names.equals(oldName, block.getFieldValue('NAME'))) {
          block.setFieldValue(newName, 'NAME');
        }
      }
    }
  },
  renameVarsWhenProcedurenameChanges: function (newProcedurename) {
    this.procedureName = newProcedurename;
    const oldArgs = [...this.arguments_];
    const newVarModels = [];
    for (let i = 0; i < this.argumentVarModels_.length; i++) {
      const varModel = this.argumentVarModels_[i];
      this.workspace.renameVariableById(varModel.getId(), newProcedurename + "." + varModel.displayName);
      const newVar = this.workspace.getVariableById(varModel.getId());
      newVarModels.push(newVar);
    }
    this.argumentVarModels_ = newVarModels;
    this.arguments_ = oldArgs;
    this.updateParams_();
  },
  /**
   * Add custom menu options to this block's context menu.
   * @param {!Array} options List of menu options to add to.
   * @this {Block}
   */
  customContextMenu: function (options) {
    if (this.isInFlyout) {
      return;
    }
    // Add option to create caller.
    const option = { enabled: true };
    const name = this.getFieldValue('NAME');
    option.text = Msg['PROCEDURES_CREATE_DO'].replace('%1', name);

    const xmlMutation = xmlUtils.createElement('mutation');
    xmlMutation.setAttribute('name', name);
    for (let i = 0; i < this.arguments_.length; i++) {
      const xmlArg = xmlUtils.createElement('arg');
      xmlArg.setAttribute('name', this.arguments_[i]);
      xmlMutation.appendChild(xmlArg);
    }

    const xmlBlock = xmlUtils.createElement('block');
    xmlBlock.setAttribute('type', this.callType_);
    xmlBlock.appendChild(xmlMutation);
    option.callback = ContextMenu.callbackFactory(this, xmlBlock);
    options.push(option);

    // Add options to create getters for each parameter.
    if (!this.isCollapsed()) {
      for (let i = 0; i < this.argumentVarModels_.length; i++) {
        const argOption = { enabled: true };
        const argVar = this.argumentVarModels_[i];
        argOption.text =
          Msg['VARIABLES_SET_CREATE_GET'].replace('%1', argVar.name);

        const argXmlField = Variables.generateVariableFieldDom(argVar, true);
        const argXmlBlock = xmlUtils.createElement('block');
        argXmlBlock.setAttribute('type', 'variables_get');
        argXmlBlock.appendChild(argXmlField);
        argOption.callback = ContextMenu.callbackFactory(this, argXmlBlock);
        options.push(argOption);
      }
    }
  },
  callType_: 'procedures_callnoreturn',
};

Blocks['procedures_defreturn'] = {
  ...PROCEDURE_DEF_COMMON,
  /**
   * Block for defining a procedure with a return value.
   * @this {Block}
   */
  init: function () {
    const initName = Procedures.findLegalName('', this);
    const nameField = new FieldTextInput(initName, Procedures.rename);
    nameField.setSpellcheck(false);
    this.appendDummyInput()
      .appendField(Msg['PROCEDURES_DEFRETURN_TITLE'])
      .appendField(nameField, 'NAME')
      .appendField('', 'REC')
      .appendField('', 'PARAMS')
    this.appendValueInput('RETURN')
      .setAlign(Align.RIGHT)
      .appendField(Msg['PROCEDURES_DEFRETURN_RETURN'], 'RETURNTYPE');
    this.setMutator(new Mutator(['procedures_mutatorarg', ...types, 'datatype']));
    if ((this.workspace.options.comments ||
      (this.workspace.options.parentWorkspace &&
        this.workspace.options.parentWorkspace.options.comments)) &&
      Msg['PROCEDURES_DEFRETURN_COMMENT']) {
      this.setCommentText(Msg['PROCEDURES_DEFRETURN_COMMENT']);
    }
    this.setStyle('procedure_blocks');
    this.setTooltip(Msg['PROCEDURES_DEFRETURN_TOOLTIP']);
    this.setHelpUrl(Msg['PROCEDURES_DEFRETURN_HELPURL']);
    this.arguments_ = [];
    this.argumentVarModels_ = [];
    this.returnType_ = null;
    this.setStatements_(true);
    this.statementConnection_ = null;
    this.isRec_ = false;
    this.updateIsRec_(false);
  },
  /**
   * Return the signature of this procedure definition.
   * @return {!Array} Tuple containing three elements:
   *     - the name of the defined procedure,
   *     - a list of all its arguments,
   *     - that it DOES have a return value.
   *     - that a call block shoud be created
   *     - return type
   * @this {Block}
   */
  getProcedureDef: function () {
    /*
    const args = [];
    this.arguments_.forEach(argName => {
      const varName = this.procedureName + "." + argName;

      const variable = this.workspace.getVariableMap().getVariableByName(varName);
      console.log("variable?", variable, this.argumentVarModels_);
      args.push(variable);
    });
    console.log("getProcedureDef", this, args, this.argumentVarModels_);
    */
    return [this.getFieldValue('NAME'), this.argumentVarModels_, true, true, this.returnType_];
  },
};

Blocks['procedures_anonymous'] = {
  ...PROCEDURE_DEF_COMMON,
  /**
   * Block for defining an anonymous procedure with a return value.
   * @this {Block}
   */
  init: function () {
    this.setOutput(true);
    this.appendDummyInput()
      .appendField('do')
      .appendField('', 'PARAMS')
    this.appendValueInput('RETURN')
      .setAlign(Align.RIGHT)
      .appendField(Msg['PROCEDURES_DEFRETURN_RETURN'], 'RETURNTYPE');
    this.setMutator(new Mutator(['procedures_mutatorarg', ...types, 'datatype']));
    this.setStyle('procedure_blocks');
    this.setTooltip(Msg['PROCEDURES_DEFRETURN_TOOLTIP']);
    this.setHelpUrl(Msg['PROCEDURES_DEFRETURN_HELPURL']);
    this.arguments_ = [];
    this.argumentVarModels_ = [];
    this.returnType_ = null;
    this.setStatements_(true);
    this.statementConnection_ = null;
  },
  /**
   * Return the signature of this procedure definition.
   * @return {!Array} Tuple containing three elements:
   *     - the name of the defined procedure,
   *     - a list of all its arguments,
   *     - that it DOES have a return value.
   *     - whether a call block should be created
   *     - return type
   * @this {Block}
   */
  getProcedureDef: function () {
    const args = [];
    this.arguments_.forEach(argName => {
      const variable = this.workspace.getVariableMap().getVariableByName('anonymous.' + argName);
      args.push(variable);
    });
    let name = this.id;
    let createCallBlock = false;
    if (this.parentBlock_ && this.parentBlock_.type === 'variables_set') {
      name = this.parentBlock_.inputList[0].fieldRow[1].variable_.name;
      createCallBlock = true;
    }
    return [name, args, true, createCallBlock, this.returnType_];
  },
};

// function varNameWasReset(event) {
//   if (event.type == Blockly.Events.BLOCK_CHANGE &&
//     event.element == 'field' &&
//     event.oldValue && event.newValue) {
//     console.log("EVENT CATCHED!!!!!", event);
//   }
// }
Blocks['procedures_mutatorcontainer'] = {
  /**
   * Mutator block for procedure container.
   * @this {Block}
   */
  init: function () {
    this.appendDummyInput().appendField(
      Msg['PROCEDURES_MUTATORCONTAINER_TITLE']);
    this.appendStatementInput('STACK');
    this.appendDummyInput('STATEMENT_INPUT')
      .appendField(Msg['PROCEDURES_ALLOW_STATEMENTS'])
      .appendField(new FieldCheckbox('TRUE'), 'STATEMENTS');
    this.appendDummyInput('REC_INPUT')
      .appendField('rec')
      .appendField(new FieldCheckbox('FALSE'), 'REC');
    this.appendValueInput("RETURNTYPE")
      .setCheck("type")
      .setAlign(Blockly.ALIGN_RIGHT)
      .appendField("return type");
    this.setStyle('procedure_blocks');
    this.setTooltip(Msg['PROCEDURES_MUTATORCONTAINER_TOOLTIP']);
    this.contextMenu = false;
    // this.workspace.addChangeListener(varNameWasReset);
  },
};

Blocks['procedures_mutatorarg'] = {
  /**
   * Mutator block for procedure argument.
   * @this {Block}
   */
  init: function () {
    const field = new FieldTextInput(Procedures.DEFAULT_ARG, this.validator_);
    // Hack: override showEditor to do just a little bit more work.
    // We don't have a good place to hook into the start of a text edit.
    field.oldShowEditorFn_ = field.showEditor_;
    /**
     * @this {FieldTextInput}
     */
    const newShowEditorFn = function () {
      this.createdVariables_ = [];
      this.oldShowEditorFn_();
    };
    field.showEditor_ = newShowEditorFn;

    this.appendValueInput("TYPE")
      .appendField(Msg['PROCEDURES_MUTATORARG_TITLE'])
      .appendField(field, 'NAME')
      .appendField("type:");
    this.setPreviousStatement(true);
    this.setNextStatement(true);
    this.setStyle('procedure_blocks');
    this.setTooltip(Msg['PROCEDURES_MUTATORARG_TOOLTIP']);
    this.contextMenu = false;

    // Create the default variable when we drag the block in from the flyout.
    // Have to do this after installing the field on the block.
    field.onFinishEditing_ = this.deleteIntermediateVars_;
    // Create an empty list so onFinishEditing_ has something to look at, even
    // though the editor was never opened.
    field.createdVariables_ = [];
    field.onFinishEditing_('x');
  },

  /**
   * Obtain a valid name for the procedure argument. Create a variable if
   * necessary.
   * Merge runs of whitespace.  Strip leading and trailing whitespace.
   * Beyond this, all names are legal.
   * @param {string} varName User-supplied name.
   * @return {?string} Valid name, or null if a name was not specified.
   * @private
   * @this {FieldTextInput}
   */
  validator_: function (varName) {
    const sourceBlock = this.getSourceBlock();
    // Procedures.renameArgCall(this, varName);
    return validatorExternal(sourceBlock, varName, this, true);
  },

  /**
   * Called when focusing away from the text field.
   * Deletes all variables that were created as the user typed their intended
   * variable name.
   * @param {string} newText The new variable name.
   * @private
   * @this {FieldTextInput}
   */
  deleteIntermediateVars_: function (newText) {
    const outerWs = Mutator.findParentWs(this.getSourceBlock().workspace);
    if (!outerWs) {
      return;
    }
    var varName = newText;

    if (this.sourceBlock_ && this.sourceBlock_.parentBlock_ && this.sourceBlock_.parentBlock_.procedureName) {
      varName = this.sourceBlock_.parentBlock_.procedureName + "." + newText;
    }
    for (let i = 0; i < this.createdVariables_.length; i++) {
      const model = this.createdVariables_[i];
      if (model.name !== varName) {
        outerWs.deleteVariableById(model.getId());
      }
    }
  },
};

function isTypedBlock(paramBlock, i) {
  return paramBlock.childBlocks_[i] && paramBlock.childBlocks_[i].type != null && (paramBlock.childBlocks_[i].type.startsWith("type_") || paramBlock.childBlocks_[i].type.startsWith("datatype"))
}

function validatorExternal(sourceBlock, varName, thisBlock, rename) {
  var varType = typeUtils.createNullType();

  for (var i = 0; i < sourceBlock.childBlocks_.length; i++) {
    if (isTypedBlock(sourceBlock, i)) {
      varType = typeUtils.createTypeFromBlock(sourceBlock.childBlocks_[i]);
      break;
    }
  }

  const outerWs = Mutator.findParentWs(sourceBlock.workspace);
  varName = varName.replace(/[\s\xa0]+/g, ' ').replace(/^ | $/g, '');
  if (!varName) {
    return null;
  }

  // Prevents duplicate parameter names in functions
  const workspace =
    sourceBlock.workspace.targetWorkspace || sourceBlock.workspace;
  const blocks = workspace.getAllBlocks(false);
  const caselessName = varName.toLowerCase();
  for (let i = 0; i < blocks.length; i++) {
    if (blocks[i].id === sourceBlock.id) {
      continue;
    }
    // Other blocks values may not be set yet when this is loaded.
    const otherVar = blocks[i].getFieldValue('NAME');
    if (otherVar && otherVar.toLowerCase() === caselessName) {
      return null;
    }
  }

  // Don't create variables for arg blocks that
  // only exist in the mutator's flyout.
  if (sourceBlock.isInFlyout) {
    return varName;
  }

  var varMapName = null;
  var procedureName = "";
  if (!thisBlock.procedureName) {
    if (sourceBlock.parentBlock_) {
      if (sourceBlock.parentBlock_.procedureName) {
        varMapName = sourceBlock.parentBlock_.procedureName + "." + varName;
      } else {
        varMapName = "anonymous." + varName;
      }
      procedureName = sourceBlock.parentBlock_.procedureName;
    }
  } else {
    varMapName = thisBlock.procedureName + "." + varName;
    procedureName = thisBlock.procedureName;
  }
  if (varMapName === null) return varName;

  if (rename && varType.block_name === "type_function") {
    Procedures.renameArgCall(thisBlock, varMapName, procedureName, varName);
  }

  let model = outerWs.getVariable(varMapName, varType);


  if (model && model.name !== varMapName) {
    // Rename the variable (case change)
    outerWs.renameVariableById(model.getId(), varMapName);
  }
  if (!model) {
    model = outerWs.createVariable2(varMapName, varType, '', varName);
    if (model && thisBlock.createdVariables_) {
      thisBlock.createdVariables_.push(model);
    }
  }
  return varName;
};

/**
 * Common properties for the procedure_callnoreturn and
 * procedure_callreturn blocks.
 */
const PROCEDURE_CALL_COMMON = {
  /**
   * Returns the name of the procedure this block calls.
   * @return {string} Procedure name.
   * @this {Block}
   */
  getProcedureCall: function () {
    // The NAME field is guaranteed to exist, null will never be returned.
    return /** @type {string} */ (this.getFieldValue('NAME'));
  },
  /**
   * Notification that the procedure's parameters have changed.
   * @param {!Array<string>} paramNames New param names, e.g. ['x', 'y', 'z'].
   * @param {!Array<string>} paramIds IDs of params (consistent for each
   *     parameter through the life of a mutator, regardless of param renaming),
   *     e.g. ['piua', 'f8b_', 'oi.o'].
   * @private
   * @this {Block}
   */
  setProcedureParameters_: function (paramNames, paramIds, displayNames, types, varIds) {
    // Data structures:
    // this.arguments = ['x', 'y']
    //     Existing param names.
    // this.quarkConnections_ {piua: null, f8b_: Connection}
    //     Look-up of paramIds to connections plugged into the call block.
    // this.quarkIds_ = ['piua', 'f8b_']
    //     Existing param IDs.
    // Note that quarkConnections_ may include IDs that no longer exist, but
    // which might reappear if a param is reattached in the mutator.
    const defBlock =
      Procedures.getDefinition(this.getProcedureCall(), this.workspace);
    const mutatorOpen =
      defBlock && defBlock.mutator && defBlock.mutator.isVisible();
    if (!mutatorOpen) {
      this.quarkConnections_ = {};
      this.quarkIds_ = null;
    }
    if (!paramIds) {
      // Reset the quarks (a mutator is about to open).
      return;
    }
    // Test arguments (arrays of strings) for changes. '\n' is not a valid
    // argument name character, so it is a valid delimiter here.
    // if (paramNames.join('\n') === this.arguments_.join('\n')) {
    //   // No change.
    //   this.quarkIds_ = paramIds;
    //   return;
    // }
    if (paramIds.length !== paramNames.length) {
      throw RangeError('paramNames and paramIds must be the same length.');
    }
    this.setCollapsed(false);
    if (!this.quarkIds_) {
      // Initialize tracking for this block.
      this.quarkConnections_ = {};
      this.quarkIds_ = [];
    }
    // Switch off rendering while the block is rebuilt.
    const savedRendered = this.rendered;
    this.rendered = false;
    // Update the quarkConnections_ with existing connections.
    for (let i = 0; i < this.arguments_.length; i++) {
      const input = this.getInput('ARG' + i);
      if (input) {
        const connection = input.connection.targetConnection;
        this.quarkConnections_[this.quarkIds_[i]] = connection;
        if (mutatorOpen && connection &&
          paramIds.indexOf(this.quarkIds_[i]) === -1) {
          // This connection should no longer be attached to this block.
          // uncommented some disconnect stuff
          //connection.disconnect();
          //connection.getSourceBlock().bumpNeighbours();
        }
      }
    }

    // Rebuild the block's arguments.
    this.arguments_ = [].concat(paramNames);
    // And rebuild the argument model list.
    if (this.type !== "args_callreturn") {
      this.argumentVarModels_ = [];
      for (let i = 0; i < this.arguments_.length; i++) {
        const variable = Variables.getOrCreateVariablePackage(
          this.workspace, (varIds && varIds[i]) ? varIds[i] : null, this.arguments_[i], (types && types[i]) ? types[i] : "", (displayNames && displayNames[i]) ? displayNames[i] : "");
        this.argumentVarModels_.push(variable);
      }
    }

    this.updateShape_();
    this.quarkIds_ = paramIds;
    // Reconnect any child blocks.
    if (this.quarkIds_) {
      for (let i = 0; i < this.arguments_.length; i++) {
        const quarkId = this.quarkIds_[i];
        if (quarkId in this.quarkConnections_) {
          const connection = this.quarkConnections_[quarkId];
          if (!Mutator.reconnect(connection, this, 'ARG' + i)) {
            // Block no longer exists or has been attached elsewhere.
            delete this.quarkConnections_[quarkId];
          }
        }
      }
    }
    // Restore rendering and show the changes.
    this.rendered = savedRendered;
    if (this.rendered) {
      this.render();
    }
  },
  /**
   * Modify this block to have the correct number of arguments.
   * @private
   * @this {Block}
   */
  updateShape_: function () {
    // Add 'with:' if there are parameters, remove otherwise.
    const secondRow = this.getInput('BOTTOMROW');
    if (secondRow) {
      if (this.arguments_.length) {
        if (!this.getField('WITH')) {
          secondRow.appendField("with parameters:", 'WITH');
        }
        if (this.getField('ARGCOUNT')) {
          this.argCount_ = this.getFieldValue("ARGCOUNT");
          secondRow.removeField('ARGCOUNT');
        }
        const options = [["all", "ALL"]];
        for (let i = 1; i <= this.arguments_.length; i++) {
          const element = i + "";
          options.push([element, element]);
        }
        secondRow.appendField(new Blockly.FieldDropdown(options, (newOp) => {
          this.argCount_ = newOp;
          this.setArgInputs_(newOp);
        }), "ARGCOUNT");

        secondRow.init();

        const f = this.getField("ARGCOUNT");
        if (Number(this.argCount_) > this.arguments_.length) {
          f.setValue("ALL");
        } else {
          f.setValue(this.argCount_);
        }
      } else {
        if (this.getField('WITH')) {
          secondRow.removeField('WITH');
        }
        if (this.getField('ARGCOUNT')) {
          this.argCount_ = "ALL";
          secondRow.removeField('ARGCOUNT');
        }
      }
    }
    this.setArgInputs_(this.argCount_);
  },

  setArgInputs_: function (argCount) {
    const args = argCount === "ALL" ? this.arguments_.length : Number(argCount);

    for (let i = 0; i < args; i++) {
      const argField = this.getField('ARGNAME' + i);
      const variable = this.argumentVarModels_[i] ? this.argumentVarModels_[i] : this.workspace.getVariableMap().getVariableByName(this.arguments_[i]);
      const extraType = (variable) ? " (" + variable?.type.getType() + ")" : "";
      const argName = (this.argumentVarModels_[i]) ? this.argumentVarModels_[i].displayName : this.arguments_[i];
      const text = argName + extraType;
      if (argField) {
        // Ensure argument name is up to date.
        // The argument name field is deterministic based on the mutation,
        // no need to fire a change event.
        Events.disable();
        try {
          argField.setValue(text);
        } finally {
          Events.enable();
        }
      } else {
        // Add new input.
        const newField = new FieldLabel(text);
        const input = this.appendValueInput('ARG' + i)
          .setAlign(Align.RIGHT)
          .appendField(newField, 'ARGNAME' + i);
        input.init();
      }
    }
    // Remove deleted inputs.
    for (let i = args; this.getInput('ARG' + i); i++) {
      this.removeInput('ARG' + i);
    }
    Procedures.mutatePartialCallers(this);
  },
  mutatePartialApplicationCall: function (xmlElement) {
    const argCount = xmlElement.getAttribute('argCount');
    const defArgs = argCount ?? 'ALL';

    const args = [];
    const paramIds = [];
    for (let i = 0, childNode; (childNode = xmlElement.childNodes[i]); i++) {
      if (childNode.nodeName.toLowerCase() === 'arg') {
        args.push(childNode.getAttribute('name'));
        paramIds.push(childNode.getAttribute('paramId'));
      }
    }
    if (defArgs === "ALL" || Number(defArgs) === args.length) {
      this.dispose(true);
    } else {
      const newArgs = args.slice(Number(defArgs));
      const newIDs = paramIds.slice(Number(defArgs));
      this.setProcedureParameters_(newArgs, newIDs);
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
    container.setAttribute('name', this.getProcedureCall());
    if (this.type === 'args_callreturn') container.setAttribute('displayName', this.displayName);
    container.setAttribute('argCount', this.argCount_);
    for (let i = 0; i < this.arguments_.length; i++) {
      const parameter = xmlUtils.createElement('arg');
      parameter.setAttribute('name', this.arguments_[i]);

      const argVarModel = this.argumentVarModels_[i];
      if (argVarModel) {
        parameter.setAttribute('paramId', argVarModel.id_);
        parameter.setAttribute('displayName', argVarModel.displayName);

        const typeBlock = typeUtils.createXmlFromType(argVarModel.type, 'type');
        parameter.appendChild(typeBlock);
      }
      container.appendChild(parameter);
    }
    if (this.returnType) container.appendChild(typeUtils.createXmlFromType(this.returnType, "returntype"));
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
    this.renameProcedure(this.getProcedureCall(), name);
    if (this.type === 'args_callreturn') this.displayName = xmlElement.getAttribute('displayName');
    const argCount = xmlElement.getAttribute('argCount');
    this.argCount_ = argCount ?? 'ALL';
    const args = [];
    const paramIds = [];
    const displayNames = [];
    const types = [];
    const varIds = [];
    for (let i = 0, childNode; (childNode = xmlElement.childNodes[i]); i++) {
      if (childNode.nodeName.toLowerCase() === 'arg') {
        args.push(childNode.getAttribute('name'));
        paramIds.push(childNode.getAttribute('paramId'));
        varIds.push(childNode.getAttribute('varid'));
        displayNames.push(childNode.getAttribute('displayName'));
        if (childNode.childNodes[0] && childNode.childNodes[0].getAttribute('type')) {
          types.push(typeUtils.createTypeFromXml(childNode.childNodes[0]));
        }
      } else if (childNode.nodeName.toLowerCase() === 'returntype') {
        this.returnType = typeUtils.createTypeFromXml(childNode);
      }
    }
    this.setProcedureParameters_(args, paramIds, displayNames, types, varIds);
  },
  /**
   * Returns the state of this block as a JSON serializable object.
   * @return {{name: string, params:(!Array<string>|undefined)}} The state of
   *     this block, ie the params and procedure name.
   */
  saveExtraState: function () {
    const state = Object.create(null);
    state['name'] = this.getProcedureCall();
    if (this.type === 'args_callreturn') state['displayName'] = this.displayName;
    state['argCount'] = this.argCount_
    if (this.arguments_.length) {
      state['params'] = this.arguments_;
    }
    const displayNames = [];
    const types = [];
    for (var i = 0; i < this.argumentVarModels_.length; i++) {
      var element = this.argumentVarModels_[i];
      displayNames.push(element.displayName);
      types.push(element.type);
    }
    state['displayNames'] = displayNames;
    state['types'] = types;
    if (this.returnType) state['returntype'] = this.returnType;
    return state;
  },
  /**
   * Applies the given state to this block.
   * @param {*} state The state to apply to this block, ie the params and
   *     procedure name.
   */
  loadExtraState: function (state) {
    this.renameProcedure(this.getProcedureCall(), state['name']);
    if (this.type === 'args_callreturn') this.displayName = state['displayName'];
    this.argCount_ = state['argCount'];
    const params = state['params'];
    if (params) {
      const ids = [];
      ids.length = params.length;
      ids.fill(null);
      this.setProcedureParameters_(params, ids, state['displayNames'], state['types']);
    }
    const returnType = state['returntype'];
    if (returnType) this.returnType = returnType;
  },
  /**
   * Return all variables referenced by this block.
   * @return {!Array<string>} List of variable names.
   * @this {Block}
   */
  getVars: function () {
    return this.arguments_;
  },
  /**
   * Return all variables referenced by this block.
   * @return {!Array<!VariableModel>} List of variable models.
   * @this {Block}
   */
  getVarModels: function () {
    return this.argumentVarModels_;
  },
  /**
   * Procedure calls cannot exist without the corresponding procedure
   * definition.  Enforce this link whenever an event is fired.
   * @param {!AbstractEvent} event Change event.
   * @this {Block}
   */
  onchange: function (event) {
    if (!this.workspace || this.workspace.isFlyout || this.type === "args_callreturn") {
      // Block is deleted or is in a flyout.
      return;
    }
    if (!event.recordUndo) {
      // Events not generated by user. Skip handling.
      return;
    }
    if (event.type === Events.BLOCK_CREATE &&
      event.ids.indexOf(this.id) !== -1) {
      // Look for the case where a procedure call was created (usually through
      // paste) and there is no matching definition.  In this case, create
      // an empty definition block with the correct signature.
      const name = this.getProcedureCall();
      let def = Procedures.getDefinition(name, this.workspace);
      if (def &&
        (def.type !== this.defType_ ||
          JSON.stringify(def.getPrefixedVars()) !== JSON.stringify(this.arguments_))) {
        // The signatures don't match.
        def = null;
      }
      if (!def) {
        Events.setGroup(event.group);
        /**
         * Create matching definition block.
         * <xml xmlns="https://developers.google.com/blockly/xml">
         *   <block type="procedures_defreturn" x="10" y="20">
         *     <mutation name="test">
         *       <arg name="x"></arg>
         *     </mutation>
         *     <field name="NAME">test</field>
         *   </block>
         * </xml>
         */
        const xml = xmlUtils.createElement('xml');
        const block = xmlUtils.createElement('block');
        block.setAttribute('type', this.defType_);
        const xy = this.getRelativeToSurfaceXY();
        const x = xy.x + internalConstants.SNAP_RADIUS * (this.RTL ? -1 : 1);
        const y = xy.y + internalConstants.SNAP_RADIUS * 2;
        block.setAttribute('x', x);
        block.setAttribute('y', y);
        const mutation = this.mutationToDom();
        block.appendChild(mutation);
        const field = xmlUtils.createElement('field');
        field.setAttribute('name', 'NAME');
        let callName = this.getProcedureCall();
        if (!callName) {
          // Rename if name is empty string.
          callName = Procedures.findLegalName('', this);
          this.renameProcedure('', callName);
        }
        field.appendChild(xmlUtils.createTextNode(callName));
        block.appendChild(field);
        xml.appendChild(block);
        Xml.domToWorkspace(xml, this.workspace);
        Events.setGroup(false);
      }
    } else if (event.type === Events.BLOCK_DELETE) {
      // Look for the case where a procedure definition has been deleted,
      // leaving this block (a procedure call) orphaned.  In this case, delete
      // the orphan.
      const name = this.getProcedureCall();
      const def = Procedures.getDefinition(name, this.workspace);
      if (!def) {
        Events.setGroup(event.group);
        this.dispose(true);
        Events.setGroup(false);
      }
    } else if (event.type === Events.CHANGE && event.element === 'disabled') {
      const name = this.getProcedureCall();
      const def = Procedures.getDefinition(name, this.workspace);
      if (def && def.id === event.blockId) {
        // in most cases the old group should be ''
        const oldGroup = Events.getGroup();
        if (oldGroup) {
          // This should only be possible programmatically and may indicate a
          // problem with event grouping. If you see this message please
          // investigate. If the use ends up being valid we may need to reorder
          // events in the undo stack.
          console.log(
            'Saw an existing group while responding to a definition change');
        }
        Events.setGroup(event.group);
        if (event.newValue) {
          this.previousEnabledState_ = this.isEnabled();
          this.setEnabled(false);
        } else {
          this.setEnabled(this.previousEnabledState_);
        }
        Events.setGroup(oldGroup);
      }
    }
  },
  /**
   * Add menu option to find the definition block for this call.
   * @param {!Array} options List of menu options to add to.
   * @this {Block}
   */
  customContextMenu: function (options) {
    if (!this.workspace.isMovable()) {
      // If we center on the block and the workspace isn't movable we could
      // loose blocks at the edges of the workspace.
      return;
    }

    const option = { enabled: true };
    option.text = Msg['PROCEDURES_HIGHLIGHT_DEF'];
    const name = this.getProcedureCall();
    const workspace = this.workspace;
    option.callback = function () {
      const def = Procedures.getDefinition(name, workspace);
      if (def) {
        workspace.centerOnBlock(def.id);
        def.select();
      }
    };
    options.push(option);
  },

  getCallResults: function () {
    const argCountValue = this.getFieldValue("ARGCOUNT");
    const argCount = argCountValue === "ALL" ? this.arguments_.length : Number(argCountValue);
    if (argCount === this.arguments_.length && (!this.returnType || this.returnType.block_name !== "type_function")) {
      return [false, null]
    }
    const args = [];
    if (argCount !== this.arguments_.length) {
      this.arguments_.slice(argCount).forEach(argName => {
        const variable = this.workspace.getVariableMap().getVariableByName(argName);
        args.push(variable);
      });
    } else {
      for (let i = 0; i < this.returnType.inputs.length; i++) {
        const input = this.returnType.inputs[i];
        const name = input ? "a" + i + " (" + input.getType() + ")" : "a" + i;
        const v = {
          name: name,
          displayName: name,
          type: input
        };
        args.push(v);
      }
    }

    let name = this.id;
    let createCallBlock = false;
    if (this.parentBlock_ && this.parentBlock_.type === 'variables_set') {
      name = this.parentBlock_.inputList[0].fieldRow[1].variable_.name;
      createCallBlock = true;
    }
    const procedureDef = [name, args, true, createCallBlock, null];
    return [true, procedureDef];
  }
};

Blocks['procedures_callreturn'] = {
  ...PROCEDURE_CALL_COMMON,
  /**
   * Block for calling a procedure with a return value.
   * @this {Block}
   */
  init: function () {
    this.appendDummyInput('TOPROW').appendField('', 'NAME');
    this.appendDummyInput('BOTTOMROW');
    this.setOutput(true);
    this.setStyle('procedure_blocks');
    // Tooltip is set in domToMutation.
    this.setHelpUrl(Msg['PROCEDURES_CALLRETURN_HELPURL']);
    this.arguments_ = [];
    this.argumentVarModels_ = [];
    this.quarkConnections_ = {};
    this.quarkIds_ = null;
    this.previousEnabledState_ = true;
    this.argCount_ = "ALL";
  },
  /**
   * Notification that a procedure is renaming.
   * If the name matches this block's procedure, rename it.
   * @param {string} oldName Previous name of procedure.
   * @param {string} newName Renamed procedure.
   * @this {Block}
   */
  renameProcedure: function (oldName, newName) {
    if (Names.equals(oldName, this.getProcedureCall())) {
      this.setFieldValue(newName, 'NAME');
      const baseMsg = this.outputConnection ?
        Msg['PROCEDURES_CALLRETURN_TOOLTIP'] :
        Msg['PROCEDURES_CALLNORETURN_TOOLTIP'];
      this.setTooltip(baseMsg.replace('%1', newName));
    }
  },

  defType_: 'procedures_defreturn',
};

Blocks['args_callreturn'] = {
  ...PROCEDURE_CALL_COMMON,
  /**
   * Block for calling a procedure with a return value.
   * @this {Block}
   */
  init: function () {
    this.appendDummyInput('TOPROW').appendField('', 'NAME');
    this.appendDummyInput('BOTTOMROW');
    this.setOutput(true);
    this.setStyle('procedure_blocks');
    // Tooltip is set in domToMutation.
    this.setHelpUrl(Msg['PROCEDURES_CALLRETURN_HELPURL']);
    this.arguments_ = [];
    this.argumentVarModels_ = [];
    this.quarkConnections_ = {};
    this.quarkIds_ = null;
    this.previousEnabledState_ = true;
    this.argCount_ = "ALL";
    this.displayName = null;
  },
  /**
  * Notification that a procedure is renaming.
  * If the name matches this block's procedure, rename it.
  * @param {string} oldName Previous name of procedure.
  * @param {string} newName Renamed procedure.
  * @param {?string} revertName Revert name of input field.
  * @this {Block}
  */
  renameProcedure: function (oldName, newName, opt_revertName, displayName) {
    if (Names.equals(oldName, this.getProcedureCall()) || (opt_revertName && Names.equals(opt_revertName, this.getProcedureCall()))) {
      this.setFieldValue(newName, 'NAME');
      const baseMsg = this.outputConnection ?
        Msg['PROCEDURES_CALLRETURN_TOOLTIP'] :
        Msg['PROCEDURES_CALLNORETURN_TOOLTIP'];
      this.setTooltip(baseMsg.replace('%1', newName));
      if (displayName) this.displayName = displayName;
    }
  },
  //defType_: 'args_defreturn',
};

Blocks['procedures_ifelsereturn'] = {
  /**
   * Block for conditionally returning a value from a procedure.
   * @this {Block}
   */
  init: function () {
    this.appendValueInput('CONDITION')
      .setCheck(['Boolean', 'BooleanValue'])
      .appendField(Msg['CONTROLS_IF_MSG_IF']);
    this.appendValueInput('VALUE1').appendField(
      Msg['PROCEDURES_DEFRETURN_RETURN']);
    this.appendValueInput('VALUE2').appendField('else return');
    this.setInputsInline(true);
    this.setOutput(true);
    this.setStyle('procedure_blocks');
    this.setTooltip(Msg['PROCEDURES_IFRETURN_TOOLTIP']);
    this.setHelpUrl(Msg['PROCEDURES_IFRETURN_HELPURL']);
  },
  // /**
  //  * Create XML to represent whether this block has a return value.
  //  * @return {!Element} XML storage element.
  //  * @this {Block}
  //  */
  // mutationToDom: function () {
  //   const container = xmlUtils.createElement('mutation');
  //   container.setAttribute('value', Number(this.hasReturnValue_));
  //   return container;
  // },
  // /**
  //  * Parse XML to restore whether this block has a return value.
  //  * @param {!Element} xmlElement XML storage element.
  //  * @this {Block}
  //  */
  // domToMutation: function (xmlElement) {
  //   const value = xmlElement.getAttribute('value');
  //   this.hasReturnValue_ = (value === '1');
  //   if (!this.hasReturnValue_) {
  //     this.removeInput('VALUE');
  //     this.appendDummyInput('VALUE').appendField(
  //       Msg['PROCEDURES_DEFRETURN_RETURN']);
  //   }
  // },

  // This block does not need JSO serialization hooks (saveExtraState and
  // loadExtraState) because the state of this block is already encoded in the
  // block's position in the workspace.
  // XML hooks are kept for backwards compatibility.

  /**
   * Called whenever anything on the workspace changes.
   * Add warning if this flow block is not nested inside a loop.
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
      if (this.FUNCTION_TYPES.indexOf(block.type) !== -1) {
        legal = true;
        break;
      }
      block = block.getSurroundParent();
    } while (block);
    if (legal) {
      // If needed, toggle whether this block has a return value.
      this.setWarningText(null);
      if (!this.isInFlyout) {
        this.setEnabled(true);
      }
    } else {
      this.setWarningText(Msg['PROCEDURES_IFRETURN_WARNING']);
      if (!this.isInFlyout && !this.getInheritedDisabled()) {
        this.setEnabled(false);
      }
    }
  },
  /**
   * List of block types that are functions and thus do not need warnings.
   * To add a new function type add this to your code:
   * Blocks['procedures_ifreturn'].FUNCTION_TYPES.push('custom_func');
   */
  // FUNCTION_TYPES: ['procedures_defnoreturn', 'procedures_defreturn'],
  FUNCTION_TYPES: ['procedures_defreturn', 'procedures_anonymous', 'procedures_defnoreturn'],
};

// Blocks['procedures_ifreturn'] = {
//   /**
//    * Block for conditionally returning a value from a procedure.
//    * @this {Block}
//    */
//   init: function () {
//     this.appendValueInput('CONDITION')
//       .setCheck('Boolean')
//       .appendField(Msg['CONTROLS_IF_MSG_IF']);
//     this.appendValueInput('VALUE').appendField(
//       Msg['PROCEDURES_DEFRETURN_RETURN']);
//     this.setInputsInline(true);
// this.setPreviousStatement(true);
// this.setNextStatement(true);
//     this.setStyle('procedure_blocks');
//     this.setTooltip(Msg['PROCEDURES_IFRETURN_TOOLTIP']);
//     this.setHelpUrl(Msg['PROCEDURES_IFRETURN_HELPURL']);
//     this.hasReturnValue_ = true;
//   },
//   /**
//    * Create XML to represent whether this block has a return value.
//    * @return {!Element} XML storage element.
//    * @this {Block}
//    */
//   mutationToDom: function () {
//     const container = xmlUtils.createElement('mutation');
//     container.setAttribute('value', Number(this.hasReturnValue_));
//     return container;
//   },
//   /**
//    * Parse XML to restore whether this block has a return value.
//    * @param {!Element} xmlElement XML storage element.
//    * @this {Block}
//    */
//   domToMutation: function (xmlElement) {
//     const value = xmlElement.getAttribute('value');
//     this.hasReturnValue_ = (value === '1');
//     if (!this.hasReturnValue_) {
//       this.removeInput('VALUE');
//       this.appendDummyInput('VALUE').appendField(
//         Msg['PROCEDURES_DEFRETURN_RETURN']);
//     }
//   },

//   // This block does not need JSO serialization hooks (saveExtraState and
//   // loadExtraState) because the state of this block is already encoded in the
//   // block's position in the workspace.
//   // XML hooks are kept for backwards compatibility.

//   /**
//    * Called whenever anything on the workspace changes.
//    * Add warning if this flow block is not nested inside a loop.
//    * @param {!AbstractEvent} _e Change event.
//    * @this {Block}
//    */
//   onchange: function (_e) {
//     if (this.workspace.isDragging && this.workspace.isDragging()) {
//       return;  // Don't change state at the start of a drag.
//     }
//     let legal = false;
//     // Is the block nested in a procedure?
//     let block = this;
//     do {
//       if (this.FUNCTION_TYPES.indexOf(block.type) !== -1) {
//         legal = true;
//         break;
//       }
//       block = block.getSurroundParent();
//     } while (block);
//     if (legal) {
//       // If needed, toggle whether this block has a return value.
//       if (block.type === 'procedures_defnoreturn' && this.hasReturnValue_) {
//         this.removeInput('VALUE');
//         this.appendDummyInput('VALUE').appendField(
//           Msg['PROCEDURES_DEFRETURN_RETURN']);
//         this.hasReturnValue_ = false;
//       } else if (
//         block.type === 'procedures_defreturn' && !this.hasReturnValue_) {
//         this.removeInput('VALUE');
//         this.appendValueInput('VALUE').appendField(
//           Msg['PROCEDURES_DEFRETURN_RETURN']);
//         this.hasReturnValue_ = true;
//       }
//       this.setWarningText(null);
//       if (!this.isInFlyout) {
//         this.setEnabled(true);
//       }
//     } else {
//       this.setWarningText(Msg['PROCEDURES_IFRETURN_WARNING']);
//       if (!this.isInFlyout && !this.getInheritedDisabled()) {
//         this.setEnabled(false);
//       }
//     }
//   },
//   /**
//    * List of block types that are functions and thus do not need warnings.
//    * To add a new function type add this to your code:
//    * Blocks['procedures_ifreturn'].FUNCTION_TYPES.push('custom_func');
//    */
//   // FUNCTION_TYPES: ['procedures_defnoreturn', 'procedures_defreturn'],
//   FUNCTION_TYPES: ['procedures_defreturn', 'procedures_anonymous', 'procedures_defnoreturn'],
// };

Blocks['procedures_defnoreturn'] = {
  ...PROCEDURE_DEF_COMMON,
  /**
   * Block for defining a procedure with no return value.
   * @this {Block}
   */
  init: function () {
    const initName = Procedures.findLegalName('', this);
    const nameField = new FieldTextInput(initName, Procedures.rename);
    nameField.setSpellcheck(false);
    this.appendDummyInput()
      .appendField(Msg['PROCEDURES_DEFNORETURN_TITLE'])
      .appendField(nameField, 'NAME')
      .appendField('', 'PARAMS');
    this.setMutator(new Mutator(['procedures_mutatorarg']));
    if ((this.workspace.options.comments ||
      (this.workspace.options.parentWorkspace &&
        this.workspace.options.parentWorkspace.options.comments)) &&
      Msg['PROCEDURES_DEFNORETURN_COMMENT']) {
      this.setCommentText(Msg['PROCEDURES_DEFNORETURN_COMMENT']);
    }
    this.setStyle('procedure_blocks');
    this.setTooltip(Msg['PROCEDURES_DEFNORETURN_TOOLTIP']);
    this.setHelpUrl(Msg['PROCEDURES_DEFNORETURN_HELPURL']);
    this.arguments_ = [];
    this.argumentVarModels_ = [];
    this.setStatements_(true);
    this.statementConnection_ = null;
  },
  /**
   * Return the signature of this procedure definition.
   * @return {!Array} Tuple containing three elements:
   *     - the name of the defined procedure,
   *     - a list of all its arguments,
   *     - that it DOES NOT have a return value.
   * @this {Block}
   */
  getProcedureDef: function () {
    return [this.getFieldValue('NAME'), this.argumentsVarModels_, false];
  },
  callType_: 'procedures_callnoreturn',
};

Blocks['procedures_callnoreturn'] = {
  ...PROCEDURE_CALL_COMMON,
  /**
   * Block for calling a procedure with no return value.
   * @this {Block}
   */
  init: function () {
    this.appendDummyInput('TOPROW').appendField('', 'NAME');
    this.setPreviousStatement(true);
    this.setNextStatement(true);
    this.setStyle('procedure_blocks');
    // Tooltip is set in renameProcedure.
    this.setHelpUrl(Msg['PROCEDURES_CALLNORETURN_HELPURL']);
    this.arguments_ = [];
    this.argumentVarModels_ = [];
    this.quarkConnections_ = {};
    this.quarkIds_ = null;
    this.previousEnabledState_ = true;
  },

  defType_: 'procedures_defnoreturn',
};
