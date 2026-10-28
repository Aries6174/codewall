
"use client";

import { useCallback, useEffect, useRef, useState } from "react";

import CodeCanvas from "@/components/CodeCanvas";
import IntroTopBar from "@/components/IntroTopBar";
import SecondaryEditorPane from "@/components/SecondaryEditorPane";
import IntroTerminal, { type IntroTerminalHandle } from "@/components/IntroTerminal";
import IntroAtmosphere from "@/components/IntroAtmosphere"
import IntroSidebar from "@/components/IntroSidebar";
import IntroKeyboard from "@/components/IntroKeyboard";
import IntroMouse from "@/components/IntroMouse";
import PointerTracker from "@/components/PointerTracker"
import PointerTelemetry from "@/components/PointerTelemetry";

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
  const [showPortfolio, setShowPortfolio] = useState(false);
  const [secondaryEditComplete, setSecondaryEditComplete] = useState(false);
  const [secondaryExecutionComplete, setSecondaryExecutionComplete] = useState(false);
  const [isVisitorIdle, setIsVisitorIdle] = useState(false);
  const lastInteractionRef = useRef(0);
  const terminalRef = useRef<IntroTerminalHandle>(null);
  const sceneRef = useRef<HTMLDivElement>(null);
  const [sceneScale, setSceneScale] = useState(1);
  const [activeInput, setActiveInput] = useState<"keyboard" | "mouse">("keyboard");
  const [mouseOffset, setMouseOffset] = useState({
    x: 0,
    y: 0,
  });
  const lastPointerPosition = useRef<{
    x: number;
    y: number;
  } | null>(null);
  const lastKeyboardActivity = useRef(-Infinity);
  const [autoKeyEvent, setAutoKeyEvent] = useState<{
    key: string;
    id: number;
  } | null>(null);
  const lastTerminalStrokeRef = useRef(0);
  const [autoInputSource, setAutoInputSource] = useState<
    "EDITOR" | "TERMINAL" | "STANDBY" 
  >("STANDBY");

  const autoInputTimeoutRef = useRef<
    ReturnType<typeof setTimeout> | null
    >(null);

  // Message displayed underneath the editor
  const message = hasEntered
    ? "SYSTEM ONLINE"
    : "SYSTEM DORMANT";

  const isExiting = hasEntered && visibleCount >= message.length;

  const bootProgress = Math.min(
    100,
    Math.round((visibleCount / message.length) * 100)
  );

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

  useEffect(() => {
    const scene = sceneRef.current;
    if (!scene) return;

    const updateScale = () => {
    const headerSpace = 72;
    const footerSpace = 24;

    const availableWidth = window.innerWidth - 32;
    const availableHeight =
      window.innerHeight - headerSpace - footerSpace;


      const sceneWidth = scene.offsetWidth;
      const sceneHeight = scene.offsetHeight;

      if (!sceneWidth || !sceneHeight) return;

      const widthScale = availableWidth / sceneWidth;
      const heightScale = availableHeight / sceneHeight;


      const nextScale = Math.min(
        1,
        availableWidth / sceneWidth,
        availableHeight / sceneHeight
      );

      console.table({
        availableWidth,
        availableHeight,
        sceneWidth,
        sceneHeight,
        widthScale,
        heightScale,
        nextScale,
      });

      setSceneScale(Math.max(0.1, nextScale));
    };

    const observer = new ResizeObserver(updateScale);

    observer.observe(scene);
    window.addEventListener("resize", updateScale);
    updateScale();

    return () => {
      observer.disconnect();
      window.removeEventListener("resize", updateScale);
    };
  }, []);

  useEffect(() => {
    const MOVEMENT_THRESHOLD =16;

    const handlePointerMove = (event: PointerEvent) => {
      if (event.pointerType !== "mouse") return;

      const currentPosition = {
        x: event.clientX,
        y: event.clientY,
      };

      const KEYBOARD_COOLDOWN = 350;
      
      // Ignore cursor movement briefly after typing.
      if (performance.now() - lastKeyboardActivity.current < KEYBOARD_COOLDOWN) {
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

      if (distance >= MOVEMENT_THRESHOLD) {
        setActiveInput("mouse");
        lastPointerPosition.current = currentPosition;
      }
    };

    const handleMouseActivity = () => {
      setActiveInput("mouse");
    };

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

      // Convert physical movement into small visual offsets.
      const x = Math.max(-8, Math.min(8,event.movementX * 0.6));
      const y = Math.max(-8, Math.min(8,event.movementY * 0.6));

      setMouseOffset({ x, y });

      if (resetTimer !== null) {
        clearTimeout(resetTimer);
      }

      //Gently return to the center when movement stops.
      resetTimer = setTimeout(() => {
        setMouseOffset({ x: 0, y: 0 });
      }, 150);
    };

    window.addEventListener("pointermove", handleMouseMovement);

    return () => {
      window.removeEventListener("pointermove", handleMouseMovement);

      if (resetTimer !== null) {
        clearTimeout(resetTimer);
      }
    };
  }, []);

  useEffect(() => {
    const IDLE_TIMEOUT = 750;

    let idleTimer: ReturnType<typeof setTimeout>;

    const resetIdleTimer = () => {
      clearTimeout(idleTimer);

      idleTimer = setTimeout(() => {
        //Return the right hand to the keyboard.
        setActiveInput("keyboard");
      }, IDLE_TIMEOUT);
    };

    const handlePointerMove = (event: PointerEvent) => {
      if (event.pointerType !== "mouse") return;

      resetIdleTimer();
    }

    // Start counting when the page loads.
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

  const handleAutoKey = useCallback((
    key: string,
    source: "editor" | "terminal"
  ) => {
    const now = performance.now();

    if (source === "terminal") {
      lastTerminalStrokeRef.current = now;
    }

    // Terminal typing has priority.
    if (
      source === "editor" &&
      now - lastTerminalStrokeRef.current < 300
    ) {
      return;
    }

    // Update the keyboard.
    setAutoKeyEvent((previous) => ({
      key,
      id: (previous?.id ?? 0) + 1,
    }));

    // Update the system activity.
    setAutoInputSource(
      source === "terminal" ? "TERMINAL" : "EDITOR"
    );

    // Reset the inactivity timer.
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
    <main
      className={`relative bg-background text-foreground ${
        showPortfolio
          ? "flex min-h-dvh justify-center px-6 py-12"
          : "h-dvh overflow-hidden"
      }`}
    >

      {/* INTRO SCREEN */}
      {!showPortfolio && (
        <>
          {/* Full-screen landscape background */}
          <IntroAtmosphere isExiting={isExiting} />

          {/* Top system bar */}
          <IntroTopBar
            hasEntered={hasEntered}
            isExiting={isExiting}
          />
          
          <PointerTracker />

          {/* Central intro content */}

          {/* Mobile introduction */}
          <section
            className={`absolute inset-x-6 top-1/2
              -translate-y-1/2 text-center
              min-[900px]:hidden
              transition-[opacity,filter] duration-700
              ${
                isExiting
                  ? "opacity-0 blur-sm"
                  : "opacity-100 blur-0"
              }`}
          >
            <span className="font-mono text-4xl text-[#F5C542]">
              ᜀᜍᜒᜁᜐ᜔
            </span>

            <h1 className="mt-5 font-mono text-3xl font-semibold tracking-[0.15em] text-[#E6DDC9]">
              ADRIAN.JS
            </h1>

            <p className="mt-3 font-mono text-[10px] tracking-[0.2em] text-[#92958B]">
              SOFTWARE DEVELOPER
            </p>

            <p className="mt-1 font-mono text-[10px] text-[#92958B]">
              BASED IN THE PHILIPPINES
            </p>

            <p className="mx-auto mt-8 max-w-xs font-mono text-xs leading-6 text-[#E6DDC9]">
              I build digital experiences, explore emerging
              technologies, and turn ideas into real solutions.
            </p>

            {!hasEntered && (
              <button
                type="button"
                onClick={enterSystem}
                className="border border-[#F5C542] px-8 py-4 font-mono text-[11px] tracking-[0.2em] text-[#F5C542] transition-all duration-300 ease-out hover:-translate-y-0.5 hover:bg-[#F5C542] hover:text-[#0B0C0B] hover:shadow-[0_0_18px_rgba(245,197,66,0.25)] focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[#F5C542] motion-reduce:transform-none"
              >
                [ ENTER SYSTEM ]
              </button>
            )}

            <p className="mt-6 font-mono text-[10px] tracking-widest text-[#F5C542]">
              ● {message.slice(0, visibleCount)}
              <span className="cursor-blink">_</span>
            </p>
          </section>

          <div
            ref={sceneRef}
            className={`absolute z-10 left-1/2 top-[calc(50%+24px)]
              hidden w-[calc(100vw-48px)] max-w-[1520px]
              grid-cols-[minmax(0,1.5fr)_minmax(0,1fr)]
              min-[900px]:grid
              min-[1101px]:grid-cols-[190px_minmax(0,2.7fr)_minmax(0,0.9fr)]
              items-start gap-6 px-4
              transition-[opacity,filter] duration-700 ease-in-out
              ${
                isExiting
                  ? "opacity-0 blur-sm"
                  : "opacity-100 blur-0"
              }`}
            style={{
              transform: `translate(calc(-50% - 4vw), -50%) scale(${sceneScale})`,
              transformOrigin: "center",
            }}
          >
            <div className="hidden min-w-0 self-stretch min-[1101px]:block">
              <IntroSidebar />
            </div>


            {/* Interactive code editor */}
            <div className="flex min-w-0 flex-col items-start gap-[clamp(8px,1.3dvh,16px)]">

              {/* CodeCanvas container */}
              <div className="relative w-full min-w-0 overflow-hidden border">

                <CodeCanvas
                  activeCommand={terminalCommand}
                  patchPhase={patchPhase}
                  onPatchPhaseChange={handlePatchPhaseChange}
                  onNavigationComplete={finishNavigation}
                  isPaused={isSplit}
                  onAutoKey={handleEditorAutoKey}
                />

                {/* Secondary editor overlays CodeCanvas */}
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
                      onAutoKey={handleEditorAutoKey}
                    />
                  </div>
                )}

              </div>

              {/* IntroTerminal stays BELOW CodeCanvas */}
              <div className="w-full min-w-0 border">
                <IntroTerminal
                  ref={terminalRef}
                  onCommand={handleTerminalCommand}
                  patchPhase={patchPhase}
                  onEnterSystem={enterSystem}
                  secondaryEditComplete={secondaryEditComplete}
                  secondaryExecutionComplete={secondaryExecutionComplete}
                  isVisitorIdle={isVisitorIdle}
                  onAutoKey={handleTerminalAutoKey}
                />
              </div>

              <div className="grid w-full min-w-0 grid-cols-[minmax(0,1fr)_150px] items-start gap-3">
               
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

            {/* Developer Introduction */}
            <div className="relative isolate flex min-w-0 self-stretch flex-col items-start gap-2">

              {/*  */}
              <div className="relative z-10 mt-[clamp(8px,2dvh,32px)] flex w-full min-w-0 flex-1 flex-col items-start gap-[clamp(4px,0.7dvh,8px)] [text-shadow:0_2px_6px_rgba(0,0,0,0.95)]">

                {/* Baybayin Symbol */}
                <span className="mb-3 font-mono text-4xl text-[#F5C542]">
                  ᜀᜍᜒᜁᜐ᜔
                </span>
                
                {/* Developer Name */}
                <h1 className="font-mono text-2xl font-semibold tracking-[0.15em] text-[#E6DDC9]">
                  ADRIAN.JS
                </h1>

                {/* Developer Information */}
                <p className="font-mono text-[10px] tracking-[0.18em] text-[#92958B]">
                  SOFTWARE DEVELOPER
                </p>

                {/* */}
                <p className="font-mono text-[10px] tracking-[0.18em] text-[#92958B]">
                  BASED IN THE PHILIPPINES
                </p>
                
                {/* Introduction */}
                <div className="mt-[clamp(12px,2.5dvh,32px)] w-full max-w-[340px]">
                  <div className="mb-[clamp(8px,1.5dvh,24px)] h-px w-10 bg-[#494538]" />
                    <p className="font-mono text-[12px] leading-6 text-[#E6DDC6]">
                      I build digital experiences,
                      explore emerging technologies,
                      and turn ideas into real solutions.
                    </p>

                    {/* Specialties */}
                    <div className="mt-[clamp(10px,2dvh,28px)] flex flex-col gap-2 font-mono text-[10px] tracking-[0.1em] tracking-[0.1em] text-[#92958B]">
                      <p><span className="text-[#D94B43]">{"//"}</span> WEB APPLICATIONS</p>
                      <p><span className="text-[#D94B43]">{"//"}</span> CREATIVE SYSTEMS</p>
                      <p><span className="text-[#D94B43]">{"//"}</span> OPEN SOURCE</p>
                    </div>
                </div>

                {/* Enter System */}
                {!hasEntered && (
                  <div className="mt-[clamp(12px,2.5dvh,32px)] flex flex-col gap-3">
                    <div className="flex items-center gap-5">
                      <button
                        type="button"
                        onClick={enterSystem}
                        className="border border-[#F5C542] px-8 py-4 font-mono text-[11px] tracking-[0.2em] text-[#F5C542] transition-colors duration-300 hover:bg-[#F5C542] hover:text-[#0B0C0B]">
                          [ ENTER SYSTEM ]
                        </button>

                        <span className="font-mono text-xl text-[#F5C542]">
                          →
                        </span>
                    </div>

                    <div className="flex items-center gap-3">
                      <span className="h-px w-5 bg-[#494538]" />
                      <span className="font-mono text-[10px] text-[#92958B]">
                        proceed to /site
                      </span>
                    </div>
                  </div>
                )}

                {/* System Status */}
                <p className="mt-5 font-mono text-[10px] tracking-[0.15em] text-[#F5C542] [@media(max-height:850px)]:mt-2">
                  ● {message.slice(0, visibleCount)}
                  <span className="cursor-blink">_</span>
                </p>

                {/* System boot progress */}
                {hasEntered && (
                  <div
                    className="mx-auto mt-3 h-[2px] w-full max-w-[340px] overflow-hidden bg-[#494538]"
                    role="progressbar"
                    aria-label="System boot animation"
                    aria-valuemin={0}
                    aria-valuemax={100}
                    aria-valuenow={bootProgress}
                  >
                    <div
                      className="h-full bg-[#F5C542] transition-[width] duration-75 ease-linear motion-reduce:transition-none"
                      style={{
                        width: `${bootProgress}%`,
                      }}
                    />
                  </div>
                )}

                {/* System  Readout */}
                <div className="mt-[clamp(16px,3dvh,36px)] w-full max-w-[340px] border-t border-[#494538] pt-[clamp(10px,1.5dvh,20px)]">

                  <p className="mb-5 font-mono text-[10px] tracking-[0.15em] text-[#92958B]">
                    SYSTEM READOUT
                  </p>

                  <div className="grid w-full grid-cols-[minmax(0,1fr)_auto] gap-x-4 gap-y-3 font-mono text-[10px]">

                    <span className="text-[#92958B]">› PATCH MODE</span>
                    <span className="text-[#F5C542] text-right">
                      {patchPhase.toUpperCase()}
                    </span>

                    <span className="text-[#92958B]">› EDITOR MODE</span>
                    <span className="text-[#F5C542] text-right">
                      {isSplit ? "SPLIT" : "SINGLE"}
                    </span>

                    <span className="text-[#92958B]">› SESSION</span>
                    <span className="text-[#F5C542] text-right">
                      001
                    </span>

                    <span className="text-[#92958B]">› SYSTEM</span>
                    <span className={`text-right ${hasEntered ? "text-[#F5C542]" : "text-[#D94B43]"}`}>
                      {hasEntered ? "INITIALIZING" :  "DORMANT"}
                    </span>
                    
                    <span className="text-[#92958B]">
                      › AUTO INPUT
                    </span>

                    <span className={`text-right ${
                      autoInputSource === "STANDBY"
                        ? "text-[#92958B]"
                        : "text-[#F5C542]"
                    }`}>
                      {autoInputSource}
                    </span>

                    <PointerTelemetry />

                  </div>
                </div>
              </div>
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
