import React from 'react'

export type Size = [number, number] | "original";
export interface Sized {
    width: number, height: number
}



export interface Config {
    /**
     * The sizes that image.macro will render to.
     * @default defaultSizes
     */
    sizes?: Size[]
}

export interface ImageData {
    width: number, height: number,
    importPath: string
}

export interface Image extends Sized{
    url: string
}

export interface Images {
    images: Promise<React.FC<{
        children: (images: Image[]) => React.ReactElement
    }>>
}

export type Params = Parameters<imageMacro>;

export type imageMacro = (file: string, overrides?: Config) =>
    Image

