import * as Exif from 'exif';

export type ExifOptions = {
    [k in keyof Exif.ExifData]?: {
        [k2 in keyof Exif.ExifData[k]]?: true
    }
}

