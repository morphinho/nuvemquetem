import { useEffect, useState, useRef, useCallback } from 'react';
import { getTransactionStatus } from '../services/pixService';
import type { Transaction } from '../services/genesysApi';

interface UseTransactionPollingOptions {
  transactionId: string | null;
  enabled?: boolean;
  interval?: number;
  onStatusChange?: (transaction: Transaction) => void;
}

export function useTransactionPolling({
  transactionId,
  enabled = true,
  interval = 20000,
  onStatusChange,
}: UseTransactionPollingOptions) {
  const [transaction, setTransaction] = useState<Transaction | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);
  const previousStatusRef = useRef<string | null>(null);
  const onStatusChangeRef = useRef(onStatusChange);

  useEffect(() => {
    onStatusChangeRef.current = onStatusChange;
  }, [onStatusChange]);

  useEffect(() => {
    if (!transactionId || !enabled) {
      setLoading(false);
      return;
    }

    console.log('🔄 Will start polling for transaction in 10s:', transactionId);

    const pollStatus = async () => {
      try {
        const updatedTransaction = await getTransactionStatus(transactionId);
        console.log('🔄 Polling result:', {
          id: updatedTransaction.id,
          status: updatedTransaction.status,
          previousStatus: previousStatusRef.current,
          updatedViaWebhook: updatedTransaction.updated_via_webhook,
          webhookUpdatedAt: updatedTransaction.webhook_updated_at,
        });

        setTransaction(updatedTransaction);
        setError(null);
        setLoading(false);

        const statusChanged = previousStatusRef.current !== null && previousStatusRef.current !== updatedTransaction.status;
        const isFinalStatus = updatedTransaction.status === 'completed' || updatedTransaction.status === 'authorized' || updatedTransaction.status === 'approved' || updatedTransaction.status === 'failed';

        if (onStatusChangeRef.current && (statusChanged || (previousStatusRef.current === null && isFinalStatus))) {
          console.log('📢 Status changed or final status detected, calling onStatusChange callback');
          onStatusChangeRef.current(updatedTransaction);
        }

        previousStatusRef.current = updatedTransaction.status;

        if (isFinalStatus) {
          console.log('✅ Final status reached, stopping polling:', updatedTransaction.status);
          if (intervalRef.current) {
            clearInterval(intervalRef.current);
            intervalRef.current = null;
          }
        }
      } catch (err: any) {
        console.error('Error polling transaction status:', err);
        setError(err.message || 'Erro ao verificar status do pagamento');
        setLoading(false);
      }
    };

    const initialTimeout = setTimeout(() => {
      console.log('🔄 Starting polling now for transaction:', transactionId);
      pollStatus();

      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }

      intervalRef.current = setInterval(pollStatus, interval);
    }, 10000);

    return () => {
      console.log('🧹 Cleaning up polling for transaction:', transactionId);
      clearTimeout(initialTimeout);
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
    };
  }, [transactionId, enabled, interval]);

  return { transaction, loading, error };
}
