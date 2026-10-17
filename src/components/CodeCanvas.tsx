"use client";

import { useEffect, useRef } from "react";

type PatchPhase = "idle" | "running" | "complete";

type CodeCanvasProps = {
    activeCommand: string;
    patchPhase: PatchPhase;
    onPatchPhaseChange: (phase: PatchPhase) => void;
};

export default function CodeCanvas({
    activeCommand,
    patchPhase,
    onPatchPhaseChange
}: CodeCanvasProps){
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const footerInfoRef = useRef<HTMLSpanElement>(null);
    const commandRef = useRef(activeCommand);
    const patchRequestRef = useRef(false);

    const lineHeight = 18;
    const fontSize = 12;
    const topPadding = 18;
    const gutterRight =  38;
    const codeStartX =  54;

    useEffect(() => {
        commandRef.current = activeCommand;

        if (activeCommand === "run editor.patch"){
            patchRequestRef.current = true;
        }
    }, [activeCommand]);

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


        const sourceCode = `
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
        `;

        const codeLines = sourceCode.trim().split("\n").map((line) => line.replace(/^ {8}/, ""));

        const getLineColors = (line: string) => {
            const colors = Array(line.length).fill("#E6DDC9");

            const applyColor = (pattern: RegExp, color: string) => {
                for (const match of line.matchAll(pattern)) {
                    const start = match.index;

                    for (let i = start; i < start + match[0].length; i++){
                        colors[i] = color;
                    }
                }
            };
            // TypeScript keywords
            applyColor(
                /\b(const|let|type|function|return|if|else)\b/g,
                "#D94B43"
            );

            // TypeScript types
            applyColor(
                /\b(number|string|boolean|void|Vector2D|Particle)\b/g,
                "#F5C542"
            );

            // Numbers (including decimals)
            applyColor(
                /\b\d+(?:\.\d+)?\b/g,
                "#F5C542"
            );

            // Strings enclosed in single or double quotes
            applyColor(
                /"([^"\\]|\\.)*"|'([^'\\]|\\.)*'/g,
                "#F5C542"
            );
      
            // Full-line comments
            applyColor(
                /^\s*\/\/.*$/g,
                "#92958B"
            );

            return colors;
        };

        let firstVisibleLine = 0;
        let editLineIndex = 6;
        let editColumn = codeLines[editLineIndex].length;
        const typingOptions = [
            " // live",
            " // synced",
            " // updated",
        ];
        const replacementOptions = [{
            search: "radius: 45",
            replacement: "radius: 60",
        },
        {
            search: "maxPush: 15",
            replacement: "maxPush: 20",
        },
        {
            search: "easing: 0.1",
            replacement: "easing: 0.2",
        },
        {
            search: "friction: 0.85",
            replacement: "friction: 0.95",
        },];
        let nextReplacementIndex = 0;
        const replacementStates = replacementOptions.map(() => false);
        let typingText = typingOptions[0]; 
        let nextTypingIndex = 0;
        let isEditing = false;
        let isTerminalPatch = false;
        let typedCount = 0;
        let lastManualScrollTime = Date.now();
        let autoPauseUntil = 0;
        let hoveredRow: number | null = null;
        let hoveredColumn: number | null = null;

        const updateEditorInfo = () => {
            if (!footerInfoRef.current) return;
            
            const totalLines = codeLines.length;
            const currentLine = ((firstVisibleLine + (hoveredRow ?? 0)) % totalLines) + 1;

            const percentage = totalLines > 1 ? ((currentLine - 1) / (totalLines - 1)) * 100 : 100;

            const columnInfo = hoveredColumn != null ? `, Col ${hoveredColumn + 1}` : ` / ${totalLines}`;

            footerInfoRef.current.textContent = `Ln ${currentLine}${columnInfo} · ${percentage.toFixed(1)}%`;
        };

        updateEditorInfo();

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

        let characterColors = visibleLines.map(
            (line => getLineColors(line))
        );

        const updateVisibleLines = () => {
            visibleLines = getVisibleLines(firstVisibleLine);
            
            characters = visibleLines.map((line) => line.split(""));

            characterColors = visibleLines.map((line) => getLineColors(line));
        }

        hoveredRow = null;
        hoveredColumn = null;

        const handleWheel = (event: WheelEvent) => {
            event.preventDefault();

            lastManualScrollTime = Date.now();

            const direction = Math.sign(event.deltaY);

            firstVisibleLine = (
                firstVisibleLine + direction + codeLines.length
            ) % codeLines.length;

            hoveredRow = null;
            hoveredColumn = null;

            updateVisibleLines();
            updateEditorInfo();
        };

        const handleMouseMove = (event: MouseEvent) => {
            const rect = canvas.getBoundingClientRect();

            mouse.x = (event.clientX - rect.left) * (canvas.width / rect.width);

            mouse.y = (event.clientY - rect.top) * (canvas.height / rect.height);

            const row = Math.floor((mouse.y - (topPadding - fontSize)) / lineHeight);

            const col = Math.floor((mouse.x - codeStartX) / 8);

            if (row >= 0 && row < visibleLines.length) {
                hoveredRow = row;
                hoveredColumn = col >= 0 && col < visibleLines[row].length ? col : null;
            } else {
                hoveredRow = null;
                hoveredColumn = null;
            }

            updateEditorInfo();
        };

        const handleMouseLeave = () => {
            mouse.x = -100;
            mouse.y = -100;

            hoveredRow = null;
            hoveredColumn = null;

            updateEditorInfo();
        };

        canvas.addEventListener("mousemove", handleMouseMove);
        canvas.addEventListener("mouseleave", handleMouseLeave);
        canvas.addEventListener("wheel", handleWheel, { passive: false });

        const autoScrollInterval = window.setInterval(() => {
            const now = Date.now();

            if (commandRef.current === "inspect src/developer.ts"){
                return;
            }

            if (isEditing) {
                return;
            }
            const timeSinceManualScroll = now - lastManualScrollTime;

            if (timeSinceManualScroll < 5000) {
                return;
            }

            if(now < autoPauseUntil){
                return;
            }

            firstVisibleLine = (firstVisibleLine + 1) % codeLines.length;

            hoveredRow = null;
            hoveredColumn = null;

            updateVisibleLines();
            updateEditorInfo();

            const currentCode = codeLines[firstVisibleLine].trim();

            const isImportantLine = /^(function|type)\b/.test(currentCode) || currentCode.startsWith("//");

            if (isImportantLine) {
                autoPauseUntil = now + 3000;
            }
        }, 1200);

        let typingInterval: number | undefined;
        let typingStartTimeout: number | undefined;
        let glitchInterval: number | undefined;
        let glitchStartTimeout: number | undefined;

        const startEditing = (forced = false) => {
            if (isEditing) return;
            isTerminalPatch = forced;

            if (isTerminalPatch) {
                onPatchPhaseChange("running");
            }

            const idleTime = Date.now() - lastManualScrollTime;

            if (!forced && idleTime < 5000) {
                typingStartTimeout = window.setTimeout(startEditing, 1000);
                return;
            }

            if (!forced && commandRef.current === "inspect src/developer.ts") {
                typingStartTimeout = window.setTimeout(startEditing, 1000);
                return;
            }

            isEditing = true;

            const selectedReplacement = replacementOptions[nextReplacementIndex];

            const replacement = replacementStates[nextReplacementIndex] ? {
                search: selectedReplacement.replacement,
                replacement: selectedReplacement.search,
            }
            : selectedReplacement;

            const replacementRow = [5, 6, 4, 7, 3, 8].find((row) => {
                return visibleLines[row]?.includes(replacement.search);
            });

            if (replacementRow !== undefined) {
                editLineIndex = (
                    firstVisibleLine + replacementRow
                ) % codeLines.length;

                const originalLine = codeLines[editLineIndex];

                const oldValue = replacement.search.split(": ")[1];
                const newValue = replacement.replacement.split(": ")[1];

                const valueStart = originalLine.indexOf(replacement.search) + replacement.search.indexOf(": ") + 2;

                const before = originalLine.slice(0, valueStart);
                const after = originalLine.slice(valueStart + oldValue.length);

                editColumn = valueStart;

                const glitchSymbols = "█▓▒░⣿⣶⣤⠿";

                let replacementFrame = 0;
                
                glitchInterval = window.setInterval(() => {
                    replacementFrame++;

                    if (replacementFrame >= 8) {
                        window.clearInterval(glitchInterval);

                        codeLines[editLineIndex] = before + newValue + after;

                        editColumn = valueStart + newValue.length;

                        updateVisibleLines();

                        replacementStates[nextReplacementIndex] = !replacementStates[nextReplacementIndex];

                        nextReplacementIndex = ( 
                            nextReplacementIndex + 1
                        ) % replacementOptions.length;

                        isEditing = false;

                        if (isTerminalPatch) {
                            onPatchPhaseChange("complete");
                            isTerminalPatch = false;
                        }

                        lastManualScrollTime = Date.now();

                        typingStartTimeout = window.setTimeout(startEditing, 12000);

                        return;
                    }

                    const scrambled = Array.from(
                        { length: oldValue.length },
                        () => glitchSymbols[Math.floor(Math.random() * glitchSymbols.length)]
                    ).join("");

                    codeLines[editLineIndex] = before + scrambled + after;

                    updateVisibleLines();
                }, 70);

                return;
            }

            typingText = typingOptions[nextTypingIndex];

            const candidateRows = [5, 6, 4, 7, 3, 8];

            const targetRow = candidateRows.find((row) => {
                const line = visibleLines[row];

                return (
                    line !== undefined &&
                    line.trim().length > 0 &&
                    line.trim() !== "}" &&
                    line.trim() !== "};" &&
                    line.length + typingText.length < 65
                );
            });

            if (targetRow === undefined) {
                isEditing = false;
                typingStartTimeout = window.setTimeout(startEditing, 2000);
                return;
            }
            editLineIndex = (firstVisibleLine + targetRow) % codeLines.length;

            editColumn = codeLines[editLineIndex].length;

            nextTypingIndex = (nextTypingIndex + 1) % typingOptions.length;

            hoveredRow = null;
            hoveredColumn = null;

            updateVisibleLines();
            updateEditorInfo();

            typingInterval = window.setInterval(() => {
                if (typedCount >= typingText.length) {
                    window.clearInterval(typingInterval);

                    glitchStartTimeout = window.setTimeout(() => {
                        const originalLine = codeLines[editLineIndex];
                        const baseCode = originalLine.slice(0, originalLine.length - typingText.length);   
                        const glitchSymbols = "█▓▒░⣿⣶⣤⠿■▪@#$%&";

                        let glitchFrame = 0;

                        glitchInterval = window.setInterval(() => {
                            glitchFrame++;

                            if (glitchFrame >= 8) {
                                window.clearInterval(glitchInterval);

                                codeLines[editLineIndex] = baseCode;
                                editColumn = baseCode.length;

                                updateVisibleLines();

                                typedCount = 0;
                                isEditing = false;

                                if (isTerminalPatch) {
                                    onPatchPhaseChange("complete");
                                    isTerminalPatch = false;
                                }

                                lastManualScrollTime = Date.now();

                                lastManualScrollTime = Date.now();

                                typingStartTimeout = window.setTimeout(startEditing, 12000);
                                
                                return;
                            }

                            const scrambled = Array.from(
                                { length: typingText.length },
                                () => glitchSymbols[Math.floor(Math.random() * glitchSymbols.length)]).join("");

                                codeLines[editLineIndex] = baseCode + scrambled;

                                updateVisibleLines();
                        }, 50);
                    }, 1500);

                    return;
                }

                codeLines[editLineIndex] += typingText[typedCount];

                typedCount++;

                editColumn = codeLines[editLineIndex].length;

                updateVisibleLines();
            }, 150);
        };

        typingStartTimeout = window.setTimeout(startEditing, 7000);

        const animate = (time: number) => {
            if(patchRequestRef.current && !isEditing){
                patchRequestRef.current = false;

                window.clearTimeout(typingStartTimeout);

                startEditing(true);
            }

            ctx.clearRect(0, 0, canvas.width, canvas.height);

            if (hoveredRow !== null){
                const highlightY = topPadding + hoveredRow * lineHeight - lineHeight + 3;
                
                ctx.fillStyle = "rgba(245, 197, 66, 0.05)";

                ctx.fillRect(0, highlightY, canvas.width, lineHeight);
            }

            ctx.font = `${fontSize}px monospace`;
            ctx.fillStyle = "#92958B";
            ctx.textAlign = "right";

            for (let row = 0; row < visibleLines.length; row++) {     
                const lineNumber = String(
                    ((firstVisibleLine + row) % codeLines.length) + 1
                );

                const y = topPadding + row * lineHeight;

                ctx.fillText(lineNumber, gutterRight, y);
            }

            ctx.font = `${fontSize}px monospace`;
            ctx.textAlign = "left";
  
            for (let row = 0; row < characters.length; row++) {
                for (let col = 0; col < characters[row].length; col++) {
                    const character = characters[row][col];

                    const x = codeStartX + col * 8;
                    const y = topPadding + row * lineHeight;

                    ctx.fillStyle = characterColors[row][col];

                    ctx.fillText(character, x, y);
                }
            }

            const editRow = (
                editLineIndex - firstVisibleLine + codeLines.length
            ) % codeLines.length;

            const cursorVisible = time % 1000 < 500;

            if (editRow < visibleLines.length && cursorVisible) {
                const cursorX = codeStartX + editColumn * 8;

                const cursorY = topPadding + editRow * lineHeight - fontSize + 1;

                ctx.fillStyle = "#F5C542";

                ctx.fillRect(cursorX, cursorY, 2, fontSize + 2);
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

            window.clearInterval(autoScrollInterval);
            window.clearTimeout(typingStartTimeout);
            window.clearInterval(typingInterval);
            window.clearTimeout(glitchStartTimeout);
            window.clearInterval(glitchInterval);

            canvas.removeEventListener("mousemove", handleMouseMove);
            canvas.removeEventListener("mouseleave", handleMouseLeave);
            canvas.removeEventListener("wheel", handleWheel);
        };
    }, [onPatchPhaseChange]);

    
    return (
        <div className="w-full max-w-[620px] bg-[#0B0C0B]">

            
            <div className="flex items-center justify-between px-3 py-3">
                <div className="flex items-center gap-2">
                    <span className="h-[5px] w-[5px] rounded-full bg-[#F5C542]" />

                    <span className="font-mono text-xs text-[#E6DDC9]">
                        src / developer.ts
                    </span>
                </div>

                <span className="font-mono text-[10px] tracking-wide text-[#92958B]">    
                    {patchPhase === "running"
                        ? "PATCH MODE — RUNNING"
                        : patchPhase === "complete"
                            ? "PATCH MODE — COMPLETE"
                            : activeCommand === "inspect src/developer.ts"
                                ? "INSPECT MODE — ACTIVE"
                                : activeCommand === "run editor.patch"
                                    ? "PATCH MODE — REQUESTED"
                                    : "LOOP MODE — ACTIVE"}
                </span>
            </div>
            <canvas
                ref={canvasRef}
                width={620}
                height={260}
                className="block h-auto w-full"
            />

            <div className="flex items-center justify-between px-3 py-3">
                <span className="text-[10px] text-[#F5C542]">
                    ● SYSTEM ACTIVE
                </span>

                <span
                    ref={footerInfoRef}
                    className="font-mono text-[10px] text-[#92958B]"
                >
                    Ln 1 / - · 0.0%
                </span>
            </div>

        </div>
    );
}