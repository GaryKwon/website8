import {createServer} from 'node:http';
import {readFile, stat} from 'node:fs/promises';
import {resolve, extname, sep} from 'node:path';
const root=resolve(process.argv[2]||'dist'); const port=Number(process.env.PORT||4173);
const mime={'.html':'text/html; charset=utf-8','.js':'text/javascript; charset=utf-8','.css':'text/css; charset=utf-8','.svg':'image/svg+xml','.ico':'image/x-icon'};
createServer(async(req,res)=>{try {const pathname=decodeURIComponent(new URL(req.url||'/', 'http://localhost').pathname);let path=resolve(root,'.'+pathname);if(!path.startsWith(root+sep)&&path!==root){res.writeHead(403);res.end();return;}if((await stat(path)).isDirectory())path=resolve(path,'index.html');const data=await readFile(path);res.setHeader('Content-Type',mime[extname(path)]||'application/octet-stream');res.end(data);}catch{res.writeHead(404);res.end('Not found');}}).listen(port,()=>console.log(`CodeHarmony running at http://localhost:${port}`));
