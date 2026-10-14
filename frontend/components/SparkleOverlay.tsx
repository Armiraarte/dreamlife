import React, { useEffect, useRef } from 'react';

const SparkleOverlay: React.FC = () => {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let particles: Particle[] = [];
    let animationFrameId: number;

    const resizeCanvas = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
      initParticles();
    };

    class Particle {
      x: number;
      y: number;
      size: number;
      opacity: number;
      speed: number;
      baseOpacity: number;
      direction: number;

      constructor() {
        this.x = Math.random() * canvas!.width;
        this.y = Math.random() * canvas!.height;
        // Size variation for natural "dust" look
        this.size = Math.random() * 1.5; 
        // Lower opacity for a subtle, professional look ("no tan saturada")
        this.baseOpacity = Math.random() * 0.3 + 0.02; 
        this.opacity = this.baseOpacity;
        this.speed = Math.random() * 0.01 + 0.002; // Slower movement
        this.direction = Math.random() > 0.5 ? 1 : -1;
      }

      update() {
        // Subtle pulse
        this.opacity += this.speed * this.direction;

        if (this.opacity >= this.baseOpacity + 0.2 || this.opacity <= 0.01) {
          this.direction *= -1;
        }

        // Very slow drift upwards to simulate floating particles
        this.y -= 0.15;
        if (this.y < 0) {
          this.y = canvas!.height;
          this.x = Math.random() * canvas!.width;
        }
      }

      draw() {
        if (!ctx) return;
        ctx.fillStyle = `rgba(255, 255, 255, ${this.opacity})`;
        ctx.beginPath();
        ctx.arc(this.x, this.y, this.size, 0, Math.PI * 2);
        ctx.fill();
      }
    }

    const initParticles = () => {
      particles = [];
      // Optimization: Significantly reduced density for performance ("alijera")
      // 30 particles on mobile, 80 on desktop. Enough for the effect, light on CPU.
      const density = window.innerWidth < 768 ? 30 : 80; 
      
      for (let i = 0; i < density; i++) {
        particles.push(new Particle());
      }
    };

    const animate = () => {
      if (!ctx) return;
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      
      particles.forEach(particle => {
        particle.update();
        particle.draw();
      });

      animationFrameId = requestAnimationFrame(animate);
    };

    window.addEventListener('resize', resizeCanvas);
    resizeCanvas();
    animate();

    return () => {
      window.removeEventListener('resize', resizeCanvas);
      cancelAnimationFrame(animationFrameId);
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      // Z-index 30 ensures it sits ON TOP of content (images/backgrounds) but BELOW Navbar (z-50) and Modals.
      // mix-blend-screen ensures it looks great on dark backgrounds and doesn't obscure white text.
      className="fixed inset-0 z-30 pointer-events-none mix-blend-screen"
      style={{ width: '100%', height: '100%' }}
    />
  );
};

export default SparkleOverlay;