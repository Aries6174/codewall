"use client";

import { useEffect, useRef } from "react";

export default function LivingCodeCanvas(){
    const canvasRef = useRef<HTMLCanvasElement>(null)l

    useEffect(() => {
        const canvas = canvasRef.current;

        if (!canvas) return;

        const ctx = canvas.getContext("2d");

        if (!ctx) return;

        const resizeCanvas = () => {
            const rect = canvas.getBoundingClientRect();
            const dpr = window.devicePixelRatio || 1;

            canvas.width = Math.round(rect.width * dpr);
            canvas.height = Math.round(rect.height * dpr);

            ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

            ctx.font = "12px monospace";
            ctx.fillStyle = "#92954B";

            ctx.fillText(
                "// system.canvas initialized",
                24,
                42
            )
        }
    })
}