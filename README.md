![node-hitomi_banner](https://cdn.h2owr.xyz/images/node-hitomi_banner.png)
<h3 align="center">Hitomi.la api for Node.js</h3>
<p align="center">Would you call me a gentleman?</p>

<br/>

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
