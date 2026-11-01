
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
    completeSecondaryEditing: () => void;
    completeSecondaryExecution: () => void;
};

type IntroTerminalProps = {
    onCommand: (command: string) => void;
    patchPhase: PatchPhase;
    secondaryEditComplete: boolean;
    secondaryExecutionComplete: boolean;
    isVisitorIdle: boolean;
    ref?: React.Ref<IntroTerminalHandle>
    onAutoKey: (key: string) => void;
};

export default function IntroTerminal({
    ref,
    onCommand,
    onAutoKey,
    patchPhase,
    secondaryEditComplete,
    secondaryExecutionComplete,
    isVisitorIdle,
}: IntroTerminalProps) {
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

  // Update terminal results when operations finish.
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

        return previous.map((entry, index) =>
          index === lastPatchIndex
            ? {
                ...entry,
                output:
                  "Applying source changes...\nPatch completed successfully.",
              }
            : entry
        );
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

        return previous.map((entry, index) =>
          index === lastNavigationIndex
            ? {
                ...entry,
                output:
                  `Navigating to source file...\nSource located: ${entry.input.slice(5)}`,
              }
            : entry
        );
      });
    },

    completeSecondaryEditing: () => {
      setHistory((previous) =>
        previous.map((entry) =>
          entry.input === "editor.open preview.ts" &&
          entry.output === "Opening secondary editor..."
            ? { ...entry, output: "Secondary editor ready." }
            : entry
        )
      );
    },

    completeSecondaryExecution: () => {
      setHistory((previous) =>
        previous.map((entry) =>
          entry.input === "editor.run preview.ts" &&
          entry.output === "Executing preview..."
            ? { ...entry, output: "Preview executed successfully." }
            : entry
        )
      );
    },
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
        
    const latestResult = history[history.length - 1];

    const resultMessage =
        latestResult?.output.split("\n").at(-1) ??
        "Waiting for command...";

    const resultIsError =
        /not found|already queued|error/i.test(resultMessage);

    const resultIsRunning =
        /applying|navigating|executing|opening|initializing/i.test(resultMessage) &&
        !/completed|located|ready/i.test(resultMessage);

    const resultLabel = !latestResult
        ? "READY"
        : resultIsError
            ? "ERR"
            : resultIsRunning
                ? "RUN"
                : "OK";

    const resultColor = resultIsError
        ? "text-[#D94B43]"
        : resultIsRunning
            ? "text-[#F5C542]"
            : "text-[#59C9A5]";

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

            {/* SINGLE COMMAND STATUS */}
            <div
                data-terminal-result
                role="status"
                aria-live="polite"
                className="
                    flex h-9 min-w-0 items-center gap-3
                    overflow-hidden px-3
                    font-mono text-[10px]
                "
            >
                {currentCommand && manualInput.trim().length === 0 ? (
                    <>
                        <span className="shrink-0 text-[#F5C542]">
                            [TYPING]
                        </span>

                        <span className="min-w-0 truncate text-[#E6DDC9]">
                            {typingFrames[visibleCount - 1]?.text ?? ""}
                            <span className="cursor-blink text-[#F5C542]">
                                _
                            </span>
                        </span>
                    </>
                ) : (
                    <>
                        <span className={`shrink-0 font-semibold ${resultColor}`}>
                            [{resultLabel}]
                        </span>

                        <span
                            className="min-w-0 truncate text-[#92958B]"
                            title={resultMessage}
                        >
                            {resultMessage}
                        </span>
                    </>
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
        </div>
    );

}
