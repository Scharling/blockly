goog.module('Blockly.extra.utils.types');
const xmlUtils = goog.require('Blockly.utils.xml');

/**
   * Create type object for a primitive type.
   * @param blockName The name of the block, indicating its type.
   * @return Type object.
   */
const createPrimitiveType = function (blockName) {
    let textName = "";
    switch (blockName) {
        case "type_int":
            textName = "int";
            break;
        case "type_float":
            textName = "float";
            break;
        case "type_string":
            textName = "string";
            break;
        case "type_bool":
            textName = "bool";
            break;
        default:
            break;
    }

    return {
        block_name: blockName,
        text_name: textName,
        children: [],
        getType: function () {
            return this.text_name;
        }
    }
}
exports.createPrimitiveType = createPrimitiveType;

/**
   * Create type object for a null type.
   * @return Type object.
   */
const createNullType = function () {
    return {
        block_name: "type_null",
        text_name: "nullType",
        children: [],
        getType: function () {
            return this.text_name;
        }
    }
}
exports.createNullType = createNullType;

/**
   * Create type object for a tuple type.
   * @param children The items of the tuple.
   * @return Type object.
   */
const createTupleType = function (children) {
    return {
        block_name: "type_tuple",
        text_name_start: "tuple(",
        text_name_end: ")",
        children,
        getType: function () {
            var s = this.text_name_start;
            for (var i = 0; i < this.children.length; i++) {
                s = s + this.children[i].getType() + ", "
            }
            if (this.children.length > 0) s = s.slice(0, -2)
            s = s + this.text_name_end
            return s
        }
    }
}
exports.createTupleType = createTupleType;

/**
   * Create type object for a function type.
   * @param input Type object for the input of the function.
   * @param output Type object for the output of the function.
   * @return Type object.
   */
const createFunctionType = function (input, output) {
    return {
        block_name: "type_function",
        text_name_start: "",
        text_name_middle: "->",
        text_name_end: "",
        input,
        output,
        getType: function () {
            var s = this.text_name_start;
            if (this.input?.block_name === "type_function") {
                s = s + "(";
            }
            s = s + this.input?.getType();
            if (this.input?.block_name === "type_function") {
                s = s + ")";
            }

            s = s + this.text_name_middle;

            if (this.output?.block_name === "type_function") {
                s = s + "(";
            }
            s = s + this.output?.getType();
            if (this.output?.block_name === "type_function") {
                s = s + ")";
            }

            s = s + this.text_name_end;

            return s
        }
    }
}
exports.createFunctionType = createFunctionType;

/**
   * Create type object from a block.
   * @param block Type block.
   * @return Type object.
   */
const createTypeFromBlock = function (block) {
    switch (block.type) {
        case "type_int":
        case "type_float":
        case "type_string":
        case "type_bool":
            return createPrimitiveType(block.type);
        case "type_tuple":
            const children = block.childBlocks_.map(b => createTypeFromBlock(b));
            return createTupleType(children);
        case "type_function":
            const inputBlock = block.inputList[0].connection.targetConnection?.sourceBlock_;
            const outputBlock = block.inputList[2].connection.targetConnection?.sourceBlock_;
            const input = inputBlock ? createTypeFromBlock(inputBlock) : null;
            const output = outputBlock ? createTypeFromBlock(outputBlock) : null;
            return createFunctionType(input, output);
    }
}
exports.createTypeFromBlock = createTypeFromBlock;

/**
   * Create Block from a type object.
   * @param type Type object.
   * @return Type block.
   */
const createBlockFromType = function (type) {
    switch (type.block_name) {
        case "type_int":
        case "type_float":
        case "type_string":
        case "type_bool":
            const blockNode = xmlUtils.createElement('block');
            blockNode.setAttribute('type', type.block_name);
            return blockNode;
        case "type_tuple":
            const tupleBlockNode = xmlUtils.createElement('block');
            tupleBlockNode.setAttribute('type', type.block_name);

            const mutationBlock = xmlUtils.createElement('mutation');
            mutationBlock.setAttribute('items', type.children.length - 2);
            tupleBlockNode.appendChild(mutationBlock);
            let i = 0;
            type.children.forEach(element => {
                const valueBlock = createValueBlock(getTupleValueName(i), element);
                tupleBlockNode.appendChild(valueBlock);
                i++;
            });
            return tupleBlockNode;
        case "type_function":
            const functionBlockNode = xmlUtils.createElement('block');
            functionBlockNode.setAttribute('type', type.block_name);
            if (type.input) {
                const inputValueBlock = createValueBlock("INPUT", type.input);
                functionBlockNode.appendChild(inputValueBlock);
            }
            if (type.output) {
                const outputValueBlock = createValueBlock("OUTPUT", type.output);
                functionBlockNode.appendChild(outputValueBlock);
            }
            return functionBlockNode;
        case "type_null":
            return null;
    }
}
exports.createBlockFromType = createBlockFromType;

/**
   * Helper function for getting name for a tuple element based on index.
   * @param i Index for tuple element.
   * @return Name of tuple element.
   */
const getTupleValueName = function (i) {
    switch (i) {
        case 0:
            return "FST";
        case 1:
            return "SND";
        default:
            return "ADD" + (i - 2);
    }
}

/**
   * Helper function for creating a value block with child block.
   * @param name Name of the value block.
   * @param childType The type object for the child element.
   * @return Return value block with appended child.
   */
const createValueBlock = function (name, childType) {
    const valueBlock = xmlUtils.createElement('value');
    valueBlock.setAttribute('name', name);
    const childBlock = createBlockFromType(childType);
    valueBlock.appendChild(childBlock);
    return valueBlock;
}

/**
   * Create XML to represent type.
   * @param type Type object.
   * @param name Name for XML element.
   * @return XML storage element.
   */
const createXmlFromType = function (type, name) {
    let typeXml = xmlUtils.createElement(name);
    typeXml.setAttribute('type', type.block_name);

    switch (type.block_name) {
        case "type_tuple":
            for (c in type.children) {
                const childXml = createXmlFromType(type.children[c], 'child');
                typeXml.appendChild(childXml);
            }
            break;
        case "type_function":
            const input = type.input ? createXmlFromType(type.input, 'input') : null;
            const output = type.output ? createXmlFromType(type.output, 'output') : null;
            if (input) typeXml.appendChild(input);
            if (output) typeXml.appendChild(output);
            break;
        default:
            break;
    }

    return typeXml;
}
exports.createXmlFromType = createXmlFromType;

/**
   * Parse XML to restore type object.
   * @param xmlElement XML storage element.
   * @return Type object.
   */
const createTypeFromXml = function (xmlElement) {

    const type = xmlElement.getAttribute('type')
    switch (type) {
        case "type_int":
        case "type_float":
        case "type_string":
        case "type_bool":
            return createPrimitiveType(type);

        case "type_tuple":
            const children = [];
            for (let i = 0, childNode; (childNode = xmlElement.childNodes[i]); i++) {
                if (childNode.nodeName.toLowerCase() === 'child') {
                    const childType = createTypeFromXml(childNode);
                    children.push(childType);
                }
            }
            return createTupleType(children);

        case "type_function":
            let input = null;
            let output = null;
            for (let i = 0, childNode; (childNode = xmlElement.childNodes[i]); i++) {
                if (childNode.nodeName.toLowerCase() === 'input') {
                    input = createTypeFromXml(childNode);
                }
                if (childNode.nodeName.toLowerCase() === 'output') {
                    output = createTypeFromXml(childNode);
                }
            }
            return createFunctionType(input, output);
    }
}
exports.createTypeFromXml = createTypeFromXml;