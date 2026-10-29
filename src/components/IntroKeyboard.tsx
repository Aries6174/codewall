
"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import KeyboardHands from "./KeyboardHands";


type IntroKeyboardProps = {
  isMouseActive: boolean;
  mouseOffset: {
    x: number;
    y: number;
  };
  autoKeyEvent: {
    key: string;
    id: number;
  } | null
};

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

const shiftedKeys: Record<string, string> = {
  "!": "1",
  "@": "2",
  "#": "3",
  "$": "4",
  "%": "5",
  "^": "6",
  "&": "7",
  "*": "8",
  "(": "9",
  ")": "0",
  "_": "-",
  "+": "=",
  "{": "[",
  "}": "]",
  "|": "\\",
  ":": ";",
  '"': "'",
  "<": ",",
  ">": ".",
  "?": "/",
  "~": "`",
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

export default function IntroKeyboard({
  isMouseActive,
  mouseOffset,
  autoKeyEvent,
}: IntroKeyboardProps) {
  const keyboardRef = useRef<HTMLDivElement>(null);
  const pressedKeysRef = useRef<Set<string>>(new Set());
  const autoPressedRef = useRef<string[]>([]);
  const autoHighlightedRef = useRef<string[]>([]);
  const autoQueueRef = useRef<string[]>([]);
  const autoPlayingRef = useRef(false);
  const autoTimersRef = useRef<number[]>([]);
  const lastAutoEventIdRef = useRef<number | null>(null);

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

      // Prevent division by zero when the keyboard is hidden.
      if (
        keyboardRect.width === 0 ||
        keyboardRect.height === 0 ||
        keyboard.clientWidth === 0 ||
        keyboard.clientHeight === 0
      ) {
        return null;
      }

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

  const syncPressedKeys = useCallback(() => {
    const held = [...pressedKeysRef.current];

    const activeKeys = [
      ...new Set([
        ...held,
        ...autoHighlightedRef.current.filter((key) => {
          const finger = findFinger(key);

          return !isMouseActive || !finger?.startsWith("right-");
        }),
      ]),
    ];


    const targets: Record<string, Point> = {};

    // Priority 1: Physical keyboard input
    for (const key of held) {
      const finger = findFinger(key);
      const position = getKeyPosition(key);

      if (finger && position) {
        targets[finger] = position;
      }
    }

    // Priority 2: Automatic CodeCanvas typing
    for (const key of autoPressedRef.current) {
      const finger = findFinger(key);
      const position = getKeyPosition(key);

      if (!finger || !position) continue;

      // Physical input takes priority over automatic input.
      if (targets[finger]) continue;

      targets[finger] = position;
    }

    setPressedKeys(activeKeys);
    setFingerTargets(targets);
  }, [getKeyPosition, isMouseActive]);

  const playNextAutoKey = useCallback(function playNextAutoKey() {
    if (autoPlayingRef.current) return;

    const character = autoQueueRef.current.shift();
    if (character === undefined) return;

    const shiftedKey = shiftedKeys[character];
    const key = shiftedKey ?? character.toLowerCase();

    if (!getKeyPosition(key)) {
      playNextAutoKey();
      return;
    }

    const isUppercase =
      character.length === 1 &&
      character >= "A" &&
      character <= "Z";

    const needsShift = isUppercase || shiftedKey !== undefined;
    const finger = findFinger(key);

    const keys = needsShift
      ? [
          finger?.startsWith("left-")
            ? "shift-right"
            : "shift-left",
          key,
        ]
      : [key];

    autoPlayingRef.current = true;

    // Keep previous fingers active while adding the new key.
    autoPressedRef.current = [
      ...keys,
      ...autoPressedRef.current,
    ];

    syncPressedKeys();

    // Track timers so they can be cleaned up.
    const schedule = (callback: () => void, delay: number) => {
      const timer = window.setTimeout(() => {
        autoTimersRef.current = autoTimersRef.current.filter(
          (id) => id !== timer
        );
        callback();
      }, delay);

      autoTimersRef.current.push(timer);
    };

    // Highlight the key after the finger approaches.
    schedule(() => {
      autoHighlightedRef.current = [
        ...keys,
        ...autoHighlightedRef.current,
      ];

      syncPressedKeys();
    }, 60);

    // Start typing the next key.
    schedule(() => {
      autoPlayingRef.current = false;
      playNextAutoKey();
    }, 160);

    // Release the previous finger and highlight after lingering.
    schedule(() => {
      for (const pressedKey of keys) {
        const pressedIndex =
          autoPressedRef.current.lastIndexOf(pressedKey);

        if (pressedIndex !== -1) {
          autoPressedRef.current.splice(pressedIndex, 1);
        }

        const highlightedIndex =
          autoHighlightedRef.current.lastIndexOf(pressedKey);

        if (highlightedIndex !== -1) {
          autoHighlightedRef.current.splice(highlightedIndex, 1);
        }
      }

      syncPressedKeys();
    }, 280);
  }, [getKeyPosition, syncPressedKeys]);


useEffect(() => {
    if (!autoKeyEvent) return;
    if (lastAutoEventIdRef.current === autoKeyEvent.id) return;

    lastAutoEventIdRef.current = autoKeyEvent.id;

    // Avoid a large visual backlog during fast typing.
    if (autoQueueRef.current.length >= 8) {
      autoQueueRef.current.shift();
    }

    autoQueueRef.current.push(autoKeyEvent.key);
    playNextAutoKey();
  }, [autoKeyEvent, playNextAutoKey]);

  useEffect(() => {
    return () => {
      autoTimersRef.current.forEach(window.clearTimeout);
      autoQueueRef.current = [];
    };
  }, []);

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

      if (pressedKeysRef.current.size > 0 || autoPressedRef.current.length > 0) {
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
      autoPressedRef.current =[];
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
        className="relative mx-auto mt-3 flex max-w-[620px] flex-col gap-[3px] pb-[clamp(95px,13dvh,140px)]"
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
          isMouseActive={isMouseActive}
          mouseOffset={mouseOffset}
        />
      </div>
    </div>
  );
}
