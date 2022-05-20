import database from '../database/MongoClient.js';
import joi from 'joi';
import dayjs from 'dayjs';

//signUp
export async function signUp(req, res) {
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

//getParticipants
export async function getParticipants(_req, res) {
    try {
        const participants = await database.collection('participants').find().toArray();
        res.send(participants);
    } catch (error) {
        console.log(error);
        return res.status(500).send('Error getting participants', e);
    }
}

//sendMessages
export async function sendMessages(req, res){
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

//getMessages
export async function getMessages(req, res){
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
        }).limit(50).toArray(); // $or: -> logical operator OR
        res.send(filteredMessages);
    } catch (error) {
        console.log(error);
        res.status(500).send({
            message: 'Error getting messages',
            detail: error
        });
    }
}

//userStatus
export async function userStatus(req, res) {
    const { user } = req.headers; //const user = req.header('User');
    try {
        const participant = await database.collection('participants').findOne({ name: user });
        if (!participant) return res.sendStatus(404);

        await database.collection('participants').updateOne({ name: user }, { $set: { lastStatus: Date.now() } });
        res.sendStatus(200);
    } catch (e) {
        console.log(error);
        res.status(500).send({
            message: 'Error updating status',
            detail: error
        });
    }
}