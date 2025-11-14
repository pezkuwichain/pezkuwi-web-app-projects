import React from 'react';

interface KurdistanSunProps {
  size?: number;
  className?: string;
}

export const KurdistanSun: React.FC<KurdistanSunProps> = ({ size = 200, className = '' }) => {
  return (
    <div className={`kurdistan-sun-container ${className}`} style={{ width: size, height: size }}>
      {/* Rotating colored halos */}
      <div className="sun-halos">
        {/* Green halo (outermost) */}
        <div className="halo halo-green" />
        {/* Red halo (middle) */}
        <div className="halo halo-red" />
        {/* Yellow halo (inner) */}
        <div className="halo halo-yellow" />
      </div>

      {/* Kurdistan Sun with 21 rays */}
      <svg
        viewBox="0 0 200 200"
        className="kurdistan-sun-svg"
        style={{ width: '100%', height: '100%' }}
      >
        {/* Sun rays (21 rays for Kurdistan flag) */}
        <g className="sun-rays">
          {Array.from({ length: 21 }).map((_, i) => {
            const angle = (i * 360) / 21;
            return (
              <line
                key={i}
                x1="100"
                y1="100"
                x2="100"
                y2="20"
                stroke="rgba(255, 255, 255, 0.9)"
                strokeWidth="3"
                strokeLinecap="round"
                transform={`rotate(${angle} 100 100)`}
                className="ray"
                style={{
                  animationDelay: `${i * 0.05}s`,
                }}
              />
            );
          })}
        </g>

        {/* Central white circle */}
        <circle
          cx="100"
          cy="100"
          r="35"
          fill="white"
          className="sun-center"
        />

        {/* Inner glow */}
        <circle
          cx="100"
          cy="100"
          r="35"
          fill="url(#sunGradient)"
          className="sun-glow"
        />

        <defs>
          <radialGradient id="sunGradient">
            <stop offset="0%" stopColor="rgba(255, 255, 255, 0.8)" />
            <stop offset="100%" stopColor="rgba(255, 255, 255, 0.2)" />
          </radialGradient>
        </defs>
      </svg>

      <style>{`
        .kurdistan-sun-container {
          position: relative;
          display: flex;
          align-items: center;
          justify-content: center;
        }

        .sun-halos {
          position: absolute;
          width: 100%;
          height: 100%;
          display: flex;
          align-items: center;
          justify-content: center;
        }

        .halo {
          position: absolute;
          border-radius: 50%;
          animation: rotate-halo 3s linear infinite;
        }

        .halo-green {
          width: 100%;
          height: 100%;
          border: 4px solid transparent;
          border-top-color: #00FF00;
          border-bottom-color: #00FF00;
          animation-duration: 3s;
        }

        .halo-red {
          width: 80%;
          height: 80%;
          border: 4px solid transparent;
          border-left-color: #FF0000;
          border-right-color: #FF0000;
          animation-duration: 2.5s;
          animation-direction: reverse;
        }

        .halo-yellow {
          width: 60%;
          height: 60%;
          border: 4px solid transparent;
          border-top-color: #FFD700;
          border-bottom-color: #FFD700;
          animation-duration: 2s;
        }

        @keyframes rotate-halo {
          from {
            transform: rotate(0deg);
          }
          to {
            transform: rotate(360deg);
          }
        }

        .kurdistan-sun-svg {
          position: relative;
          z-index: 1;
          filter: drop-shadow(0 0 20px rgba(255, 255, 255, 0.6));
        }

        .sun-rays {
          animation: pulse-rays 2s ease-in-out infinite;
        }

        @keyframes pulse-rays {
          0%, 100% {
            opacity: 1;
          }
          50% {
            opacity: 0.7;
          }
        }

        .ray {
          animation: ray-shine 2s ease-in-out infinite;
        }

        @keyframes ray-shine {
          0%, 100% {
            opacity: 0.9;
          }
          50% {
            opacity: 0.5;
          }
        }

        .sun-center {
          filter: drop-shadow(0 0 10px rgba(255, 255, 255, 0.8));
        }

        .sun-glow {
          animation: pulse-glow 2s ease-in-out infinite;
        }

        @keyframes pulse-glow {
          0%, 100% {
            opacity: 0.6;
          }
          50% {
            opacity: 0.3;
          }
        }
      `}</style>
    </div>
  );
};
