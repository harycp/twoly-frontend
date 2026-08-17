export type DrawingTool = 'pen' | 'brush' | 'eraser';

export interface StrokePoint {
	x: number; // Normalized 0-1
	y: number; // Normalized 0-1
	p?: number; // Pressure 0-1 (optional)
}

export interface StrokeRecord {
	id: string;
	senderId: string;
	tool: DrawingTool;
	color: string;
	width: number;
	opacity: number;
	points: StrokePoint[];
	timestamp: number;
}

export type BroadcastPayload =
	| {
			type: 'stroke_start';
			stroke: StrokeRecord;
	  }
	| {
			type: 'stroke_chunk';
			strokeId: string;
			points: StrokePoint[];
	  }
	| {
			type: 'stroke_end';
			strokeId: string;
	  }
	| {
			type: 'action';
			action: 'undo' | 'redo' | 'clear';
			strokeId?: string;
			senderId: string;
	  }
	| {
			type: 'cursor_move';
			senderId: string;
			senderName: string;
			x: number;
			y: number;
			isDrawing: boolean;
	  }
	| {
			type: 'bg_change';
			bgColor: string;
			senderId: string;
	  };

export interface DoodleItem {
	id: string;
	couple_id: string;
	saved_by_id: string;
	saved_by_name?: string;
	image_url: string;
	thumbnail_url?: string;
	title?: string | null;
	stroke_count: number;
	storage_provider: string;
	created_at: string;
}

export interface ActiveCanvasPayload {
	strokes: StrokeRecord[];
	bgColor: string;
}

export interface ActiveCanvasData {
	couple_id: string;
	strokes: string;
	updated_by_id?: string;
	updated_at: string;
}
