/* eslint-env node */
if (process.env.NODE_ENV === 'development') {
    require('dotenv').config();
}
const express = require('express');
const cors = require('cors');
const compression = require('compression');
const { v4: uuidv4 } = require('uuid');
const path = require('path');
const bodyParser = require('body-parser');
const crypto = require('crypto');
const FirebaseTokenGenerator = require('firebase-token-generator');


const PORT = process.env.PORT || 5001;
const SECRET = process.env.SECRET;


const firebaseTokenGenerator = new FirebaseTokenGenerator(
    process.env.FIREBASE_SECRET,
);


const app = express();

app.use(cors());
app.use(compression());
app.use(bodyParser.json());
app.use(express.static(path.join(__dirname, 'public')));
app.enable('trust proxy');

// TODO: serve built app in prod mode
//
// API server
//
// app.get('/', (req, res) => {
//     const root = path.join(__dirname, base[0]);
//     console.log({ root });
//     res.sendFile(`${root}/index.html`);
// });
//
// app.get('/rooms/:id', (req, res) => {
//     const root = path.join(__dirname, base[0]);
//     res.sendFile(`${root}/index.html`);
// });

app.get('api/room', (req, res) => {
    const ip = req.headers['cf-connecting-ip'] || req.ip;
    const roomId = crypto.createHmac('md5', SECRET).update(ip).digest('hex');
    res.json({ roomId });
});

app.get('api/auth', (req, res) => {
    const ip = req.headers['cf-connecting-ip'] || req.ip;
    const uid = uuidv4();
    const token = firebaseTokenGenerator.createToken(
        { uid, id: uid }, // will be available in Firebase security rules as 'auth'
        { expires: 32503680000 }, // 01.01.3000 00:00
    );

    res.json({ id: uid, token, public_ip: ip });
});

app.listen(PORT, () => console.log(`Backend listening on port ${PORT}!`));

