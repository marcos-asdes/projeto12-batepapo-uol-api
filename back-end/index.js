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

/*  */

app.post('/messages', sendMessages);
app.get('/messages', getMessages);

async function sendMessages(req, res){
    const message = req.body; // { to, text, type }
    const { user } = req.headers; // from
    const messageSchema = joi.object({
        to: joi.string().required(),
        text: joi.string().required(),
        type: joi.string().valid('message', 'private_message').required()
    });
    const { error } = messageSchema.validate(message, {abortEarly: false}); // abortEarly: false -> in case of error, wait for all variables to be checked before joi accuses an error
    if (error) {
        return res.status(422).send(error.details.map(detail => detail.message));
    }
    try {
        const participant = await database.collection('participants').findOne({name: user});
        if (!participant) {
            return res.sendStatus(422);
        }
        const { to, text, type } = message;
        await database.collection("messages").insertOne({
          to,
          text,
          type,
          from: user,
          time: dayjs().format('HH:mm:ss')
        });
    
        res.sendStatus(201);

    } catch (error) {
        console.log(error);
        res.status(422).send({
            message: 'User does not exist',
            detail: error
        });
    }
}

async function getMessages(req, res){
    const { user } = req.headers; //const user = req.header('User');
    try {
        const filteredMessages = await database.collection('messages').find({
            $or: [ 
                { type: 'message'}, 
                { $or: [
                    { to: 'Todos' }, 
                    { to: user }, 
                    { from: user } 
                    ] 
                } 
            ]
        }).limit(50).toArray();
        res.send(filteredMessages);
    } catch (error) {
        console.log(error);
        res.status(500).send({
            message: 'Error getting messages',
            detail: error
        });
    }
}

/*  */

app.get('/', (_req, res) => {
	res.send('Online');
});

app.listen(port, () => {
	console.log(`Server started on port ${port}`);
});