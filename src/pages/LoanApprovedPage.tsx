import { useEffect, useState, useRef } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { saveFunnelData, getFunnelData } from '../utils/funnelStorage';
import { CheckCircle, Zap, Shield, TrendingUp, DollarSign, Calendar, User, Play, Pause } from 'lucide-react';
import Header from '../components/Header';
import Footer from '../components/Footer';
import UserMenu from '../components/UserMenu';
import { useAutoplayAudio } from '../hooks/useAutoplayAudio';

export default function LoanApprovedPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const funnelData = getFunnelData();
  const { indemnityAmount, profileAnswers, loanPriority, nubankCustomer, creditStatus } = location.state || {};
  const userData = funnelData.userData;
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const firstName = userData?.nome ? userData.nome.split(' ')[0] : 'Usuário';
  const [buttonEnabled, setButtonEnabled] = useState(false);
  const [countdown, setCountdown] = useState(18);
  const buttonRef = useRef<HTMLButtonElement>(null);
  const loanAmount = 12600.00;

  const {
    isPlaying,
    currentTime,
    duration,
    togglePlayPause,
    formatTime,
  } = useAutoplayAudio({
    src: 'https://audio.jukehost.co.uk/ax8njInUTmM4MA7cm1l8DjwH3q7s5CGJ',
    volume: 0.3,
    autoplayDelay: 2000,
    enabled: !!userData,
  });

  useEffect(() => {
    if (!userData) {
      navigate('/');
      return;
    }

    saveFunnelData({
      userData: userData,
      currentStep: '/loan-approved'
    });

    const countdownInterval = setInterval(() => {
      setCountdown((prev) => {
        if (prev <= 1) {
          clearInterval(countdownInterval);
          setButtonEnabled(true);
          setTimeout(() => {
            buttonRef.current?.scrollIntoView({ behavior: 'smooth', block: 'center' });
          }, 100);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => {
      clearInterval(countdownInterval);
    };
  }, [navigate, userData]);

  if (!userData) {
    return null;
  }

  const handleContinue = () => {
    navigate('/selecionar-parcelas', {
      state: {
        userData,
        loanAmount,
        profileAnswers,
        loanPriority,
        nubankCustomer,
        creditStatus
      }
    });
  };

  return (
    <div className="min-h-screen bg-white flex flex-col">
      <Header showUserIcon={true} onMenuClick={() => setIsMenuOpen(true)} />
      <UserMenu
        isOpen={isMenuOpen}
        onClose={() => setIsMenuOpen(false)}
        userName={firstName}
      />

      <div className="bg-purple-600 px-4 py-3 text-center">
        <h2 className="text-white text-sm font-medium">Proposta Aprovada</h2>
      </div>

      <main className="flex-1 p-4 pt-5 pb-6">
        <div className="w-full max-w-md mx-auto">
          <div className="bg-gradient-to-br from-green-400 to-green-500 rounded-2xl p-6 mb-4 text-center shadow-lg animate-bounce-slow">
            <div className="flex justify-center mb-3 animate-pulse-scale">
              <div className="w-14 h-14 bg-white rounded-full flex items-center justify-center shadow-md">
                <CheckCircle className="w-8 h-8 text-green-500" strokeWidth={2.5} />
              </div>
            </div>
            <h1 className="text-white text-xl font-bold mb-1">Parabéns, {firstName}!</h1>
            <p className="text-white text-xs">Sua proposta de empréstimo foi aprovada!</p>
          </div>

          <div className="bg-gradient-to-br from-purple-50 to-white border border-purple-200 rounded-xl p-4 mb-4 animate-slide-up shadow-sm">
            <div className="flex items-center gap-3 mb-3">
              <div className="w-12 h-12 flex-shrink-0">
                <div className="w-12 h-12 rounded-full overflow-hidden border-2 border-white shadow-md">
                  <img
                    src="/Screenshot_186.png"
                    alt="Rafaela"
                    className="w-full h-full object-cover"
                  />
                </div>
              </div>
              <div className="text-left flex-1">
                <h3 className="text-base font-bold text-gray-900">
                  Rafaela
                </h3>
                <p className="text-xs text-purple-700">
                  Gerente de Crédito
                </p>
              </div>
            </div>

            <div className="bg-white rounded-lg p-3 shadow-sm">
              <div className="flex items-center gap-2">
                <button
                  onClick={togglePlayPause}
                  className="w-9 h-9 bg-purple-600 hover:bg-purple-700 text-white rounded-full flex items-center justify-center transition-colors flex-shrink-0"
                >
                  {isPlaying ? (
                    <Pause className="w-4 h-4" />
                  ) : (
                    <Play className="w-4 h-4 ml-0.5" />
                  )}
                </button>

                <div className="flex-1">
                  <div className="relative w-full h-1.5 bg-gray-200 rounded-full overflow-hidden mb-0.5">
                    <div
                      className="absolute h-full bg-purple-600 rounded-full transition-all duration-100"
                      style={{ width: `${duration ? (currentTime / duration) * 100 : 0}%` }}
                    >
                      <div className="absolute right-0 top-1/2 -translate-y-1/2 w-3 h-3 bg-purple-600 rounded-full shadow-md"></div>
                    </div>
                  </div>
                  <div className="flex justify-between text-xs text-gray-500 mt-0.5">
                    <span>{formatTime(currentTime)}</span>
                    <span>{formatTime(duration)}</span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3 mb-4 animate-slide-up-delayed">
            <div className="bg-white rounded-xl p-4 border-b-4 border-purple-600 shadow-lg">
              <p className="text-xs text-gray-500 mb-2">Valor Aprovado</p>
              <div className="flex items-center gap-2">
                <DollarSign className="w-5 h-5 text-purple-600" />
                <p className="text-base font-bold text-purple-600">R$ 12.600,00</p>
              </div>
            </div>

            <div className="bg-white rounded-xl p-4 border-b-4 border-purple-600 shadow-lg">
              <p className="text-xs text-gray-500 mb-2">Taxa de Juros</p>
              <div className="flex items-center gap-2">
                <TrendingUp className="w-5 h-5 text-green-600" />
                <div className="bg-green-100 px-2 py-1 rounded-md">
                  <p className="text-sm font-bold text-green-600">SEM JUROS</p>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-xl p-4 border-b-4 border-purple-600 shadow-lg">
              <p className="text-xs text-gray-500 mb-2">Primeira Parcela</p>
              <div className="flex items-center gap-2">
                <Calendar className="w-5 h-5 text-purple-600" />
                <p className="text-sm font-bold text-gray-900">10/01/2026</p>
              </div>
            </div>

            <div className="bg-white rounded-xl p-4 border-b-4 border-purple-600 shadow-lg">
              <p className="text-xs text-gray-500 mb-2">Status</p>
              <div className="flex items-center gap-2">
                <CheckCircle className="w-5 h-5 text-purple-600" />
                <div className="bg-green-100 px-2 py-1 rounded-md">
                  <p className="text-xs font-bold text-green-600">PRÉ-APROVADO</p>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-xl p-4 border-b-4 border-purple-600 shadow-lg">
              <p className="text-xs text-gray-500 mb-2">Tipo</p>
              <div className="flex items-center gap-2">
                <User className="w-5 h-5 text-purple-600" />
                <p className="text-sm font-bold text-gray-900">Pessoal</p>
              </div>
            </div>

            <div className="bg-white rounded-xl p-4 border-b-4 border-purple-600 shadow-lg">
              <p className="text-xs text-gray-500 mb-2">Transferência</p>
              <div className="flex items-center gap-2">
                <Zap className="w-5 h-5 text-purple-600" />
                <p className="text-sm font-bold text-gray-900">PIX Instantâneo</p>
              </div>
            </div>
          </div>

          <div className="space-y-3 mb-6 animate-slide-up-button">
            <div className="bg-white rounded-lg p-3 shadow-md border-l-4 border-green-500">
              <div className="flex items-start gap-2">
                <CheckCircle className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" />
                <div>
                  <p className="text-sm text-gray-900 font-semibold">Sem juros</p>
                  <p className="text-xs text-gray-600">Condições especiais para você</p>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-lg p-3 shadow-md border-l-4 border-green-500">
              <div className="flex items-start gap-2">
                <TrendingUp className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" />
                <div>
                  <p className="text-sm text-gray-900 font-semibold">Transferência rápida</p>
                  <p className="text-xs text-gray-600">Dinheiro na conta via PIX</p>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-lg p-3 shadow-md border-l-4 border-green-500">
              <div className="flex items-start gap-2">
                <Shield className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" />
                <div>
                  <p className="text-sm text-gray-900 font-semibold">100% seguro</p>
                  <p className="text-xs text-gray-600">Processo totalmente protegido</p>
                </div>
              </div>
            </div>
          </div>

          <button
            ref={buttonRef}
            onClick={handleContinue}
            disabled={!buttonEnabled}
            className={`w-full py-4 px-6 rounded-xl font-bold text-base transition-all duration-200 shadow-md ${
              buttonEnabled
                ? 'bg-purple-600 hover:bg-purple-700 text-white cursor-pointer hover:scale-105 active:scale-95 animate-pulse-gentle'
                : 'bg-gray-300 text-gray-500 cursor-not-allowed'
            }`}
          >
            {buttonEnabled ? 'RECEBER EMPRÉSTIMO' : `Aguarde ${countdown}s`}
          </button>
        </div>
      </main>

      <Footer />

      <style>{`
        @keyframes bounce-slow {
          0%, 100% {
            transform: scale(1);
          }
          50% {
            transform: scale(1.02);
          }
        }
        .animate-bounce-slow {
          animation: bounce-slow 2s ease-in-out infinite;
        }

        @keyframes pulse-scale {
          0%, 100% {
            transform: scale(1);
          }
          50% {
            transform: scale(1.1);
          }
        }
        .animate-pulse-scale {
          animation: pulse-scale 2s ease-in-out infinite;
        }

        @keyframes slide-up {
          from {
            opacity: 0;
            transform: translateY(30px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }

        .animate-slide-up {
          animation: slide-up 0.6s ease-out 0.2s backwards;
        }

        .animate-slide-up-delayed {
          animation: slide-up 0.6s ease-out 0.4s backwards;
        }

        .animate-slide-up-button {
          animation: slide-up 0.6s ease-out 0.6s backwards;
        }

        @keyframes pulse-gentle {
          0%, 100% {
            transform: scale(1);
            box-shadow: 0 0 0 0 rgba(147, 51, 234, 0.4);
          }
          50% {
            transform: scale(1.02);
            box-shadow: 0 0 20px 4px rgba(147, 51, 234, 0.2);
          }
        }
        .animate-pulse-gentle {
          animation: pulse-gentle 2s ease-in-out infinite;
        }
      `}</style>
    </div>
  );
}
