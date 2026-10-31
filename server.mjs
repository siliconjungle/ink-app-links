import {KEY,fail,newLibrary,normalizeURL,domain,activeLinks,requireID,moveLink,compactTrash} from './model.mjs';
import {fetchPreview} from './preview.mjs';
export function createService({preview=fetchPreview,now=Date.now}={}){
 async function state(ink){const saved=await ink.state.get(KEY);if(saved.value&&(!Array.isArray(saved.value.links)||saved.value.schema!==1))throw fail('This library uses an unsupported format.',409);return {revision:saved.revision||0,value:saved.value||newLibrary()};}
 async function mutate(ink,update){for(let attempt=0;attempt<64;attempt++){const saved=await state(ink),value=structuredClone(saved.value),result=update(value);if(result.unchanged)return {...result,library:saved.value};compactTrash(value);value.version=(saved.value.version||0)+1;try{await ink.state.set(KEY,value,saved.revision);return {...result,library:value};}catch(error){if(error.status!==409||attempt===63)throw error;await new Promise(resolve=>setTimeout(resolve,Math.min(80,attempt*3)+Math.floor(Math.random()*10)));}}}
 async function metadata(url){try{return await preview(url);}catch{return {title:domain(url),description:'',image:'',icon:'',siteName:domain(url),previewStatus:'unavailable'};}}
 return async function fetch(request,{ink,namespace}){try{const path=new URL(request.url).pathname;if(path==='/health'&&request.method==='GET')return Response.json({ok:true});if(request.method!=='POST')throw fail('Use a signed-in Ink request.',405);const input=await request.json();if(!input||typeof input!=='object'||Array.isArray(input)||!input.__inkCaller)throw fail('Open Links from your signed-in Ink desktop.',401);const actor=await ink.request('apps/'+namespace+'/caller',{method:'POST',body:{assertion:input.__inkCaller,path:new URL(request.url).pathname+new URL(request.url).search,method:request.method,body:input}});
 if(path==='/session')return Response.json({account:actor,library:(await state(ink)).value});
 if(path==='/add'){
  const id=requireID(input.id),url=normalizeURL(input.url),saved=await state(ink),prior=saved.value.links.find(link=>link.id===id||link.url===url&&!link.deletedAt);if(prior){if(prior.deletedAt||prior.id===id&&prior.url!==url)throw fail('This link identity has already been used.',409);return Response.json({library:saved.value,link:prior,duplicate:true});}
  if(activeLinks(saved.value).length>=500)throw fail('This library holds up to 500 links. Delete a link to make room.');const details=await metadata(url);
  const result=await mutate(ink,value=>{const prior=value.links.find(link=>link.id===id||link.url===url&&!link.deletedAt);if(prior){if(prior.deletedAt||prior.id===id&&prior.url!==url)throw fail('This link identity has already been used.',409);return {link:prior,duplicate:true,unchanged:true};}if(activeLinks(value).length>=500)throw fail('This library holds up to 500 links. Delete a link to make room.');const link={...details,id,url,createdAt:now(),updatedAt:now(),addedBy:{accountId:actor.accountId,name:actor.name},deletedAt:null};value.links.unshift(link);return {link,duplicate:false};});return Response.json(result,{status:result.duplicate?200:201});
 }
 if(['/move','/delete','/restore','/refresh'].includes(path)){
  const id=requireID(input.id);let details;if(path==='/refresh'){const saved=await state(ink),link=saved.value.links.find(link=>link.id===id&&!link.deletedAt);if(!link)throw fail('This link was deleted.',404);details=await metadata(link.url);}
  const result=await mutate(ink,value=>{const link=value.links.find(link=>link.id===id);if(!link)throw fail('Link not found.',404);
   if(path==='/restore'){if(!link.deletedAt)return {link,unchanged:true};if(activeLinks(value).length>=500)throw fail('This library holds up to 500 links.');if(value.links.some(other=>other.id!==id&&other.url===link.url&&!other.deletedAt))throw fail('This address is already saved.',409);link.deletedAt=null;link.updatedAt=now();return {link};}
   if(path==='/delete'){if(link.deletedAt)return {link,unchanged:true};link.deletedAt=now();link.updatedAt=now();return {link};}
   if(link.deletedAt)throw fail('This link was deleted.',404);
   if(path==='/move'){if(input.beforeId!==null)requireID(input.beforeId);const changed=moveLink(value,id,input.beforeId);return {link,unchanged:!changed};}
   Object.assign(link,details,{updatedAt:now()});return {link};});return Response.json(result);
 }
 throw fail('Link action not found.',404);
 }catch(error){return Response.json({error:error.message||'Could not save your links.'},{status:error.status||(error instanceof SyntaxError?400:500)});}};
}
export const fetch=createService();
