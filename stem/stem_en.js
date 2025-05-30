// English Porter2 stemming function
// https://gist.github.com/chrisdc/8c608e67432a6cdd2d89aa7131ec133d

const
  special = {
    skis: 'ski',
    skies: 'sky',
    dying: 'die',
    lying: 'lie',
    tying: 'tie',
    idly: 'idl',
    gently: 'gentl',
    ugly: 'ugli',
    early: 'earli',
    only: 'onli',
    singly: 'singl'
  },

  exceptions = [
    'sky', 'news', 'howe', 'atlas', 'cosmos', 'bias', 'andes'
  ],

  exceptions1a = [
    'inning', 'outing', 'canning', 'herring', 'earring', 'proceed', 'exceed', 'succeed'
  ],

  doubles = ['bb', 'dd', 'ff', 'gg', 'mm', 'nn', 'pp', 'rr', 'tt'];

function handleSuffix(word, patterns) {
  var wordLen = word.length;

  for (var i = 0, len = patterns.length; i < len; i++) {
    if (patterns[i][0].test(word)) {
      if (wordLen - patterns[i][3] < patterns[i][2]) {
        // suffix does not fit the required region
        return word;
      }

      return word.replace(patterns[i][0], patterns[i][1]);
    }
  }
  return word;
}

function isShort(word, r1) {
  if (!word[r1]) {
    return /(^[aeiouy][^aeiouy])|([aeiouy][^aeiouywxY]$)/.test(word);
  }
  return false;
}


// main stemming function
export function stem(word) {

  var r1, r2;

  // 1 or 2 letter words (and some other exceptions) are returned unchanged
  if (word.length <= 2 || exceptions.indexOf(word) !== -1) {
    return word;
  }

  // some words have predefined stem forms
  if (special[word]) {
    return special[word];
  }

  // replace y
  word = word.replace(/^y|([aeiouy])y/, '$1Y');

  // remove initial '
  word = word.replace(/^'/, '');

  // find regions
  const regionRegex1 = /^(gener|commun|arsen)(\w*?[aeiouy][^aeiouy])?(\w*)$/;
  const regionRegex2 = /^(\w*?[aeiouy][^aeiouy])(\w*?[aeiouy][^aeiouy])?(\w*)$/;
  var match = regionRegex1.exec(word) || regionRegex2.exec(word) || [];

  // R1
  if (match[1] && match[1].length < word.length) {
    r1 = match[1].length;
  } else {
    r1 = Infinity;
  }

  // R2
  if (match[2] && match[1].length + match[2].length < word.length) {
    r2 = match[1].length + match[2].length;
  } else {
    r2 = Infinity;
  }

  // step 0
  word = word.replace(/'s'$|'s$|'$/, '');

  // step 1a
  word = handleSuffix(word, [
    [/sses$/, 'ss'],
    [/(\w{2,})(ie[d|s])$/, '$1i'],
    [/(ie[d|s])$/, 'ie'],
    [/(us|ss)$/, '$1'],
    [/([aeiouy]\w+)(s)$/, '$1']
  ]);

  // recheck exceptions
  if (exceptions1a.indexOf(word) !== -1) {
    return word;
  }

  // step 1b
  word = handleSuffix(word, [
    [/eedly$/, 'ee', r1, 5],
    [/(\w*[aeiouy]\w*)ingly$/, s1bHandler],
    [/(\w*[aeiouy]\w*)edly$/, s1bHandler],
    [/eed$/, 'ee', r1, 3],
    [/(\w*[aeiouy]\w*)ing$/, s1bHandler],
    [/(\w*[aeiouy]\w*)ed$/, s1bHandler]
  ]);

  // step 1c
  word = word.replace(/(\w+[^aeiouy])([yY])$/, '$1i');

  if (r1 !== Infinity) {
    // step 2
    word = handleSuffix(word, [
      [/ational$/, 'ate', r1, 7],
      [/fulness$/, 'ful', r1, 7],
      [/iveness$/, 'ive', r1, 7],
      [/ization$/, 'ize', r1, 7],
      [/ousness$/, 'ous', r1, 7],
      [/biliti$/, 'ble', r1, 6],
      [/lessli$/, 'less', r1, 6],
      [/tional$/, 'tion', r1, 6],
      [/(?:alism|aliti)$/, 'al', r1, 5],
      [/ation$/, 'ate', r1, 5],
      [/entli$/, 'ent', r1, 5],
      [/fulli$/, 'ful', r1, 5],
      [/iviti$/, 'ive', r1, 5],
      [/ousli$/, 'ous', r1, 5],
      [/abli$/, 'able', r1, 4],
      [/alli$/, 'al', r1, 4],
      [/anci$/, 'ance', r1, 4],
      [/ator$/, 'ate', r1, 4],
      [/enci$/, 'ence', r1, 4],
      [/izer$/, 'ize', r1, 4],
      [/bli$/, 'ble', r1, 3],
      [/(l)ogi$/, '$1og', r1, 3],
      [/([cdeghkmnrt])li$/, '$1', r1, 2]
    ]);

    // step 3
    word = handleSuffix(word, [
      [/ational$/, 'ate', r1, 7],
      [/tional$/, 'tion', r1, 6],
      [/alize$/, 'al', r1, 5],
      [/ative$/, '', r2, 5],
      [/(?:icate|iciti)$/, 'ic', r1, 5],
      [/ical$/, 'ic', r1, 4],
      [/ness$/, '', r1, 4],
      [/ful$/, '', r1, 3]
    ]);

    if (r2 !== Infinity) {
      // step 4
      word = handleSuffix(word, [
        [/ement$/, '', r2, 5],
        [/(?:able|ance|ence|ible|ment)$/, '', r2, 4],
        [/(?:ant|ate|ent|ism|iti|ive|ize|ous)$/, '', r2, 3],
        [/([s|t])ion$/, '$1', r2, 3],
        [/(?:al|er|ic)$/, '', r2, 2]
      ]);
    }

    // step 5
    word = handleSuffix(word, [
      [/(^[aeiouy][^aeiouy]|[^aeiouy][aeiouy][^aeiouywxY])?e$/, s5Handler],
      [/(l)l$/, '$1', r2, 1]
    ]);
  }

  // reset Y
  word = word.replace(/Y/, 'y');

  return word;


  // step 1b handler
  function s1bHandler(match, p1) {
    var result = p1;
    var suffix = result.substring(result.length - 2);

    if (['at', 'bl', 'iz'].indexOf(suffix) !== -1) {
      result = result + 'e';
    } else if (doubles.indexOf(suffix) !== -1) {
      result = result.substring(0, result.length - 1);
    } else if (isShort(result, r1)) {
      result = result + 'e';
    }
    return result;
  }

  // step 5 handler
  function s5Handler(match, p1, offset, string) {
    if (string.length - 1 >= r2) {
      return p1 || '';
    } else if (!p1 && string.length - 1 >= r1) {
      return '';
    }

    return match;
  }

}
