import types from '@babel/types';
import macros  from 'babel-plugin-macros';

const isNotUndefined:
    <T>(v: T | undefined) => v is T
=
    <T>(v:T | undefined): v is T => v !== undefined
;

/**
 * Converts certian select AST types to real JS values.
 */
export const extractValue:
    (v: types.Node) => any
=
    v => {
        switch (v.type) {
        case "StringLiteral":
            return v.value;
        case "BooleanLiteral":
            return v.value
        case "NumericLiteral":
            return v.value
        case "ObjectExpression":
            return v.properties.map(prop => {
                switch (prop.type) {
                    case "ObjectMethod":
                        throw new macros.MacroError("cannot deserialize object method");
                    case "SpreadElement":
                        throw new macros.MacroError("spread not allowed")
                    case "ObjectProperty":
                        if (!prop.key) return undefined;
                        return [prop.key, extractValue(prop.value)]
                    default:
                        throw new macros.MacroError("dont know how to handle "+ prop!.type)
                }
            }).filter(isNotUndefined).reduce((a, [k, v]) => {
                if (!("name" in k))
                    throw new macros.MacroError("not sure how to handle "+ k.type)

                a[k.name] = v;
                return a;
            }, {} as any);
        default:
            throw new Error("cannot deserialise " + v.type);
        }
    }
;

export default extractValue;