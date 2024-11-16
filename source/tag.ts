import { ERROR_CODE, TAG_TYPES } from './constant';
import { StartingCharacter, Tag } from './type';
import { getTagUri } from './uri';
import { HitomiError, fetch } from './utility';

export function getParsedTags(text: string): Tag[] {
	const tags: Tag[] = [];
	const rawPositiveTags: Set<string> = new Set<string>();
	
	text += ' ';

	let currentIndex: number = 0;
	let nextIndex: number = text.indexOf(' ');

	while(nextIndex !== -1) {
		const colonIndex: number = text.indexOf(':', currentIndex);

		if(colonIndex !== -1 && colonIndex < nextIndex) {
			const isNegative: Tag['isNegative'] = text.startsWith('-', currentIndex);
			const tag: Tag = {
				type: text.slice(currentIndex + (isNegative ? 1 : 0), colonIndex) as Tag['type'],
				name: text.slice(colonIndex + 1, nextIndex),
				isNegative: isNegative
			};

			if(TAG_TYPES.has(tag['type'])) {
				if(/^[a-z0-9][a-z0-9-_.]*$/.test(tag['name'])) {
					const positiveRawTag: string = tag['type'] + ':' + tag['name'];

					if(!rawPositiveTags.has(positiveRawTag)) {
						tag['name'] = tag['name'].replace(/_/g, ' ');

						tags.push(tag);
						rawPositiveTags.add(positiveRawTag);
					} else {
						throw new HitomiError(ERROR_CODE['DUPLICATED_ELEMENT'], '\'' + positiveRawTag + '\'');
					}
				} else {
					throw new HitomiError(ERROR_CODE['INVALID_VALUE'], '\'' + tag['name'] + '\'', 'match /^[a-z0-9][a-z0-9-_.]*$/');
				}
			} else {
				let message: string = 'be one of ';

				for(const tagType of TAG_TYPES) {
					message += '\'' + tagType + '\', ';
				}

				throw new HitomiError(ERROR_CODE['INVALID_VALUE'], '\'' + tag['type'] + '\'', message.slice(0, -2));
			}
		} else {
			throw new HitomiError(ERROR_CODE['INVALID_VALUE'], '\'' + text.slice(currentIndex, nextIndex) + '\'');
		}

		currentIndex = nextIndex + 1;
		nextIndex = text.indexOf(' ', currentIndex);
	}

	return tags;
}

export function getTags(type: Tag['type'], startsWith?: StartingCharacter): Promise<Tag[]> {
	const isTypeType: boolean = type === 'type';
	const isLanguageType: boolean = type === 'language';

	if(typeof(startsWith) === 'string' !== (isTypeType || isLanguageType)) {
		if(!isTypeType) {
			return fetch(getTagUri(type, startsWith))
			.then(function (response: Buffer): Tag[] {
				const responseText: string = response.toString('utf-8');
				const tags: Tag[] = [];
				let currentIndex: number;
				let nextIndex: number;

				if(!isLanguageType) {
					let target: string = 'href="/';

					switch(type) {
						case 'male':
						case 'female': {
							target += 'tag/' + type + '%3A';

							break;
						}

						default: {
							target += type + '/';

							break;
						}
					}

					const endIndex: number = target['length'] - 1;

					currentIndex = responseText.indexOf(target) + target['length'];
					nextIndex = responseText.indexOf('.', currentIndex);

					if(type !== 'tag') {
						while(currentIndex !== endIndex) {
							tags.push({
								type: type,
								name: decodeURIComponent(responseText.slice(currentIndex, nextIndex - 4))
							});

							currentIndex = responseText.indexOf(target, nextIndex) + target['length'];
							nextIndex = responseText.indexOf('.', currentIndex);
						}
					} else {
						while(currentIndex !== endIndex) {
							if(!responseText.startsWith('male', currentIndex) && !responseText.startsWith('female', currentIndex)) {
								tags.push({
									type: type,
									name: decodeURIComponent(responseText.slice(currentIndex, nextIndex - 4))
								});
							}

							currentIndex = responseText.indexOf(target, nextIndex) + target['length'];
							nextIndex = responseText.indexOf('.', currentIndex);
						}
					}
				} else {
					const endIndex: number = responseText.indexOf('}');

					currentIndex = responseText.indexOf(':') + 2;
					nextIndex = responseText.indexOf('"', currentIndex);

					while(nextIndex < endIndex) {
						tags.push({
							type: 'language',
							name: responseText.slice(currentIndex, nextIndex)
						});

						currentIndex = responseText.indexOf(':', nextIndex) + 2;
						nextIndex = responseText.indexOf('"', currentIndex);
					}
				}

				return tags;
			});
		} else {
			return Promise.resolve([{
				type: 'type',
				name: 'doujinshi'
			}, {
				type: 'type',
				name: 'manga'
			}, {
				type: 'type',
				name: 'artistcg'
			}, {
				type: 'type',
				name: 'gamecg'
			}, {
				type: 'type',
				name: 'imageset'
			}, {
				type: 'type',
				name: 'anime'
			}]);
		}
	} else {
		return Promise.reject(new HitomiError(ERROR_CODE['INVALID_VALUE'], 'startsWith', 'not be used only with type and language'));
	}
}