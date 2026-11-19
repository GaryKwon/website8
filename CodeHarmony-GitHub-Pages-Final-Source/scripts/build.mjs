import {cp, mkdir, readFile, writeFile} from 'node:fs/promises';
await mkdir('dist/assets/styles', {recursive:true});
await cp('src/styles','dist/assets/styles',{recursive:true});
await cp('public','dist',{recursive:true});
let html = await readFile('index.html','utf8');
html = html.replace('src="/src/main.ts"','src="./assets/main.js"').replace('href="/src/styles/app.css"','href="./assets/styles/app.css"').replace('href="/favicon.svg"','href="./favicon.svg"');
await writeFile('dist/index.html',html);
console.log('Built browser-ready offline assets in dist/');
