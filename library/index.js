"use strict";Object.defineProperty(exports,"__esModule",{value:!0});const https_1=require("https"),tls_1=require("tls");var hitomi;!function(e){const t=/^(0|1(0(0[03-57-9]?|1[0-368]|2[246]?|3[03-469]?|4[0-15-69]|5[0-17-9]|6[157-8]|7[2-47-8]|8[2-36-79]?|9[0-1])|1(0[1-2579]?|1[2-46-79]|2[149]|3[2-47-8]?|4[02-35-68-9]?|5[3-4]|6[0-13-9]|7[05-8]|8[0-35-6]?|9[2-379])?|2(0[24-7]|1[4-5]|2[2-37]?|3[2-357-8]?|4[0-27]?|5[0-13-4]?|6[03-46]|7[0-13-57]?|8[03-57]?|96?)|3(0[024-68-9]?|1[0468-9]?|2[358]|3[0268-9]|4[0-135-7]?|5[1468]?|6[08-9]?|7[0-136-8]?|8[024-57-9]?|9[068-9]?)|4(0[139]?|1[02-35-7]|2[03-46-9]|3[0368]?|4[1-36]|5[0-35-69]|6[02-59]|7[1-37-8]?|8[0-47-8]?|9[0-13-46-7])|5(0[03-69]?|1[03-9]?|2[0368]?|3[0-468-9]|4[02-369]?|5[1-246-8]?|6[14-58-9]|7[3-59]|8[2-5]?|9[0468-9]?)|6(0[0-1368-9]?|1[02-49]?|2[48]|3[1-579]?|4[03-468-9]?|5[1357-9]?|6[1359]?|7[3-4]|8[29]|9[3-79]?)?|7(0[0-24-57-8]|1[05-69]|2[25-68-9]|3[146-9]|4[3-8]|5[0-13-49]?|6[047-9]|7[24-58-9]|8[024-58-9]?|9[19])?|8(0[029]?|1[0-157]?|2[2-39]?|3[0357]?|4[2-359]|5[024-58]?|6[026]|7[14]?|83?|9[0-369])?|9(0[0-13-5]|1[0-368-9]?|2[3-46]?|3[1-358]?|4[13-49]?|5[1-24-79]?|6[26]?|7[1-37]|8[79]|9[1369]?)?)?|2(0(0[13-68-9]|1[1-47]|2[02-46-9]?|3[2-46-9]?|4[47-8]|5[0-146-7]?|6[046-79]|7[0-24-57-8]?|8[13-57]|9[02-36-79]?)?|1(0[0-158]|1[268-9]?|2[0-15-9]|3[1468]|4[0-35-79]?|5[0-13-4]?|6[47]|7[02-5]|8[0-26-79]?|9[468]?)?|2(06|1[4-58-9]|2[0-13579]|3[0-24-7]?|45|5[1-368-9]?|6[1-2468-9]|7[0-48-9]|8[0-25-68]?|9[2-579])|3(0[036-9]?|1[02468]?|2[0-15-79]|3[0-369]|4[0246-7]|5[02]?|6[0-16-79]?|7[02-35-79]|8[0-35-69]?|94)?|4(0[1-24-59]?|1[1-24-58]|2[13-7]?|3[02-46-79]?|4[0-68-9]|5[4-8]|6[1357-9]|7[0-48]?|8[037]?|9[0-246-8]?)?|5(0[2468]?|1[024-58-9]?|2[1-35-79]?|3[0-26-9]|4[2-357-9]?|5[37]?|6[0-247-9]|7[4-579]?|8[26-7]?|9[1-8]?)|6(0[13-79]|1[1-25-68]|2[057-8]?|3[46-9]|4[136-8]|5[14-57]|6[5-68-9]?|7[46-7]?|8[1-24-59]|9[03-6])?|7(0[0-35-68-9]?|1[079]|2[257-9]?|3[02-3]?|4[1-357-8]|5[2468-9]?|6[04-8]|7[0-17-9]|8[1-57-9]|9[79])|8(0[248-9]?|1[024-57-9]?|2[14]?|3[0-279]?|4[1-24-57-9]|5[02-35-68-9]|6[2-35-69]|7[03-46-8]?|8[0-24]|9[13-4])|9(0[046-8]?|1[0-358-9]|2[13-469]|3[03]?|4[0-27-8]|5[2-368-9]|6[0-13-579]?|7[49]|8[1-68]?|9[04-8]?)?)|3(0(0[0-136-8]|1[0-1468-9]?|2[0-135-9]?|3[13-69]?|4[1368]?|5[0-5]|6[1-24-9]|7[158]?|8[02-46-7]|9[024-6]?)|1(0[2-35-69]?|1[35-7]?|2[0-246-9]?|3[057]|4[024-58]|5[79]?|6[35-9]?|7[0-68-9]|8[0368-9]?|9[04-79]?)|2(0[0-2469]|1[0-358-9]|2[17-8]?|3[1-68-9]|4[13-46-8]|5[1-357-9]|6[14-8]?|7[059]|8[26-9]?|9[15-69])?|3(0[02-357-8]|1[03-69]|2[0269]?|3[0-35-79]?|4[3-57-9]?|5[357-9]?|6[03-46-7]?|7[1-25-68]|8[02-57-9]|9[0-69]?)?|4(0[0-36]?|1[36-9]?|2[02-38-9]|3[24-58]?|4[3-46]?|5[0-148-9]?|6[179]|7[369]|8[0-13-469]|9[02-6]?)|5(0[03-479]|1[13-79]|2[1-246-79]?|3[2-357]|4[1-46-7]|5[02-57-8]|6[02-36-8]?|7[2-59]?|8[03-57-9]|9[036-7])?|6(0[024-79]|16?|2[25-69]|3[2-359]|4[1-24-8]|5[35-6]?|6[2-46-79]?|7[0-14-9]?|8[25-79]|9[0-38]?)?|7(0[0-24-57]|1[0-46-9]?|2[0259]?|3[0-179]?|4[0-38]?|5[1-35-9]?|6[1-357-8]|7[1-468]?|8[46-9]?|9[0-13-46-7])|8(0[2-57-9]?|1[0-15-69]|2[2-46-8]?|3[1-46-8]?|4[0-135-69]|5[35-9]|6[03-468]?|7[0-28]?|8[14-57]?|9[0248])?|9(0[269]?|1[024-59]|2[0-8]?|3[02-57-9]|4[03-69]|5[0-14-579]|6[1-24-58-9]|7[4-69]?|8[1-35-9]?|9[1-2469]?))|4(0(0[2-579]|1[0-468-9]|2[07]?|3[0-1358]|4[026-8]|5[036]?|6[03579]|7[1-246-9]|8[468-9]|9[2-5])?|11|2[1-46]?|3[0-13-59]?|4[35-9]|5[24-7]|6[2-35-68-9]|7[03-579]?|8[0-13-7]?|9[02-468-9]?)?|5(0[0-24-57-8]?|1[37]?|2[1-3]?|3[027]?|4[4-579]|5[0-24-57-9]?|6[02-38-9]?|7[04-79]|8[0-13-58-9]|9[247-9])|6(0[0-24-68]|1[025-68]?|2[4-8]|3[257-8]?|4[02-57-9]?|5[3-69]?|6[1-28-9]|7[0-2479]|8[0-148]?|9[4-5]?)|7(0[025-7]?|1[1-48]|3[1-68-9]|4[1-35-8]?|54|6[4-69]|7[02-46-7]?|8[025-8]|9[25]?)?|8(0[1-46-8]|1[247-9]|2[1-35-9]?|3[3-46-79]?|4[0-2468-9]?|5[16-79]|6[0-14-79]?|7[3-59]|8[1-35-6]|9[1-24-79]?)?|9(0[13-47]?|1[357-8]?|2[0258]|3[0357-9]?|4[026-9]?|5[3-46-8]?|6[0-15-69]?|7[0-24-68]|8[4-57-9]|9[2-7]?))$/,n=["artist","group","series","character"];class a extends Error{constructor(e,...t){super(function(e,...t){switch(e){case"INVALID_VALUE":return"Value of '"+t[0]+"' was not valid";case"DUPLICATED_ELEMENT":return"Element of '"+t[0]+"' was duplicated";case"LACK_OF_ELEMENT":return"Elements of '"+t[0]+"' was not enough";case"REQEUST_REJECTED":return"Request to '"+t[0]+"' was rejected"}}(e,t)),this.code=e}get name(){return"HitomiError ["+this.code+"]"}}class s extends https_1.Agent{createConnection(e,t){return e.servername=void 0,(0,tls_1.connect)(e,t)}}function i(e){return Number.parseInt(e)===Number(e)&&Number.isFinite(e)&&"object"!=typeof e}function r(e,t={}){const n=t.splitBy||4;let a=new ArrayBuffer(e.byteLength),s=new Uint8Array(a);for(let t=0;t<e.byteLength;++t)s[t]=e[t];const i=new DataView(a),r=i.byteLength/n;let o=new Set;for(let e=0;e<r;e++)o.add(i.getInt32(e*n,!1));return o}const o=new s({rejectUnauthorized:!1,keepAlive:!0});function l(e,t){return new Promise((function(n,s){const i=new URL(e);(0,https_1.request)({hostname:i.hostname,path:i.pathname,method:"GET",port:443,headers:Object.assign({},t,{Accept:"*/*",Connection:"keep-alive",Referer:"https://hitomi.la"}),agent:o},(function(t){let i=[],r=0;switch(t.statusCode){case 200:case 206:t.on("data",(function(e){i.push(e),r+=e.byteLength})).on("error",(function(){s(new a("REQEUST_REJECTED",e))})).on("end",(function(){n(Buffer.concat(i,r))}));break;default:s(new a("REQEUST_REJECTED",e))}})).on("error",(function(){s(new a("REQEUST_REJECTED",e))})).end()}))}function c(e,t={}){if("language"!==e.type||void 0===t.orderBy){let n="",a="",s="all";switch(e.type){case"male":case"female":n="tag/",a=e.type+":"+e.name.replace(/_/g," ");break;case"language":a=t.orderBy||"index",s=e.name;break;default:n=e.type+"/",a=e.name.replace(/_/g," ")}return"https://ltn.hitomi.la/n/"+n+a+"-"+s+".nozomi"}throw new a("INVALID_VALUE","options['orderBy']")}function h(e,t={}){if("language"!==e||void 0===t.startWith){let n="https://hitomi.la/";switch(e){case"tag":case"male":case"female":n+="alltags-";break;case"artist":n+="allartists-";break;case"series":n+="allseries-";break;case"character":n+="allcharacters-";break;case"group":n+="allgroups-";break;case"language":n="ltn."+n+"language_support.js";break;default:throw new a("INVALID_VALUE","extension")}if("language"!==e){switch(e){case"male":n+="m";break;case"female":n+="f";break;default:"0-9"===t.startWith?n+="123":n+=t.startWith}return n+".html"}return n}throw new a("INVALID_VALUE","options['startWith']")}function u(e){return("https://hitomi.la/"+("artistcg"!==e.type?e.type:"cg")+"/"+encodeURIComponent(Buffer.from(e.title.japanese||e.title.display).slice(0,200).toString("utf-8")).replace(/\(|\)|'|%(2[0235F]|3[CEF]|5[BD]|7[BD])/g,"-")+(null!==e.languageName.local?"-"+encodeURIComponent(e.languageName.local):"")+"-"+e.id+".html").toLocaleLowerCase()}function g(e,t={}){return new Promise((function(n,s){var o;i(e.startIndex)&&e.startIndex>=0?!i(e.endIndex)||e.endIndex>=e.startIndex?l("https://ltn.hitomi.la/"+(t.orderBy||"index")+"-all.nozomi",{Range:"bytes="+4*e.startIndex+"-"+(4*(null!==(o=e.endIndex)&&void 0!==o?o:NaN)+3||"")}).then((function(e){let a=Array.from(r(e));t.reverseResult?n(a):n(a.reverse())})).catch(s):s(new a("INVALID_VALUE","range['endIndex']")):s(new a("INVALID_VALUE","range['startIndex']"))}))}e.getNozomiUrl=c,e.getTagUrl=h,e.getImageUrl=function(e,n,s={}){const r=s.isThumbnail||!1;switch(n){case"jpg":if("jpg"!==e.extension)throw new a("INVALID_VALUE","extension");break;case"png":case"gif":if(r||e.extension!==n)throw new a("INVALID_VALUE","extension");break;case"webp":if(r||!e.hasWebp)throw new a("INVALID_VALUE","extension");break;case"avif":if(e.hasAvif)break;throw new a("INVALID_VALUE","extension");default:throw new a("INVALID_VALUE","extension")}if(/^[0-9a-f]{64}$/.test(e.hash)){if(i(e.index)&&e.index>=0){let a="",s="",i="";if(r)a=e.hash.slice(-1)+"/"+e.hash.slice(-3,-1)+"/"+e.hash,s="tn",i=("avif"===n?"avif":"")+"bigtn";else{const r=String(Number.parseInt(e.hash.slice(-1)+e.hash.slice(-3,-1),16));a="1641389178/"+r+"/"+e.hash,s=t.test(r)?"a":"b","jpg"===n||"png"===n?(s+="b",i="images"):(s+="a",i=n)}return"https://"+s+".hitomi.la/"+i+"/"+a+"."+n}throw new a("INVALID_VALUE","image['index']")}throw new a("INVALID_VALUE","image['hash']")},e.getVideoUrl=function(e){return"https://streaming.hitomi.la/videos/"+e.title.display.toLowerCase().replace(/\s/g,"-")+".mp4"},e.getGalleryUrl=u,e.getSecondThumbnailIndex=function(e){return Math.ceil((e.files.length-1)/2)},e.getGallery=function(e,t={}){if(i(e)&&e>0)return new Promise((function(a,s){l("https://ltn.hitomi.la/galleries/"+e+".js").then((function(e){var i,r;const o=JSON.parse(e.toString("utf8").slice(18));let c=JSON.parse('{ "id": '+o.id+', "title": { "display": "'+o.title.replace(/\"/g,'\\"')+'", "japanese": '+(null!==o.japanese_title?'"'+o.japanese_title.replace(/\"/g,'\\"')+'"':"null")+' }, "type": "'+o.type+'", "languageName": { "english": '+(null!==o.language?'"'+o.language+'"':"null")+', "local": '+(null!==o.language_localname?'"'+o.language_localname+'"':"null")+' }, "artists": [], "groups": [], "series": [], "characters": [], "tags": [], "files": [], "publishedDate": null }');if(c.publishedDate=new Date(o.date),null!==o.tags)for(let e=0;e<o.tags.length;e++){let t="tag";Boolean(o.tags[e].male)?t="male":Boolean(o.tags[e].female)&&(t="female"),c.tags.push({type:t,name:o.tags[e].tag})}if(null===(i=t.includeFiles)||void 0===i||i)for(let e=0;e<o.files.length;e++)c.files.push({index:e,hash:o.files[e].hash,extension:o.files[e].name.split(".").pop(),hasAvif:Boolean(o.files[e].hasavif),hasWebp:Boolean(o.files[e].haswebp),width:o.files[e].width,height:o.files[e].height});null===(r=t.includeFullData)||void 0===r||r?l(u(c)).then((function(e){const t=e.toString("utf8").split('content">')[1];if(void 0!==t)for(let e=0;e<n.length;e++){const a=t.match(RegExp("(?<=/"+n[e]+"/)[A-z0-9%]+(?=-all\\.html)","g"))||[];for(let t=0;t<a.length;t++)c["series"!==n[e]?n[e]+"s":"series"].push(decodeURIComponent(a[t]))}a(c)})).catch(s):a(c)})).catch(s)}));throw new a("INVALID_VALUE","id")},e.getIds=g,e.getParsedTags=function(e){const t=e.split(" ");if(0!==t.length){let e=[],n=new Set;for(let s=0;s<t.length;s++){const i=t[s].replace(/^-/,"").split(":");if(2!==i.length||!/^(artist|group|type|language|series|tag|male|female)$/.test(i[0])||!/^[^-_\.][a-z0-9-_.]+$/.test(i[1]))throw new a("INVALID_VALUE","splitTagStrings["+s+"]");{const r=i[0]+":"+i[1];if(n.has(r))throw new a("DUPLICATED_ELEMENT","splitTagStrings["+s+"]");e.push({type:i[0],name:i[1],isNegative:t[s].startsWith("-")}),n.add(r)}}return e}throw new a("LACK_OF_ELEMENT","splitTagStrings")},e.getQueriedIds=function(e){return new Promise((function(t,n){if(e.length>1)return e.sort((function(e,t){return e.isNegative?1:t.isNegative?-1:0})),void e.reduce((function(e,t){return e.then((function(e){return new Promise((function(n,a){l(c(t)).then((function(a){const s=t.isNegative||!1,i=r(a);e.forEach((function(t){s===i.has(t)&&e.delete(t)})),n(e)})).catch(a)}))}))}),e[0].isNegative?new Promise((function(e,t){g({startIndex:0}).then((function(t){e(new Set(t))})).catch(t)})):new Promise((function(t,n){l(c(e.shift())).then((function(e){t(r(e))})).catch(n)}))).then((function(e){t(Array.from(e))})).catch(n);throw new a("LACK_OF_ELEMENT","tags")}))},e.getTags=function(e,t={}){return new Promise((function(n,s){(void 0===t.startWith?"language"===e||"type"===e:"language"!==e&&"type"!==e)?"type"!==e?l(h(e,{startWith:t.startWith})).then((function(t){const a=t.toString("utf8").match(RegExp("language"===e?'(?<=")(?!all)[a-z]+(?=":)':"(?<=/tag/"+("male"===e||"female"===e?e+"%3A":"")+")[a-z0-9%]+(?=-all\\.html)","g"))||[];let s=[];for(let t=0;t<a.length;t++)s.push({type:e,name:decodeURIComponent(a[t])});n(s)})).catch(s):n([{type:"type",name:"doujinshi"},{type:"type",name:"manga"},{type:"type",name:"artistcg"},{type:"type",name:"gamecg"},{type:"type",name:"anime"}]):s(new a("INVALID_VALUE","options['startWith']"))}))}}(hitomi||(hitomi={})),exports.default=hitomi;