"use client";

import { useEffect, useRef } from "react";

export default function CodeCanvas(){
    const canvasRef = useRef<HTMLCanvasElement>(null);

    useEffect(() => {
        const canvas = canvasRef.current;

        if (!canvas) return;
        const ctx = canvas.getContext("2d");

        if (!ctx) return;

        ctx.clearRect(0, 0, canvas.width, canvas.height);

        ctx.font = "14px monospace";
        ctx.fillStyle = "#F5C542";

        for (let row = 0; row < 4; row++){
            for(let col = 0; col < 16; col++){
                const character = (row + col) % 3 === 0 ? "1" : "0";

                const x = 12 + col * 18;
                const y = 24 + row * 26;

                ctx.fillText(character, x, y);
            }
        }
    }, []);

    return (
        <canvas
            ref={canvasRef}
            width={320}
            height={120}
            className="max-w-full"
        />
    );
}