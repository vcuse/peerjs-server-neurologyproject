import express from "express";
import type { IConfig } from "../../../config/index.ts";
import type { IRealm } from "../../../models/realm.ts";
import { PostgrestClient } from "@supabase/postgrest-js";
import * as jose from 'jose';
import { TextEncoder } from "util";
import { exit } from "process";

import pg from "pg";

// Create a new pool (connection pool)
const client = new pg.Client({
	user: 'postgres',
	host: '34.73.142.252',
	database: 'postgres',
	password: 'root123',
	port: 5432,
});

client.connect();
client.query("SELECT * FROM basic_auth.users", (err, res) => {
	if(!err){
		console.log(res.rows);
	}
	else{
		console.log(err.message);
	}
});

/*const REST_URL = 'http://localhost:3000';
const postgrest = new PostgrestClient(REST_URL);

const { error } = await postgrest.rpc('login', { username: "adminuser", pass: '123' })
		if(error){
			console.log(error);
			exit(1);
		}*/

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

	app.use(express.json());
	app.post("/post", async (req, res) => {
		// Requests for logging in
		if(req.headers['action'] === 'login'){
			// First check to make sure user isn't already logged in
			const { error } = await postgrest.rpc('check_if_user_online', { username: req.body.username })
			if(error){
				res.send(error.message);
			}
			else{
				const { data, error } = await postgrest.rpc('login', { username: req.body.username, pass: req.body.password })
				if(error){
					res.send(error.message);
				}
				const secret = new TextEncoder().encode('YOUR_STRONG_JWT_SECRET');
				const { payload, protectedHeader } = await jose.jwtVerify(data.token, secret);
				if(payload && protectedHeader){
					res.send(data);
				}
			}
		}

		// Requests for creating accounts
		if(req.headers['action'] === 'create'){
			const { error } = await postgrest.rpc('create_account', { username: req.body.username, pass: req.body.password })
			if(error){
				res.send('Account already in use');
			}
			else{
				res.send("Account successfully created");
			}
		}
		
		// Changing online status to being online
		if(req.headers['action'] === 'online'){
			const { error } = await postgrest.rpc('set_user_online', { name: req.body.username, id: req.body.id })
			if(error){
				console.log(error);
			}
			res.send(`User ${req.body.username} has id ${req.body.id}`);
		}
	});
	return app;
};

// Function for changing status to offline
export async function goOffline(id: string){
	const { error } = await postgrest.rpc('set_user_offline', { id: id })
	if(error){
		console.log(error);
	}
}