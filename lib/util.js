// utility functions
import process from 'node:process';

// process an environment variable
export function env(name, def = null) {

  const val = process.env[name];
  if (!val) return def;
  const num = +val;
  return isNaN(num) ? val : num;

}
