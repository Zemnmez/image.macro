import { ExifOptions } from './exifOptions';
import { JSONObject } from 'do-sync';
import { Size, Sized } from 'types';
export interface IOutput extends JSONObject {
    type: string;
}
export interface JSONError extends Error, JSONObject {
    type: "error";
}
export interface ResizeRequest extends JSONObject {
    filepath: string;
    exif?: ExifOptions;
    sizes: Size[];
}
export interface Input extends JSONObject {
    requests: ResizeRequest[];
}
export interface SizedImage extends JSONObject, Sized {
    base64: string;
}
interface ExifJSON extends JSONObject {
}
export interface ResizeResponse extends JSONObject {
    sizes: SizedImage[];
    exif?: ExifJSON;
}
export interface Success extends IOutput {
    type: 'success';
    responses: ResizeResponse[];
}
export declare const asyncResize: (Input: Input) => Promise<Success | JSONError>;
export declare const resize: (Input: Input) => JSONError | Success;
export default resize;
//# sourceMappingURL=resize.d.ts.map