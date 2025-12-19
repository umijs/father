import fs from 'fs';

console.log('bundle node', fs);
console.log('process argv:', process.argv);
console.log('process cwd:', process.cwd());

export default function test() {
  return process.env.NODE_ENV;
}
