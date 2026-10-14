import React, { useEffect, useRef, useState } from 'react';

type RevealProps = {
  children: React.ReactNode;
  /** Retraso en ms (para escalonar varios elementos). */
  delay?: number;
  as?: keyof React.JSX.IntrinsicElements;
  className?: string;
};

/**
 * Aparece con un fade + desplazamiento al entrar en pantalla (una sola vez).
 * Los estilos viven en index.html (.reveal / .is-visible) y respetan
 * prefers-reduced-motion.
 */
const Reveal: React.FC<RevealProps> = ({ children, delay = 0, as = 'div', className = '' }) => {
  const ref = useRef<HTMLElement | null>(null);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const node = ref.current;
    if (!node) return;
    if (typeof IntersectionObserver === 'undefined') {
      setVisible(true);
      return;
    }
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setVisible(true);
          observer.disconnect();
        }
      },
      { rootMargin: '0px 0px -10% 0px', threshold: 0.1 },
    );
    observer.observe(node);
    return () => observer.disconnect();
  }, []);

  const Tag = as as any;
  return (
    <Tag
      ref={ref}
      className={`reveal ${visible ? 'is-visible' : ''} ${className}`}
      style={{ '--reveal-delay': `${delay}ms` } as React.CSSProperties}
    >
      {children}
    </Tag>
  );
};

export default Reveal;
