
const AVATARS = [
    { name: 'Piglet', id: '23' },
    { name: 'Cat',  id: '36' },
    { name: 'Cat',  id: '95' },
    { name: 'Fish',  id: '37' },
    { name: 'Fox', id: '38' },
    { name: 'Chicken', id: '46' },
    { name: 'Goat', id: '50' },
    { name: 'Ram',  id: '51' },
    { name: 'Sheep', id: '52' },
    { name: 'Bison',  id: '59' },
    { name: 'Dog', id: '61' },
    { name: 'Dog', id: '63' },
    { name: 'Walrus', id: '62' },
    { name: 'Monkey', id: '64' },
    { name: 'Bear', id: '65' },
    { name: 'Bear', id: '71' },
    { name: 'Lion', id: '66' },
    { name: 'Zebra', id: '67' },
    { name: 'Giraffe', id: '68' },
    { name: 'Wolf', id: '74' },
    { name: 'Rhino', id: '86' },
    { name: 'Rhino', id: '109' },
    { name: 'Bat', id: '87' },
    { name: 'Penguin', id: '102' },
    { name: 'Koala', id: '112' },
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
    'Sophisticated',
    'Sympathetic',
    'Thoughtful',
    'Tough',
    'Understanding',
    'Versatile',
    'Warmhearted',
];


export default function(): { name: string, avatarUrl: string } {
    const randomAvatar = AVATARS[Math.floor(Math.random() * AVATARS.length)];
    const randomPrefix = PREFIXES[Math.floor(Math.random() * PREFIXES.length)];

    return {
        avatarUrl: `/assets/avatars/${randomAvatar.id}.svg`,
        name: `${randomPrefix} ${randomAvatar.name}`,
    };
}