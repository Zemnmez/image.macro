"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const do_sync_1 = require("do-sync");
exports.asyncResize = async ({ requests }) => {
    let Sharp;
    try {
        Sharp = require('sharp');
    }
    catch (e) {
        throw new Error(`${e} -- is sharp missing??`);
    }
    const boolXor = (a, b) => (a && !b) || (!b && a);
    const _handleImage = async ({ filepath, exif: exifReq, sizes }) => {
        let img;
        img = await Sharp(filepath);
        const { width, height } = await img.metadata();
        if (width == undefined || height == undefined)
            throw new Error("could not get width or height of image");
        // only resize smaller
        const validSizes = sizes.filter((size) => {
            if (typeof size == "string")
                return true;
            const [w, h] = size;
            return boolXor((w >= width), (h >= height));
        });
        const resizedImages = await Promise.all(validSizes.map(async (size, n, a) => {
            let [w, h] = size == "original" ?
                [width, height] : size;
            const resized = await img.resize(w, h, {
                fit: 'inside'
            }).jpeg({
                progressive: true
            });
            const { width: newWidth, height: newHeight } = await resized.metadata();
            if (!newWidth || !newHeight)
                throw new Error("missing new width / height");
            const base64 = (await resized.toBuffer()).toString('base64');
            return {
                width: newWidth, height: newHeight,
                base64
            };
        }));
        return {
            sizes: resizedImages
        };
    };
    const handleImage = async (...args) => {
        const [{ filepath }] = args;
        try {
            return _handleImage(...args);
        }
        catch (e) {
            throw new Error(`${e} in ${filepath}`);
        }
    };
    try {
        const responses = await Promise.all(requests.map(handleImage));
        return {
            type: 'success',
            responses
        };
    }
    catch (e) {
        if (e instanceof Error) {
            return {
                type: 'error',
                message: e.message,
                stack: e.stack,
                name: e.name,
            };
        }
        throw new Error("unknown error type " + JSON.stringify(e));
    }
};
exports.resize = do_sync_1.doSync(exports.asyncResize);
exports.default = exports.resize;
//# sourceMappingURL=resize.js.map