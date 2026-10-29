"use client"

import { Fragment, useRef, useEffect, useState } from "react";
import { editorSequence } from "@/data/editorFiles";
import { glitchCharacters } from "@/data/glitchCharacters";
import { createTypingFrames } from "@/utils/realisticTyping";

type SecondaryEditorPaneProps = {
    onEditingComplete: () => void;
    onExecutionComplete: () => void;
    runRequested: boolean;
    isVisible: boolean;
    onAutoKey: (key: string) => void;
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
    isVisible,
    onAutoKey
}: SecondaryEditorPaneProps) {
    const [typedLine, setTypedLine] = useState("");
    const [visibleLines, setVisibleLines] = useState(0);
    const [sourceLoaded, setSourceLoaded] = useState(false);
    const [typingComplete, setTypingComplete] = useState(false);
    const [insertedLines, setInsertedLines] = useState<string[]>([]);
    const [insertionComplete, setInsertionComplete] = useState(false);
    const [executionComplete, setExecutionComplete] = useState(false);
    
    const sourceRef = useRef<HTMLDivElement>(null);

    const [textMetrics, setTextMetrics] = useState({
        fontSize: 10,
        lineHeight: 15,
    });

    useEffect(() => {
        const updateTextSize = () => {
            const width = window.innerWidth;
            const height = window.innerHeight;

            let fontSize = 10;
            let lineHeight = 15;

            if (height < 650) {
                fontSize = 9;
                lineHeight = 13;
            } else if (width >= 2560) {
                fontSize = 15;
                lineHeight = 22;
            } else if (width >= 1800) {
                fontSize = 13;
                lineHeight = 19;
            } else if (width >= 1440) {
                fontSize = 11;
                lineHeight = 17;
            } else if (width < 1200) {
                fontSize = 9;
                lineHeight = 14;
            }

            setTextMetrics((previous) => {
                if (
                    previous.fontSize === fontSize &&
                    previous.lineHeight === lineHeight
                ) {
                    return previous;
                }

                return { fontSize, lineHeight };
            });
        };

        updateTextSize();

        window.addEventListener("resize", updateTextSize);

        return () => {
            window.removeEventListener("resize", updateTextSize);
        };
    }, []);

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

        const frames = createTypingFrames(newCode, 45, 0.025);

        let frameIndex = 0;
        let typingTimeout: number | undefined;

        const typeNextFrame = () => {
            if (frameIndex >= frames.length) {
                setTypingComplete(true);
                return;
            }

            const frame = frames[frameIndex];


            typingTimeout = window.setTimeout(() => {
                const previousText =
                    frameIndex > 0 ? frames[frameIndex - 1].text : "";

                const currentText = frame.text;

                if (currentText.length > previousText.length) {
                    onAutoKey(currentText.slice(-1));
                } else if (currentText.length < previousText.length) {
                    onAutoKey("backspace");
                }

                setTypedLine(currentText);
                frameIndex++;
                typeNextFrame();
            }, frame.delay);
        };

        const startTimeout = window.setTimeout(typeNextFrame, 1500);

        return () => {
            window.clearTimeout(startTimeout);
            window.clearTimeout(typingTimeout);
        };
    }, [sourceLoaded, onAutoKey]);

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
            createTypingFrames(line, 45, 0.025)
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
                    // Simulate pressing Enter to create a new line.
                    onAutoKey("enter");

                    // Add a new empty line to the editor.
                    setInsertedLines((previous) => [...previous, ""]);

                    // Brief pause before typing the next line.
                    typingTimeout = window.setTimeout(typeNextFrame, 150);
                } else {
                    setInsertionComplete(true);
                }

                return;
            }

            const frame = frames[frameIndex];
            const currentLineIndex = lineIndex;

            typingTimeout = window.setTimeout(() => {
                const previousText =
                    frameIndex > 0 ? frames[frameIndex - 1].text : "";

                const currentText = frame.text;

                // Send the typed character to the keyboard.
                if (currentText.length > previousText.length) {
                    onAutoKey(currentText.slice(-1));
                } else if (currentText.length < previousText.length) {
                    onAutoKey("backspace");
                }

                // Update the secondary editor.
                setInsertedLines((previous) => {
                    const updated = [...previous];
                    updated[currentLineIndex] = currentText;
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
    }, [typedLine, onAutoKey]);
 
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
        <div className="flex h-full w-full min-w-0 flex-col bg-transparent">

            {/* Header - matches CodeCanvas */}
            <div className="flex items-center justify-between px-3 py-2 border-b-2 border-[#494538]/40">
                <div className="flex items-center gap-2">
                    <span className="h-[5px] w-[5px] rounded-full bg-[#F5C542]" />

                    <span className="font-mono text-[12px] text-[#E6DDC9]">
                        src / system.ts
                    </span>
                </div>

                <span
                    className={`font-mono text-[12px] tracking-wide ${
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
                ref={sourceRef}
                className={`min-h-0 flex-1 overflow-hidden px-2 font-mono ${
                    executionPhase === "running" ? "animate-pulse" : ""
                }`}
                style={{
                    fontSize: `${textMetrics.fontSize}px`,
                    lineHeight: `${textMetrics.lineHeight}px`,
                    maskImage:
                        "linear-gradient(to bottom, transparent 0%, black 12%, black 88%, transparent 100%)",
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