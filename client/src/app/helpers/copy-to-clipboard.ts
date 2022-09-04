export default function copyToClipboard(text: string): void {
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
