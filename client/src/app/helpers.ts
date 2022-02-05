
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

export function isMobile() {
    return /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
}