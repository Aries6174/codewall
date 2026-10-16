"use client";

import { useEffect, useRef, useState } from "react";

const commands = [
    {
        input: "inspect src/developer.ts",
        output: "Source file loaded."
    },
    {
        input: "system status",
        output: "Editor online. Autonomous mode active."
    }
];
export default function IntroTerminal() {
    const terminalOutputRef = useRef<HTMLDivElement>(null);
    
    const [commandIndex, setCommandIndex] = useState(0);
    const [visibleCount, setVisibleCount] = useState(0);

    const [history, setHistory] = useState<
        { input: string; output: string }[]
        >([]);

    const currentCommand = commands[commandIndex];

    useEffect(() => {
        if (!currentCommand) return;

        if (visibleCount < currentCommand.input.length) {
            const timeout = window.setTimeout(() => {
                setVisibleCount((count) => count + 1);
            }, 90);

            return () => window.clearTimeout(timeout);
        }

        const timeout = window.setTimeout(() => {
            setHistory((previous) => [
                ...previous,
                currentCommand
            ]);

            setCommandIndex((index) => index + 1);
            setVisibleCount(0);
        }, 800);

        return () => window.clearTimeout(timeout);
    }, [commandIndex, visibleCount, currentCommand]);

    useEffect(() => {
        const terminal = terminalOutputRef.current;

        if(!terminal) return;

        terminal.scrollTop = terminal.scrollHeight;
    }, [history, visibleCount]);

    return(
        <div className="w-full max-w-[620px] font-mono">

            {/* Terminal header */}
            <div className="flex items-center justify-between text-[10px] text-[#92958B]">
                <span>TERMINAL / SESSION 001</span>
                <span>
                    {!currentCommand ? "READY" : visibleCount < currentCommand.input.length ? "TYPING": "EXECUTING"}
                </span>
            </div>

            {/* Terminal output */}
            <div
                ref={terminalOutputRef}
                className="mt-3 h-[112px] space-y-2 overflow-y-auto [scrollbar-width:none] [&::-webkit-scrollbar]:hidden text-xs"
            >
                <p className="text-[#92958B]">
                    <span className="mr-3 text-[#F5C542]">➜</span>
                    system ready
                </p>

                {/* Completed commands */}
                {history.map((entry, index) => (
                    <div key={index} className="space-y-1">
                        <p className="text-[#E6DDC9]">
                            <span className="mr-3 text-[#F5C542]">➜</span>
                            {entry.input}
                        </p>

                        <p className="pl-6 text-[#92958B]">
                            {entry.output}
                        </p>
                    </div>
                ))}

                {/* Active Command prompt */}
                <p className="text-[#E6DDC9]">
                    <span className="mr-3 text-[#F5C542]">➜</span>
                    {currentCommand?.input.slice(0, visibleCount) ?? ""}
                    <span className="cursor-blink text-[#F5C542]">
                        _
                    </span>
                </p>
            </div>
        </div>
    )
}