import express from "express";
import type { IConfig } from "../../../config/index.ts";
import type { IRealm } from "../../../models/realm.ts";
import * as jose from 'jose';
import { TextEncoder } from "util";
import pg from "pg";

// Create a new pool (connection pool)
const pgClient = new pg.Client({
	user: 'postgres',
	host: '34.73.142.252',
	database: 'postgres',
	password: 'root123',
	port: 5432,
});

await pgClient.connect();

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
		res.setHeader('Access-Control-Allow-Origin', '*');
		res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
		res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
		// Requests for logging in
		if(req.headers['action'] === 'login'){
			// First check to make sure user isn't already logged in
			let result;
			let loggedIn = false;
			
			try{
				result = await pgClient.query('SELECT check_if_user_online($1)', [req.body.username]);
			} catch(error){
				loggedIn = true;
				res.send("No more than one active session per user is allowed");
				result = null;
			}

			if(!loggedIn){
				let authenticated = true;
				try{
					result = await pgClient.query('SELECT login($1, $2)', [req.body.username, req.body.password]);
				} catch(error){
					authenticated = false;
	
					res.send("Invalid username or password");
				}
				if(authenticated){
					const secret = new TextEncoder().encode('hfgfgfFHF6745%#()*%^7827GSIKJ14577848gjdfHUI7837678&%#^&GUHIUF893YH4*(^*7HFUS7548WH');
					const { payload, protectedHeader } = await jose.jwtVerify(result.rows[0].login, secret);
					if(payload && protectedHeader){
						res.send(result);
					}
			}
			}
		}

		// Requests for creating accounts
		if(req.headers['action'] === 'create'){
			let result;
			let accountUsed = false;
			try{
				result = await pgClient.query('SELECT create_account($1, $2)', [req.body.username, req.body.password]);
			} catch(error){
				accountUsed = true;
				res.send('Account already in use');
			}
			if(!accountUsed){
				res.send("Account successfully created");
			}
		}
		
		// Changing online status to being online
		if(req.headers['action'] === 'online'){
			await pgClient.query('SELECT set_user_online($1, $2)', [req.body.username, req.body.id])
			res.send(`User ${req.body.username} has id ${req.body.id}`);
		}
	});
	return app;
};

// Function for changing status to offline
export async function goOffline(id: string){
	try{
		await pgClient.query('SELECT set_user_offline($1)', [id])
	} catch(error){
		console.log(error);
	}
}