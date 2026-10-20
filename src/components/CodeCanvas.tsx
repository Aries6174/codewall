"use client";

import { useEffect, useRef } from "react";
import { editorSequence } from "@/data/editorFiles"
import { glitchCharacters } from "@/data/glitchCharacters"
import { getRandomDeveloperQuote } from "@/data/developerQuotes";
import { createTypingFrames } from "@/utils/realisticTyping";

type PatchPhase = "idle" | "running" | "complete";

type CodeCanvasProps = {
    activeCommand: string;
    patchPhase: PatchPhase;
    onPatchPhaseChange: (phase: PatchPhase) => void;
    onNavigationComplete: () => void;
    isPaused: boolean;
};

export default function CodeCanvas({
    activeCommand,
    patchPhase,
    onPatchPhaseChange,
    onNavigationComplete,
    isPaused
}: CodeCanvasProps){
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const footerInfoRef = useRef<HTMLSpanElement>(null);
    const filenameRef = useRef<HTMLSpanElement>(null);
    const commandRef = useRef(activeCommand);
    const patchRequestRef = useRef(false);
    const navigationTargetRef = useRef<number | null>(null);
    const isPausedRef = useRef(isPaused);

    const lineHeight = 12;
    const fontSize = 8;
    const topPadding = 10;
    const gutterRight = 30;
    const codeStartX = 43;
    const charWidth = fontSize * 0.6;

    useEffect(() => {
        isPausedRef.current = isPaused;
    }, [isPaused]);

    useEffect(() => {
        commandRef.current = activeCommand;

        if (activeCommand === "run editor.patch"){
            patchRequestRef.current = true;
        }

        if (activeCommand.startsWith("goto ")) {
            const filename = activeCommand.slice(5).trim();

            const targetIndex = editorSequence.findIndex((line) =>
                line.fileName === filename &&
                line.lineNumber === 1
            );
            
            if (targetIndex !== -1) {
                navigationTargetRef.current = targetIndex;
            }
        }
    }, [activeCommand]);

    useEffect(() => {
        const canvas = canvasRef.current;

        if (!canvas) return;

        const ctx = canvas.getContext("2d");
        const canvasFont = getComputedStyle(canvas).fontFamily;

        if (!ctx) return;

                const logicalWidth = 620;
        const logicalHeight = 260;

        const resizeCanvas = () => {
            const rect = canvas.getBoundingClientRect();
            const pixelRatio = window.devicePixelRatio || 1;

            const width = Math.round(rect.width* pixelRatio);
            const height = Math.round(rect.height * pixelRatio);

            if (canvas.width !== width || canvas.height !== height) {
                canvas.width = width;
                canvas.height = height;
            }

            ctx.setTransform(
                width / logicalWidth,
                0,
                0,
                height / logicalHeight,
                0,
                0
            );
        };

        const resizeObserver = new ResizeObserver(resizeCanvas);

        resizeObserver.observe(canvas);
        resizeCanvas();


        let animationId: number;

        const mouse = {
            x: -100,
            y: -100
        };

        const codeLines = editorSequence.map((line) => line.text);

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

            // Control flow statements
            applyColor(
                /\b(if|else|for|while|switch|case|break|continue)\b/g,
                "#FF8A65"
            );

            // TypeScript types
            applyColor(
                /\b(number|string|boolean|void|Vector2D|Particle)\b/g,
                "#F5C542"
            );

            // Function calls
            applyColor(
                /\b[A-Za-z_$][\w$]*(?=\s*\()/g,
                "#79C0FF"
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

            // Braces
            applyColor(/[{}]/g, "#C792EA");

            // Parentheses
            applyColor(/[()]/g, "#79C0FF");

            // Square brackets
            applyColor(/[\[\]]/g, "#59C9A5");

            // Operators
            applyColor(/[=+\-*/<>!&|%]/g, "#FFB86C");

            return colors;
        };

        let firstVisibleLine = 0;
        let scrollOffset = 0;
        let scrollVelocity = 0;
        let lastFrameTime = 0;
        let editLineIndex = 6;
        let editColumn = codeLines[editLineIndex].length;
        const createQuote = () => {
            return `// ${getRandomDeveloperQuote()}`;
        };

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
        let isEditing = false;
        let isTerminalPatch = false;
        let lastManualScrollTime = Date.now();
        let autoPauseUntil = 0;
        let hoveredRow: number | null = null;
        let hoveredColumn: number | null = null;
        let quoteRow: number | null = null;
        let quoteText = "";
        let quoteTyping = false;

        const updateEditorInfo = () => {
            if (!footerInfoRef.current) return;
            
            const activeLine = editorSequence[firstVisibleLine];

            const displayLine = activeLine.kind === "code"
                ? activeLine
                : editorSequence.find(
                    (line) =>
                        line.fileName === activeLine.fileName &&
                        line.kind === "code"
                );


            if (filenameRef.current) {
                filenameRef.current.textContent = activeLine.fileName;
            }

            const currentIndex = (firstVisibleLine + (hoveredRow ?? 0)) % codeLines.length;

            const selectedLine = editorSequence[currentIndex];

            const currentLine = selectedLine.kind === "code" ? selectedLine : displayLine;

            if (!currentLine || currentLine.lineNumber === null) return;

            const percentage = currentLine.totalLines > 1
                ? ((currentLine.lineNumber - 1)) /
                    (currentLine.totalLines - 1) * 100
                : 100;

            const columnInfo = hoveredColumn != null ? `, Col ${hoveredColumn + 1}` : ` / ${currentLine.totalLines}`;

            footerInfoRef.current.textContent = `Ln ${currentLine.lineNumber}${columnInfo} · ${percentage.toFixed(1)}%`;
        };

        updateEditorInfo();

        const visibleLineCount = Math.ceil((canvas.height) / lineHeight) + 1;

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

            if (isPausedRef.current) return;

            lastManualScrollTime = Date.now();

            const delta =
                event.deltaMode === 1
                    ? event.deltaY * lineHeight
                    : event.deltaMode === 2
                        ? event.deltaY * canvas.height
                        : event.deltaY;

            scrollVelocity += delta * 0.12;

            scrollVelocity = Math.max(
                -30,
                Math.min(30, scrollVelocity)
            );

            hoveredRow = null;
            hoveredColumn = null;
        };

        const handleMouseMove = (event: MouseEvent) => {
            const rect = canvas.getBoundingClientRect();

            mouse.x = (event.clientX - rect.left) * (logicalWidth / rect.width);

            mouse.y = (event.clientY - rect.top) * (logicalHeight/ rect.height);

            const row = Math.floor((mouse.y - (topPadding - fontSize)) / lineHeight);

            const col = Math.floor((mouse.x - codeStartX) / charWidth);

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
            if (isPausedRef.current) return;
            
            const now = Date.now();

            if (navigationTargetRef.current !== null){
                return;
            }

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
            if (isPausedRef.current) {
                typingStartTimeout = window.setTimeout(
                    () => startEditing(forced),
                    1000
                )
                return;
            }
            
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

            if (!forced) {
                const candidateRows = [5, 6, 4, 7, 3, 8];

                const selectedRow = candidateRows.find((row) => {
                    const lineIndex = (firstVisibleLine + row) % codeLines.length;

                    return editorSequence[lineIndex].kind === "code";
                });

                if (selectedRow === undefined) {
                    typingStartTimeout = window.setTimeout(startEditing, 2000);
                    return;
                }

                isEditing = true;
                quoteTyping = true;
                quoteRow = selectedRow;
                quoteText = "";

                const fullQuote = createQuote();
                const typingFrames = createTypingFrames(fullQuote, 45, 0.08);

                let frameIndex = 0;

                const typeNextFrame = () => {
                    if (isPausedRef.current) return;

                    if (frameIndex < typingFrames.length) {
                        const frame = typingFrames[frameIndex];

                        typingStartTimeout = window.setTimeout(()=> {
                            if (isPausedRef.current) {
                                typeNextFrame();
                                return;
                            }

                            quoteText = frame.text;
                            frameIndex++;
                            typeNextFrame();
                        }, isPausedRef.current ? 100 : frame.delay);

                        return;
                    }

                    if (frameIndex >= typingFrames.length) {
                        glitchStartTimeout = window.setTimeout(() => {
                            let glitchFrame = 0;

                            glitchInterval = window.setInterval(() => {
                                if (isPausedRef.current) return;

                                glitchFrame++;

                                if (glitchFrame >= 8) {
                                    window.clearInterval(glitchInterval);

                                    quoteText = "";
                                    quoteRow = null;
                                    quoteTyping = false;
                                    isEditing = false;

                                    lastManualScrollTime = Date.now();

                                    typingStartTimeout = window.setTimeout(
                                        startEditing,
                                        12000
                                    );

                                    return;
                                }

                                quoteText = Array.from(
                                    { length: fullQuote.length },
                                    () => glitchCharacters[
                                        Math.floor(Math.random() * glitchCharacters.length)
                                    ]
                                ).join("");
                            }, 70);
                        }, 3000);
                    }
                };

                typeNextFrame();

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

                let replacementFrame = 0;
                
                glitchInterval = window.setInterval(() => {
                    if (isPausedRef.current) return;

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

                }, 70);

                return;
            }

            isEditing = false;

            if (isTerminalPatch) {
                onPatchPhaseChange("complete");
                isTerminalPatch = false;
            }

            lastManualScrollTime = Date.now();

            typingStartTimeout = window.setTimeout(
                startEditing,
                12000
            )
        };

        typingStartTimeout = window.setTimeout(startEditing, 7000);

        const animate = (time: number) => {
            const frameDelta = lastFrameTime
                ? Math.min((time - lastFrameTime) / 16.67, 2)
                : 1;

            lastFrameTime = time;

            if (isPausedRef.current) {
                scrollVelocity = 0;
                scrollOffset = 0;
            }

            const target = navigationTargetRef.current;

            if (target !== null && !isEditing && !isPausedRef.current) {
                const distance =
                    (target - firstVisibleLine + codeLines.length)
                    % codeLines.length;

                if (distance === 0) {
                    scrollOffset = 0;
                    scrollVelocity = 0;

                    navigationTargetRef.current = null;
                    lastManualScrollTime = Date.now();
                    autoPauseUntil = Date.now() + 3000;

                    updateVisibleLines();
                    updateEditorInfo();

                    onNavigationComplete();
                } else {
                    firstVisibleLine =
                        (firstVisibleLine + 1) % codeLines.length;

                    scrollVelocity = 0;

                    updateVisibleLines();
                    updateEditorInfo();
                }
            }

            if (!isPausedRef && Math.abs(scrollVelocity) > 0.05) {
                scrollOffset += scrollVelocity * frameDelta;

                while (scrollOffset >= lineHeight) {
                    scrollOffset -= lineHeight;
                    firstVisibleLine =
                        (firstVisibleLine + 1) % codeLines.length;

                    updateVisibleLines();
                    updateEditorInfo();
                }

                while (scrollOffset < 0) {
                    scrollOffset += lineHeight;
                    firstVisibleLine =
                        (firstVisibleLine - 1 + codeLines.length)
                        % codeLines.length;

                    updateVisibleLines();
                    updateEditorInfo();
                }

                scrollVelocity *= Math.pow(0.86, frameDelta);
            } else {
                scrollVelocity = 0;
            }

            if(patchRequestRef.current && !isEditing && navigationTargetRef.current === null) {
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

            ctx.font = `${fontSize}px ${canvasFont}`;
            ctx.fillStyle = "#92958B";
            ctx.textAlign = "right";

            for (let row = 0; row < visibleLines.length; row++) {  
                const lineIndex = (firstVisibleLine + row) % codeLines.length;
                const line = editorSequence[lineIndex];

                if (line.kind !== "code") continue;
                
                const shiftedRow =
                    quoteTyping && quoteRow !== null && row > quoteRow
                        ? row + 1
                        : row;

                const y = topPadding + shiftedRow * lineHeight;

                ctx.fillText(String(line.lineNumber), gutterRight, y);
            }

            ctx.font = `${fontSize}px ${canvasFont}`;
            ctx.textAlign = "left";
  
            for (let row = 0; row < characters.length; row++) {
                const lineIndex = (firstVisibleLine + row) % codeLines.length;
                const line = editorSequence[lineIndex];
                const shiftedRow =
                    quoteTyping && quoteRow !== null && row > quoteRow
                        ? row + 1
                        : row;

                const y = topPadding + shiftedRow * lineHeight;

                if (line.kind === "separator") {
                    ctx.fillStyle = "#494538";
                    ctx.fillText("─────────", codeStartX, y);
                    
                    const titleX = codeStartX + 10 * charWidth;

                    ctx.fillStyle = "#F5C542";
                    ctx.fillText(line.text, titleX, y);

                    const endX = titleX + (line.text.length + 1) * charWidth;

                    ctx.fillStyle = "#494538";
                    ctx.fillText("─────────", endX, y);
                    continue
                }

                for (let col = 0; col < characters[row].length; col++) {
                    const character = characters[row][col];
                    const x = codeStartX + col * charWidth;

                    ctx.fillStyle = characterColors[row][col];
                    ctx.fillText(character, x, y);
                }
            }

            if (quoteTyping && quoteRow !== null) {
                const commentRow = quoteRow + 1;
                const commentY = topPadding + commentRow * lineHeight;

                // New line marker
                ctx.fillStyle = "#59C9A5";
                ctx.textAlign = "right";
                ctx.fillText("+", gutterRight, commentY);

                // Developer comment
                ctx.textAlign = "left";
                ctx.fillStyle = "#92958B";
                ctx.fillText(quoteText, codeStartX, commentY);

                // Blinking typing cursor
                if (time % 1000 < 500) {
                    const cursorX = codeStartX + ctx.measureText(quoteText).width;

                    ctx.fillStyle = "#F5C542";
                    ctx.fillRect(
                        cursorX + 2,
                        commentY - fontSize,
                        2,
                        fontSize + 2
                    );
                }
            }

            const editRow = (
                editLineIndex - firstVisibleLine + codeLines.length
            ) % codeLines.length;

            const cursorVisible = time % 1000 < 500;

            if (isEditing && !quoteTyping && editRow < visibleLines.length && cursorVisible) {
                const cursorX = codeStartX + editColumn * charWidth;

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
            resizeObserver.disconnect();

            window.clearInterval(autoScrollInterval);
            window.clearTimeout(typingStartTimeout);
            window.clearInterval(typingInterval);
            window.clearTimeout(glitchStartTimeout);
            window.clearInterval(glitchInterval);

            canvas.removeEventListener("mousemove", handleMouseMove);
            canvas.removeEventListener("mouseleave", handleMouseLeave);
            canvas.removeEventListener("wheel", handleWheel);
        };
    }, [onPatchPhaseChange, onNavigationComplete]);

    
    return (
        <div className="w-full bg-[#0B0C0B]">

            
            <div className="flex items-center justify-between px-2 py-0.5">
                <div className="flex items-center gap-2">
                    <span className="h-[5px] w-[5px] rounded-full bg-[#F5C542]" />

                    <span className="font-mono text-[10px] text-[#E6DDC9]">
                        src / <span ref={filenameRef}>developer.ts</span>
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
                className="block w-full aspect-[620/260]"
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