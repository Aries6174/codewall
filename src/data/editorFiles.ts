export const editorFiles = {
    "developer.ts": `
        import { lerp, clamp } from "@/lib/math";
        import type { Vector2D, Particle } from "@/types/engine";

        /**
         * ADRIAN.JS / Interaction Engine
         * Canvas-based particle physics and pointer response.
         */
        type InteractionConfig = {
            radius: number;
            maxPush: number;
            easing: number;
            friction: number;
        };

        const config: InteractionConfig = {
            radius: 45,
            maxPush: 15,
            easing: 0.1,
            friction: 0.85
        };

        const mouse: Vector2D = { x: -100, y: -100 };
        let particles: Particle[] = [];
        let animationId = 0;

        // Calculate distance between two points.
        function getDistance(a: Vector2D, b: Vector2D): number {
            const dx = a.x - b.x;
            const dy = a.y - b.y;
            return Math.sqrt(dx * dx + dy * dy);
        }

        export function setPointer(x: number, y: number): void {
            mouse.x = x;
            mouse.y = y;
        }

        export function resetPointer(): void {
            mouse.x = -100;
            mouse.y = -100;
        }

        // Apply repulsion and spring-based restoration.
        function updateParticle(particle: Particle): void {
            const distance = getDistance(particle.origin, mouse);
            let targetX = particle.origin.x;
            let targetY = particle.origin.y;

            if (distance < config.radius && distance > 0) {
                const force = (config.radius - distance) / config.radius;
                const dx = particle.origin.x - mouse.x;
                const dy = particle.origin.y - mouse.y;
                targetX += (dx / distance) * force * config.maxPush;
                targetY += (dy / distance) * force * config.maxPush;
            }

            particle.velocity.x +=
                (targetX - particle.position.x) * config.easing;
            particle.velocity.y +=
                (targetY - particle.position.y) * config.easing;

            particle.velocity.x *= config.friction;
            particle.velocity.y *= config.friction;
            particle.position.x += particle.velocity.x;
            particle.position.y += particle.velocity.y;
        }

        // Update every particle before the next render.
        export function updateParticles(): void {
            for (const particle of particles) {
                updateParticle(particle);
            }
        }

        export function initializeEngine(data: Particle[]): void {
            particles = data;
            resetPointer();
        }

        export function stopEngine(): void {
            cancelAnimationFrame(animationId);
            particles = [];
        }
    `,

    "projects.ts": `
        import type { PortfolioProject, ProjectStatus } from "@/types/project";

        /**
         * ADRIAN.JS / Project Registry
         * Centralized portfolio data and filtering utilities.
         */
        export const projects: PortfolioProject[] = [
            {
                id: "up-visions",
                name: "UP: Visions",
                description: "Educational visual novel simulation.",
                stack: ["Ren'Py", "Python"],
                status: "completed",
                featured: true
            },
            {
                id: "todostack",
                name: "TodoStack",
                description: "Task management web application.",
                stack: ["Next.js", "TypeScript"],
                status: "completed",
                featured: true
            },
            {
                id: "elvicor",
                name: "Elvicor",
                description: "Property management platform.",
                stack: ["Next.js", "PostgreSQL"],
                status: "planned",
                featured: true
            }
        ];

        // Retrieve projects selected for the landing page.
        export function getFeaturedProjects(): PortfolioProject[] {
            return projects.filter(project => project.featured);
        }

        export function getProjectById(
            id: string
        ): PortfolioProject | undefined {
            return projects.find(project => project.id === id);
        }

        export function getProjectsByStatus(
            status: ProjectStatus
        ): PortfolioProject[] {
            return projects.filter(project => project.status === status);
        }

        // Collect unique technologies used across projects.
        export function getTechnologies(): string[] {
            return [...new Set(projects.flatMap(p => p.stack))];
        }
    `,

"system.ts": `
    import { getFeaturedProjects } from "@/data/projects";
    import type { SystemState, SystemConfig } from "@/types/system";

    /**
     * ADRIAN.JS / Runtime Controller
     * Handles initialization, state and feature availability.
     */
    export const system: SystemConfig = {
        name: "ADRIAN.JS",
        version: "1.0.0",
        status: "dormant",
        features: [
            { id: "living-code", enabled: true },
            { id: "terminal", enabled: true },
            { id: "file-explorer", enabled: true }
        ]
    };

    // Verify system dependencies before initialization.
    function validateEnvironment(): boolean {
        return typeof window !== "undefined" &&
            typeof requestAnimationFrame === "function";
    }

    export function bootSystem(): SystemState {
        if (!validateEnvironment()) {
            return "dormant";
        }

        system.status = "booting";
        const featured = getFeaturedProjects();

        if (featured.length === 0) {
            system.status = "dormant";
            return system.status;
        }

        system.status = "online";
        return system.status;
    }

    export function isFeatureEnabled(id: string): boolean {
        return system.features.some(
            feature => feature.id === id && feature.enabled
        );
    }

    export function getSystemStatus(): SystemState {
        return system.status;
    }
`,} as const;


export const editorSequence = Object.entries(editorFiles).flatMap(
    ([fileName, source]) => {
        const lines = source
            .trim()
            .split("\n")
            .map((line) => line.replace(/^ {8}/, ""));

        return [
            {
                kind: "separator" as const,
                fileName,
                text: `ADRIAN.JS / ${fileName}`,
                lineNumber: null,
                totalLines: lines.length
            },
            ...lines.map((text, index) => ({
                kind: "code" as const,
                fileName,
                text,
                lineNumber: index + 1,
                totalLines: lines.length
            }))
        ];
    }
);