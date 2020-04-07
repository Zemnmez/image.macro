import { JSONObject } from 'do-sync';
import sharp from 'sharp';
import Exif from 'exif';
export interface JpegOptions extends JSONObject, sharp.JpegOptions {
}
declare type ExifData = {
    [k in keyof Exif.ExifData]?: {
        [k2 in keyof Exif.ExifData[k]]?: true;
    };
};
interface Options<exifSelection extends ExifData = ExifData> extends JSONObject {
    width: number;
    height: number;
    jpegOptions?: JpegOptions;
    exif?: exifSelection;
}
interface ImageBase<options extends Options = Options> {
    width: number;
    height: number;
    exif: {
        [k in keyof options["exif"]]: {
            [k2 in keyof options["exif"][k]]?: options["exif"][k][k2];
        };
    };
}
export interface Image<options extends Options = Options> extends ImageBase<options> {
    url: string;
}
export declare type Params<exif extends ExifData> = [string, Options<exif>];
export declare const macro: <exif extends ExifData>(...p: Params<exif>) => Image;
export default macro;
//# sourceMappingURL=image.macro.d.ts.map