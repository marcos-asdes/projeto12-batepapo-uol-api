import express from 'express';

import { signUp, getParticipants } from '../controllers/controller.js';
import { sendMessages, getMessages } from '../controllers/controller.js';
import { userStatus } from '../controllers/controller.js';

const router = express.Router();

router.post('/participants', signUp);
router.get('/participants', getParticipants);

router.post('/messages', sendMessages);
router.get('/messages', getMessages);

router.post('/status', userStatus)

export default router;