<div align='center'>
<img src='https://cdn.h2owr.xyz/images/node-hitomi/banner.png' alt='banner'/>
<h3>Hitomi.la api for Node.js</h3>
<sup>Would you call me a gentleman?</sup>

[![npm version](https://img.shields.io/npm/v/node-hitomi?style=flat-square)](https://npmjs.org/package/node-hitomi)
[![npm type definition](https://img.shields.io/npm/types/node-hitomi?style=flat-square)](https://npmjs.org/package/node-hitomi)
[![license](https://img.shields.io/github/license/H2Owater425/node-hitomi?style=flat-square)](https://github.com/H2Owater425/node-hitomi/blob/main/LICENSE)
</div>

<br />

## Installation

Using npm:
```bash
$ npm install node-hitomi --save
```

Using yarn:
```bash
$ yarn add node-hitomi
```

## Functions

- getImageUrl(imageData, extension[, option]) - `returns image url by image data`

- getGalleryUrl(galleryData) - `returns gallery url by gallery data`

- getNozomiUrl(tag) - `returns nozomi api url by tag`

- getGalleryData(id[, option]) - `returns gallery data(ex: title, tags, etc...) by id`

- getGalleryIdList(range[, option]) - `returns gallery id list by range`

- parseTag(tagString) - `returns tag structure list by search word`

- queryTag(tagList) - `returns id list result of search by tags`

## Examples

setup:
```javascript
// CommonJS
const hitomi = require('node-hitomi');

// ES Module
import hitomi from 'node-hitomi';
```

printing gallery number `x`'s title and id:
```javascript
hitomi.getGalleryData(x)
.then(function (value) {
  console.log(value['title'], value['id']);
});
```

printing number of `Korean` gallery without `mmf_threesome` tag:
```javascript
hitomi.queryTag([{ type: 'language', name: 'korean' },
{ type: 'tag', name: 'mmf_threesome', isNegative: true }])
.then(function (value) {
  console.log(value.length);
});
```