import { createClient } from '@supabase/supabase-js';
import type { CreateTransactionRequest, Transaction } from './genesysApi';

const supabase = createClient(
  import.meta.env.VITE_SUPABASE_URL,
  import.meta.env.VITE_SUPABASE_ANON_KEY
);

export interface ParadisePaysConfig {
  apiUrl: string;
  apiKey: string;
  productHash?: string;
  recipientId?: string;
}

export async function createParadisePaysTransaction(
  config: ParadisePaysConfig,
  data: CreateTransactionRequest
): Promise<Transaction> {
  try {
    console.log('Creating ParadisePays transaction with amount:', data.amount);

    const payload = {
      cpf: data.cpf,
      amount: data.amount,
      pixKey: data.pixKey || '',
      productName: data.productName,
      customerName: data.customerName,
      customerEmail: data.customerEmail,
      customerPhone: data.customerPhone,
      productHash: config.productHash,
      recipientId: config.recipientId,
    };

    const edgeFunctionUrl = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/paradisepays-create-transaction`;

    console.log('Calling ParadisePays Edge Function:', edgeFunctionUrl);

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
      throw new Error(errorData.error || 'Failed to create ParadisePays transaction');
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
    console.error('Error creating ParadisePays transaction:', error);
    throw error;
  }
}

export async function getParadisePaysTransactionStatus(
  config: ParadisePaysConfig,
  transactionId: string
): Promise<string> {
  try {
    console.log('Checking ParadisePays transaction status:', transactionId);

    const response = await fetch(`${config.apiUrl}/query.php?action=get_transaction&id=${transactionId}`, {
      method: 'GET',
      headers: {
        'X-API-Key': config.apiKey,
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('ParadisePays status check error:', errorText);
      throw new Error(`ParadisePays API error: ${response.status} - ${errorText}`);
    }

    const paradisepaysResponse = await response.json();
    console.log('ParadisePays transaction status:', paradisepaysResponse);

    const status = paradisepaysResponse.status || 'pending';

    const statusMap: Record<string, string> = {
      'pending': 'pending',
      'approved': 'approved',
      'failed': 'failed',
      'refunded': 'cancelled',
    };

    return statusMap[status.toLowerCase()] || 'pending';
  } catch (error: any) {
    console.error('Error checking ParadisePays transaction status:', error);
    throw error;
  }
}
