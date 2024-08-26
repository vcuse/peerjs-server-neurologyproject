import type { IClient } from "../../../models/client.ts";
import { MessageType } from "../../../enums.ts";
import apn from 'node-apn';
import type { IMessage } from "../../../models/message.ts";
import type { IRealm } from "../../../models/realm.ts";


export const IOSTransmissionHandler = ({
                                    	realm, apnProvider,
                                    }: {
                                    	realm: IRealm, apnProvider: apn.Provider;
                                    }): ((client: IClient | undefined, message: IMessage) => boolean) => {
                                    	const handle = (client: IClient | undefined, message: IMessage) => {
		const src = message.src;
		const type = message.type;
        const payload = message.payload;

        const iosSrc = realm.getClientById(src);

        if (payload) {
            iosSrc.setiOSToken(payload);
        } else {
            console.log("Payload is undefined or not a string.");
        }

		if(type == MessageType.IOSCLIENT){
            console.log("IOSClient Message ", type, src, payload);
        }
        return true;
	}

    return handle;
};


