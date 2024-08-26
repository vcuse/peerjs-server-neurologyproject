import { MessageType } from "../enums.ts";
import apn from '@parse/node-apn';
import { HeartbeatHandler, TransmissionHandler, IOSTransmissionHandler } from "./handlers/index.ts";
import type { IHandlersRegistry } from "./handlersRegistry.ts";
import { HandlersRegistry } from "./handlersRegistry.ts";
import type { IClient } from "../models/client.ts";
import type { IMessage } from "../models/message.ts";
import type { IRealm } from "../models/realm.ts";
import type { Handler } from "./handler.ts";



export interface IMessageHandler {
	handle(client: IClient | undefined, message: IMessage): boolean;
}

export class MessageHandler implements IMessageHandler {
	constructor(
		realm: IRealm, apnProvider: apn.Provider,
		private readonly handlersRegistry: IHandlersRegistry = new HandlersRegistry(),
	) {
		const transmissionHandler: Handler = TransmissionHandler({ realm,  apnProvider});
		const heartbeatHandler: Handler = HeartbeatHandler;
		const iOSTransmissionHandler: Handler = IOSTransmissionHandler({realm, apnProvider});

		const handleTransmission: Handler = (
			client: IClient | undefined,
			{ type, src, dst, payload }: IMessage,
		): boolean => {
			return transmissionHandler(client, {
				type,
				src,
				dst,
				payload,
			});
		};

        const handleIOSTransmission: Handler = (
                                     			client: IClient | undefined,
                                     			{ type, src, dst, payload }: IMessage,
                                     		): boolean => {

                return iOSTransmissionHandler(client, {
                                             				type,
                                             				src,
                                             				dst,
                                             				payload,
                                             			});

             };


		const handleHeartbeat = (client: IClient | undefined, message: IMessage) =>
			heartbeatHandler(client, message);

		this.handlersRegistry.registerHandler(
			MessageType.HEARTBEAT,
			handleHeartbeat,
		);
		this.handlersRegistry.registerHandler(
			MessageType.OFFER,
			handleTransmission,
		);
		this.handlersRegistry.registerHandler(
			MessageType.ANSWER,
			handleTransmission,
		);
		this.handlersRegistry.registerHandler(
			MessageType.CANDIDATE,
			handleTransmission,
		);
		this.handlersRegistry.registerHandler(
			MessageType.LEAVE,
			handleTransmission,
		);
		this.handlersRegistry.registerHandler(
			MessageType.EXPIRE,
			handleTransmission,
		);
		this.handlersRegistry.registerHandler(
        			MessageType.IOSCLIENT,
        			handleIOSTransmission,
        );
        this.handlersRegistry.registerHandler(
                			MessageType.DISCONNECT,
                			handleTransmission,
        );
	}

	public handle(client: IClient | undefined, message: IMessage): boolean {
		return this.handlersRegistry.handle(client, message);
	}
}
