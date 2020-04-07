import findCacheDir from 'find-cache-dir';
import revHash from 'rev-hash';
import path from 'path';
import fsutil from 'fs-extra';
import macros from 'babel-plugin-macros';

const cacheDir = findCacheDir({ name: 'image.macro' });
if (!cacheDir) throw new macros.MacroError('unable to locate cache dir');

/**
 * given file name and content, store
 * the content in a local cache, and return
 * its location.
 */
export const cache:
    (name: string, content: string | Buffer) => string
=
    (name, content) => {
        const ext = path.extname(name);
        const newName = name.slice(0, -ext.length+1) + "." + revHash(content) + ext;
        const pathname = path.resolve(cacheDir, newName);
        fsutil.ensureDirSync(cacheDir);
        fsutil.writeFileSync(pathname, content);

        return pathname.replace(/^.*\/node_modules\//, '')
    }
;

export default cache;