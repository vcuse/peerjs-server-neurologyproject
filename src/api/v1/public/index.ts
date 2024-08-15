import express from "express";
import type { IConfig } from "../../../config/index.ts";
import type { IRealm } from "../../../models/realm.ts";
import { PostgrestClient } from "@supabase/postgrest-js";
import * as jose from 'jose';
import { TextEncoder } from "util";

const REST_URL = 'http://localhost:3000';
const postgrest = new PostgrestClient(REST_URL);

let onlineUsers: { username: any; id: any; }[] = [];

export default ({
	config,
	realm,
}: {
	config: IConfig;
	realm: IRealm;
}): express.Router => {
	const app = express.Router();

	// Retrieve guaranteed random ID.
	app.get("/id", (_, res: express.Response) => {
		res.contentType("html");
		res.send(realm.generateClientId(config.generateClientId));
	});

	// Get a list of all peers for a key, enabled by the `allowDiscovery` flag.
	app.get("/peers", (_, res: express.Response) => {
		if (config.allow_discovery) {
			const clientsIds = realm.getClientsIds();

			return res.send(clientsIds);
		}

		return res.sendStatus(401);
	});

	// Requests for logging in and changing online status
	app.use(express.json());
	app.post("/post", async (req, res) => {
		if(req.headers['action'] === 'login'){
			const { data, error } = await postgrest.rpc('login', { username: req.body.username, pass: req.body.password })
			if(error){
				res.send(error.message);
			}
			const secret = new TextEncoder().encode('hfgfgfFHF6745%#()*%^7827GSIKJ14577848gjdfHUI7837678&%#^&GUHIUF893YH4*(^*7HFUS7548WH');
			const { payload, protectedHeader } = await jose.jwtVerify(data.token, secret);
			if(payload && protectedHeader){
				res.send(data);
			}
		}
		if(req.headers['action'] === 'create'){
			const { error } = await postgrest
  			.from('users')
  			.insert({ username: req.body.username, pass: req.body.password, role: 'anon' })
			if(error){
				res.send(error);
			}
			else{
				res.send("Account successfully created.");
			}
			/*let taken = false;
			userData?.forEach(element => {
				if(element.username === req.body.username){ 
					taken = true;
				}
			});
			if(taken){
				res.send("Username is already in use.");
			}
			else{
				const { error } = await postgrest
  				.from('users')
  				.insert({ username: req.body.username, password: req.body.password, online: false })
				if(error){
					res.send(error);
					console.log(error);
				}
				res.send("Account successfully created.");
			}*/
		}
		if(req.headers['action'] === 'online'){
			const { error } = await postgrest.rpc('update_online_status', { name: req.body.username, status: true })
			if(error){
				console.log(error);
			}
			res.send(`User ${req.body.username} has id ${req.body.id}`);
		}
	});
	return app;
};

export async function goOffline(id: string){
	const username = 'adam';
	const { error } = await postgrest.rpc('update_online_status', { name: username, status: false })
	if(error){
		console.log(error);
	}
}