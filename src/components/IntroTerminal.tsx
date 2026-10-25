
"use client";

import { useEffect, useImperativeHandle, useMemo, useRef, useState } from "react";
import { editorFiles } from "@/data/editorFiles";
import { createTypingFrames } from "@/utils/realisticTyping";

const commandGroups = {
    startup: [
        {
            input: "inspect src/developer.ts",
            output: "Source file loaded."
        },
        {
            input: "system status",
            output: "Editor online. Autonomous mode active."
        },
        {
            input: "run editor.patch",
            output: "Applying source changes..."
        }
    ],

    idle: [
        {
            input: "editor.open preview.ts",
            output: "Opening secondary editor..."
        },
        {
            input: "editor.run preview.ts",
            output: "Executing preview..."
        },
        {
            input: "editor.close preview.ts",
            output: "Secondary editor closed."
        }
    ]
};

const commands = [
    ...commandGroups.startup,
    ...commandGroups.idle
];

const availableCommands = [
    "help",
    "clear",
    "inspect",
    "resume",
    "patch",
    "enter system",
    ...Object.keys(editorFiles).map((file) => `goto ${file}`)
];

type PatchPhase = "idle" | "running" | "complete";

export type IntroTerminalHandle = {
    completePatch: () => void;
    completeNavigation: () => void;
};

type IntroTerminalProps = {
    onCommand: (command: string) => void;
    patchPhase: PatchPhase;
    onEnterSystem: () => void;
    secondaryEditComplete: boolean;
    secondaryExecutionComplete: boolean;
    isVisitorIdle: boolean;
    ref?: React.Ref<IntroTerminalHandle>
};

