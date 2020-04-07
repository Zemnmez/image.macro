"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const babel_plugin_macros_1 = __importDefault(require("babel-plugin-macros"));
const isNotUndefined = (v) => v !== undefined;
/**
 * Converts certian select AST types to real JS values.
 */
exports.extractValue = v => {
    switch (v.type) {
        case "StringLiteral":
            return v.value;
        case "BooleanLiteral":
            return v.value;
        case "NumericLiteral":
            return v.value;
        case "ObjectExpression":
            return v.properties.map(prop => {
                switch (prop.type) {
                    case "ObjectMethod":
                        throw new babel_plugin_macros_1.default.MacroError("cannot deserialize object method");
                    case "SpreadElement":
                        throw new babel_plugin_macros_1.default.MacroError("spread not allowed");
                    case "ObjectProperty":
                        if (!prop.key)
                            return undefined;
                        return [prop.key, exports.extractValue(prop.value)];
                    default:
                        throw new babel_plugin_macros_1.default.MacroError("dont know how to handle " + prop.type);
                }
            }).filter(isNotUndefined).reduce((a, [k, v]) => {
                if (!("name" in k))
                    throw new babel_plugin_macros_1.default.MacroError("not sure how to handle " + k.type);
                a[k.name] = v;
                return a;
            }, {});
        default:
            throw new Error("cannot deserialise " + v.type);
    }
};
exports.default = exports.extractValue;
//# sourceMappingURL=extractValue.js.map