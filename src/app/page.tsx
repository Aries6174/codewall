"use client";

import { useCallback, useEffect, useRef, useState } from "react";

import CodeCanvas from "@/components/CodeCanvas";
import IntroTopBar from "@/components/IntroTopBar";
import SecondaryEditorPane from "@/components/SecondaryEditorPane";
import IntroTerminal, { type IntroTerminalHandle } from "@/components/IntroTerminal";
import IntroKeyboard from "@/components/IntroKeyboard";
import IntroMouse from "@/components/IntroMouse";
import PointerTracker from "@/components/PointerTracker";
import PointerTelemetry from "@/components/PointerTelemetry";
import IntroFooter from "@/components/IntroFooter";
import ThreeBackground from "@/components/ThreeBackground"

type PatchPhase = "idle" | "running" | "complete";

export default function Home() {
  const [terminalCommand, setTerminalCommand] = useState("");
  const [secondaryCommand, setSecondaryCommand] = useState("");
  const [patchPhase, setPatchPhase] = useState<PatchPhase>("idle");
  const [isSplit, setIsSplit] = useState(false);
  const [secondaryVisible, setSecondaryVisible] = useState(false);
  const [secondaryEditComplete, setSecondaryEditComplete] = useState(false);
  const [secondaryExecutionComplete, setSecondaryExecutionComplete] = useState(false);
  const [isVisitorIdle, setIsVisitorIdle] = useState(false);
  const [activeInput, setActiveInput] = useState<"keyboard" | "mouse">("keyboard");
  const [mouseOffset, setMouseOffset] = useState({ x: 0, y: 0 });
  const [autoKeyEvent, setAutoKeyEvent] = useState<{
    key: string;
    id: number;
  } | null>(null);
  const [autoInputSource, setAutoInputSource] = useState<
    "EDITOR" | "TERMINAL" | "STANDBY"
  >("STANDBY");

  const lastInteractionRef = useRef(0);
  const terminalRef = useRef<IntroTerminalHandle>(null);
  const lastPointerPosition = useRef<{ x: number; y: number } | null>(null);
  const lastKeyboardActivity = useRef(-Infinity);
  const lastTerminalStrokeRef = useRef(0);
  const autoInputTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Reset patch mode after the code editor completes its animation.
  useEffect(() => {
    if (patchPhase !== "complete") return;

    const timeout = window.setTimeout(() => {
      setTerminalCommand((current) =>
        current === "run editor.patch" ? "" : current
      );
      setPatchPhase("idle");
    }, 1500);

    return () => window.clearTimeout(timeout);
  }, [patchPhase]);

  const finishNavigation = useCallback(() => {
    setTerminalCommand((current) =>
      current.startsWith("goto ") ? "" : current
    );
    terminalRef.current?.completeNavigation();
  }, []);

  const handlePatchPhaseChange = useCallback((phase: PatchPhase) => {
    setPatchPhase(phase);
    if (phase === "complete") {
      terminalRef.current?.completePatch();
    }
  }, []);

  const finishSecondaryExecution = useCallback(() => {
      terminalRef.current?.completeSecondaryExecution();
      setSecondaryExecutionComplete(true);
  }, []);

  const finishSecondaryEditing = useCallback(() => {
      terminalRef.current?.completeSecondaryEditing();
      setSecondaryEditComplete(true);
  }, []);

  const handleTerminalCommand = useCallback((command: string) => {
    if (command === "editor.open preview.ts") {
      setSecondaryEditComplete(false);
      setSecondaryExecutionComplete(false);
      setSecondaryVisible(false);
      setIsSplit(true);
      setSecondaryCommand(command);
      return;
    }

    if (command === "editor.run preview.ts") {
      setSecondaryCommand(command);
      return;
    }

    if (command === "editor.close preview.ts") {
      setSecondaryVisible(false);
      setSecondaryCommand(command);
      return;
    }

    setTerminalCommand(command);
  }, []);

  // Preserve the secondary editor's existing entrance/exit timing.
  useEffect(() => {
    if (secondaryCommand !== "editor.open preview.ts") return;
    const timeout = window.setTimeout(() => setSecondaryVisible(true), 80);
    return () => window.clearTimeout(timeout);
  }, [secondaryCommand]);

  useEffect(() => {
    if (secondaryCommand !== "editor.close preview.ts") return;
    const timeout = window.setTimeout(() => setIsSplit(false), 650);
    return () => window.clearTimeout(timeout);
  }, [secondaryCommand]);

  // Inform the Terminal when the visitor becomes idle.
  useEffect(() => {
    const idleDelay = 20000;
    lastInteractionRef.current = Date.now();

    const handleActivity = () => {
      if (document.hidden) return;
      lastInteractionRef.current = Date.now();
      setIsVisitorIdle(false);
    };

    const handleVisibilityChange = () => {
      lastInteractionRef.current = Date.now();
      setIsVisitorIdle(false);
    };

    const checkIdle = window.setInterval(() => {
      if (document.hidden) return;
      if (Date.now() - lastInteractionRef.current >= idleDelay) {
        setIsVisitorIdle(true);
      }
    }, 1000);

    window.addEventListener("pointermove", handleActivity);
    window.addEventListener("pointerdown", handleActivity);
    window.addEventListener("keydown", handleActivity);
    window.addEventListener("wheel", handleActivity);
    document.addEventListener("visibilitychange", handleVisibilityChange);

    return () => {
      window.clearInterval(checkIdle);
      window.removeEventListener("pointermove", handleActivity);
      window.removeEventListener("pointerdown", handleActivity);
      window.removeEventListener("keydown", handleActivity);
      window.removeEventListener("wheel", handleActivity);
      document.removeEventListener("visibilitychange", handleVisibilityChange);
    };
  }, []);

  // Switch between the keyboard and mouse hand targets.
  useEffect(() => {
    const movementThreshold = 16;

    const handlePointerMove = (event: PointerEvent) => {
      if (event.pointerType !== "mouse") return;
      const currentPosition = { x: event.clientX, y: event.clientY };

      if (performance.now() - lastKeyboardActivity.current < 350) {
        lastPointerPosition.current = currentPosition;
        return;
      }

      const previousPosition = lastPointerPosition.current;
      if (!previousPosition) {
        lastPointerPosition.current = currentPosition;
        return;
      }

      const distance = Math.hypot(
        currentPosition.x - previousPosition.x,
        currentPosition.y - previousPosition.y
      );
      if (distance >= movementThreshold) {
        setActiveInput("mouse");
        lastPointerPosition.current = currentPosition;
      }
    };

    const handleMouseActivity = () => setActiveInput("mouse");
    const handleKeyboardActivity = () => {
      lastKeyboardActivity.current = performance.now();
      lastPointerPosition.current = null;
      setActiveInput("keyboard");
    };

    window.addEventListener("pointermove", handlePointerMove);
    window.addEventListener("pointerdown", handleMouseActivity);
    window.addEventListener("wheel", handleMouseActivity);
    window.addEventListener("keydown", handleKeyboardActivity);

    return () => {
      window.removeEventListener("pointermove", handlePointerMove);
      window.removeEventListener("pointerdown", handleMouseActivity);
      window.removeEventListener("wheel", handleMouseActivity);
      window.removeEventListener("keydown", handleKeyboardActivity);
    };
  }, []);

  useEffect(() => {
    let resetTimer: ReturnType<typeof setTimeout> | null = null;

    const handleMouseMovement = (event: PointerEvent) => {
      if (event.pointerType !== "mouse") return;
      const x = Math.max(-8, Math.min(8, event.movementX * 0.6));
      const y = Math.max(-8, Math.min(8, event.movementY * 0.6));
      setMouseOffset({ x, y });

      if (resetTimer !== null) clearTimeout(resetTimer);
      resetTimer = setTimeout(() => setMouseOffset({ x: 0, y: 0 }), 150);
    };

    window.addEventListener("pointermove", handleMouseMovement);
    return () => {
      window.removeEventListener("pointermove", handleMouseMovement);
      if (resetTimer !== null) clearTimeout(resetTimer);
    };
  }, []);

  useEffect(() => {
    let idleTimer: ReturnType<typeof setTimeout>;
    const resetIdleTimer = () => {
      clearTimeout(idleTimer);
      idleTimer = setTimeout(() => setActiveInput("keyboard"), 250);
    };
    const handlePointerMove = (event: PointerEvent) => {
      if (event.pointerType !== "mouse") return;
      resetIdleTimer();
    };

    resetIdleTimer();
    window.addEventListener("pointermove", handlePointerMove);
    window.addEventListener("pointerdown", resetIdleTimer);
    window.addEventListener("pointerup", resetIdleTimer);
    window.addEventListener("wheel", resetIdleTimer);
    window.addEventListener("keydown", resetIdleTimer);

    return () => {
      clearTimeout(idleTimer);
      window.removeEventListener("pointermove", handlePointerMove);
      window.removeEventListener("pointerdown", resetIdleTimer);
      window.removeEventListener("pointerup", resetIdleTimer);
      window.removeEventListener("wheel", resetIdleTimer);
      window.removeEventListener("keydown", resetIdleTimer);
    };
  }, []);

  // Keep the codewall and Terminal typing synchronized with the keyboard.
  const handleAutoKey = useCallback((
    key: string,
    source: "editor" | "terminal"
  ) => {
    const now = performance.now();
    if (source === "terminal") lastTerminalStrokeRef.current = now;

    // Terminal typing has priority over simultaneous codewall typing.
    if (source === "editor" && now - lastTerminalStrokeRef.current < 300) {
      return;
    }

    setAutoKeyEvent((previous) => ({
      key,
      id: (previous?.id ?? 0) + 1,
    }));

    setAutoInputSource(source === "terminal" ? "TERMINAL" : "EDITOR");
    if (autoInputTimeoutRef.current !== null) {
      clearTimeout(autoInputTimeoutRef.current);
    }
    autoInputTimeoutRef.current = setTimeout(() => {
      setAutoInputSource("STANDBY");
      autoInputTimeoutRef.current = null;
    }, 350);
  }, []);

  const handleEditorAutoKey = useCallback((key: string) => {
    handleAutoKey(key, "editor");
  }, [handleAutoKey]);

  const handleTerminalAutoKey = useCallback((key: string) => {
    handleAutoKey(key, "terminal");
  }, [handleAutoKey]);

  useEffect(() => {
    return () => {
      if (autoInputTimeoutRef.current !== null) {
        clearTimeout(autoInputTimeoutRef.current);
      }
    };
  }, []);

  return (
    <main className="relative h-dvh overflow-hidden bg-background text-foreground">
      <ThreeBackground />
      <IntroTopBar hasEntered={false} isExiting={false} />
      <PointerTracker />

      {/* Mobile/tablet overview. The original desktop animation is retained at >=900px. */}
      <section
        data-mobile-intro
        className="absolute inset-x-4 top-[64px] bottom-3 flex flex-col items-center justify-center text-center min-[425px]:inset-x-6 min-[768px]:top-[80px] min-[768px]:bottom-6 min-[900px]:hidden [@media(max-height:600px)]:top-[56px]"
      >
        <span className="font-mono text-[30px] leading-none text-[#F5C542] min-[375px]:text-[34px] min-[425px]:text-4xl min-[768px]:text-5xl [@media(max-height:600px)]:text-[28px]">
          ᜀᜍᜒᜁᜐ᜔
        </span>
        <h1 className="mt-4 font-mono text-[26px] font-semibold leading-tight tracking-[0.1em] text-[#E6DDC9] min-[375px]:text-[28px] min-[425px]:text-[30px] min-[768px]:mt-6 min-[768px]:text-[40px] [@media(max-height:600px)]:mt-2">
          CODEWALL<span className="text-[#F5C542]">_</span>
        </h1>
        <p className="mt-3 font-mono text-[10px] tracking-[0.2em] text-[#92958B] min-[768px]:mt-4 min-[768px]:text-xs">
          INTERACTIVE CODING EXPERIENCE
        </p>
        <p className="mt-1 font-mono text-[10px] text-[#92958B] min-[768px]:text-xs">
          NEXT.JS / TYPESCRIPT / TAILWIND
        </p>
        <p className="mx-auto mt-6 max-w-[320px] font-mono text-[12px] leading-5 text-[#E6DDC9] min-[768px]:mt-8 min-[768px]:max-w-md min-[768px]:text-[14px] min-[768px]:leading-6 [@media(max-height:600px)]:mt-4">
          A living codewall with synchronized typing, animated hands,
          a reactive keyboard, and a command terminal.
        </p>
        <p className="mt-5 font-mono text-[10px] tracking-widest text-[#F5C542] min-[768px]:mt-7 [@media(max-height:600px)]:mt-3">
          ● CODEWALL ACTIVE<span className="cursor-blink">_</span>
        </p>
      </section>

      {/* Desktop Codewall + Website Information */}
      <div
        className="absolute inset-x-[15%] top-[78px] bottom-[44px] z-10 hidden min-[900px]:grid grid-cols-[minmax(0,1fr)_260px] min-[1101px]:grid-cols-[minmax(0,1fr)_300px] min-[1440px]:grid-cols-[minmax(0,1fr)_340px] grid-rows-[max-content] content-start items-stretch gap-4 [@media(max-height:760px)]:top-[64px]"
      >
        {/* All existing codewall and input animations remain together */}
        <div className="flex h-auto min-h-0 w-full min-w-0 flex-col gap-2 [@media(max-height:760px)]:gap-1">
          <div className="relative w-full min-w-0 overflow-hidden">
            <CodeCanvas
              activeCommand={terminalCommand}
              patchPhase={patchPhase}
              onPatchPhaseChange={handlePatchPhaseChange}
              onNavigationComplete={finishNavigation}
              isPaused={isSplit}
              onAutoKey={handleEditorAutoKey}
            />

            {isSplit && (
              <div
                className={`absolute inset-y-0 right-0 z-10 w-1/2 min-w-0 overflow-hidden border-l border-[#494538]/40 bg-[#080A09]/25 backdrop-blur-[6px] ${
                  secondaryCommand === "editor.close preview.ts"
                    ? "secondary-glitch-exit"
                    : secondaryVisible
                      ? "secondary-glitch-enter"
                      : "secondary-glitch-hidden"
                }`}
              >
                <SecondaryEditorPane
                  onEditingComplete={finishSecondaryEditing}
                  onExecutionComplete={finishSecondaryExecution}
                  runRequested={secondaryCommand === "editor.run preview.ts"}
                  isVisible={secondaryVisible}
                  onAutoKey={handleEditorAutoKey}
                />
              </div>
            )}
          </div>

          <div className="w-full min-w-0">
            <IntroTerminal
              ref={terminalRef}
              onCommand={handleTerminalCommand}
              patchPhase={patchPhase}
              secondaryEditComplete={secondaryEditComplete}
              secondaryExecutionComplete={secondaryExecutionComplete}
              isVisitorIdle={isVisitorIdle}
              onAutoKey={handleTerminalAutoKey}
            />
          </div>

          <div
            data-intro-inputs
            className="mx-auto grid w-full min-w-0 max-w-[590px] min-[2560px]:max-w-[700px] grid-cols-[minmax(0,1fr)_120px] min-[2560px]:grid-cols-[minmax(0,1fr)_140px] items-start gap-3"
          >
            <div className="min-w-0">
              <IntroKeyboard
                isMouseActive={activeInput === "mouse"}
                mouseOffset={mouseOffset}
                autoKeyEvent={autoKeyEvent}
              />
            </div>
            <div className="min-w-0">
              <IntroMouse
                isMouseActive={activeInput === "mouse"}
                mouseOffset={mouseOffset}
              />
            </div>
          </div>
        </div>

        {/* Website Information replaces Developer Information */}
        <aside className="relative isolate flex h-full min-h-0 w-full min-w-0 flex-col gap-2 [text-shadow:0_2px_6px_rgba(0,0,0,0.95)]">
          <div className="w-full min-w-0">
            <div className="mb-2 flex items-center justify-between gap-2 border-b border-[#494538]/60 pb-2 font-mono text-[9px] tracking-[0.12em]">
              <span className="text-[#F5C542]">SYS://WEBSITE</span>
              <span className="text-[#92958B]">MODULE_001</span>
            </div>

            <div className="mb-2 flex items-center justify-between gap-2">
              <span className="font-mono text-3xl leading-none text-[#F5C542]">
                ᜀᜍᜒᜁᜐ᜔
              </span>
              <span className="flex shrink-0 items-center gap-1 font-mono text-[9px] text-[#59C9A5]">
                <span className="h-1.5 w-1.5 rounded-full bg-[#59C9A5]" />
                SYSTEM ONLINE
              </span>
            </div>

            <h1 className="font-mono text-[28px] font-semibold leading-tight tracking-[0.12em] text-[#E6DDC9]">
              CODEWALL<span className="text-[#F5C542]">_</span>
            </h1>
            <div className="mt-1 flex flex-col gap-1 font-mono text-[11px] tracking-[0.08em] text-[#92958B]">
              <p>INTERACTIVE CODING EXPERIENCE</p>
              <p>NEXT.JS / TYPESCRIPT / TAILWIND</p>
            </div>
          </div>

          <div className="mt-2 w-full min-w-0">
            <div className="mb-2 h-px w-10 bg-[#494538]" />
            <p className="font-mono text-[12px] leading-5 text-[#E6DDC9]">
              An interactive codewall that brings code to life through
              synchronized typing, animated keyboard interactions, and live
              terminal commands.
            </p>
            <div className="mt-3 flex flex-col gap-1 font-mono text-[11px] tracking-[0.08em] text-[#92958B]">
              <p><span className="text-[#D94B43]">{"//"}</span> LIVE CODE RENDERING</p>
              <p><span className="text-[#D94B43]">{"//"}</span> REACTIVE KEYBOARD</p>
              <p><span className="text-[#D94B43]">{"//"}</span> INTERACTIVE TERMINAL</p>
            </div>
          </div>

          <p className="mt-2 font-mono text-[10px] tracking-[0.15em] text-[#F5C542]">
            ● CODEWALL ACTIVE<span className="cursor-blink">_</span>
          </p>

          <div id="system-readout" className="mt-3 w-full border-t border-[#494538] pt-2">
            <p className="mb-2 font-mono text-[10px] tracking-[0.15em] text-[#92958B]">
              SYSTEM READOUT
            </p>
            <div className="grid w-full grid-cols-[minmax(0,1fr)_auto] gap-x-4 gap-y-1 font-mono text-[10px] [@media(max-height:760px)]:gap-y-0 [@media(max-height:760px)]:leading-4">
              <span className="text-[#92958B]">› PATCH MODE</span>
              <span className="text-right text-[#F5C542]">{patchPhase.toUpperCase()}</span>

              <span className="text-[#92958B]">› EDITOR MODE</span>
              <span className="text-right text-[#F5C542]">{isSplit ? "SPLIT" : "SINGLE"}</span>

              <span className="text-[#92958B]">› SYSTEM</span>
              <span className="text-right text-[#59C9A5]">ACTIVE</span>

              <span className="text-[#92958B]">› AUTO INPUT</span>
              <span className={`text-right ${autoInputSource === "STANDBY" ? "text-[#92958B]" : "text-[#F5C542]"}`}>
                {autoInputSource}
              </span>

              <PointerTelemetry />
            </div>
          </div>
        </aside>
      </div>

      <IntroFooter isExiting={false} />
    </main>
  );
}
