'use client';

import React, { useRef, useState, useEffect, useCallback } from 'react';
import { cn } from '@/lib/utils';
import { Loader2 } from 'lucide-react';

export interface LiquidMetalButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  label: string;
  loading?: boolean;
  icon?: React.ReactNode;
  isActive?: boolean;
}

export function LiquidMetalButton({
  label,
  loading = false,
  icon,
  className,
  disabled,
  onClick,
  isActive = false,
  ...props
}: LiquidMetalButtonProps) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [isHovered, setIsHovered] = useState(false);
  const [isPressed, setIsPressed] = useState(false);
  const [ripples, setRipples] = useState<{ x: number; y: number; id: number }[]>([]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d', { alpha: true });
    if (!ctx) return;

    let animationFrameId: number | null = null;
    let time = 0;

    const width = (canvas.width = canvas.offsetWidth || 240);
    const height = (canvas.height = canvas.offsetHeight || 44);

    const drawFrame = () => {
      time += 0.03;

      ctx.clearRect(0, 0, width, height);

      const grad = ctx.createLinearGradient(0, 0, width, height);
      if (isActive) {
        grad.addColorStop(0, '#EF3030');
        grad.addColorStop(0.5, '#D92727');
        grad.addColorStop(1, '#B91C1C');
      } else {
        grad.addColorStop(0, '#171717');
        grad.addColorStop(0.5, '#262626');
        grad.addColorStop(1, '#404040');
      }

      ctx.fillStyle = grad;
      ctx.fillRect(0, 0, width, height);

      const waveOffset = Math.sin(time) * (width / 2.5);
      const sheenGrad = ctx.createLinearGradient(
        waveOffset,
        0,
        waveOffset + width / 2,
        height
      );
      sheenGrad.addColorStop(0, 'rgba(255, 255, 255, 0)');
      sheenGrad.addColorStop(
        0.5,
        isHovered
          ? 'rgba(255, 255, 255, 0.38)'
          : isActive
          ? 'rgba(255, 255, 255, 0.22)'
          : 'rgba(255, 255, 255, 0.12)'
      );
      sheenGrad.addColorStop(1, 'rgba(255, 255, 255, 0)');

      ctx.fillStyle = sheenGrad;
      ctx.fillRect(0, 0, width, height);
    };

    drawFrame();

    if (isHovered || isActive) {
      const loop = () => {
        drawFrame();
        animationFrameId = requestAnimationFrame(loop);
      };
      loop();
    }

    return () => {
      if (animationFrameId !== null) {
        cancelAnimationFrame(animationFrameId);
      }
    };
  }, [isHovered, isActive]);

  const handleClick = useCallback((e: React.MouseEvent<HTMLButtonElement>) => {
    if (disabled || loading) return;

    const rect = e.currentTarget.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    const rippleId = Date.now();

    setRipples((prev) => [...prev, { x, y, id: rippleId }]);

    setTimeout(() => {
      setRipples((prev) => prev.filter((r) => r.id !== rippleId));
    }, 600);

    if (onClick) onClick(e);
  }, [disabled, loading, onClick]);

  return (
    <button
      {...props}
      disabled={disabled || loading}
      onClick={handleClick}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => {
        setIsHovered(false);
        setIsPressed(false);
      }}
      onMouseDown={() => setIsPressed(true)}
      onMouseUp={() => setIsPressed(false)}
      className={cn(
        'relative overflow-hidden rounded-xl font-medium text-sm text-white transition-all duration-150 ease-out flex items-center justify-center gap-2 px-4 py-2.5 border transform-gpu backface-hidden',
        isActive
          ? 'border-red-500/60 shadow-red-500/20 bg-[#EF3030] text-white font-semibold ring-1 ring-red-500/30'
          : 'border-neutral-700/50 bg-neutral-800/90 text-neutral-200 hover:border-neutral-400/70 hover:text-white',
        isHovered && 'scale-[1.015] shadow-neutral-500/20',
        isPressed && 'scale-[0.975]',
        (disabled || loading) && 'opacity-60 cursor-not-allowed transform-none shadow-none',
        className
      )}
      style={{
        willChange: 'transform, border-color',
        transform: 'translate3d(0, 0, 0)',
      }}
    >
      <canvas
        ref={canvasRef}
        className="absolute inset-0 w-full h-full pointer-events-none rounded-xl"
      />

      <div
        className={cn(
          'absolute inset-0 w-full h-full pointer-events-none bg-gradient-to-r from-transparent via-white/10 to-transparent transition-opacity duration-200 opacity-0',
          isHovered && 'opacity-100 animate-pulse'
        )}
      />

      {ripples.map((r) => (
        <span
          key={r.id}
          className="absolute bg-white/35 rounded-full animate-ping pointer-events-none"
          style={{
            left: r.x - 20,
            top: r.y - 20,
            width: 40,
            height: 40,
          }}
        />
      ))}

      <span className="relative z-10 flex items-center gap-2.5 font-semibold tracking-wide drop-shadow-sm w-full text-left">
        {loading ? (
          <>
            <Loader2 className="w-4 h-4 animate-spin text-neutral-200" />
            <span>{label}</span>
          </>
        ) : (
          <>
            {icon && <span className="text-base leading-none">{icon}</span>}
            <span className="truncate">{label}</span>
          </>
        )}
      </span>
    </button>
  );
}
