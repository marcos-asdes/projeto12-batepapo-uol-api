import express, { json } from 'express'; // server
import cors from 'cors'; // Cross-Origin Resource Sharing
import dotenv from 'dotenv'; // environment variables

/*  */
import database from './database/MongoClient.js';
import joi from 'joi';
import dayjs from 'dayjs';
/*  */

const app = express();

app.use(json()); // middleware
app.use(cors()); // middleware
dotenv.config();

const port = process.env.PORT || 5000 ; // establishing the port -> production or development

/*  */

app.post('/participants', signUp);
app.get('/participants', getParticipants);

async function signUp(req, res) {
    const participant = req.body; // {name: 'joão'}
    const participantSchema = joi.object({ name: joi.string().min(1).required() });
    const { error } = participantSchema.validate(participant); // {value: info, [error]}

    if (error) {
        console.log(error);
        return res.sendStatus(422);
    }

    try {
        const participantExists = await database.collection('participants').findOne({ name: participant.name });
        if (participantExists) {
            return res.sendStatus(409);
        }
        await database.collection('participants').insertOne({name: participant.name, lastStatus: Date.now() });
        console.log(`${participant.name} registered successfully`);
        await database.collection('messages').insertOne({
            from: participant.name,
            to: 'Todos',
            text: 'entra na sala...',
            type: 'status',
            time: dayjs().format('HH:mm:ss')
        });
        res.sendStatus(201);
    } catch (error) {
        console.log(error);
        res.status(500).send({
            message: 'Internal error creating user',
            detail: error
        });
    }
}

async function getParticipants(req, res) {
    try {
        const participants = await database.collection('participants').find().toArray();
        res.send(participants);
    } catch (error) {
        console.log(error);
        return res.status(500).send('Error getting participants', e);
    }
}
/*  */

app.get('/', (_req, res) => {
	res.send('Online');
});

app.listen(port, () => {
	console.log(`Server started on port ${port}`);
});