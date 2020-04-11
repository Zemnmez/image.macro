import sharp from 'sharp';
import { ExifOptions } from './exifOptions';
import { doSync, JSONObject } from 'do-sync';
import { Size, Sized } from 'types';

export interface IOutput extends JSONObject {
    type: string
}

export interface JSONError extends Error, JSONObject {
    type: "error",
    context?: Input
}

export interface ResizeRequest extends JSONObject {
    filepath: string,
    exif?: ExifOptions,
    sizes: Size[]
}

export interface Input extends JSONObject {
    requests: ResizeRequest[]
}

export interface SizedImage extends JSONObject, Sized {
    base64: string
}

interface ExifJSON extends JSONObject {}

export interface ResizeResponse extends JSONObject {
    sizes: SizedImage[]
    exif?: ExifJSON
}

export interface Success extends IOutput {
    type: 'success'
    responses: ResizeResponse[]
}

export const asyncResize:
    (Input: Input) => Promise<Success | JSONError>
=
    async({ requests }) => {
        const main = async () => {
            let Sharp: typeof sharp;
                Sharp = require('sharp') as any;

            const boolXor:
                (a: boolean, b: boolean) => boolean
            =
                (a, b) => (a && !b) || (!b && a)
            ;

            const _handleImage:
                (rq: ResizeRequest) => Promise<ResizeResponse>
            =
                async ({ filepath, exif: exifReq, sizes }) => {

                let img: sharp.Sharp;
                img = await Sharp(filepath);

                const { width, height } = await img.metadata();
                if (width == undefined || height == undefined)
                    throw new Error("could not get width or height of image");

                // only resize smaller
                const validSizes = sizes.filter((size: Size) => {
                    if (typeof size == "string") return true;
                    const [w, h] = size;
                    const target = { w, h };

                    return boolXor((target.w <= width), (target.h <= height))
                });


                const resizedImages = await Promise.all(validSizes.map<Promise<SizedImage>>(async (size: Size, n, a) => {
                    let [w, h] = size == "original"?
                        [width, height]: size;
                    
                    const resized = await img.resize(w,h, {
                        fit: 'inside'
                    }).jpeg({
                        progressive: true
                    });

                    const { width: newWidth, height: newHeight }
                        = await resized.metadata();

                    if (!newWidth || !newHeight)
                        throw new Error("missing new width / height");

                    const base64 = (await resized.toBuffer()).toString('base64');

                    return {
                        width: newWidth, height: newHeight,
                        base64
                    }
                }));

                return {
                    sizes: resizedImages
                }
            }

            const handleImage: typeof _handleImage = async (...args) => {
                return _handleImage(...args);
            }

            const responses: (ResizeResponse)[] =
                await Promise.all(requests.map(handleImage));

            return responses;
        }

        try {
            return {
                type: 'success',
                responses: await main()
            }
        } catch (e) {
            if (!(e instanceof Error)) return {
                type: 'error',
                name: 'weird error',
                message: 'something very odd has happened',
                context: { requests }
            }

            const { name, message, stack } = e;
            return {
                name, message, stack, type: 'error',
                context: { requests }
            }
        }
    }
;

export const resize = doSync(asyncResize);
export default resize;