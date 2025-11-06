import { useEffect, useState } from 'react';

interface SplashScreenProps {
  onComplete: () => void;
}

const SplashScreen: React.FC<SplashScreenProps> = ({ onComplete }) => {
  const [isVisible, setIsVisible] = useState(true);
  const [fadeOut, setFadeOut] = useState(false);

  useEffect(() => {
    // Start fade out animation after 3 seconds
    const fadeTimer = setTimeout(() => {
      setFadeOut(true);
    }, 3000);

    // Complete and hide after fade animation
    const completeTimer = setTimeout(() => {
      setIsVisible(false);
      onComplete();
    }, 3500); // 3s + 500ms fade

    return () => {
      clearTimeout(fadeTimer);
      clearTimeout(completeTimer);
    };
  }, [onComplete]);

  if (!isVisible) return null;

  return (
    <div
      className={`fixed inset-0 z-50 flex items-center justify-center bg-gradient-to-br from-gray-900 via-gray-800 to-black transition-opacity duration-500 ${
        fadeOut ? 'opacity-0' : 'opacity-100'
      }`}
      style={{
        animation: fadeOut ? 'fadeOut 0.5s ease-out' : 'none'
      }}
    >
      <style>{`
        @keyframes fadeOut {
          from { opacity: 1; }
          to { opacity: 0; }
        }
        
        @keyframes scaleIn {
          from {
            transform: scale(0.5);
            opacity: 0;
          }
          to {
            transform: scale(1);
            opacity: 1;
          }
        }
        
        @keyframes float {
          0%, 100% {
            transform: translateY(0px);
          }
          50% {
            transform: translateY(-10px);
          }
        }
        
        @keyframes shimmer {
          0% {
            background-position: -1000px 0;
          }
          100% {
            background-position: 1000px 0;
          }
        }
        
        @keyframes pulse-glow {
          0%, 100% {
            opacity: 0.5;
            transform: scale(1);
          }
          50% {
            opacity: 0.8;
            transform: scale(1.1);
          }
        }
        
        .animate-scale-in {
          animation: scaleIn 0.6s ease-out;
        }
        
        .animate-float {
          animation: float 3s ease-in-out infinite;
        }
        
        .animate-shimmer {
          background: linear-gradient(
            90deg,
            rgba(255, 255, 255, 0) 0%,
            rgba(255, 255, 255, 0.2) 50%,
            rgba(255, 255, 255, 0) 100%
          );
          background-size: 1000px 100%;
          animation: shimmer 2s infinite;
        }
        
        .animate-pulse-glow {
          animation: pulse-glow 2s ease-in-out infinite;
        }
        
        .dot-bounce {
          animation: bounce 1.4s ease-in-out infinite;
        }
        
        .dot-bounce:nth-child(2) {
          animation-delay: 0.2s;
        }
        
        .dot-bounce:nth-child(3) {
          animation-delay: 0.4s;
        }
        
        @keyframes bounce {
          0%, 80%, 100% {
            transform: scale(0);
            opacity: 0.5;
          }
          40% {
            transform: scale(1);
            opacity: 1;
          }
        }
      `}</style>

      <div className="relative animate-scale-in">
        <div className="text-center space-y-6">
          {/* Logo with glow effect */}
          <div className="relative inline-block animate-float">
            <div className="absolute inset-0 bg-gradient-to-r from-blue-500 to-purple-600 blur-2xl animate-pulse-glow"></div>
            <div className="relative w-32 h-32 mx-auto bg-gradient-to-br from-gray-100 to-gray-300 rounded-2xl flex items-center justify-center shadow-2xl transform transition-transform hover:scale-110">
              <span className="text-5xl font-bold text-gray-900 tracking-tighter">
                LXVI
              </span>
            </div>
          </div>

          {/* Title with shimmer effect */}
          <div className="space-y-2">
            <div className="relative inline-block">
              <h1 className="text-6xl md:text-7xl font-bold bg-gradient-to-r from-gray-100 via-gray-300 to-gray-100 bg-clip-text text-transparent">
                Learnova X
              </h1>
              <div className="absolute inset-0 animate-shimmer"></div>
            </div>
            <p className="text-gray-400 text-lg tracking-wide animate-pulse">
              Be X and Updated
            </p>
          </div>

          {/* Loading dots */}
          <div className="flex justify-center space-x-2 pt-4">
            <div className="w-3 h-3 bg-blue-500 rounded-full dot-bounce"></div>
            <div className="w-3 h-3 bg-gray-500 rounded-full dot-bounce"></div>
            <div className="w-3 h-3 bg-blue-500 rounded-full dot-bounce"></div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SplashScreen;
