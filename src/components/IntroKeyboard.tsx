
"use client";

import { useEffect, useRef, useState } from "react";
import KeyboardHands from "./KeyboardHands";

type Key = {
  label: string;
  value: string;
  width?: number;
};

const characters = (text: string): Key[] =>
  [...text].map((character) => ({
    label: character.toUpperCase(),
    value: character.toLowerCase(),
  }));

const keyboardRows: Key[][] = [
  [
    ...characters("`1234567890-="),
    { label: "BKSP", value: "backspace", width: 2 },
  ],
  [
    { label: "TAB", value: "tab", width: 1.5 },
    ...characters("qwertyuiop[]\\"),
  ],
  [
    { label: "CAPS", value: "capslock", width: 1.8 },
    ...characters("asdfghjkl;'"),
    { label: "ENTER", value: "enter", width: 2 },
  ],
  [
    { label: "SHIFT", value: "shift", width: 2 },
    ...characters("zxcvbnm,./"),
    { label: "SHIFT", value: "shift", width: 2 },
  ],
  [
    { label: "CTRL", value: "control", width: 1.5 },
    { label: "ALT", value: "alt", width: 1.5 },
    { label: "SPACE", value: " ", width: 7 },
    { label: "ALT", value: "alt", width: 1.5 },
    { label: "CTRL", value: "control", width: 1.5 },
  ],
];

const fingerGroups: Record<string, string[]> = {
  "left-pinky": ["`", "1", "q", "a", "z", "tab", "capslock", "shift"],
  "left-ring": ["2", "w", "s", "x"],
  "left-middle": ["3", "e", "d", "c"],
  "left-index": ["4", "5", "r", "t", "f", "g", "v", "b"],
  "left-thumb": [" ", "alt", "control"],

  "right-index": ["6", "7", "y", "u", "h", "j", "n", "m"],
  "right-middle": ["8", "i", "k", ","],
  "right-ring": ["9", "o", "l", "."],
  "right-pinky": [
    "0", "-", "=", "p", "[", "]", "\\",
    ";", "'", "/", "enter", "backspace",
  ],
};

function findFinger(key: string): string | null {
  for (const [finger, keys] of Object.entries(fingerGroups)) {
    if (keys.includes(key)) {
      return finger;
    }
  }

  return null;
}

export default function IntroKeyboard() {
    const [activeKey, setActiveKey] = useState("");
    const [activeFinger, setActiveFinger] = useState<string | null>(null);
    const keyboardRef = useRef<HTMLDivElement>(null);
    const[targetKey, setTargetKey] = useState<{
        x: number;
        y: number;
    } | null>(null);
    const [keyboardSize, setKeyboardSize] = useState({
        width: 520,
        height: 220,
    });

    const getKeyPosition = (key: string) => {
        const keyboard = keyboardRef.current;

        if (!keyboard) return null;
        
        const keys = Array.from(
            keyboard.querySelectorAll<HTMLElement>("[data-key]")
        );

        const element = keys.find(
            (item) => item.dataset.key === key
        );

        if (!element) return null;

        const keyboardRect = keyboard.getBoundingClientRect();
        const keyRect = element.getBoundingClientRect();

        const scaleX = keyboard.clientWidth / keyboardRect.width;
        const scaleY = keyboard.clientHeight / keyboardRect.height;

        return {
            x: (keyRect.left + keyRect.width / 2 - keyboardRect.left) * scaleX,
            y: (keyRect.top + keyRect.height / 2 - keyboardRect.top) * scaleY,
        };
    };

    useEffect(() => {
        const keyboard = keyboardRef.current;
        if (!keyboard) return;

        const observer = new ResizeObserver(() => {
            setKeyboardSize({
                width: keyboard.clientWidth,
                height: keyboard.clientHeight,
            });
        });

        observer.observe(keyboard);

        return () => observer.disconnect();
    }, []);

    useEffect(() => {
        let timeout: number;

        const handleKeyDown = (event: KeyboardEvent) => {
        const key = event.key.toLowerCase();

        const position = getKeyPosition(key);
        setTargetKey(position);

        setActiveKey(key);
        setActiveFinger(findFinger(key));

        window.clearTimeout(timeout);

        timeout = window.setTimeout(() => {
            setActiveKey("");
            setActiveFinger(null);
            setTargetKey(null);
        }, 180);
        };

        window.addEventListener("keydown", handleKeyDown);

        return () => {
        window.removeEventListener("keydown", handleKeyDown);
        window.clearTimeout(timeout);
        };
    }, []);

    return (
        <div className="w-full select-none font-mono">
            {/* Header */}
            <div className="flex justify-between text-[9px] tracking-widest text-[#92958B]">
                <span>INPUT / KEYBOARD</span>
                <span className="text-[#F5C542]">LIVE</span>
            </div>
            
            {/* Full keyboard layout */}
            <div
            ref={keyboardRef}
            className="relative mx-auto mt-3 flex max-w-[520px] flex-col gap-[3px] pb-[110px]"
            >
            {keyboardRows.map((row, rowIndex) => (
                <div key={rowIndex} className="flex gap-[3px]">
                {row.map((key, keyIndex) => {
                    const active = activeKey === key.value;

                    return (
                    <div
                        key={`${rowIndex}-${keyIndex}`}
                        data-key={key.value}
                        style={{ flex: key.width ?? 1 }}
                        className={`flex h-[18px] min-w-0 items-center
                        justify-center border text-[9px]
                        transition-colors duration-100 ${
                            active
                            ? "border-[#F5C542] bg-[#F5C542]/15 text-[#F5C542]"
                            : "border-[#302F29] text-[#77715C]"
                        }`}
                    >
                        {key.label}
                    </div>
                    );
                })}
                </div>
            ))}

            <KeyboardHands
                width={keyboardSize.width}
                height={keyboardSize.height}
                activeFinger={activeFinger}
                target={targetKey}
                />
            </div>
        </div>
    );
}
