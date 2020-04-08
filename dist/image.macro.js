"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const babel_plugin_macros_1 = __importDefault(require("babel-plugin-macros"));
const path_1 = __importDefault(require("path"));
const cache_1 = __importDefault(require("./cache"));
const extractValue_1 = require("./extractValue");
const resize_1 = require("./resize");
exports.defaultSizes = [
    [320, 480],
    [1024, 768],
    [1920, 1080],
    [3840, 2160],
    "original"
];
const getParams = (exp) => exp.arguments.map(extractValue_1.extractValue);
const macroHandler = ({ babel, references, state, config }) => {
    throw new Error(JSON.stringify(state));
    const [f, ...etc] = Object.values(references);
    const refs = f.concat(...etc);
    const sites = refs.map(ref => {
        const callSite = ref.parentPath.node;
        if (callSite.type != "CallExpression")
            throw new babel_plugin_macros_1.default.MacroError("must be called");
        let [filepath, ...etc] = getParams(callSite);
        const includedFile = state.opts && state.opts.filename;
        if (includedFile)
            filepath = path_1.default.join(includedFile, "..", filepath);
        return {
            callSite, params: [filepath, ...etc], ref
        };
    });
    image({ sites, babel, references, state, config });
};
const image = ({ babel, sites, config: { sizes = exports.defaultSizes } = {} }) => {
    const requests = sites.map(({ params: [filepath, options] }) => {
        return {
            filepath,
            sizes: options && options.sizes ? options.sizes : sizes
        };
    });
    const rsp = resize_1.resize({
        requests
    });
    if (rsp.type == 'error')
        throw new babel_plugin_macros_1.default.MacroError(JSON.stringify(rsp));
    const componentImports = rsp.responses.map(({ sizes }) => {
        const srcPaths = sizes.map(({ width, height, base64 }) => {
            const srcPath = cache_1.default('resized.jpg', Buffer.from(base64, 'base64'));
            return {
                width, height, srcPath
            };
        });
        const imports = srcPaths.map(({ srcPath, width, height }, n) => {
            const identifier = `img${n}`;
            const include = `import ${identifier} from "${srcPath}"`;
            return { identifier, include, width, height };
        });
        const componentPath = cache_1.default('component.jsx', `${imports.map(({ include }) => include).join(";\n")};` +
            `export default ({ children }) =>` +
            `children({ images: [${imports.map(({ width, height, identifier }) => {
                return `{ url: ${identifier},` +
                    ` width: ${width}, height: ${height} }`;
            }).join(",")}] })`);
        return { componentPath };
    });
    componentImports.forEach(({ componentPath }, i) => {
        sites[i].ref.parentPath.replaceWith(babel.types.callExpression(babel.types.import(), [babel.types.stringLiteral(componentPath)]));
    });
};
const macro = babel_plugin_macros_1.default.createMacro(macroHandler, {
    configName: 'image.macro'
});
exports.default = macro;
//# sourceMappingURL=image.macro.js.map