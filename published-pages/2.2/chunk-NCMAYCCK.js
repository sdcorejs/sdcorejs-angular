import{Aa as f,Ed as b,Oa as y,ca as h,ia as l,id as p}from"./chunk-DGX3XXVR.js";import{i as c}from"./chunk-J3S4UFG7.js";var n,a="data-sd-loading-styles",m=`
.sd-loading {
  position: absolute;
  inset: 0;
  width: 100%;
  height: 100%;
  opacity: 0.6;
  background: #fff;
  z-index: 99999;
}

.sd-loading-spinner {
  position: absolute;
  top: calc(50% - 2.5rem);
  left: calc(50% - 2.5rem);
  width: 5rem;
  height: 5rem;
  border: 0.5rem solid var(--sd-primary);
  border-top-color: var(--sd-border);
  border-radius: 50%;
  animation: sd-loading-spin 1s linear infinite;
}

@keyframes sd-loading-spin {
  from { transform: rotate(0deg); }
  to { transform: rotate(360deg); }
}
`,g=Object.freeze({closed:!0,close(){}}),u=class d{static documentRecords=new WeakMap;#e;#s;#h=l(f);#t=[];#r=!1;#i=!1;constructor(){this.#e=l(p),this.#s=b(l(y)),this.#h.onDestroy(()=>this.#A())}start=(e="body")=>{if(this.#i||!this.#s)return g;let t=Array.from(this.#e.querySelectorAll(e));if(t.length===0)return g;let s=this.#f();this.#v(s);let i={selector:e,contributions:[],closed:!1};for(let r of t){let o={host:r,owner:i,service:this,released:!1};i.contributions.push(o),this.#y(s,o)}return this.#t.push(i),{get closed(){return i.closed},close:()=>this.#n(i)}};isLoading=(e="body")=>{if(this.#i||!this.#s)return null;let t=this.#e.querySelectorAll(e);if(t.length===0)return null;let s=n.documentRecords.get(this.#e);for(let i of Array.from(t)){let r=s?.hostStates.get(i);if(r&&r.count>0&&r.overlay.parentNode===i)return i}return!1};stop=(e="body")=>{if(this.#i||!this.#s)return;let t=this.#t.find(i=>!i.closed&&i.selector===e);if(t){this.#n(t);return}let s=n.documentRecords.get(this.#e);if(s)for(let i of Array.from(this.#e.querySelectorAll(e))){let r=s.hostStates.get(i)?.contributions.find(o=>!o.released&&o.service===this);r&&this.#o(s,r)}};run(e,t="body"){return c(this,null,function*(){let s=this.start(t);try{return yield typeof e=="function"?e():e}finally{s.close()}})}#f(){let e=n.documentRecords.get(this.#e);return e||(e={hostStates:new WeakMap,liveHosts:new Set,style:void 0},n.documentRecords.set(this.#e,e)),e}#y(e,t){let s=t.host,i=e.hostStates.get(s);if(i){this.#p(s,i),i.count+=1,i.contributions.push(t);return}let r={overlay:this.#g(),previousAriaBusy:s.getAttribute("aria-busy"),contributions:[t],count:1};s.setAttribute("aria-busy","true"),s.appendChild(r.overlay),e.hostStates.set(s,r),e.liveHosts.add(s)}#p(e,t){t.overlay.parentNode!==e&&e.appendChild(t.overlay),e.getAttribute("aria-busy")!=="true"&&e.setAttribute("aria-busy","true")}#o(e,t){if(t.released)return;t.released=!0;let s=e.hostStates.get(t.host);if(s){let i=s.contributions.indexOf(t);i>=0&&s.contributions.splice(i,1),s.count-=1,s.count<=0&&this.#b(e,t.host,s)}t.service.#m(t.owner)}#b(e,t,s){s.overlay.remove(),t.getAttribute("aria-busy")==="true"&&(s.previousAriaBusy===null?t.removeAttribute("aria-busy"):t.setAttribute("aria-busy",s.previousAriaBusy)),e.hostStates.delete(t),e.liveHosts.delete(t),this.#c(e)}#n(e){if(e.closed)return;e.closed=!0,this.#l(e);let t=n.documentRecords.get(this.#e);if(t)for(let s of[...e.contributions])this.#o(t,s);else for(let s of e.contributions)s.released=!0;e.contributions.length=0}#m(e){e.closed||e.contributions.some(t=>!t.released)||(e.closed=!0,this.#l(e),e.contributions.length=0)}#l(e){let t=this.#t.indexOf(e);t>=0&&this.#t.splice(t,1)}#g(){let e=this.#e.createElement("div"),t=this.#e.createElement("div");return e.classList.add("sd-loading"),e.setAttribute("role","status"),e.setAttribute("aria-live","polite"),e.setAttribute("aria-label","Loading"),t.classList.add("sd-loading-spinner"),t.setAttribute("aria-hidden","true"),e.appendChild(t),e}#v(e){let t=e.style;if(t&&!this.#w(t.element)){let s=t.owners;this.#u(t),t=this.#d(s),e.style=t}else t?this.#a(t):(t=this.#d(new Set),e.style=t);t.owners.add(this),this.#r=!0}#w(e){return e.isConnected&&e.parentNode===this.#e.head&&e.hasAttribute(a)}#d(e){let t=this.#e.head.querySelector(`style[${a}]`);if(t){let r={element:t,libraryOwned:!1,owners:e,ownedText:null};return this.#a(r),r}let s=this.#e.createElement("style"),i=this.#e.createTextNode(m);return s.setAttribute(a,""),s.appendChild(i),this.#e.head.appendChild(s),{element:s,libraryOwned:!0,owners:e,ownedText:i}}#a(e){let t=e.element.textContent??"";t.includes(".sd-loading {")&&t.includes(".sd-loading-spinner")&&t.includes("@keyframes sd-loading-spin")||(e.ownedText&&e.ownedText.parentNode!==e.element&&(e.ownedText=null),e.ownedText||(e.ownedText=this.#e.createTextNode(m),e.element.appendChild(e.ownedText)))}#u(e){e.libraryOwned?e.element.remove():e.ownedText?.remove(),e.ownedText=null}#A(){if(!this.#i){if(this.#i=!0,this.#s){for(let e of[...this.#t])this.#n(e);this.#S();return}for(let e of this.#t)e.closed=!0,e.contributions.length=0;this.#t.length=0}}#S(){if(!this.#r)return;this.#r=!1;let e=n.documentRecords.get(this.#e),t=e?.style;!e||!t||(t.owners.delete(this),t.owners.size===0&&(this.#u(t),e.style=void 0),this.#c(e))}#c(e){e.liveHosts.size===0&&!e.style&&n.documentRecords.delete(this.#e)}static \u0275fac=function(t){return new(t||d)};static \u0275prov=h({token:d,factory:d.\u0275fac,providedIn:"root"})};n=u;export{u as a};
