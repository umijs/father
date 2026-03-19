console.log('hello here');

// @ts-ignore
import React from 'react';
// @ts-ignore
import ReactDOM from 'react-dom';
import './index.less';

import { a } from '@/a';
// import { a as a1 } from 'hello-a';

console.log(a);
// console.log(a1);

console.log(require('alias-module'));

function App({ content }: { content: string }) {
  // @ts-ignore
  return <div className="wrapper">{content}</div>;
}

// @ts-ignore
const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(<App content={'hello'} />);
