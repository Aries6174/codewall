
export const developerQuotes: string[] = [
    "I'm a motivated software developer with many ideas",
    "I love to make stuff and spend time learning",
    "Every project is an opportunity to improve",
    "I believe good software starts with curiosity",
    "Building something meaningful takes patience",
    "I enjoy turning ideas into working applications",
    "There is always something new to learn",
    "I want to create experiences people remember"
];

export function getRandomDeveloperQuote(): string {
    const index = Math.floor(
        Math.random() * developerQuotes.length
    );

    return developerQuotes[index];
}
