import { ResponseType } from '@/platform/shared';

export type RequestCall = {
	host: string;
	path: string;
	type: ResponseType;
	range: string | undefined;
};

export { ResponseType, TransportFunction } from '@/platform/shared';