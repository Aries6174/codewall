
"use client";

import { useEffect, useState } from "react";

import CodeCanvas from "@/components/CodeCanvas";
import LivingCodeCanvas from "@/components/LivingCodeCanvas";
import IntroTopBar from "@/components/IntroTopBar";
import IntroTerminal from "@/components/IntroTerminal";

export default function Home() {
  // States
  const [visibleCount, setVisibleCount] = useState(0);
  const [hasEntered, setHasEntered] = useState(false);
  const [signalDetected, setSignalDetected] = useState(false);
  const [isExiting, setIsExiting] = useState(false);
  const [showPortfolio, setShowPortfolio] = useState(false);

  // Message displayed underneath the editor
  const message = hasEntered
    ? "SYSTEM ONLINE"
    : "SYSTEM DORMANT";

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
    if (!hasEntered || visibleCount < message.length) {
      return;
    }

    setIsExiting(true);

    const timeout = setTimeout(() => {
      setShowPortfolio(true);
    }, 700);

    return () => clearTimeout(timeout);
  }, [hasEntered, visibleCount, message]);

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
            className={`relative z-10 flex w-full flex-col items-center gap-4 px-4
              transition-all duration-700 ease-in-out
              ${
                isExiting
                  ? "scale-95 opacity-0 blur-sm"
                  : "scale-100 opacity-100 blur-0"
              }`}
          >
            {/* System identification */}
            <p className="text-xs tracking-[0.3em] text-[#92958B]">
              ADRIAN.JS / {signalDetected ? "SIGNAL_RECEIVED" : "SYSTEM_001"}
            </p>

            {/* Interactive code editor */}
            <CodeCanvas />

            <IntroTerminal />

            {/* Status indicator */}
            <div className="h-3 w-3 animate-pulse rounded-full bg-[#F5C542]" />

            {/* Typed system message */}
            <p className="text-sm text-[#F5C542]">
              {message.slice(0, visibleCount)}
              <span className="cursor-blink">_</span>
            </p>

            {/* Enter system button */}
            {!hasEntered && (
              <button
                type="button"
                onClick={() => {
                  setHasEntered(true);
                  setVisibleCount(0);
                }}
                className="mt-4 border border-[#494538] px-6 py-3 text-xs tracking-[0.2em] text-[#F5C542] transition-colors duration-300 hover:border-[#F5C542] hover:bg-[#F5C542] hover:text-[#0B0C0B]"
              >
                [ ENTER SYSTEM ]
              </button>
            )}
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
              // DEVELOPER PROFILE
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
