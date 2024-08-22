import { MessageType } from "../../../enums.ts";
import type { IClient } from "../../../models/client.ts";
import type { IMessage } from "../../../models/message.ts";
import type { IRealm } from "../../../models/realm.ts";
import apn from '@parse/node-apn';

export const TransmissionHandler = ({
	realm,  apnProvider
}: {
	realm: IRealm, apnProvider: apn.Provider;
}): ((client: IClient | undefined, message: IMessage) => boolean) => {
	const handle = (client: IClient | undefined, message: IMessage) => {
		const type = message.type;
		const srcId = message.src;
		const dstId = message.dst;
		const payload = message.payload;




		const destinationClient = realm.getClientById(dstId);

		// User is connected!
		if (destinationClient) {
			const socket = destinationClient.getSocket();


			try {
				if (socket) {

                    if(payload != null && payload["type"] == "media" && destinationClient.isIOS() && type == MessageType.OFFER ){
                                                            console.log("making ios notif");

                         var deviceToken = destinationClient.getiOSToken();
                         var note = new apn.Notification();
                            note.expiry = 0; // Expires 1 hour from now.
                            note.badge = 3;
                            note.sound = "ping.aiff";
                            note.alert = "\uD83D\uDCE7 \u2709 You have a new message";
                            note.payload = {'messageFrom': 'John Appleseed'};
                            note.topic = "vcuse.Neuro-App.voip";
                            apnProvider.send(note, deviceToken).then( (response) => {
                                    		// response.sent: Array of device tokens to which the notification was sent succesfully
                                    		// response.failed: Array of objects containing the device token (`device`) and either an `error`, or a `status` and `response` from the API
                                    console.log("Sent Notification to iphone", response, JSON.stringify(response, null, 2));
                                    });
                    }


					const data = JSON.stringify(message);

					socket.send(data);
				} else {
					// Neither socket no res available. Peer dead?
					throw new Error("Peer dead");
				}
			} catch (e) {
				// This happens when a peer disconnects without closing connections and
				// the associated WebSocket has not closed.
				// Tell other side to stop trying.
				if (socket) {
					socket.close();
				} else {
					realm.removeClientById(destinationClient.getId());
				}

				handle(client, {
					type: MessageType.LEAVE,
					src: dstId,
					dst: srcId,
				});
			}
		} else {
			// Wait for this client to connect/reconnect (XHR) for important
			// messages.
			const ignoredTypes = [MessageType.LEAVE, MessageType.EXPIRE];

			if (!ignoredTypes.includes(type) && dstId) {
				realm.addMessageToQueue(dstId, message);
			} else if (type === MessageType.LEAVE && !dstId) {
				realm.removeClientById(srcId);
			} else {
				// Unavailable destination specified with message LEAVE or EXPIRE
				// Ignore
			}
		}

		return true;
	};

	return handle;
};
