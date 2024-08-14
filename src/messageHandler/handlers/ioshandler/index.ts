import type { IClient } from "../../../models/client.ts";
import { MessageType } from "../../../enums.ts";
import type { IMessage } from "../../../models/message.ts";

export const IOSTransmissionHandler = (client: IClient | undefined, message: IMessage): boolean => {

        console.log("IOSClient Message ")


       return true;
};


