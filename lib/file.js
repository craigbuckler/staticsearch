// file utilities
import { access, stat, writeFile, mkdir, rm } from 'node:fs/promises';
import { constants as fsConstants } from 'node:fs';
import { dirname } from 'node:path';

import { log } from './log.js';

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
  catch (e) {}

  try {
    await access(path, fsConstants.W_OK);
    fileInfo.canWrite = true;
  }
  catch (e) {}

  return info;

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
    log(`Unable to write file: ${ filename }\n,${ e }`, 'error');
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
    log(`Unable to delete path: ${ path }\n${ e }`, 'warn');
  }

}
