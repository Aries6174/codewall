"use client"

import { Fragment, useEffect, useState } from "react";
import { editorSequence } from "@/data/editorFiles";
import { glitchCharacters } from "@/data/glitchCharacters";
import { createTypingFrames } from "@/utils/realisticTyping";

type SecondaryEditorPaneProps = {
    onEditingComplete: () => void;
    onExecutionComplete: () => void;
    runRequested: boolean;
    isVisible: boolean;
};

const systemLines = editorSequence.filter(
    (line) => line.fileName === "system.ts"
);

const patchInsertIndex = systemLines.reduce(
    (lastImportIndex, line, index) =>
        line.text.trim().startsWith("import ")
        ? index
        : lastImportIndex,
    -1
);

const newCode = "const diagnosticsEnabled = true;"

function HighlightedCode({ text }: { text: string }) {
    const tokens = text.split(
        /(\/\/.*|"(?:\\.|[^"\\])*"|'(?:\\.|[^'\\])*'|\b(?:const|let|type|function|return|if|else|for|while|switch|case|break|continue)\b|\b(?:number|string|boolean|void|Vector2D|Particle)\b|\b\d+(?:\.\d+)?\b|[{}()[\]=+\-*/<>!&|%])/g
    );
    return (
        <span className="whitespace-pre">
            {tokens.map((token, index) => {
                let color = "#E6DDC9";

                if (token.startsWith("//")) {
                    color = "#92958B";
                } else if (/^(if|else|for|while|switch|case|break|continue)$/.test(token)) {
                    color = "#FF8A65";
                } else if (/^(const|let|type|function|return)$/.test(token)) {
                    color = "#D94B43";
                } else if (/^[{}]$/.test(token)) {
                    color = "#C792EA";
                } else if (/^[()]$/.test(token)) {
                    color = "#79C0FF";
                } else if (/^[\[\]]$/.test(token)) {
                    color = "#59C9A5";
                } else if (/^[=+\-*/<>!&|%]$/.test(token)) {
                    color = "#FFB86C";
                } else if (
                    /^(number|string|boolean|void|Vector2D|Particle)$/.test(token) ||
                    /^\d+(?:\.\d+)?$/.test(token) ||
                    token.startsWith('"') ||
                    token.startsWith("'")
                ) {
                    color = "#F5C542";
                }

                return (
                    <span key={index} style={{ color }}>
                        {token}
                    </span>
                );
            })}
        </span>
    );
}

