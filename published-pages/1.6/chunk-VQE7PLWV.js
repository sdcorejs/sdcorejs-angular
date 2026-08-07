import{Aa as y,Bd as g,Oa as p,ca as f,fd as m,ia as a,mb as b}from"./chunk-WE6GBFWX.js";import{i as h}from"./chunk-J3S4UFG7.js";var r,d="data-sd-loading-styles",v=`
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
`,w=Object.freeze({closed:!0,close(){}}),c=class u{static documentRecords=new WeakMap;#t;#o;#s;#f=a(y);#e=[];#n=!1;#i=!1;constructor(){this.#t=a(m),this.#s=g(a(p));let t=a(b);this.#o=this.#s?t.createRenderer(null,null):null,this.#f.onDestroy(()=>this.#A())}start=(t="body")=>{let e=this.#o;if(this.#i||!this.#s||!e)return w;let s=Array.from(this.#t.querySelectorAll(t));if(s.length===0)return w;let i=this.#y();this.#w(i,e);let o={selector:t,contributions:[],closed:!1};for(let n of s){let l={host:n,owner:o,service:this,released:!1};o.contributions.push(l),this.#p(i,l,e)}return this.#e.push(o),{get closed(){return o.closed},close:()=>this.#r(o,e)}};isLoading=(t="body")=>{if(this.#i||!this.#s)return null;let e=this.#t.querySelectorAll(t);if(e.length===0)return null;let s=r.documentRecords.get(this.#t);for(let i of Array.from(e)){let o=s?.hostStates.get(i);if(o&&o.count>0&&o.overlay.parentNode===i)return i}return!1};stop=(t="body")=>{let e=this.#o;if(this.#i||!this.#s||!e)return;let s=this.#e.find(o=>!o.closed&&o.selector===t);if(s){this.#r(s,e);return}let i=r.documentRecords.get(this.#t);if(i)for(let o of Array.from(this.#t.querySelectorAll(t))){let n=i.hostStates.get(o)?.contributions.find(l=>!l.released&&l.service===this);n&&this.#l(i,n,e)}};run(t,e="body"){return h(this,null,function*(){let s=this.start(e);try{return yield typeof t=="function"?t():t}finally{s.close()}})}#y(){let t=r.documentRecords.get(this.#t);return t||(t={hostStates:new WeakMap,liveHosts:new Set,style:void 0},r.documentRecords.set(this.#t,t)),t}#p(t,e,s){let i=e.host,o=t.hostStates.get(i);if(o){this.#b(i,o,s),o.count+=1,o.contributions.push(e);return}let n={overlay:this.#v(s),previousAriaBusy:i.getAttribute("aria-busy"),contributions:[e],count:1};s.setAttribute(i,"aria-busy","true"),s.appendChild(i,n.overlay),t.hostStates.set(i,n),t.liveHosts.add(i)}#b(t,e,s){let i=e.overlay.parentNode;i!==t&&(i&&s.removeChild(i,e.overlay),s.appendChild(t,e.overlay)),t.getAttribute("aria-busy")!=="true"&&s.setAttribute(t,"aria-busy","true")}#l(t,e,s){if(e.released)return;e.released=!0;let i=t.hostStates.get(e.host);if(i){let o=i.contributions.indexOf(e);o>=0&&i.contributions.splice(o,1),i.count-=1,i.count<=0&&this.#m(t,e.host,i,s)}e.service.#g(e.owner)}#m(t,e,s,i){let o=s.overlay.parentNode;o&&i.removeChild(o,s.overlay),e.getAttribute("aria-busy")==="true"&&(s.previousAriaBusy===null?i.removeAttribute(e,"aria-busy"):i.setAttribute(e,"aria-busy",s.previousAriaBusy)),t.hostStates.delete(e),t.liveHosts.delete(e),this.#h(t)}#r(t,e){if(t.closed)return;t.closed=!0,this.#a(t);let s=r.documentRecords.get(this.#t);if(s)for(let i of[...t.contributions])this.#l(s,i,e);else for(let i of t.contributions)i.released=!0;t.contributions.length=0}#g(t){t.closed||t.contributions.some(e=>!e.released)||(t.closed=!0,this.#a(t),t.contributions.length=0)}#a(t){let e=this.#e.indexOf(t);e>=0&&this.#e.splice(e,1)}#v(t){let e=t.createElement("div"),s=t.createElement("div");return t.addClass(e,"sd-loading"),t.setAttribute(e,"role","status"),t.setAttribute(e,"aria-live","polite"),t.setAttribute(e,"aria-label","Loading"),t.addClass(s,"sd-loading-spinner"),t.setAttribute(s,"aria-hidden","true"),t.appendChild(e,s),e}#w(t,e){let s=t.style;if(s&&!this.#x(s.element)){let i=s.owners;this.#c(s,e),s=this.#u(e,i),t.style=s}else s?this.#d(s,e):(s=this.#u(e,new Set),t.style=s);s.owners.add(this),this.#n=!0}#x(t){return t.isConnected&&t.parentNode===this.#t.head&&t.hasAttribute(d)}#u(t,e){let s=this.#t.head.querySelector(`style[${d}]`);if(s){let n={element:s,libraryOwned:!1,owners:e,ownedText:null};return this.#d(n,t),n}let i=t.createElement("style"),o=t.createText(v);return t.setAttribute(i,d,""),t.appendChild(i,o),t.appendChild(this.#t.head,i),{element:i,libraryOwned:!0,owners:e,ownedText:o}}#d(t,e){let s=t.element.textContent??"";s.includes(".sd-loading {")&&s.includes(".sd-loading-spinner")&&s.includes("@keyframes sd-loading-spin")||(t.ownedText&&t.ownedText.parentNode!==t.element&&(t.ownedText=null),t.ownedText||(t.ownedText=e.createText(v),e.appendChild(t.element,t.ownedText)))}#c(t,e){if(t.libraryOwned){let s=t.element.parentNode;s&&e.removeChild(s,t.element)}else if(t.ownedText){let s=t.ownedText.parentNode;s&&e.removeChild(s,t.ownedText)}t.ownedText=null}#A(){if(this.#i)return;this.#i=!0;let t=this.#o;if(t){for(let e of[...this.#e])this.#r(e,t);this.#S(t)}else{for(let e of this.#e)e.closed=!0,e.contributions.length=0;this.#e.length=0}}#S(t){if(!this.#n)return;this.#n=!1;let e=r.documentRecords.get(this.#t),s=e?.style;!e||!s||(s.owners.delete(this),s.owners.size===0&&(this.#c(s,t),e.style=void 0),this.#h(e))}#h(t){t.liveHosts.size===0&&!t.style&&r.documentRecords.delete(this.#t)}static \u0275fac=function(e){return new(e||u)};static \u0275prov=f({token:u,factory:u.\u0275fac,providedIn:"root"})};r=c;export{c as a};
