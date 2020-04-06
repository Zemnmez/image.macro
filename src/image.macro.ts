import macros from 'babel-plugin-macros';
import { extractValue } from './extractValue';
import { toValue } from './toValue';
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

interface Image<options extends Options = Options> extends JSONObject {
    width: number, height: number, blob: string,
    exif: {
        [k in keyof options["exif"]]: {
            [k2 in keyof options["exif"][k]]?:
                options["exif"][k][k2]
        }
    }
}

const resize = doSync(async <Exif extends ExifData>(target: string, opts: Options<Exif>): Promise<Options<Exif>> => {
    const { width, height } = opts;
    const Sharp = require('sharp') as typeof sharp;
    const LocalExif = require('exif') as typeof Exif;
    const img = await Sharp(target);
    const imgBuffer = await img.toBuffer();
    let ExifData: Exif.ExifData | undefined
    
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
    ref: ArrayOf<ValueOf<macros.References>>
}

const handleRef:
    (p: HandleRefProps) => void
=
    ({ babel, ref, state }) => {
        const callSite = ref.parentPath.node;
        if (callSite.type != "CallExpression") throw new macros.MacroError("must be called");

        const params = callSite.arguments.map(extractValue) as any;

        ref.parentPath.replaceWith(
            toValue(main({ babel, ref, state, params }))
        )
    }
;

interface MainProps<exif extends ExifData> extends HandleRefProps {
    params: Params<exif>
}

const main:
    <exif extends ExifData>(m: MainProps<exif>) => Image<Options<exif>>
=
    ({ params: [ target, opts ], state }) => {
        const { file: { opts: { filename}  } } = state;
        const targetPath = path.join(filename, "..", target);
        const imageData = resize(targetPath, opts);
        return imageData as any;
    }
;



export type Params<exif extends ExifData> = [string, Options<exif>];


export const macro: <exif extends ExifData>(...p: Params<exif>) => Image = macros.createMacro(image)
export default macro;