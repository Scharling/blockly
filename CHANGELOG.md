# Changelog

## [8.0.0](https://github.com/google/blockly/compare/blockly-v7.20211209.0...blockly-v8.0.0) (2022-03-09)


### ⚠ BREAKING CHANGES

* **blocks:** ...and rename Blockly.blocks.all (blocks/all.js) to Blockly.libraryBlocks (blocks/blocks.js
* allows previously internal constants to be configurable (#5897)
* * refactor(blocks): Make loopTypes a Set
* remove unused constants from internalConstants (#5889)

### Features

* add mocha failure messages to console output ([#5984](https://github.com/google/blockly/issues/5984)) ([7d250fa](https://github.com/google/blockly/commit/7d250fa9cfb30f95e7af523720b66c8b001df15c))
* Allow developers to set a custom tooltip rendering function. ([#5956](https://github.com/google/blockly/issues/5956)) ([6841ccc](https://github.com/google/blockly/commit/6841ccc99fdbcc5f6d5a63bb36cb3b6ebd2be246))
* **blocks:** Export block definitions ([#5908](https://github.com/google/blockly/issues/5908)) ([ffb8907](https://github.com/google/blockly/commit/ffb8907db8d0f11609c1fe14b2a450d3e639a871))


### Bug Fixes

* Adds check for changedTouches ([#5869](https://github.com/google/blockly/issues/5869)) ([3f4f505](https://github.com/google/blockly/commit/3f4f5057919fdb4a329e9d2b15378c5c5831ae3b))
* **blocks:** correct the callType_ of procedures_defreturn ([#5974](https://github.com/google/blockly/issues/5974)) ([b34db5b](https://github.com/google/blockly/commit/b34db5bd01f7b532ebabc80264ca9fc804a76c75))
* **build:** Correctly handle deep export paths in UMD wrapper ([#5945](https://github.com/google/blockly/issues/5945)) ([71ab146](https://github.com/google/blockly/commit/71ab146bc21aef9bdd6b2385c1df5f51e3ff5b58))
* bumping a block after duplicate breaking undo ([#5844](https://github.com/google/blockly/issues/5844)) ([5204569](https://github.com/google/blockly/commit/5204569cff58c1ead7c15165a1351fa6a2ba2ad3))
* change getCandidate_ and showInsertionMarker_ to be more dynamic ([#5722](https://github.com/google/blockly/issues/5722)) ([68d8113](https://github.com/google/blockly/commit/68d81132b851d20884ee9da41719fa62cdfce0ee))
* convert the common renderer to an ES6 class ([#5978](https://github.com/google/blockly/issues/5978)) ([c1004be](https://github.com/google/blockly/commit/c1004be1f24debe1df1566e6067cf2f6769d51aa))
* custom block context menus ([#5976](https://github.com/google/blockly/issues/5976)) ([8058df2](https://github.com/google/blockly/commit/8058df2a71dcecdc1190ae1d6f5dcccfafc980e8))
* Don't throw if drag surface is empty. ([#5695](https://github.com/google/blockly/issues/5695)) ([769a25f](https://github.com/google/blockly/commit/769a25f4badffd2409ce19535344c98f5d8b01c9))
* Export loopTypes from Blockly.blocks.loops ([#5900](https://github.com/google/blockly/issues/5900)) ([74ef1cb](https://github.com/google/blockly/commit/74ef1cbf521f7c6447ea9672ddbfe861d2292e5f))
* fix keycodes type ([#5805](https://github.com/google/blockly/issues/5805)) ([0a96543](https://github.com/google/blockly/commit/0a96543a1179636e4efeb3c654c075952aca0c9f))
* Fixed the label closure on demo/blockfactory ([#5833](https://github.com/google/blockly/issues/5833)) ([e8ea2e9](https://github.com/google/blockly/commit/e8ea2e9902fb9f642459e7341c3d59e19f359fca))
* **generators:** Fix an operator precedence issue in the math_number_property generators to remove extra parentheses ([#5685](https://github.com/google/blockly/issues/5685)) ([a31003f](https://github.com/google/blockly/commit/a31003fab964e529152389029ec3126a3802851b))
* move test helpers from samples into core ([#5969](https://github.com/google/blockly/issues/5969)) ([2edd228](https://github.com/google/blockly/commit/2edd22811752f05e16c68d593e5d1b809e24ed25))
* move the dropdown div to a namespace instead of a class with only static properties ([#5979](https://github.com/google/blockly/issues/5979)) ([543cb8e](https://github.com/google/blockly/commit/543cb8e1b1c1a7fca5a1629f42f71c9b18e1a255))
* procedure param edits breaking undo ([#5845](https://github.com/google/blockly/issues/5845)) ([8a71f87](https://github.com/google/blockly/commit/8a71f879504503f4aec1140fe653d93602c664df))
* re-expose HSV_VALUE and HSV_SATURATION as settable properties on Blockly ([#5821](https://github.com/google/blockly/issues/5821)) ([6fc3316](https://github.com/google/blockly/commit/6fc3316309534270106050f0e1fecb7a09b8e62c))
* setting null for a font style on a theme ([#5831](https://github.com/google/blockly/issues/5831)) ([835fb02](https://github.com/google/blockly/commit/835fb02343df0a4b9dab7704a4b3d8be8e9a497c))
* **tests:** Enable --debug for test:compile:advanced; fix some errors ([#5959](https://github.com/google/blockly/issues/5959)) ([88334be](https://github.com/google/blockly/commit/88334bea80aa26c08705f16aba5e79dd708158f9))
* **tests:** Enable `--debug` for `test:compile:advanced`; fix some errors (and demote the rest to warnings) ([#5983](https://github.com/google/blockly/issues/5983)) ([e11b583](https://github.com/google/blockly/commit/e11b5834e5e4e8fe991be32afb08eafa7c8adffd))
* TypeScript exporting of the serialization functions ([#5890](https://github.com/google/blockly/issues/5890)) ([5d7c890](https://github.com/google/blockly/commit/5d7c890243ba7d0501514ba48778715097ce5a3b))
* update the playground to load compressed when hosted ([#5835](https://github.com/google/blockly/issues/5835)) ([2adf326](https://github.com/google/blockly/commit/2adf326c230589800880faa9599eca2ecc94d283))
* Use correct namespace for svgMath functions ([#5813](https://github.com/google/blockly/issues/5813)) ([025bab6](https://github.com/google/blockly/commit/025bab656669f99ebdb8b95bea39ebae296f1495))


### Code Refactoring

* allows previously internal constants to be configurable ([#5897](https://github.com/google/blockly/issues/5897)) ([4b5733e](https://github.com/google/blockly/commit/4b5733e7c85f2e196719550a3cfdcbcbd61739df))
* **blocks:** Rename Blockly.blocks.* modules to Blockly.libraryBlocks.* ([#5953](https://github.com/google/blockly/issues/5953)) ([5078dcb](https://github.com/google/blockly/commit/5078dcbc6d4d48422313732e87191b29569b5eed))
* remove unused constants from internalConstants ([#5889](https://github.com/google/blockly/issues/5889)) ([f0b1077](https://github.com/google/blockly/commit/f0b10776eb0657a5446adcfc62ad13f419c14271))
