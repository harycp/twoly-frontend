import { GIFEncoder, quantize, applyPalette } from 'gifenc';
import { isVideoMedia } from './media';

export type MemoryExportAspect = 'square' | 'feed' | 'story' | 'landscape';
export type MemoryExportTheme = 'aurora' | 'sunset' | 'midnight' | 'paper' | 'neon';
export type MemoryExportFormat = 'png' | 'gif' | 'video';

export interface MemoryExportMediaItem {
	id: string;
	photo_url: string;
	media_type?: string | null;
	caption?: string | null;
}

export interface MemoryExportInput {
	title: string;
	memoryDate?: string;
	items: MemoryExportMediaItem[];
	selectedIndex?: number;
	aspect: MemoryExportAspect;
	theme: MemoryExportTheme;
}

interface MediaResource {
	item: MemoryExportMediaItem;
	image?: HTMLImageElement;
	video?: HTMLVideoElement;
	isVideo: boolean;
}

interface ExportSize {
	width: number;
	height: number;
}

interface ThemeDefinition {
	name: string;
	primary: string;
	secondary: string;
	accent: string;
	card: string;
	glow: string;
	badge: string;
	caption: string;
}

const ASPECT_SIZES: Record<MemoryExportAspect, ExportSize> = {
	square: { width: 1080, height: 1080 },
	feed: { width: 1080, height: 1350 },
	story: { width: 1080, height: 1920 },
	landscape: { width: 1920, height: 1080 }
};

const THEMES: Record<MemoryExportTheme, ThemeDefinition> = {
	aurora: {
		name: 'Aurora',
		primary: '#FDB1C4',
		secondary: '#FFD9A8',
		accent: '#FFFFFF',
		card: 'rgba(255,255,255,0.12)',
		glow: 'rgba(253, 177, 196, 0.5)',
		badge: 'rgba(255,255,255,0.22)',
		caption: 'Dreamy glow for love stories'
	},
	sunset: {
		name: 'Sunset',
		primary: '#FF8A78',
		secondary: '#FDE68A',
		accent: '#FFFFFF',
		card: 'rgba(255,255,255,0.10)',
		glow: 'rgba(255, 138, 120, 0.45)',
		badge: 'rgba(255,255,255,0.18)',
		caption: 'Warm, emotional, cinematic'
	},
	midnight: {
		name: 'Midnight',
		primary: '#1F2937',
		secondary: '#4F46E5',
		accent: '#FFFFFF',
		card: 'rgba(255,255,255,0.08)',
		glow: 'rgba(79, 70, 229, 0.38)',
		badge: 'rgba(255,255,255,0.14)',
		caption: 'Dark, clean, premium'
	},
	paper: {
		name: 'Paper',
		primary: '#FFF8F1',
		secondary: '#F7D6C1',
		accent: '#111827',
		card: 'rgba(255,255,255,0.68)',
		glow: 'rgba(247, 214, 193, 0.46)',
		badge: 'rgba(17,24,39,0.08)',
		caption: 'Soft scrapbook aesthetic'
	},
	neon: {
		name: 'Neon',
		primary: '#FB7185',
		secondary: '#22D3EE',
		accent: '#FFFFFF',
		card: 'rgba(15,23,42,0.20)',
		glow: 'rgba(34, 211, 238, 0.34)',
		badge: 'rgba(255,255,255,0.18)',
		caption: 'Bold creator energy'
	}
};

const IMAGE_DISPLAY_SECONDS = 2.6;
const VIDEO_PREVIEW_SECONDS = 3.6;
const VIDEO_FRAME_RATE = 30;
const GIF_FRAME_RATE = 12;
const MEDIA_PADDING = 64;
const CORNER_RADIUS = 48;

function waitForAnimationFrame(): Promise<number> {
	return new Promise((resolve) => requestAnimationFrame(resolve));
}

function clamp(value: number, min: number, max: number): number {
	return Math.max(min, Math.min(max, value));
}

