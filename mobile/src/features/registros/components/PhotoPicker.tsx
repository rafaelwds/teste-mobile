import * as ImagePicker from 'expo-image-picker';
import { Alert, Image, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';

interface Props {
  fotos: string[];
  onChange: (fotos: string[]) => void;
}

/**
 * Seletor de fotos: permite escolher da galeria (multiplas) ou tirar com a camera.
 * As URIs ficam no estado do formulario; a persistencia acontece ao salvar o registro.
 */
export function PhotoPicker({ fotos, onChange }: Props) {
  async function pegarDaGaleria() {
    const perm = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!perm.granted) {
      Alert.alert('Permissao necessaria', 'Libere o acesso a galeria para escolher fotos.');
      return;
    }
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      allowsMultipleSelection: true,
      quality: 0.6,
    });
    if (!result.canceled) {
      onChange([...fotos, ...result.assets.map((a) => a.uri)]);
    }
  }

  async function tirarFoto() {
    const perm = await ImagePicker.requestCameraPermissionsAsync();
    if (!perm.granted) {
      Alert.alert('Permissao necessaria', 'Libere o acesso a camera para tirar fotos.');
      return;
    }
    const result = await ImagePicker.launchCameraAsync({ quality: 0.6 });
    if (!result.canceled) {
      onChange([...fotos, ...result.assets.map((a) => a.uri)]);
    }
  }

  function remover(uri: string) {
    onChange(fotos.filter((f) => f !== uri));
  }

  return (
    <View>
      <View style={styles.row}>
        <TouchableOpacity style={styles.btn} onPress={pegarDaGaleria}>
          <Text style={styles.btnText}>Galeria</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.btn} onPress={tirarFoto}>
          <Text style={styles.btnText}>Camera</Text>
        </TouchableOpacity>
      </View>

      {fotos.length > 0 && (
        <ScrollView horizontal style={styles.thumbs} showsHorizontalScrollIndicator={false}>
          {fotos.map((uri) => (
            <TouchableOpacity key={uri} onPress={() => remover(uri)} style={styles.thumbWrapper}>
              <Image source={{ uri }} style={styles.thumb} />
              <View style={styles.removeBadge}>
                <Text style={styles.removeText}>x</Text>
              </View>
            </TouchableOpacity>
          ))}
        </ScrollView>
      )}
      {fotos.length > 0 && <Text style={styles.hint}>Toque na foto para remover</Text>}
    </View>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', gap: 12 },
  btn: {
    flex: 1,
    backgroundColor: '#475569',
    paddingVertical: 10,
    borderRadius: 8,
    alignItems: 'center',
  },
  btnText: { color: '#fff', fontWeight: '600' },
  thumbs: { marginTop: 12 },
  thumbWrapper: { marginRight: 8 },
  thumb: { width: 70, height: 70, borderRadius: 8, backgroundColor: '#e2e8f0' },
  removeBadge: {
    position: 'absolute',
    top: -6,
    right: -6,
    backgroundColor: '#ef4444',
    width: 20,
    height: 20,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  removeText: { color: '#fff', fontWeight: '700', lineHeight: 18 },
  hint: { color: '#64748b', fontSize: 12, marginTop: 4 },
});
