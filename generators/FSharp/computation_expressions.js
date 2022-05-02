/**
 * @fileoverview Generating Python for computation expression blocks.
 */
'use strict';

goog.module('Blockly.FSharp.computationExpression');
const { NameType } = goog.require('Blockly.Names');

const FSharp = goog.require('Blockly.FSharp');

FSharp['comp_builder'] = function (block) {
    const compName =
        FSharp.nameDB_.getName(block.getFieldValue('NAME'), NameType.COMPUTATION_EXPRESSION);

    const firstLine = "type " + compName + "() = \n";

    let bindBlock;
    let returnBlock;
    block.inputList.forEach(element => {
        if (element.name === "BIND") {
            bindBlock = element.connection.targetBlock();
        } else if (element.name === "RETURN") {
            returnBlock = element.connection.targetBlock();
        }
    });

    let secondLine = FSharp.INDENT + "member this.Bind(m, f) = \n";
    let thirdLine = FSharp.INDENT + "member this.Return(x) = \n";

    if (bindBlock && bindBlock.type === "procedures_anonymous") {
        const bindBranch = FSharp.statementToCode(bindBlock, 'STACK');
        const bindBranchWithIndent = FSharp.INDENT + bindBranch.replace(/(?!\n$)\n/g, "\n" + FSharp.INDENT)
        const bindReturn = FSharp.valueToCode(bindBlock, 'RETURN', FSharp.ORDER_NONE) || '';
        console.log(bindBranch);
        secondLine += bindBranchWithIndent;
        secondLine += FSharp.INDENT + FSharp.INDENT + bindReturn + "\n";
    }

    if (returnBlock && returnBlock.type === "procedures_anonymous") {
        const returnBranch = FSharp.statementToCode(returnBlock, 'STACK');
        const returnBranchWithIndent = FSharp.INDENT + returnBranch.replace(/(?!\n$)\n/g, "\n" + FSharp.INDENT)
        const returnReturn = FSharp.valueToCode(returnBlock, 'RETURN', FSharp.ORDER_NONE) || '';
        thirdLine += returnBranchWithIndent;
        thirdLine += FSharp.INDENT + FSharp.INDENT + returnReturn;
    }

    const code = firstLine + secondLine + thirdLine + "\n\n" + "let " + compName + " = " + compName + "()";
    FSharp.definitions_['%%%' + compName] = code;
    return null;
}

FSharp['comp_workflow'] = function (block) {
    const compName =
        FSharp.nameDB_.getName(block.getFieldValue('NAME'), NameType.COMPUTATION_EXPRESSION);

    let branch = FSharp.statementToCode(block, 'WORKFLOW');
    let code = compName + " {\n" + branch + "}";
    return [code, FSharp.ORDER_ATOMIC];
}

FSharp['comp_let'] = function (block) {
    const argument0 =
        FSharp.valueToCode(block, 'VALUE', FSharp.ORDER_NONE) || '0';
    const varName =
        FSharp.nameDB_.getName(block.getFieldValue('VAR'), NameType.VARIABLE);
    return 'let! ' + varName + ' = ' + argument0 + '\n';
};

FSharp['comp_return'] = function (block) {
    const argument0 =
        FSharp.valueToCode(block, 'VALUE', FSharp.ORDER_NONE) || '0';
    return 'return ' + argument0 + '\n';
}

FSharp['comp_returnFrom'] = function (block) {
    const argument0 =
        FSharp.valueToCode(block, 'VALUE', FSharp.ORDER_NONE) || '0';
    return 'return! ' + argument0 + '\n';
}

FSharp['comp_do'] = function (block) {
    const argument0 =
        FSharp.valueToCode(block, 'VALUE', FSharp.ORDER_NONE) || '0';
    return 'do! ' + argument0 + '\n';
}