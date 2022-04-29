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
        case "type_char":
            textName = "char";
            break;
        case "type_bool":
            textName = "bool";
            break;
        case "type_unit":
            textName = "unit";
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
        },
        getFSharpType() {
            return this.getType();
        }
    }
}
exports.createPrimitiveType = createPrimitiveType;

/**
   * Create type object for a poly type.
   * @param typeName The name given to the type.
   * @return Type object.
   */
const createPolyType = function (typeName) {
    return {
        block_name: "type_poly",
        text_name: typeName,
        children: [],
        getType: function () {
            return "'" + this.text_name;
        },
        getFSharpType() {
            return this.getType();
        }
    }
}
exports.createPolyType = createPolyType;

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
        },
        getFSharpType() {
            return "";
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
        },
        getFSharpType() {
            var args = []
            for (var i = 0; i < this.children.length; i++) {
                args.push(this.children[i].getFSharpType());
            }
            return args.join(" * ")
        }
    }
}
exports.createTupleType = createTupleType;


/**
   * Create type object for a tuple type.
   * @param children The items of the tuple.
   * @return Type object.
   */
const createDatatypeType = function (children, blockName) {
    return {
        block_name: "type_datatype",
        text_name_start: "<",
        text_name_end: ">",
        name: blockName,
        children,
        getType: function () {
            var s = blockName + this.text_name_start;
            var args = []
            for (var i = 0; i < this.children.length; i++) {
                args.push(this.children[i]?.getType())
            }
            s = s + args.join(", ")
            s = s + this.text_name_end;
            return s
        },
        getFSharpType() {
            var s = blockName + this.text_name_start;
            var args = []
            for (var i = 0; i < this.children.length; i++) {
                args.push(this.children[i]?.getFSharpType())
            }
            s = s + args.join(", ")
            s = s + this.text_name_end;
            return s
        }
    }
}
exports.createDatatypeType = createDatatypeType;

/**
   * Create type object for a function type.
   * @param input Type object for the input of the function.
   * @param output Type object for the output of the function.
   * @return Type object.
   */
