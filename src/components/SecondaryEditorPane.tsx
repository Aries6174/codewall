"use client"

import { useEffect, useState } from "react";
import { editorSequence } from "@/data/editorFiles";

type SecondaryEditorPaneProps = {
    onEditingComplete: () => void;
    onExecutionComplete: () => void;
    runRequested: boolean;
};

const systemLines = editorSequence.filter(
    (line) => line.fileName === "system.ts"
);

const newCode = "const previewActive = true;"

export default function SecondaryEditorPane({
    onEditingComplete,
    onExecutionComplete,
    runRequested
}: SecondaryEditorPaneProps) {
    const [typedLine, setTypedLine] = useState("");
    const [typingComplete, setTypingComplete] = useState(false);
    const [insertedLines, setInsertedLines] = useState<string[]>([]);
    const [executionComplete, setExecutionComplete] = useState(false);

    const executionPhase = !runRequested
        ? "idle"
        : executionComplete
            ? "complete"
            : "running";
    useEffect(() => {
        let characterIndex = 0
        let typingInterval: number | undefined;

        const startTimeout = window.setTimeout(() => {
            typingInterval = window.setInterval(() => {
                characterIndex++;

                setTypedLine(newCode.slice(0, characterIndex));

                if (characterIndex >= newCode.length) {
                    window.clearInterval(typingInterval);
                    setTypingComplete(true);
                }
            }, 90);
        }, 1500);

        return () => {
            window.clearTimeout(startTimeout);
            window.clearInterval(typingInterval);
        };
    }, []);

    useEffect(() => {
        if (!typingComplete) return;

        let glitchInterval: number | undefined;

        const timeout = window.setTimeout(() => {
            const glitchSymbols = "█▓▒░";
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
                    () => glitchSymbols[
                        Math.floor(Math.random() * glitchSymbols.length)
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
        if (typedLine !== "const previewActive = false;") return;

        const codeBlock = [
            "",
            "function renderPreview() {",
            "    if (!previewActive) return;",
            '    console.log("Preview initialized");',
            "}"
        ];

        let lineIndex = 0;
        let insertionInterval: number | undefined;

        const startTimeout = window.setTimeout(() => {
            insertionInterval = window.setInterval(() => {
                if (lineIndex >= codeBlock.length) {
                    window.clearInterval(insertionInterval);
                    return;
                }

                const nextLine = codeBlock[lineIndex];

                setInsertedLines((previous) => [
                    ...previous,
                    nextLine
                ]);

                lineIndex++;
            }, 500);
        }, 1000);

        return () => {
            window.clearTimeout(startTimeout);
            window.clearInterval(insertionInterval);
        };
    }, [typedLine]);
 
    useEffect(() => {
        if (insertedLines.length !== 5) return;

        let glitchInterval: number | undefined;
        let glitchFrame = 0;

        const startTimeout = window.setTimeout(() => {
            const glitchSymbols = "█▓▒░⣿⣶⣤⠿";

            glitchInterval = window.setInterval(() => {
                glitchFrame++;

                if (glitchFrame >= 8) {
                    window.clearInterval(glitchInterval);

                    setInsertedLines([]);
                    onEditingComplete();

                    return;
                }

                setInsertedLines((previous) =>
                    previous.map((line, index) => {
                        if (index === 0) return line;

                        return line.replace(/\S/g, () =>
                            glitchSymbols[
                                Math.floor(
                                    Math.random() * glitchSymbols.length
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
    }, [insertedLines.length, onEditingComplete]);

    useEffect(() => {
        if (!runRequested) return;

        const timeout = window.setTimeout(() => {
            setExecutionComplete(true);
            onExecutionComplete();
        }, 1800);

        return () => window.clearTimeout(timeout);
    }, [runRequested, onExecutionComplete]);

    return(
        <div className="w-full min-w-0 bg-[#0B0C0B]">

            {/* Header */}
            <div className="flex items-center justify-between px-2 py-0.5">
                <span className="font-mono text-[10px] text-[#E6DDC9]">
                    <span className="text-[#F5C542]">●</span>
                    {" "}src / system.ts
                </span>

                <span
                    className={`font-mono text-[9px] ${
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

            {/* Source code */}
            <div className={`h-[260px] overflow-hidden px-2 font-mono text-[10px] leading-[12px] ${
                executionPhase === "running" ? "animate-pulse" : ""
            }`}>
                {systemLines.map((line) => (
                    <div key={line.lineNumber} className="flex">
                        <span className="mr-3 w-5 shrink-0 text-right text-[#92958B]">
                            {line.lineNumber}
                        </span>

                        <span className="whitespace-pre text-[#E6DDC9]">
                            {line.text}
                        </span>
                    </div>
                ))}
                
                <div className="flex">
                    <span className="mr-3 w-5 shrink-0 text-right text-[#92958B]">
                        {systemLines.length + 1}
                    </span>

                    <span className="whitespace-pre text-[#E6DDC9]">
                        {typedLine}
                        <span className="text-[#F5C542]">▌</span>
                    </span>
                </div>

                {insertedLines.map((line, index) => (
                    <div key={index} className="flex">
                        <span className="mr-3 w-5 shrink-0 text-right text-[#92958B]">
                            {systemLines.length + 2 + index}
                        </span>

                        <span className="whitespace-pre text-[#E6DDC9]">
                            {line || " "}
                        </span>
                    </div>
                ))}

            </div>

            {/* Footer */}

            <div className="flex items-center justify-between px-2 py-0.5 font-mono text-[9px]">
                <span className="text-[#F5C542]">
                    ● SOURCE LOADED
                </span>

                <span className="text-[#92958B]">
                    Ln 1 / {systemLines.length} . 0.0%
                </span>
            </div>

        </div>
    );
}