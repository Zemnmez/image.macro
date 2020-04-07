"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const find_cache_dir_1 = __importDefault(require("find-cache-dir"));
const rev_hash_1 = __importDefault(require("rev-hash"));
const path_1 = __importDefault(require("path"));
const fs_extra_1 = __importDefault(require("fs-extra"));
const babel_plugin_macros_1 = __importDefault(require("babel-plugin-macros"));
const cacheDir = find_cache_dir_1.default({ name: 'image.macro' });
if (!cacheDir)
    throw new babel_plugin_macros_1.default.MacroError('unable to locate cache dir');
/**
 * given file name and content, store
 * the content in a local cache, and return
 * its location.
 */
exports.cache = (name, content) => {
    const ext = path_1.default.extname(name);
    const newName = name.slice(0, -ext.length + 1) + "." + rev_hash_1.default(content) + ext;
    const pathname = path_1.default.resolve(cacheDir, newName);
    fs_extra_1.default.ensureDirSync(cacheDir);
    fs_extra_1.default.writeFileSync(pathname, content);
    return pathname.replace(/^.*\/node_modules\//, '');
};
exports.default = exports.cache;
//# sourceMappingURL=cache.js.map