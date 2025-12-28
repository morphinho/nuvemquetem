import { useState, useEffect } from 'react';
import { Volume2 } from 'lucide-react';
import { audioManager } from '../utils/audioContext';

interface AudioUnlockOverlayProps {
  show: boolean;
  onUnlock?: () => void;
}

export default function AudioUnlockOverlay({ show, onUnlock }: AudioUnlockOverlayProps) {
  const [isVisible, setIsVisible] = useState(show);

  useEffect(() => {
    if (show) {
      setIsVisible(true);
    }
  }, [show]);

  const handleUnlock = () => {
    audioManager.onUnlock(() => {
      setIsVisible(false);
      onUnlock?.();
    });

    const tempAudio = new Audio();
    tempAudio.volume = 0;
    tempAudio.play().catch(() => {});
  };

  if (!isVisible) return null;

  return (
    <div
      className="fixed inset-0 bg-black/30 backdrop-blur-sm flex items-center justify-center z-50 animate-fade-in"
      onClick={handleUnlock}
    >
      <div className="bg-white rounded-2xl shadow-2xl p-8 max-w-sm mx-4 text-center animate-scale-in">
        <div className="w-16 h-16 bg-purple-100 rounded-full flex items-center justify-center mx-auto mb-4">
          <Volume2 className="w-8 h-8 text-purple-600" />
        </div>
        <h3 className="text-xl font-bold text-gray-900 mb-2">
          Áudio Disponível
        </h3>
        <p className="text-gray-600 text-sm mb-6">
          Toque em qualquer lugar para ativar o áudio e continuar
        </p>
        <div className="w-12 h-12 border-4 border-purple-600 border-t-transparent rounded-full animate-spin mx-auto"></div>
      </div>

      <style>{`
        @keyframes fade-in {
          from { opacity: 0; }
          to { opacity: 1; }
        }
        .animate-fade-in {
          animation: fade-in 0.3s ease-out;
        }

        @keyframes scale-in {
          from {
            opacity: 0;
            transform: scale(0.9);
          }
          to {
            opacity: 1;
            transform: scale(1);
          }
        }
        .animate-scale-in {
          animation: scale-in 0.3s ease-out;
        }
      `}</style>
    </div>
  );
}
