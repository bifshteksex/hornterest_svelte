export interface Pin {
	id: number;
	path: string;
	description: string;
	user_id: number;
	original: string | null;
	comment: boolean;
	ai: boolean;
	type: string | null;
	title: string | null | undefined;
	width: number | null;
	height: number | null;
	duration: number | null;
}
