import Database from "../database";
import jwt from "jsonwebtoken";
import {IDBUser} from "../interfaces";
import {uuid} from "uuidv4";
import router from "./rooms";

const JWT_SECRET: string = process.env.JWT_SECRET || '';
const TOKEN_EXPIRATION = 1000 * 60 * 60 * 24 * 365 // 1 year

/**
 * Receives user data - name, avatarUrl, device. Optionally receives roomId
 * Generates missing fields for user (his id) and JWT
 * If roomId was not specified, generate roomId based on user's IP
 * Returns JWT, user data and roomId
 */
router.post('/auth', (req, res) => {
    const { name, avatarUrl, device } = req.body;

    const user = generateUser(name, avatarUrl, device);
    Database.addUser(user);

    const token = jwt.sign({ userId: user.id }, JWT_SECRET, { expiresIn: TOKEN_EXPIRATION });
    res.json({ token, user });
});



function generateUser(name: string, avatarUrl: string, device: string): IDBUser {
    const userId = uuid();
    return {
        name,
        avatarUrl,
        device,
        id: userId
    };
}

export default router;