/**
 * Detects if user's device is mobile
 * @returns {boolean} - true if device is mobile
 */
export function isMobile(): boolean {
    return /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(
        navigator.userAgent
    );
}

/**
 * Get the user's operating system name
 * @returns {string} - OS name
 */
export function getOSName(): string {
    const userAgent = window.navigator.userAgent;
    const platform = window.navigator.platform;
    const macosPlatforms = ['Macintosh', 'MacIntel', 'MacPPC', 'Mac68K'];
    const windowsPlatforms = ['Win32', 'Win64', 'Windows', 'WinCE'];
    const iPhonePlatforms = ['iPhone'];
    const iPadPlatforms = ['iPad'];
    let os = 'Unknown device';

    if (macosPlatforms.indexOf(platform) !== -1) {
        os = 'Mac';
    } else if (iPhonePlatforms.indexOf(platform) !== -1) {
        os = 'iPhone';
    } else if (iPadPlatforms.indexOf(platform) !== -1) {
        os = 'iPad';
    } else if (windowsPlatforms.indexOf(platform) !== -1) {
        os = 'Windows';
    } else if (/Android/.test(userAgent)) {
        os = 'Android';
    } else if (!os && /Linux/.test(platform)) {
        os = 'Linux';
    }

    return os;
}
