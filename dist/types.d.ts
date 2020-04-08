import React from 'react';
export declare type Size = [number, number] | "original";
export interface Sized {
    width: number;
    height: number;
}
export interface Config {
    /**
     * The sizes that image.macro will render to.
     * @default defaultSizes
     */
    sizes?: Size[];
}
export interface ImageData {
    width: number;
    height: number;
    importPath: string;
}
export interface Image extends Sized {
    url: string;
}
export interface Images {
    images: Promise<React.FC<{
        children: (images: Image[]) => React.ReactElement;
    }>>;
}
export declare type Params = Parameters<imageMacro>;
export declare type imageMacro = (file: string, overrides?: Config) => Image;
//# sourceMappingURL=types.d.ts.map