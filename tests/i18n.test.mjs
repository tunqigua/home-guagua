import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {questions,rooms} from '../dist/data.js';
import {lights,curtains,items,score,roomURL,parseRoute,defaultConfig} from '../dist/logic.js';
import {catalog,readLanguage,chooseLanguage,tr,languages,LANGUAGE_KEY} from '../dist/i18n.js';
import {wrapLines} from '../dist/card.js';
test('complete four-language content and stable identifiers',()=>{
 const sources=[...questions.flatMap(q=>[q.title,...q.options.map(o=>o.label)]),...Object.values(rooms).flatMap(r=>[r.name,r.quote,...r.tags,r.body,...r.plaques]),...Object.values(lights),...Object.values(curtains),...Object.values(items)];
 assert.equal(new Set(questions.map(q=>q.id)).size,8);
 for(const lang of Object.keys(languages))for(const source of sources)assert.ok(catalog[lang][source],lang+': '+source);
 for(const [source,value]of Object.entries(catalog.en))assert.ok(!/[\u3400-\u9fff]/u.test(value),source);
 const config={...defaultConfig('cinema'),plaque:2};const url=roomURL(config,'https://example.com');
 for(const lang of Object.keys(languages)){chooseLanguage(lang,()=>({setItem(){}}));assert.equal(score([...'AAAAAAAA']),'cinema');assert.deepEqual(parseRoute(new URL(url).hash).config,config);assert.equal(roomURL(config,'https://example.com'),url);}
});
test('language defaults, invalid values, failures, and isolated local key',()=>{
 for(const value of [null,'','zh','zh-CN','EN','__proto__',{},'fr'])assert.equal(readLanguage(()=>({getItem:()=>value})),'zh-Hans');
 assert.equal(readLanguage(()=>{throw Error('denied')}),'zh-Hans');
 for(const lang of Object.keys(languages))assert.equal(readLanguage(()=>({getItem:()=>lang})),lang);
 const writes=[];chooseLanguage('ja',()=>({setItem:(...args)=>writes.push(args)}));assert.deepEqual(writes,[[LANGUAGE_KEY,'ja']]);
 assert.equal(chooseLanguage('invalid',()=>{throw Error('denied')}),'zh-Hans');
});
test('UI literals have all translations, metadata uses HOME',async()=>{
 const source=await readFile(new URL('../dist/app.js',import.meta.url),'utf8');
 for(const match of source.matchAll(/'([^'\n]*[\u3400-\u9fff][^'\n]*)'/gu)){
  if(/[{};=]/u.test(match[1]))continue;
  const text=match[1].replaceAll('\\n','\n');for(const lang of Object.keys(languages))assert.ok(catalog[lang][text],lang+': '+text);
 }
 const html=await readFile(new URL('../dist/index.html',import.meta.url),'utf8');assert.ok(!/脑内小屋|你的家.*品牌/.test(html));assert.match(html,/<title>HOME/);assert.match(html,/og:title/);
});
test('poster wrapping preserves English words and CJK punctuation at readable size',()=>{
 for(const lang of Object.keys(languages))for(const r of Object.values(rooms))for(const source of [r.name,r.quote,r.tags.map(v=>tr(v,{},lang)).join(' / '),...r.plaques]){
  const text=tr(source,{},lang),measure=s=>[...s].reduce((n,c)=>n+(/[\u3000-\u9fff]/u.test(c)?30:16),0);
  const lines=wrapLines(text,measure,860,lang);assert.ok(lines.length);assert.equal(lines.join('').replaceAll(' ',''),text.replaceAll(' ',''));assert.ok(lines.every(l=>measure(l)<=860));if(lang==='ja')assert.ok(lines.every(l=>!/^([、。，．！？：；）」』】〕〉》])/u.test(l)),text);
 }
});
test('empty containers keep their child option labels during translation refresh',async()=>{
 const {setText,refreshTranslations}=await import('../dist/i18n.js');
 const container={isConnected:true,textContent:''};setText(container,'');container.textContent='A · option label';refreshTranslations();assert.equal(container.textContent,'A · option label');
});
