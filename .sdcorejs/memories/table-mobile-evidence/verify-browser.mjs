const { chromium } = await import(process.env.SD_PLAYWRIGHT_MODULE ?? 'playwright');
import assert from 'node:assert/strict';
import { readFileSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
const output=dirname(fileURLToPath(import.meta.url));
const browser=await chromium.launch({headless:true,channel:'chrome'});
const errors=[];const evidence=[];
async function scenario(width,theme){
 const page=await browser.newPage({viewport:{width,height:960}});
 page.on('pageerror',e=>errors.push(e.message));
 await page.goto('http://127.0.0.1:4300/v/22.2.5/components/table/examples',{waitUntil:'networkidle'});
 await page.addScriptTag({path:join(output,'../../../versions/v19/node_modules/axe-core/axe.min.js')});
 if(theme==='dark'){
  await page.addStyleTag({content:readFileSync(join(output,'dark-theme.css'),'utf8')});
  await page.locator('html').evaluate(el=>el.classList.add('sd-mobile-review-dark'));
 }
 const example=page.locator('#components-table-example-the-mobile-va-thao-tac');
 await example.scrollIntoViewIfNeeded();await example.getByRole('button',{name:'Expand live example',exact:true}).click();
 const table=example.locator('sd-table').first();const cards=table.locator('.sd-mobile-card');
 const shot=async state=>{await page.mouse.move(0,0);await table.locator('.c-table').evaluate(el=>el.scrollTop=0);await page.waitForTimeout(350);await table.screenshot({path:join(output,`${width}-${theme}-${state}.png`)});};
 const sheetShot=async state=>{await page.mouse.move(0,0);await page.waitForTimeout(350);await page.screenshot({path:join(output,`${width}-${theme}-${state}.png`)});};
 const audit=async target=>{const r=await target.evaluate(el=>globalThis.axe.run(el,{runOnly:['wcag2a','wcag2aa','wcag21aa']}));assert.deepEqual(r.violations.map(v=>({id:v.id,nodes:v.nodes.map(n=>n.target)})),[]);};
 if(width>=768){await table.locator('table.mat-mdc-table').waitFor();assert.equal(await cards.count(),0);await shot('desktop');evidence.push({width,theme,desktop:true});await page.close();return;}
 await cards.first().waitFor();assert.equal(await cards.count(),3);assert.equal(await table.locator('table.mat-mdc-table').count(),0);
 assert.equal(await table.locator('.sd-mobile-select-page,.sd-mobile-toolbar').count(),0);
 const footer=table.locator('.c-paginator');assert.equal(await footer.locator('.c-action button').count(),1);
 const toolLabel=await footer.locator('.sd-mobile-tools-trigger .mdc-button__label').evaluate(el=>{const a=el.querySelector('sd-icon').getBoundingClientRect(),b=el.querySelector('sd-icon + span').getBoundingClientRect();return {vertical:Math.abs(a.y+a.height/2-b.y-b.height/2),gap:b.x-a.x-a.width};});assert.ok(toolLabel.vertical<1&&toolLabel.gap>=5,JSON.stringify(toolLabel));
 const header=await table.locator('.sd-mobile-command-header button').boundingBox();const tableBox=await table.boundingBox();
 assert.ok(Math.abs(header.x+header.width/2-tableBox.x-tableBox.width/2)<2,JSON.stringify({header,tableBox}));
 const dimensions=await table.evaluate(el=>({width:el.clientWidth,scroll:el.scrollWidth}));assert.ok(dimensions.scroll<=dimensions.width+1,JSON.stringify(dimensions));
 const corner=await cards.first().evaluate(el=>{const rect=node=>{const b=node.getBoundingClientRect();return {x:b.x,y:b.y,width:b.width,height:b.height};};const selector=el.querySelector('.sd-mobile-card-selector');return {card:rect(el),selector:rect(selector),glyph:rect(selector.querySelector('.mdc-checkbox__background')),touch:rect(selector.querySelector('.mat-mdc-checkbox-touch-target')),circle:getComputedStyle(selector,'::before').width};});
 assert.equal(corner.glyph.width,14);assert.equal(corner.glyph.height,14);assert.ok(corner.touch.width>=40&&corner.touch.height>=40,JSON.stringify(corner));
 assert.ok(Math.abs(corner.selector.x+corner.selector.width/2-corner.card.x-corner.card.width)<2&&Math.abs(corner.selector.y+corner.selector.height/2-corner.card.y)<2,JSON.stringify(corner));
 const inputs=cards.locator('input[type=checkbox]');assert.equal(await inputs.nth(2).isDisabled(),true);
 await shot('browsing');await audit(table);
 await footer.locator('[data-autoid$="-mobile-tools"]').click();const sheet=page.locator('.sd-table-mobile-sheet-panel');await sheet.waitFor();
 assert.match(await sheet.locator('.sd-modal-title').innerText(),/Công cụ bảng/);
 assert.equal(await sheet.locator('[data-autoid$="-mobile-tool-reload"],[data-autoid$="-mobile-tool-filter"]').count(),2);
 const alignment=await sheet.locator('.sd-mobile-sheet-action').evaluateAll(buttons=>buttons.map(el=>{const a=el.querySelector('sd-icon').getBoundingClientRect(),b=el.querySelector('.sd-mobile-sheet-label').getBoundingClientRect();return {vertical:Math.abs(a.y+a.height/2-b.y-b.height/2),gap:b.x-a.x-a.width};}));
 assert.ok(alignment.every(({vertical,gap})=>vertical<2&&gap>=11),JSON.stringify(alignment));await sheetShot('tools');await audit(page.locator('mat-bottom-sheet-container'));
 await sheet.locator('.sd-modal-close-btn').click();await sheet.waitFor({state:'detached'});
 await cards.first().getByRole('button',{name:'Ghi chú',exact:true}).click();assert.equal(await table.locator('.sd-mobile-actions').count(),0);
 await cards.first().locator('.sd-mobile-card-body strong').click();await sheet.waitFor();
 assert.match(await sheet.locator('.sd-modal-title').innerText(),/Thao tác dòng.*NV-1/);assert.match(await sheet.innerText(),/Hồ sơ/);assert.equal(await page.getByRole('dialog',{name:/Thao tác dòng.*NV-1/}).count(),1);assert.equal(await inputs.first().isChecked(),false);assert.equal(await table.locator('sd-quick-action').count(),0);
 await sheetShot('row-command');await audit(page.locator('mat-bottom-sheet-container'));
 await page.keyboard.press('Escape');await sheet.waitFor({state:'detached'});assert.equal(await inputs.first().isChecked(),false);
 await inputs.first().check();await cards.nth(1).locator('.sd-mobile-card-body strong').click();assert.equal(await inputs.nth(1).isChecked(),true);
 assert.equal(await table.locator('.sd-mobile-command-trigger').count(),0);assert.equal(await table.locator('.sd-mobile-select-page,.sd-mobile-selection-message').count(),0);
 assert.equal((await table.locator('.sd-mobile-selection-count').innerText()).trim(),'2');
 const clearAlignment=await table.locator('.sd-mobile-clear').evaluate(el=>{const a=el.getBoundingClientRect(),b=el.querySelector('sd-icon').getBoundingClientRect();return {x:Math.abs(a.x+a.width/2-b.x-b.width/2),y:Math.abs(a.y+a.height/2-b.y-b.height/2)};});assert.ok(clearAlignment.x<1&&clearAlignment.y<1,JSON.stringify(clearAlignment));
 const moreLabel=await table.locator('.sd-mobile-more .mdc-button__label').evaluate(el=>{const a=el.querySelector('sd-icon').getBoundingClientRect(),b=el.querySelector('sd-icon + span').getBoundingClientRect();return {vertical:Math.abs(a.y+a.height/2-b.y-b.height/2),gap:b.x-a.x-a.width};});assert.ok(moreLabel.vertical<1&&moreLabel.gap>=3,JSON.stringify(moreLabel));
 const bar=await table.locator('.sd-mobile-actions').boundingBox();assert.ok(bar.height<=64,JSON.stringify(bar));await shot('selection');await audit(table);
 await table.locator('.sd-mobile-more').click();await sheet.waitFor();assert.match(await sheet.locator('.sd-modal-title').innerText(),/2/);assert.match(await sheet.innerText(),/Báo cáo/);await sheetShot('more');
 await page.keyboard.press('Escape');await sheet.waitFor({state:'detached'});assert.equal(await inputs.first().isChecked(),true);
 await table.evaluate(el=>el.style.setProperty('--sd-table-mobile-bottom-offset','60px'));await table.locator('.c-table').evaluate(el=>el.scrollTop=el.scrollHeight);await page.waitForTimeout(200);
 const finalCard=await cards.last().boundingBox();const actionBox=await table.locator('.c-quick-action').boundingBox();assert.ok(finalCard.y+finalCard.height<=actionBox.y+1,JSON.stringify({finalCard,actionBox}));await table.evaluate(el=>el.style.removeProperty('--sd-table-mobile-bottom-offset'));
 await page.setViewportSize({width:1440,height:960});await table.locator('table.mat-mdc-table').waitFor();assert.equal(await cards.count(),0);assert.equal(await table.locator('table tbody input[type=checkbox]:checked').count(),2);
 await page.setViewportSize({width,height:960});await cards.first().waitFor();assert.equal(await inputs.first().isChecked(),true);await table.locator('.sd-mobile-clear').click();assert.equal(await table.locator('.sd-mobile-actions').count(),0);
 const last=cards.last();await last.scrollIntoViewIfNeeded();await last.getByRole('button',{name:/Chi tiết|chi tiết/}).click();await last.locator('.sd-mobile-expand').waitFor();assert.match(await last.innerText(),/@company.vn/);
 const paginator=table.locator('mat-paginator');await paginator.scrollIntoViewIfNeeded();assert.ok(await paginator.isVisible());const paginatorTarget=await paginator.locator('.mat-mdc-paginator-navigation-next').boundingBox();assert.ok(paginatorTarget.width>=44&&paginatorTarget.height>=44);
 evidence.push({width,theme,dimensions,corner,bar,header,alignment,clearAlignment,toolLabel,paginatorTarget,checks:['one footer Tools trigger','titled SdModal tools/row sheets','centered command header','14px selector on 24px circle over top-right border; 40px hit area','compact count/actions/clear row <=64px','no mobile page checkbox/message','callback boundaries; selection and resize preservation','grouped bulk overflow sheet','Axe: browsing, selection, tools sheet, row sheet','paginator and final card reachable with 60px bottom offset']});await page.close();
}
try{for(const width of [320,390,1440])for(const theme of ['light','dark'])await scenario(width,theme);assert.deepEqual(errors,[]);writeFileSync(join(output,'browser-results.json'),JSON.stringify({at:new Date().toISOString(),browser:browser.version(),evidence,errors},null,2));console.log(JSON.stringify(evidence,null,2));}finally{await browser.close();}
