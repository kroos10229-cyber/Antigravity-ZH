#!/usr/bin/env node
import assert from 'node:assert/strict';
import {buildTranslatorExpression, discoverDevToolsPort, evaluate, getTargets} from '../injector/injector.mjs';
const target=(await getTargets(await discoverDevToolsPort()))[0];
await evaluate(target,await buildTranslatorExpression());
const result=await evaluate(target,`(() => {
 const root=document.createElement('div');
 root.innerHTML='<p>Every command requires approval.</p><div><input placeholder="Search customizations..."></div><code>Delete Project</code><pre>Copy Project Name</pre><textarea>Delete Project</textarea><div contenteditable="true">Delete Project</div><p>Show 32 breakdowns</p><p>Build a stateful multi-turn chat script using the Interactions API and the   latest models</p>';
 window.__ANTIGRAVITY_ZH__.translate(root);
 const message=document.createElement('div');message.dataset.quotable='true';message.textContent='Delete Project';root.append(message);
 const response=document.createElement('div');response.dataset.quotable='true';response.setAttribute('role','article');response.setAttribute('aria-label','Agent response');response.innerHTML='<p>Every command requires approval.</p><button>Copy code</button>';root.append(response);
 const filename=document.createElement('span');filename.textContent='google-cloud-discovery.md';root.append(filename);
 window.__ANTIGRAVITY_ZH__.translate(root);
 const first=root.innerHTML;
 window.__ANTIGRAVITY_ZH__.translate(root);
 return {text:root.querySelector('p').textContent,placeholder:root.querySelector('input').placeholder,code:root.querySelector('code').textContent,pre:root.querySelector('pre').textContent,editable:root.querySelector('[contenteditable]').textContent,textarea:root.querySelector('textarea').textContent,dynamic:root.querySelectorAll('p')[1].textContent,wrapped:root.querySelectorAll('p')[2].textContent,message:message.textContent,response:response.querySelector('p').textContent,control:response.querySelector('button').textContent,filename:filename.textContent,idempotent:first===root.innerHTML,version:window.__ANTIGRAVITY_ZH__.version};
})()`);
assert.match(result.text,/[\u3400-\u9fff]/);
assert.match(result.placeholder,/[\u3400-\u9fff]/);
assert.equal(result.code,'Delete Project');
assert.equal(result.pre,'Copy Project Name');
assert.equal(result.editable,'Delete Project');
assert.equal(result.textarea,'Delete Project');
assert.equal(result.dynamic,'显示 32 项明细');
assert.match(result.wrapped,/[\u3400-\u9fff]/);
assert.equal(result.idempotent,true);
assert.equal(result.message,'Delete Project');
assert.equal(result.response,'Every command requires approval.');
assert.equal(result.control,'复制代码');
assert.equal(result.filename,'google-cloud-discovery.md');
const popup=await evaluate(target,`(() => {const p=document.createElement('p');p.textContent='Failed to save project settings: Demo$1';window.__ANTIGRAVITY_ZH__.translate(p);return p.textContent;})()`);
assert.equal(popup,'保存项目设置失败：Demo$1');
const permission=await evaluate(target,`(() => {
 const d=document.createElement('div');
 const labels=['Allow read access to this path?','Yes, allow this time','Yes, and always allow in this conversation','Yes, and always allow','(tell the agent what to do instead)','Skip','Submit'];
 for(const label of labels){const p=document.createElement('p');p.textContent=label;d.append(p);}
 const path=document.createElement('code');path.textContent='/Users/demo/SKILL.md';d.append(path);
 window.__ANTIGRAVITY_ZH__.translate(d);
 return [...d.children].map(x=>x.textContent);
})()`);
assert.deepEqual(permission,['允许读取此路径吗？','是，仅本次允许','是，在当前对话中始终允许','是，始终允许','（告诉智能体应改为执行什么）','跳过','提交','/Users/demo/SKILL.md']);
console.log(JSON.stringify({passed:22,permission,popup,...result},null,2));
