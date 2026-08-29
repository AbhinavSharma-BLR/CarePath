'use client';

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { 
  Activity, 
  Stethoscope, 
  Pill, 
  Syringe, 
  Heart, 
  Cross,
  ArrowLeft,
  Home
} from "lucide-react";

// Combined component for 404 page
export default function NotFoundPage() {
  return (
    <div className="w-full h-screen bg-[#111111] overflow-x-hidden flex justify-center items-center relative">
      <MessageDisplay />
      <IconsAnimation />
      <CircleAnimation />
    </div>
  );
}

// 1. Message Display Component
function MessageDisplay() {
  const router = useRouter();
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => {
      setIsVisible(true);
    }, 1200);

    return () => clearTimeout(timer);
  }, []);

  return (
    <div className="absolute flex flex-col justify-center items-center w-[90%] h-[90%] z-[100]">
      <div 
        className={`flex flex-col items-center transition-opacity duration-500 ${
          isVisible ? 'opacity-100' : 'opacity-0'
        }`}
      >
        <div className="w-16 h-16 rounded-2xl bg-[#EF3030] flex items-center justify-center text-white mb-6 shadow-lg shadow-red-500/20">
          <Activity className="w-8 h-8" />
        </div>
        <div className="text-[35px] font-semibold text-white m-[1%] text-center">
          Page Not Found
        </div>
        <div className="text-[100px] font-extrabold text-[#EF3030] m-[1%] leading-none drop-shadow-lg text-center">
          404
        </div>
        <div className="text-[16px] w-1/2 min-w-[300px] max-w-[500px] text-center text-[#AAAAAA] m-[1%]">
          The page you are looking for might have been removed, had its name changed, or is temporarily unavailable in the CarePath system.
        </div>
        <div className="flex gap-4 mt-8 flex-wrap justify-center">
          <button
            onClick={() => router.back()}
            className="text-white border-2 border-[#333333] hover:border-[#EF3030] hover:bg-[#EF3030]/10 transition-all duration-300 ease-in-out px-6 py-2.5 rounded-xl text-sm font-bold flex items-center gap-2 hover:-translate-y-1"
          >
            <ArrowLeft className="w-4 h-4 transition-transform group-hover:-translate-x-1" />
            Go Back
          </button>
          <button
            onClick={() => router.push("/")}
            className="bg-[#EF3030] text-white hover:bg-[#D92727] transition-all duration-300 ease-in-out px-6 py-2.5 rounded-xl text-sm font-bold flex items-center gap-2 hover:-translate-y-1 shadow-lg shadow-red-500/20"
          >
            <Home className="w-4 h-4 transition-transform group-hover:scale-110" />
            Go Home
          </button>
        </div>
      </div>
    </div>
  );
}

// 2. Icons Animation Component
type IconFigure = {
  top?: string;
  bottom?: string;
  Icon: React.ElementType;
  transform?: string;
  speedX: number;
  speedRotation?: number;
  color: string;
};

function IconsAnimation() {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    // Define icons with their properties for hospital theme
    const iconFigures: IconFigure[] = [
      {
        top: '10%',
        Icon: Stethoscope,
        transform: 'rotateZ(-90deg)',
        speedX: 15000,
        color: '#333333',
      },
      {
        top: '25%',
        Icon: Pill,
        speedX: 20000,
        speedRotation: 4000,
        color: '#EF3030',
      },
      {
        top: '40%',
        Icon: Syringe,
        speedX: 25000,
        speedRotation: 3000,
        color: '#444444',
      },
      {
        top: '60%',
        Icon: Heart,
        speedX: 18000,
        speedRotation: 5000,
        color: '#EF3030',
      },
      {
        top: '75%',
        Icon: Cross,
        speedX: 22000,
        speedRotation: 3500,
        color: '#333333',
      },
      {
        bottom: '10%',
        Icon: Activity,
        speedX: 16000, // Horizontal movement
        color: '#EF3030',
      },
    ];

    const container = containerRef.current;
    if (!container) return;
    
    container.innerHTML = '';

    iconFigures.forEach((figure, index) => {
      const iconWrapper = document.createElement('div');
      iconWrapper.style.position = 'absolute';
      iconWrapper.style.width = '48px';
      iconWrapper.style.height = '48px';
      iconWrapper.style.color = figure.color;
      iconWrapper.style.opacity = '0.3';
      iconWrapper.style.display = 'flex';
      iconWrapper.style.justifyContent = 'center';
      iconWrapper.style.alignItems = 'center';

      if (figure.top) iconWrapper.style.top = figure.top;
      if (figure.bottom) iconWrapper.style.bottom = figure.bottom;
      
      iconWrapper.innerHTML = `
        <svg xmlns="http://www.w3.org/2000/svg" width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round">
          ${getSvgPathsForIcon((figure.Icon as any).displayName || (figure.Icon as any).name)}
        </svg>
      `;
      
      if (figure.transform) iconWrapper.style.transform = figure.transform;

      container.appendChild(iconWrapper);

      if (figure.speedX > 0) {
        iconWrapper.animate(
          [{ left: '110%' }, { left: '-10%' }],
          { duration: figure.speedX, easing: 'linear', iterations: Infinity }
        );
      }

      if (figure.speedRotation) {
        iconWrapper.animate(
          [{ transform: 'rotate(0deg)' }, { transform: 'rotate(-360deg)' }],
          { duration: figure.speedRotation, iterations: Infinity, easing: 'linear' }
        );
      }
    });

    return () => {
      if (container) {
        container.innerHTML = '';
      }
    };
  }, []);

  return (
    <div
      ref={containerRef}
      className="absolute w-[99%] h-[95%] pointer-events-none overflow-hidden"
    />
  );
}

