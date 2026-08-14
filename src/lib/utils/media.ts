const VIDEO_EXTENSIONS = new Set([
	'mp4',
	'mov',
	'm4v',
	'webm',
	'avi',
	'mkv',
	'3gp',
	'mpe',
	'mpeg'
]);

export type MediaType = 'image' | 'video';

function getFileExtension(url: string): string {
	const cleanUrl = url.split('?')[0].split('#')[0].toLowerCase();
	const lastDotIndex = cleanUrl.lastIndexOf('.');

	if (lastDotIndex === -1) return '';

	return cleanUrl.slice(lastDotIndex + 1);
}

export function getMediaType(url: string, mediaType?: string | null): MediaType {
	if (mediaType === 'video' || mediaType === 'image') {
		return mediaType;
	}

	const extension = getFileExtension(url);

	return VIDEO_EXTENSIONS.has(extension) ? 'video' : 'image';
}

export function isVideoMedia(url: string, mediaType?: string | null): boolean {
	return getMediaType(url, mediaType) === 'video';
}

export function isImageMedia(url: string, mediaType?: string | null): boolean {
	return getMediaType(url, mediaType) === 'image';
}

export function resolveMediaUrl(url: string): string {
	if (!url) return '';
	if (url.startsWith('/api/v1')) {
		const base = (typeof import.meta !== 'undefined' && import.meta.env?.VITE_API_BASE_URL)
			? import.meta.env.VITE_API_BASE_URL.replace(/\/api\/v1\/?$/, '')
			: 'http://localhost:8080';
		return `${base}${url}`;
	}
	return url;
}