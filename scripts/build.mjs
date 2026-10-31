import {cp,mkdir,copyFile,rm,readFile,writeFile} from 'node:fs/promises';
await rm('dist',{recursive:true,force:true});await mkdir('dist');await cp('public','dist',{recursive:true});
const model=await readFile('model.mjs','utf8'),preview=(await readFile('preview.mjs','utf8')).replace(/^import .* from '\.\/model\.mjs';\n/m,''),server=(await readFile('server.mjs','utf8')).replace(/^import .* from '\.\/(model|preview)\.mjs';\n/gm,'');
await writeFile('dist/server.mjs',model+'\n'+preview+'\n'+server);await copyFile('model.mjs','dist/model.mjs');await copyFile('icon.svg','dist/icon.svg');console.log('Built Links: shared Ink UI and a self-contained metadata backend.');
