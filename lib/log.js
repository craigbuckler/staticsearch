// custom logging
import { styleText } from 'node:util';

export function log(msg, type = 'log', prefix = '[StaticSearch] ') {

  const preSpace = ' '.repeat(prefix.length);
  prefix = styleText(['dim', 'cyan'], prefix);

  if (!console[type]) {
    msg = 'unknown logging type: "${ type }"\n${ msg }';
  }

  msg
    .split('\n')
    .forEach( (m, i) => {

      const nv = m.split(':');

      if (nv.length > 1) {

        m = '';

        nv.forEach((v, j) => {
          if (j + 1 < nv.length) {
            m += v + ':';
          }
          else {
            m += styleText(['cyanBright'], v);
          }
        });

      }
      else {
        m = styleText(['whiteBright'], m);
      }

      console[type]((i ? preSpace : prefix) + m);

    });

}