function easeInOutCubic(value: number): number {
	return value < 0.5 ? 4 * value * value * value : 1 - Math.pow(-2 * value + 2, 3) / 2;
}

function sanitizeFileName(value: string): string {
	return value
		.toLowerCase()
		.replace(/[^a-z0-9]+/g, '-')
		.replace(/^-+|-+$/g, '')
		.slice(0, 48) || 'twoly-memory';
}

function getExportSize(aspect: MemoryExportAspect): ExportSize {
	return ASPECT_SIZES[aspect];
}

function getTheme(theme: MemoryExportTheme): ThemeDefinition {
	return THEMES[theme];
}

function formatMemoryDate(dateString?: string): string {
	if (!dateString) return '';
	return new Date(dateString).toLocaleDateString('en-GB', {
		day: 'numeric',
		month: 'long',
		year: 'numeric'
	});
}

function getSequence(items: MemoryExportMediaItem[], selectedIndex = 0): MemoryExportMediaItem[] {
	if (items.length === 0) return [];
	const safeIndex = clamp(selectedIndex, 0, items.length - 1);
	return [...items.slice(safeIndex), ...items.slice(0, safeIndex)];
}

function roundRectPath(
	ctx: CanvasRenderingContext2D,
	x: number,
	y: number,
	width: number,
	height: number,
	radius: number
): void {
	const r = Math.min(radius, width / 2, height / 2);
	ctx.beginPath();
	ctx.moveTo(x + r, y);
	ctx.lineTo(x + width - r, y);
	ctx.quadraticCurveTo(x + width, y, x + width, y + r);
	ctx.lineTo(x + width, y + height - r);
	ctx.quadraticCurveTo(x + width, y + height, x + width - r, y + height);
	ctx.lineTo(x + r, y + height);
	ctx.quadraticCurveTo(x, y + height, x, y + height - r);
	ctx.lineTo(x, y + r);
	ctx.quadraticCurveTo(x, y, x + r, y);
	ctx.closePath();
}

function fitCover(
	sourceWidth: number,
	sourceHeight: number,
	targetWidth: number,
	targetHeight: number
): { sx: number; sy: number; sw: number; sh: number } {
	const sourceRatio = sourceWidth / sourceHeight;
	const targetRatio = targetWidth / targetHeight;

	if (sourceRatio > targetRatio) {
		const sw = sourceHeight * targetRatio;
		return {
			sx: (sourceWidth - sw) / 2,
			sy: 0,
			sw,
			sh: sourceHeight
		};
	}

	const sh = sourceWidth / targetRatio;
	return {
		sx: 0,
		sy: (sourceHeight - sh) / 2,
		sw: sourceWidth,
		sh
	};
}

function drawTextBlock(
	ctx: CanvasRenderingContext2D,
	text: string,
	x: number,
	y: number,
	maxWidth: number,
	lineHeight: number,
	font: string,
	color: string,
	maxLines = 2
): number {
	ctx.font = font;
	ctx.fillStyle = color;
	ctx.textBaseline = 'top';
	const words = text.split(/\s+/);
	const lines: string[] = [];
	let currentLine = '';

	for (const word of words) {
		const candidate = currentLine ? `${currentLine} ${word}` : word;
		if (ctx.measureText(candidate).width <= maxWidth || currentLine === '') {
			currentLine = candidate;
		} else {
			lines.push(currentLine);
			currentLine = word;
		}
	}

	if (currentLine) lines.push(currentLine);

	const visibleLines = lines.slice(0, maxLines);
	visibleLines.forEach((line, index) => {
		const displayLine =
			index === maxLines - 1 && lines.length > maxLines ? `${line.replace(/\s+/g, ' ')}…` : line;
		ctx.fillText(displayLine, x, y + index * lineHeight);
	});

	return visibleLines.length;
}

