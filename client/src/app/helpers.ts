export function generateRandomString(length: number): string {
    let result = '';
    const characters = 'abcdefghijklmnopqrstuvwxyz0123456789';
    const charactersLength = characters.length;
    for (let i = 0; i < length; i++ ) {
        result += characters.charAt(Math.floor(Math.random() * charactersLength));
    }
    return result;
}

export function copyToClipboard(text: string) {
    const input = document.createElement('input');
    input.value = text;
    input.style.opacity = '0';
    input.style.position = 'absolute';
    input.style.zIndex = '-1000';
    document.body.appendChild(input);
    input.focus();
    input.select();
    document.execCommand('copy');
    document.body.removeChild(input);
}