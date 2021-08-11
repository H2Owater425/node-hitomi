"use strict";var __awaiter=this&&this.__awaiter||function(e,t,n,a){return new(n||(n=Promise))(function(i,r){function o(e){try{s(a.next(e))}catch(e){r(e)}}function l(e){try{s(a.throw(e))}catch(e){r(e)}}function s(e){var t;e.done?i(e.value):(t=e.value,t instanceof n?t:new n(function(e){e(t)})).then(o,l)}s((a=a.apply(e,t||[])).next())})};Object.defineProperty(exports,"__esModule",{value:!0});const https_1=require("https"),tls_1=require("tls"),zlib_1=require("zlib");var hitomi;!function(e){function t(e,t){if(!r(e.startIndex)||r(e.startIndex)&&e.startIndex<0)throw Error("Invalid startIndex value");if(void 0!==e.endIndex&&(!r(e.endIndex)||r(e.endIndex)&&e.endIndex<=e.startIndex))throw Error("Invalid endIndex value");return new Promise(function(n,a){const i=4*e.startIndex,r=void 0!==e.endIndex?i+4*(e.endIndex+1)-1:"",o=void 0!==t&&void 0!==t.orderBy?t.orderBy:"index",h=void 0!==t&&void 0!==t.reverseResult&&t.reverseResult;l(`https://ltn.hitomi.la/${o}-all.nozomi`,{Range:`bytes=${i}-${r}`}).then(function(e){const t=s(e),a=new DataView(t),i=a.byteLength/4;let r=[];if(h)for(let e=0;e<i;e++)r.push(a.getInt32(4*e,!1));else for(let e=i-1;-1!==e;e--)r.push(a.getInt32(4*e,!1));n(r)})})}function n(e){const t=encodeURIComponent(null!==e.title.japanese?e.title.japanese:e.title.display).replace(/\(|\)|'|%(2(0|2|3|5|F)|3(C|E|F)|5(B|D)|7(B|D))/g,"-"),n=null!==e.languageName.local?`-${encodeURIComponent(e.languageName.local)}`:"";return`https://hitomi.la/${e.type}/${t}${n}-${e.id}.html`.toLocaleLowerCase()}function a(e,t){if("language"!==e.type&&void 0!==t&&(t.orderBy,1))throw Error(`Invalid order criteria for ${e.type} tag type`);{const n=void 0!==t&&void 0!==t.orderBy?t.orderBy:"index";let a="",i="",r="all";switch(e.type){case"male":case"female":a="tag/",i=`${e.type}:${e.name.replace(/_/g," ")}`;break;case"language":i=n,r=e.name;break;default:a=`${e.type}/`,i=e.name.replace(/_/g," ")}return`https://ltn.hitomi.la/n/${a}${i}-${r}.nozomi`}}function i(e,t){let n="";switch(e){case"tag":case"male":case"female":n="https://hitomi.la/alltags-";break;case"artist":n="https://hitomi.la/allartists-";break;case"series":n="https://hitomi.la/allseries-";break;case"character":n="https://hitomi.la/allcharacters-";break;case"group":n="https://hitomi.la/allgroups-";break;case"language":n="https://ltn.hitomi.la/language_support.js"}return"language"===e?n:"male"===e?`${n}m.html`:"female"===e?`${n}f.html`:`${n}${t}.html`}function r(e){return!(Number.parseInt(e)!==Number(e)||!Number.isFinite(e)||"object"==typeof e)}e.getGalleryData=function(e,t){if(!r(e)||r(e)&&e<1)throw Error("Invalid id value");{const a=void 0===t||void 0===t.includeFiles||t.includeFiles,i=void 0===t||void 0===t.includeFullData||t.includeFullData;return new Promise(function(t,r){l(`https://ltn.hitomi.la/galleries/${e}.js`).then(function(e){return h(e)}).then(function(e){const r=JSON.parse(e.toString("utf8").slice(18));let o={id:r.id,title:{display:r.title,japanese:r.japanese_title},type:r.type,languageName:{english:r.language,local:r.language_localname},artistList:[],groupList:[],seriesList:[],characterList:[],tagList:[],fileList:[],publishedDate:new Date(`${r.date}:00`.replace(" ","T"))};if(null!==r.tags)for(let e=0;e<r.tags.length;e++){let t="tag";Boolean(r.tags[e].male)?t="male":Boolean(r.tags[e].female)&&(t="female"),o.tagList.push({name:r.tags[e].tag,type:t})}if(a)for(let e=0;e<r.files.length;e++)o.fileList.push({index:e,hash:r.files[e].hash,extension:r.files[e].name.split(".").pop(),hasAvif:Boolean(r.files[e].hasavif),hasWebp:Boolean(r.files[e].haswebp),width:r.files[e].width,height:r.files[e].height});i?l(n(o)).then(function(e){return h(e)}).then(function(e){const n=e.toString("utf8").split('content">')[1];void 0!==n&&["artist","group","series","character"].forEach(function(e,t,a){var i;null===(i=n.match(RegExp(`(?<=/${e}/)[a-z0-9%]+(?=-all\\.html)`,"g")))||void 0===i||i.forEach((t,n,a)=>o[`${e}List`].push(decodeURIComponent(t)))}),t(o)}):t(o)})})}},e.getGalleryIdList=t,e.parseTag=function(e){const t=e.split(" ");if(t.length<1)throw Error("Lack of tag");{let e=[...t].map(function(e,t,n){const a=e.replace(/^-/,"").split(":"),[i,r]=[...a];if(2===a.length&&void 0!==i&&void 0!==r&&""!==i&&""!==r&&/^(artist|group|type|language|series|tag|male|female)$/.test(i)&&/^[^-_\.][a-z0-9-_.]+$/.test(r))return`${i}:${r}`;throw Error("Invalid tag")});for(let t=0;t<e.length;t++){const n=e[t];if(e.splice(t,1),-1!==e.indexOf(n))throw Error("Duplicated tag")}let n=[];for(let e=0;e<t.length;e++){const[a,i]=t[e].replace(/^-/,"").split(":");n.push({type:a,name:i,isNegative:t[e].startsWith("-")})}return n}},e.queryTag=function(e){return new Promise(function(n,i){if(e.length<1)throw Error("Lack of tag");{let[i,r]=[[],[]];for(let t=0;t<e.length;t++)switch(void 0!==e[t].isNegative&&e[t].isNegative){case!1:i.push(e[t]);break;case!0:r.push(e[t])}new Promise(function(e,n){return 0===i.length?void t({startIndex:0}).then(t=>e(t)):void e([])}).then(function(e){return __awaiter(this,void 0,void 0,function*(){let t=e;for(let e=0;e<i.length;e++)yield l(a(i[e])).then(function(n){const a=s(n),i=new DataView(a),r=i.byteLength/4;let o=[];for(let e=0;e<r;e++)o.push(i.getInt32(4*e,!1));let l=new Set(o);t=0!==e?t.filter(function(e,t,n){return!!l.has(e)}):[...o]});for(let e=0;e<r.length;e++)yield l(a(r[e])).then(function(e){const n=s(e),a=new DataView(n),i=a.byteLength/4;let r=[];for(let e=0;e<i;e++)r.push(a.getInt32(4*e,!1));let o=new Set(r);t=t.filter(function(e,t,n){return!o.has(e)})});n(t)})})}})},e.getTagList=function(e,t){return new Promise(function(n,a){if("language"!==e&&"type"!==e&&void 0===t||("language"===e||"type"===e)&&void 0!==t)throw Error("Invalid startingCharacter");"type"===e?n([{type:"type",name:"doujinshi"},{type:"type",name:"manga"},{type:"type",name:"artistcg"},{type:"type",name:"gamecg"},{type:"type",name:"anime"}]):l(i(e,t)).then(function(e){return h(e)}).then(function(a){let i="";i="language"===e?'(?<=")(?!all)[a-z]+(?=":)':`(?<=/tag/${"male"===e||"female"===e?e+"%3A":""})[a-z0-9%]+(?=-all\\.html)`;const r=a.toString("utf8").match(RegExp(i,"g"))||[],o=RegExp(`^(?=[${"123"!==t?t:"0-9"}])[a-z0-9%]+$`);let l=[];for(let t=0;t<r.length;t++){const n=decodeURIComponent(r[t]);("male"!==e&&"female"!==e||r[t].match(o))&&l.push({type:e,name:n})}n(l)})})},e.getImageUrl=function(e,t,n){const a=void 0!==n&&void 0!==n.isThumbnail&&n.isThumbnail;switch(t){case"jpg":if(a||"jpg"===e.extension)break;throw Error("Invalid extension");case"png":if("png"!==e.extension)throw Error("Invalid extension");if(a)throw Error("Invalid extension for thumbnail");break;case"avif":if(e.hasAvif)break;throw Error("Invalid extension");case"webp":if(e.hasWebp){if(a)throw Error("Invalid extension for thumbnail");break}throw Error("Invalid extension")}if(/^[0-9a-f]{64}$/.test(e.hash)){if(!r(e.index)||e.index<0)throw Error("Invalid image index");if(a&&0!==e.index)throw Error("Invalid index for thumbnail");{const n=`${e.hash.slice(-1)}/${e.hash.slice(-3,-1)}/${e.hash}`;let i="",r="";if(a)i="tn",r="jpg"===t||"png"===t?"bigtn":"avifbigtn";else{let n=Number.parseInt(e.hash.slice(-3,-1),16),a=0;n<64?a=2:n<128&&(a=1),i=`${String.fromCharCode(a+97)}`,"jpg"===t||"png"===t?(i+="b",r="images"):(i+="a",r=`${t}`)}return`https://${i}.hitomi.la/${r}/${n}.${t}`}}throw Error("Invalid hash value")},e.getGalleryUrl=n,e.getNozomiUrl=a,e.getTagUrl=i;const o=new class extends https_1.Agent{createConnection(e,t){return e.servername=void 0,tls_1.connect(e,t)}}({rejectUnauthorized:!1,keepAlive:!0});function l(e,t){return new Promise(function(n,a){const i=new URL(e);https_1.request({hostname:i.hostname,path:i.pathname,method:"GET",port:443,headers:Object.assign({Accept:"*/*","Accept-Encoding":"gzip",Connection:"keep-alive"},t),agent:o},function(e){let t=[],i=0;e.on("data",function(e){t.push(e),i+=e.byteLength}),e.on("error",function(e){a(e)}),e.on("end",function(){n(Buffer.concat(t,i))})}).end()})}function s(e){let t=new ArrayBuffer(e.byteLength),n=new Uint8Array(t);for(let t=0;t<e.byteLength;++t)n[t]=e[t];return t}function h(e){return new Promise(function(t,n){zlib_1.unzip(e,function(e,a){return null!==e?void n(e):void t(a)})})}}(hitomi||(hitomi={})),exports.default=hitomi;