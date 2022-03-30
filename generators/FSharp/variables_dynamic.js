/**
 * @license
 * Copyright 2018 Google LLC
 * SPDX-License-Identifier: Apache-2.0
 */

/**
 * @fileoverview Generating Python for dynamic variable blocks.
 */
'use strict';

goog.module('Blockly.FSharp.variablesDynamic');

const FSharp = goog.require('Blockly.FSharp');
/** @suppress {extraRequire} */
goog.require('Blockly.FSharp.variables');


// Python is dynamically typed.
FSharp['variables_get_dynamic'] = FSharp['variables_get'];
FSharp['variables_set_dynamic'] = FSharp['variables_set'];
