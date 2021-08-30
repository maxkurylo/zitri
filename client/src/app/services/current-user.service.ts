import { Injectable } from '@angular/core';
import {makeObjectReadonly} from "./init.service";

@Injectable({
    providedIn: 'root'
})
export class CurrentUserService {
    private _user: User = {
        avatarUrl: '',
        name: '',
    };

    set user(currentUser: User ) { this._user = makeObjectReadonly(currentUser) }
    get user() { return this._user; }

    constructor() { }

    private generateDeviceName(): string {
        const agent = [
            navigator.platform,
            navigator.userAgent,
            navigator.appVersion,
            navigator.vendor,
            (window as any).opera
        ].join(' ');

        for (let i = 0; i < OS.length; i++) {
            let regex = new RegExp(OS[i].value, 'i');
            if (regex.test(agent)) {
                return OS[i].name;
            }
        }
        return '';
    }

    private generateName() {
        const randomAvatar = AVATARS[Math.floor(Math.random()*AVATARS.length)];
        const randomPrefix = PREFIXES[Math.floor(Math.random()*PREFIXES.length)];

        return {
            avatarUrl: `/assets/avatars/${randomAvatar.id}.svg`,
            name: `${randomPrefix} ${randomAvatar.name}`,
        };
    }

    generateUser(): User {
        const user: User = this.generateName();
        user.device = this.generateDeviceName();
        return user;
    }
}


export interface User {
    name: string;
    avatarUrl: string;
    device?: string;
}


const AVATARS = [
    {
        name: 'Piglet',
        id: '23',
    },
    {
        name: 'Cat',
        id: '36',
    },
    {
        name: 'Fish',
        id: '37',
    },
    {
        name: 'Fox',
        id: '38',
    },
    {
        name: 'Chicken',
        id: '46',
    },
    {
        name: 'Goat',
        id: '50',
    },
    {
        name: 'Ram',
        id: '51',
    },
    {
        name: 'Sheep',
        id: '52',
    },
    {
        name: 'Bison',
        id: '59',
    },
    {
        name: 'Dog',
        id: '61',
    },
    {
        name: 'Walrus',
        id: '62',
    },
    {
        name: 'Dog',
        id: '63',
    },
    {
        name: 'Monkey',
        id: '64',
    },
    {
        name: 'Bear',
        id: '65',
    },
    {
        name: 'Lion',
        id: '66',
    },
    {
        name: 'Zebra',
        id: '67',
    },
    {
        name: 'Giraffe',
        id: '68',
    },
    {
        name: 'Bear',
        id: '71',
    },
    {
        name: 'Wolf',
        id: '74',
    },
    {
        name: 'Rhino',
        id: '86',
    },
    {
        name: 'Bat',
        id: '87',
    },
    {
        name: 'Cat',
        id: '95',
    },
    {
        name: 'Penguin',
        id: '102',
    },
    {
        name: 'Rhino',
        id: '109',
    },
    {
        name: 'Koala',
        id: '112',
    },
];

const PREFIXES = [
    'Adventurous',
    'Affable',
    'Ambitious',
    'Amiable ',
    'Amusing',
    'Brave',
    'Bright',
    'Charming',
    'Compassionate',
    'Convivial',
    'Courageous',
    'Creative',
    'Diligent',
    'Easygoing',
    'Emotional',
    'Energetic',
    'Enthusiastic',
    'Exuberant',
    'Fearless',
    'Friendly',
    'Funny',
    'Generous',
    'Gentle',
    'Good',
    'Helpful',
    'Honest',
    'Humorous',
    'Imaginative',
    'Independent',
    'Intelligent',
    'Intuitive',
    'Inventive',
    'Kind',
    'Loving',
    'Loyal',
    'Modest',
    'Neat',
    'Nice',
    'Optimistic',
    'Passionate',
    'Patient',
    'Persistent',
    'Polite',
    'Practical',
    'Rational',
    'Reliable',
    'Reserved',
    'Resourceful',
    'Romantic',
    'Sensible',
    'Sensitive',
    'Sincere',
    'Sympathetic',
    'Thoughtful',
    'Tough',
    'Understanding',
    'Versatile',
    'Warmhearted',
];

const OS = [
    { name: 'Windows Phone', value: 'Windows Phone' },
    { name: 'Windows',       value: 'Win' },
    { name: 'iPhone',        value: 'iPhone' },
    { name: 'iPad',          value: 'iPad' },
    { name: 'Kindle',        value: 'Silk' },
    { name: 'Android',       value: 'Android' },
    { name: 'PlayBook',      value: 'PlayBook' },
    { name: 'BlackBerry',    value: 'BlackBerry' },
    { name: 'Mac',           value: 'Mac' },
    { name: 'Linux',         value: 'Linux' },
    { name: 'Palm',          value: 'Palm' }
]
