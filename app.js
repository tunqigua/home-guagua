import {tr,language,languages,chooseLanguage,setText,setAttribute,refreshTranslations,bindStatic} from './i18n.js';
import {questions,rooms} from './data.js';
import {score,complete,emptyState,parseRoute,roomURL,defaultConfig,validateConfig,initialItems,lights,curtains,items} from './logic.js';
import {createStorage} from './storage.js';
import {sceneURI,sceneSVG,catSVG} from './scene.js';
import {support} from './config.js';
import {createCard} from './card.js';
const app=document.querySelector('#app'),dialog=document.querySelector('#dialog'),dialogBody=document.querySelector('#dialog-body');
const reduced=matchMedia('(prefers-reduced-motion: reduce)');
let storageWarned=false,noticeTimer,temporaryURL=null,dialogTrigger=null,cardBusy=false,supportReady=false,dialogCleanup=()=>{};
let cleanups=[],renderId=0,inputGate=0,revealPending=false,guestHash='',guestConfig,guestInitial;
const el=(tag,cls,text)=>{const n=document.createElement(tag);if(cls)n.className=cls;if(text!==undefined)setText(n,text);return n;};
const add=(parent,...children)=>{parent.append(...children);return parent;};
const button=(text,cls,fn)=>{const b=el('button',cls,text);b.type='button';b.addEventListener('click',fn);return b;};
function notify(text){const n=document.querySelector('#notice');clearTimeout(noticeTimer);setText(n,text);n.classList.add('show');noticeTimer=setTimeout(()=>n.classList.remove('show'),6500);}
function storageFailure(){if(!storageWarned){storageWarned=true;notify('这个浏览器暂时记不住小屋，但你仍然可以继续布置和保存图片。');}}
const storage=createStorage(()=>sessionStorage,()=>localStorage,storageFailure);
let state=storage.load();
const persist=()=>storage.persist(state);
function cleanupPage(){cleanups.splice(0).forEach(fn=>fn());}
function go(path){cleanupPage();if(location.hash===path)render();else location.hash=path;}
function draft(){inputGate=0;state.draft={answers:Array(8).fill(null),index:0};persist();}
function start(){if(!state.draft)draft();go('#/quiz');}
function newTest(){cleanupPage();draft();go('#/quiz');}
function scene(config,key=false){const img=el('img','scene');img.src=sceneURI(config,{key});setAttribute(img,'alt','{room}：从积雪的木窗外望向暖光室内，戴红围巾的挂挂坐在窗边',()=>({room:tr(rooms[config.type].name)}));img.width=768;img.height=576;return img;}
function drawCat(n,state='sit'){n.innerHTML=catSVG(state);setAttribute(n.firstElementChild,'aria-label',state==='yarn'?'戴红围巾的挂挂和毛球':'戴红围巾的挂挂');}
function catNode(){const n=el('div','companion');drawCat(n);return n;}
function openDialog(title,nodes,trigger){dialogCleanup();dialogCleanup=()=>{};if(temporaryURL){URL.revokeObjectURL(temporaryURL);temporaryURL=null;}dialogTrigger=trigger||document.activeElement;dialogBody.replaceChildren(el('h2','',title),...nodes);dialogBody.firstChild.id='dialog-title';if(!dialog.open)dialog.showModal();}
dialog.addEventListener('close',()=>{dialogCleanup();dialogCleanup=()=>{};if(temporaryURL){URL.revokeObjectURL(temporaryURL);temporaryURL=null;}if(dialogTrigger?.isConnected)dialogTrigger.focus();});
dialog.addEventListener('click',e=>{if(e.target===dialog){const r=dialog.getBoundingClientRect();if(e.clientX<r.left||e.clientX>r.right||e.clientY<r.top||e.clientY>r.bottom)dialog.close();}});
function home(){
 const s=el('section','intro');
 add(s,el('h1','home-title','HOME'),el('p','home-description','8 个小选择，找到你该住哪里。'),el('p','home-companion','小猫“挂挂”在窗边等你。'),scene(defaultConfig('cinema','tableware')));
 const label=state.draft?'接着找我的小屋':state.own?'回我的小屋':'去找我的小屋';
 s.append(button(()=>tr(label)+'  →','primary',()=>state.draft?start():state.own?go('#/result'):start()));
 if(state.draft)s.append(button('重新开始','text-button',newTest));
 else if(state.own)s.append(button('再找一间','text-button',newTest));
 s.append(el('p','privacy-short','答案在当前浏览器里处理，不会上传具体答题内容。'));
 return s;
}
function quiz(){
 if(!state.draft)draft();const d=state.draft,i=d.index,q=questions[i],s=el('section','quiz');
 const top=el('div','quiz-top'),cat=catNode();add(top,el('p','eyebrow',()=>tr('寻找小屋 / {n} — 08',{n:String(i+1).padStart(2,'0')})),cat);
 const progress=el('div','progress');progress.setAttribute('role','progressbar');setAttribute(progress,'aria-label','答题进度');progress.setAttribute('aria-valuenow',i+1);progress.setAttribute('aria-valuemin',0);progress.setAttribute('aria-valuemax',8);const fill=el('span');fill.style.width=`${(i+1)/8*100}%`;progress.append(fill);
 const title=el('h1','',q.title);title.id='question-title';const options=el('div','options');options.setAttribute('role','radiogroup');options.setAttribute('aria-labelledby',title.id);
 let idleTimer,advanceTimer,active=true,locked=false;
 const stopIdle=()=>{clearTimeout(idleTimer);cat.classList.remove('playing');drawCat(cat);};
 const resetIdle=()=>{stopIdle();if(active&&!locked&&!document.hidden)idleTimer=setTimeout(()=>{if(!active||locked||document.hidden)return;drawCat(cat,'yarn');cat.classList.add('playing');},60000);};
 const visible=()=>{if(document.hidden)stopIdle();else resetIdle();};
 window.addEventListener('scroll',resetIdle,{passive:true});document.addEventListener('visibilitychange',visible);
 cleanups.push(()=>{active=false;clearTimeout(advanceTimer);stopIdle();window.removeEventListener('scroll',resetIdle);document.removeEventListener('visibilitychange',visible);});
 const rows=[];
 function select(id,event){
  if(!active||locked||Date.now()<inputGate||event?.detail>1)return;
  locked=true;stopIdle();d.answers[i]=id;persist();
  rows.forEach(row=>{const selected=row.dataset.answer===id;row.setAttribute('aria-checked',String(selected));row.classList.toggle('selected',selected);row.setAttribute('aria-disabled','true');});
  advanceTimer=setTimeout(()=>{
   if(!active||state.draft!==d)return;
   inputGate=Date.now()+320;
   if(i<7){d.index++;persist();render();}
   else if(complete(d.answers)){const initialItem=initialItems[d.answers[7]];state.own={config:defaultConfig(score(d.answers),initialItem),initialItem};state.draft=null;persist();revealPending=true;go('#/result');}
  },200);
 }
 q.options.forEach((o,index)=>{
  const row=button('','option',event=>select(o.id,event));row.dataset.answer=o.id;row.setAttribute('role','radio');row.setAttribute('aria-checked',String(d.answers[i]===o.id));row.classList.toggle('selected',d.answers[i]===o.id);row.tabIndex=d.answers[i]===o.id||(!d.answers[i]&&index===0)?0:-1;
  add(row,el('span','option-letter',o.id),el('span','option-text',o.label));
  row.addEventListener('keydown',event=>{
   if(event.key==='Tab'){resetIdle();return;}
   if(!['ArrowDown','ArrowUp','ArrowLeft','ArrowRight','Enter',' '].includes(event.key))return;
   event.preventDefault();if(event.repeat||locked)return;resetIdle();
   if(event.key==='Enter'||event.key===' '){select(o.id,event);return;}
   const next=(index+(['ArrowDown','ArrowRight'].includes(event.key)?1:3))%4;
   rows.forEach((r,n)=>r.tabIndex=n===next?0:-1);rows[next].focus();
  });rows.push(row);options.append(row);
 });
 add(s,top,progress,title,options);
 const nav=el('div','quiz-nav');if(i>0)nav.append(button('← 上一题','text-button',()=>{cleanupPage();d.index--;persist();inputGate=0;render();}));else nav.append(el('p','quiz-hint','点选就会前进，选错也可以回来。'));
 s.append(nav);resetIdle();return s;
}
function reveal(container,img){
 if(reduced.matches)return;
 const layer=el('div','snow-layer');layer.setAttribute('aria-hidden','true');
 for(let i=0;i<8;i++){const block=el('span','snow-block');block.style.setProperty('--x',`${i%4*25}%`);block.style.setProperty('--y',`${Math.floor(i/4)*50}%`);block.style.setProperty('--delay',`${i*28}ms`);block.style.setProperty('--tilt',`${i%2?3:-2}deg`);layer.append(block);}
 const skip=button('跳过','skip-reveal',finish);let fallback,startTimer,done=false;
 function finish(){if(done)return;done=true;clearTimeout(fallback);clearTimeout(startTimer);layer.remove();skip.remove();}
 container.append(layer,skip);cleanups.push(finish);
 const start=()=>{if(done)return;layer.classList.add('falling');fallback=setTimeout(finish,1250);};
 layer.addEventListener('animationend',e=>{if(e.target===layer.lastElementChild)finish();});
 startTimer=setTimeout(finish,350);img.decode().then(()=>{clearTimeout(startTimer);start();}).catch(finish);
}
function result(config,shared){
 const c=config,r=rooms[c.type],s=el('section','result');
 if(shared){add(s,el('p','eyebrow','有人把这扇暖窗分享给了你。'),el('p','visitor-welcome','外面有点冷，进来看看吧。'));}
 else s.append(el('p','eyebrow','找到啦，窗边的位置给你留着。'));
 s.append(el('h1','result-title',r.name));
 const sceneBox=el('div','scene-box'),img=scene(c,true),plaque=el('p','door-plaque',()=> '「'+tr(r.plaques[c.plaque])+'」');sceneBox.append(img);
 add(s,sceneBox,plaque,el('p','quote',r.quote));
 if(!shared&&revealPending){revealPending=false;reveal(sceneBox,img);}
 if(shared){const visit=el('div','visitor-actions');add(visit,button('我也找一间小屋','primary',()=>state.draft?start():newTest()));if(state.draft)visit.append(button('接着找我的小屋','secondary',start));if(state.own)visit.append(button('回自己的小屋','text-button',()=>go('#/result')));s.append(visit);}
 const actions=el('div','actions');add(actions,button('保存我的小屋','primary',e=>saveCard(c,e.currentTarget)),button('把小屋发给朋友','secondary',()=>share(c)));
 add(s,actions,el('p','share-note','朋友会看到你选的小屋、摆设和门牌话，不会看到完整答题记录。'));
 const dressing=el('section','dressing');add(dressing,el('p','eyebrow','把喜欢的日常，放在窗边'),el('h2','','这就是你的家，请肆意装扮。'));
 const welcome=el('p','description');welcome.append(el('span','','换一盏灯，在窗台摆上喜欢的小东西。'),el('br'),el('span','','挂挂会在这里陪着你。'));dressing.append(welcome);
 const live=el('p','sr-only');live.setAttribute('aria-live','polite');
 function update(){img.src=sceneURI(c,{key:true});setText(plaque,()=> '「'+tr(r.plaques[c.plaque])+'」');if(!shared)persist();setText(live,'小屋布置已更新。');}
 const controls=[];
 function choices(title,values,get,set){const field=el('fieldset','choice-field');field.append(el('legend','',title));const row=el('div','chips');
  for(const [value,label]of Object.entries(values)){const b=button(label,'chip',()=>{set(value);refresh();update();});b.setAttribute('aria-pressed',String(get()===value));row.append(b);controls.push(()=>b.setAttribute('aria-pressed',String(get()===value)));}
  field.append(row);dressing.append(field);
 }
 const refresh=()=>controls.forEach(fn=>fn());
 choices('灯光',lights,()=>c.light,v=>c.light=v);
 choices('窗帘',curtains,()=>c.curtain,v=>c.curtain=v);
 const slots=el('fieldset','choice-field');slots.append(el('legend','','窗台小物'));const slotRow=el('div','slots');
 c.items.forEach((_,i)=>{const label=el('label','slot');label.append(el('span','', ['左边','中间','右边'][i]));const select=el('select');setAttribute(select,'aria-label','窗台{position}的小物',()=>({position:tr(['左边','中间','右边'][i])}));
  for(const [value,name]of Object.entries(items)){if(['sketch','tableware'].includes(value)&&!c.items.includes(value))continue;const option=el('option','',name);option.value=value;select.append(option);}
  select.value=c.items[i];select.addEventListener('change',()=>{c.items[i]=select.value;update();});controls.push(()=>{if(![...select.options].some(o=>o.value===c.items[i])){const o=el('option','',items[c.items[i]]);o.value=c.items[i];select.append(o);}select.value=c.items[i];});label.append(select);slotRow.append(label);
 });slots.append(slotRow);dressing.append(slots);
 choices('挂一句门牌话',Object.fromEntries(r.plaques.map((t,i)=>[i,t])),()=>String(c.plaque),v=>c.plaque=Number(v));
 add(dressing,button('恢复初始布置','text-button',()=>{const initial=shared?guestInitial:defaultConfig(c.type,state.own.initialItem);Object.assign(c,validateConfig(initial));refresh();update();}),el('p','dressing-note','布置过程只留在当前浏览器中。主动分享后，朋友才能通过链接看到你分享的那份小屋。'),live);s.append(dressing);
 const reading=el('details','reading');reading.append(el('summary','','看看这间小屋像我的地方'));const tags=el('div','tags');r.tags.forEach(t=>tags.append(el('span','tag',t)));add(reading,tags,el('p','',r.body));s.append(reading);
 if(!shared){const remember=el('label','remember'),input=el('input');input.type='checkbox';input.checked=storage.isRemembered();input.addEventListener('change',()=>input.checked=storage.remember(input.checked,state));add(remember,input,el('span','','在这个浏览器里记住我的小屋'));add(s,remember,el('p','session-note','默认只留在本次会话。开启后，也只记住房型和布置。'),button('再找一间','text-button',newTest));}
 if(supportReady)s.append(supportSection(c));
 return s;
}
async function saveCard(config,trigger){
 if(cardBusy)return;cardBusy=true;let pendingURL=null;const id=renderId,c=validateConfig(config);trigger.disabled=true;setText(trigger,'正在生成小屋卡片…');
 try{const {blob}=await createCard(c);if(id!==renderId)return;const url=URL.createObjectURL(blob),img=el('img');pendingURL=url;img.src=url;setAttribute(img,'alt','{room}，当前布置的小屋卡片',()=>({room:tr(rooms[c.type].name)}));await img.decode();if(id!==renderId){URL.revokeObjectURL(url);pendingURL=null;return;}const a=el('a','primary','下载图片');a.href=url;setAttribute(a,'download',()=>`HOME-${tr(rooms[c.type].name)}.png`);openDialog('把这间小屋留在身边',[img,el('p','','小屋卡片做好啦，长按图片或点下载就能留住。'),a],trigger);temporaryURL=url;}
 catch{if(pendingURL)URL.revokeObjectURL(pendingURL);notify('卡片暂时没有生成成功，可以再试一次。');}finally{cardBusy=false;trigger.disabled=false;setText(trigger,'保存我的小屋');}
}
async function share(config){
 const c=validateConfig(config),r=rooms[c.type],url=roomURL(c);
 if(navigator.share){try{await navigator.share({title:'HOME · '+tr(r.name),text:tr(r.quote)+'\n'+tr(r.plaques[c.plaque]),url});return;}catch(e){if(e.name==='AbortError')return;}}
 try{await navigator.clipboard.writeText(url);notify('小屋链接已复制，可以发给朋友了。');}
 catch{const area=el('textarea');area.value=url;area.readOnly=true;setAttribute(area,'aria-label','小屋分享链接');openDialog('把这扇暖窗分享出去',[el('p','','长按或选中下面的链接，就可以手动复制。拿到链接的人可以查看这份小屋快照。'),area,button('选中链接','secondary',()=>{area.focus();area.select();})]);}
}
function supportSection(config){
 const box=el('aside','support');box.setAttribute('aria-labelledby','support-title');const title=el('h2','','请造屋的人喝杯热可可');title.id='support-title';
 add(box,el('p','eyebrow','来自造屋的人'),title,el('p','support-copy','如果这间小屋有一点像你，\n也让你在这里暖和了一会儿，\n可以请造屋的人喝杯热可可。'),el('p','support-author',support.note),button('请一杯热可可','primary',e=>showSupport(config,e.currentTarget)),el('p','support-fine','自愿支持，金额随意。小屋里的完整体验一直免费。'));return box;
}
function showSupport(config,trigger){
 if(!supportReady)return;
 const content=el('div','support-content'),img=el('img','support-code');img.src=support.image;setAttribute(img,'alt','{author}自己的赞赏码，长按可保存原图',{author:support.author});
 img.addEventListener('error',()=>{supportReady=false;dialog.close();document.querySelector('.support')?.remove();});
 const original=el('a','text-button','查看原图');original.href=support.image;original.target='_blank';original.rel='noopener';
 const save=el('a','text-button','保存原图');save.href=support.image;setAttribute(save,'download','造屋人的赞赏码');
 const imageActions=el('div','support-image-actions');add(imageActions,original,save);
 add(content,el('p','support-copy','谢谢你愿意支持。\n可以按自己的心意，给造屋的人留一杯热饮。'),el('p','support-owner',()=>tr('{author}的赞赏码',{author:support.author})),img,imageActions,el('p','support-fine','也可以长按图片保存，或查看原图后保存。'),el('p','support-amounts','1 元、3 元、6 元，或者你喜欢的金额，都很好。'),el('p','support-fine','实际金额由你在支付 App 中填写。'),el('p','support-fine','赞赏使用人民币（CNY），以支付页面显示的实际金额为准。'),el('p','support-fine','测试、完整结果、装扮、保存海报和分享始终免费。'),el('p','support-fine','这里无法确认付款。挂挂的感谢送给每一个喜欢这里的人，无需付款或提供证明。'));
 const thanks=el('section','support-thanks');thanks.hidden=true;setAttribute(thanks,'aria-label','挂挂的感谢');
 const bubble=el('p','thanks-bubble','谢谢你喜欢这里，喵。');bubble.tabIndex=-1;
 const picture=el('div','thanks-scene');picture.innerHTML=sceneSVG(config,{thanks:true});const svg=picture.querySelector('svg');svg.setAttribute('viewBox','150 110 84 63');svg.setAttribute('role','img');setAttribute(svg,'aria-label','戴红围巾的挂挂用两只小爪子捧着热可可，身后的窗灯暖暖地亮着');
 let timer;
 const finish=()=>{clearTimeout(timer);picture.classList.remove('thanking');skip.hidden=true;};
 const skip=button('跳过动画','text-button',finish);
 const back=button('返回赞赏码','secondary',()=>{finish();thanks.hidden=true;content.hidden=false;play.focus();});
 add(thanks,bubble,picture,el('p','thanks-ending','下一间小屋，也会慢慢亮起来。'),skip,back);
 const play=button('看看挂挂的感谢','secondary',()=>{content.hidden=true;thanks.hidden=false;bubble.focus();if(!reduced.matches){skip.hidden=false;picture.classList.remove('thanking');void picture.offsetWidth;picture.classList.add('thanking');timer=setTimeout(finish,1800);}else finish();});content.append(play);
 openDialog('给这个小角落添一点暖',[content,thanks],trigger);
 const motionChange=()=>{if(reduced.matches)finish();};reduced.addEventListener('change',motionChange);
 dialogCleanup=()=>{finish();reduced.removeEventListener('change',motionChange);};
}
function errorPage(){const s=el('section','error-page');add(s,catNode(),el('h1','','这扇窗暂时找不到了'),el('p','','链接可能不完整，你也可以找一间自己的小屋。'),button('去找我的小屋','primary',start));return s;}
function render(){
 cleanupPage();renderId++;const route=parseRoute(location.hash);let node;
 if(route.page==='home')node=home();else if(route.page==='quiz')node=quiz();else if(route.page==='result')node=state.own?result(state.own.config,false):errorPage();
 else if(route.page==='shared'){if(guestHash!==location.hash){guestHash=location.hash;guestConfig=validateConfig(route.config);guestInitial=validateConfig(route.config);}node=result(guestConfig,true);}
 else node=errorPage();
 app.replaceChildren(node);app.focus({preventScroll:true});window.scrollTo(0,0);updateMetadata();refreshTranslations();
}
document.querySelector('#clear').addEventListener('click',()=>{
 openDialog('清除这台浏览器里的小屋记录',[el('p','','会清除本站在当前浏览器中保存的答题草稿、小屋结果和装扮记录。只删除本站自己的存储项。已经下载的图片和已经发出的分享快照，无法通过清除本机记录收回。'),button('清除小屋记录','primary',()=>{cleanupPage();const ok=storage.clear();state=emptyState();guestHash='';guestConfig=null;guestInitial=null;revealPending=false;dialog.close();go('#/');notify(ok?'这台浏览器里的小屋记录已清除。':'当前小屋已清空，浏览器限制了部分记录的删除。');})]);
});
window.addEventListener('hashchange',()=>{if(dialog.open)dialog.close();render();});
window.addEventListener('pagehide',cleanupPage);
window.addEventListener('pageshow',e=>{if(e.persisted)render();});
bindStatic(document.body);
const languageMenu=document.querySelector('#language');languageMenu.value=language;
function updateMetadata(){
 document.documentElement.lang=language;document.title=tr('HOME · 挂挂在窗边等你');
 const config=parseRoute(location.hash).page==='shared'?guestConfig:parseRoute(location.hash).page==='result'?state.own?.config:null;
 const title=config?'HOME · '+tr(rooms[config.type].name):document.title;
 const description=config?tr(rooms[config.type].quote):tr('8 个小选择，找到你该住哪里。');
 for(const name of ['description','og:description','twitter:description'])document.querySelector(`meta[name="${name}"],meta[property="${name}"]`)?.setAttribute('content',description);
 const preview=new URL(language==='zh-Hans'?'./assets/share-preview.png':`./assets/share-preview-${language}.png`,location.href).href;
 for(const name of ['og:image','twitter:image'])document.querySelector(`meta[name="${name}"],meta[property="${name}"]`)?.setAttribute('content',preview);
 for(const name of ['og:title','twitter:title'])document.querySelector(`meta[name="${name}"],meta[property="${name}"]`)?.setAttribute('content',title);
}
languageMenu.addEventListener('change',()=>{
 chooseLanguage(languageMenu.value);refreshTranslations();updateMetadata();
 // Invalidate an in-flight card; the next export uses the newly selected language.
 renderId++;
});
render();
// 赞赏图仅允许本站文件；不会向第三方附带答案、装扮或访客信息。
if(support.enabled&&[support.author,support.image,support.note].every(v=>typeof v==='string'&&v.trim())){
 let url;try{url=new URL(support.image,location.href);}catch{}
 if(url?.origin===location.origin){const image=new Image();image.onload=()=>{if(!image.naturalWidth||!image.naturalHeight)return;supportReady=true;const resultNode=app.querySelector('.result');if(resultNode&&!resultNode.querySelector('.support'))resultNode.append(supportSection(parseRoute(location.hash).page==='shared'?guestConfig:state.own.config));};image.src=url.href;}
}
