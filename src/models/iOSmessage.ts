import type { MessageType } from "../enums.ts";

export interface IOSMessage {
	readonly type: MessageType;
	//readonly src: string;
}
