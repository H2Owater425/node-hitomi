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
> 
> Due to frequent changes on Hitomi.la, it is highly recommended to use the latest version.

**Node.js 10.20 or newer is required.**

```sh
npm install node-hitomi
yarn add node-hitomi
pnpm add node-hitomi
bun add node-hitomi
```

## Features

- **Gallery Search:** Filter by tags and title, choose sort order, and paginate results.
- **Gallery Retrieval:** Load full gallery metadata, including title, type, language, artists, and relations.
- **Tag Management:** Create, parse, search, and list tags. Also list available languages for a tag.
- **Image Downloads:** Resolve URLs and fetch images in AVIF/WebP/JXL (when available), with optional thumbnail sizes.
- **Video Downloads:** Fetch gallery videos and poster images.

## Usage

The package exports a default client instance, but you can also create your own client for custom configuration.

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
	indexMaximumAge: 300000,
	imageContextMaximumAge: 1800000
});
```

If you use CommonJS module:

```typescript
const { hitomi, SortType /* and more... */ } = require('node-hitomi');
```

---

### Galleries

`GalleryManager` lets you retrieve individual galleries and list matching gallery references.

#### `GalleryManager.retrieve(id)`

Retrieves a full gallery by id and returns a `Gallery` instance.

```typescript
import hitomi from 'node-hitomi';

// Retrieve a gallery by id
const gallery = await hitomi.galleries.retrieve(1234567);

console.log(`Title: ${gallery.title.display}`);
console.log(`Type: ${gallery.type}`);
console.log(`Language: ${gallery.language?.name}`);
```

#### `GalleryManager.list(options?)`

Lists galleries that match the given criteria. You can pass tags, a title query, sort options, and paging options. The method returns `GalleryReference[]`.

```typescript
import hitomi, { SortType } from 'node-hitomi';

// Parse a search expression into structured tag objects
const tags = hitomi.tags.parse('male:sole_male -female:netorare series:blue_archive');

// List matching gallery references
const references = await hitomi.galleries.list({
	tags: tags,
	title: 'serina',
	orderBy: SortType.PopularityMonth
});

// Resolve the first reference to a full gallery
if(references.length > 0) {
	const firstGallery = await references[0].retrieve();
	console.log(firstGallery.title.display);
}
```

> [!WARNING]
> 
> Not every `options.page` usage is valid. It must meet the restrictions below.
> 
> - Only one non-language tag is allowed (optionally combined with a language tag).
> - Negative tags and title are not supported.
> 
> ```typescript
> const simpleTags = hitomi.tags.parse('type:manga language:english');
> 
> // List matching gallery references with pagination
> const pagedReferences = await hitomi.galleries.list({
> 	tags: simpleTags,
> 	orderBy: SortType.DateAdded,
> 	page: {
> 		index: 0,
> 		size: 25
> 	}
> });
> ```

---

### Tags

`TagManager` helps you create, parse, search, and list tags.

#### `TagManager.create(type, name, isNegative?)`

Creates a `Tag` instance with a type, name, and optional negation flag.

```typescript
import hitomi from 'node-hitomi';

// Create a series tag and list available languages for that tag
const tag = hitomi.tags.create('series', 'trickcal_revive', false);
const languages = await tag.listLanguages();

console.log(languages);
```

#### `TagManager.parse(expression)`

Parses a human-readable expression into unique `Tag` instances. The expected format is `[-]type:name`, where spaces are represented by underscores.

```typescript
import hitomi from 'node-hitomi';

// Parse a string expression into Tag instances
const parsedTags = hitomi.tags.parse('female:yandere male:sole_male -tag:group');

for(const tag of parsedTags) {
	console.log(tag);
}
```

#### `TagManager.search(term)`

Searches tags by partial term and returns tuples of `[Tag, count]`, where `count` is the number of galleries associated with each tag.

```typescript
import hitomi from 'node-hitomi';

// Search tags and print their gallery counts
const tagAndCounts = await hitomi.tags.search('character:agnes');

for(const [tag, count] of tagAndCounts) {
	console.log(`${String(tag)} (${count} galleries)`);
}
```

#### `TagManager.list(type, startsWith?)`

Lists tags of a specific type, optionally filtered by an initial character.

```typescript
import hitomi, { NameInitial } from 'node-hitomi';

// List female tags that start with 'a'
const femaleATags = await hitomi.tags.list('female', NameInitial.A);

for(const tag of femaleATags) {
	console.log(String(tag));
}
```

---

### Media

#### `Image.resolveUrl(extension, thumbnailSize?)`

Resolves an image URL in the requested format and optional thumbnail size.

> [!WARNING]
> 
> Not every `extension` and `thumbnailSize` combination is valid. It must meet the restrictions below.
> 
> | Thumbnail Size | Extension | Requirement (must be true)       |
> | :------------- | :-------- | :------------------------------- |
> | *(none)*       | *(all)*   | `has{Extension}`                 |
> | `Small`        | *(all)*   | `has{Extension}`                 |
> | `Medium`       | `Avif`    | `hasThumbnail && has{Extension}` |
> | `Big`          | *(all)*   | `hasThumbnail && has{Extension}` |

```typescript
import hitomi, { Extension, ThumbnailSize } from 'node-hitomi';

const gallery = await hitomi.galleries.retrieve(1234567);
const firstImage = gallery.files[0];

// Full-size WebP URL
const imageUrl = await firstImage.resolveUrl(Extension.Webp);
console.log(`Image URL: ${imageUrl}`);

// AVIF medium thumbnail URL (valid only when thumbnail is available)
const thumbnailUrl = await firstImage.resolveUrl(Extension.Avif, ThumbnailSize.Medium);
console.log(`Thumbnail URL: ${thumbnailUrl}`);
```

#### `Image.fetch(extension, thumbnailSize?)`

Fetches an image as a `Buffer`. The same extension and thumbnail constraints as [`Image.resolveUrl`](#imageresolveurlextension-thumbnailsize) apply.

```typescript
import hitomi, { Extension, ThumbnailSize } from 'node-hitomi';
import { writeFileSync } from 'fs';

const gallery = await hitomi.galleries.retrieve(1234567);
const firstImage = gallery.files[0];

// Fetch and save a thumbnail image buffer
const imageBuffer = await firstImage.fetch(Extension.Webp, ThumbnailSize.Small);
writeFileSync('image.webp', imageBuffer);
```

#### `Video.fetch()`

Fetches a gallery video as an MP4 `Buffer`.

```typescript
import hitomi from 'node-hitomi';
import { writeFileSync } from 'fs';

const gallery = await hitomi.galleries.retrieve(1234567);

if(gallery.video) {
	// Fetch and store the MP4 video
	const videoBuffer = await gallery.video.fetch();
	writeFileSync('video.mp4', videoBuffer);
}
```

#### `Video.fetchPoster()`

Fetches the video poster as a WebP `Buffer`.

```typescript
import hitomi from 'node-hitomi';
import { writeFileSync } from 'fs';

const gallery = await hitomi.galleries.retrieve(1234567);

if(gallery.video) {
	// Fetch and store the WebP poster image
	const posterBuffer = await gallery.video.fetchPoster();
	writeFileSync('poster.webp', posterBuffer);
}
```

## Contribution

Contributions are welcome. Feel free to open an issue for bugs or submit a pull request with improvements.

## License

This project is licensed under the [MIT License](LICENSE).