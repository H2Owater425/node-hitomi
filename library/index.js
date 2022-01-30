"use strict";Object.defineProperty(exports,"__esModule",{value:!0});const https_1=require("https"),tls_1=require("tls");var hitomi;!function(e){const t=/^(0|1(0(0[0-13-6]?|1[1-368-9]|2[47-8]?|3[024-57]|4[0-137]|5[1-46-9]|6[0-246]|7[1-2579]?|8[0-25-79]?|9[38-9])?|1(0[0-16-8]|1[02-48]|2[0-3]|3[024-9]?|4[0-13-9]|5[1-4]?|6[1-357-8]|7[025]|8[2-357-8]|9[0-13-46-7])?|2(0[13-46-79]|1[025]?|2[246-79]|3[0-1359]|4[69]?|5[35-68-9]|6[25-68-9]?|7[19]?|8[279]|9[05-8]?)?|3(0[24-59]?|1[02-35-69]|2[0-246-8]?|3[258-9]?|4[1-357-9]?|5[0-24-57-8]|6[1-24-58]|7[079]|8[02-37-9]?|9[24-69]?)?|4(0[06-79]|1[1-24-58-9]?|2[0-14-6]?|3[0247-8]?|4[0-147-9]?|5[25-68-9]?|6[24-57-8]?|7[6-8]?|8[0-48-9]|9[16])?|5(0[2-35-9]|1[02-35]?|2[1-2468-9]|3[13-7]|4[0-13-4]?|5[5-68-9]?|6[03-5]?|7[02-358]?|8[036-7]?|9[14-68-9]?)|6(0[0269]|1[1-58]?|2[0-1479]|3[03-46-79]|4[0-13-6]|5[13-46-9]|6[268-9]|7[0-13-479]?|8[0-2469]|9[0-13-68]?)|7(0[0-59]|1[04-57]|2[0-25-8]|3[0-35-68-9]|4[36]?|5[0-137-8]|6[1468-9]|7[3-58-9]?|8[0-248-9]?|9[02-46-79]?)?|8(0[157]?|1[0-17-9]?|2[0-159]?|3[0-379]|4[028]|5[0-13-48]|6[0-13-4]?|7[13-48]|8[146-79]|9[357-8])|9(0[05-9]?|1[0-13-57]?|2[1-2579]|3[0-13-5]|4[4-8]?|5[03-7]|6[47]|7[0-257-8]?|8[146-9]|9[13-57-8])?)?|2(0(0[25-6]|1[0-14-57-8]?|2[258-9]|3[47-8]|4[0248-9]|5[0-135-8]|6[0-257-9]?|7[1-359]?|8[0358-9]?|9[24])|1(0[39]|1[0-135-69]?|2[13-47]?|3[046]|4[02-68-9]|5[2-46-8]|6[1-279]|7[0-358]?|8[04-6]?|9[027-8]?)|2(0[06-9]|1[13-4]?|2[1-3]|3[0-136-7]?|4[0-13-49]|5[136]?|6[0-14-6]|7[0-148]?|8[3-46-7]?|9[0-17-9])?|3(0[3-46-7]?|1[26]|2[04-6]|3[1-2]?|4[0-57-8]?|5[0-2479]|6[04-68-9]?|7[46-7]?|8[3-9]|9[1-25-68-9])?|4(0[13-69]|1[1-25]?|2[0-36-9]|3[3-9]|4[0-17-8]?|5[135-8]|6[03-47-9]|7[0-137-8]?|8[1-357-8]|9[2-479]?)?|5(0[03-48]?|1[13-46-8]|27?|3[35-6]?|4[07-9]?|5[46-7]|6[09]?|7[2-368-9]?|8[2-6]|9[0-14-7]?)?|6(0[02479]?|1[0-1359]?|2[0-369]|3[268-9]|4[0-28-9]|5[36-9]|6[137]|7[07-9]|8[0-14-58-9]|9[24-8]?)|7(0[02-357]|1[02-35-79]|2[35-9]?|3[0-18-9]|4[024-57]?|5[4-69]?|6[13-8]?|7[02-359]|8[02-49]|9[02-579]?)|8(0[0-249]?|1[14-57-8]|21?|3[4-57]|4[0-179]|5[1-258]?|6[7-9]?|7[047-8]|8[1-248]?|9[3-468])?|9(0[02-8]?|1[13-579]?|2[0-13-58-9]|3[24-5]|4[1-79]|5[0-24-68]?|6[0-35-68]|7[5-9]|8[15-7]|9[1-28-9]))|3(0(0[0-17-9]|1[0-39]|2[0-14-57-9]?|3[04-59]|4[0-58]|5[0-46]|6[0-24-8]?|7[148-9]|8[038-9]?|9[357])|1(0[4-5]|1[147-8]?|2[479]|3[05-7]?|4[047]|5[038-9]?|6[1-368]|7[0-46-8]|8[02468-9]?|9[1368])|2(0[1-35-68]?|1[0-179]?|2[02-38]|3[0-13-6]|4[14]?|54|6[47]?|7[02-68]|8[0-13-46-7]?|9[02-36]?)|3(0[0-13]?|1[13-46-79]|2[0-1468]|3[0-16-9]?|4[35-6]|5[5-8]?|6[0-258]|7[4-8]?|8[158-9]?|9[0-13-79]?)?|4(0[28-9]?|1[0-24-69]?|2[0-1468]?|3[14-58-9]?|4[0-357-8]|5[08]?|6[2469]|7[2-57]|8[03-68-9]|9[0359])?|5(0[0-146-8]?|1[0-17-8]|2[26-8]?|3[37-8]|4[1-35-6]?|5[1-35-6]?|6[1-24-58-9]?|7[0357-9]|8[5-68-9]?|9[0-135-68-9]?)?|6(0[2-35]?|1[2579]|2[24-68]?|3[0-13-79]|4[0-168]?|5[4-5]?|6[1-368]|7[1-269]|8[1-358-9]?|9[14-579]?)|7(0[1357-9]|1[1-358]?|2[0-18]?|3[15-7]|4[1-247]?|5[5-69]?|6[02-49]?|7[0-1469]?|8[248-9]?|9[368-9]?)|8(0[02-36-8]?|1[146-8]|2[1-36-7]|3[0-1468-9]?|4[0-16-8]|5[0-179]?|6[0-35-69]?|7[13-469]|8[2479]|9[28-9]?)|9(0[0379]|1[13-47-8]?|2[138-9]|3[1-28]?|4[037-8]?|5[0-14-6]?|6[0-15-6]?|7[028-9]|8[03-579]|9[3579]?)?)|4(0(0[0-37]|1[0-15-7]?|2[1-26-79]|3[0247]|4[026-79]?|5[024-9]|6[03-8]|7[5-7]?|8[2-38]|9[15])|1[146-9]?|2[0-257]?|3[02-79]?|4[579]?|5[035-9]|6[58]|7[2-368-9]?|8[35-8]|9[35-6])|5(0[036-79]?|17|2[2-3]?|3[68-9]|4[1-24-57-9]?|5[0-35-79]|6[024-6]|7[268-9]?|8[0-168-9]|9[0-13-57-8]?)?|6(0[4-8]|15|2[138-9]?|3[68-9]|4[357-9]?|5[0-24-59]?|6[13-468]|7[1-37]|8[13-59]|9[0-3579]?)?|7(0[02-35-9]?|1[0-14-9]|2[5-8]|3[035-8]?|4[02-357-8]?|5[0-24-8]|6[2-468-9]?|7[1-46]|8[06-79]?|9[6-8])|8(0[0-14-5]|1[0-249]|2[046]|3[04-579]|4[259]?|5[06]|6[37]|7[26-8]?|8[02-36-8]|9[2-368-9]?)?|9(0[1-57]|1[1-57-8]?|2[027-8]|3[046-8]|4[04-6]?|5[1-259]?|6[02579]?|7[02-47]?|8[19]?|9[14-69]?))$/,n=["artist","group","series","character"];class a extends Error{constructor(e,t){super("Unknown"),this.code=e;const n=t.includes("'")?"`":"'";switch(t=n+t+n,e){case"INVALID_VALUE":this.message="Value of "+t+" was not valid";break;case"DUPLICATED_ELEMENT":this.message="Element of "+t+" was duplicated";break;case"LACK_OF_ELEMENT":this.message="Elements of "+t+" was not enough";break;case"REQEUST_REJECTED":this.message="Request to "+t+" was rejected"}}get name(){return"HitomiError ["+this.code+"]"}}function s(e){return Number.parseInt(e)===Number(e)&&Number.isFinite(e)&&"object"!=typeof e}function i(e,t={}){const n=t.splitBy||4;let a=new ArrayBuffer(e.byteLength),s=new Uint8Array(a);for(let t=0;t<e.byteLength;++t)s[t]=e[t];const i=new DataView(a),r=i.byteLength/n;let o=new Set;for(let e=0;e<r;e++)o.add(i.getInt32(e*n,!1));return o}const r=new class extends https_1.Agent{createConnection(e,t){return(0,tls_1.connect)(Object.assign(e,{servername:void 0}),t)}};function o(e,t={}){return new Promise((function(n,s){const i=new URL(e);(0,https_1.request)({hostname:i.hostname,path:i.pathname,method:"GET",port:443,headers:Object.assign(t,{Accept:"*/*",Connection:"keep-alive",Referer:"https://hitomi.la"}),agent:r},(function(t){let i=[],r=0;switch(t.statusCode){case 200:case 206:t.on("data",(function(e){i.push(e),r+=e.byteLength})).on("error",(function(){s(new a("REQEUST_REJECTED",e))})).on("end",(function(){n(Buffer.concat(i,r))}));break;default:s(new a("REQEUST_REJECTED",e))}})).on("error",(function(){s(new a("REQEUST_REJECTED",e))})).end()}))}function l(e,t={}){if("language"!==e.type||void 0===t.orderBy){let n="",a="",s="all";switch(e.type){case"male":case"female":n="tag/",a=e.type+":"+e.name.replace(/_/g," ");break;case"language":a=t.orderBy||"index",s=e.name;break;default:n=e.type+"/",a=e.name.replace(/_/g," ")}return"https://ltn.hitomi.la/n/"+n+a+"-"+s+".nozomi"}throw new a("INVALID_VALUE","options['orderBy']")}function c(e,t={}){if("language"!==e||void 0===t.startWith){let n="https://hitomi.la/";switch(e){case"tag":case"male":case"female":n+="alltags-";break;case"artist":n+="allartists-";break;case"series":n+="allseries-";break;case"character":n+="allcharacters-";break;case"group":n+="allgroups-";break;case"language":n="ltn."+n+"language_support.js";break;default:throw new a("INVALID_VALUE","extension")}if("language"!==e){switch(e){case"male":n+="m";break;case"female":n+="f";break;default:"0-9"===t.startWith?n+="123":n+=t.startWith}return n+".html"}return n}throw new a("INVALID_VALUE","options['startWith']")}function h(e){return("https://hitomi.la/"+("artistcg"!==e.type?e.type:"cg")+"/"+encodeURIComponent(Buffer.from(e.title.japanese||e.title.display).slice(0,200).toString("utf-8")).replace(/\(|\)|'|%(2[0235F]|3[CEF]|5[BD]|7[BD])/g,"-")+(null!==e.languageName.local?"-"+encodeURIComponent(e.languageName.local):"")+"-"+e.id+".html").toLocaleLowerCase()}e.getNozomiUrl=l,e.getTagUrl=c,e.getImageUrl=function(e,n,i={}){const r=i.isThumbnail||!1;switch(n){case"jpg":if("jpg"!==e.extension)throw new a("INVALID_VALUE","extension");break;case"png":case"gif":if(r||e.extension!==n)throw new a("INVALID_VALUE","extension");break;case"webp":if(r||!e.hasWebp)throw new a("INVALID_VALUE","extension");break;case"avif":if(e.hasAvif)break;throw new a("INVALID_VALUE","extension");default:throw new a("INVALID_VALUE","extension")}if(/^[0-9a-f]{64}$/.test(e.hash)){if(s(e.index)&&e.index>=0){let a="",s="",i="";if(r)a=e.hash.slice(-1)+"/"+e.hash.slice(-3,-1)+"/"+e.hash,s="tn",i=("avif"===n?"avif":"")+"bigtn";else{const r=String(Number.parseInt(e.hash.slice(-1)+e.hash.slice(-3,-1),16));a="1643551173/"+r+"/"+e.hash,s=t.test(r)?"a":"b","jpg"===n||"png"===n?(s+="b",i="images"):(s+="a",i=n)}return"https://"+s+".hitomi.la/"+i+"/"+a+"."+n}throw new a("INVALID_VALUE","image['index']")}throw new a("INVALID_VALUE","image['hash']")},e.getVideoUrl=function(e){return"https://streaming.hitomi.la/videos/"+e.title.display.toLowerCase().replace(/\s/g,"-")+".mp4"},e.getGalleryUrl=h,e.getSecondThumbnailIndex=function(e){return Math.ceil((e.files.length-1)/2)},e.getGallery=function(e,t={}){if(s(e)&&e>0)return new Promise((function(a,s){o("https://ltn.hitomi.la/galleries/"+e+".js").then((function(e){var i,r;const l=JSON.parse(e.toString("utf8").slice(18));let c=JSON.parse('{ "id": '+l.id+', "title": { "display": "'+l.title.replace(/\"/g,'\\"')+'", "japanese": '+(null!==l.japanese_title?'"'+l.japanese_title.replace(/\"/g,'\\"')+'"':"null")+' }, "type": "'+l.type+'", "languageName": { "english": '+(null!==l.language?'"'+l.language+'"':"null")+', "local": '+(null!==l.language_localname?'"'+l.language_localname+'"':"null")+' }, "artists": [], "groups": [], "series": [], "characters": [], "tags": [], "files": [], "publishedDate": null }');if(c.publishedDate=new Date(l.date),null!==l.tags)for(let e=0;e<l.tags.length;e++){let t="tag";Boolean(l.tags[e].male)?t="male":Boolean(l.tags[e].female)&&(t="female"),c.tags.push({type:t,name:l.tags[e].tag})}if(null===(i=t.includeFiles)||void 0===i||i)for(let e=0;e<l.files.length;e++)c.files.push({index:e,hash:l.files[e].hash,extension:l.files[e].name.split(".").pop(),hasAvif:Boolean(l.files[e].hasavif),hasWebp:Boolean(l.files[e].haswebp),width:l.files[e].width,height:l.files[e].height});null===(r=t.includeFullData)||void 0===r||r?o(h(c)).then((function(e){const t=e.toString("utf8").split('content">')[1];if(void 0!==t)for(let e=0;e<n.length;e++){const a=t.match(RegExp("(?<=/"+n[e]+"/)[A-z0-9%]+(?=-all\\.html)","g"))||[];for(let t=0;t<a.length;t++)c["series"!==n[e]?n[e]+"s":"series"].push(decodeURIComponent(a[t]))}a(c)})).catch(s):a(c)})).catch(s)}));throw new a("INVALID_VALUE","id")},e.getIds=function e(t={}){return new Promise((function(n,r){var c,h,g,u,f,p,d;const[m,w]=[s(null===(c=t.range)||void 0===c?void 0:c.startIndex),s(null===(h=t.range)||void 0===h?void 0:h.endIndex)];!m||(null===(g=t.range)||void 0===g?void 0:g.startIndex)>=0?!w||(null===(u=t.range)||void 0===u?void 0:u.endIndex)>=(null===(f=t.range)||void 0===f?void 0:f.startIndex)?Array.isArray(t.tags)&&0!==t.tags.length?void 0===t.orderBy?t.tags.reduce((function(e,t){return e.then((function(e){return new Promise((function(n,a){o(l(t)).then((function(a){const s=t.isNegative||!1,r=i(a);e.forEach((function(t){s===r.has(t)&&e.delete(t)})),n(e)})).catch(a)}))}))}),t.tags[0].isNegative?new Promise((function(t,n){e().then((function(e){t(new Set(e))})).catch(n)})):new Promise((function(e,n){o(l(t.tags.shift())).then((function(t){e(i(t))})).catch(n)}))).then((function(e){var a,s;n(Array.from(e).slice(null===(a=t.range)||void 0===a?void 0:a.startIndex,null===(s=t.range)||void 0===s?void 0:s.endIndex))})).catch(r):r(new a("INVALID_VALUE","options['orderBy']")):o("https://ltn.hitomi.la/"+(t.orderBy||"index")+"-all.nozomi",{Range:"bytes="+(m?4*(null===(p=t.range)||void 0===p?void 0:p.startIndex):"0")+"-"+(w?4*(null===(d=t.range)||void 0===d?void 0:d.endIndex)+3:"")}).then((function(e){let a=Array.from(i(e));t.reverseResult?n(a):n(a.reverse())})).catch(r):r(new a("INVALID_VALUE","options['range']['endIndex']")):r(new a("INVALID_VALUE","options['range']['startIndex']"))}))},e.getParsedTags=function(e){const t=e.split(" ");if(0!==t.length){let e=[],n=new Set;for(let s=0;s<t.length;s++){const i=t[s].replace(/^-/,"").split(":");if(2!==i.length||!/^(artist|group|type|language|series|tag|male|female)$/.test(i[0])||!/^[^-_\.][a-z0-9-_.]+$/.test(i[1]))throw new a("INVALID_VALUE","splitTagStrings["+s+"]");{const r=i[0]+":"+i[1];if(n.has(r))throw new a("DUPLICATED_ELEMENT","splitTagStrings["+s+"]");e.push({type:i[0],name:i[1],isNegative:t[s].startsWith("-")}),n.add(r)}}return e}throw new a("LACK_OF_ELEMENT","splitTagStrings")},e.getTags=function(e,t={}){return new Promise((function(n,s){(void 0===t.startWith?"language"===e||"type"===e:"language"!==e&&"type"!==e)?"type"!==e?o(c(e,{startWith:t.startWith})).then((function(t){const a=t.toString("utf8").match(RegExp("language"===e?'(?<=")(?!all)[a-z]+(?=":)':"(?<=/tag/"+("male"===e||"female"===e?e+"%3A":"")+")[a-z0-9%]+(?=-all\\.html)","g"))||[];let s=[];for(let t=0;t<a.length;t++)s.push({type:e,name:decodeURIComponent(a[t])});n(s)})).catch(s):n([{type:"type",name:"doujinshi"},{type:"type",name:"manga"},{type:"type",name:"artistcg"},{type:"type",name:"gamecg"},{type:"type",name:"anime"}]):s(new a("INVALID_VALUE","options['startWith']"))}))}}(hitomi||(hitomi={})),exports.default=hitomi;