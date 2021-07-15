import https from 'https';
import tls from 'tls';

export interface Image {
	index: number;
	hash: string;
	extension: 'jpg' | 'png';
	hasAvif: boolean;
	hasWebp: boolean;
	width: number;
	height: number;
}

export interface Tag {
	type: 'artist' | 'group' | 'type' | 'language' | 'series' | 'character' | 'male' | 'female' | 'tag';
	name: string;
	isNegative?: boolean;
}

export interface Gallery {
	id: number;
	title: string;
	titleJapanese: string | null;
	type: 'doujinshi' | 'manga' | 'artistcg' | 'gamecg';
	language: string | null;
	languageLocalName: string | null;
	artists: string[];
	groups: string[];
	series: string[];
	characters: string[];
	tags: Tag[];
	files: Image[] | null;
	publishedDate: Date;
}

export interface LooseObject {
	[key: string]: any;
}

export class Agent extends https.Agent {
	public createConnection(options: https.AgentOptions, callback?: () => void): tls.TLSSocket {
		options['servername'] = undefined;
		return tls.connect(options, callback);
	}
}

Number.isInteger = function (value: any): boolean {
	if(Number.parseInt(value) === Number(value) && Number.isFinite(value) && typeof(value) !== 'object') {
		return true;
	} else {
		return false;
	}
}