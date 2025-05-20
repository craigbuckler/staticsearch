// data parsing functions
import { readFile } from 'node:fs/promises';

import { parse } from 'node-html-parser';

import { fileInfo } from './file.js';
import { wordSet } from './wordset.js';


// parse command line arguments
export function parseCliArgs(opt, defFirst, defSecond) {

  let cArg = defFirst;
  [...process.argv].slice(2).forEach((a, i) => {

    if (a.startsWith('-')) {

      a = a.replace(/^-+/, '');
      let key = a, value;

      const p = a.indexOf('=');
      if (p > 0) {
        key = a.slice(0, p);
        value = a.slice(p + 1);
      }

      if ( Object.hasOwn(opt, key) ) {

        if (p > 0) {
          if (value === undefined) value = true;
          opt[key] = value;
          cArg = null;
        }
        else {
          opt[key] = true;
          cArg = key;
        }

      }

    }
    else if (cArg) {

      opt[cArg] = a;
      cArg = (i ? null : defSecond);

    }

  });

  return opt;

}


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
export function parseHTML(
  html, DOMselector, domain, slug, indexFile, stem, stopword, wordCrop = 7
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

  // get title
  res.title = (dom.querySelector('title')?.structuredText || dom.querySelector('h1')?.structuredText || 'Untitled').trim();

  // get description
  res.description = (dom.querySelector('meta[name="description"]')?.getAttribute('content') || '').trim();

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

  // parse all DOM sections
  DOMselector.forEach(d => {

    const node = dom.querySelector(d);
    if (!node) return;

    // all content
    res.word.content = res.word.content.union( wSet( node.structuredText ) );

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
