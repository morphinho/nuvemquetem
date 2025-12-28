interface FunnelData {
  cpf?: string;
  userData?: any;
  loanAmount?: number;
  installments?: number;
  dueDate?: number;
  hasNubankAccount?: boolean;
  profileAnswers?: Record<string, string>;
  currentStep?: string;
  urlParams?: any;
}

const FUNNEL_STORAGE_KEY = 'funnelData';

export const saveFunnelData = (data: Partial<FunnelData>) => {
  try {
    const currentData = getFunnelData();
    const updatedData = { ...currentData, ...data };
    sessionStorage.setItem(FUNNEL_STORAGE_KEY, JSON.stringify(updatedData));
  } catch (error) {
    console.error('Error saving funnel data:', error);
  }
};

export const getFunnelData = (): FunnelData => {
  try {
    const data = sessionStorage.getItem(FUNNEL_STORAGE_KEY);
    return data ? JSON.parse(data) : {};
  } catch (error) {
    console.error('Error getting funnel data:', error);
    return {};
  }
};

export const clearFunnelData = () => {
  try {
    sessionStorage.removeItem(FUNNEL_STORAGE_KEY);
  } catch (error) {
    console.error('Error clearing funnel data:', error);
  }
};

export const getUserName = (): string => {
  const funnelData = getFunnelData();
  return funnelData.userData?.name || 'Usuário';
};

export const getUserData = () => {
  const funnelData = getFunnelData();
  return funnelData.userData || null;
};
