"use client";

import { useEffect, useRef } from "react";

export default function CodeCanvas(){
    const canvasRef = useRef<HTMLCanvasElement>(null);

    const lineHeight = 18;
    const fontSize = 12;
    const topPadding = 18;

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
            "const mouse = {",
            "    x: -100,",
            "    y: -100",
            "};",
            "",
            "const handleMouseLeave = () => {",
            "    mouse.x = -100;",
            "    mouse.y = -100;",
            "};",
            "",
            "const radius = 45;",
            "const maxPush = 15;",
            "",
            "let drawX = x;",
            "let drawY = y;",
            "",
            "if (distance < radius) {",
            "    const force = 1 - distance / radius;",
            "    drawX += dx * force;",
            "    drawY += dy * force;",
            "}",
        ];

        let firstVisibleLine = 0;

        const visibleLineCount = Math.floor((canvas.height) / lineHeight);

        const getVisibleLines = (start: number) => {
            return Array.from(
                { length: visibleLineCount },
                (_, row) => codeLines[(start + row) % codeLines.length]
            );
        };

        let visibleLines = getVisibleLines(firstVisibleLine);

        let characters = visibleLines.map(
            (line) => line.split("")
        );

        let positions = characters.map(
            (line, row) => line.map(
                (_, col) =>({
                    x: 52 + col * 8,
                    y: topPadding + row * lineHeight
                })
            )
        );

        const updateVisibleLines = () => {
            visibleLines = getVisibleLines(firstVisibleLine);
            
            characters = visibleLines.map((line) => line.split(""));

            positions = characters.map((line, row) => line.map(
                (_,col) => ({
                    x: 52 + col * 8,
                    y: topPadding + row * lineHeight
                })
            ))
        }

        const handleWheel = (event: WheelEvent) => {
            event.preventDefault();

            const direction = Math.sign(event.deltaY);

            firstVisibleLine = (
                firstVisibleLine + direction + codeLines.length
            ) % codeLines.length;

            updateVisibleLines();
        };

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
        canvas.addEventListener("wheel", handleWheel, { passive: false });

        const animate = (time: number) => {
            ctx.clearRect(0, 0, canvas.width, canvas.height);

            ctx.font = `${fontSize}px monospace`;
            ctx.fillStyle = "#92958B";
            ctx.textAlign = "right";

            for (let row = 0; row < visibleLines.length; row++) {     
                const lineNumber = String(
                    ((firstVisibleLine + row) % codeLines.length) + 1
                );

                const y = topPadding + row * lineHeight;

                ctx.fillText(lineNumber, 38, y);
            }

            ctx.font = `${fontSize}px monospace`;
            ctx.textAlign = "left";

            for (let row = 0; row < characters.length; row++){
                for(let col = 0; col < characters[row].length; col++){
                    const character = characters[row][col];
                    const x = 52 + col * 8;
                    const y = topPadding + row * lineHeight;

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
                    } else if ((row ===  1 || row === 2) && col >= visibleLines[row].indexOf('"') && col <= visibleLines[row].lastIndexOf('"')) {
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

            ctx.save();

            ctx.globalCompositeOperation = "destination-out";

            const edgeFade = ctx.createLinearGradient(0, 0, 0, canvas.height);

            edgeFade.addColorStop(0, "rgba(0, 0, 0, 0.85)");
            edgeFade.addColorStop(0.12, "rgba(0, 0, 0, 0)");
            edgeFade.addColorStop(0.88, "rgba(0, 0, 0, 0)");
            edgeFade.addColorStop(1, "rgba(0, 0, 0, 0.85)");

            ctx.fillStyle = edgeFade;
            ctx.fillRect(0, 0, canvas.width, canvas.height);

            ctx.restore();


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
            canvas.removeEventListener("wheel", handleWheel);
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
                height={260}
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