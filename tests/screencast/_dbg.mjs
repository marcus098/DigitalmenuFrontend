import { chromium, devices } from '@playwright/test';
const b=await chromium.launch({channel:'msedge'});
const ctx=await b.newContext({...devices['iPhone 14'],browserName:undefined});
const p=await ctx.newPage();
await p.addInitScript(()=>{localStorage.cookieConsent=JSON.stringify({version:1,timestamp:new Date().toISOString(),state:{necessary:true,functional:true,analytics:false,marketing:false}})});
await p.goto('http://localhost:5173/trattoriadamarco/Categories'); await p.waitForTimeout(2000);
const l=p.getByText('Pizze',{exact:true}); console.log(await l.count());
for (let i=0;i<await l.count();i++) console.log(i, await l.nth(i).evaluate(e=>e.outerHTML.slice(0,200)), await l.nth(i).isVisible());
await b.close();
