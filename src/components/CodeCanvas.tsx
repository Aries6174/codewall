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

        const mouse = {
            x: -100,
            y: -100
        };

        const codeLines = [
            "const dev = {",
            ' name: "Adrian",',
            ' role: "Coder",',
            "};"
        ];

        const characters = codeLines.map(
            (line) => line.split("")
        );

        const positions = characters.map(
            (line, row) => line.map(
                (_, col) =>({
                    x: 52 + col * 10,
                    y: 24 + row * 26
                })
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
            ctx.clearRect(0, 0, canvas.width, canvas.height);

            ctx.font = "12px monospace";
            ctx.fillStyle = "#92958B";

            for (let row = 0; row < codeLines.length; row++) {
                const lineNumber = String(row + 1).padStart(2, "0");
                const y = 24 + row * 26;

                ctx.fillText(lineNumber, 10, y);
            }

            ctx.beginPath();
            ctx.moveTo(42, 8);
            ctx.lineTo(42, 114);
            ctx.strokeStyle = "#494538";
            ctx.stroke();

            ctx.font = "14px monospace";

            for (let row = 0; row < characters.length; row++){
                for(let col = 0; col < characters[row].length; col++){
                    const character = characters[row][col];
                    const x = 52 + col * 10;
                    const y = 24 + row * 26;

                    const dx = x - mouse.x;
                    const dy = y - mouse.y;

                    const distance = Math.sqrt(dx * dx + dy * dy);

                    const radius = 45;
                    const maxPush = 15;

                    let drawX = x;
                    let drawY = y;

                    if (distance < radius && distance > 0) {
                        const force = (radius - distance) / radius;

                        drawX += (dx / distance) * force * maxPush;
                        drawY += (dy / distance) * force * maxPush;

                        ctx.fillStyle = "#E6DDC9";
                    } else if (row === 0 && col < 5){
                        ctx.fillStyle = "#D94B43";
                    } else if ((row ===  1 || row === 2) && col >= codeLines[row].indexOf('"') && col <= codeLines[row].lastIndexOf('"')) {
                        ctx.fillStyle = "#F5C542";
                    } else{
                        ctx.fillStyle = "#92958B";
                    }

                    const position = positions[row][col];

                    position.x += (drawX - position.x) * 0.1;
                    position.y += (drawY - position.y) * 0.1;

                    const shouldFlicker =
                        row === 3 &&
                        col === 1 &&
                        time % 3000 < 120;

                    if (!shouldFlicker){
                        ctx.fillText(character, position.x, position.y);
                    }
                }
            }

            ctx.beginPath();
            ctx.arc(mouse.x, mouse.y, 4, 0, Math.PI * 2);
            ctx.fillStyle = "#D94B43";
            ctx.fill();  

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
        <div className="w-full max-w-[380px] border border-[#494538] bg-[#0B0C0B]">

            <div className="flex items-center justify-between border-b border-[#494538] bg-[#171816] px-3 py-2">
                <span className="text-xs text-[#F5C542]">
                    developer.ts
                </span>

                <span className="text-[10px] text-[#92958B]">
                    SRC / SYSTEM
                </span>
            </div>

            <canvas
                ref={canvasRef}
                width={380}
                height={120}
                className="block h-auto w-full"
            />

            <div className="flex items-center justify-between border-t border-[#494538] bg-[#171816] px-3 py-2">
                <span className="text-[10px] text-[#F5C542]">
                    ● SYSTEM ACTIVE
                </span>

                <span className="text-[10px] text-[#92958B]">
                    TypeScript / UTF-8
                </span>
            </div>

        </div>
    );
}