const createFunctionType = function (inputs, output) {
    return {
        block_name: "type_function",
        text_name_start: "",
        text_name_middle: "->",
        text_name_end: "",
        inputs,
        output,
        getType: function () {
            var s = this.text_name_start;

            if (this.inputs.length === 0) {
                s += "unit";
                s += this.text_name_middle;
            } else {
                for (let i = 0; i < this.inputs.length; i++) {
                    const element = this.inputs[i];
                    if (element.block_name === "type_function") {
                        s += "(";
                    }
                    s += element.getType();
                    if (element.block_name === "type_function") {
                        s += ")";
                    }
                    if (i < this.inputs.length - 1) {
                        s += ", ";
                    }

                }
                s += this.text_name_middle;
            }

            if (!this.output) {
                s += "unit";
            } else {
                if (this.output?.block_name === "type_function") {
                    s += "(";
                }
                s = s + this.output?.getType();
                if (this.output?.block_name === "type_function") {
                    s += ")";
                }
            }

            s += this.text_name_end;

            return s
        },
        getFSharpType: function () {
            var s = this.text_name_start;

            if (this.inputs.length === 0) {
                s += "unit";
                s += this.text_name_middle;
            } else {
                for (let i = 0; i < this.inputs.length; i++) {
                    const element = this.inputs[i];
                    if (element.block_name === "type_function") {
                        s += "(";
                    }
                    s += element.getFSharpType();
                    if (element.block_name === "type_function") {
                        s += ")";
                    }
                    if (i < this.inputs.length - 1) {
                        s += " -> ";
                    }

                }
                s += " " + this.text_name_middle + " ";
            }

            if (!this.output) {
                s += "unit";
            } else {
                if (this.output?.block_name === "type_function") {
                    s += "(";
                }
                s = s + this.output?.getFSharpType();
                if (this.output?.block_name === "type_function") {
                    s += ")";
                }
            }

            s += this.text_name_end;

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
        case "type_char":
        case "type_bool":
        case "type_unit":
            return createPrimitiveType(block.type);
        case "type_poly":
            const typeName = block.getFieldValue('NAME');
            return createPolyType(typeName);
        case "type_tuple":
            const children = block.childBlocks_.map(b => createTypeFromBlock(b));
            return createTupleType(children);
        case "type_function":
            const inputBlocks = [];
            let outputBlock = null;
            block.inputList.forEach(element => {
                if (element.name.startsWith("INPUT")) {
                    const inputBlock = element.connection.targetConnection?.sourceBlock_;
                    if (inputBlock) inputBlocks.push(inputBlock);
                } else if (element.name === "OUTPUT") {
                    outputBlock = element.connection.targetConnection?.sourceBlock_;
                }
            });
            const inputs = inputBlocks.map(i => createTypeFromBlock(i));
            const output = outputBlock ? createTypeFromBlock(outputBlock) : null;
            return createFunctionType(inputs, output);
        case "datatype":
            const name = block.getFieldValue('NAME');
            const dtChildren = [];
            block.childBlocks_.forEach(b => {
                if (b.type) {
                    dtChildren.push(createTypeFromBlock(b));
                }
            });
            return createDatatypeType(dtChildren, name);
    }
    return null;
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
        case "type_char":
        case "type_bool":
        case "type_unit":
            const blockNode = xmlUtils.createElement('block');
            blockNode.setAttribute('type', type.block_name);
            return blockNode;
        case "type_poly":
            const polyBlockNode = xmlUtils.createElement('block');
            polyBlockNode.setAttribute('type', type.block_name);
            const fieldNode = xmlUtils.createElement('field');
            fieldNode.setAttribute('name', 'NAME');
            const typeName = xmlUtils.createTextNode(type.text_name);
            fieldNode.appendChild(typeName);
            polyBlockNode.appendChild(fieldNode);
            return polyBlockNode;
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
            const functionMutationBlock = xmlUtils.createElement('mutation');
            const mutationNumber = (type.inputs.length < 2) ? 0 : type.inputs.length - 1;
            functionMutationBlock.setAttribute('inputs', mutationNumber);
            functionBlockNode.appendChild(functionMutationBlock);
            if (type.inputs.length > 0) {
                let i = 0;
                type.inputs.forEach(element => {
                    const inputValueBlock = createValueBlock(getInputValueName(i), element);
                    functionBlockNode.appendChild(inputValueBlock);
                    i++;
                });
                // const inputValueBlock = createValueBlock("INPUT", type.input);
                // functionBlockNode.appendChild(inputValueBlock);
            }
            if (type.output) {
                const outputValueBlock = createValueBlock("OUTPUT", type.output);
                functionBlockNode.appendChild(outputValueBlock);
            }
            return functionBlockNode;
        case "type_datatype":
            const typeBlockNode = xmlUtils.createElement('block');
            typeBlockNode.setAttribute('type', 'datatype');

            const typeMutationBlock = xmlUtils.createElement('mutation');
            typeMutationBlock.setAttribute('name', type.name);
            typeMutationBlock.setAttribute('items', type.children.length);
            typeBlockNode.appendChild(typeMutationBlock);
            let j = 0;
            type.children.forEach(element => {
                const valueBlock = createValueBlock("ADD" + j, element);
                typeBlockNode.appendChild(valueBlock);
                i++;
            });
            return typeBlockNode;
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

const getInputValueName = function (i) {
    return "INPUT" + i;
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
        case "type_poly":
            typeXml.setAttribute('name', type.text_name);
        case "type_tuple":
            for (c in type.children) {
                const childXml = createXmlFromType(type.children[c], 'child');
                typeXml.appendChild(childXml);
            }
            break;
        case "type_function":
            for (c in type.inputs) {
                const childXml = createXmlFromType(type.inputs[c], 'input');
                typeXml.appendChild(childXml);
            }
            const output = type.output ? createXmlFromType(type.output, 'output') : null;
            if (output) typeXml.appendChild(output);
            break;
        case "type_datatype":
            typeXml.setAttribute('name', type.name);
            for (c in type.children) {
                const childXml = createXmlFromType(type.children[c], 'child');
                typeXml.appendChild(childXml);
            }
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
        case "type_char":
        case "type_bool":
        case "type_unit":
            return createPrimitiveType(type);
        case "type_poly":
            return createPolyType(xmlElement.getAttribute('name'));
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
        case "type_datatype":
            const typeChildren = [];
            for (let i = 0, childNode; (childNode = xmlElement.childNodes[i]); i++) {
                if (childNode.nodeName.toLowerCase() === 'child') {
                    const childType = createTypeFromXml(childNode);
                    typeChildren.push(childType);
                }
            }
            return createDatatypeType(typeChildren, xmlElement.getAttribute('name'));
    }
}
exports.createTypeFromXml = createTypeFromXml;