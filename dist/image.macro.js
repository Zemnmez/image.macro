"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const babel_plugin_macros_1 = __importDefault(require("babel-plugin-macros"));
const extractValue_1 = require("./extractValue");
const toValue_1 = require("./toValue");
const path_1 = __importDefault(require("path"));
const do_sync_1 = require("do-sync");
const resize = do_sync_1.doSync(async (target, opts) => {
    const { width, height } = opts;
    const Sharp = require('sharp');
    const LocalExif = require('exif');
    const img = await Sharp(target);
    const imgBuffer = await img.toBuffer();
    let ExifData;
    if (opts.exif)
        ExifData = await new Promise((ok, fail) => new LocalExif.ExifImage({
            image: imgBuffer
        }, (error, ExifData) => error ? fail(error) : ok(ExifData)));
    const exif = opts.exif ?
        Object.entries(opts.exif).map(([k, v]) => Object.entries(v).map(([k2]) => opts.exif[k][k2] =
            ExifData[k][k2])) : opts.exif;
    const blob = (await img
        .resize(width, height)
        .jpeg({ progressive: true,
        ...opts.jpegOptions })
        .toBuffer()).toString('base64');
    return { blob, width, height, exif };
});
const image = ({ babel, references, state }) => {
    const [f, ...etc] = Object.values(references);
    const refs = f.concat(...etc);
    for (let ref of refs)
        handleRef({ babel, ref, state });
};
const handleRef = ({ babel, ref, state }) => {
    const callSite = ref.parentPath.node;
    if (callSite.type != "CallExpression")
        throw new babel_plugin_macros_1.default.MacroError("must be called");
    const params = callSite.arguments.map(extractValue_1.extractValue);
    ref.parentPath.replaceWith(toValue_1.toValue(main({ babel, ref, state, params })));
};
const main = ({ params: [target, opts], state }) => {
    const { file: { opts: { filename } } } = state;
    const targetPath = path_1.default.join(filename, "..", target);
    const imageData = resize(targetPath, opts);
    return imageData;
};
exports.macro = babel_plugin_macros_1.default.createMacro(image);
exports.default = exports.macro;
