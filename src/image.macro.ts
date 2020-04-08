import macros from 'babel-plugin-macros';
import path from 'path';
import types from '@babel/types';
import cache from './cache';
import { extractValue } from './extractValue';
import { resize, ResizeRequest } from './resize';
import { Size, Sized, Config, Params, imageMacro } from './types';

export const defaultSizes: Size[] = [
    [320, 480], // iPhone
    [1024, 768],
    [1920, 1080], // 1080p
    [3840, 2160], // 4k
    "original"
]

interface HandleRefsParams extends macros.MacroParams {
    config: Config
    state: {
        opts?: {
            filename?: string
        }
    }
}

const getParams:
    (expression: types.CallExpression) => Params
=
    (exp) => exp.arguments.map(extractValue) as any
;

const macroHandler:
    (p: HandleRefsParams) => void
=
    ({ babel, references, state, config }) => {
        const [f, ...etc] = Object.values(references);
        const refs = f.concat(...etc);
        const sites = refs.map(ref => {
            const callSite = ref.parentPath.node;
            if (callSite.type != "CallExpression")
                throw new macros.MacroError("must be called");

            let [filepath, ...etc] = getParams(callSite);
            const includedFile = 
                state.opts && state.opts.filename;
            if (includedFile)
                filepath = path.join(includedFile, "..", filepath);
            

            return {
                callSite, params: [filepath, ...etc] as Params, ref
            };
        });

        image({ sites, babel, references, state, config })
    }
;

interface imageParams extends HandleRefsParams {
    sites: {
        callSite: types.CallExpression,
        params: Params,
        ref: babel.NodePath
    }[]
}

const image:
    (params: imageParams) => void
=
    ({ babel, sites, config: { sizes = defaultSizes } = {} }) => {
        const requests: ResizeRequest[] =
            sites.map(({  params: [filepath, options] }) => {
                return {
                    filepath,
                    sizes: options && options.sizes? options.sizes: sizes
                }
            });

        const rsp = resize({
            requests
        });

        if (rsp.type == 'error') throw new macros.MacroError(
            JSON.stringify(rsp)
        )


        const componentImports = rsp.responses.map(({ sizes }) => {
            const srcPaths = sizes.map(({ width, height, base64 }) => {
                const srcPath = cache(
                    'resized.jpg',
                    Buffer.from(base64, 'base64')
                )

                return {
                    width, height, srcPath
                }
            });


            const imports = srcPaths.map(({srcPath, width, height}, n) => {
                const identifier = `img${n}`;
                const include = `import ${identifier} from "${srcPath}"`;
                return { identifier, include, width, height };
            })


            const componentPath = cache(
                'component.jsx',
                `${imports.map(({include}) => include).join(";\n")};`+
                `export default ({ children }) =>`+
                `children({ images: [${
                    imports.map(({ width, height, identifier}) => {
                        return `{ url: ${identifier},`+
                        ` width: ${width}, height: ${height} }`
                    }).join(",")
                }] })`
            )


            return { componentPath };
        });


        componentImports.forEach(({ componentPath }, i) => {
            sites[i].ref.parentPath.replaceWith(
                babel.types.callExpression(
                    babel.types.import(),
                    [babel.types.stringLiteral(componentPath)]
                )
            )
        })

    }
;


const macro: imageMacro = macros.createMacro(macroHandler as any, {
    configName: 'image.macro'
});
export default macro;