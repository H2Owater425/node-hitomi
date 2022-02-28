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

- Get gellary ids by index range
- Get gallary data by id
- Parse, query and get tags
- Get hitomi-related urls

Without any dependencies!

## Usage/Examples

setup:
```javascript
// CommonJS
const hitomi = require('node-hitomi').default;

// ES Module
import hitomi from 'node-hitomi';
```

printing title and id of gallery number `x`:
```javascript
hitomi.getGallery(x)
.then(function (value) {
  console.log(value['title']['display'], value['id']);
});
```

printing supported tags for `female` starting with letter `b`:
```javascript
hitomi.getTags('female', { startWith:'b' })
.then(function (value) {
  console.log(value);
});
```

printing number of language `korean` gallery without female tag `netorare`:
```javascript
hitomi.getIds({ tags: [{
  type: 'language',
  name: 'korean'
}, {
  type: 'female',
  name: 'netorare',
  isNegative: true
}] })
.then(function (value) {
  console.log(value['length']);
});
```

## Contribution

Contribution, issues and feature requests are welcome!<br/>Feel free to check [issues page](https://github.com/H2Owater425/node-hitomi/issues).