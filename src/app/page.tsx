
"use client";

import { useCallback, useEffect, useRef, useState } from "react";

import CodeCanvas from "@/components/CodeCanvas";
import LivingCodeCanvas from "@/components/LivingCodeCanvas";
import IntroTopBar from "@/components/IntroTopBar";
import SecondaryEditorPane from "@/components/SecondaryEditorPane";
import IntroTerminal, { type IntroTerminalHandle } from "@/components/IntroTerminal";

type PatchPhase = "idle" | "running" | "complete";

export default function Home() {
  // States
  const [terminalCommand, setTerminalCommand] = useState("");
  const [secondaryCommand, setSecondaryCommand] = useState("");
  const [patchPhase, setPatchPhase] = useState<PatchPhase>("idle");
  const [isSplit, setIsSplit] = useState(false);
  const [secondaryVisible, setSecondaryVisible] = useState(false);
  const [visibleCount, setVisibleCount] = useState(0);
  const [hasEntered, setHasEntered] = useState(false);
  const [signalDetected, setSignalDetected] = useState(false);
  const [showPortfolio, setShowPortfolio] = useState(false);
  const [secondaryEditComplete, setSecondaryEditComplete] = useState(false);
  const [secondaryExecutionComplete, setSecondaryExecutionComplete] = useState(false);
  const [isVisitorIdle, setIsVisitorIdle] = useState(false);
  const lastInteractionRef = useRef(0);
  const terminalRef = useRef<IntroTerminalHandle>(null);

  // Message displayed underneath the editor
  const message = hasEntered
    ? "SYSTEM ONLINE"
    : "SYSTEM DORMANT";

  const isExiting = hasEntered && visibleCount >= message.length;

  // Effect 1: Typing animation
  useEffect(() => {
    if (visibleCount >= message.length) {
      return;
    }

    const timeout = setTimeout(() => {
      setVisibleCount((count) => count + 1);
    }, 80);

    return () => clearTimeout(timeout);
  }, [visibleCount, message]);

  // Effect 2: Transition to the portfolio
  useEffect(() => {
    if (!isExiting) {
      return;
    }

    const timeout = window.setTimeout(() => {
      setShowPortfolio(true);
    }, 700);

    return () => clearTimeout(timeout);
  }, [isExiting]);

  useEffect(() => {
    if (patchPhase !== "complete") return;

    const timeout = window.setTimeout(() => {
      setTerminalCommand((current) => {
        if (current === "run editor.patch") {
          return "";
        }

        return current;
      });
      setPatchPhase("idle");
    }, 1500);

    return () => window.clearTimeout(timeout);
  }, [patchPhase]);

  const enterSystem = () => {
    if (hasEntered) return;

    setHasEntered(true);
    setVisibleCount(0);
  };

  const finishNavigation = useCallback(() => {
    setTerminalCommand((current) => current.startsWith("goto ") ? "" : current);

    terminalRef.current?.completeNavigation();
  }, []);

  const handlePatchPhaseChange = useCallback((phase: PatchPhase) => {
    setPatchPhase(phase);

    if (phase === "complete") {
      terminalRef.current?.completePatch();
    }
  }, []);

  const finishSecondaryExecution = useCallback(() => {
    setSecondaryExecutionComplete(true)
  }, [])

  const finishSecondaryEditing = useCallback(() => {
    setSecondaryEditComplete(true);
  }, [])

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

  useEffect(() => {
    if (secondaryCommand !== "editor.open preview.ts") return;

    const timeout = window.setTimeout(() => {
      setSecondaryVisible(true);
    }, 80)

    return () => window.clearTimeout(timeout);

  }, [secondaryCommand])

  useEffect(() => {
    if (secondaryCommand !== "editor.close preview.ts") return;

    const timeout = window.setTimeout(() => {
      setIsSplit(false);
    }, 550)

      return () => window.clearTimeout(timeout);
  }, [secondaryCommand])

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

      const inactiveTime = Date.now() - lastInteractionRef.current;
      
      if (inactiveTime >= idleDelay) {
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

  return (
    <main className="relative flex min-h-dvh items-center justify-center bg-background text-foreground">

      <LivingCodeCanvas
        onSignalChange={setSignalDetected}
      />

      {/* INTRO SCREEN */}
      {!showPortfolio && (
        <>
          {/* Top system bar */}
          <IntroTopBar
            hasEntered={hasEntered}
            isExiting={isExiting}
          />

          {/* Central intro content */}
          <div
            className={`relative z-10 flex w-full flex-col items-center gap-2 px-4
              transition-all duration-700 ease-in-out
              ${
                isExiting
                  ? "scale-95 opacity-0 blur-sm"
                  : "scale-100 opacity-100 blur-0"
              }`}
          >
            {/* System identification */}
            <div className="flex items-center gap-3 font-mono text-[11px] tracking-[0.2em]">
              <span className="font-medium text-[#E6DDC9]">
                ADRIAN.JS
              </span>

              <span className="text-[#494538]">/</span>

              <span
                className={
                  signalDetected
                  ? "text-[#F5C542]"
                  : "text-[#92958B]"
                }
              >
                {signalDetected ? "SIGNAL_RECEIVED" : "SYSTEM_001"}
              </span>
            </div>

            {/* Interactive code editor */}
            <div className="relative w-full max-w-[700px] overflow-hidden">

              {/* Primary editor - stays in place */}
              <CodeCanvas
                activeCommand={terminalCommand}
                patchPhase={patchPhase}
                onPatchPhaseChange={handlePatchPhaseChange}
                onNavigationComplete={finishNavigation}
                isPaused={isSplit}
              />

              {/* Secondary editor - occupies right half */}
              {isSplit && (
                <div
                  className={`absolute inset-y-0 right-0 z-10 w-1/2 overflow-hidden
                    border-l border-[#494538] bg-[#0B0C0B]
                    transition-[transform,opacity] duration-500 ease-in-out
                    ${
                      secondaryVisible
                        ? "translate-x-0 opacity-100"
                        : "translate-x-full opacity-0"
                    }`}
                >
                  <SecondaryEditorPane
                    onEditingComplete={finishSecondaryEditing}
                    onExecutionComplete={finishSecondaryExecution}
                    runRequested={
                      secondaryCommand === "editor.run preview.ts"
                    }
                    isVisible={secondaryVisible}
                  />
                </div>
              )}

            </div>

            {/* Terminal */}
            <div className="w-full max-w-[700px]">
              <IntroTerminal
                ref={terminalRef}
                onCommand={handleTerminalCommand}
                patchPhase={patchPhase}
                onEnterSystem={enterSystem}
                secondaryEditComplete={secondaryEditComplete}
                secondaryExecutionComplete={secondaryExecutionComplete}
                isVisitorIdle={isVisitorIdle}
              />
            </div>

            {/* Systerm entry section */}
            <div className="mt-5 flex items-center gap-2">

              {/* System status */}
              <div className="flex items-center gap-2">
                <span className="h-1.5 w-1.5 animate rounded-full bg-[#F5C542]" />

                <p className = "font-mono text-[11px] text-[#F5C542]">
                  {message.slice(0, visibleCount)}
                  <span className="cursor-blink">_</span>
                </p>
              </div>
              {!hasEntered && (
                <button
                type="button"
                onClick={enterSystem}
                className="mt border border-[#494538] px-6 py-3 font-mono text-[10px] tracking-[0.2em] text-[#F5C542] transition-colors duration-300 hover:border-[#F5C542] hover:bg-[#F5C542] hover:text-[#0B0C0B]">
                  [ ENTER SYSTEM ]
                </button>
              )}

            </div>
          </div>
        </>
      )}

      {/* PORTFOLIO SCREEN */}
      {showPortfolio && (
        <section className="relative z-10 w-full max-w-6xl px-6 py-12 animate-[portfolio-reveal_850ms_ease-out_both]">

          {/* Portfolio header */}
          <div className="border-b border-[#494538] pb-4">
            <p className="text-xs tracking-[0.3em] text-[#F5C542]">
              ADRIAN.JS / SYSTEM ONLINE
            </p>
          </div>

          {/* Developer information */}
          <div className="mt-16">
            <p className="mb-4 text-xs tracking-[0.2em] text-[#92958B]">
              {"// DEVELOPER PROFILE"}
            </p>

            <h1 className="text-4xl font-bold text-[#E6DDC9] md:text-6xl">
              Adrian Jaspa
            </h1>

            <p className="mt-6 max-w-xl text-sm leading-7 text-[#92958B]">
              Computer Science graduate building interactive web
              applications and exploring software development.
            </p>
          </div>

        </section>
      )}

    </main>
  );
}
