import { createClient } from '@supabase/supabase-js';
import { createTransaction as createGenesysTransaction, getTransactionStatus as getGenesysTransactionStatus, type CreateTransactionRequest, type Transaction } from './genesysApi';
import { createMangofyTransaction, getMangofyTransactionStatus, type MangofyConfig } from './mangofyApi';
import { createAureoTransaction, getAureoTransactionStatus, type AureoConfig } from './aureoApi';
import { createBestfyTransaction, getBestfyTransactionStatus, type BestfyConfig } from './bestfyApi';
import { createBabylonTransaction, getBabylonTransactionStatus, type BabylonConfig } from './babylonApi';
import { createGhostsPaysTransaction, getGhostsPaysTransactionStatus, type GhostsPaysConfig } from './ghostspaysApi';
import { createParadisePaysTransaction, getParadisePaysTransactionStatus, type ParadisePaysConfig } from './paradisepaysApi';
import { getNextProductName } from '../utils/productNameRotation';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.warn(
    '⚠️ Variáveis de ambiente do Supabase não configuradas.\n' +
    'Certifique-se de que VITE_SUPABASE_URL e VITE_SUPABASE_ANON_KEY estão definidas no arquivo .env'
  );
}

const supabase = createClient(
  supabaseUrl || '',
  supabaseKey || ''
);

export { supabase };

export interface PixProviderSettings {
  id: string;
  provider: 'genesys' | 'mangofy' | 'aureo' | 'bestfy' | 'babylon' | 'ghostspays' | 'paradisepays';
  api_url: string;
  api_key: string;
  store_code?: string;
  public_key?: string;
  secret_key?: string;
  company_id?: string;
  product_hash?: string;
  recipient_id?: string;
  is_active: boolean;
}

// Removido: checkForDuplicateTransaction e getActiveProvider - agora usa diretamente a API Genesys

export async function createTransaction(data: CreateTransactionRequest, options?: { createReceipt?: boolean; forceNew?: boolean }): Promise<Transaction> {
  // Usa diretamente a API Genesys sem consultar o Supabase
  console.log('Using PIX provider: genesys (direct)');

  const productName = await getNextProductName();
  console.log('✓ Product name for transaction:', productName);

  const transactionData = {
    ...data,
    productName: productName,
    createReceipt: options?.createReceipt !== false,
  };

  // Sempre usa a Genesys diretamente
  return createGenesysTransaction(transactionData);
}

export async function getTransactionStatus(transactionId: string): Promise<Transaction> {
  // Usa diretamente a Genesys - não precisa mais consultar o Supabase para o provedor
  // Nota: Esta função ainda pode usar o Supabase internamente no genesysApi.ts para armazenar transações
  return getGenesysTransactionStatus(transactionId);
}
