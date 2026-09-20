import React, { useState } from 'react';
import { View, Text, StyleSheet, TextInput, TouchableOpacity, ScrollView, Alert } from 'react-native';
import { router } from 'expo-router';
import { CameraView, useCameraPermissions } from 'expo-camera';
import { syncManager } from '../offline/SyncManager';
import { X, Camera as CameraIcon } from 'lucide-react-native';

export default function AddTransactionScreen() {
  const [type, setType] = useState<'Income' | 'Expense'>('Expense');
  const [amount, setAmount] = useState('');
  const [description, setDescription] = useState('');
  
  const [permission, requestPermission] = useCameraPermissions();
  const [showCamera, setShowCamera] = useState(false);
  const [cameraRef, setCameraRef] = useState<CameraView | null>(null);
  const [receiptPhoto, setReceiptPhoto] = useState<string | null>(null);

  const handleSave = async () => {
    if (!amount || !description) {
      Alert.alert('Error', 'Please fill all required fields');
      return;
    }

    try {
      await syncManager.queueTransaction({
        type,
        amount: parseFloat(amount),
        description,
        transaction_date: new Date().toISOString().split('T')[0],
      });
      
      Alert.alert('Success', 'Transaction saved locally and queued for sync!');
      router.back();
    } catch (e) {
      Alert.alert('Error', 'Failed to save transaction');
    }
  };

  const takePhoto = async () => {
    if (cameraRef) {
      const photo = await cameraRef.takePictureAsync();
      setReceiptPhoto(photo.uri);
      setShowCamera(false);
    }
  };

  if (showCamera) {
    if (!permission?.granted) {
      return (
        <View style={styles.container}>
          <Text>We need your permission to show the camera</Text>
          <TouchableOpacity onPress={requestPermission} style={styles.button}>
            <Text style={styles.buttonText}>Grant Permission</Text>
          </TouchableOpacity>
        </View>
      );
    }

    return (
      <View style={{ flex: 1 }}>
        <CameraView style={{ flex: 1 }} ref={(ref) => setCameraRef(ref)}>
          <View style={styles.cameraControls}>
            <TouchableOpacity style={styles.closeCameraButton} onPress={() => setShowCamera(false)}>
              <X color="white" size={24} />
            </TouchableOpacity>
            <TouchableOpacity style={styles.captureButton} onPress={takePhoto}>
              <View style={styles.captureInner} />
            </TouchableOpacity>
          </View>
        </CameraView>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Add Transaction</Text>
        <TouchableOpacity onPress={() => router.back()}>
          <X color="#1f2937" size={24} />
        </TouchableOpacity>
      </View>

      <ScrollView contentContainerStyle={styles.form}>
        <View style={styles.typeSelector}>
          <TouchableOpacity 
            style={[styles.typeButton, type === 'Income' && styles.typeButtonActiveIncome]}
            onPress={() => setType('Income')}
          >
            <Text style={[styles.typeText, type === 'Income' && { color: 'white' }]}>Income</Text>
          </TouchableOpacity>
          <TouchableOpacity 
            style={[styles.typeButton, type === 'Expense' && styles.typeButtonActiveExpense]}
            onPress={() => setType('Expense')}
          >
            <Text style={[styles.typeText, type === 'Expense' && { color: 'white' }]}>Expense</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.inputGroup}>
          <Text style={styles.label}>Amount (₹)</Text>
          <TextInput 
            style={styles.input} 
            value={amount} 
            onChangeText={setAmount} 
            keyboardType="numeric" 
            placeholder="0.00" 
          />
        </View>

        <View style={styles.inputGroup}>
          <Text style={styles.label}>Description</Text>
          <TextInput 
            style={styles.input} 
            value={description} 
            onChangeText={setDescription} 
            placeholder="What was this for?" 
          />
        </View>

        {type === 'Expense' && (
          <View style={styles.inputGroup}>
            <Text style={styles.label}>Receipt</Text>
            {receiptPhoto ? (
              <View style={styles.receiptPreview}>
                <Text style={{ color: '#10b981', fontWeight: 'bold' }}>✓ Receipt Captured</Text>
                <TouchableOpacity onPress={() => setReceiptPhoto(null)}>
                  <Text style={{ color: '#ef4444', marginTop: 8 }}>Remove</Text>
                </TouchableOpacity>
              </View>
            ) : (
              <TouchableOpacity style={styles.cameraButton} onPress={() => setShowCamera(true)}>
                <CameraIcon color="#6b7280" size={24} />
                <Text style={styles.cameraButtonText}>Take Photo</Text>
              </TouchableOpacity>
            )}
          </View>
        )}

        <TouchableOpacity style={styles.saveButton} onPress={handleSave}>
          <Text style={styles.saveButtonText}>Save Transaction</Text>
        </TouchableOpacity>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: 'white' },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 20, paddingTop: 60, borderBottomWidth: 1, borderBottomColor: '#f3f4f6' },
  headerTitle: { fontSize: 20, fontWeight: 'bold', color: '#1f2937' },
  form: { padding: 20 },
  typeSelector: { flexDirection: 'row', marginBottom: 24, backgroundColor: '#f3f4f6', borderRadius: 8, padding: 4 },
  typeButton: { flex: 1, paddingVertical: 12, alignItems: 'center', borderRadius: 6 },
  typeButtonActiveIncome: { backgroundColor: '#10b981' },
  typeButtonActiveExpense: { backgroundColor: '#ef4444' },
  typeText: { fontWeight: 'bold', color: '#6b7280' },
  inputGroup: { marginBottom: 20 },
  label: { fontSize: 14, fontWeight: '600', color: '#374151', marginBottom: 8 },
  input: { borderWidth: 1, borderColor: '#d1d5db', borderRadius: 8, padding: 12, fontSize: 16 },
  cameraButton: { borderWidth: 1, borderColor: '#d1d5db', borderStyle: 'dashed', borderRadius: 8, padding: 24, alignItems: 'center', justifyContent: 'center' },
  cameraButtonText: { marginTop: 8, color: '#6b7280' },
  receiptPreview: { borderWidth: 1, borderColor: '#10b981', backgroundColor: '#ecfdf5', borderRadius: 8, padding: 24, alignItems: 'center', justifyContent: 'center' },
  saveButton: { backgroundColor: '#3b82f6', borderRadius: 8, padding: 16, alignItems: 'center', marginTop: 12 },
  saveButtonText: { color: 'white', fontWeight: 'bold', fontSize: 16 },
  cameraControls: { flex: 1, justifyContent: 'flex-end', alignItems: 'center', paddingBottom: 40 },
  closeCameraButton: { position: 'absolute', top: 60, right: 20, backgroundColor: 'rgba(0,0,0,0.5)', padding: 12, borderRadius: 24 },
  captureButton: { width: 70, height: 70, borderRadius: 35, backgroundColor: 'rgba(255,255,255,0.3)', justifyContent: 'center', alignItems: 'center' },
  captureInner: { width: 54, height: 54, borderRadius: 27, backgroundColor: 'white' }
});
