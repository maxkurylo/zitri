import express, {Request, Response} from 'express';

const router = express.Router();

const STUN_SERVER = process.env.STUN_SERVER;
const TURN_SERVER = process.env.TURN_SERVER;
const TURN_USERNAME = process.env.TURN_USERNAME;
const TURN_PASSWORD = process.env.TURN_PASSWORD;

/**
 * Responds with WebRTC data
 */
router.get('/webrtc', (req: Request, res: Response) => {
    const info = {
        stunServer: STUN_SERVER,
        turnServer: TURN_SERVER,
        turnUsername: TURN_USERNAME,
        turnPassword: TURN_PASSWORD,
    };

    res.json(info);
});

export default router;