/**
 * @license
 * Copyright 2012 Google LLC
 * SPDX-License-Identifier: Apache-2.0
 */

/**
 * @fileoverview Helper functions for generating F# for blocks.
 * @suppress {checkTypes|globalThis}
 */
'use strict';

goog.module('Blockly.FSharp');
goog.module.declareLegacyNamespace();

const stringUtils = goog.require('Blockly.utils.string');
const Variables = goog.require('Blockly.Variables');
const { Block } = goog.requireType('Blockly.Block');
const { Generator } = goog.require('Blockly.Generator');
const { inputTypes } = goog.require('Blockly.inputTypes');
const { Names, NameType } = goog.require('Blockly.Names');
const { Workspace } = goog.requireType('Blockly.Workspace');


/**
 * F# code generator.
 * @type {!Generator}
 */
const FSharp = new Generator('FSharp');

/**
 * List of illegal variable names.
 * This is not intended to be a security feature.  Blockly is 100% client-side,
 * so bypassing this list is trivial.  This is intended to prevent users from
 * accidentally clobbering a built-in object or function.
 */
FSharp.addReservedWords(
  // F# Keywords on https://www.tutorialspoint.com/fsharp/fsharp_basic_syntax.htm
  'abstract,and,as,assert,base,begin,class,default,delegate,do,done,downcast,' +
  'downto,elif,else,end,exception,extern,false,finally,for,fun,function,' +
  'global,if,in,inherit,inline,interface,internal,lazy,let,let!,match,' +
  'member,module,mutable,namespace,new,not,null,of,open,or,override,' +
  'private,publicrec,return,return!,select,static,struct,then,' +
  'to,true,try,type,upcast,use,use!,val,void,when,while,with,yield,yield!,' +
  // Reserved keywords from OCaml on https://www.tutorialspoint.com/fsharp/fsharp_basic_syntax.htm
  'asr,land,lor,lsl,lsr,lxor,mod,sig,' +
  // Reserved keywords for future expansion on https://www.tutorialspoint.com/fsharp/fsharp_basic_syntax.htm
  'atomic,break,checked,component,const,constraint,constructor,continue,' +
  'eager,event,external,fixed,functor,include,method,mixin,object,parallel,process,protected,' +
  'pure,sealed,tailcall,trait,virtual,volatile' /*+
     // >>> print(','.join(sorted(dir(__builtins__))))
     // https://docs.python.org/3/library/functions.html
     // https://docs.python.org/2/library/functions.html
     'ArithmeticError,AssertionError,AttributeError,BaseException,' +
     'BlockingIOError,BrokenPipeError,BufferError,BytesWarning,' +
     'ChildProcessError,ConnectionAbortedError,ConnectionError,' +
     'ConnectionRefusedError,ConnectionResetError,DeprecationWarning,EOFError,' +
     'Ellipsis,EnvironmentError,Exception,FileExistsError,FileNotFoundError,' +
     'FloatingPointError,FutureWarning,GeneratorExit,IOError,ImportError,' +
     'ImportWarning,IndentationError,IndexError,InterruptedError,' +
     'IsADirectoryError,KeyError,KeyboardInterrupt,LookupError,MemoryError,' +
     'ModuleNotFoundError,NameError,NotADirectoryError,NotImplemented,' +
     'NotImplementedError,OSError,OverflowError,PendingDeprecationWarning,' +
     'PermissionError,ProcessLookupError,RecursionError,ReferenceError,' +
     'ResourceWarning,RuntimeError,RuntimeWarning,StandardError,' +
     'StopAsyncIteration,StopIteration,SyntaxError,SyntaxWarning,SystemError,' +
     'SystemExit,TabError,TimeoutError,TypeError,UnboundLocalError,' +
     'UnicodeDecodeError,UnicodeEncodeError,UnicodeError,' +
     'UnicodeTranslateError,UnicodeWarning,UserWarning,ValueError,Warning,' +
     'ZeroDivisionError,_,__build_class__,__debug__,__doc__,__import__,' +
     '__loader__,__name__,__package__,__spec__,abs,all,any,apply,ascii,' +
     'basestring,bin,bool,buffer,bytearray,bytes,callable,chr,classmethod,cmp,' +
     'coerce,compile,complex,copyright,credits,delattr,dict,dir,divmod,' +
     'enumerate,eval,exec,execfile,exit,file,filter,float,format,frozenset,' +
     'getattr,globals,hasattr,hash,help,hex,id,input,int,intern,isinstance,' +
     'issubclass,iter,len,license,list,locals,long,map,max,memoryview,min,' +
     'next,object,oct,open,ord,pow,print,property,quit,range,raw_input,reduce,' +
     'reload,repr,reversed,round,set,setattr,slice,sorted,staticmethod,str,' +
     'sum,super,tuple,type,unichr,unicode,vars,xrange,zip'*/
);

/**
 * Order of operation ENUMs.
 * https://docs.microsoft.com/en-us/dotnet/fsharp/language-reference/symbol-and-operator-reference/
 */
