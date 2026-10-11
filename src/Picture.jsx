import React from 'react';
import { CATEGORIES } from './game.js';

const photoUrl = (file) => `${import.meta.env.BASE_URL}photos/${file}`;

// Simple drawn shapes, so the shapes round shows clean outlines instead of emoji.
const SHAPES = {
  star: <path d="M50 6l12.9 28.2 30.8 3.4-23 20.8 6.4 30.3L50 73.3 22.9 88.7l6.4-30.3-23-20.8 30.8-3.4z" />,
  heart: <path d="M50 88S8 62 8 34a21 21 0 0 1 42-6 21 21 0 0 1 42 6c0 28-42 54-42 54z" />,
  moon: <path d="M64 8a42 42 0 1 0 28 66A36 36 0 0 1 64 8z" />,
  sun: (
    <g>
      <circle cx="50" cy="50" r="22" />
      {Array.from({ length: 8 }).map((_, i) => (
        <rect key={i} x="46" y="4" width="8" height="18" rx="4" transform={`rotate(${i * 45} 50 50)`} />
      ))}
    </g>
  ),
  triangle: <path d="M50 10l42 76H8z" strokeLinejoin="round" />,
};

// What goes inside a choice tile: a photo, a drawn shape, or (for colors) nothing,
// because the tile itself is painted in that color.
export function Picture({ item }) {
  if (item.photo) {
    return <img className="choice-photo" src={photoUrl(item.photo.file)} alt="" draggable="false" />;
  }
  if (SHAPES[item.id]) {
    return (
      <svg className="choice-shape" viewBox="0 0 100 100" aria-hidden="true">
        {SHAPES[item.id]}
      </svg>
    );
  }
  if (item.kind === 'color') return null;
  return <span className="choice-emoji">{item.emoji}</span>;
}

// Warm the browser cache so photos appear instantly when their round comes up.
export function preloadPhotos() {
  Object.values(CATEGORIES)
    .flat()
    .forEach((item) => {
      if (item.photo) new Image().src = photoUrl(item.photo.file);
    });
}

export function Credits({ onClose }) {
  const items = Object.values(CATEGORIES)
    .flat()
    .filter((item) => item.photo);
  return (
    <div className="credits" role="dialog" aria-label="Photo credits">
      <div className="credits-panel">
        <h2>Photo credits</h2>
        <p>Photos from Wikimedia Commons, used under their free licenses.</p>
        <ul>
          {items.map(({ id, label, photo }) => (
            <li key={id}>
              <strong>{label}</strong>: {photo.artist} ·{' '}
              <a href={photo.source} target="_blank" rel="noreferrer">
                {photo.license}
              </a>
            </li>
          ))}
        </ul>
        <button type="button" className="start-button" onClick={onClose}>
          Close
        </button>
      </div>
    </div>
  );
}
