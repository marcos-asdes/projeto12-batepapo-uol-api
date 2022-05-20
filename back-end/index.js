import express, { json } from 'express'; // server
import cors from 'cors'; // Cross-Origin Resource Sharing
import dotenv from 'dotenv'; // environment variables

import router from './routes/router.js'

const app = express();

app.use(json()); // middleware
app.use(cors()); // middleware
dotenv.config();
app.use(router);

const port = process.env.PORT || 5000 ; // establishing the port -> production or development

app.listen(port, () => {
	console.log(`Server started on port ${port}`);
});

/* time controller */

import database from './database/MongoClient.js';
import dayjs from 'dayjs';

const TIME_TO_CHECK = 15 * 1000; // 15s
setInterval(async () => {
    const seconds = Date.now() - (10 * 1000); // 10s
    try {
        const inactiveParticipants = await database.collection('participants').find({ lastStatus: { $lte: seconds } }).toArray(); // $lte equal to <=  
        if (inactiveParticipants.length > 0) {
            const inativeMessages = inactiveParticipants.map(inactiveParticipant => {
            return {
                from: inactiveParticipant.name,
                to: 'Todos',
                text: 'sai da sala...',
                type: 'status',
                time: dayjs().format('HH:mm:ss')
            }
        });
        await database.collection('messages').insertMany(inativeMessages);
        await database.collection('participants').deleteMany({ lastStatus: { $lte: seconds } }); // $lte equal to <= 
        }
    } catch (e) {
        console.log(error);
        res.status(500).send({
            message: 'Error removing inactive user',
            detail: error
        });
    }
}, TIME_TO_CHECK);