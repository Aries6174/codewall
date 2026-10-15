
"use client";

import { useEffect, useRef } from "react";

type LivingCodeCanvasProps = {
    onSignalChange: (detected: boolean) => void;
}

export default function LivingCodeCanvas({
    onSignalChange,
}: LivingCodeCanvasProps) {
    const canvasRef = useRef<HTMLCanvasElement>(null);

    useEffect(() => {
        const canvas = canvasRef.current;

        if (!canvas) return;

        const ctx = canvas.getContext("2d");

        if (!ctx) return;

        let cursorVisible = true;
        let activeFragment = 0;
        let previousSignalDetected = false;
        let displayedStatus = "// listening for signal";
        let targetStatus = displayedStatus;

        let typingPhase: "idle" | "deleting" | "pausing" | "typing" = "idle";
        let typingTimer = 0;

        const pointer = {
            x: -100,
            y: -100,
        };
        const fragmentOpacities: number[] = [0.65];
        const fragmentOffsets: { x: number; y: number }[] = [];

        const codeFragments = [
            "const system = initialize();",
            "if (signal) awaken();",
            "system.listen('pointer');",
            "const status = 'dormant';",
            "renderPortfolio();"
        ];

        let animationFrameId: number | null = null;

        const updateCanvasSize = () => {
            const rect = canvas.getBoundingClientRect();
            const dpr = window.devicePixelRatio || 1;

            const width = Math.round(rect.width * dpr);
            const height = Math.round(rect.height * dpr);

            if(canvas.width !== width || canvas.height !== height){
                canvas.width = width;
                canvas.height = height;
            }

            ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
        }

        const updateFragmentOpacity = (
            index: number,
            target: number,
            deltaTime: number
        ) => {
            const current = fragmentOpacities[index] ?? 0.25;

            const easing = 1 - Math.pow(0.88, deltaTime/ 16.67);
            
            const next = current + (target - current) * easing;
            
            fragmentOpacities[index] = next;
        };

        const updateAnimation = (deltaTime: number) => {
            const rect = canvas.getBoundingClientRect();

            const signalDetected =
                pointer.x >= 0 &&
                pointer.x <= rect.width &&
                pointer.y >= 0 &&
                pointer.y <= rect.height;

            if (signalDetected !== previousSignalDetected) {
                previousSignalDetected = signalDetected;
                onSignalChange(signalDetected);
            }
            
            const nextStatus = signalDetected
                ? "// signal detected"
                : "// listening for signal";

            if (nextStatus !== targetStatus) {
                targetStatus = nextStatus;
                
                if (displayedStatus === targetStatus) {
                    typingPhase = "idle";
                } else if (displayedStatus.length > 3){
                    typingPhase = "deleting";
                } else {
                    typingPhase = "pausing";
                }

                typingTimer = 0;
            }

            if (typingPhase !== "idle"){
                typingTimer += deltaTime;

                const characterDelay = typingPhase === "deleting" ? 25 : typingPhase === "pausing" ? 200 : 55;

                if (typingTimer >= characterDelay) { 
                    typingTimer -= characterDelay;

                    if(typingPhase === "deleting") {
                        displayedStatus = displayedStatus.slice(0, -1);

                        if(displayedStatus.length <= 3) {
                            displayedStatus = "// ";
                            typingPhase = "pausing";
                            typingTimer = 0;
                        }
                    } else if (typingPhase === "typing") {
                        displayedStatus = targetStatus.slice(
                            0, displayedStatus.length + 1
                        );

                        if (displayedStatus === targetStatus) {
                            typingPhase = "idle";
                        }
                    } else if (typingPhase === "pausing") {
                        typingPhase = "typing";
                    }
                } 
            }

            const columns = rect.width >= 850 ? 2 : 1;
            
            const rows = Math.max(
                1,
                Math.floor((rect.height - 140) / 120)
            );

            const totalFragments = rows * columns;

            for (let index = 0; index < totalFragments; index++) {
                const targetOpacity = index === activeFragment % totalFragments ? 0.65 : 0.25;
            
                updateFragmentOpacity(index, targetOpacity, deltaTime);

                const row = Math.floor(index / columns);
                const col = index % columns;

                const text = codeFragments[(row + col) % codeFragments.length];

                ctx.font = "12px monospace";

                const x = 24 + col * (rect.width / columns);
                const y = 140 + row * 120;

                const centerX = x + ctx.measureText(text).width / 2;
                const centerY = y - 6;

                const dx = pointer.x - centerX;
                const dy = pointer.y - centerY;

                const distance = Math.sqrt(dx * dx + dy * dy);
                const proximity = Math.max(0, 1 - distance / 150);

                const pushStrength = proximity * 20;

                const targetX = -(dx / Math.max(distance, 1)) * pushStrength;
                const targetY = -(dy / Math.max(distance, 1)) * pushStrength;

                const current = fragmentOffsets[index] ?? { x: 0, y: 0 };
                const easing = 1 - Math.pow(0.88, deltaTime / 16.67);

                current.x += (targetX - current.x) * easing;
                current.y += (targetY - current.y) * easing;

                fragmentOffsets[index] = current;
            }
        };

        const renderCanvas = () => {
            const rect = canvas.getBoundingClientRect();

            ctx.clearRect(0, 0, rect.width, rect.height);

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

            const columns = rect.width >= 850 ? 2 : 1;

            const rows = Math.max(
                1,
                Math.floor((rect.height - 140) / 120)
            );

            ctx.save();

            ctx.font = "12px monospace";
            ctx.fillStyle = "#92958B";

            for (let row = 0; row < rows; row++){
                for (let col = 0; col < columns; col++){
                    const index = (row + col) % codeFragments.length;
                    const text = codeFragments[index];

                    const x = 24 + col * (rect.width / columns);
                    const y = 140 + row * 120;

                    const fragmentIndex = row * columns + col;

                    const nextOpacity = fragmentOpacities[fragmentIndex] ?? 0.25;

                    const centerX = x + ctx.measureText(text).width / 2;
                    const centerY = y - 6;

                    const dx = pointer.x - centerX;
                    const dy = pointer.y - centerY;

                    const distance = Math.sqrt(dx * dx + dy * dy);

                    const proximity = Math.max(0, 1-distance / 150);

                    const offset = fragmentOffsets[fragmentIndex] ?? { x: 0, y: 0 };

                    ctx.globalAlpha = nextOpacity + (0.8 - nextOpacity) * proximity;

                    ctx.fillText(text, x + offset.x, y + offset.y);
                }
            }

            ctx.restore();
        };
        

        const drawStatus = () => {
            ctx.clearRect(24, 74, 280, 44);

            ctx.save();

            ctx.font = "12px monospace";
            ctx.fillStyle = "#F5C542";

            const text = displayedStatus;

            // Apply the fade animation to the status message
            ctx.globalAlpha = 0.45;

            ctx.fillText(
                text + (cursorVisible ? "_" : " "),
                24,
                92
            );


            ctx.fillText(
                `// pointer: ${Math.round(pointer.x)}, ${Math.round(pointer.y)}`,
                24,
                112
            );

            ctx.restore();
        };

        const handlePointerMove = (event: PointerEvent) => {
            const rect = canvas.getBoundingClientRect();

            pointer.x = event.clientX - rect.left;
            pointer.y = event.clientY - rect.top;
        };

        const handlePointerLeave = (event: MouseEvent) => {
            if (event.relatedTarget !== null) return;

            pointer.x = -100;
            pointer.y = -100;
        };

        window.addEventListener("pointermove", handlePointerMove);
        window.addEventListener("mouseout", handlePointerLeave);

        const observer = new ResizeObserver(() => {
            updateCanvasSize();
            renderCanvas();
            drawStatus();
        });

        observer.observe(canvas);

        updateCanvasSize();
        renderCanvas();
        drawStatus();

        const interval = window.setInterval(() => {
            cursorVisible = !cursorVisible;
        }, 700)

        
        const highlightInterval = window.setInterval(() => {
            activeFragment++;
        }, 2500);

        let lastFrame = performance.now();

        const animate = (time: number) => {
            const deltaTime = Math.min(
                Math.max(time - lastFrame, 0), 50
            );

            lastFrame = time;

            updateAnimation(deltaTime);
            renderCanvas();
            drawStatus();

            animationFrameId = requestAnimationFrame(animate);
        }

        animationFrameId = requestAnimationFrame(animate);


        return () => {
            observer.disconnect();
            window.clearInterval(interval);
            window.clearInterval(highlightInterval);
            window.removeEventListener("pointermove", handlePointerMove);
            window.removeEventListener("mouseout",handlePointerLeave);

            if (animationFrameId !== null) {
                cancelAnimationFrame(animationFrameId);
            }
        };
    }, [onSignalChange]);

    return (
        <canvas
            ref={canvasRef}
            aria-hidden="true"
            className="pointer-events-none absolute inset-0 h-full w-full"
        />
    );
}