function drawThemeBackground(
	ctx: CanvasRenderingContext2D,
	width: number,
	height: number,
	theme: ThemeDefinition,
	progress: number
): void {
	const gradient = ctx.createLinearGradient(0, 0, width, height);
	gradient.addColorStop(0, theme.primary);
	gradient.addColorStop(0.5, theme.secondary);
	gradient.addColorStop(1, theme.primary);
	ctx.fillStyle = gradient;
	ctx.fillRect(0, 0, width, height);

	ctx.save();
	ctx.globalAlpha = 0.9;
	ctx.fillStyle = theme.glow;
	ctx.filter = 'blur(10px)';
	const wobble = easeInOutCubic(progress);
	ctx.beginPath();
	ctx.ellipse(width * 0.16, height * 0.18, width * 0.18, height * 0.12 + wobble * 18, Math.PI / 4, 0, Math.PI * 2);
	ctx.fill();
	ctx.beginPath();
	ctx.ellipse(width * 0.82, height * 0.18, width * 0.14, height * 0.1 + wobble * 14, -Math.PI / 6, 0, Math.PI * 2);
	ctx.fill();
	ctx.beginPath();
	ctx.ellipse(width * 0.76, height * 0.84, width * 0.22, height * 0.16 + wobble * 20, Math.PI / 5, 0, Math.PI * 2);
	ctx.fill();
	ctx.restore();
}

