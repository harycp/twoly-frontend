import type { StrokePoint, StrokeRecord } from '../types/doodle.types';

/**
 * Distance from point p to line segment (v, w)
 */
function getSqSegDist(p: StrokePoint, v: StrokePoint, w: StrokePoint): number {
	let x = v.x,
		y = v.y,
		dx = w.x - x,
		dy = w.y - y;

	if (dx !== 0 || dy !== 0) {
		const t = ((p.x - x) * dx + (p.y - y) * dy) / (dx * dx + dy * dy);
		if (t > 1) {
			x = w.x;
			y = w.y;
		} else if (t > 0) {
			x += dx * t;
			y += dy * t;
		}
	}

	dx = p.x - x;
	dy = p.y - y;
	return dx * dx + dy * dy;
}

/**
 * Ramer-Douglas-Peucker simplification for smooth strokes with minimal payload
 */
export function simplifyPoints(points: StrokePoint[], tolerance: number = 0.0015): StrokePoint[] {
	if (points.length <= 2) return points;

	const sqTolerance = tolerance * tolerance;
	const last = points.length - 1;
	const simplified: StrokePoint[] = [points[0]];

	function simplifySection(start: number, end: number) {
		let maxSqDist = sqTolerance;
		let index = -1;

		for (let i = start + 1; i < end; i++) {
			const sqDist = getSqSegDist(points[i], points[start], points[end]);
			if (sqDist > maxSqDist) {
				index = i;
				maxSqDist = sqDist;
			}
		}

		if (index > -1) {
			if (start + 1 < index) simplifySection(start, index);
			simplified.push(points[index]);
			if (index + 1 < end) simplifySection(index, end);
		}
	}

	simplifySection(0, last);
	simplified.push(points[last]);
	return simplified;
}

/**
 * Render a smooth stroke onto a 2D Canvas context using quadratic curve interpolation
 */
export function drawStroke(
	ctx: CanvasRenderingContext2D,
	stroke: StrokeRecord,
	widthScale: number = 1,
	heightScale: number = 1
) {
	if (stroke.points.length === 0) return;

	ctx.save();
	ctx.lineCap = 'round';
	ctx.lineJoin = 'round';

	if (stroke.tool === 'eraser') {
		ctx.globalCompositeOperation = 'destination-out';
		ctx.lineWidth = stroke.width;
	} else {
		ctx.globalCompositeOperation = 'source-over';
		ctx.strokeStyle = stroke.color;
		ctx.lineWidth = stroke.width;
		ctx.globalAlpha = stroke.tool === 'brush' ? stroke.opacity * 0.85 : stroke.opacity;
	}

	const pts = stroke.points;

	if (pts.length === 1) {
		ctx.beginPath();
		ctx.arc(pts[0].x * widthScale, pts[0].y * heightScale, stroke.width / 2, 0, Math.PI * 2);
		ctx.fillStyle = ctx.strokeStyle;
		ctx.fill();
		ctx.restore();
		return;
	}

	ctx.beginPath();
	ctx.moveTo(pts[0].x * widthScale, pts[0].y * heightScale);

	if (pts.length === 2) {
		ctx.lineTo(pts[1].x * widthScale, pts[1].y * heightScale);
	} else {
		for (let i = 1; i < pts.length - 1; i++) {
			const xc = ((pts[i].x + pts[i + 1].x) / 2) * widthScale;
			const yc = ((pts[i].y + pts[i + 1].y) / 2) * heightScale;
			ctx.quadraticCurveTo(pts[i].x * widthScale, pts[i].y * heightScale, xc, yc);
		}
		const last = pts.length - 1;
		ctx.lineTo(pts[last].x * widthScale, pts[last].y * heightScale);
	}

	ctx.stroke();
	ctx.restore();
}

/**
 * Export canvas to WebP/PNG Blob with optional background fill
 */
export async function exportCanvasToBlob(
	canvas: HTMLCanvasElement,
	bgColor: string = '#FFF7ED',
	type: string = 'image/webp',
	quality: number = 0.92
): Promise<Blob> {
	const offscreen = document.createElement('canvas');
	offscreen.width = canvas.width;
	offscreen.height = canvas.height;
	const ctx = offscreen.getContext('2d');
	if (!ctx) throw new Error('Could not get 2D context for export');

	if (bgColor) {
		ctx.fillStyle = bgColor;
		ctx.fillRect(0, 0, offscreen.width, offscreen.height);
	}

	ctx.drawImage(canvas, 0, 0);

	return new Promise<Blob>((resolve, reject) => {
		offscreen.toBlob(
			(blob) => {
				if (blob) resolve(blob);
				else reject(new Error('Canvas export to blob failed'));
			},
			type,
			quality
		);
	});
}
