export const glitchCharacters = 
    "ABCDEFGHIJKLMNOPQRSTUVWXYZ" +
    "0123456789" +
    "!@#$%^&*()-_=+[]{}|;:,.<>?/\\~`" +
    "                                                            " +
    "█▓▒░⣿⣶⣤⠿■▪";

    export function getRandomGlitchCharacter(): string {
        const index = Math.floor(Math.random() * glitchCharacters.length);

        return glitchCharacters[index]
    }