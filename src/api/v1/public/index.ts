import express from "express";
import type { IConfig } from "../../../config/index.ts";
import type { IRealm } from "../../../models/realm.ts";
import pg from 'pg';

let usernames: string[] = []; // Feel free to change to whatever data you want to display

/*
	You need a postgreSQL database for this to work
	Your password goes into the password property
	Your database name goes into the database property
*/
const client = new pg.Client({
	host: "localhost",
	user: "postgres",
	port: 5432,
	password: "YOUR_POSTGRES_PASSWORD",
	database: "YOUR_DATABASE_NAME"
});

client.connect();

/*
	Replace "YOUR_QUERY" with the query of your choice
	If you don't know sql, a good start would be:
		 "SELECT * FROM table_name",
		 replacing table_name with the
		 name of your table
*/
client.query("YOUR_QUERY", (err, res) => {
	if(!err){
		usernames = res.rows;
	}
	else{
		console.log(err.message);
	}
	client.end;
});

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
	app.get("/usernames", (_, res: express.Response) => {
		return res.send(usernames);
	})

	return app;
};