function drawExportFrame(
	ctx: CanvasRenderingContext2D,
	width: number,
	height: number,
	themeKey: MemoryExportTheme,
	media: MediaResource,
	sequenceIndex: number,
	sequenceLength: number,
	progress: number,
	title: string,
	memoryDate?: string
): void {
	const theme = getTheme(themeKey);
	const eased = easeInOutCubic(clamp(progress, 0, 1));
	const fadeIn = clamp(progress / 0.16, 0, 1);
	const fadeOut = clamp((1 - progress) / 0.14, 0, 1);
	const opacity = Math.min(fadeIn, fadeOut, 1);
	const mediaCardPadding = MEDIA_PADDING;
	const cardX = mediaCardPadding;
	const cardY = mediaCardPadding + 24;
	const cardWidth = width - mediaCardPadding * 2;
	const cardHeight = height - mediaCardPadding * 2 - 54;
	const mediaFrameHeight = cardHeight * 0.62;
	const mediaFrameY = cardY + 22;
	const mediaFrameX = cardX + 20;
	const mediaFrameW = cardWidth - 40;
	const mediaFrameH = mediaFrameHeight - 28;
	const label = media.isVideo ? 'Video preview' : 'Photo preview';
	const dateLabel = formatMemoryDate(memoryDate);

	drawThemeBackground(ctx, width, height, theme, progress);

	ctx.save();
	ctx.globalAlpha = 0.98;
	roundRectPath(ctx, cardX, cardY, cardWidth, cardHeight, CORNER_RADIUS);
	ctx.fillStyle = theme.card;
	ctx.fill();
	ctx.shadowColor = 'rgba(15, 23, 42, 0.18)';
	ctx.shadowBlur = 40;
	ctx.shadowOffsetY = 18;
	ctx.fill();
	ctx.restore();

	ctx.save();
	roundRectPath(ctx, mediaFrameX, mediaFrameY, mediaFrameW, mediaFrameH, 40);
	ctx.clip();
	ctx.save();
	ctx.globalAlpha = opacity;

	if (media.isVideo && media.video) {
		const video = media.video;
		const sourceWidth = video.videoWidth || mediaFrameW;
		const sourceHeight = video.videoHeight || mediaFrameH;
		const fit = fitCover(sourceWidth, sourceHeight, mediaFrameW, mediaFrameH);
		ctx.drawImage(video, fit.sx, fit.sy, fit.sw, fit.sh, mediaFrameX, mediaFrameY, mediaFrameW, mediaFrameH);
	} else if (media.image) {
		const image = media.image;
		const fit = fitCover(image.naturalWidth || image.width, image.naturalHeight || image.height, mediaFrameW, mediaFrameH);
		ctx.drawImage(image, fit.sx, fit.sy, fit.sw, fit.sh, mediaFrameX, mediaFrameY, mediaFrameW, mediaFrameH);
	}

	ctx.restore();

	const mediaVignette = ctx.createLinearGradient(0, mediaFrameY + mediaFrameH * 0.2, 0, mediaFrameY + mediaFrameH);
	mediaVignette.addColorStop(0, 'rgba(0,0,0,0)');
	mediaVignette.addColorStop(1, 'rgba(0,0,0,0.48)');
	ctx.fillStyle = mediaVignette;
	ctx.fillRect(mediaFrameX, mediaFrameY, mediaFrameW, mediaFrameH);
	ctx.restore();

	ctx.save();
	ctx.fillStyle = theme.accent;
	ctx.font = `700 ${Math.round(width * 0.015)}px ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, sans-serif`;
	ctx.textBaseline = 'top';
	ctx.fillStyle = theme.badge;
	roundRectPath(ctx, cardX + 28, cardY + 26, 210, 46, 999);
	ctx.fill();
	ctx.fillStyle = theme.accent;
	ctx.fillText('Twoly memory', cardX + 48, cardY + 39);

	const slideLabel = `${String(sequenceIndex + 1).padStart(2, '0')} / ${String(sequenceLength).padStart(2, '0')}`;
	const slideWidth = ctx.measureText(slideLabel).width;
	roundRectPath(ctx, cardX + cardWidth - slideWidth - 62, cardY + 26, slideWidth + 40, 46, 999);
	ctx.fillStyle = theme.badge;
	ctx.fill();
	ctx.fillStyle = theme.accent;
	ctx.fillText(slideLabel, cardX + cardWidth - slideWidth - 42, cardY + 39);
	ctx.restore();

	ctx.save();
	const titleY = mediaFrameY + mediaFrameH + 42;
	ctx.fillStyle = theme.accent;
	ctx.font = `800 ${Math.round(width * 0.043)}px ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, sans-serif`;
	ctx.textBaseline = 'top';
	drawTextBlock(ctx, title, cardX + 28, titleY, cardWidth - 56, Math.round(width * 0.05), ctx.font, theme.accent, 2);

	let infoY = titleY + Math.round(width * 0.11);
	if (dateLabel) {
		ctx.fillStyle = theme.caption;
		ctx.font = `700 ${Math.round(width * 0.016)}px ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, sans-serif`;
		ctx.fillText(dateLabel.toUpperCase(), cardX + 30, infoY);
		infoY += Math.round(width * 0.032);
	}

	if (media.item.caption) {
		ctx.fillStyle = theme.accent;
		ctx.font = `500 ${Math.round(width * 0.02)}px ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, sans-serif`;
		drawTextBlock(ctx, media.item.caption, cardX + 30, infoY, cardWidth - 60, Math.round(width * 0.028), ctx.font, theme.accent, 2);
		infoY += Math.round(width * 0.08);
	}

	ctx.fillStyle = theme.badge;
	roundRectPath(ctx, cardX + 28, cardY + cardHeight - 84, 256, 50, 999);
	ctx.fill();
	ctx.fillStyle = theme.accent;
	ctx.font = `700 ${Math.round(width * 0.015)}px ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, sans-serif`;
	ctx.fillText(label.toUpperCase(), cardX + 48, cardY + cardHeight - 68);
	ctx.restore();
}

async function loadImage(src: string): Promise<HTMLImageElement> {
	const image: HTMLImageElement = document.createElement('img');
	image.crossOrigin = 'anonymous';
	await new Promise<void>((resolve, reject) => {
		image.addEventListener('load', () => resolve(), { once: true });
		image.addEventListener('error', () => reject(new Error(`Failed to load image: ${src}`)), { once: true });
		image.src = src;
	});
	return image;
}

