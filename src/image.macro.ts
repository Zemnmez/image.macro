import macros from 'babel-plugin-macros';
import types from '@babel/types';
import * as toValue from './toValue';
import cache from './cache';
import { extractValue } from './extractValue';
import path from 'path';
import { doSync, JSONObject } from 'do-sync';
import sharp from 'sharp'
import Exif from 'exif';

export interface JpegOptions extends JSONObject, sharp.JpegOptions {}

type ExifData = {
    [k in keyof Exif.ExifData]?: {
        [k2 in keyof Exif.ExifData[k]]?: true
    }
}

interface Options<exifSelection extends ExifData = ExifData> extends JSONObject {
    width: number, height: number,
    jpegOptions?: JpegOptions,
    exif?: exifSelection
}

interface ImageBase<options extends Options = Options> {
    width: number, height: number
    exif: {
        [k in keyof options["exif"]]: {
            [k2 in keyof options["exif"][k]]?:
                options["exif"][k][k2]
        }
    }
}

interface ResizeOutput<options extends Options = Options> extends ImageBase<options>, JSONObject {
    /**
     * base64 encoded image blob
     */
    blob: string
}

export interface Image<options extends Options = Options> extends ImageBase<options> {
    url: string
}

const resize = doSync(async <Exif extends ExifData>(target: string, opts: Options<Exif>): Promise<ResizeOutput<Options<Exif>>> => {
    const { width, height } = opts;
    const Sharp = require('sharp') as typeof sharp;
    const LocalExif = require('exif') as typeof Exif;
    const img = await Sharp(target);
    const imgBuffer = await img.toBuffer();
    let ExifData: Exif.ExifData | undefined;
    
    if (opts.exif) ExifData = await new Promise<Exif.ExifData>((ok, fail) => new LocalExif.ExifImage({ 
        image: imgBuffer
    }, (error, ExifData) => 
        error? fail(error): ok(ExifData)
    ));

    const exif: any = opts.exif?
        Object.entries(opts.exif).map(([k, v]) =>
            Object.entries(v as any).map(([k2]) =>
                (opts.exif as any)[k as any][k2 as any] =
                    (<any>ExifData)[k as any][k2 as any]
            )
        ): opts.exif;

    const blob = 
        (await img
            .resize(width, height)
            .jpeg({ progressive: true,
                ...opts.jpegOptions})
            .toBuffer()).toString('base64')
    
    return { blob, width, height, exif };
})


const image:
    macros.MacroHandler
=
    ({ babel, references, state }) => {
        const [f, ...etc] = Object.values(references);
        const refs = f.concat(...etc);
        for (let ref of refs) handleRef({ babel, ref, state });
    }
;

type ValueOf<T> = T[keyof T];
type ArrayOf<T extends any[]> =
    T extends (infer K)[]? K: never;

interface HandleRefProps {
    babel: macros.MacroParams["babel"],
    state: macros.MacroParams["state"],
    ref: ArrayOf<ValueOf<macros.References>>,
    config?: Config
}

const handleRef:
    (p: HandleRefProps) => void
=
    ({ babel, ref, state }) => {
        const callSite = ref.parentPath.node;
        if (callSite.type != "CallExpression") throw new macros.MacroError("must be called");

        const params = callSite.arguments.map(extractValue) as any;

        ref.parentPath.replaceWith(
            toValue.toValue(main({ babel, ref, state, params }))
        )
    }
;

interface MainProps<exif extends ExifData> extends HandleRefProps {
    params: Params<exif>
}

interface MainResponse<options extends Options = Options> extends ImageBase<options> {
    url: babel.types.CallExpression,
    [key: string]: toValue.Value
}

const main:
    <exif extends ExifData>(m: MainProps<exif>) => MainResponse<Options<exif>>
=
    ({ babel, params: [ target, opts ], state }) => {
        const { file: { opts: { filename}  } } = state;
        const targetPath = path.join(filename, "..", target);
        const imageData = resize(targetPath, opts);
        const name = target.slice(path.basename(target).length);


        return {
            url: babel.types.callExpression(
                babel.types.import(),
                [babel.types.stringLiteral(cache(name, new Buffer(imageData.blob, 'base64')))]
            ),
            ...imageData,
        }
    }
;

export const defaultSizes: Size[] = [
    [320, 480], // iPhone
    [1024, 768],
    [1920, 1080], // 1080p
    [3840, 2160], // 4k
    "original"
]

export type Size = [number, number] | "original";

export interface Config {
    /**
     * The sizes that image.macro will render to.
     * @default defaultSizes
     */
    sizes: Size[]
}



export type Params<exif extends ExifData> = [string, Options<exif>];


export const macro: <exif extends ExifData>(...p: Params<exif>) => Image = macros.createMacro(image, {
    configName: 'image.macro'
})
export default macro;