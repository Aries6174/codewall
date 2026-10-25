
"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import KeyboardHands from "./KeyboardHands";

type Point = {
  x: number;
  y: number;
};

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
    { label: "SHIFT", value: "shift-left", width: 2 },
    ...characters("zxcvbnm,./"),
    { label: "SHIFT", value: "shift-right", width: 2 },
  ],
  [
    { label: "CTRL", value: "control-left", width: 1.5 },
    { label: "ALT", value: "alt-left", width: 1.5 },
    { label: "SPACE", value: " ", width: 7 },
    { label: "ALT", value: "alt-right", width: 1.5 },
    { label: "CTRL", value: "control-right", width: 1.5 },
  ],
];

const fingerGroups: Record<string, string[]> = {
  "left-pinky": [
    "`", "1", "q", "a", "z",
    "tab", "capslock", "shift-left", "control-left"
  ],
  "left-ring": ["2", "w", "s", "x"],
  "left-middle": ["3", "e", "d", "c"],
  "left-index": ["4", "5", "r", "t", "f", "g", "v", "b"],
  "left-thumb": [" ", "alt-left"],

  "right-index": ["6", "7", "y", "u", "h", "j", "n", "m"],
  "right-middle": ["8", "i", "k", ","],
  "right-ring": ["9", "o", "l", "."],
  "right-pinky": [
    "0", "-", "=", "p", "[", "]", "\\",
    ";", "'", "/", "enter", "backspace",
    "shift-right", "control-right",
  ],
  "right-thumb": ["alt-right"],
};

// Convert browser keyboard events into our own
// unique key identifiers.
function normalizeKey(event: KeyboardEvent): string {
  switch (event.code) {
    case "ShiftLeft":
      return "shift-left";

    case "ShiftRight":
      return "shift-right";

    case "ControlLeft":
      return "control-left";

    case "ControlRight":
      return "control-right";

    case "AltLeft":
      return "alt-left";

    case "AltRight":
      return "alt-right";

    default:
      return event.key.toLowerCase();
  }
}

function findFinger(key: string): string | null {
  for (const [finger, keys] of Object.entries(fingerGroups)) {
    if (keys.includes(key)) {
      return finger;
    }
  }

  return null;
}

export default function IntroKeyboard() {
  const keyboardRef = useRef<HTMLDivElement>(null);
  const pressedKeysRef = useRef<Set<string>>(new Set());

  const [pressedKeys, setPressedKeys] = useState<string[]>([]);
  const [fingerTargets, setFingerTargets] = useState<
    Record<string, Point>
  >({});

  const [keyboardSize, setKeyboardSize] = useState({
    width: 520,
    height: 220,
  });

  const [homePositions, setHomePositions] = useState<{
    left: number | null;
    right: number | null;
  }>({
    left: null,
    right: null,
  });

  const getKeyPosition = useCallback(
    (key: string): Point | null => {
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

      const scaleX =
        keyboard.clientWidth / keyboardRect.width;

      const scaleY =
        keyboard.clientHeight / keyboardRect.height;

      return {
        x:
          (keyRect.left + keyRect.width / 2 - keyboardRect.left) *
          scaleX,
        y:
          (keyRect.top + keyRect.height / 2 - keyboardRect.top) *
          scaleY,
      };
    },
    []
  );

  // Synchronize all currently held keys
  // with their respective fingers.
  const syncPressedKeys = useCallback(() => {
    const held = [...pressedKeysRef.current];
    const targets: Record<string, Point> = {};

    for (const key of held) {
      const finger = findFinger(key);
      const position = getKeyPosition(key);

      if (finger && position) {
        targets[finger] = position;
      }
    }

    setPressedKeys(held);
    setFingerTargets(targets);
  }, [getKeyPosition]);

  // Measure keyboard dimensions and positions.
  useEffect(() => {
    const keyboard = keyboardRef.current;

    if (!keyboard) return;

    const updateKeyboard = () => {
      setKeyboardSize({
        width: keyboard.clientWidth,
        height: keyboard.clientHeight,
      });

      setHomePositions({
        left: getKeyPosition("f")?.x ?? null,
        right: getKeyPosition("j")?.x ?? null,
      });

      if (pressedKeysRef.current.size > 0) {
        syncPressedKeys();
      }
    };

    const observer = new ResizeObserver(updateKeyboard);

    observer.observe(keyboard);
    updateKeyboard();

    return () => observer.disconnect();
  }, [getKeyPosition, syncPressedKeys]);

  // Listen for physical keyboard input.
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      const key = normalizeKey(event);

      if (!getKeyPosition(key)) return;

      // Prevent repeated keydown events from
      // restarting animations.
      if (pressedKeysRef.current.has(key)) return;

      pressedKeysRef.current.add(key);
      syncPressedKeys();
    };

    const handleKeyUp = (event: KeyboardEvent) => {
      const key = normalizeKey(event);

      if (!pressedKeysRef.current.has(key)) return;

      pressedKeysRef.current.delete(key);
      syncPressedKeys();
    };

    // Prevent keys from staying highlighted
    // if the browser loses focus.
    const clearKeys = () => {
      pressedKeysRef.current.clear();
      syncPressedKeys();
    };

    window.addEventListener("keydown", handleKeyDown);
    window.addEventListener("keyup", handleKeyUp);
    window.addEventListener("blur", clearKeys);

    return () => {
      window.removeEventListener("keydown", handleKeyDown);
      window.removeEventListener("keyup", handleKeyUp);
      window.removeEventListener("blur", clearKeys);
    };
  }, [getKeyPosition, syncPressedKeys]);

  return (
    <div className="w-full select-none font-mono">
      {/* Header */}
      <div className="flex justify-between text-[9px] tracking-widest text-[#92958B]">
        <span>INPUT / KEYBOARD</span>
        <span className="text-[#F5C542]">
          {pressedKeys.length > 0
            ? `${pressedKeys.length} ACTIVE`
            : "LIVE"}
        </span>
      </div>

      {/* Keyboard */}
      <div
        ref={keyboardRef}
        className="relative mx-auto mt-3 flex max-w-[520px] flex-col gap-[3px] pb-[110px]"
      >
        {keyboardRows.map((row, rowIndex) => (
          <div key={rowIndex} className="flex gap-[3px]">
            {row.map((key, keyIndex) => {
              const active = pressedKeys.includes(key.value);

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

        {/* Wireframe hands */}
        <KeyboardHands
          width={keyboardSize.width}
          height={keyboardSize.height}
          fingerTargets={fingerTargets}
          homePositions={homePositions}
        />
      </div>
    </div>
  );
}
