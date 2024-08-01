import express from "express";
import type { IConfig } from "../../../config/index.ts";
import type { IRealm } from "../../../models/realm.ts";
import { PostgrestClient } from "@supabase/postgrest-js";

const REST_URL = 'http://localhost:3000';
const postgrest = new PostgrestClient(REST_URL);

let userData: any[];

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

const { data, error } = await postgrest
	.from('users')
	.select()

	if(error){
		console.log(error);
	}
	else{
		userData = data;
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
		return res.send(userData);
	});

	// Requests for logging in
	app.use(express.json());
	app.post("/post", async (req, res) => {
		if(req.headers['action'] == 'login'){
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
			res.send(`User ${req.body.username} has id ${req.body.id}`);
		}
		if(req.headers['action'] === 'offline'){
			const { error } = await postgrest
			.from('users')
			.update({ call_id: null, online: false })
			.eq('username', req.body.username)
			if(error){
				console.log(error);
			}
		}
		reloadData();
	});

	return app;
};
