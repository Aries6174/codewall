"use client";

import { useEffect, useRef } from "react";

export default function CodeCanvas(){
    const canvasRef = useRef<HTMLCanvasElement>(null);

    useEffect(() => {
        const canvas = canvasRef.current;

        if (!canvas) return;

        const ctx = canvas.getContext("2d");

        if (!ctx) return;

        let animationId: number;
        let lastUpdate = 0;
        let frame = 0;

        const animate = (time: number) => {
            if (time - lastUpdate >= 180) {
                ctx.clearRect(0, 0, canvas.width, canvas.height);

                ctx.font = "14px monospace";
                ctx.fillStyle = "#F5C542";

                for (let row = 0; row < 4; row++){
                    for(let col = 0; col < 16; col++){
                        const character = (row + col + frame) % 3 === 0 ? "1" : "0";

                        const x = 12 + col * 18;
                        const y = 24 + row * 26;

                        ctx.fillText(character, x, y);
                    }
                }

            frame++;
            lastUpdate = time;
        }

        animationId = requestAnimationFrame(animate);
    };
    
    animationId= requestAnimationFrame(animate);
    
    return () => {
        cancelAnimationFrame(animationId);
    };
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