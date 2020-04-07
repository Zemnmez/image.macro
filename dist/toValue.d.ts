import types from '@babel/types';
export declare type AllowedValues = types.ObjectExpression | types.StringLiteral | types.NumericLiteral | types.NullLiteral | types.BooleanLiteral | types.ArrayExpression | types.CallExpression;
export declare type Primitive = string | number | boolean | null | undefined | types.CallExpression;
export declare type Value = OurObject | OurArray | Primitive;
export interface OurObject extends Record<string, Value> {
}
export declare type OurArray = Value[];
/**
 * Convert JSON to a babel AST.
 */
export declare const toValue: (v: Value) => AllowedValues;
//# sourceMappingURL=toValue.d.ts.map