export default function IntroTerminal({
    ref,
    onCommand,
    patchPhase,
    onEnterSystem,
    secondaryEditComplete,
    secondaryExecutionComplete,
    isVisitorIdle
}: IntroTerminalProps) {
    const terminalOutputRef = useRef<HTMLDivElement>(null);
    const patchPendingRef = useRef(false);

    const [commandIndex, setCommandIndex] = useState(0);
    const [visibleCount, setVisibleCount] = useState(0);
    const [manualInput, setManualInput] = useState("");
    const [commandHistory, setCommandHistory] = useState<string[]>([]);
    const [historyIndex, setHistoryIndex] = useState(-1);
    const [draftInput, setDraftInput] = useState("");
    const [idleSequenceActive, setIdleSequenceActive] = useState(false);

    const [history, setHistory] = useState<
        { input: string; output: string }[]
    >([]);

    const canStartIdleSequence =
        isVisitorIdle &&
        patchPhase === "idle" &&
        commandIndex === commandGroups.startup.length &&
        manualInput.trim().length === 0;

    const currentCommand =
        commandIndex < commandGroups.startup.length ||
        idleSequenceActive ||
        canStartIdleSequence
            ? commands[commandIndex]
            : undefined;

    const typingFrames = useMemo(() => {
        if (!currentCommand) return [];

        return createTypingFrames(
            currentCommand.input,
            27,
            0.025
        );
    }, [currentCommand]);

    // Cooldown before repeating idle animation
    useEffect(() => {
        if (!idleSequenceActive) return;
        if (commandIndex !== commands.length) return;

        const cooldown = window.setTimeout(() => {
            setCommandIndex(commandGroups.startup.length);
            setVisibleCount(0);
            setIdleSequenceActive(false);
        }, 30000);

        return () => window.clearTimeout(cooldown);
    }, [idleSequenceActive, commandIndex]);

    // Update terminal history after patch completes
    useImperativeHandle(ref, () => ({
        completePatch: () => {
            patchPendingRef.current = false;

            setHistory((previous) => {
                const lastPatchIndex = previous.findLastIndex(
                    (entry) =>
                        (entry.input === "patch" ||
                            entry.input === "run editor.patch") &&
                        entry.output === "Applying source changes..."
                );

                if (lastPatchIndex === -1) return previous;

                return previous.map((entry, index) => {
                    if (index !== lastPatchIndex) return entry;

                    return {
                        ...entry,
                        output:
                            "Applying source changes...\nPatch completed successfully."
                    };
                });
            });
        },

        completeNavigation: () => {
            setHistory((previous) => {
                const lastNavigationIndex = previous.findLastIndex(
                    (entry) =>
                        entry.input.startsWith("goto ") &&
                        entry.output === "Navigating to source file..."
                );

                if (lastNavigationIndex === -1) return previous;

                return previous.map((entry, index) => {
                    if (index !== lastNavigationIndex) return entry;

                    const filename = entry.input.slice(5);

                    return {
                        ...entry,
                        output: `Navigating to source file...\nSource located: ${filename}`
                    };
                });
            });
        }

    }), []);

    // Update terminal history after navigation completes

    // Handle patch and navigation completion
    useImperativeHandle(ref, () => ({
        completePatch: () => {
            patchPendingRef.current = false;

            setHistory((previous) => {
                const lastPatchIndex = previous.findLastIndex(
                    (entry) =>
                        (entry.input === "patch" ||
                            entry.input === "run editor.patch") &&
                        entry.output === "Applying source changes..."
                );

                if (lastPatchIndex === -1) return previous;

                return previous.map((entry, index) => {
                    if (index !== lastPatchIndex) return entry;

                    return {
                        ...entry,
                        output:
                            "Applying source changes...\nPatch completed successfully."
                    };
                });
            });
        },

        completeNavigation: () => {
            setHistory((previous) => {
                const lastNavigationIndex = previous.findLastIndex(
                    (entry) =>
                        entry.input.startsWith("goto ") &&
                        entry.output === "Navigating to source file..."
                );

                if (lastNavigationIndex === -1) return previous;

                return previous.map((entry, index) => {
                    if (index !== lastNavigationIndex) return entry;

                    const filename = entry.input.slice(5);

                    return {
                        ...entry,
                        output: `Navigating to source file...\nSource located: ${filename}`
                    };
                });
            });
        }
    }), []);

    // Automatic terminal typing
    useEffect(() => {
        // Keep your existing automatic typing logic here.
    }, []);

    // Automatic terminal typing
    useEffect(() => {
        if (!currentCommand) return;

        if (
            currentCommand.input === "editor.close preview.ts" &&
            !secondaryExecutionComplete
        ) {
            return;
        }

        if (
            currentCommand.input === "editor.run preview.ts" &&
            !secondaryEditComplete
        ) {
            return;
        }

        if (
            currentCommand.input === "editor.open preview.ts" &&
            patchPhase !== "idle"
        ) {
            return;
        }

        if (visibleCount < typingFrames.length) {
            const nextFrame = typingFrames[visibleCount];

            const typingDelay =
                commandIndex === 1 && visibleCount === 0
                    ? 6500
                    : nextFrame.delay;

            const timeout = window.setTimeout(() => {
                if (
                    currentCommand.input === "editor.open preview.ts" &&
                    !idleSequenceActive
                ) {
                    setIdleSequenceActive(true);
                }

                setVisibleCount((count) => count + 1);
            }, typingDelay);

            return () => window.clearTimeout(timeout);
        }

        const timeout = window.setTimeout(() => {
            setHistory((previous) => [
                ...previous,
                currentCommand
            ]);

            if (currentCommand.input === "run editor.patch") {
                patchPendingRef.current = true;
            }

            onCommand(currentCommand.input);

            setCommandIndex((index) => index + 1);
            setVisibleCount(0);
        }, 300);

        return () => window.clearTimeout(timeout);
    }, [
        commandIndex,
        visibleCount,
        currentCommand,
        typingFrames,
        onCommand,
        patchPhase,
        secondaryEditComplete,
        secondaryExecutionComplete,
        idleSequenceActive
    ]);

    // Keep terminal scrolled to latest output
    useEffect(() => {
        const terminal = terminalOutputRef.current;

        if (!terminal) return;

        terminal.scrollTop = terminal.scrollHeight;
    }, [history, visibleCount]);

    // Process manual terminal commands
    const handleManualCommand = () => {
        const input = manualInput.trim().toLowerCase();

        if (!input) return;

        setCommandHistory((previous) => [...previous, input]);
        setHistoryIndex(-1);
        setDraftInput("");

        if (input === "clear") {
            setHistory([]);
            setManualInput("");
            return;
        }

        let output = "";

        if (input === "help") {
            output =
                "Available commands: help, clear, inspect, resume, patch, enter system, goto <filename>";

        } else if (input === "inspect") {
            output = "Source inspection mode activated.";
            onCommand("inspect src/developer.ts");

        } else if (input === "resume") {
            output = "Autonomous editor resumed.";
            onCommand("system status");

        } else if (input === "patch") {
            if (patchPhase !== "idle" || patchPendingRef.current) {
                output = "Patch already queued or running";
            } else {
                patchPendingRef.current = true;
                output = "Applying source changes...";
                onCommand("run editor.patch");
            }

        } else if (input === "enter system") {
            output = "Initializing portfolio...";
            onEnterSystem();

        } else if (input.startsWith("goto ")) {
            const filename = input.slice(5).trim();

            if (Object.hasOwn(editorFiles, filename)) {
                output = "Navigating to source file...";
                onCommand(`goto ${filename}`);
            } else {
                output = `File not found: ${filename}`;
            }

        } else {
            output = `Command not found: ${input}`;
        }

        setHistory((previous) => [
            ...previous,
            {
                input,
                output
            }
        ]);

        setManualInput("");
    };

    // Autocomplete manual commands
    const handleAutocomplete = () => {
        const input = manualInput.trim().toLowerCase();

        if (!input) return false;

        const matches = availableCommands.filter((command) =>
            command.startsWith(input)
        );

        if (matches.length !== 1) return false;

        setManualInput(matches[0]);
        setHistoryIndex(-1);

        return true;
    };

    return (
        <div className="w-full font-mono">

            {/* Terminal header */}
            <div className="flex items-center justify-between text-[10px] text-[#92958B]">
                <span>TERMINAL / SESSION 001</span>

                <span>
                    {!currentCommand
                        ? "READY"
                        : visibleCount < typingFrames.length
                            ? "TYPING"
                            : "EXECUTING"}
                </span>
            </div>

            {/* Terminal output */}
            <div
                ref={terminalOutputRef}
                className="mt-1.5 h-[105px] space-y-0.5 overflow-y-auto [scrollbar-width:none] [&::-webkit-scrollbar]:hidden text-[11px] leading-[15px]"
            >
                <p className="text-[#92958B]">
                    <span className="mr-3 text-[#F5C542]">➜</span>
                    system ready
                </p>

                {/* Completed commands */}
                {history.map((entry, index) => (
                    <div key={index} className="space-y-0">
                        <p className="text-[#E6DDC9]">
                            <span className="mr-3 text-[#F5C542]">➜</span>
                            {entry.input}
                        </p>

                        <p className="pl-6 whitespace-pre-line text-[#92958B]">
                            {entry.output}
                        </p>
                    </div>
                ))}

                {/* Automatic command prompt */}
                {currentCommand && (
                    <div className="flex items-center gap-2 text-[#E6DDC9]">
                        <span className="text-[#F5C542]">➜</span>

                        <span>
                            {typingFrames[visibleCount - 1]?.text ?? ""}
                            <span className="cursor-blink text-[#F5C542]">
                                _
                            </span>
                        </span>
                    </div>
                )}

                {/* Manual command prompt - always available */}
                <div className="flex items-center gap-2 text-[#E6DDC9]">
                    <span className="text-[#F5C542]">➜</span>

                    <input
                        type="text"
                        value={manualInput}
                        onChange={(event) =>
                            setManualInput(event.target.value)
                        }
                        onKeyDown={(event) => {
                            if (event.key === "Enter") {
                                handleManualCommand();
                            }

                            if (event.key === "ArrowUp") {
                                event.preventDefault();

                                if (commandHistory.length === 0) return;

                                if (historyIndex === -1) {
                                    setDraftInput(manualInput);
                                }

                                const nextIndex = Math.min(
                                    historyIndex + 1,
                                    commandHistory.length - 1
                                );

                                setHistoryIndex(nextIndex);

                                setManualInput(
                                    commandHistory[
                                        commandHistory.length - 1 - nextIndex
                                    ]
                                );
                            }

                            if (event.key === "ArrowDown") {
                                event.preventDefault();

                                if (historyIndex === -1) return;

                                const nextIndex = historyIndex - 1;

                                setHistoryIndex(nextIndex);

                                setManualInput(
                                    nextIndex === -1
                                        ? draftInput
                                        : commandHistory[
                                            commandHistory.length - 1 - nextIndex
                                        ]
                                );
                            }

                            if (event.key === "Tab") {
                                if (handleAutocomplete()) {
                                    event.preventDefault();
                                }
                            }

                            if (event.key === "Escape") {
                                setManualInput("");
                                setHistoryIndex(-1);
                                setDraftInput("");
                            }
                        }}
                        placeholder="Enter command..."
                        aria-label="Terminal command"
                        autoComplete="off"
                        spellCheck={false}
                        className="min-w-0 flex-1 bg-transparent text-[#E6DDC9] outline-none caret-[#F5C542] placeholder:text-[#494538]"
                    />
                </div>

            </div>
        </div>
    );
}
