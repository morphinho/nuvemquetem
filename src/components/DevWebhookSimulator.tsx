import { useState } from 'react';
import { CheckCircle, Send } from 'lucide-react';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

interface DevWebhookSimulatorProps {
  transactionId: string | null;
}

export default function DevWebhookSimulator({ transactionId }: DevWebhookSimulatorProps) {
  const [simulating, setSimulating] = useState(false);
  const [result, setResult] = useState<string | null>(null);

  if (!import.meta.env.DEV) {
    return null;
  }

  if (!transactionId) {
    return null;
  }

  const simulateWebhook = async () => {
    try {
      console.log('[DevWebhookSimulator] Starting simulation for transaction:', transactionId);
      setSimulating(true);
      setResult(null);

      const { data: transaction, error: fetchError } = await supabase
        .from('transactions')
        .select('*')
        .eq('id', transactionId)
        .maybeSingle();

      console.log('[DevWebhookSimulator] Transaction fetch result:', { transaction, fetchError });

      if (fetchError) {
        console.error('[DevWebhookSimulator] Fetch error:', fetchError);
        setResult(`❌ Erro: ${fetchError.message}`);
        return;
      }

      if (!transaction) {
        console.warn('[DevWebhookSimulator] Transaction not found');
        setResult('❌ Transação não encontrada');
        return;
      }

      console.log('[DevWebhookSimulator] Current transaction status:', transaction.status);

      const updateData: any = {
        status: 'approved',
        updated_at: new Date().toISOString(),
        completed_at: new Date().toISOString(),
        updated_via_webhook: true,
        webhook_updated_at: new Date().toISOString(),
        webhook_payload: {
          simulated: true,
          timestamp: new Date().toISOString(),
          previous_status: transaction.status,
        },
      };

      console.log('[DevWebhookSimulator] Updating transaction with data:', updateData);

      const { error: updateError } = await supabase
        .from('transactions')
        .update(updateData)
        .eq('id', transactionId);

      if (updateError) {
        console.error('[DevWebhookSimulator] Update error:', updateError);
        setResult(`❌ Erro: ${updateError.message}`);
        return;
      }

      console.log('[DevWebhookSimulator] Transaction updated successfully to approved status');
      setResult('✅ Pagamento aprovado!');

      setTimeout(() => {
        setResult(null);
      }, 3000);
    } catch (error: any) {
      console.error('[DevWebhookSimulator] Exception caught:', error);
      setResult(`❌ Erro: ${error.message}`);
    } finally {
      setSimulating(false);
    }
  };

  return (
    <div className="fixed bottom-6 right-6 z-50">
      <button
        onClick={simulateWebhook}
        disabled={simulating}
        className="bg-gradient-to-r from-green-500 to-green-600 text-white px-4 py-3 rounded-full shadow-lg hover:shadow-xl transition-all duration-200 flex items-center gap-2 font-semibold disabled:opacity-50 disabled:cursor-not-allowed"
      >
        {simulating ? (
          <>
            <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
            <span className="text-sm">Simulando...</span>
          </>
        ) : result ? (
          <>
            <CheckCircle className="w-5 h-5" />
            <span className="text-sm">{result}</span>
          </>
        ) : (
          <>
            <Send className="w-5 h-5" />
            <span className="text-sm">Simular Webhook</span>
          </>
        )}
      </button>
    </div>
  );
}
