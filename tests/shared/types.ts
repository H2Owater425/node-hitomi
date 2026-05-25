import { ResponseType } from '../../source/platform/shared';

export type RequestCall = {
	host: string;
	path: string;
	type: ResponseType;
	range: string | undefined;
};

export { ResponseType, RequestFunction } from '../../source/platform/shared';