FSharp.ORDER_ATOMIC = 0;               // 0 "" ...
FSharp.ORDER_FTYPES = 1;               // f<types> (LEFT)
FSharp.ORDER_TYPE_CREATION = 2;        // f(x)
FSharp.ORDER_MEMBER = 3;               // .
FSharp.ORDER_PREFIX_OPERATORS = 4;     // prefix operators (+op, -op, %, %%, &, &&, !op, ~op)
FSharp.ORDER_PIPE_PATTERN_MATCH = 5;   // | (pattern match)
FSharp.ORDER_FUNCTION_APPLICATION = 6; // f x (function application) including lazy x, assert x
FSharp.ORDER_EXPONENT = 7;             // ** op
FSharp.ORDER_MULTIPLICATIVE = 8;       // * op, /op, %op
FSharp.ORDER_ADDITIVE = 9;             // - op, +op, (binary)
FSharp.ORDER_TYPE_CHECK = 10;          // :? (some kind of type check)
FSharp.ORDER_LIST_OPERATOR = 11;       // ::
FSharp.ORDER_STATIC_TYPE = 12;         // ^op (including ^^^)
FSharp.ORDER_RELATIONAL = 13;          // <op, >op, =, |op, &op, &, $
// (including <<<, >>>, |||, &&&)
FSharp.ORDER_TYPE_CASTING = 14;        // :>, :?>
FSharp.ORDER_AND = 15;                 // &, &&
FSharp.ORDER_OR = 16;                  // or, ||
FSharp.ORDER_COMMA = 17;               // ,
FSharp.ORDER_FUNCTION_ARROW = 18;      // ->
FSharp.ORDER_NOT = 19;                 // not
FSharp.ORDER_IF = 20;                  // if
FSharp.ORDER_FUNCTION_MATCH_TRY = 21;  // function, fun, match, try
FSharp.ORDER_LET = 22;                 // let
FSharp.ORDER_SEMI_COLON = 23;          // ;
FSharp.ORDER_PIPE = 24;                // |
FSharp.ORDER_WHEN = 25;                // when
FSharp.ORDER_AS = 26;                  // as
FSharp.ORDER_NONE = 99;                // (...)

/**
 * List of outer-inner pairings that do NOT require parentheses.
 * @type {!Array<!Array<number>>}
 */
FSharp.ORDER_OVERRIDES = [
  // (foo()).bar -> foo().bar
  // (foo())[0] -> foo()[0]
  [FSharp.ORDER_FUNCTION_CALL, FSharp.ORDER_MEMBER],
  // (foo())() -> foo()()
  [FSharp.ORDER_FUNCTION_CALL, FSharp.ORDER_FUNCTION_CALL],
  // (foo.bar).baz -> foo.bar.baz
  // (foo.bar)[0] -> foo.bar[0]
  // (foo[0]).bar -> foo[0].bar
  // (foo[0])[1] -> foo[0][1]
  [FSharp.ORDER_MEMBER, FSharp.ORDER_MEMBER],
  // (foo.bar)() -> foo.bar()
  // (foo[0])() -> foo[0]()
  [FSharp.ORDER_MEMBER, FSharp.ORDER_FUNCTION_CALL],

  // not (not foo) -> not not foo
  [FSharp.ORDER_LOGICAL_NOT, FSharp.ORDER_LOGICAL_NOT],
  // a and (b and c) -> a and b and c
  [FSharp.ORDER_LOGICAL_AND, FSharp.ORDER_LOGICAL_AND],
  // a or (b or c) -> a or b or c
  [FSharp.ORDER_LOGICAL_OR, FSharp.ORDER_LOGICAL_OR]
];

/**
 * Whether the init method has been called.
 * @type {?boolean}
 */
FSharp.isInitialized = false;

/**
 * Initialise the database of variable names.
 * @param {!Workspace} workspace Workspace to generate code from.
 * @this {Generator}
 */
FSharp.init = function (workspace) {
  // Call Blockly.Generator's init.
  Object.getPrototypeOf(this).init.call(this);

  /**
   * Empty loops or conditionals are not allowed in Python.
   */
  this.PASS = this.INDENT + 'pass\n';

  if (!this.nameDB_) {
    this.nameDB_ = new Names(this.RESERVED_WORDS_);
  } else {
    this.nameDB_.reset();
  }

  this.nameDB_.setVariableMap(workspace.getVariableMap());
  this.nameDB_.populateVariables(workspace);
  this.nameDB_.populateProcedures(workspace);

  const defvars = [];
  // Add developer variables (not created or named by the user).
  const devVarList = Variables.allDeveloperVariables(workspace);
  for (let i = 0; i < devVarList.length; i++) {
    defvars.push(
      this.nameDB_.getName(devVarList[i], Names.DEVELOPER_VARIABLE_TYPE) +
      ' = None');
  }

  // Add user variables, but only ones that are being used.
  //  const variables = Variables.allUsedVarModels(workspace);
  //  for (let i = 0; i < variables.length; i++) {
  //    defvars.push(
  //        this.nameDB_.getName(variables[i].getId(), NameType.VARIABLE) +
  //        ' = None');
  //  }

  this.definitions_['variables'] = defvars.join('\n');
  this.isInitialized = true;
};

