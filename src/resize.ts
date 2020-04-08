import { ExifData } from 'exif';
import sharp from 'sharp';
import { ExifOptions } from './exifOptions';
import exif from 'exif';
import { doSync, JSONObject, JSONValue } from 'do-sync';
import { Size, Sized } from 'types';

export interface IOutput extends JSONObject {
    type: string
}

export interface JSONError extends Error, JSONObject {
    type: "error",
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
        const Sharp = require('sharp') as typeof sharp;

        const handleImage:
            (rq: ResizeRequest) => Promise<ResizeResponse>
        =
            async ({ filepath, exif: exifReq, sizes }) => {
            const img = await Sharp(filepath);
            const { width, height } = await img.metadata();
            if (width == undefined || height == undefined)
                throw new Error("could not get width or height of image");

            // only resize smaller
            const validSizes = sizes.filter((size: Size) => {
                if (typeof size == "string") return true;
                const [w, h] = size;
                return (w >= width) || (h >= height)
            });


            const resizedImages = await Promise.all(validSizes.map<Promise<SizedImage>>(async (size: Size) => {
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


                return {
                    width: newWidth, height: newHeight,
                    base64: (await resized.toBuffer()).toString('base64')
                }
            }));

            return {
                sizes: resizedImages
            }
        }

        try {
            const responses: (ResizeResponse)[] =
                await Promise.all(requests.map(handleImage));
    

            return {
                type: 'success',
                responses
            }
        } catch(e) {
            if (e instanceof Error) {
                return {
                    type: 'error',
                    message: e.message,
                    stack: e.stack,
                    name: e.name
                }
            }

            throw new Error("unknown error type " + JSON.stringify(e))

        }
    }
;

export const resize = doSync(asyncResize);
export default resize;