export default function SecondaryEditorPane({
    onEditingComplete,
    onExecutionComplete,
    runRequested,
    isVisible
}: SecondaryEditorPaneProps) {
    const [typedLine, setTypedLine] = useState("");
    const [visibleLines, setVisibleLines] = useState(0);
    const [sourceLoaded, setSourceLoaded] = useState(false);
    const [typingComplete, setTypingComplete] = useState(false);
    const [insertedLines, setInsertedLines] = useState<string[]>([]);
    const [insertionComplete, setInsertionComplete] = useState(false);
    const [executionComplete, setExecutionComplete] = useState(false);

    const executionPhase = !runRequested
        ? "idle"
        : executionComplete
            ? "complete"
            : "running";

    useEffect(() => {
        if (!isVisible) return;
        
        let lineIndex = 0;
        let lineInterval: number | undefined;

        const startTimeout = window.setTimeout(() => {
            lineInterval = window.setInterval(() => {
                lineIndex++;

                setVisibleLines(lineIndex);

                if (lineIndex >= systemLines.length) {
                    window.clearInterval(lineInterval);
                    setSourceLoaded(true);
                }
            },90);
        }, 550);

        return () => {
            window.clearTimeout(startTimeout);
            window.clearInterval(lineInterval);
        };
    }, [isVisible]);

    useEffect(() => {
        if (!sourceLoaded) return;

        const frames = createTypingFrames(newCode, 45, 0.08);

        let frameIndex = 0;
        let typingTimeout: number | undefined;

        const typeNextFrame = () => {
            if (frameIndex >= frames.length) {
                setTypingComplete(true);
                return;
            }

            const frame = frames[frameIndex];

            typingTimeout = window.setTimeout(() => {
                setTypedLine(frame.text);
                frameIndex++;
                typeNextFrame();
            }, frame.delay);
        };

        const startTimeout = window.setTimeout(typeNextFrame, 1500);

        return () => {
            window.clearTimeout(startTimeout);
            window.clearTimeout(typingTimeout);
        };
    }, [sourceLoaded]);

    useEffect(() => {
        if (!typingComplete) return;

        let glitchInterval: number | undefined;

        const timeout = window.setTimeout(() => {
            let glitchFrame = 0;

            glitchInterval = window.setInterval(() => {
                glitchFrame++;

                if (glitchFrame >= 8) {
                    window.clearInterval(glitchInterval);

                    setTypedLine(
                        newCode.replace("true", "false")
                    );

                    return;
                }

                const scrambled = Array.from(
                    { length: 4 },
                    () => glitchCharacters[
                        Math.floor(Math.random() * glitchCharacters.length)
                    ]
                ).join("");

                setTypedLine(
                    newCode.replace("true", scrambled)
                );
            }, 70);
        }, 1500);

        return () => {
            window.clearTimeout(timeout);
            window.clearInterval(glitchInterval);
        };
    }, [typingComplete]);

    useEffect(() => {
        if (typedLine !== "const diagnosticsEnabled = false;") return;

        const codeBlock = [
            "function logBootStatus(): void {",
            "    if (!diagnosticsEnabled) return;",
            '    console.info("Runtime diagnostics active");',
            "}"
        ];

        const lineFrames = codeBlock.map((line) =>
        createTypingFrames(line, 45, 0.08)
    );

    let lineIndex = 0;
    let frameIndex = 0;
    let typingTimeout: number | undefined;

    const typeNextFrame = () => {
        if (lineIndex >= lineFrames.length) {
            setInsertionComplete(true);
            return;
        }

        const frames = lineFrames[lineIndex];

        if (frameIndex >= frames.length) {
            lineIndex++;
            frameIndex = 0;

            if (lineIndex < lineFrames.length) {
                setInsertedLines((previous) => [...previous, ""]);

                typingTimeout = window.setTimeout(typeNextFrame, 150);
            } else {
                setInsertionComplete(true);
            }

            return;
        }

        const frame = frames[frameIndex];
        const currentLineIndex = lineIndex;

        typingTimeout = window.setTimeout(() => {
            setInsertedLines((previous) => {
                const updated = [...previous];
                updated[currentLineIndex] = frame.text;
                return updated;
            });

            frameIndex++;
            typeNextFrame();
        }, frame.delay);
    };

    const startTimeout = window.setTimeout(typeNextFrame, 1000);

    return () => {
        window.clearTimeout(startTimeout);
        window.clearTimeout(typingTimeout);
    };
    }, [typedLine]);
 
    useEffect(() => {
        if (!insertionComplete) return;

        let glitchInterval: number | undefined;
        let glitchFrame = 0;

        const startTimeout = window.setTimeout(() => {

            glitchInterval = window.setInterval(() => {
                glitchFrame++;

                if (glitchFrame >= 8) {
                    window.clearInterval(glitchInterval);

                    setInsertedLines([]);
                    onEditingComplete();

                    return;
                }

                setInsertedLines((previous) =>
                    previous.map((line) => {
                        return line.replace(/\S/g, () =>
                            glitchCharacters[
                                Math.floor(
                                    Math.random() * glitchCharacters.length
                                )
                            ]
                        );
                    })
                );
            }, 70);
        }, 1500);

        return () => {
            window.clearTimeout(startTimeout);
            window.clearInterval(glitchInterval);
        };
    }, [insertionComplete, onEditingComplete]);

    useEffect(() => {
        if (!runRequested) return;

        const timeout = window.setTimeout(() => {
            setExecutionComplete(true);
            onExecutionComplete();
        }, 1800);

        return () => window.clearTimeout(timeout);
    }, [runRequested, onExecutionComplete]);


    return (
        <div className="flex h-full w-full min-w-0 flex-col bg-[#0B0C0B]">

            {/* Header - matches CodeCanvas */}
            <div className="flex items-center justify-between px-2 py-0.5">
                <div className="flex items-center gap-2">
                    <span className="h-[5px] w-[5px] rounded-full bg-[#F5C542]" />

                    <span className="font-mono text-[10px] text-[#E6DDC9]">
                        src / system.ts
                    </span>
                </div>

                <span
                    className={`font-mono text-[10px] tracking-wide ${
                        executionPhase === "running"
                            ? "animate-pulse text-[#F5C542]"
                            : "text-[#92958B]"
                    }`}
                >
                    {executionPhase === "running"
                        ? "EXECUTING..."
                        : executionPhase === "complete"
                            ? "EXECUTION COMPLETE"
                            : "PREVIEW MODE"}
                </span>
            </div>

            {/* Source code viewport */}
            <div
                className={`min-h-0 flex-1 overflow-hidden px-2 font-mono text-[10px] leading-[12px] ${
                    executionPhase === "running" ? "animate-pulse" : ""
                }`}
                style={{
                    maskImage:
                        "linear-gradient(to bottom, transparent 0%, black 12%, black 88%, transparent 100%)"
                }}
            >
                
            {/* Source lines with an inline patch */}
            {systemLines.slice(0, visibleLines).map((line, index) => (
                <Fragment key={line.lineNumber}>
                    <div className="flex">
                        <span className="mr-3 w-5 shrink-0 text-right text-[#92958B]">
                            {line.lineNumber}
                        </span>
                        <HighlightedCode text={line.text} />
                    </div>

                    {/* Insert the patch immediately after the imports */}
                    {sourceLoaded && index === patchInsertIndex && (
                        <>
                            <div className="flex">
                                <span className="mr-3 w-5 shrink-0 text-right text-[#59C9A5]">
                                    +
                                </span>
                                <span className="whitespace-pre">
                                    <HighlightedCode text={typedLine} />
                                    <span className="cursor-blink text-[#F5C542]">
                                        ▌
                                    </span>
                                </span>
                            </div>

                            {insertedLines.map((insertedLine, lineIndex) => (
                                <div key={lineIndex} className="flex">
                                    <span className="mr-3 w-5 shrink-0 text-right text-[#59C9A5]">
                                        +
                                    </span>
                                    <HighlightedCode text={insertedLine || " "} />
                                </div>
                            ))}
                        </>
                    )}
                </Fragment>
            ))}

            </div>

            {/* Footer - matches CodeCanvas */}
            <div className="flex items-center justify-between px-3 py-3">
                <span className="font-mono text-[10px] text-[#F5C542]">
                    ● SOURCE LOADED
                </span>

                <span className="font-mono text-[10px] text-[#92958B]">
                    Ln 1 / {systemLines.length} · 0.0%
                </span>
            </div>


        </div>
    );
}