export const editorFiles = {
    "developer.ts": `
        type Vector2D = {
            x: number;
            y: number;
        };

        type Particle = {
            position: Vector2D;
            origin: Vector2D;
            velocity: Vector2D;
        };

        // Mouse interaction settings
        const config = {
            radius: 45,
            maxPush: 15,
            easing: 0.1,
            friction: 0.85
        };

        const mouse: Vector2D = {
            x: -100,
            y: -100
        };

        function getDistance(
            a: Vector2D,
            b: Vector2D
        ): number {
            const dx = a.x - b.x;
            const dy = a.y - b.y;

            return Math.sqrt(
                dx * dx + dy * dy
            );
        }

        function updateParticle(
            particle: Particle
        ): void {
            const distance = getDistance(
                particle.origin,
                mouse
            );

            let targetX = particle.origin.x;
            let targetY = particle.origin.y;

            if (
                distance < config.radius &&
                distance > 0
            ) {
                const force =
                    (config.radius - distance) /
                    config.radius;

                const dx = particle.origin.x - mouse.x;
                const dy = particle.origin.y - mouse.y;

                targetX +=
                    (dx / distance) *
                    force * config.maxPush;

                targetY +=
                    (dy / distance) *
                    force * config.maxPush;
            }

            particle.velocity.x +=
                (targetX - particle.position.x) *
                config.easing;

            particle.velocity.y +=
                (targetY - particle.position.y) *
                config.easing;

            particle.velocity.x *= config.friction;
            particle.velocity.y *= config.friction;

            particle.position.x += particle.velocity.x;
            particle.position.y += particle.velocity.y;
        }
    `,

    
    "projects.ts": `
            type PortfolioProject = {
                name: string;
                stack: string[];
                status: string;
            };

            export const projects: PortfolioProject[] = [
                {
                    name: "UP: Visions",
                    stack: ["Ren'Py", "Python"],
                    status: "completed"
                },
                {
                    name: "TodoStack",
                    stack: ["Next.js", "TypeScript"],
                    status: "completed"
                },
                {
                    name: "Elvicor",
                    stack: ["Next.js", "PostgreSQL"],
                    status: "planned"
                }
            ];
        `,

    "system.ts": `
            type SystemState = "dormant" | "online";

            export const system = {
                name: "ADRIAN.JS",
                version: "1.0",
                status: "online",
                features: [
                    "living-code",
                    "terminal",
                    "file-explorer"
                ]
            };

            export function bootSystem(): SystemState {
                return "online";
            }
        `


} as const;

export const editorSequence =  Object.entries(editorFiles).flatMap(
    ([fileName, source]) => {
        const lines = source.trim().split("\n").map((line) => line.replace(/^ {8}/,""));

        return lines.map((text, index) => ({
            fileName,
            text,
            lineNumber: index + 1,
            totalLines: lines.length
        }));
    }
);