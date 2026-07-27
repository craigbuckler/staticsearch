// convert a string to a Set of stemmed words
// used client and server-side
export function wordSet(str, stemFunc, wordCrop = 7, stopword = new Set()) {

  return new Set(
    str
      // remove accents
      .normalize('NFD').replace(/[\u0300-\u036f]/g, '')

      // replace hyphens, underscores, and apostrophes with nothing
      .replace(/[\u0027\u002d\u005f\u2010\u2011\u2012\u2013\u2018\u2019\u201a\u201b\ufe63\ufe4d\ufe4e\ufe4f\uff0d\uff3f]/g, '')
      .toLowerCase()

      // remove non-alphabetic characters
      .replace(/[^a-z\s]/g, ' ')

      // split by spaces into array
      .split(/\s+/g)

      // apply stemming and cropping
      .map(w => stemFunc( w.trim() ).slice(0, wordCrop))

      // remove stop words
      .filter(w => w.length > 1 && !stopword.has(w))
      .sort()
  );

}
