import {Request, Response} from 'express';
/**
 * Redirect from http to https on production
 * @param req
 * @param res
 * @param next
 */

export default function(req: Request, res: Response, next: any) {
    if (process.env.NODE_ENV === 'production' && req.secure) {
        res.status(301).redirect('https://' + req.headers.host + req.url)
    } else {
        next();
    }
}
