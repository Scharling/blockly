goog.module('Blockly.extra.utils.types');
const xmlUtils = goog.require('Blockly.utils.xml');

// const intType = {
//     block_name: "type_int",
//     text_name: "int",
//     children: [],
//     getType: function () {
//         return this.text_name;
//     }
// }

// const stringType = {
//     block_name: "type_string",
//     text_name: "string",
//     children: [],
//     getType: function () {
//         return this.text_name;
//     }
// }
const createPrimitiveType = function (blockName) {
    let textName = "";
    switch (blockName) {
        case "type_int":
            textName = "int";
            break;
        case "type_string":
            textName = "string";
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

// const tupleType = {
//     block_name: "type_tuple",
//     text_name_start: "tuple(",
//     text_name_end: ")",
//     children: [intType, intType, stringType],
//     getType: function () {
//         var s = this.text_name_start;
//         for (var i = 0; i < this.children.length; i++) {
//             s = s + this.children[i].getType() + ", "
//         }
//         s = s.slice(0, -2)
//         s = s + this.text_name_end
//         return s
//     }
// }
function createTupleType(children) {
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
            s = s.slice(0, -2)
            s = s + this.text_name_end
            return s
        }
    }
}
exports.createTupleType = createTupleType;

// const functionType = {
//     block_name: "type_function",
//     text_name_start: "",
//     text_name_middle: "->",
//     text_name_end: "",
//     input: intType,
//     output: stringType,
//     getType: function () {
//         var s = this.text_name_start;
//         if (this.input.block_name === "type_function") {
//             s = s + "(";
//         }
//         s = s + this.input.getType();
//         if (this.input.block_name === "type_function") {
//             s = s + ")";
//         }

//         s = s + this.text_name_middle;

//         if (this.output.block_name === "type_function") {
//             s = s + "(";
//         }
//         s = s + this.output.getType();
//         if (this.output.block_name === "type_function") {
//             s = s + ")";
//         }

//         s = s + this.text_name_end;

//         return s
//     }
// }

// const function2Type = {
//     block_name: "type_function",
//     text_name_start: "",
//     text_name_middle: "->",
//     text_name_end: "",
//     input: functionType,
//     output: functionType,
//     getType: function () {
//         var s = this.text_name_start;
//         if (this.input.block_name === "type_function") {
//             s = s + "(";
//         }
//         s = s + this.input.getType();
//         if (this.input.block_name === "type_function") {
//             s = s + ")";
//         }

//         s = s + this.text_name_middle;

//         if (this.output.block_name === "type_function") {
//             s = s + "(";
//         }
//         s = s + this.output.getType();
//         if (this.output.block_name === "type_function") {
//             s = s + ")";
//         }

//         s = s + this.text_name_end;

//         return s
//     }
// }

function createFunctionType(input, output) {
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


const createTypeFromBlock = function (block) {
    switch (block.type) {
        case "type_int":
        case "type_string":
            return createPrimitiveType(block.type);
        case "type_tuple":
            const children = block.childBlocks_.map(b => createTypeFromBlock(b));
            return createTupleType(children);
        case "type_function":
            const inputBlock = block.inputList[0].connection.targetConnection?.sourceBlock_;
            const outputBlock = block.inputList[2].connection.targetConnection?.sourceBlock_;
            console.log(inputBlock);
            console.log(outputBlock);
            const input = inputBlock ? createTypeFromBlock(inputBlock) : null;
            const output = outputBlock ? createTypeFromBlock(outputBlock) : null;
            return createFunctionType(input, output);
    }
}
exports.createTypeFromBlock = createTypeFromBlock;


const createBlockFromType = function (type) {
    switch (type.block_name) {
        case "type_int":
        case "type_string":
            const blockNode = xmlUtils.createElement('block');
            blockNode.setAttribute('type', type.block_name);
            return blockNode;
        case "type_tuple":
        // const children = block.childBlocks_.map(b => createTypeFromBlock(b));
        // return createTupleType(children);
        case "type_function":
        // const inputBlock = block.inputList[0].connection.targetConnection?.sourceBlock_;
        // const outputBlock = block.inputList[2].connection.targetConnection?.sourceBlock_;
        // console.log(inputBlock);
        // console.log(outputBlock);
        // const input = inputBlock ? createTypeFromBlock(inputBlock) : null;
        // const output = outputBlock ? createTypeFromBlock(outputBlock) : null;
        // return createFunctionType(input, output);
        case "type_null":   
            return null;
    }
}
exports.createBlockFromType = createBlockFromType;

const createXmlFromType = function (type, name) {
    switch (type.block_name) {
        case "type_int":
        case "type_string":
            const typeXml = xmlUtils.createElement(name);
            typeXml.setAttribute('type', this.returnType_.block_name);
            return typeXml;
        case "type_tuple":
        case "type_function":
    }
}
exports.createXmlFromType = createXmlFromType;