import express from "express";
import type { IConfig } from "../../../config/index.ts";
import type { IRealm } from "../../../models/realm.ts";
import { PostgrestClient } from "@supabase/postgrest-js";

const REST_URL = 'http://localhost:3000';
const postgrest = new PostgrestClient(REST_URL);

let userData: any[];
let onlineUsers: { username: any; id: any; }[] = [];

// Load the data for the first time
const { data, error } = await postgrest
	.from('users')
	.select()

	if(error){
		console.log(error);
	}
	else{
		userData = data;
	}

// Function used to reload data to ensure it's up to date
async function reloadData(){
	const { data, error } = await postgrest
	.from('users')
	.select()

	if(error){
		console.log(error);
	}
	else{
		userData = data;
	}
}

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

	// Get a list of all the usernames (can change this to whatever)
	app.get("/users", (_, res: express.Response) => {
		reloadData();
		return res.send(onlineUsers);
	});

	// Requests for logging in and changing online status
	app.use(express.json());
	app.post("/post", async (req, res) => {
		await reloadData();
		if(req.headers['action'] === 'login'){
			let online = false;
			userData?.forEach(element => {
				if(element.username === req.body.username && element.online){
					online = true;
					res.send(`User ${element.username} is already online. No more than one active session is permitted.`);
				}
			});
			if(!online){
				let authenticated = false;
				userData?.forEach(element => {
					if(element.username === req.body.username && element.password === req.body.password){
						authenticated = true;
					}
				});
				if(authenticated){
					res.send("ACCESS GRANTED");
				}
				else{
					res.send("ACCESS DENIED");
				}
			}
		}
		if(req.headers['action'] === 'create'){
			let taken = false;
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
			}
		}
		if(req.headers['action'] === 'online'){
			const { error } = await postgrest
			.from('users')
			.update({ call_id: req.body.id, online: true })
			.eq('username', req.body.username)
			if(error){
				console.log(error);
			}
			onlineUsers.push({ username: req.body.username, id: req.body.id });
			res.send(`User ${req.body.username} has id ${req.body.id}`);
		}
	});
	return app;
};

export async function goOffline(id: string){
	let username;
	onlineUsers.forEach(user => {
		if(user.id === id){
			username = user.username;
		}
	});

	const { error } = await postgrest
	.from('users')
	.update({ call_id: null, online: false })
	.eq('username', username)
	if(error){
		console.log(error);
	}
	const index = onlineUsers.indexOf({ username: username, id: id });
	onlineUsers.splice(index, 1);
}