// returns stopwords and stem functions
import { readFile } from 'node:fs/promises';
import { resolve, dirname } from 'node:path';
import crypto from 'node:crypto';

import { fileInfo } from './file.js';
import { wordSet } from './wordset.js';

const
  dirLoc = dirname( import.meta.url.replace(/^[^/]*\/+/, '') ),

  dirStem = resolve( '/', dirLoc, '../stem/' ),
  mapStem = new Map(),

  dirWord = resolve( '/', dirLoc, '../stopwords/' ),
  mapWord = new Map();


// stem filename
export async function stemFilename(dir, language = 'en') {

  // language-specific stem function?
  let stemFile = `stem_${language}.js`;
  const stemFileInfo = await fileInfo( resolve(dir, stemFile) );

  // generic stem function
  if (!stemFileInfo.exists || !stemFileInfo.canRead) {
    stemFile = 'stem.js';
  }

  return stemFile;

}


// get stem function
export async function stemFunction(language = 'en') {

  // stem function already loaded
  if (mapStem.has(language)) {
    return mapStem.get(language);
  }

  // language-specific or generic stem function?
  const
    stemFile = await stemFilename(dirStem, language),
    stemImport = 'file://' + resolve(dirStem, stemFile).replaceAll('\\', '/');

  // import stem function
  const stem = (await import( stemImport )).stem;
  mapStem.set(language, stem);
  return stem;

}


// get stopword list
export async function stopWords(language = 'en', setDefaults, extrawords, maxLength = 7) {

  // stopwords already loaded?
  const mapId = crypto.createHash('md5').update(language + (setDefaults ? 'T' : 'F') + maxLength + extrawords).digest('base64');

  if (mapWord.has(mapId)) {
    return mapWord.get(mapId);
  }

  const stem = await stemFunction(language);
  let words = extrawords || '';

  // read default stopword file
  if (setDefaults) {

    const
      swFile = resolve(dirWord, `stopwords_${language}.txt`),
      swFileInfo = await fileInfo(swFile);

    if (swFileInfo.exists && swFileInfo.canRead) {
      words += '\n' + await readFile(swFile, { encoding: 'utf8' });
    }

  }

  // generate stopword set
  words = words.trim();
  if (words) {

    mapWord.set(
      mapId,
      wordSet(words, stem, maxLength)
    );

    return mapWord.get(mapId);

  }
  else return new Set();

}
