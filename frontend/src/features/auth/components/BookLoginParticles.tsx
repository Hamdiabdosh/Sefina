import { useEffect } from 'react';

const PARTICLE_LIFETIME_MS = 20_000;

const spawnParticle = () => {
  const particle = document.createElement('div');
  particle.className = 'book-login-particle';
  const size = Math.random() * 3 + 1;
  const duration = 8 + Math.random() * 12;
  const delay = Math.random() * 8;
  particle.style.cssText = `width:${size}px;height:${size}px;left:${Math.random() * 100}%;animation-duration:${duration}s;animation-delay:${delay}s;`;
  document.body.appendChild(particle);
  window.setTimeout(() => particle.remove(), PARTICLE_LIFETIME_MS);
};

/** Ambient gold particles on the login backdrop. */
export const BookLoginParticles = () => {
  useEffect(() => {
    for (let i = 0; i < 15; i += 1) {
      window.setTimeout(spawnParticle, i * 400);
    }

    const interval = window.setInterval(spawnParticle, 3000);
    return () => window.clearInterval(interval);
  }, []);

  return null;
};
