import type WebSocket from "ws";

export interface IClient {
	getId(): string;

	getToken(): string;

	getSocket(): WebSocket | null;

	setSocket(socket: WebSocket | null): void;

	setiOSToken(token: string): void;

	getLastPing(): number;

	getiOSToken(): string;

	isIOS(): boolean;

	setLastPing(lastPing: number): void;

	send<T>(data: T): void;
}

export class Client implements IClient {
	private readonly id: string;
	private readonly token: string;
	private iOSToken: string;
	private ios: boolean = false;
	private socket: WebSocket | null = null;
	private lastPing: number = new Date().getTime();

	constructor({ id, token }: { id: string; token: string }) {
		this.id = id;
		this.token = token;
		this.iOSToken = "nil";
	}

	public getId(): string {
		return this.id;
	}

	public getToken(): string {
		return this.token;
	}

    public getiOSToken(): string {
       return this.iOSToken
    }
	public getSocket(): WebSocket | null {
		return this.socket;
	}

	public setSocket(socket: WebSocket | null): void {
		this.socket = socket;
	}

    public setiOSToken(token: string){
        this.iOSToken = token;
        this.ios = true;
    }

    public isIOS(){
        return this.ios;
    }
	public getLastPing(): number {
		return this.lastPing;
	}

	public setLastPing(lastPing: number): void {
		this.lastPing = lastPing;
	}

	public send<T>(data: T): void {
		this.socket?.send(JSON.stringify(data));
	}
}
