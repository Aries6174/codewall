
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
    onAutoKey: (key: string) => void;
    onStatusChange: (status: string) => void;
};

export default function IntroTerminal({
    ref,
    onCommand,
    onAutoKey,
    patchPhase,
    onEnterSystem,
    secondaryEditComplete,
    secondaryExecutionComplete,
    isVisitorIdle,
    onStatusChange,
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
        if (!currentCommand) return;

        if (manualInput.trim().length > 0) {
            return;
        }

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

                // Compare the previous and current typing frames.
                const previousText =
                    typingFrames[visibleCount - 1]?.text ?? "";

                const currentText = nextFrame.text;

                // Character typed.
                if (currentText.length > previousText.length) {
                    onAutoKey(currentText.slice(-1));
                }

                // Character deleted.
                else if (currentText.length < previousText.length) {
                    onAutoKey("backspace");
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
        idleSequenceActive,
        onAutoKey,
        manualInput
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

    const terminalStatus =
        patchPhase === "running"
            ? "EXECUTING"
            : !currentCommand
                ? "READY"
                : visibleCount < typingFrames.length
                    ? "TYPING"
                    : "EXECUTING";

    const terminalBusy = terminalStatus !== "READY";

    useEffect(() => {
        onStatusChange(terminalStatus);
    }, [terminalStatus, onStatusChange]);

    return (
        <div className="terminal-shell w-full min-w-0 font-mono">

            {/* SYSTEM HEADER */}
            <div className="flex items-center justify-between gap-3 border-b border-[#494538]/40 px-3 py-2">

                <div className="flex min-w-0 items-center gap-2">
                    <span className="text-[16px] text-[#F5C542]">
                        ⌁
                    </span>

                    <div className="min-w-0">
                        <p className="text-[11px] font-semibold tracking-[0.1em] text-[#E6DDC9]">
                            SYS://TERMINAL
                            <span className="text-[#F5C542]">_</span>
                        </p>

                        <p className="text-[8px] tracking-[0.08em] text-[#92958B]">
                            SESSION_001 / COMMAND INTERFACE
                        </p>
                    </div>
                </div>

                <div className="flex shrink-0 items-center gap-2">
                    <span
                        className={`terminal-status-dot ${
                            terminalBusy ? "terminal-status-busy" : ""
                        }`}
                    />

                    <span className={`text-[9px] tracking-wider ${
                        terminalBusy
                            ? "text-[#F5C542]"
                            : "text-[#59C9A5]"
                    }`}>
                        {terminalStatus}
                    </span>
                </div>
            </div>

            {/* ANIMATED SIGNAL BAR */}
            <div
                className={`terminal-signal-strip ${
                    terminalBusy ? "terminal-signal-active" : ""
                }`}
                aria-hidden="true"
            />

            {/* TERMINAL HISTORY */}
            <div
                ref={terminalOutputRef}
                data-active={terminalBusy}
                className="
                    terminal-output
                    h-[clamp(75px,12dvh,140px)]
                    [@media(max-height:760px)]:h-[clamp(64px,10dvh,75px)]
                    [@media(min-width:2560px)_and_(min-height:761px)]:h-[clamp(140px,12dvh,180px)]
                    min-w-0 space-y-1 overflow-y-auto
                    px-3 py-2
                    [scrollbar-width:none]
                    [&::-webkit-scrollbar]:hidden
                "
            >
                <div className="flex gap-2 text-[10px] leading-[15px]">
                    <span className="text-[#F5C542]">›</span>
                    <span className="text-[#92958B]">[SYS]</span>
                    <span className="text-[#92958B]">
                        Runtime initialized successfully
                    </span>
                </div>

                {/* COMPLETED COMMAND HISTORY */}
                {history.map((entry, index) => {
                    const isError =
                        /not found|already queued|error/i.test(entry.output);

                    const isRunning =
                        /applying|navigating|executing|opening/i.test(entry.output) &&
                        !/completed|located/i.test(entry.output);

                    const label = isError
                        ? "ERR"
                        : isRunning
                            ? "RUN"
                            : "OK";

                    return (
                        <div key={index} className="min-w-0 space-y-0.5">

                            {/* Command */}
                            <div className="flex min-w-0 items-start gap-2 text-[10px] leading-[15px]">
                                <span className="shrink-0 text-[#F5C542]">
                                    ›
                                </span>

                                <span className="shrink-0 text-[#92958B]">
                                    [CMD]
                                </span>

                                <span className="min-w-0 break-words text-[#E6DDC9]">
                                    {entry.input}
                                </span>
                            </div>

                            {/* Command result */}
                            <div className="flex min-w-0 items-start gap-2 pl-3 text-[10px] leading-[15px]">

                                <span className={
                                    isError
                                        ? "text-[#D94B43]"
                                        : isRunning
                                            ? "text-[#F5C542]"
                                            : "text-[#59C9A5]"
                                }>
                                    {isError ? "×" : isRunning ? "◇" : "✓"}
                                </span>

                                <span className={
                                    isError
                                        ? "text-[#D94B43]"
                                        : isRunning
                                            ? "text-[#F5C542]"
                                            : "text-[#59C9A5]"
                                }>
                                    [{label}]
                                </span>

                                <span className="min-w-0 whitespace-pre-line break-words text-[#92958B]">
                                    {entry.output}
                                </span>
                            </div>
                        </div>
                    );
                })}

                {/* AUTOMATIC COMMAND TYPING */}
                {currentCommand && (
                    <div className="flex min-w-0 items-start gap-2 text-[10px] leading-[15px]">
                        <span className="shrink-0 text-[#F5C542]">
                            ›
                        </span>

                        <span className="shrink-0 text-[#92958B]">
                            [CMD]
                        </span>

                        <span className="min-w-0 break-words text-[#E6DDC9]">
                            {typingFrames[visibleCount - 1]?.text ?? ""}

                            <span className="cursor-blink text-[#F5C542]">
                                _
                            </span>
                        </span>
                    </div>
                )}
            </div>

            {/* SEPARATE COMMAND INPUT */}
            <div className="terminal-prompt flex min-w-0 items-center gap-2 border-t border-[#494538]/40 px-3 py-2">

                <span className="shrink-0 text-[10px] font-semibold text-[#F5C542]">
                    ADRIAN@SYS:~$
                </span>

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
                    className="min-w-0 flex-1 bg-transparent text-[10px] text-[#E6DDC9] outline-none caret-[#F5C542] placeholder:text-[#92958B]/50"
                />
            </div>

            {/* SYSTEM FOOTER */}
            <div className="flex items-center justify-between gap-2 border-t border-[#494538]/30 px-3 py-1.5 text-[8px] tracking-wider text-[#92958B]">

                <div className="flex items-center gap-3">
                    <span>
                        <span className="text-[#59C9A5]">●</span>
                        {" "}LOCAL ACTIVE
                    </span>

                    <span>INPUT: ENABLED</span>
                </div>

                <div className="flex items-center gap-2">
                    <div
                        className={`terminal-meter ${
                            terminalBusy ? "terminal-meter-active" : ""
                        }`}
                        aria-hidden="true"
                    >
                        <span />
                        <span />
                        <span />
                    </div>

                    <span>SYS.001</span>
                </div>
            </div>

        </div>
    );

}
