import { apiService } from './api.service';
import type { DoodleItem, ActiveCanvasData, StrokeRecord } from '../types/doodle.types';

class DoodleService {
	async saveDoodle(blob: Blob, title?: string, strokeCount: number = 0): Promise<DoodleItem> {
		const formData = new FormData();
		formData.append('image', blob, `doodle_${Date.now()}.webp`);
		if (title) formData.append('title', title.trim());
		formData.append('stroke_count', strokeCount.toString());

		return apiService.post<DoodleItem>('/doodles', formData);
	}

	async getDoodles(): Promise<DoodleItem[]> {
		return apiService.get<DoodleItem[]>('/doodles');
	}

	async getDoodleById(id: string): Promise<DoodleItem> {
		return apiService.get<DoodleItem>(`/doodles/${id}`);
	}

	async deleteDoodle(id: string): Promise<void> {
		return apiService.delete<void>(`/doodles/${id}`);
	}

	async getActiveCanvas(): Promise<StrokeRecord[]> {
		try {
			const res = await apiService.get<ActiveCanvasData>('/doodles/active');
			if (!res || !res.strokes) return [];
			return JSON.parse(res.strokes);
		} catch {
			return [];
		}
	}

	async syncActiveCanvas(strokes: StrokeRecord[]): Promise<void> {
		try {
			await apiService.put<void>('/doodles/active', {
				strokes: JSON.stringify(strokes)
			});
		} catch {
			// ignore sync failure
		}
	}
}

export const doodleService = new DoodleService();
