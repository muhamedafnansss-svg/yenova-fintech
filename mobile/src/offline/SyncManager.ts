import AsyncStorage from '@react-native-async-storage/async-storage';
import NetInfo from '@react-native-community/netinfo';
import * as Crypto from 'expo-crypto';

export interface Transaction {
  id: string;
  type: 'Income' | 'Expense';
  amount: number;
  category_id?: string;
  project_id?: string;
  description: string;
  payment_method?: string;
  reference_number?: string;
  transaction_date: string;
}

const SYNC_QUEUE_KEY = '@fintech_sync_queue';

class SyncManager {
  private isSyncing = false;
  private token: string | null = null;
  private baseUrl = 'http://10.0.2.2:8001/api'; // Localhost alias for Android emulator

  setToken(token: string) {
    this.token = token;
  }

  async queueTransaction(tx: Omit<Transaction, 'id'>): Promise<Transaction> {
    const newTx: Transaction = {
      ...tx,
      id: Crypto.randomUUID(),
    };
    
    try {
      const queueStr = await AsyncStorage.getItem(SYNC_QUEUE_KEY);
      const queue: Transaction[] = queueStr ? JSON.parse(queueStr) : [];
      queue.push(newTx);
      await AsyncStorage.setItem(SYNC_QUEUE_KEY, JSON.stringify(queue));
      
      // Attempt to sync immediately
      this.attemptSync();
      
      return newTx;
    } catch (e) {
      console.error('Failed to queue transaction', e);
      throw e;
    }
  }

  async getQueue(): Promise<Transaction[]> {
    const queueStr = await AsyncStorage.getItem(SYNC_QUEUE_KEY);
    return queueStr ? JSON.parse(queueStr) : [];
  }

  async clearQueue() {
    await AsyncStorage.removeItem(SYNC_QUEUE_KEY);
  }

  async attemptSync() {
    if (this.isSyncing || !this.token) return;

    try {
      const state = await NetInfo.fetch();
      if (!state.isConnected) return; // Wait for connection

      const queue = await this.getQueue();
      if (queue.length === 0) return;

      this.isSyncing = true;

      const response = await fetch(`${this.baseUrl}/mobile/sync`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${this.token}`,
        },
        body: JSON.stringify({ transactions: queue }),
      });

      if (response.ok) {
        const result = await response.json();
        if (result.success) {
          // Sync successful, clear queue
          await this.clearQueue();
        } else if (result.failed_ids && result.failed_ids.length > 0) {
          // Partially successful, keep failed items in queue
          const remainingQueue = queue.filter(tx => result.failed_ids.includes(tx.id));
          await AsyncStorage.setItem(SYNC_QUEUE_KEY, JSON.stringify(remainingQueue));
        }
      }
    } catch (error) {
      console.error('Sync failed', error);
      // Let it remain in the queue for the next attempt
    } finally {
      this.isSyncing = false;
    }
  }

  // Set up network listener
  initNetworkListener() {
    return NetInfo.addEventListener(state => {
      if (state.isConnected && state.isInternetReachable !== false) {
        this.attemptSync();
      }
    });
  }
}

export const syncManager = new SyncManager();
