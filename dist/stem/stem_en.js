// stem/stem_en.js
function stem(word) {
  const special = {
    skis: "ski",
    skies: "sky",
    dying: "die",
    lying: "lie",
    tying: "tie",
    idly: "idl",
    gently: "gentl",
    ugly: "ugli",
    early: "earli",
    only: "onli",
    singly: "singl"
  };
  const exceptions = [
    "sky",
    "news",
    "howe",
    "atlas",
    "cosmos",
    "bias",
    "andes"
  ];
  const exceptions1a = [
    "inning",
    "outing",
    "canning",
    "herring",
    "earring",
    "proceed",
    "exceed",
    "succeed"
  ];
  const doubles = ["bb", "dd", "ff", "gg", "mm", "nn", "pp", "rr", "tt"];
  let r1, r2;
  if (word.length <= 2 || exceptions.indexOf(word) !== -1) {
    return word;
  }
  if (special[word]) {
    return special[word];
  }
  word = word.replace(/^y|([aeiouy])y/, "$1Y");
  word = word.replace(/^'/, "");
  const regionRegex1 = /^(gener|commun|arsen)(\w*?[aeiouy][^aeiouy])?(\w*)$/;
  const regionRegex2 = /^(\w*?[aeiouy][^aeiouy])(\w*?[aeiouy][^aeiouy])?(\w*)$/;
  const match = regionRegex1.exec(word) || regionRegex2.exec(word) || [];
  if (match[1] && match[1].length < word.length) {
    r1 = match[1].length;
  } else {
    r1 = Infinity;
  }
  if (match[2] && match[1].length + match[2].length < word.length) {
    r2 = match[1].length + match[2].length;
  } else {
    r2 = Infinity;
  }
  word = word.replace(/'s'$|'s$|'$/, "");
  word = handleSuffix(word, [
    [/sses$/, "ss"],
    [/(\w{2,})(ie[d|s])$/, "$1i"],
    [/(\ie[d|s])$/, "ie"],
    [/(us|ss)$/, "$1"],
    [/([aeiouy]\w+)(s)$/, "$1"]
  ]);
  if (exceptions1a.indexOf(word) !== -1) {
    return word;
  }
  word = handleSuffix(word, [
    [/eedly$/, "ee", r1, 5],
    [/(\w*[aeiouy]\w*)ingly$/, s1bHandler],
    [/(\w*[aeiouy]\w*)edly$/, s1bHandler],
    [/eed$/, "ee", r1, 3],
    [/(\w*[aeiouy]\w*)ing$/, s1bHandler],
    [/(\w*[aeiouy]\w*)ed$/, s1bHandler]
  ]);
  word = word.replace(/(\w+[^aeiouy])([yY])$/, "$1i");
  if (r1 !== Infinity) {
    word = handleSuffix(word, [
      [/ational$/, "ate", r1, 7],
      [/fulness$/, "ful", r1, 7],
      [/iveness$/, "ive", r1, 7],
      [/ization$/, "ize", r1, 7],
      [/ousness$/, "ous", r1, 7],
      [/biliti$/, "ble", r1, 6],
      [/lessli$/, "less", r1, 6],
      [/tional$/, "tion", r1, 6],
      [/(?:alism|aliti)$/, "al", r1, 5],
      [/ation$/, "ate", r1, 5],
      [/entli$/, "ent", r1, 5],
      [/fulli$/, "ful", r1, 5],
      [/iviti$/, "ive", r1, 5],
      [/ousli$/, "ous", r1, 5],
      [/abli$/, "able", r1, 4],
      [/alli$/, "al", r1, 4],
      [/anci$/, "ance", r1, 4],
      [/ator$/, "ate", r1, 4],
      [/enci$/, "ence", r1, 4],
      [/izer$/, "ize", r1, 4],
      [/bli$/, "ble", r1, 3],
      [/(l)ogi$/, "$1og", r1, 3],
      [/([cdeghkmnrt])li$/, "$1", r1, 2]
    ]);
    word = handleSuffix(word, [
      [/ational$/, "ate", r1, 7],
      [/tional$/, "tion", r1, 6],
      [/alize$/, "al", r1, 5],
      [/ative$/, "", r2, 5],
      [/(?:icate|iciti)$/, "ic", r1, 5],
      [/ical$/, "ic", r1, 4],
      [/ness$/, "", r1, 4],
      [/ful$/, "", r1, 3]
    ]);
    if (r2 !== Infinity) {
      word = handleSuffix(word, [
        [/ement$/, "", r2, 5],
        [/(?:able|ance|ence|ible|ment)$/, "", r2, 4],
        [/(?:ant|ate|ent|ism|iti|ive|ize|ous)$/, "", r2, 3],
        [/([s|t])ion$/, "$1", r2, 3],
        [/(?:al|er|ic)$/, "", r2, 2]
      ]);
    }
    word = handleSuffix(word, [
      [/(^[aeiouy][^aeiouy]|[^aeiouy][aeiouy][^aeiouywxY])?e$/, s5Handler],
      [/(l)l$/, "$1", r2, 1]
    ]);
  }
  word = word.replace(/Y/, "y");
  return word;
  function handleSuffix(word2, patterns) {
    const wordLen = word2.length;
    for (let i = 0, len = patterns.length; i < len; i++) {
      if (patterns[i][0].test(word2)) {
        if (wordLen - patterns[i][3] < patterns[i][2]) {
          return word2;
        }
        return word2.replace(patterns[i][0], patterns[i][1]);
      }
    }
    return word2;
  }
  function isShort(word2, r12) {
    if (!word2[r12]) {
      return /(^[aeiouy][^aeiouy])|([aeiouy][^aeiouywxY]$)/.test(word2);
    }
    return false;
  }
  function s1bHandler(match2, p1) {
    let result = p1;
    const suffix = result.substring(result.length - 2);
    if (["at", "bl", "iz"].indexOf(suffix) !== -1) {
      result = result + "e";
    } else if (doubles.indexOf(suffix) !== -1) {
      result = result.substring(0, result.length - 1);
    } else if (isShort(result, r1)) {
      result = result + "e";
    }
    return result;
  }
  function s5Handler(match2, p1, offset, string) {
    if (string.length - 1 >= r2) {
      return p1 || "";
    } else if (!p1 && string.length - 1 >= r1) {
      return "";
    }
    return match2;
  }
}
export {
  stem
};
