import { JSONValue } from 'do-sync';
import macros from 'babel-plugin-macros';
import types from '@babel/types';


export type AllowedValues =
    types.ObjectExpression |
    types.StringLiteral | 
    types.NumericLiteral |
    types.NullLiteral |
    types.BooleanLiteral |
    types.ArrayExpression

const nulledFields = {
    leadingComments: null,
    innerComments: null,
    trailingComments: null,
    start: null, end: null,
    loc: null
}

/**
 * Convert JSON to a babel AST.
 */
export const toValue:
    (v: JSONValue) => AllowedValues
=
    v => {
        switch (typeof v) {
        case "string":
            const sret: types.StringLiteral = {
                type: "StringLiteral",
                value: v,
                ...nulledFields
            }

            return sret;
        case "number":
            const nret: types.NumberLiteral = {
                type: "NumericLiteral",
                value: v,
                ...nulledFields
            }

            return nret;
        case "object":

            if (v == null ) {
                const nullret: types.NullLiteral = {
                    type: "NullLiteral",
                    ...nulledFields
                }

                return nullret;
            } 

            if (v instanceof Array ) {
                const aret: types.ArrayExpression = {
                    type: "ArrayExpression",
                    elements: v.map(toValue),
                    ...nulledFields
                }

                return aret;
            }


            const oret: types.ObjectExpression = {
                type: "ObjectExpression",
                properties: Object.entries(v).map(([k, v]) => {
                    const ident: types.Identifier = {
                        type: "Identifier",
                        name: k,
                        decorators: null,
                        optional: null,
                        typeAnnotation: null,
                        ...nulledFields
                    }
                    const opropRet: types.ObjectProperty = {
                        type: "ObjectProperty",
                        key: ident,
                        value: toValue(v),
                        computed: false,
                        shorthand: null,
                        decorators: null,
                        ...nulledFields
                    }
                    return opropRet
                }),
                ...nulledFields
            }

            return oret;
            case "boolean":
                const boolret: types.BooleanLiteral = {
                    type: "BooleanLiteral",
                    value: v,
                    ...nulledFields
                }

                return boolret;

            default:
                throw new macros.MacroError("dont know how to serialize "+ typeof v)
        }

        throw new macros.MacroError("this should never happen");
    }
;