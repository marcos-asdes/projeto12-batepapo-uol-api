import { MongoClient } from 'mongodb';
import dotenv from 'dotenv';

dotenv.config();

let database = null;

const mongoClient = new MongoClient(process.env.MONGO_URL);

try {
	await mongoClient.connect();
	database = mongoClient.db(process.env.DATABASE);
	console.log(`Connected to database ${database.databaseName}`);
} catch (error) {
	console.log(`${error}`);
}

export default database;