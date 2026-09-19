import test, { before, after } from 'node:test';
import assert from 'node:assert/strict';
import { createServer } from 'node:http';
import type { Server } from 'node:http';
import { chromium } from 'playwright-core';
import type { Browser } from 'playwright-core';
import { installInjector } from '../src/injector.js';
import { runSuite } from '../src/runner.js';
import { check } from '../src/assertions.js';
import type { Mutation, Suite } from '../src/types.js';

let browser: Browser, server: Server, baseURL: string;
const html = `<!doctype html><html><body><button id="button" aria-label="Save record">Save</button><p id="status">Not saved</p><p id="price">49</p><p id="other">Visible</p><img id="image" src="/image.svg" alt="Demo"><script>document.getElementById('button').onclick=()=>{document.getElementById('status').textContent='Saved'};</script></body></html>`;
before(async () => {
  server = createServer((req,res)=>{
    const path = new URL(req.url??'/', 'http://localhost').pathname;
    if(path==='/image.svg'){res.writeHead(200,{'Content-Type':'image/svg+xml'});res.end('<svg xmlns="http://www.w3.org/2000/svg" width="20" height="20"><rect width="20" height="20"/></svg>');return;}
    if(path==='/api'){res.writeHead(200,{'Content-Type':'application/json'});res.end('{"total":49}');return;}
    res.writeHead(200,{'Content-Type':'text/html'});res.end(html);
  });
  await new Promise<void>(resolve=>server.listen(0,'127.0.0.1',resolve));
  const a=server.address();if(!a||typeof a==='string')throw Error('server failed');baseURL=`http://127.0.0.1:${a.port}`;
  const executablePath=process.env['FALSE_GREEN_CHROMIUM_PATH'];
  browser=await chromium.launch({headless:true,...(executablePath?{executablePath}:{})});
});
after(async()=>{await browser?.close();await new Promise<void>((resolve,reject)=>{server?.closeAllConnections();server?.close(e=>e?reject(e):resolve());});});
async function injected(m:Mutation|null, fn:(page:import('playwright-core').Page,e:Awaited<ReturnType<typeof installInjector>>)=>Promise<void>){
  const context=await browser.newContext({serviceWorkers:'block'});
  try{const e=await installInjector(context,m,[baseURL]);const page=await context.newPage();await page.goto(baseURL);await fn(page,e);}finally{await context.close();}
}
const click:Mutation={id:'click',title:'Click',kind:'block-click',selector:'#button'};
test('healthy control really changes the UI',async()=>injected(null,async(page,e)=>{await page.locator('#button').click();assert.equal(await page.locator('#status').textContent(),'Saved');assert.equal(e.hits,0);}));
test('click fault suppresses the real handler and records a hit',async()=>injected(click,async(page,e)=>{await page.locator('#button').click();assert.equal(await page.locator('#status').textContent(),'Not saved');assert.equal(e.hits,1);}));
test('a nonexistent click selector does not fabricate evidence',async()=>injected({...click,selector:'#missing'},async(page,e)=>{await page.locator('#button').click();assert.equal(e.hits,0);assert.equal(await page.locator('#status').textContent(),'Saved');}));
test('replace-text changes a real DOM node',async()=>injected({id:'text',title:'Text',kind:'replace-text',selector:'#price',value:'0'},async(page,e)=>{assert.equal(await page.locator('#price').textContent(),'0');assert.ok(e.hits>0);}));
test('equivalent text replacement is not a hit',async()=>injected({id:'text',title:'Text',kind:'replace-text',selector:'#price',value:'49'},async(page,e)=>{await page.evaluate(()=>true);assert.equal(e.hits,0);}));
test('DOM faults also apply to dynamically inserted nodes',async()=>injected({id:'text',title:'Text',kind:'replace-text',selector:'#dynamic',value:'broken'},async(page,e)=>{await page.evaluate(()=>{const p=document.createElement('p');p.id='dynamic';p.textContent='healthy';document.body.append(p);});assert.equal(await page.locator('#dynamic').textContent(),'broken');assert.ok(e.hits>0);}));
test('hide-element preserves existence but removes visibility',async()=>injected({id:'hide',title:'Hide',kind:'hide-element',selector:'#other'},async(page,e)=>{assert.equal(await page.locator('#other').count(),1);assert.equal(await page.locator('#other').isVisible(),false);assert.ok(e.hits>0);}));
test('remove-attribute records only an actual removal',async()=>injected({id:'aria',title:'Aria',kind:'remove-attribute',selector:'#button',attribute:'aria-label'},async(page,e)=>{assert.equal(await page.locator('#button').getAttribute('aria-label'),null);assert.ok(e.hits>0);}));
test('invalid CSS selector produces injector error, not a silent pass',async()=>injected({...click,selector:'['},async(page,e)=>{await page.evaluate(()=>true);assert.ok(e.errors.length>0);assert.equal(e.hits,0);}));
test('route-response changes the browser response without changing the server',async()=>injected({id:'api',title:'API',kind:'route-response',path:'/api',status:200,body:'{"total":0}'},async(page,e)=>{assert.equal(await page.evaluate(async()=>(await(await fetch('/api')).json()).total),0);assert.equal(e.hits,1);assert.equal((await(await fetch(baseURL+'/api')).json() as {total:number}).total,49);}));
test('a method mismatch does not mutate another request',async()=>injected({id:'api',title:'API',kind:'route-abort',path:'/api',method:'POST'},async(page,e)=>{assert.equal(await page.evaluate(async()=>(await(await fetch('/api')).json()).total),49);assert.equal(e.hits,0);}));
test('route-abort causes a real fetch failure',async()=>injected({id:'api',title:'API',kind:'route-abort',path:'/api'},async(page,e)=>{assert.equal(await page.evaluate(async()=>{try{await fetch('/api');return false;}catch{return true;}}),true);assert.equal(e.hits,1);}));
test('broken image is complete but contains zero decoded pixels',async()=>injected({id:'image',title:'Image',kind:'break-image',path:'/image.svg'},async(page,e)=>{assert.deepEqual(await page.locator('#image').evaluate((img:HTMLImageElement)=>({complete:img.complete,width:img.naturalWidth})),{complete:true,width:0});assert.equal(e.hits,1);}));
test('undeclared browser origins are blocked before requests complete',async()=>injected(null,async(page,e)=>{await page.evaluate(async()=>{try{await fetch('http://127.0.0.1:1/unapproved');}catch{/* expected */}});assert.equal(e.blockedRequests,1);}));
function testSuite(verify:Suite['scenarios'][number]['verify'], overrides:Partial<Suite>={}):Suite{return{name:'integration',baseURL,repetitions:2,timeoutMs:4000,scenarios:[{id:'checkout',title:'Checkout',mutations:[click],exercise:async({page,baseURL})=>{await page.goto(baseURL);await page.locator('#button').click();},verify}],...overrides};}
const options=()=>{const executablePath=process.env['FALSE_GREEN_CHROMIUM_PATH'];return executablePath?{executablePath}:{};};
test('runner reproduces a survivor with clean controls before and after',async()=>{const r=await runSuite(testSuite(async({page})=>{check(await page.locator('#button').count()===1,'exists');}),options());assert.equal(r.summary.exitCode,1);assert.equal(r.scenarios[0]?.mutations[0]?.verdict,'survived');assert.ok(r.scenarios[0]?.baselineValid);});
test('runner detects a broken behavior with the same healthy journey',async()=>{const r=await runSuite(testSuite(async({page})=>{check(await page.locator('#status').textContent()==='Saved','must save');}),options());assert.equal(r.summary.exitCode,0);assert.equal(r.scenarios[0]?.mutations[0]?.verdict,'detected');});
test('broken baseline prevents mutation execution',async()=>{const r=await runSuite(testSuite(async()=>{check(false,'intentionally invalid baseline');}),options());assert.equal(r.summary.exitCode,2);assert.equal(r.scenarios[0]?.mutations[0]?.trials.length,0);assert.equal(r.scenarios[0]?.mutations[0]?.verdict,'baseline-invalid');});
test('post-control failure invalidates an apparently successful campaign',async()=>{let phase='';const s=testSuite(async({page})=>{check(phase!=='after','post control must pass');check(await page.locator('#status').textContent()==='Saved','save');},{reset:async(c)=>{phase=c.phase;}});const r=await runSuite(s,options());assert.equal(r.summary.exitCode,2);assert.equal(r.scenarios[0]?.mutations[0]?.verdict,'baseline-invalid');});
test('reset is called for every trial, including four clean controls',async()=>{let resets=0;await runSuite(testSuite(async()=>{}, {reset:async()=>{resets++;}}),options());assert.equal(resets,6);});
test('assertions inside exercise are not credited as verification detections',async()=>{const s=testSuite(async()=>{});s.scenarios[0]!.exercise=async({page,baseURL})=>{await page.goto(baseURL);await page.locator('#button').click();check(await page.locator('#status').textContent()==='Saved','journey asserted');};const r=await runSuite(s,options());assert.equal(r.scenarios[0]?.mutations[0]?.verdict,'inconclusive');assert.equal(r.summary.exitCode,2);});
