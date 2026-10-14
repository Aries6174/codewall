"use client";

import {useEffect, useState} from "react";

const message = "SYSTEM DORMANT";

import CodeCanvas from "@/components/CodeCanvas"
import TopBar from "@/components/TopBar";
import Sidebar from "@/components/Sidebar";
import AboutPanel from "@/components/AboutPanel";
import ProjectsPanel from "@/components/ProjectsPanel";
import TechStackPanel from "@/components/TechStackPanel";
import ActivityPanel from "@/components/ActivityPanel";
import ArtworkPanel from "@/components/ArtworkPanel";

export default function Home() {
  const [visibleCount, setVisibleCount] = useState(0);

  useEffect(() => {
    if (visibleCount >= message.length) {
      return;
    }

    const timeout = setTimeout(() => {
      setVisibleCount(visibleCount+1);
    }, 80);

    return () => clearTimeout(timeout);
  }, [visibleCount]);

  return (
    <main className="flex min-h-dvh items-center justify-center bg-background text-foreground">
      <div className="flex flex-col items-center gap-4">
        <p className="text-xs tracking-[0,3em] text-[#92958B]">
          ADRIAN.JS / SYSTEM_001
        </p>

        <CodeCanvas />
    
        <div className="h-3 w-3 animate-pulse rounded-full bg-[#F5C542]" />
        <p className="text-sm text-[#F5C542]">
          {message.slice(0,visibleCount)}
          <span className="cursor-blink">_</span>
        </p>
      </div>
    </main>
  );
}
