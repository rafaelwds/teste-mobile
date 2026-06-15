import DateTimePicker, { DateTimePickerAndroid } from '@react-native-community/datetimepicker';
import { useState } from 'react';
import { Platform, StyleSheet, Text, TouchableOpacity } from 'react-native';
import { formatDateTime } from '../../../utils/format';

interface Props {
  value: Date;
  onChange: (date: Date) => void;
}

/**
 * Campo de data/hora multiplataforma.
 * - Android: abre dialogo de data e depois de hora.
 * - iOS: mostra o seletor "datetime" inline.
 */
export function DateTimeField({ value, onChange }: Props) {
  const [showIOS, setShowIOS] = useState(false);

  function abrirAndroid() {
    DateTimePickerAndroid.open({
      value,
      mode: 'date',
      onChange: (_e, dataSelecionada) => {
        if (!dataSelecionada) return;
        DateTimePickerAndroid.open({
          value: dataSelecionada,
          mode: 'time',
          is24Hour: true,
          onChange: (_e2, horaSelecionada) => {
            if (!horaSelecionada) return;
            const final = new Date(dataSelecionada);
            final.setHours(horaSelecionada.getHours(), horaSelecionada.getMinutes(), 0, 0);
            onChange(final);
          },
        });
      },
    });
  }

  return (
    <>
      <TouchableOpacity
        style={styles.field}
        onPress={() => (Platform.OS === 'android' ? abrirAndroid() : setShowIOS(true))}
      >
        <Text style={styles.value}>{formatDateTime(value)}</Text>
      </TouchableOpacity>

      {Platform.OS === 'ios' && showIOS && (
        <DateTimePicker
          value={value}
          mode="datetime"
          is24Hour
          onChange={(_e, d) => {
            setShowIOS(false);
            if (d) onChange(d);
          }}
        />
      )}
    </>
  );
}

const styles = StyleSheet.create({
  field: {
    borderWidth: 1,
    borderColor: '#cbd5e1',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 12,
    backgroundColor: '#fff',
  },
  value: { fontSize: 16, color: '#0f172a' },
});
