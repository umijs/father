/******/ (function() { // webpackBootstrap
/******/ 	"use strict";
/******/ 	var __webpack_modules__ = ({

/***/ 775:
/***/ (function(__unused_webpack_module, exports, __nccwpck_require__) {



Object.defineProperty(exports, "__esModule", ({ value: true }));

function _interopDefault (ex) { return (ex && (typeof ex === 'object') && 'default' in ex) ? ex['default'] : ex; }

var path = __nccwpck_require__(17);
var ts = _interopDefault(__nccwpck_require__(440));

function regExpEscape(s) {
    return s.replace(/[\\^$*+?.()|[\]{}]/g, '\\$&');
}
var Tokenizer = /** @class */ (function () {
    function Tokenizer(pathKey, subs, tokens) {
        var _this = this;
        if (tokens === void 0) { tokens = ['*']; }
        this.subs = subs;
        this.tokens = [];
        var tokenMask = new RegExp("(" + tokens.map(regExpEscape).join('|') + ")", 'g');
        var mask = pathKey.replace(tokenMask, function (token) {
            _this.tokens.push(new RegExp(regExpEscape(token), 'g'));
            return '><';
        });
        this.mask = new RegExp('^' + regExpEscape(mask).replace(/\>\</g, '(?!\\.\\/)(.*)') + '$');
    }
    Tokenizer.prototype.parse = function (str) {
        var _a = this, mask = _a.mask, tokens = _a.tokens, subs = _a.subs;
        var match = str.match(mask);
        if (match) {
            var parsedSubs = [];
            for (var _i = 0, subs_1 = subs; _i < subs_1.length; _i++) {
                var sub = subs_1[_i];
                for (var i = 1; i < match.length; i++) {
                    var token = tokens[i - 1];
                    var replacement = match[i];
                    sub = sub.replace(token, replacement);
                }
                parsedSubs.push(sub);
            }
            return parsedSubs;
        }
    };
    return Tokenizer;
}());

var winSepRegex = new RegExp(regExpEscape(path.sep), 'g');
var posixSepRegex = /\//g;
var ImportPathsResolver = /** @class */ (function () {
    function ImportPathsResolver(opts) {
        var paths = opts.paths || {};
        var baseUrl = this.baseUrl = opts.baseUrl ? opts.baseUrl.replace(winSepRegex, '\/') : '';
        var mapBaseUrl = baseUrl
            ? function (sub) { return (sub[0] === '/'
                ? sub
                : baseUrl + "/" + (sub.substring(0, 2) === './' ? sub.substring(2) : sub)); }
            : undefined;
        this.tokenizers = Object.keys(paths)
            .filter(function (key) { return !opts.exclude || !opts.exclude.includes(key); })
            .map(function (key) { return new Tokenizer(key, mapBaseUrl ? paths[key].map(mapBaseUrl) : paths[key]); });
    }
    ImportPathsResolver.prototype.getImportSuggestions = function (oldImport, fileName) {
        if (isRelative(oldImport))
            return;
        for (var _i = 0, _a = this.tokenizers; _i < _a.length; _i++) {
            var tokenizer = _a[_i];
            var match = tokenizer.parse(oldImport);
            if (match) {
                return match.map(function (p) {
                    var newPath = path.relative(fileName, p.replace(posixSepRegex, path.sep)).replace(winSepRegex, '\/');
                    return isRelative(newPath) ? newPath : ('./' + newPath);
                });
            }
        }
        var defaultPath = path.relative(fileName, this.baseUrl + '/' + oldImport).replace(winSepRegex, '\/');
        return [isRelative(defaultPath) ? defaultPath : ('./' + defaultPath)];
    };
    return ImportPathsResolver;
}());
function isRelative(fileName) {
    return fileName === '.' || fileName.startsWith('./') || fileName.startsWith('../');
}

var Replacer = /** @class */ (function () {
    function Replacer(sourceText) {
        this.sourceText = sourceText;
        this.items = [];
    }
    Replacer.prototype.push = function (item) {
        this.items.push(item);
    };
    Replacer.prototype.getReplaced = function () {
        var _a = this, items = _a.items, sourceText = _a.sourceText;
        if (items.length === 0)
            return;
        var result = '';
        var pos = 0;
        for (var _i = 0, items_1 = items; _i < items_1.length; _i++) {
            var item = items_1[_i];
            result += sourceText.substring(pos, item.start) + item.replacement;
            pos = item.start + item.length;
        }
        result += sourceText.substring(pos);
        return result;
    };
    return Replacer;
}());

function createTraverseVisitor(traverseVisitor, visitorContext, ctx) {
    return function visitor(node) {
        return traverseVisitor(node, visitorContext) || ts.visitEachChild(node, visitor, ctx);
    };
}

exports.ImportPathsResolver = ImportPathsResolver;
exports.Replacer = Replacer;
exports.Tokenizer = Tokenizer;
exports.createTraverseVisitor = createTraverseVisitor;
exports.posixSepRegex = posixSepRegex;
exports.regExpEscape = regExpEscape;
exports.winSepRegex = winSepRegex;
//# sourceMappingURL=index.js.map


/***/ }),

/***/ 518:
/***/ (function(module, __unused_webpack_exports, __nccwpck_require__) {



function _interopDefault (ex) { return (ex && (typeof ex === 'object') && 'default' in ex) ? ex['default'] : ex; }

var ts = _interopDefault(__nccwpck_require__(440));
var tsHelpers = __nccwpck_require__(775);
var path = _interopDefault(__nccwpck_require__(17));

/*! *****************************************************************************
Copyright (c) Microsoft Corporation. All rights reserved.
Licensed under the Apache License, Version 2.0 (the "License"); you may not use
this file except in compliance with the License. You may obtain a copy of the
License at http://www.apache.org/licenses/LICENSE-2.0

THIS CODE IS PROVIDED ON AN *AS IS* BASIS, WITHOUT WARRANTIES OR CONDITIONS OF ANY
KIND, EITHER EXPRESS OR IMPLIED, INCLUDING WITHOUT LIMITATION ANY IMPLIED
WARRANTIES OR CONDITIONS OF TITLE, FITNESS FOR A PARTICULAR PURPOSE,
MERCHANTABLITY OR NON-INFRINGEMENT.

See the Apache Version 2.0 License for specific language governing permissions
and limitations under the License.
***************************************************************************** */

var __assign = function() {
    __assign = Object.assign || function __assign(t) {
        for (var s, i = 1, n = arguments.length; i < n; i++) {
            s = arguments[i];
            for (var p in s) if (Object.prototype.hasOwnProperty.call(s, p)) t[p] = s[p];
        }
        return t;
    };
    return __assign.apply(this, arguments);
};

var defaultConfig = {};

var fileExistsParts = ['.min.js', '.js'];
var tsParts = ['.ts', '.d.ts', '.tsx', '/index.ts', '/index.tsx', '/index.d.ts', ''];
var ImportPathInternalResolver = /** @class */ (function () {
    function ImportPathInternalResolver(program, transformationContext, config) {
        this.program = program;
        this.config = config;
        var _a = transformationContext.getCompilerOptions(), paths = _a.paths, baseUrl = _a.baseUrl;
        this.resolver = new tsHelpers.ImportPathsResolver({
            paths: paths,
            baseUrl: baseUrl,
            exclude: config.exclude,
        });
        this.emitHost = transformationContext.getEmitHost
            ? transformationContext.getEmitHost()
            : undefined;
    }
    ImportPathInternalResolver.prototype.fileExists = function (file) {
        var _a, _b;
        var _c = this, program = _c.program, emitHost = _c.emitHost;
        if ((_a = program) === null || _a === void 0 ? void 0 : _a.fileExists)
            return program.fileExists(file);
        if ((_b = emitHost) === null || _b === void 0 ? void 0 : _b.fileExists)
            return emitHost.fileExists(file);
        return true;
    };
    ImportPathInternalResolver.prototype.resolveImport = function (oldImport, currentDir) {
        var config = this.config;
        var newImports = this.resolver.getImportSuggestions(oldImport, currentDir);
        if (!newImports)
            return;
        for (var _i = 0, newImports_1 = newImports; _i < newImports_1.length; _i++) {
            var newImport = newImports_1[_i];
            var newImportPath = path.join(currentDir, newImport);
            for (var _a = 0, tsParts_1 = tsParts; _a < tsParts_1.length; _a++) {
                var part = tsParts_1[_a];
                if (this.fileExists("" + newImportPath + part))
                    return newImport;
            }
            if (config.tryLoadJs) {
                for (var _b = 0, fileExistsParts_1 = fileExistsParts; _b < fileExistsParts_1.length; _b++) {
                    var ext = fileExistsParts_1[_b];
                    if (this.fileExists("" + newImportPath + ext))
                        return "" + newImport + ext;
                }
            }
        }
    };
    return ImportPathInternalResolver;
}());

function createFixNode(sf) {
    var posMap = new Map();
    return function fixNode(fixNode, newImport) {
        /**
         * This hack needed for properly d.ts paths rewrite.
         * moduleSpecifier value obtained by moduleSpecifier.pos from original source file text.
         * See emitExternalModuleSpecifier -> writeTextOfNode -> getTextOfNodeFromSourceText.
         *
         * We need to add new import path to the end of source file text and adjust moduleSpecifier.pos
         *
         * ts remove quoted string from output
         */
        var newStr = "\"" + newImport + "\"";
        var cachedPos = posMap.get(newImport);
        if (cachedPos === undefined) {
            cachedPos = sf.text.length;
            posMap.set(newImport, cachedPos);
            sf.text += newStr;
            sf.end += newStr.length;
        }
        fixNode.pos = cachedPos;
        fixNode.end = cachedPos + newStr.length;
        return fixNode;
    };
}

function stripQuotes(quoted) {
    if (quoted[0] !== '"' && quoted[0] !== "'")
        return quoted;
    return quoted.substring(1, quoted.length - 1);
}
function importPathVisitor(node, _a) {
    var fixNode = _a.fixNode, sf = _a.sf, resolver = _a.resolver;
    var importValue;
    var nodeToFix;
    // dynamic import or require()
    if (ts.isCallExpression(node)) {
        var expression = node.expression;
        if (node.arguments.length === 0)
            return;
        var arg = node.arguments[0];
        if (!ts.isStringLiteral(arg))
            return;
        if (
        // Can't call getText on after step
        expression.getText(sf) !== 'require' &&
            expression.kind !== ts.SyntaxKind.ImportKeyword)
            return;
        importValue = stripQuotes(arg.getText(sf));
        nodeToFix = arg;
        // import, export
    }
    else if (ts.isImportDeclaration(node) || ts.isExportDeclaration(node)) {
        if (!node.moduleSpecifier || !ts.isStringLiteral(node.moduleSpecifier))
            return;
        // do not use getFullText() here, bug in watch mode, https://github.com/zerkalica/zerollup/issues/12
        importValue = node.moduleSpecifier.text;
        nodeToFix = node.moduleSpecifier;
    }
    else if (ts.isImportTypeNode(node) &&
        ts.isLiteralTypeNode(node.argument) &&
        ts.isStringLiteral(node.argument.literal)) {
        importValue = node.argument.literal.text;
    }
    else if (ts.isModuleDeclaration(node)) {
        if (!ts.isStringLiteral(node.name))
            return;
        importValue = node.name.text;
        nodeToFix = node.name;
    }
    else {
        return;
    }
    var newImport = resolver.resolveImport(importValue, path.dirname(sf.fileName));
    if (!newImport || newImport === importValue)
        return;
    if (nodeToFix && fixNode)
        fixNode(nodeToFix, newImport);
    var newSpec = ts.createLiteral(newImport);
    var newNode;
    if (ts.isImportTypeNode(node)) {
        newNode = ts.updateImportTypeNode(node, ts.createLiteralTypeNode(newSpec), node.qualifier, node.typeArguments, node.isTypeOf);
        newNode.flags = node.flags;
    }
    if (ts.isImportDeclaration(node)) {
        /**
         * WARNING: manual patched logic
         * ref: https://github.com/zerkalica/zerollup/issues/37#issuecomment-984860540
         */
        var importNode = ts.updateImportDeclaration(node, node.decorators, node.modifiers, node.importClause, newSpec);
        importNode.moduleSpecifier.parent = node.moduleSpecifier.parent;
        newNode = importNode;
        /**
         * Without this hack ts generates bad import of pure interface in output js,
         * this causes warning "module has no exports" in bundlers.
         *
         * index.ts
         * ```ts
         * import {Some} from './lib'
         * export const some: Some = { self: 'test' }
         * ```
         *
         * lib.ts
         * ```ts
         * export interface Some { self: string }
         * ```
         *
         * output: index.js
         * ```js
         * import { Some } from "./some/lib"
         * export const some = { self: 'test' }
         * ```
         */
        newNode.flags = node.flags;
    }
    if (ts.isExportDeclaration(node)) {
        var exportNode = ts.updateExportDeclaration(node, node.decorators, node.modifiers, node.exportClause, newSpec);
        if (exportNode.flags !== node.flags) {
            /**
             * Additional hacks for exports. Without it ts throw exception, if flags changed in export node.
             */
            var ms = exportNode.moduleSpecifier;
            var oms = node.moduleSpecifier;
            if (ms && oms) {
                ms.pos = oms.pos;
                ms.end = oms.end;
                ms.parent = oms.parent;
            }
            newNode = exportNode;
            newNode.flags = node.flags;
        }
    }
    if (ts.isCallExpression(node))
        newNode = ts.updateCall(node, node.expression, node.typeArguments, [
            newSpec,
        ]);
    if (ts.isModuleDeclaration(node)) {
        newNode = ts.updateModuleDeclaration(node, node.decorators, node.modifiers, newSpec, node.body);
    }
    return newNode;
}

function transformPaths(program, configRaw) {
    if (configRaw === void 0) { configRaw = defaultConfig; }
    var config = __assign(__assign({}, defaultConfig), configRaw);
    function createTransformer(transformationContext) {
        var resolver = new ImportPathInternalResolver(program, transformationContext, config);
        return function transformer(sf) {
            return ts.visitNode(sf, tsHelpers.createTraverseVisitor(importPathVisitor, {
                fixNode: config.disableForDeclarations
                    ? undefined
                    : createFixNode(sf),
                sf: sf,
                resolver: resolver,
            }, transformationContext));
        };
    }
    var plugin = {
        before: createTransformer,
        afterDeclarations: config.disableForDeclarations
            ? undefined
            : createTransformer,
    };
    return plugin;
}

module.exports = transformPaths;
//# sourceMappingURL=index.js.map


/***/ }),

/***/ 17:
/***/ (function(module) {

module.exports = require("path");

/***/ }),

/***/ 440:
/***/ (function(module) {

module.exports = require("typescript");

/***/ })

/******/ 	});
/************************************************************************/
/******/ 	// The module cache
/******/ 	var __webpack_module_cache__ = {};
/******/
/******/ 	// The require function
/******/ 	function __nccwpck_require__(moduleId) {
/******/ 		// Check if module is in cache
/******/ 		var cachedModule = __webpack_module_cache__[moduleId];
/******/ 		if (cachedModule !== undefined) {
/******/ 			return cachedModule.exports;
/******/ 		}
/******/ 		// Create a new module (and put it into the cache)
/******/ 		var module = __webpack_module_cache__[moduleId] = {
/******/ 			// no module.id needed
/******/ 			// no module.loaded needed
/******/ 			exports: {}
/******/ 		};
/******/
/******/ 		// Execute the module function
/******/ 		var threw = true;
/******/ 		try {
/******/ 			__webpack_modules__[moduleId](module, module.exports, __nccwpck_require__);
/******/ 			threw = false;
/******/ 		} finally {
/******/ 			if(threw) delete __webpack_module_cache__[moduleId];
/******/ 		}
/******/
/******/ 		// Return the exports of the module
/******/ 		return module.exports;
/******/ 	}
/******/
/************************************************************************/
/******/ 	/* webpack/runtime/compat */
/******/
/******/ 	if (typeof __nccwpck_require__ !== 'undefined') __nccwpck_require__.ab = __dirname + "/";
/******/
/************************************************************************/
/******/
/******/ 	// startup
/******/ 	// Load entry module and return exports
/******/ 	// This entry module is referenced by other modules so it can't be inlined
/******/ 	var __webpack_exports__ = __nccwpck_require__(518);
/******/ 	module.exports = __webpack_exports__;
/******/
/******/ })()
;
