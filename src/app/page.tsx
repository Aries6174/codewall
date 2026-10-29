
"use client";

import { useCallback, useEffect, useRef, useState } from "react";

import CodeCanvas from "@/components/CodeCanvas";
import IntroTopBar from "@/components/IntroTopBar";
import SecondaryEditorPane from "@/components/SecondaryEditorPane";
import IntroTerminal, { type IntroTerminalHandle } from "@/components/IntroTerminal";
import IntroKeyboard from "@/components/IntroKeyboard";
import IntroMouse from "@/components/IntroMouse";
import PointerTracker from "@/components/PointerTracker"
import PointerTelemetry from "@/components/PointerTelemetry";

type PatchPhase = "idle" | "running" | "complete";

export default function Home() {
  // States
  const [terminalCommand, setTerminalCommand] = useState("");
  const [terminalStatus, setTerminalStatus] = useState("READY");
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
    }, 650)

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
    const IDLE_TIMEOUT = 250;

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
          : `h-dvh overflow-hidden`
      }`}
    >

      {/* INTRO SCREEN */}
      {!showPortfolio && (
        <>
          {/* Full-screen landscape background */}
          {/* <IntroAtmosphere isExiting={isExiting} /> */}

          {/* Top system bar */}
          <IntroTopBar
            hasEntered={hasEntered}
            isExiting={isExiting}
          />
          
          <PointerTracker />

          {/* Central intro content */}

          {/* Mobile and Tablet Introduction */}
          <section
            data-mobile-intro
            className={`absolute inset-x-4 top-[64px] bottom-3
              flex flex-col items-center justify-center text-center
              min-[425px]:inset-x-6
              min-[768px]:top-[80px]
              min-[768px]:bottom-6
              min-[900px]:hidden
              [@media(max-height:600px)]:top-[56px]
              transition-[opacity,filter] duration-700
              ${
                isExiting
                  ? "opacity-0 blur-sm"
                  : "opacity-100 blur-0"
              }`}
          >
            {/* Baybayin */}
            <span
              className="font-mono text-[30px] leading-none text-[#F5C542]
                min-[375px]:text-[34px]
                min-[425px]:text-4xl
                min-[768px]:text-5xl
                [@media(max-height:600px)]:text-[28px]"
            >
              ᜀᜍᜒᜁᜐ᜔
            </span>

            {/* Developer Name */}
            <h1
              className="mt-4 font-mono text-[26px] font-semibold
                leading-tight tracking-[0.1em] text-[#E6DDC9]
                min-[375px]:text-[28px]
                min-[425px]:text-[30px]
                min-[768px]:mt-6
                min-[768px]:text-[40px]
                [@media(max-height:600px)]:mt-2
                [@media(max-height:600px)]:text-[25px]"
            >
              ADRIAN.JS
            </h1>

            {/* Developer Details */}
            <p
              className="mt-3 font-mono text-[10px] tracking-[0.2em]
                text-[#92958B]
                min-[768px]:mt-4
                min-[768px]:text-xs
                [@media(max-height:600px)]:mt-2"
            >
              SOFTWARE DEVELOPER
            </p>

            <p
              className="mt-1 font-mono text-[10px] text-[#92958B]
                min-[768px]:text-xs"
            >
              BASED IN THE PHILIPPINES
            </p>

            {/* Introduction */}
            <p
              className="mx-auto mt-6 max-w-[300px] font-mono
                text-[12px] leading-5 text-[#E6DDC9]
                min-[375px]:max-w-[330px]
                min-[425px]:max-w-sm
                min-[768px]:mt-8
                min-[768px]:max-w-md
                min-[768px]:text-[14px]
                min-[768px]:leading-6
                [@media(max-height:600px)]:mt-4"
            >
              I build digital experiences, explore emerging
              technologies, and turn ideas into real solutions.
            </p>

            {/* Enter System */}
            {!hasEntered && (
              <button
                type="button"
                onClick={enterSystem}
                className="mt-6 border border-[#F5C542]
                  px-5 py-3 font-mono text-[11px]
                  tracking-[0.2em] text-[#F5C542]
                  transition-all duration-300 ease-out
                  hover:-translate-y-0.5
                  hover:bg-[#F5C542]
                  hover:text-[#0B0C0B]
                  hover:shadow-[0_0_18px_rgba(245,197,66,0.25)]
                  focus-visible:outline-2
                  focus-visible:outline-offset-4
                  focus-visible:outline-[#F5C542]
                  motion-reduce:transform-none
                  min-[375px]:px-7
                  min-[768px]:px-10
                  min-[768px]:py-4
                  [@media(max-height:600px)]:mt-4"
              >
                [ ENTER SYSTEM ]
              </button>
            )}

            {/* System Status */}
            <p
              className="mt-5 font-mono text-[10px]
                tracking-widest text-[#F5C542]
                min-[768px]:mt-7
                [@media(max-height:600px)]:mt-3"
            >
              ● {message.slice(0, visibleCount)}
              <span className="cursor-blink">_</span>
            </p>
          </section>

          <div
            className={`absolute inset-x-[15%] top-[78px] bottom-4 z-10
              [@media(max-height:760px)]:top-[64px]
              [@media(max-height:760px)]:bottom-2
              hidden min-[900px]:grid
              grid-cols-[minmax(0,1fr)_260px]
              min-[1101px]:grid-cols-[minmax(0,1fr)_300px]
              min-[1440px]:grid-cols-[minmax(0,1fr)_340px]
              grid-rows-[minmax(0,1fr)]
              items-stretch gap-4
              transition-[opacity,filter] duration-700 ease-in-out
              ${isExiting ? "opacity-0 blur-sm" : "opacity-100 blur-0"}`}
          >
            {/* Interactive code editor */}
            <div className="flex h-full min-h-0 w-full min-w-0 flex-col gap-2 [@media(max-height:760px)]:gap-1">

              {/* CodeCanvas container */}
              <div className="relative w-full min-w-0 overflow-hidden">

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
                    className={`flex h-full w-full min-w-0 flex-col z-10 w-1/2 overflow-hidden
                      border-l border-[#494538]/40
                      bg-[#080A09]/25 backdrop-blur-[6px]
                      ${
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
              <div className="w-full min-w-0">
                <IntroTerminal
                  ref={terminalRef}
                  onCommand={handleTerminalCommand}
                  patchPhase={patchPhase}
                  onEnterSystem={enterSystem}
                  secondaryEditComplete={secondaryEditComplete}
                  secondaryExecutionComplete={secondaryExecutionComplete}
                  isVisitorIdle={isVisitorIdle}
                  onAutoKey={handleTerminalAutoKey}
                  onStatusChange={setTerminalStatus}
                />
              </div>

              <div
                data-intro-inputs
                className="
                  mx-auto grid w-full min-w-0
                  max-w-[590px]
                  min-[2560px]:max-w-[700px]
                  grid-cols-[minmax(0,1fr)_120px]
                  min-[2560px]:grid-cols-[minmax(0,1fr)_140px]
                  items-start gap-3
                "
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

            {/* Developer Introduction */}
            <div className="relative isolate flex h-full min-h-0 w-full min-w-0 flex-col [@media(max-height:800px)]:gap-1">

              <div className="relative z-10 flex h-full min-h-0 w-full flex-col gap-3 [text-shadow:0_2px_6px_rgba(0,0,0,0.95)] [@media(max-height:760px)]:gap-1">

              {/* Developer Identity Header */}
              <div className="w-full min-w-0">

                {/* Identification */}
                <div className="mb-3 flex items-center justify-between gap-2 border-b border-[#494538]/60 pb-2 font-mono text-[9px] tracking-[0.12em]">
                  <span className="text-[#F5C542]">
                    SYS://IDENTITY
                  </span>

                  <span className="text-[#92958B]">
                    PERSONNEL_001
                  </span>
                </div>

                {/* Baybayin and Profile Status */}
                <div className="mb-2 flex items-center justify-between gap-2">
                  <span className="font-mono text-3xl leading-none text-[#F5C542]">
                    ᜀᜍᜒᜁᜐ᜔
                  </span>

                  <span className="flex shrink-0 items-center gap-1 font-mono text-[9px] text-[#59C9A5]">
                    <span className="h-1.5 w-1.5 rounded-full bg-[#59C9A5]" />
                    PROFILE READY
                  </span>
                </div>

                {/* Developer Name */}
                <h1 className="font-mono text-[28px] font-semibold leading-tight tracking-[0.12em] text-[#E6DDC9]">
                  ADRIAN.JS
                  <span className="text-[#F5C542]">_</span>
                </h1>

                {/* Developer Details */}
                <div className="mt-2 flex flex-col gap-1 font-mono text-[12px] tracking-[0.1em] text-[#92958B] [@media(min-height:950px)]:mt-4 [@media(min-height:950px)]:gap-2">
                  <p>SOFTWARE DEVELOPER</p>
                  <p>BASED IN THE PHILIPPINES</p>
                </div>

              </div>
                
                {/* Introduction */}
                <div className="mt-4 w-full min-w-0 [@media(min-height:950px)]:mt-12 [@media(max-height:800px)]:mt-0">
                  <div className="mb-[clamp(8px,1.5dvh,24px)] h-px w-10 bg-[#494538]" />
                    <p className="font-mono text-[12px] leading-5 text-[#E6DDC6]">
                      I build digital experiences,
                      explore emerging technologies,
                      and turn ideas into real solutions.
                    </p>

                    {/* Specialties */}
                    <div className="mt-3 flex flex-col gap-1 font-mono text-[13px] tracking-[0.1em] text-[#92958B] [@media(min-height:950px)]:mt-8 [@media(min-height:950px)]:gap-4 [@media(max-height:760px)]:mt-1
                      [@media(max-height:760px)]:gap-0
                      [@media(max-height:760px)]:text-[11px]
                      [@media(max-height:760px)]:leading-4"
                    >
                      <p><span className="text-[#D94B43]">{"//"}</span> WEB APPLICATIONS</p>
                      <p><span className="text-[#D94B43]">{"//"}</span> CREATIVE SYSTEMS</p>
                      <p><span className="text-[#D94B43]">{"//"}</span> OPEN SOURCE</p>
                    </div>
                </div>

                {/* Enter System */}
                {!hasEntered && (
                  <div className="mt-4 flex flex-col gap-2 [@media(min-height:950px)]:mt-12 [@media(min-height:950px)]:gap-4 [@media(max-height:800px)]:mt-0 [@media(max-height:760px)]:mt-1
                    [@media(max-height:760px)]:gap-1"
                  >
                    <div className="flex items-center gap-5">
                      <button
                        type="button"
                        onClick={enterSystem}
                        className="border border-[#F5C542] px-6 py-3 font-mono text-[11px] tracking-[0.2em] text-[#F5C542] transition-colors duration-300 hover:bg-[#F5C542] hover:text-[#0B0C0B]">
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
                <div
                  id="system-readout"
                  className="mt-[clamp(16px,3dvh,36px)] w-full border-t border-[#494538] pt-3 [@media(max-height:760px)]:mt-1 [@media(max-height:760px)]:pt-2"
                >

                  <p className="mb-2 font-mono text-[10px] tracking-[0.15em] text-[#92958B]">
                    SYSTEM READOUT
                  </p>

                  <div className="grid w-full grid-cols-[minmax(0,1fr)_auto] gap-x-4 gap-y-1 font-mono text-[10px] [@media(max-height:760px)]:gap-y-0
                    [@media(max-height:760px)]:leading-4"
                  >
                    <span className="text-[#92958B]">› PATCH MODE</span>
                    <span className="text-[#F5C542] text-right">
                      {patchPhase.toUpperCase()}
                    </span>

                    <span className="text-[#92958B]">› EDITOR MODE</span>
                    <span className="text-[#F5C542] text-right">
                      {isSplit ? "SPLIT" : "SINGLE"}
                    </span>

                    <span className="text-[#92958B]">› TERMINAL</span>
                    <span className="text-[#F5C542] text-right">
                      {terminalStatus}
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
