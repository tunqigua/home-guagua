import { questions, rooms } from './data.js';
export const KEY = 'brain-room:v1';
export const SESSION_KEY = 'brain-room:v2:session';
export const ROOM_KEY = 'brain-room:v2:remembered';
export const validAnswer = (a, i) => questions[i]?.options.some(o => o.id === a) === true;
export const complete = a => Array.isArray(a) && a.length === 8 && questions.every((_,i) => validAnswer(a[i],i));
export function score(answers) {
  if (!complete(answers)) throw new Error('请完成八道选择。');
  const types = answers.map((a,i) => questions[i].options.find(o=>o.id===a).type);
  const counts = Object.fromEntries(Object.keys(rooms).map(t=>[t,0]));
  types.forEach(t=>counts[t]++);
  const max = Math.max(...Object.values(counts));
  return [...types].reverse().find(t=>counts[t]===max);
}
export const lights = {honey:'蜂蜜暖光',fire:'壁炉橘光',sleep:'睡前柔光'};
export const curtains = {cream:'奶油色',sage:'灰绿色',brown:'暖棕色'};
export const items = {none:'留空',cocoa:'热可可',plant:'小盆栽',books:'一摞书',lamp:'小台灯',yarn:'毛线篮',tickets:'电影票与耳机',sketch:'草稿本与笔',tableware:'杯子与小餐具'};
export const initialItems = {A:'tickets',B:'sketch',C:'plant',D:'tableware'};
export function defaultConfig(type,initialItem='tickets') {
  if(!Object.hasOwn(rooms,type))throw Error('未知小屋');
  return {type,light:'honey',curtain:'cream',items:[initialItem,'cocoa','yarn'],plaque:0};
}
export function validateConfig(c) {
  if(!c||typeof c!=='object'||Array.isArray(c)||!['type','light','curtain'].every(k=>typeof c[k]==='string')||!Object.hasOwn(rooms,c.type)||!Object.hasOwn(lights,c.light)||!Object.hasOwn(curtains,c.curtain)||!Array.isArray(c.items)||c.items.length!==3||!c.items.every(i=>typeof i==='string'&&Object.hasOwn(items,i))||!Number.isInteger(c.plaque)||c.plaque<0||c.plaque>2)return null;
  return {type:c.type,light:c.light,curtain:c.curtain,items:[...c.items],plaque:c.plaque};
}
export function validateDraft(d) {
  return d&&Array.isArray(d.answers)&&d.answers.length===8&&questions.every((_,i)=>d.answers[i]===null||validAnswer(d.answers[i],i))&&Number.isInteger(d.index)&&d.index>=0&&d.index<8?{answers:[...d.answers],index:d.index}:null;
}
export function validateRoom(r) {
  const config=validateConfig(r?.config);
  return config&&Object.values(initialItems).includes(r.initialItem)?{config,initialItem:r.initialItem}:null;
}
export const emptyState = () => ({draft:null,own:null});
export function parseRoute(hash) {
  if(['','#/'].includes(hash))return {page:'home'};
  if(hash==='#/quiz')return {page:'quiz'};
  if(hash==='#/result')return {page:'result'};
  const old=/^#\/room\/v1\/([a-z]+)$/.exec(hash);
  if(old&&Object.hasOwn(rooms,old[1]))return {page:'shared',config:defaultConfig(old[1])};
  const m=/^#\/room\/v2\/([a-z]+)\?(.+)$/.exec(hash);
  if(!m)return {page:'invalid'};
  const p=new URLSearchParams(m[2]);
  if([...p.keys()].length!==4||!['l','c','i','p'].every(k=>p.getAll(k).length===1)||!/^[012]$/.test(p.get('p')||''))return {page:'invalid'};
  const config=validateConfig({type:m[1],light:p.get('l'),curtain:p.get('c'),items:(p.get('i')||'').split(','),plaque:Number(p.get('p'))});
  return config?{page:'shared',config}:{page:'invalid'};
}
export function roomURL(config,href=location.href) {
  const c=validateConfig(typeof config==='string'?defaultConfig(config):config);if(!c)throw Error('未知小屋');
  const url=new URL(href);url.search='';
  url.hash='/room/v2/'+c.type+'?'+new URLSearchParams({l:c.light,c:c.curtain,i:c.items.join(','),p:String(c.plaque)});
  return url.href;
}