async function loadVideo(src: string): Promise<HTMLVideoElement> {
	const video = document.createElement('video');
	video.crossOrigin = 'anonymous';
	video.src = src;
	video.preload = 'auto';
	video.muted = true;
	video.playsInline = true;
	video.loop = false;
	video.setAttribute('webkit-playsinline', 'true');
	await new Promise<void>((resolve, reject) => {
		video.onloadedmetadata = () => resolve();
		video.onerror = () => reject(new Error(`Failed to load video: ${src}`));
	});
	return video;
}

async function seekVideo(video: HTMLVideoElement, time: number): Promise<void> {
	const clampedTime = clamp(time, 0, Math.max(0, video.duration - 0.05));
	if (Math.abs(video.currentTime - clampedTime) < 0.02) return;
	await new Promise<void>((resolve, reject) => {
		const onSeeked = () => {
			cleanup();
			resolve();
		};
		const onError = () => {
			cleanup();
			reject(new Error('Failed to seek video frame.'));
		};
		const cleanup = () => {
			video.removeEventListener('seeked', onSeeked);
			video.removeEventListener('error', onError);
		};
		video.addEventListener('seeked', onSeeked, { once: true });
		video.addEventListener('error', onError, { once: true });
		video.currentTime = clampedTime;
	});
}

async function prepareResources(items: MemoryExportMediaItem[]): Promise<MediaResource[]> {
	return await Promise.all(
		items.map(async (item) => {
			const resource: MediaResource = {
				item,
				isVideo: isVideoMedia(item.photo_url, item.media_type)
			};

			if (resource.isVideo) {
				resource.video = await loadVideo(item.photo_url);
			} else {
				resource.image = await loadImage(item.photo_url);
			}

			return resource;
		})
	);
}

function createCanvas(size: ExportSize): { canvas: HTMLCanvasElement; ctx: CanvasRenderingContext2D } {
	const canvas = document.createElement('canvas');
	canvas.width = size.width;
	canvas.height = size.height;
	const ctx = canvas.getContext('2d');
	if (!ctx) throw new Error('Canvas context is not available.');
	ctx.imageSmoothingEnabled = true;
	ctx.imageSmoothingQuality = 'high';
	return { canvas, ctx };
}

function chooseVideoMimeType(): string {
	const supportedTypes = [
		'video/mp4;codecs=avc1.42E01E',
		'video/mp4',
		'video/webm;codecs=vp9',
		'video/webm;codecs=vp8',
		'video/webm'
	];

	return supportedTypes.find((type) => MediaRecorder.isTypeSupported(type)) || 'video/webm';
}

async function recordVideo(canvas: HTMLCanvasElement, drawTimeline: (timeSeconds: number) => Promise<void>, durationSeconds: number): Promise<Blob> {
	const mimeType = chooseVideoMimeType();
	const frameRate = VIDEO_FRAME_RATE;
	const stream = canvas.captureStream(frameRate);
	const recorder = new MediaRecorder(stream, {
		mimeType,
		videoBitsPerSecond: 10_000_000
	});
	const chunks: Blob[] = [];

	return await new Promise<Blob>((resolve, reject) => {
		recorder.ondataavailable = (event) => {
			if (event.data.size > 0) chunks.push(event.data);
		};
		recorder.onerror = () => reject(new Error('Failed to record export video.'));
		recorder.onstop = () => {
			resolve(new Blob(chunks, { type: mimeType }));
		};

		let cancelled = false;
		recorder.start();

		const step = async (timeSeconds: number) => {
			if (cancelled) return;
			await drawTimeline(timeSeconds);
		};

		let start = 0;
		const loop = async (timestamp: number) => {
			if (cancelled) return;
			if (!start) start = timestamp;
			const elapsed = (timestamp - start) / 1000;
			if (elapsed >= durationSeconds) {
				await step(durationSeconds);
				recorder.stop();
				return;
			}
			await step(elapsed);
			await waitForAnimationFrame();
			void loop(performance.now());
		};

		void loop(performance.now());
	});
}