// Helper to map Lucide component names to raw SVG paths for the imperative DOM
function getSvgPathsForIcon(name: string) {
  switch (name) {
    case 'Stethoscope': return '<path d="M4.8 2.3A.3.3 0 1 0 5 2H4a2 2 0 0 0-2 2v5a6 6 0 0 0 6 6v0a6 6 0 0 0 6-6V4a2 2 0 0 0-2-2h-1a.2.2 0 1 0 .3.3"/><path d="M8 15v1a6 6 0 0 0 6 6v0a6 6 0 0 0 6-6v-4"/><circle cx="20" cy="10" r="2"/>';
    case 'Pill': return '<path d="m10.5 20.5 10-10a4.95 4.95 0 1 0-7-7l-10 10a4.95 4.95 0 1 0 7 7Z"/><path d="m8.5 8.5 7 7"/>';
    case 'Syringe': return '<path d="m18 2 4 4"/><path d="m17 7 3-3"/><path d="M19 9 8.7 19.3c-1 1-2.5 1-3.4 0l-.6-.6c-1-1-1-2.5 0-3.4L15 5"/><path d="m9 11 4 4"/><path d="m5 19-3 3"/><path d="m14 4 6 6"/>';
    case 'Heart': return '<path d="M19 14c1.49-1.46 3-3.21 3-5.5A5.5 5.5 0 0 0 16.5 3c-1.76 0-3 .5-4.5 2-1.5-1.5-2.74-2-4.5-2A5.5 5.5 0 0 0 2 8.5c0 2.3 1.5 4.05 3 5.5l7 7Z"/>';
    case 'Cross': return '<path d="M11 2a2 2 0 0 0-2 2v5H4a2 2 0 0 0-2 2v2c0 1.1.9 2 2 2h5v5c0 1.1.9 2 2 2h2a2 2 0 0 0 2-2v-5h5a2 2 0 0 0 2-2v-2a2 2 0 0 0-2-2h-5V4a2 2 0 0 0-2-2z"/>';
    case 'Activity': return '<path d="M22 12h-2.48a2 2 0 0 0-1.93 1.46l-2.35 8.36a.25.25 0 0 1-.48 0L9.24 2.18a.25.25 0 0 0-.48 0l-2.35 8.36A2 2 0 0 1 4.49 12H2"/>';
    default: return '<circle cx="12" cy="12" r="10"/>';
  }
}

// 3. Circle Animation Component
interface Circulo {
  x: number;
  y: number;
  size: number;
}

function CircleAnimation() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const requestIdRef = useRef<number>();
  const timerRef = useRef(0);
  const circulosRef = useRef<Circulo[]>([]);

  const initArr = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    
    circulosRef.current = [];
    
    for (let index = 0; index < 150; index++) {
      const randomX = Math.floor(
        Math.random() * ((canvas.width * 3) - (canvas.width * 1.2) + 1)
      ) + (canvas.width * 1.2);
      
      const randomY = Math.floor(
        Math.random() * ((canvas.height) - (canvas.height * (-0.2) + 1))
      ) + (canvas.height * (-0.2));
      
      const size = canvas.width / 1500;
      
      circulosRef.current.push({ x: randomX, y: randomY, size });
    }
  };

  const draw = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    
    const context = canvas.getContext('2d');
    if (!context) return;
    
    timerRef.current++;
    context.setTransform(1, 0, 0, 1, 0, 0);
    
    const distanceX = canvas.width / 120;
    const growthRate = canvas.width / 1500;
    
    // Blood Red / Hospital red color for circles
    context.fillStyle = 'rgba(239, 48, 48, 0.4)';
    context.clearRect(0, 0, canvas.width, canvas.height);
    
    circulosRef.current.forEach((circulo) => {
      context.beginPath();
      
      if (timerRef.current < 65) {
        circulo.x = circulo.x - distanceX;
        circulo.size = circulo.size + growthRate;
      }
      
      if (timerRef.current > 65 && timerRef.current < 500) {
        circulo.x = circulo.x - (distanceX * 0.02);
        circulo.size = circulo.size + (growthRate * 0.2);
      }
      
      context.arc(circulo.x, circulo.y, circulo.size, 0, 360);
      context.fill();
    });
    
    if (timerRef.current > 500) {
      if (requestIdRef.current) {
        cancelAnimationFrame(requestIdRef.current);
      }
      return;
    }
    
    requestIdRef.current = requestAnimationFrame(draw);
  };

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
    
    timerRef.current = 0;
    initArr();
    draw();
    
    const handleResize = () => {
      if (!canvas) return;
      
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
      
      timerRef.current = 0;
      if (requestIdRef.current) {
        cancelAnimationFrame(requestIdRef.current);
      }
      
      const context = canvas.getContext('2d');
      if (context) {
        context.reset();
      }
      
      initArr();
      draw();
    };
    
    window.addEventListener('resize', handleResize);
    
    return () => {
      window.removeEventListener('resize', handleResize);
      if (requestIdRef.current) {
        cancelAnimationFrame(requestIdRef.current);
      }
    };
  }, []);

  return <canvas ref={canvasRef} className="w-full h-full opacity-50" />;
}
