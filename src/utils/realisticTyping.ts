
export type TypingFrame = {
    text: string;
    delay: number;
};

const nearbyKeys: Record<string, string> = {
    a: "sqwz",
    b: "vghn",
    c: "xdfv",
    d: "serfcx",
    e: "wsdr",
    f: "drtgvc",
    g: "ftyhbv",
    h: "gyujnb",
    i: "ujko",
    j: "huikmn",
    k: "jiolm",
    l: "kop",
    m: "njk",
    n: "bhjm",
    o: "iklp",
    p: "ol",
    q: "wa",
    r: "edft",
    s: "awedxz",
    t: "rfgy",
    u: "yhji",
    v: "cfgb",
    w: "qase",
    x: "zsdc",
    y: "tghu",
    z: "asx"
};

function getNearbyKey(character: string): string {
    const options = nearbyKeys[character.toLowerCase()];

    if (!options) return character;

    const wrongKey = options[
        Math.floor(Math.random() * options.length)
    ];

    return character === character.toUpperCase()
        ? wrongKey.toUpperCase()
        : wrongKey;
}

export function createTypingFrames(
    text: string,
    typingSpeed = 27,
    typoChance = 0.08
): TypingFrame[] {
    const frames: TypingFrame[] = [];
    let typed = "";

    for (let i = 0; i < text.length;) {
        const character = text[i];

        const canMakeTypo =
            /[a-zA-Z]/.test(character) &&
            Math.random() < typoChance;

        if (canMakeTypo) {
            // Mistype a small group of letters.
            const mistakeLength = Math.min(
                2 + Math.floor(Math.random() * 3),
                text.length - i
            );

            let mistake = "";

            for (let j = 0; j < mistakeLength; j++) {
                const expected = text[i + j];

                if (/[a-zA-Z]/.test(expected)) {
                    const wrong = j === 0
                        ? getNearbyKey(expected)
                        : expected;

                    mistake += wrong;
                } else {
                    break;
                }
            }

            // Type the mistaken text.
            for (const letter of mistake) {
                frames.push({
                    text: typed + letter,
                    delay: typingSpeed
                });

                typed += letter;
            }

            // Briefly pause after noticing the mistake.
            frames.push({
                text: typed,
                delay: 100
            });

            // Backspace the mistaken characters individually.
            for (let j = 0; j < mistake.length; j++) {
                typed = typed.slice(0, -1);

                frames.push({
                    text: typed,
                    delay: 55
                });
            }

            // Retype the intended characters correctly.
            for (let j = 0; j < mistake.length; j++) {
                typed += text[i + j];

                frames.push({
                    text: typed,
                    delay: typingSpeed
                });
            }

            i += mistake.length;
        } else {
            typed += character;

            frames.push({
                text: typed,
                delay: typingSpeed
            });

            i++;
        }
    }

    return frames;
}
