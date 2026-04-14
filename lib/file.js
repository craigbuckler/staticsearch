// file utilities
import { access, stat, writeFile, mkdir, rm } from 'node:fs/promises';
import { constants as fsConstants } from 'node:fs';
import { dirname, resolve } from 'node:path';

import { concol } from '../indexer.js';

// get file information
export async function fileInfo(path) {

  const info = {
    exists: false,
    canRead: false
  };

  try {
    const i = await stat(path);

    info.exists = true;
    info.isFile = i.isFile();
    info.isDir = i.isDirectory();
    info.modified = i.mtimeMs;

  }
  catch (e) {
    return info;
  }

  try {
    await access(path, fsConstants.R_OK);
    info.canRead = true;
  }
  catch (e) {
    // no read access
  }

  try {
    await access(path, fsConstants.W_OK);
    fileInfo.canWrite = true;
  }
  catch (e) {
    // no write access
  }

  return info;

}


// find readable directory
export async function findReadableDir(rootDir, subDir) {

  subDir = subDir.split(',').map(s => s.trim()).filter(s => s);

  let fd;
  for (let d = 0; d < subDir.length; d++) {

    fd = resolve(rootDir, subDir[d]);

    const fInfo = await fileInfo(fd);
    if (fInfo.isDir && fInfo.canRead) break;
    else fd = null;
  }

  return fd;

}


// write file content
export async function writePath(filename, content) {

  // create file
  try {
    await mkdir(dirname(filename), { recursive: true });
    await writeFile(filename, content);
    return true;
  }
  catch (e) {
    concol.error(`Unable to write file: ${ filename }\n,${ e }`, 0);
    return false;
  }

}


// remove file path
export async function deletePath(path) {

  const fInfo = await fileInfo(path);

  if (!fInfo.exists) return;

  try {
    await rm(path, { recursive: true });
  }
  catch (e) {
    concol.warn(`Unable to delete path: ${ path }\n${ e }`, 2);
  }

}
