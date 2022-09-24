const OPERATING_SYSTEMS = [
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
];

export default function(): string {
    const agent = [
        navigator.platform,
        navigator.userAgent,
        navigator.appVersion,
        navigator.vendor,
        (window as any).opera
    ].join(' ');

    let userDevice = '';

    OPERATING_SYSTEMS.forEach(os => {
        const regex = new RegExp(os.value, 'i');
        if (regex.test(agent)) {
            userDevice = os.name
            return;
        }
    });

    return userDevice;
}
