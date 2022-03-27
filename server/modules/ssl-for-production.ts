import {Express} from "express-serve-static-core";

/**
 * Redirect from http to https on production
 * @param app - express app
 */

export default function(app: Express) {
    if (process.env.NODE_ENV === 'production') {
        app.use((req: any, res: any, next: any) => {
            req.secure ? next() : res.status(301).redirect('https://' + req.headers.host + req.url)
        });
    }
}
