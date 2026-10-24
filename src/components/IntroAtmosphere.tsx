export default function IntroAtmosphere() {
    return (
        <div
            aria-hidden="true"
            className="pointer-events-none absolute inset-0 z-0 overflow-hidden"
        >
            {/* Subtle golden atmosphere */}
            <div
                className="absolute -right-32 top-0 h-[420px] w-[420px] rounded-full opacity-30 blur-3xl"
                style={{
                    background:
                    "radial-gradient(circle, rgba(245, 197, 66, 0.16) 0%, transparent 70%)",
                }}
            />

            {/* Technical Background grid */}
            <div
                className="absolute inset-0 opacity-[0.12]"
                style={{
                    backgroundImage: `
                        linear-gradient(#494538 1px, transparent 1px),
                        linear-gradient(90deg, #494538, transparent 1px)
                    `,
                    backgroundSize: "32px 32px",
                    maskImage:
                    "linear-gradient(to left, black, transparent 85%)",
                }}
            />
 
            {/* Moonlit landscape */}
            <svg
            viewBox="0 0 500 280"
            aria-hidden="true"
            className="absolute -bottom-8 -right-20 h-[280px] w-[500px] opacity-40"
            >
            <defs>
                <radialGradient id="landscapeGlow">
                <stop offset="0%" stopColor="#F5C542" stopOpacity="0.25" />
                <stop offset="100%" stopColor="#F5C542" stopOpacity="0" />
                </radialGradient>

                <linearGradient id="landscapeMoon" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#F5C542" />
                <stop offset="100%" stopColor="#7A5924" />
                </linearGradient>
            </defs>

            {/* Moonlight */}
            <circle cx="385" cy="135" r="130" fill="url(#landscapeGlow)" />
            <circle cx="385" cy="135" r="42" fill="url(#landscapeMoon)" />

            {/* Distant mountains */}
            <path
                d="M0 210 L60 170 L105 190 L160 145 L215 175 L270 150 L330 185 L390 140 L445 170 L500 145 V280 H0 Z"
                fill="#28291F"
            />

            {/* Foreground mountains */}
            <path
                d="M0 245 L75 205 L140 225 L210 180 L285 215 L345 185 L410 225 L470 195 L500 210 V280 H0 Z"
                fill="#10120F"
            />

            {/* Golden reflections */}
            <path
                d="M290 260 Q390 250 490 260"
                stroke="#F5C542"
                strokeOpacity="0.35"
                fill="none"
            />
            </svg>

        </div>
    );
}