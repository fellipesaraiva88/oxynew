import { useEffect, useRef, useState } from "react";

interface Trail {
  x: number;
  y: number;
  opacity: number;
  scale: number;
}

export function CursorPet() {
  const petRef = useRef<HTMLDivElement>(null);
  const [trails, setTrails] = useState<Trail[]>([]);
  const [isHovering, setIsHovering] = useState(false);

  // Position state
  const positionRef = useRef({ x: window.innerWidth / 2, y: window.innerHeight / 2 });
  const targetRef = useRef({ x: window.innerWidth / 2, y: window.innerHeight / 2 });
  const velocityRef = useRef({ x: 0, y: 0 });
  const animationFrameRef = useRef<number>();
  const trailCounterRef = useRef(0);

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      targetRef.current = { x: e.clientX, y: e.clientY };

      // Check if hovering over clickable elements
      const target = e.target as HTMLElement;
      const isClickable =
        target.tagName === "BUTTON" ||
        target.tagName === "A" ||
        target.closest("button") !== null ||
        target.closest("a") !== null ||
        window.getComputedStyle(target).cursor === "pointer";

      setIsHovering(isClickable);
    };

    const animate = () => {
      // Calculate distance and velocity
      const dx = targetRef.current.x - positionRef.current.x;
      const dy = targetRef.current.y - positionRef.current.y;
      const distance = Math.sqrt(dx * dx + dy * dy);

      // Smooth easing with velocity-based damping
      const damping = 0.15;
      velocityRef.current.x += dx * damping;
      velocityRef.current.y += dy * damping;
      velocityRef.current.x *= 0.8; // friction
      velocityRef.current.y *= 0.8;

      // Update position
      positionRef.current.x += velocityRef.current.x;
      positionRef.current.y += velocityRef.current.y;

      // Calculate velocity magnitude for squeeze effect
      const speed = Math.sqrt(velocityRef.current.x ** 2 + velocityRef.current.y ** 2);

      // Elastic squeeze/stretch based on velocity
      const scaleX = 1 + Math.min(speed * 0.02, 0.3);
      const scaleY = 1 - Math.min(speed * 0.015, 0.2);

      // Update patient element with smooth CSS transform
      if (petRef.current) {
        petRef.current.style.transform = `
          translate(${positionRef.current.x}px, ${positionRef.current.y}px)
          scale(${scaleX}, ${scaleY})
        `;
      }

      // Create trail particles (only when moving fast)
      if (speed > 2 && trailCounterRef.current % 3 === 0) {
        setTrails((prev) => {
          const newTrails = [
            ...prev,
            {
              x: positionRef.current.x,
              y: positionRef.current.y,
              opacity: 0.6,
              scale: 0.8,
            },
          ].slice(-8); // Keep only last 8 trails

          return newTrails;
        });
      }
      trailCounterRef.current++;

      // Fade out trails
      setTrails((prev) =>
        prev
          .map((trail) => ({
            ...trail,
            opacity: trail.opacity * 0.92,
            scale: trail.scale * 0.95,
          }))
          .filter((trail) => trail.opacity > 0.05)
      );

      animationFrameRef.current = requestAnimationFrame(animate);
    };

    // Start animation loop
    animationFrameRef.current = requestAnimationFrame(animate);
    window.addEventListener("mousemove", handleMouseMove);

    return () => {
      window.removeEventListener("mousemove", handleMouseMove);
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
    };
  }, []);

  return (
    <>
      {/* Trail particles */}
      {trails.map((trail, index) => (
        <div
          key={index}
          className="fixed pointer-events-none -translate-x-1/2 -translate-y-1/2 z-[9998]"
          style={{
            left: `${trail.x}px`,
            top: `${trail.y}px`,
            opacity: trail.opacity,
            transform: `translate(-50%, -50%) scale(${trail.scale})`,
            width: "20px",
            height: "20px",
          }}
        >
          <svg viewBox="0 0 100 100" className="w-full h-full">
            <ellipse
              cx="50"
              cy="60"
              rx="18"
              ry="22"
              fill="currentColor"
              className="text-primary/40"
            />
            <ellipse cx="30" cy="35" rx="10" ry="13" fill="currentColor" className="text-primary/40" />
            <ellipse cx="50" cy="28" rx="10" ry="13" fill="currentColor" className="text-primary/40" />
            <ellipse cx="70" cy="35" rx="10" ry="13" fill="currentColor" className="text-primary/40" />
          </svg>
        </div>
      ))}

      {/* Main cursor patient */}
      <div
        ref={petRef}
        className={`fixed pointer-events-none -translate-x-1/2 -translate-y-1/2 z-[9999] transition-all duration-200 ${
          isHovering ? "scale-125" : ""
        }`}
        style={{
          width: "28px",
          height: "28px",
          willChange: "transform",
        }}
      >
        <div className={`w-full h-full opacity-70 ${isHovering ? "opacity-90" : ""}`}>
          <svg viewBox="0 0 100 100" className="w-full h-full filter drop-shadow-md">
            {/* Main pad */}
            <ellipse
              cx="50"
              cy="60"
              rx="18"
              ry="22"
              fill="currentColor"
              className={`transition-colors duration-300 ${
                isHovering ? "text-primary" : "text-primary"
              }`}
            />

            {/* Toe pads */}
            <ellipse
              cx="30"
              cy="35"
              rx="10"
              ry="13"
              fill="currentColor"
              className={`transition-colors duration-300 ${
                isHovering ? "text-primary" : "text-primary"
              }`}
            />
            <ellipse
              cx="50"
              cy="28"
              rx="10"
              ry="13"
              fill="currentColor"
              className={`transition-colors duration-300 ${
                isHovering ? "text-primary" : "text-primary"
              }`}
            />
            <ellipse
              cx="70"
              cy="35"
              rx="10"
              ry="13"
              fill="currentColor"
              className={`transition-colors duration-300 ${
                isHovering ? "text-primary" : "text-primary"
              }`}
            />

            {/* Extra toe pad */}
            <ellipse
              cx="60"
              cy="50"
              rx="9"
              ry="11"
              fill="currentColor"
              className={`transition-colors duration-300 ${
                isHovering ? "text-primary" : "text-primary"
              }`}
            />

            {/* Heart when hovering */}
            {isHovering && (
              <g transform="translate(50, 15)" className="animate-pulse">
                <path
                  d="M0,-3 C-2,-5 -4,-3 -4,-1 C-4,1 0,4 0,4 C0,4 4,1 4,-1 C4,-3 2,-5 0,-3 Z"
                  fill="#ef4444"
                  opacity="0.9"
                />
              </g>
            )}
          </svg>
        </div>
      </div>
    </>
  );
}
