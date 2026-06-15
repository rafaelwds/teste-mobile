import { Picker } from '@react-native-picker/picker';
import { useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import type { SessionUser, TipoRegistro } from '../../../types';
import { createRegistro } from '../services/registroService';
import { DateTimeField } from './DateTimeField';
import { PhotoPicker } from './PhotoPicker';

interface Props {
  user: SessionUser;
}

const DESC_MIN = 10;

export function RegistroForm({ user }: Props) {
  const [tipo, setTipo] = useState<TipoRegistro>('COMPRA');
  const [dataHora, setDataHora] = useState<Date>(new Date());
  const [descricao, setDescricao] = useState('');
  const [fotos, setFotos] = useState<string[]>([]);
  const [salvando, setSalvando] = useState(false);

  async function salvar() {
    // Validacoes obrigatorias.
    if (!tipo) return Alert.alert('Atencao', 'Selecione o tipo.');
    if (!dataHora) return Alert.alert('Atencao', 'Informe a data e hora.');
    const desc = descricao.trim();
    if (!desc) return Alert.alert('Atencao', 'A descricao e obrigatoria.');
    if (desc.length < DESC_MIN) {
      return Alert.alert('Atencao', `A descricao precisa ter ao menos ${DESC_MIN} caracteres.`);
    }

    try {
      setSalvando(true);
      await createRegistro({ tipo, dataHora, descricao: desc, fotos }, user);
      // Limpa o formulario.
      setTipo('COMPRA');
      setDataHora(new Date());
      setDescricao('');
      setFotos([]);
      Alert.alert('Pronto', 'Registro salvo localmente. Use "Sincronizar" para enviar.');
    } catch (err) {
      Alert.alert('Erro', (err as Error).message);
    } finally {
      setSalvando(false);
    }
  }

  return (
    <View style={styles.card}>
      <Text style={styles.title}>Novo lancamento</Text>

      <Text style={styles.label}>Tipo</Text>
      <View style={styles.pickerBox}>
        <Picker selectedValue={tipo} onValueChange={(v) => setTipo(v as TipoRegistro)}>
          <Picker.Item label="Compra" value="COMPRA" />
          <Picker.Item label="Venda" value="VENDA" />
        </Picker>
      </View>

      <Text style={styles.label}>Data e hora</Text>
      <DateTimeField value={dataHora} onChange={setDataHora} />

      <Text style={styles.label}>Descricao (min. {DESC_MIN} caracteres)</Text>
      <TextInput
        style={styles.input}
        value={descricao}
        onChangeText={setDescricao}
        placeholder="Descreva o lancamento"
        multiline
      />
      <Text style={styles.counter}>{descricao.trim().length} caractere(s)</Text>

      <Text style={styles.label}>Fotos</Text>
      <PhotoPicker fotos={fotos} onChange={setFotos} />

      <TouchableOpacity
        style={[styles.saveBtn, salvando && styles.saveBtnDisabled]}
        onPress={salvar}
        disabled={salvando}
      >
        {salvando ? (
          <ActivityIndicator color="#fff" />
        ) : (
          <Text style={styles.saveText}>Salvar registro</Text>
        )}
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: '#f8fafc',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  title: { fontSize: 18, fontWeight: '700', marginBottom: 12, color: '#0f172a' },
  label: { fontSize: 14, fontWeight: '600', marginTop: 12, marginBottom: 6, color: '#334155' },
  pickerBox: {
    borderWidth: 1,
    borderColor: '#cbd5e1',
    borderRadius: 8,
    backgroundColor: '#fff',
    overflow: 'hidden',
  },
  input: {
    borderWidth: 1,
    borderColor: '#cbd5e1',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    minHeight: 70,
    textAlignVertical: 'top',
    backgroundColor: '#fff',
    fontSize: 16,
  },
  counter: { fontSize: 12, color: '#64748b', marginTop: 4 },
  saveBtn: {
    backgroundColor: '#2563eb',
    borderRadius: 8,
    paddingVertical: 14,
    alignItems: 'center',
    marginTop: 20,
  },
  saveBtnDisabled: { opacity: 0.6 },
  saveText: { color: '#fff', fontWeight: '700', fontSize: 16 },
});
