import {KEY,SESSION_KEY,ROOM_KEY,defaultConfig} from '../dist/logic.js';
import {support} from '../dist/config.js';
const params=new URLSearchParams(location.search);
const mode=params.get('mode')||'empty';
if(params.has('lang'))localStorage.setItem('home:language',params.get('lang'));else localStorage.removeItem('home:language');
support.image='../dist/assets/appreciation-code.jpg';
const qa=window.__qa={network:[],writes:[],idle:new Map(),errors:[],shared:[],copies:[]};
for(const storage of [localStorage,sessionStorage])for(const key of [KEY,SESSION_KEY,ROOM_KEY])storage.removeItem(key);
localStorage.setItem('another-app','keep');sessionStorage.setItem('another-app','keep');
const nativeSet=Storage.prototype.setItem;
Storage.prototype.setItem=function(k,v){qa.writes.push({storage:this===localStorage?'local':'session',key:k,value:v});return nativeSet.call(this,k,v);};
const originalFetch=fetch;window.fetch=function(...args){qa.network.push({kind:'fetch',args:String(args)});return originalFetch.apply(this,args);};
const originalOpen=XMLHttpRequest.prototype.open;XMLHttpRequest.prototype.open=function(...args){qa.network.push({kind:'xhr',args:String(args)});return originalOpen.apply(this,args);};
Object.defineProperty(navigator,'sendBeacon',{value:(...args)=>{qa.network.push({kind:'beacon',args:String(args)});return false;},configurable:true});
addEventListener('error',e=>qa.errors.push(e.message));addEventListener('unhandledrejection',e=>qa.errors.push(String(e.reason)));
const originalSet=setTimeout,originalClear=clearTimeout;let id=-1;
window.setTimeout=(fn,delay,...args)=>{if(delay===60000){const key=id--;qa.idle.set(key,{fn,delay});return key;}return originalSet(fn,delay,...args);};
window.clearTimeout=id=>{qa.idle.delete(id);originalClear(id);};
qa.fireIdle=()=>{for(const [id,t]of [...qa.idle]){qa.idle.delete(id);t.fn();}};
if(mode==='legacy'){localStorage.setItem(KEY,JSON.stringify({version:1,completed:[...'AAAAAAAA'],draft:{answers:['B',...Array(7).fill(null)],index:1}}));}
if(mode==='result'||mode.startsWith('share')||mode==='copyfail'||mode==='imagefail'||mode.startsWith('support')){sessionStorage.setItem(SESSION_KEY,JSON.stringify({draft:null,own:{config:defaultConfig('cinema'),initialItem:'tickets'}}));}
if(mode==='storage'){Object.defineProperty(window,'localStorage',{get(){throw Error('denied')}});Object.defineProperty(window,'sessionStorage',{get(){throw Error('denied')}});}
if(mode==='shareok'||mode==='sharecancel'||mode==='shareerror')Object.defineProperty(navigator,'share',{value:async data=>{qa.shared.push(data);if(mode==='sharecancel')throw new DOMException('cancel','AbortError');if(mode==='shareerror')throw Error('share failed');},configurable:true});
else Object.defineProperty(navigator,'share',{value:undefined,configurable:true});
Object.defineProperty(navigator,'clipboard',{value:{writeText:async value=>{if(mode==='copyfail')throw Error('denied');qa.copies.push(value);}},configurable:true});
if(mode==='imagefail')HTMLCanvasElement.prototype.toBlob=function(cb){cb(null);};
if(mode==='supportbroken')support.image='./missing.png';
if(mode==='supportdisabled')support.enabled=false;
if(mode==='supportempty')support.image='';
if(mode==='supportexternal')support.image='https://example.invalid/code.jpg';
if(mode==='reduced'||mode==='supportreduced'){const original=matchMedia;window.matchMedia=q=>q.includes('prefers-reduced-motion')?{matches:true,addEventListener(){},removeEventListener(){}}:original(q);}
if(mode==='sceneslow'||mode==='scenereject'){const decode=HTMLImageElement.prototype.decode;HTMLImageElement.prototype.decode=function(){if(this.src.startsWith('data:image/svg+xml'))return mode==='sceneslow'?new Promise(()=>{}):Promise.reject(Error('decode failed'));return decode.call(this);};}
if(mode==='animationfail'){const style=document.createElement('style');style.textContent='.snow-block{animation:none!important}';document.head.append(style);}
await import('../dist/app.js');
qa.ready=true;
