import * as Exif from 'exif';
export declare type ExifOptions = {
    [k in keyof Exif.ExifData]?: {
        [k2 in keyof Exif.ExifData[k]]?: true;
    };
};
//# sourceMappingURL=exifOptions.d.ts.map