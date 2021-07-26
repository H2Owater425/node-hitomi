import https from 'https';
import tls from 'tls';
import { RequestInit } from 'node-fetch';

export function isInteger(value: any): boolean {
	if(Number.parseInt(value) === Number(value) && Number.isFinite(value) && typeof(value) !== 'object') {
		return true;
	} else {
		return false;
	}
}

class Agent extends https.Agent {
	public createConnection(options: https.AgentOptions, callback?: () => void): tls.TLSSocket {
		options['servername'] = undefined;
		return tls.connect(options, callback);
	}
}

export const requestOption: RequestInit = {
	method: 'GET',
	agent: new Agent({ rejectUnauthorized: false, keepAlive: true }),
	headers: {
		'Accept': '*/*',
		'Accept-Encoding': 'gzip, deflate, br',
		'Connection': 'keep-alive'
	}
}