function computeTimeline(items: MediaResource[]): Array<{ start: number; duration: number; resource: MediaResource }> {
	let cursor = 0;
	return items.map((resource) => {
		const duration = resource.isVideo ? Math.min(resource.video?.duration || VIDEO_PREVIEW_SECONDS, VIDEO_PREVIEW_SECONDS) : IMAGE_DISPLAY_SECONDS;
		const segment = { start: cursor, duration, resource };
		cursor += duration;
		return segment;
	});
}

function getSegmentAtTime(
	timeline: Array<{ start: number; duration: number; resource: MediaResource }>,
	timeSeconds: number
): { index: number; segment: { start: number; duration: number; resource: MediaResource } } {
	if (timeline.length === 0) throw new Error('No media available for export.');
	const totalDuration = timeline[timeline.length - 1].start + timeline[timeline.length - 1].duration;
	const wrappedTime = totalDuration > 0 ? timeSeconds % totalDuration : 0;
	const index = Math.max(
		0,
		timeline.findIndex((segment, segmentIndex) => {
			const nextStart = timeline[segmentIndex + 1]?.start ?? totalDuration;
			return wrappedTime >= segment.start && wrappedTime < nextStart;
		})
	);
	return { index, segment: timeline[index] };
}

export async function exportMemoryPoster(input: MemoryExportInput): Promise<Blob> {
	if (input.items.length === 0) throw new Error('No media available to export.');

	const size = getExportSize(input.aspect);
	const { canvas, ctx } = createCanvas(size);
	const selectedIndex = clamp(input.selectedIndex ?? 0, 0, input.items.length - 1);
	const resources = await prepareResources([input.items[selectedIndex]]);
	const resource = resources[0];
	const memoryItem = resource.item;

	if (resource.isVideo && resource.video) {
		await seekVideo(resource.video, Math.min(0.8, Math.max(0, (resource.video.duration || 1) - 0.1)));
	}

	drawExportFrame(ctx, size.width, size.height, input.theme, resource, 0, 1, 0.56, input.title, input.memoryDate);

	if (resource.isVideo && resource.video) {
		await seekVideo(resource.video, 0.8);
		drawExportFrame(ctx, size.width, size.height, input.theme, resource, 0, 1, 0.56, input.title, input.memoryDate);
	}

	const blob = await new Promise<Blob>((resolve) => canvas.toBlob((result) => resolve(result as Blob), 'image/png', 1));
	if (!blob) throw new Error('Failed to create poster image.');
	return blob;
}

export async function exportMemoryGif(input: MemoryExportInput, onProgress?: (progress: number) => void): Promise<Blob> {
	if (input.items.length === 0) throw new Error('No media available to export.');

	const size = getExportSize(input.aspect);
	const { canvas, ctx } = createCanvas(size);
	const resources = await prepareResources(getSequence(input.items, input.selectedIndex ?? 0));
	const timeline = computeTimeline(resources);
	const durationSeconds = timeline.length > 0 ? timeline[timeline.length - 1].start + timeline[timeline.length - 1].duration : 0;
	const frameDelay = Math.round(1000 / GIF_FRAME_RATE);
	const totalFrames = Math.max(1, Math.ceil(durationSeconds * GIF_FRAME_RATE));
	const gif = GIFEncoder();
	let firstFrame = true;

	for (let frameIndex = 0; frameIndex < totalFrames; frameIndex += 1) {
		const timeSeconds = frameIndex / GIF_FRAME_RATE;
		const { index, segment } = getSegmentAtTime(timeline, timeSeconds);
		const localTime = timeSeconds - segment.start;
		const progress = clamp(localTime / Math.max(segment.duration, 0.001), 0, 1);

		if (segment.resource.isVideo && segment.resource.video) {
			await seekVideo(segment.resource.video, localTime);
		}

		drawExportFrame(ctx, size.width, size.height, input.theme, segment.resource, index, timeline.length, progress, input.title, input.memoryDate);

		const imageData = ctx.getImageData(0, 0, size.width, size.height);
		const palette = quantize(imageData.data, 256);
		const indexed = applyPalette(imageData.data, palette);
		gif.writeFrame(indexed, size.width, size.height, {
			palette,
			delay: frameDelay,
			first: firstFrame,
			repeat: 0
		});
		firstFrame = false;
		onProgress?.((frameIndex + 1) / totalFrames);
	}

	gif.finish();
	return new Blob([gif.bytes()], { type: 'image/gif' });
}

