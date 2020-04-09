import macros from 'babel-plugin-macros';
import { toValue } from './toValue';
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
    ({ babel, sites, config: { sizes = defaultSizes } = {}, state }) => {
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

        const calls = rsp.responses.map(({ sizes }) => {
            const imagePaths = sizes.map(({ width, height, base64 }, n) => {
                const srcPath = cache(
                    'resized.jpg',
                    Buffer.from(base64, 'base64')
                )

                return {
                    width, height, srcPath,
                }
            });

            return { imagePaths };
        });


        calls.forEach(({ imagePaths }, i) => {
            // add imports
            const idents = imagePaths.map(({ width, height, srcPath }, n) => {

                const identifier = babel.types.identifier(`__babel_macro_image_img_${n}`);

                const importDefaultSpecifier = babel.types.importDefaultSpecifier(identifier);
                const importDecl = babel.types.importDeclaration(
                    [importDefaultSpecifier],
                    babel.types.stringLiteral(srcPath)
                );

                (state as any).file.path.node.body.unshift(
                    importDecl
                )

                return { width, height, url: identifier }
            });

            sites[i].ref.parentPath.replaceWith(
                toValue({
                    images: idents
                } as any)
            )
        })

    }
;


const macro: imageMacro = macros.createMacro(macroHandler as any, {
    configName: 'image.macro'
});
export default macro;