import React from 'react';

/**
 * State Emblem of India — Sarnath Lion Capital of Ashoka with Ashoka Chakra
 * Official statutory representation for Government of India procurement portals
 */
export default function NationalEmblem({ className = 'h-10 w-auto', title = 'State Emblem of India' }) {
  return (
    <svg
      className={className}
      viewBox="0 0 100 130"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      role="img"
      aria-label={title}
    >
      <title>{title}</title>

      {/* Lion Capital: 3 Lions */}
      {/* Central Lion Head & Mane */}
      <path
        d="M50 8C43 8 39 13 39 19C39 24 41 27 43 30C41 33 39 37 39 42C39 48 43 53 47 56L47 68C48 69 49 70 50 70C51 70 52 69 53 68L53 56C57 53 61 48 61 42C61 37 59 33 57 30C59 27 61 24 61 19C61 13 57 8 50 8Z"
        fill="#92400E"
      />
      {/* Central Lion Facial Detail & Snout */}
      <path
        d="M50 14C46.5 14 44.5 17 44.5 21C44.5 25 47 28 50 28C53 28 55.5 25 55.5 21C55.5 17 53.5 14 50 14Z"
        fill="#D97706"
      />
      <circle cx="47" cy="20" r="1.5" fill="#78350F" />
      <circle cx="53" cy="20" r="1.5" fill="#78350F" />
      <path d="M48.5 24H51.5L50 26L48.5 24Z" fill="#78350F" />
      <path d="M47 28C48 29.5 52 29.5 53 28" stroke="#78350F" strokeWidth="1.2" strokeLinecap="round" />

      {/* Mane Strands Central Lion */}
      <path d="M43 34C45 37 47 39 50 39C53 39 55 37 57 34" stroke="#B45309" strokeWidth="1.5" strokeLinecap="round" />
      <path d="M41 42C44 46 47 48 50 48C53 48 56 46 59 42" stroke="#B45309" strokeWidth="1.5" strokeLinecap="round" />
      <path d="M44 50C46 54 48 56 50 56C52 56 54 54 56 50" stroke="#B45309" strokeWidth="1.5" strokeLinecap="round" />

      {/* Left Lion Profile */}
      <path
        d="M39 22C34 20 28 23 27 28C26 33 28 37 32 39C29 42 27 47 28 52C29 57 33 61 38 63L40 68L44 67L42 58C37 56 34 51 34 46C34 42 36 38 39 36V22Z"
        fill="#B45309"
      />
      <path
        d="M28 27C25 28 24 31 25 34C26 36 29 36 31 35C31 32 30 29 28 27Z"
        fill="#D97706"
      />
      <circle cx="28" cy="31" r="1" fill="#78350F" />

      {/* Right Lion Profile */}
      <path
        d="M61 22C66 20 72 23 73 28C74 33 72 37 68 39C71 42 73 47 72 52C71 57 67 61 62 63L60 68L56 67L58 58C63 56 66 51 66 46C66 42 64 38 61 36V22Z"
        fill="#B45309"
      />
      <path
        d="M72 27C75 28 76 31 75 34C74 36 71 36 69 35C69 32 70 29 72 27Z"
        fill="#D97706"
      />
      <circle cx="72" cy="31" r="1" fill="#78350F" />

      {/* Abacus (Horizontal Platform) */}
      <rect x="20" y="70" width="60" height="5" rx="1.5" fill="#78350F" />
      <rect x="22" y="75" width="56" height="22" rx="2" fill="#F8FAFC" stroke="#92400E" strokeWidth="1.5" />

      {/* Left Animal on Abacus: Galloping Horse */}
      <path
        d="M26 84C27 82 29 81 31 82C32 83 31 85 30 86C32 87 34 86 35 84C35 87 34 89 31 89L30 92L28 92L29 88C27 88 25 86 26 84Z"
        fill="#92400E"
      />

      {/* Center: Ashoka Chakra (Dharma Chakra with 24 Spokes) */}
      <g transform="translate(50, 86)">
        <circle cx="0" cy="0" r="9" fill="#EEF2FF" stroke="#000080" strokeWidth="1.8" />
        <circle cx="0" cy="0" r="2" fill="#000080" />
        {/* Spokes */}
        {[0, 15, 30, 45, 60, 75, 90, 105, 120, 135, 150, 165, 180, 195, 210, 225, 240, 255, 270, 285, 300, 315, 330, 345].map((angle, idx) => (
          <line
            key={idx}
            x1="0"
            y1="0"
            x2={8 * Math.sin((angle * Math.PI) / 180)}
            y2={-8 * Math.cos((angle * Math.PI) / 180)}
            stroke="#000080"
            strokeWidth="0.85"
          />
        ))}
      </g>

      {/* Right Animal on Abacus: Charging Bull */}
      <path
        d="M74 84C73 82 71 81 69 82C68 83 69 85 70 86C68 87 66 86 65 84C65 87 66 89 69 89L70 92L72 92L71 88C73 88 75 86 74 84Z"
        fill="#92400E"
      />

      {/* Lower Abacus Base Step */}
      <rect x="18" y="97" width="64" height="4" rx="1" fill="#78350F" />

      {/* Lotus Inverted Pedestal */}
      <path
        d="M24 101C30 110 38 114 50 114C62 114 70 110 76 101H24Z"
        fill="#92400E"
      />
      <path
        d="M28 101C33 108 40 111 50 111C60 111 67 108 72 101H28Z"
        fill="#D97706"
      />
      {/* Petal ribs */}
      <path d="M50 101V111M43 101C44 106 46 109 47 110M57 101C56 106 54 109 53 110M36 101C38 105 40 107 42 108M64 101C62 105 60 107 58 108" stroke="#78350F" strokeWidth="1" />

      {/* Base Plinth */}
      <rect x="22" y="115" width="56" height="3" rx="0.5" fill="#78350F" />

      {/* Motto "सत्यमेव जयते" (Satyameva Jayate) */}
      <text
        x="50"
        y="126"
        textAnchor="middle"
        fontSize="7.5"
        fontWeight="bold"
        fill="#78350F"
        fontFamily="sans-serif"
        letterSpacing="0.5"
      >
        सत्यमेव जयते
      </text>
    </svg>
  );
}
