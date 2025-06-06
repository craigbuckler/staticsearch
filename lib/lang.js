// returns stopwords and stem functions
import { readFile } from 'node:fs/promises';
import { resolve, dirname } from 'node:path';

import { fileInfo } from './file.js';
import { wordSet } from './wordset.js';

const
  dirStem = resolve( '/', dirname( import.meta.url.replace(/^[^/]*\/+/, '') ), '../stem/' ),
  mapStem = new Map(),

  dirWord = resolve( '/', dirname( import.meta.url.replace(/^[^/]*\/+/, '') ), '../stopwords/' ),
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
export async function stopWords(language = 'en', maxLength = 7, extrawords = '') {

  // stopwords already loaded
  const mapId = language + maxLength;

  if (mapWord.has(mapId)) {
    return mapWord.get(mapId);
  }

  const
    stem = await stemFunction(language),
    swFile = resolve(dirWord, `stopwords_${language}.txt`),
    swFileInfo = await fileInfo(swFile);

  // read stopword file
  if (swFileInfo.exists && swFileInfo.canRead) {

    mapWord.set(
      mapId,
      wordSet(
        (await readFile(swFile, { encoding: 'utf8' })) + '\n' + extrawords,
        stem,
        maxLength
      )
    );

    return mapWord.get(mapId);

  }

  else return new Set();

}
