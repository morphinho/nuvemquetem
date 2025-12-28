import { useState, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Menu, X, Search } from 'lucide-react';
import { saveFunnelData, getFunnelData } from '../utils/funnelStorage';

interface PageRoute {
  path: string;
  label: string;
}

interface PageCategory {
  name: string;
  pages: PageRoute[];
}

const funnelPages: PageCategory[] = [
  {
    name: 'Início',
    pages: [
      { path: '/', label: 'Home' },
      { path: '/vsl', label: 'VSL' },
    ],
  },
  {
    name: 'Consulta e Verificação',
    pages: [
      { path: '/resultado', label: 'Resultado' },
      { path: '/chat', label: 'Chat' },
      { path: '/verificando-dados', label: 'Verificando Dados' },
      { path: '/conta-verificada', label: 'Conta Verificada' },
    ],
  },
  {
    name: 'Perfil e Crédito',
    pages: [
      { path: '/perguntas-perfil', label: 'Perguntas Perfil' },
      { path: '/autorizacao-credito', label: 'Autorização Crédito' },
      { path: '/prioridade-emprestimo', label: 'Prioridade Empréstimo' },
    ],
  },
  {
    name: 'Empréstimo',
    pages: [
      { path: '/emprestimo-aprovado', label: 'Empréstimo Aprovado' },
      { path: '/resumo-emprestimo', label: 'Resumo Empréstimo' },
      { path: '/selecionar-parcelas', label: 'Selecionar Parcelas' },
      { path: '/termos-emprestimo', label: 'Termos Empréstimo' },
      { path: '/confirmacao-transferencia', label: 'Confirmação Transferência' },
      { path: '/selecionar-vencimento', label: 'Selecionar Vencimento' },
    ],
  },
  {
    name: 'Pagamento',
    pages: [
      { path: '/detalhamento-taxas', label: 'Detalhamento Taxas' },
      { path: '/pagamento-qrcode', label: 'Pagamento QR Code' },
      { path: '/verificar-pagamento', label: 'Verificar Pagamento' },
    ],
  },
  {
    name: 'Upsells',
    pages: [
      { path: '/upsell-1', label: 'Upsell 1' },
      { path: '/upsell-2', label: 'Upsell 2' },
      { path: '/upsell-3', label: 'Upsell 3' },
      { path: '/upsell-4', label: 'Upsell 4' },
      { path: '/upsell-5', label: 'Upsell 5' },
      { path: '/upsell-payment', label: 'Upsell Payment' },
    ],
  },
  {
    name: 'Finalização',
    pages: [
      { path: '/final', label: 'Final' },
    ],
  },
  {
    name: 'Desenvolvimento',
    pages: [
      { path: '/settings', label: 'Settings' },
    ],
  },
];

export default function DevNavigationMenu() {
  const [isOpen, setIsOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const location = useLocation();

  const isDevelopment =
    window.location.hostname === 'localhost' ||
    window.location.hostname === '127.0.0.1' ||
    window.location.hostname.includes('bolt.new') ||
    window.location.hostname.includes('webcontainer') ||
    import.meta.env.DEV;

  const ensureMockData = () => {
    const currentData = getFunnelData();

    if (!currentData.userData) {
      const mockUserData = {
        cpf: '49401843821',
        nome: 'João da Silva',
        email: 'joao.silva@example.com',
        phone: '11987654321',
        birthDate: '01/01/1990',
      };

      saveFunnelData({
        userData: mockUserData,
        cpf: '49401843821',
        loanAmount: 5000,
        installments: 12,
        dueDate: 10,
        hasNubankAccount: true,
        profileAnswers: {
          employment: 'employed',
          income: '3000',
          purpose: 'personal',
        },
      });
    }
  };

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.ctrlKey && e.shiftKey && e.key === 'D') {
        e.preventDefault();
        setIsOpen((prev) => !prev);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  if (!isDevelopment) {
    return null;
  }

  const totalPages = funnelPages.reduce((acc, category) => acc + category.pages.length, 0);

  const filteredCategories = funnelPages
    .map((category) => ({
      ...category,
      pages: category.pages.filter((page) =>
        page.label.toLowerCase().includes(searchTerm.toLowerCase()) ||
        page.path.toLowerCase().includes(searchTerm.toLowerCase())
      ),
    }))
    .filter((category) => category.pages.length > 0);

  return (
    <>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="fixed bottom-6 right-6 z-[9999] bg-gray-800 text-white p-4 rounded-full shadow-lg hover:bg-gray-700 transition-all duration-200 hover:scale-110"
        title="Menu de Navegação (Ctrl+Shift+D)"
      >
        {isOpen ? <X size={24} /> : <Menu size={24} />}
      </button>

      {isOpen && (
        <div className="fixed bottom-24 right-6 z-[9998] w-96 max-h-[80vh] bg-gray-900 text-white rounded-lg shadow-2xl border border-gray-700 overflow-hidden flex flex-col">
          <div className="p-4 border-b border-gray-700">
            <div className="flex items-center justify-between mb-3">
              <h3 className="font-bold text-lg">Menu de Navegação</h3>
              <span className="text-sm text-gray-400">{totalPages} páginas</span>
            </div>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={18} />
              <input
                type="text"
                placeholder="Buscar página..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 bg-gray-800 border border-gray-600 rounded-lg text-sm focus:outline-none focus:border-gray-500"
              />
            </div>
          </div>

          <div className="overflow-y-auto flex-1 p-4 space-y-4">
            {filteredCategories.map((category) => (
              <div key={category.name}>
                <h4 className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">
                  {category.name}
                </h4>
                <div className="space-y-1">
                  {category.pages.map((page) => (
                    <Link
                      key={page.path}
                      to={page.path}
                      onClick={() => {
                        ensureMockData();
                        setIsOpen(false);
                      }}
                      className={`block px-3 py-2 rounded-lg text-sm transition-colors ${
                        location.pathname === page.path
                          ? 'bg-purple-600 text-white font-medium'
                          : 'hover:bg-gray-800 text-gray-300'
                      }`}
                    >
                      {page.label}
                      {location.pathname === page.path && (
                        <span className="ml-2 text-xs">✓</span>
                      )}
                    </Link>
                  ))}
                </div>
              </div>
            ))}

            {filteredCategories.length === 0 && (
              <div className="text-center text-gray-400 py-8">
                <p>Nenhuma página encontrada</p>
              </div>
            )}
          </div>

          <div className="p-3 border-t border-gray-700 bg-gray-800">
            <p className="text-xs text-gray-400 text-center">
              Atalho: <kbd className="px-2 py-1 bg-gray-700 rounded text-white">Ctrl+Shift+D</kbd>
            </p>
          </div>
        </div>
      )}
    </>
  );
}
