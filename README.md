<div align='center'>
<img src='https://cdn.h2owr.xyz/images/node-hitomi/banner.png' alt='banner'/>
<h3>Hitomi.la api for Node.js</h3>
<sup>Would you call me a gentleman?</sup>

[![npm version](https://img.shields.io/npm/v/node-hitomi?style=flat-square)](https://npmjs.org/package/node-hitomi)
[![npm type definition](https://img.shields.io/npm/types/node-hitomi?style=flat-square)](https://npmjs.org/package/node-hitomi)
[![license](https://img.shields.io/github/license/H2Owater425/node-hitomi?style=flat-square)](https://github.com/H2Owater425/node-hitomi/blob/main/LICENSE)
</div>

<br/>

## Installation

> **NOTICE**: Please always use the latest version of the package.<br/>Since Hitomi changes its method to get image url often, legacy version may not work.

Using npm:
```bash
$ npm install node-hitomi
```

Using yarn:
```bash
$ yarn add node-hitomi
```

## Features

- Get gellary ids by title, tags, and popularity
- Get gallary data by id
- Parse, query and get tags
- Get hitomi-related uris

Without any dependencies!

## Usage/Examples

setup:
```javascript
// CommonJS
const hitomi = require('node-hitomi').default;

// ES Module
import hitomi from 'node-hitomi';
```

printing title and id of gallery id `x`:
```javascript
hitomi.getGallery(x)
.then(function (gallery) {
	console.log(gallery['title']['display'], gallery['id']);

	return;
});
```

printing supported tags of `female` starts with letter `y`:
```javascript
hitomi.getTags('female', {
	startsWith: 'y'
})
.then(function (tags) {
	console.log(tags);

	return;
});
```

printing number of gallery with language `korean` without female tag `netorare`:
```javascript
hitomi.getGalleryIds({
	tags: hitomi.getParsedTags('language:korean -female:netorare')
})
.then(function (ids) {
	console.log(ids['length']);

	return;
});
```

## Contribution

Contribution, issues and feature requests are welcome!<br/>Feel free to check [issues page](https://github.com/H2Owater425/node-hitomi/issues).