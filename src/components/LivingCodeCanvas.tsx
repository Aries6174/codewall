
"use client";

import { useEffect, useRef } from "react";

export default function LivingCodeCanvas() {
    const canvasRef = useRef<HTMLCanvasElement>(null);

    useEffect(() => {
        const canvas = canvasRef.current;

        if (!canvas) return;

        const ctx = canvas.getContext("2d");

        if (!ctx) return;

        let cursorVisible = true;

        const resizeCanvas = () => {
            const rect = canvas.getBoundingClientRect();
            const dpr = window.devicePixelRatio || 1;

            canvas.width = Math.round(rect.width * dpr);
            canvas.height = Math.round(rect.height * dpr);

            ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

            ctx.font = "12px monospace";
            ctx.fillStyle = "#92958B";

            ctx.fillText(
                "// system.canvas initialized",
                24,
                42
            );

            ctx.fillText(
                `// viewport: ${Math.round(rect.width)} x ${Math.round(rect.height)}`,
                24,
                62
            );

            const codeFragments = [
                "const system = initalize();",
                "if (signal) awaken();",
                "system.listen('pointer');",
                "const status = 'dormant';",
                "renderPortfolio();"
            ]

            const columns = rect.width >= 850 ? 2 : 1;

            const rows = Math.max(
                1,
                Math.floor((rect.height - 140) / 120)
            );

            ctx.save();

            ctx.font = "12px monospace";
            ctx.fillStyle = "#92958B";
            ctx.globalAlpha = 0.25;

            for (let row = 0; row < rows; row++){
                for (let col = 0; col < columns; col++){
                    const index = (row + col) % codeFragments.length;
                    const text = codeFragments[index];

                    const x = 24 + col * (rect.width / columns);
                    const y = 140 + row * 120;

                    ctx.fillText(text, x, y);
                }
            }

            ctx.restore();
        };
        
        const drawStatus = () => {
            ctx.clearRect(24, 74, 230,24);

            ctx.save();

            ctx.font ='12px monospace';
            ctx.fillStyle = "#F5C542";
            ctx.globalAlpha = 0.45;

            const text ="// listening for signal";

            ctx.fillText(
                text + (cursorVisible ? "_" : " "),
                24,
                92
            );

            ctx.restore();
        }

        const observer = new ResizeObserver(() => {
            resizeCanvas();
            drawStatus();
        });

        observer.observe(canvas);
        resizeCanvas();
        drawStatus();

        const interval = window.setInterval(() => {
            cursorVisible = !cursorVisible;
            drawStatus();
        }, 700)

        return () => {
            observer.disconnect();
            window.clearInterval(interval);
        };
    }, []);

    return (
        <canvas
            ref={canvasRef}
            aria-hidden="true"
            className="pointer-events-none absolute inset-0 h-full w-full"
        />
    );
}
