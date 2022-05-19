import express, { json } from 'express'; // server
import cors from 'cors'; // Cross-Origin Resource Sharing
import dotenv from 'dotenv'; // environment variables

dotenv.config();
const app = express();

app.use(json()); // middleware
app.use(cors()); // middleware

const port = process.env.PORT || 5000 ; // establishing the port -> production or development

app.get('/', (_req, res) => {
	res.send('Online');
});

app.listen(port, () => {
	console.log(`Server started on port ${port}`);
});