import React, { useEffect, useState, useCallback } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, RefreshControl } from 'react-native';
import { useAuth } from '../../store/AuthContext';
import { Plus, ArrowDownToLine, ArrowUpFromLine } from 'lucide-react-native';
import { router } from 'expo-router';
import { useFocusEffect } from '@react-navigation/native';

export default function DashboardScreen() {
  const { token } = useAuth();
  const [data, setData] = useState({
    current_balance: 0,
    today_income: 0,
    today_expense: 0,
    pending_approvals: 0
  });
  const [refreshing, setRefreshing] = useState(false);

  const fetchDashboard = async () => {
    try {
      const response = await fetch('http://10.0.2.2:8001/api/mobile/dashboard', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (response.ok) {
        const json = await response.json();
        setData(json);
      }
    } catch (e) {
      console.error(e);
    }
  };

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await fetchDashboard();
    setRefreshing(false);
  }, [token]);

  useFocusEffect(
    useCallback(() => {
      fetchDashboard();
    }, [token])
  );

  const formatCurrency = (amount: number) => `₹${amount.toLocaleString('en-IN')}`;

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Overview</Text>
      </View>
      
      <ScrollView 
        contentContainerStyle={styles.scrollContent}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
      >
        <View style={[styles.card, styles.balanceCard]}>
          <Text style={styles.cardLabelWhite}>Current Balance</Text>
          <Text style={styles.balanceText}>{formatCurrency(data.current_balance)}</Text>
        </View>

        <View style={styles.row}>
          <View style={[styles.card, styles.halfCard]}>
            <View style={styles.iconContainerIncome}>
              <ArrowDownToLine size={20} color="#10b981" />
            </View>
            <Text style={styles.cardLabel}>Today's Income</Text>
            <Text style={styles.amountTextIncome}>{formatCurrency(data.today_income)}</Text>
          </View>
          
          <View style={[styles.card, styles.halfCard]}>
            <View style={styles.iconContainerExpense}>
              <ArrowUpFromLine size={20} color="#ef4444" />
            </View>
            <Text style={styles.cardLabel}>Today's Expense</Text>
            <Text style={styles.amountTextExpense}>{formatCurrency(data.today_expense)}</Text>
          </View>
        </View>

        <View style={styles.card}>
          <Text style={styles.cardLabel}>Pending Approvals</Text>
          <Text style={styles.amountText}>{data.pending_approvals}</Text>
        </View>
      </ScrollView>

      <TouchableOpacity 
        style={styles.fab}
        onPress={() => router.push('/add-transaction')}
      >
        <Plus color="white" size={24} />
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f9fafb' },
  header: { paddingTop: 60, paddingHorizontal: 20, paddingBottom: 20, backgroundColor: 'white' },
  headerTitle: { fontSize: 24, fontWeight: 'bold', color: '#1f2937' },
  scrollContent: { padding: 20 },
  card: { backgroundColor: 'white', borderRadius: 16, padding: 20, marginBottom: 16, shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.05, shadowRadius: 5, elevation: 2 },
  balanceCard: { backgroundColor: '#3b82f6' },
  cardLabelWhite: { color: 'rgba(255,255,255,0.8)', fontSize: 14, fontWeight: '500', marginBottom: 8 },
  balanceText: { color: 'white', fontSize: 32, fontWeight: 'bold' },
  row: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 16 },
  halfCard: { width: '48%', marginBottom: 0 },
  cardLabel: { color: '#6b7280', fontSize: 13, fontWeight: '500', marginBottom: 8, marginTop: 12 },
  amountText: { color: '#1f2937', fontSize: 22, fontWeight: 'bold' },
  amountTextIncome: { color: '#10b981', fontSize: 20, fontWeight: 'bold' },
  amountTextExpense: { color: '#ef4444', fontSize: 20, fontWeight: 'bold' },
  iconContainerIncome: { width: 40, height: 40, borderRadius: 20, backgroundColor: '#d1fae5', justifyContent: 'center', alignItems: 'center' },
  iconContainerExpense: { width: 40, height: 40, borderRadius: 20, backgroundColor: '#fee2e2', justifyContent: 'center', alignItems: 'center' },
  fab: { position: 'absolute', bottom: 20, right: 20, width: 60, height: 60, borderRadius: 30, backgroundColor: '#3b82f6', justifyContent: 'center', alignItems: 'center', shadowColor: '#3b82f6', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.3, shadowRadius: 5, elevation: 5 }
});
