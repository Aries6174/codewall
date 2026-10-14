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

        const mouse = {
            x: -100,
            y: -100
        };

        const characters = Array.from(
            { length: 4 },
            () => Array.from(
                { length: 16 },
                () => Math.random() < 0.5 ? "1" : "0"
            )
        );

        const handleMouseMove = (event: MouseEvent) => {
            const rect = canvas.getBoundingClientRect();

            mouse.x = (event.clientX - rect.left) * (canvas.width / rect.width);

            mouse.y = (event.clientY - rect.top) * (canvas.height / rect.height);
        };

        const handleMouseLeave = () => {
            mouse.x = -100;
            mouse.y = -100;
        };

        canvas.addEventListener("mousemove", handleMouseMove);
        canvas.addEventListener("mouseleave", handleMouseLeave);

        const animate = (time: number) => {
            const shouldUpdate = time - lastUpdate >= 180;

            ctx.clearRect(0, 0, canvas.width, canvas.height);

            ctx.font = "14px monospace";
            ctx.fillStyle = "#F5C542";

            for (let row = 0; row < 4; row++){
                for(let col = 0; col < 16; col++){
                    if (Math.random() < 0.1) {
                        characters[row][col] =
                            characters[row][col] === "1" ? "0" : "1";
                    }

                    const character = characters[row][col];
                    const x = 12 + col * 18;
                    const y = 24 + row * 26;

                    const dx = mouse.x - x;
                    const dy = mouse.y - y;

                    const distance = Math.sqrt(dx * dx + dy * dy);

                    if (distance < 45) {
                        ctx.fillStyle = "#E6DDC9";
                    }else{
                        ctx.fillStyle = "#F5C542"
                    }

                    ctx.fillText(character, x, y);
                }
            }

            if (shouldUpdate){
                lastUpdate = time;
            }

            ctx.beginPath();
            ctx.arc(mouse.x, mouse.y, 4, 0, Math.PI * 2);
            ctx.fillStyle = "#D94B43";
            ctx.fill();  
            lastUpdate = time;

            animationId = requestAnimationFrame(animate);
        };
    
        animationId= requestAnimationFrame(animate);
    
        return () => {
            cancelAnimationFrame(animationId);
            canvas.removeEventListener("mousemove", handleMouseMove);
            canvas.removeEventListener("mouseleave", handleMouseLeave);
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