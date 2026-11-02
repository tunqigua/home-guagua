import {questions,rooms} from './data.js';
import {ui,content} from './locales.js';
export const languages={'zh-Hans':'简体中文','zh-Hant':'繁體中文',ja:'日本語',en:'English'};
export const LANGUAGE_KEY='home:language';
export const validLanguage=value=>typeof value==='string'&&Object.hasOwn(languages,value);
export function readLanguage(getStorage=()=>localStorage){try{const value=getStorage().getItem(LANGUAGE_KEY);return validLanguage(value)?value:'zh-Hans';}catch{return 'zh-Hans';}}
export let language=readLanguage();
export const catalog=Object.fromEntries(Object.keys(languages).map(l=>[l,{}]));
function entry(source,values){Object.keys(languages).forEach((lang,i)=>catalog[lang][source]=[source,...values][i]);}
ui.forEach(([source,...values])=>entry(source,values));
questions.forEach((q,i)=>[q.title,...q.options.map(o=>o.label)].forEach((source,j)=>entry(source,['zh-Hant','ja','en'].map(l=>content.questions[l][i][j]))));
for(const [id,r]of Object.entries(rooms)){
 const flatten=r=>[r.name,r.quote,...r.tags,r.body,...r.plaques];
 const fromArray=a=>[a[0],a[1],...a[2],a[3],...a[4]];
 flatten(r).forEach((source,i)=>entry(source,['zh-Hant','ja','en'].map(l=>fromArray(content.rooms[id][l])[i])));
}
export function tr(source,params={},lang=language){let value=catalog[lang]?.[source]??source;for(const [key,text]of Object.entries(params))value=value.replaceAll('{'+key+'}',text);return value;}
export function chooseLanguage(value,getStorage=()=>localStorage){if(!validLanguage(value))value='zh-Hans';language=value;try{getStorage().setItem(LANGUAGE_KEY,value);}catch{}return value;}
const texts=new Map(),attributes=new Map();
const valueOf=value=>typeof value==='function'?value():value;
export function setText(node,source,params={}){if(source===''){texts.delete(node);node.textContent='';return node;}texts.set(node,{source,params});node.textContent=tr(valueOf(source),valueOf(params));return node;}
export function setAttribute(node,name,source,params={}){if(!attributes.has(node))attributes.set(node,new Map());attributes.get(node).set(name,{source,params});node.setAttribute(name,tr(valueOf(source),valueOf(params)));return node;}
export function refreshTranslations(){
 for(const [node,{source,params}]of texts){if(node.isConnected)node.textContent=tr(valueOf(source),valueOf(params));else texts.delete(node);}
 for(const [node,attrs]of attributes){if(node.isConnected)for(const [name,{source,params}]of attrs)node.setAttribute(name,tr(valueOf(source),valueOf(params)));else attributes.delete(node);}
}
export function bindStatic(root){
 const walker=document.createTreeWalker(root,NodeFilter.SHOW_TEXT);let node;while((node=walker.nextNode()))if(Object.hasOwn(catalog['zh-Hans'],node.textContent.trim()))setText(node,node.textContent.trim());
 for(const node of root.querySelectorAll('[aria-label],[alt]'))for(const name of ['aria-label','alt']){const value=node.getAttribute(name);if(value)setAttribute(node,name,value);}
}