export async function exportMemoryVideo(input: MemoryExportInput, onProgress?: (progress: number) => void): Promise<Blob> {
	if (input.items.length === 0) throw new Error('No media available to export.');

	const size = getExportSize(input.aspect);
	const { canvas, ctx } = createCanvas(size);
	const resources = await prepareResources(getSequence(input.items, input.selectedIndex ?? 0));
	const timeline = computeTimeline(resources);
	const durationSeconds = timeline.length > 0 ? timeline[timeline.length - 1].start + timeline[timeline.length - 1].duration : 0;

	for (const resource of resources) {
		if (resource.isVideo && resource.video) {
			resource.video.muted = true;
			try {
				await resource.video.play();
				resource.video.pause();
			} catch {
				// Some browsers refuse silent autoplay even after user gesture; seeking still works.
			}
		}
	}

	const blob = await recordVideo(canvas, async (timeSeconds) => {
		const { index, segment } = getSegmentAtTime(timeline, timeSeconds);
		const localTime = timeSeconds - segment.start;
		const progress = clamp(localTime / Math.max(segment.duration, 0.001), 0, 1);

		if (segment.resource.isVideo && segment.resource.video) {
			try {
				if (segment.resource.video.paused) {
					await segment.resource.video.play();
				}
				await seekVideo(segment.resource.video, localTime);
			} catch {
				// ignore and draw last available frame
			}
		}

		drawExportFrame(ctx, size.width, size.height, input.theme, segment.resource, index, timeline.length, progress, input.title, input.memoryDate);
		onProgress?.(clamp(timeSeconds / Math.max(durationSeconds, 0.001), 0, 1));
	}, durationSeconds);

	return blob;
}

export async function shareOrDownloadBlob(blob: Blob, fileName: string): Promise<void> {
	const file = new File([blob], fileName, { type: blob.type });

	if (navigator.canShare?.({ files: [file] }) && navigator.share) {
		await navigator.share({ files: [file], title: fileName.replace(/\.[^.]+$/, '') });
		return;
	}

	const url = URL.createObjectURL(blob);
	const anchor = document.createElement('a');
	anchor.href = url;
	anchor.download = fileName;
	anchor.rel = 'noopener';
	document.body.appendChild(anchor);
	anchor.click();
	anchor.remove();
	setTimeout(() => URL.revokeObjectURL(url), 1000);
}

export function createMemoryExportFileName(title: string, format: MemoryExportFormat, mimeType?: string): string {
	const base = sanitizeFileName(title);

	if (format === 'gif') {
		return `${base}.gif`;
	}

	if (format === 'png') {
		return `${base}.png`;
	}

	if (mimeType?.includes('mp4')) {
		return `${base}.mp4`;
	}

	return `${base}.webm`;
}

export function getMemoryExportAspectLabel(aspect: MemoryExportAspect): string {
	switch (aspect) {
		case 'square':
			return '1:1';
		case 'feed':
			return '4:5';
		case 'story':
			return '9:16';
		case 'landscape':
			return '16:9';
	}
}

export function getMemoryExportThemeLabel(theme: MemoryExportTheme): string {
	return getTheme(theme).name;
}

export function getMemoryExportThemeCaption(theme: MemoryExportTheme): string {
	return getTheme(theme).caption;
}

export function getMemoryExportSize(aspect: MemoryExportAspect): ExportSize {
	return getExportSize(aspect);
}
