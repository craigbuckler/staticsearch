// data parsing functions
import { readFile } from 'node:fs/promises';

import { parse } from 'node-html-parser';

import { fileInfo } from './file.js';
import { wordSet } from './wordset.js';


// parse robots.txt
// returns a Set of directories to omit
export async function parseRobotsTxt(path, appAgent, isActive) {

  const robots = new Set();
  if (!isActive) return robots;

  const fInfo = await fileInfo(path);
  if (!fInfo.exists || !fInfo.canRead) return robots;

  let active = false, inUA = false;
  (await readFile( path, { encoding: 'utf8' } ) || '')
    .split('\n')
    .forEach(d => {
      d = d.trim();

      if (d.startsWith('User-agent:')) {

        const agent = d.slice(11).trim().toLowerCase();
        active = (active && inUA) || (agent === '*' || agent === appAgent);
        inUA = true;

      }
      else if (d.startsWith('Disallow:')) {

        if (active) robots.add(d.slice(9).trim());
        inUA = false;

      }
      else {
        inUA = false;
      }

    });

  return robots;

}


// default DOMselector and DOMexclude when not defined
const domDef = [
  { find: 'main', excl: 'nav,menu' },
  { find: 'body', excl: 'header,#head,.head,#header,.header,footer,#foot,.foot,#footer,.footer,nav,#nav,.nav,menu,#menu,.menu' }
];


// parse HTML document
// returns object:
// {
//  title: String,
//  description, String,
//  word: {
//    title: Set(),
//    description: Set(),
//    content: Set(),
//    emphasis: Set(),
//    alt: Set(),
//    h2...h6: Set()
//  }
//  link: Map(slug, Set())
// }
export function parseHTML(
  html, DOMselector, DOMexclude, domain, slug, indexFile, stem, stopword, wordCrop = 7
) {

  const
    res = {},
    dom = parse(
      html,
      {
        parseNoneClosedTags: true,
        blockTextElements: {
          script: false,
          noscript: false,
          style: false,
          pre: true
        }
      }
    );

  if (!dom) return null;

  // get schema.org data
  const schemaOrg = getSchemaOrg(html);

  // get title
  res.title = (
    schemaOrg?.headline ||
    dom.querySelector('title')?.structuredText ||
    dom.querySelector('h1')?.structuredText ||
    ''
  ).trim();

  let fullContent = res.title + ' ';

  // get description
  res.description = (
    schemaOrg?.description ||
    dom.querySelector('meta[name="description"]')?.getAttribute('content') ||
    ''
  ).trim();

  // get modified/publication date
  if (schemaOrg) {
    res.date = (
      isDate( schemaOrg.dateModified ) ||
      isDate( schemaOrg.datePublished ) ||
      isDate( schemaOrg.published ) ||
      isDate( schemaOrg.datePosted ) ||
      isDate( schemaOrg.generatedAt ) ||
      isDate( schemaOrg.uploadDate )
    );
  }

  res.date = res.date || (
    isDate( dom.querySelector('meta[property="article:modified_time"]')?.getAttribute('content') ) ||
    isDate( dom.querySelector('meta[property="article:published_time"]')?.getAttribute('content') ) ||
    isDate( dom.querySelector('time[itemProp="dateModified"]')?.getAttribute('datetime') ) ||
    isDate( dom.querySelector('time[itemProp="datePublished"]')?.getAttribute('datetime') ) ||
    isDate( dom.querySelector('time[itemProp="dateCreated"]')?.getAttribute('datetime') )
  );

  // extract words
  res.word = {
    title: wSet( res.title ),
    description: wSet( res.description ),
    content: new Set(),
    emphasis: new Set(),
    alt: new Set(),
    h2: new Set(),
    h3: new Set(),
    h4: new Set(),
    h5: new Set(),
    h6: new Set()
  };

  // extract links
  res.link = new Map();

  // get domain origin
  domain = new URL(domain || 'http://localhost').origin;

  // find appropriate DOM selector and excluder
  if (!DOMselector) {

    let d = 0;
    while (d < domDef.length && !DOMselector) {

      if ( dom.querySelectorAll(domDef[d].find).length ) {
        DOMselector = domDef[d].find;
        DOMexclude = DOMexclude || domDef[d].excl;
      }

      d++;
    }

  }

  // parse all selected DOM sections
  dom.querySelectorAll( DOMselector ).forEach(node => {

    // remove invalid DOM elements
    node.querySelectorAll( DOMexclude ).forEach(n => n.remove());

    // all content
    const content = node.structuredText.replace(/<[^<]+?>/g, '');
    fullContent += content + ' ';
    res.word.content = res.word.content.union( wSet( content ) );

    // strong, b, em, i
    res.word.emphasis = res.word.emphasis.union(
      wSet( [
        ...node.querySelectorAll('strong').map(e => e.structuredText),
        ...node.querySelectorAll('b').map(e => e.structuredText),
        ...node.querySelectorAll('em').map(e => e.structuredText),
        ...node.querySelectorAll('i').map(e => e.structuredText),
      ].join(' ') )
    );

    // img alt
    res.word.alt = res.word.alt.union(
      wSet( node.querySelectorAll('img').map(i => i.getAttribute('alt')).join(' ') )
    );

    // H2-H6
    for (let h = 2; h <= 6; h++) {
      const head = `h${h}`;
      res.word[head] = res.word[head].union(
        wSet( node.querySelectorAll(head).map(t => t.structuredText).join(' ') )
      );
    }

    // outbound links
    node.querySelectorAll('a').forEach(link => {

      const
        href = link.getAttribute('href'),
        w = wSet( link.structuredText );

      if (!w.size || !href || !URL.canParse(href, domain + slug)) return;

      const u = URL.parse(href, domain + slug);
      let p = u.pathname;
      if (p.endsWith('/' + indexFile)) p = p.slice(0, p.length - indexFile.length);
      if (!p.endsWith('/')) p += '/';

      if (u.origin === domain && p !== slug) {
        res.link.set(p, (res.link.get(p) || new Set()).union(w));
      }

    });

  });

  // get word count
  res.wordcount = parseFloat(schemaOrg?.wordCount) || wordCount(fullContent);

  return res;

  // extract unique stemmed words
  function wSet(str) {

    return wordSet(
      str,
      stem,
      wordCrop,
      stopword
    );

  }

}


// check value is a date and return YYYY-MM-DD string or undefined
function isDate(d) {

  d = new Date(d);
  if (!isNaN(d)) return d.toISOString().slice(0, 10);

}


// extract schema
function getSchemaOrg(html) {

  try {

    const
      match = html.match(/application\/ld\+json.*?>(.*?)<\/script/s),
      data = match?.[1],
      schema = data && JSON.parse(data);

    return schema;

  }
  catch (e) {}

}


// count words in a string
function wordCount(str) {

  return str
    .replace(/<[^<]+?>/g, '')
    .replace(/\W/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
    .replace(/\S/g, '')
    .length + 1;

}
