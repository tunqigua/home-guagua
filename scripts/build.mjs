import { readFile, access } from 'node:fs/promises';
import { rooms, questions } from '../dist/data.js';
import { execFileSync } from 'node:child_process';
for (const file of ['index.html','style.css','app.js','logic.js','data.js','card.js','config.js','scene.js','storage.js','i18n.js','locales.js',...['home',...Object.keys(rooms)].map(t=>`assets/${t}.svg`)]) await access(new URL('../dist/'+file,import.meta.url));
for (const file of ['app','logic','data','card','config','scene','storage','i18n','locales']) execFileSync(process.execPath,['--check',new URL('../dist/'+file+'.js',import.meta.url).pathname]);
if(questions.length!==8 || Object.keys(rooms).length!==8) throw new Error('内容不完整');
console.log('静态生产资源验证通过：dist/ 可直接部署，无需安装依赖。');
