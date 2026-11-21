import { spawn } from 'node:child_process';
import { createServer } from 'node:http';
import { readFileSync, existsSync } from 'node:fs';
import { extname, join, normalize } from 'node:path';
const built = spawn('node',['scripts/build.mjs'],{stdio:'inherit'});
built.on('exit',code=>{
 if(code!==0)process.exit(code);
 const root=join(process.cwd(),'dist');
 const mime={'.html':'text/html; charset=utf-8','.css':'text/css','.js':'text/javascript','.svg':'image/svg+xml','.png':'image/png','.jpg':'image/jpeg','.webp':'image/webp','.ico':'image/x-icon'};
 createServer((req,res)=>{
  const pathname=decodeURIComponent(new URL(req.url,'http://localhost').pathname);
  if(pathname.startsWith('/api/')){res.writeHead(503,{'Content-Type':'application/json'});return res.end(JSON.stringify({error:'El formulario necesita desplegarse en Vercel y configurar variables de entorno.'}));}
  let path=normalize(join(root,pathname));
  if(!path.startsWith(root)){res.writeHead(403);return res.end();}
  if(path.endsWith('/')||!extname(path))path=join(path,'index.html');
  if(!existsSync(path)){res.writeHead(404);return res.end('Página no encontrada');}
  res.writeHead(200,{'Content-Type':mime[extname(path)]||'application/octet-stream'});res.end(readFileSync(path));
 }).listen(4321,()=>console.log('Vista local: http://localhost:4321'));
});
