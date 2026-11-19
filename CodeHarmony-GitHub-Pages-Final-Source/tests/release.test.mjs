import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile, access} from 'node:fs/promises';
import {join} from 'node:path';

const read=(path)=>readFile(join(process.cwd(),path),'utf8');
const hangul=/[\uac00-\ud7a3]/;

test('English-only source, built UI, feedback, explanations and docs',async()=>{
  for(const path of [
    'index.html','src/main.ts','src/music/composer.ts',
    'src/audio/engine.ts','README.md','dist/index.html',
    'dist/assets/main.js','dist/assets/music/composer.js',
    'dist/assets/audio/engine.js'
  ]){
    const contents=await read(path);
    assert.equal(hangul.test(contents),false,`${path} still contains Hangul`);
  }
  assert.match(await read('dist/index.html'),/<html lang="en">/);
});

test('GitHub Pages build uses subpath-safe asset references',async()=>{
  const html=await read('dist/index.html');
  assert.match(html,/src="\.\/assets\/main\.js"/);
  assert.match(html,/href="\.\/assets\/styles\/app\.css"/);
  assert.match(html,/href="\.\/favicon\.svg"/);
  assert.doesNotMatch(html,/(?:src|href)="\/(?:assets|favicon)/);
  for(const p of ['dist/assets/main.js','dist/assets/styles/app.css','dist/favicon.svg'])await access(join(process.cwd(),p));
});

test('dirty gradient is bundled locally with styles',async()=>{
  const css=await read('dist/assets/styles/app.css');
  for(const name of ['dirty-gradient-hero.webp','dirty-gradient-panel.webp','grain.png']){
    assert.ok(css.includes(name),`Missing ${name} reference`);
    await access(join(process.cwd(),'dist/assets/styles/assets',name));
  }
  assert.doesNotMatch(css,/@import\s+url\(https?:\/\//i);
});

test('GitHub Actions workflow builds and deploys static directory',async()=>{
  const workflow=await read('.github/workflows/deploy.yml');
  assert.match(workflow,/actions\/upload-pages-artifact@v3/);
  assert.match(workflow,/actions\/deploy-pages@v4/);
  assert.match(workflow,/npm test/);
  assert.match(workflow,/path: \.\/dist/);
});