/**
 * Prepend the generated code with import statements and variable definitions.
 * @param {string} code Generated code.
 * @return {string} Completed code.
 */
FSharp.finish = function (code) {
  // Convert the definitions dictionary into a list.
  const imports = [];
  const definitions = [];
  for (let name in this.definitions_) {
    const def = this.definitions_[name];
    if (def.match(/^(from\s+\S+\s+)?import\s+\S+/)) {
      imports.push(def);
    } else {
      definitions.push(def);
    }
  }
  // Call Blockly.Generator's finish.
  code = Object.getPrototypeOf(this).finish.call(this, code);
  this.isInitialized = false;

  this.nameDB_.reset();
  const allDefs = imports.join('\n') + '\n\n' + definitions.join('\n\n');
  return allDefs.replace(/\n\n+/g, '\n\n').replace(/\n*$/, '\n\n\n') + code;
};

/**
 * Naked values are top-level blocks with outputs that aren't plugged into
 * anything.
 * @param {string} line Line of generated code.
 * @return {string} Legal line of code.
 */
FSharp.scrubNakedValue = function (line) {
  return line + '\n';
};

/**
 * Encode a string as a properly escaped FSharp string, complete with quotes.
 * @param {string} string Text to encode.
 * @return {string} FSharp string.
 * @protected
 */
FSharp.quote_ = function (string) {
  // Can't use goog.string.quote since % must also be escaped.
  string = string.replace(/\\/g, '\\\\').replace(/\n/g, '\\\n');

  // Follow the CPython behaviour of repr() for a non-byte string.
  let quote = '\'';
  if (string.indexOf('\'') !== -1) {
    if (string.indexOf('"') === -1) {
      quote = '"';
    } else {
      string = string.replace(/'/g, '\\\'');
    }
  }
  return quote + string + quote;
};

/**
 * Encode a string as a properly escaped multiline FSharp string, complete
 * with quotes.
 * @param {string} string Text to encode.
 * @return {string} Python string.
 * @protected
 */
FSharp.multiline_quote_ = function (string) {
  const lines = string.split(/\n/g).map(this.quote_);
  // Join with the following, plus a newline:
  // + '\n' +
  return lines.join(' + \'\\n\' + \n');
};

/**
 * Common tasks for generating FSharp from blocks.
 * Handles comments for the specified block and any connected value blocks.
 * Calls any statements following this block.
 * @param {!Block} block The current block.
 * @param {string} code The FSharp code created for this block.
 * @param {boolean=} opt_thisOnly True to generate code for only this statement.
 * @return {string} FSharp code with comments and subsequent blocks added.
 * @protected
 */
FSharp.scrub_ = function (block, code, opt_thisOnly) {
  let commentCode = '';
  // Only collect comments for blocks that aren't inline.
  if (!block.outputConnection || !block.outputConnection.targetConnection) {
    // Collect comment for this block.
    let comment = block.getCommentText();
    if (comment) {
      comment = stringUtils.wrap(comment, this.COMMENT_WRAP - 3);
      commentCode += this.prefixLines(comment + '\n', '# ');
    }
    // Collect comments for all value arguments.
    // Don't collect comments for nested statements.
    for (let i = 0; i < block.inputList.length; i++) {
      if (block.inputList[i].type === inputTypes.VALUE) {
        const childBlock = block.inputList[i].connection.targetBlock();
        if (childBlock) {
          comment = this.allNestedComments(childBlock);
          if (comment) {
            commentCode += this.prefixLines(comment, '# ');
          }
        }
      }
    }
  }
  const nextBlock = block.nextConnection && block.nextConnection.targetBlock();
  const nextCode = opt_thisOnly ? '' : this.blockToCode(nextBlock);
  return commentCode + code + nextCode;
};

/**
 * Gets a property and adjusts the value, taking into account indexing.
 * If a static int, casts to an integer, otherwise returns a code string.
 * @param {!Block} block The block.
 * @param {string} atId The property ID of the element to get.
 * @param {number=} opt_delta Value to add.
 * @param {boolean=} opt_negate Whether to negate the value.
 * @return {string|number}
 */
FSharp.getAdjustedInt = function (block, atId, opt_delta, opt_negate) {
  let delta = opt_delta || 0;
  if (block.workspace.options.oneBasedIndex) {
    delta--;
  }
  const defaultAtIndex = block.workspace.options.oneBasedIndex ? '1' : '0';
  const atOrder = delta ? this.ORDER_ADDITIVE : this.ORDER_NONE;
  let at = this.valueToCode(block, atId, atOrder) || defaultAtIndex;

  if (stringUtils.isNumber(at)) {
    // If the index is a naked number, adjust it right now.
    at = parseInt(at, 10) + delta;
    if (opt_negate) {
      at = -at;
    }
  } else {
    // If the index is dynamic, adjust it in code.
    if (delta > 0) {
      at = 'int(' + at + ' + ' + delta + ')';
    } else if (delta < 0) {
      at = 'int(' + at + ' - ' + -delta + ')';
    } else {
      at = 'int(' + at + ')';
    }
    if (opt_negate) {
      at = '-' + at;
    }
  }
  return at;
};

exports = FSharp;
