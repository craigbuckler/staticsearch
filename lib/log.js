// custom logging
export function log(msg, type = 'log', prefix = '[StaticSearch] ') {

  if (!console[type]) {
    console.log(`${ prefix }unknown logging type: "${ type }"`);
  }

  const preSpace = ' '.repeat(prefix.length);

  msg
    .split('\n')
    .forEach( (m, i) => console[type]((i ? preSpace : prefix) + m) );

}
