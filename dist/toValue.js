"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const babel_plugin_macros_1 = __importDefault(require("babel-plugin-macros"));
const nulledFields = {
    leadingComments: null,
    innerComments: null,
    trailingComments: null,
    start: null, end: null,
    loc: null
};
/**
 * Convert JSON to a babel AST.
 */
exports.toValue = v => {
    switch (typeof v) {
        case "string":
            const sret = {
                type: "StringLiteral",
                value: v,
                ...nulledFields
            };
            return sret;
        case "number":
            const nret = {
                type: "NumericLiteral",
                value: v,
                ...nulledFields
            };
            return nret;
        case "object":
            if (v == null) {
                const nullret = {
                    type: "NullLiteral",
                    ...nulledFields
                };
                return nullret;
            }
            if ("type" in v) {
                switch (v.type) {
                    case "CallExpression":
                        return v;
                    case "Identifier":
                        return v;
                }
            }
            if (v instanceof Array) {
                const aret = {
                    type: "ArrayExpression",
                    elements: v.map(exports.toValue),
                    ...nulledFields
                };
                return aret;
            }
            const oret = {
                type: "ObjectExpression",
                properties: Object.entries(v).map(([k, v]) => {
                    const ident = {
                        type: "Identifier",
                        name: k,
                        decorators: null,
                        optional: null,
                        typeAnnotation: null,
                        ...nulledFields
                    };
                    const opropRet = {
                        type: "ObjectProperty",
                        key: ident,
                        value: exports.toValue(v),
                        computed: false,
                        shorthand: null,
                        decorators: null,
                        ...nulledFields
                    };
                    return opropRet;
                }),
                ...nulledFields
            };
            return oret;
        case "boolean":
            const boolret = {
                type: "BooleanLiteral",
                value: v,
                ...nulledFields
            };
            return boolret;
        default:
            throw new babel_plugin_macros_1.default.MacroError("dont know how to serialize " + typeof v);
    }
    throw new babel_plugin_macros_1.default.MacroError("this should never happen");
};
//# sourceMappingURL=toValue.js.map