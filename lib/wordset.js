// convert a string to a Set of stemmed words
// used client and server-side
export function wordSet(str, stemFunc, wordCrop = 7, stopword = new Set()) {

  return new Set(
    str
      .normalize('NFD').replace(/[\u0300-\u036f]/g, '') // remove accents
      .replace(/[\u2018\u2019\u201A\u201B\u0027]/g, '') // replace apostrophes with nothing
      .toLowerCase()
      .replace(/[^a-z\s]/g, ' ')                        // remove non-alphabetic characters
      .split(/\s+/g)
      .map(w => stemFunc( w.trim() ).slice(0, wordCrop))
      .filter(w => w.length > 1 && !stopword.has(w))
      .sort()
  );

}
