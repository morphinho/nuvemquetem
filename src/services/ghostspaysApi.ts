import { createClient } from '@supabase/supabase-js';
import type { CreateTransactionRequest, Transaction } from './genesysApi';

const supabase = createClient(
  import.meta.env.VITE_SUPABASE_URL,
  import.meta.env.VITE_SUPABASE_ANON_KEY
);

export interface GhostsPaysConfig {
  apiUrl: string;
  secretKey: string;
  companyId: string;
}

export async function createGhostsPaysTransaction(
  config: GhostsPaysConfig,
  data: CreateTransactionRequest
): Promise<Transaction> {
  try {
    console.log('Creating GhostsPays transaction with amount:', data.amount);

    const payload = {
      cpf: data.cpf,
      amount: data.amount,
      pixKey: data.pixKey || '',
      productName: data.productName,
      customerName: data.customerName,
      customerEmail: data.customerEmail,
      customerPhone: data.customerPhone,
    };

    const edgeFunctionUrl = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/ghostspays-create-transaction`;

    console.log('Calling GhostsPays Edge Function:', edgeFunctionUrl);

    const response = await fetch(edgeFunctionUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${import.meta.env.VITE_SUPABASE_ANON_KEY}`,
      },
      body: JSON.stringify(payload),
    });

    console.log('Edge Function Response status:', response.status);

    if (!response.ok) {
      const errorData = await response.json();
      console.error('Edge Function error:', errorData);
      throw new Error(errorData.error || 'Failed to create GhostsPays transaction');
    }

    const transaction = await response.json();
    console.log('Transaction created via Edge Function:', transaction);

    if (data.createReceipt !== false) {
      await supabase
        .from('payment_receipts')
        .insert({
          transaction_id: transaction.id,
          cpf: data.cpf,
          customer_name: data.customerName || 'Cliente',
          amount: data.amount,
          status: 'pending_receipt',
        })
        .select()
        .single();
    }

    return transaction;
  } catch (error: any) {
    console.error('Error creating GhostsPays transaction:', error);
    throw error;
  }
}

export async function getGhostsPaysTransactionStatus(
  config: GhostsPaysConfig,
  transactionId: string
): Promise<string> {
  try {
    console.log('Checking GhostsPays transaction status:', transactionId);

    const edgeFunctionUrl = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/ghostspays-check-status?transactionId=${encodeURIComponent(transactionId)}`;

    const response = await fetch(edgeFunctionUrl, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${import.meta.env.VITE_SUPABASE_ANON_KEY}`,
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      const errorData = await response.json();
      console.error('Edge Function error:', errorData);
      throw new Error(errorData.error || 'Failed to check GhostsPays transaction status');
    }

    const result = await response.json();
    console.log('GhostsPays transaction status from Edge Function:', result);

    return result.status || 'pending';
  } catch (error: any) {
    console.error('Error checking GhostsPays transaction status:', error);
    throw error;
  }
}
