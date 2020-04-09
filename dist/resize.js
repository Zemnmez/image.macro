"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
;
const do_sync_1 = require("do-sync");
exports.asyncResize = async ({ requests }) => {
    const main = async () => {
        let Sharp;
        Sharp = require('sharp');
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
            return _handleImage(...args);
        };
        const responses = await Promise.all(requests.map(handleImage));
        return responses;
    };
    try {
        return {
            type: 'success',
            responses: await main()
        };
    }
    catch (e) {
        if (!(e instanceof Error))
            return {
                type: 'error',
                name: 'weird error',
                message: 'something very odd has happened',
                context: { requests }
            };
        const { name, message, stack } = e;
        return {
            name, message, stack, type: 'error',
            context: { requests }
        };
    }
};
exports.resize = do_sync_1.doSync(exports.asyncResize);
exports.default = exports.resize;
//# sourceMappingURL=resize.js.map