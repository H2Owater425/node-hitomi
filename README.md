<div align='center'>

[![banner](.github/assets/banner.png)](https://github.com/H2Owater425/node-hitomi)

### Hitomi.la API for Node.js

<sup>Would you call me a gentleman?</sup>

[![npm version](https://img.shields.io/npm/v/node-hitomi?style=flat-square)](https://npmjs.org/package/node-hitomi)
[![npm type definition](https://img.shields.io/npm/types/node-hitomi?style=flat-square)](https://npmjs.org/package/node-hitomi)
[![license](https://img.shields.io/github/license/H2Owater425/node-hitomi?style=flat-square)](https://github.com/H2Owater425/node-hitomi/blob/main/LICENSE)

</div>

## Installation

> [!IMPORTANT]
> Due to frequent changes on Hitomi, it is highly recommended to use the latest version.

**Node.js 10.4 or newer is required.**

```sh
npm install node-hitomi
yarn add node-hitomi
pnpm add node-hitomi
bun add node-hitomi
```

## Features

- **Gallery Search:** List galleries with tag filters, title search, sorting, and pagination.
- **Gallery Retrieval:** Retrieve full gallery metadata including title, type, language, artists, and more.
- **Tag Management:** Create, parse, search, and list tags. Additionally, retrieve available languages for specific tags.
- **Image Downloads:** Generate image URLs and download images in AVIF, WebP, and JXL formats with optional thumbnail sizing.
- **Video Downloads:** Download videos and video posters from galleries.

> Without any external dependencies!

## Usage

The package provides a default client instance, but you can also instantiate your own client if you need custom configuration.

```typescript
import { Hitomi } from 'node-hitomi';
import { Agent } from 'https';

const agent = new Agent({
	keepAlive: true,
	// Bypass server name indication field blocking
	servername: '',
	rejectUnauthorized: true
});

const hitomi = new Hitomi({
	agent: agent,
	indexStaleTime: 300000,
	imageContextStaleTime: 1800000
});
```

Or using CommonJS modules you can import as follows:

```typescript
const { hitomi, SortType, /* and more... */ } = require('node-hitomi');
```

---

### Galleries

`GalleryManager` allows you to retrieve and list galleries.

#### `GalleryManager.retrieve(id)`

Fetches the full gallery for a given gallery id. Returns a `Gallery` instance containing title, type, language, and other metadata.

```typescript
import hitomi from 'node-hitomi';

// Retrieve the full gallery by id
const gallery = await hitomi.galleries.retrieve(1234567);

console.log(`Title: ${gallery.title.display}`);
console.log(`Type: ${gallery.type}`);
console.log(`Language: ${gallery.language?.name}`);
```

#### `GalleryManager.list(options?)`

Searches for galleries matching the given criteria. Accepts optional tags, a title string, a sort order, and pagination options. Returns an array of `GalleryReference` instances that can be individually retrieved.

```typescript
import hitomi, { SortType } from 'node-hitomi';

// Parse a search query into Tag instances
const tags = hitomi.tags.parse('male:sole_male -female:netorare series:blue_archive');

// List the gallery references matching the criteria
const references = await hitomi.galleries.list({
	tags: tags,
	title: 'serina',
	orderBy: SortType.PopularityMonth,
	page: {
		index: 0 ,
		size: 25
	}
});

// Retrieve the full gallery for the first result
if(references.length > 0) {
	const firstGallery = await references[0].retrieve();
	console.log(firstGallery.title.display);
}
```

---

### Tags

`TagManager` helps you create, parse, search, and list tags.

#### `TagManager.create(type, name, isNegative?)`

Creates a new `Tag` instance with the specified type, name, and optional negation flag.

```typescript
import hitomi from 'node-hitomi';

// Create a tag for a specific series
const tag = hitomi.tags.create('series', 'trickcal_revive', false);

// List all available languages for galleries with this tag
const languages = await tag.listLanguages();

console.log(languages);
```

#### `TagManager.parse(expression)`

Parses a human-readable tag expression string into an array of unique `Tag` instances. Requires the format of `[-]type:name`, where spaces in the name are replaced with underscores.

```typescript
import hitomi from 'node-hitomi';

// Parse a string expression into Tag instances
const parsedTags = hitomi.tags.parse('female:yandere male:sole_male -tag:group');

for(const tag of parsedTags) {
	console.log(tag);
}
```

#### `TagManager.search(term)`

Searches for tags whose names partially match the given term string. Returns an array of `[Tag, count]` tuples, where `count` is the number of galleries associated with that tag.

```typescript
import hitomi from 'node-hitomi';

// Search for tags matching a term
const tagAndCounts = await hitomi.tags.search('character:agnes');

for(const [tag, count] of tagAndCounts) {
	console.log(`${String(tag)} (${count} galleries)`);
}
```

#### `TagManager.list(type, startsWith?)`

Lists all tags of a specific type that start with the given letter initial. Returns an array of `Tag` instances.

```typescript
import hitomi, { NameInitial } from 'node-hitomi';

// List all tags of a specific type starting with a specific letter
const femaleATags = await hitomi.tags.list('female', NameInitial.A);

for(const tag of femaleATags) {
	console.log(String(tag));
}
```

---

### Medias

#### `Image.resolveUrl(extension, thumbnailSize?)`

Resolves a URL of the image with the specified format and optional thumbnail size. Please note that only the following combinations of extension and thumbnail size are valid.

| Thumbnail Size | Extension | Requirement (must be true)       |
| :------------- | :-------- | :------------------------------- |
| *(none)*       | *(all)*   | `has{Extension}`                 |
| `Small`        | *(all)*   | `has{Extension}`                 |
| `Medium`       | `Avif`    | `hasThumbnail && has{Extension}` |
| `Big`          | *(all)*   | `hasThumbnail && has{Extension}` |

```typescript
import hitomi, { Extension, ThumbnailSize } from 'node-hitomi';

const gallery = await hitomi.galleries.retrieve(1234567);
const firstImage = gallery.files[0];

// Generate a full-size image URL
const imageUrl = await firstImage.resolveUrl(Extension.Webp);
console.log(`Image URL: ${imageUrl}`);

// Generate a thumbnail URL
const thumbnailUrl = await firstImage.resolveUrl(Extension.Avif, ThumbnailSize.Medium);
console.log(`Thumbnail URL: ${thumbnailUrl}`);
```

#### `Image.fetch(extension, thumbnailSize?)`

Downloads the image into a buffer with the specified format and optional thumbnail size. The same restrictions on extension and thumbnail size combinations apply as in [`Image.resolveUrl`](#imagecreateurlextension-thumbnailsize).


```typescript
import hitomi, { Extension, ThumbnailSize } from 'node-hitomi';
import { writeFileSync } from 'fs';

const gallery = await hitomi.galleries.retrieve(1234567);
const firstImage = gallery.files[0];

// Fetch the image and save it to the disk
const imageBuffer = await firstImage.fetch(Extension.Webp, ThumbnailSize.Medium);
writeFileSync('image.webp', imageBuffer);
```

#### `Video.fetch()`

Downloads the video into a buffer in MP4 format.

```typescript
import hitomi from 'node-hitomi';
import { writeFileSync } from 'fs';

const gallery = await hitomi.galleries.retrieve(1234567);

// Fetch the video and save it to the disk if available
if(gallery.video) {
	const videoBuffer = await gallery.video.fetch();
	writeFileSync('video.mp4', videoBuffer);
}
```

#### `Video.fetchPoster()`

Downloads the poster (video thumbnail) into a buffer in WebP format.

```typescript
import hitomi from 'node-hitomi';
import { writeFileSync } from 'fs';

const gallery = await hitomi.galleries.retrieve(1234567);

// Fetch the poster and save it to the disk if available
if(gallery.video) {
	const posterBuffer = await gallery.video.fetchPoster();
	writeFileSync('poster.webp', imageBuffer);
}
```

## Contribution

Contributions are welcome! Feel free to report bugs via issues or share your improvements through pull requests.

## License

This project is licensed under the [MIT License](LICENSE).