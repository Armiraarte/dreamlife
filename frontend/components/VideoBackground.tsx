import React, { useEffect, useState } from 'react';

type VideoBackgroundProps = {
  src: string;
  poster?: string;
  /** Capa extra para oscurecer la zona donde va el texto. */
  textShade?: string;
};

/**
 * Video ambiental de fondo: fijo, en blanco y negro y ligeramente difuminado.
 * Va detras del contenido (z negativo), asi que no tapa menus ni ventanas.
 * Si el archivo no existe, no se muestra nada.
 */
const VideoBackground: React.FC<VideoBackgroundProps> = ({ src, poster, textShade }) => {
  const [visible, setVisible] = useState(true);
  const [reduceMotion, setReduceMotion] = useState(false);

  useEffect(() => {
    setReduceMotion(window.matchMedia?.('(prefers-reduced-motion: reduce)').matches ?? false);
  }, []);

  if (!visible) return null;

  return (
    <div className="fixed inset-0 -z-10 pointer-events-none overflow-hidden animate-fade-in" aria-hidden="true">
      <video
        className="absolute inset-0 w-full h-full object-cover grayscale scale-105 blur-[1.5px] opacity-60"
        src={src}
        poster={poster}
        autoPlay={!reduceMotion}
        muted
        loop
        playsInline
        preload="auto"
        onError={() => setVisible(false)}
      />
      {/* Oscurece bordes y parte baja para que el texto se lea */}
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,rgba(0,0,0,0.1)_0%,rgba(0,0,0,0.75)_85%)]" />
      <div className="absolute inset-x-0 bottom-0 h-1/3 bg-gradient-to-t from-black to-transparent" />
      {textShade && <div className={`absolute inset-0 ${textShade}`} />}
    </div>
  );
};

export default VideoBackground;
