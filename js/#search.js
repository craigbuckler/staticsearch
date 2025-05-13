import { stem } from 'porter2';
import { stopWords } from '../lib/stopwords.js';

const stopwords = stopWords(7);

console.log('running!');
console.log(stopwords);
