import React, { useCallback, useEffect, useRef, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Dimensions,
  Modal,
  TextInput,
  Platform,
} from 'react-native';
import { CameraView, useCameraPermissions } from 'expo-camera';
import type { BarcodeScanningResult } from 'expo-camera';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withRepeat,
  withTiming,
  Easing,
} from 'react-native-reanimated';
import * as Haptics from 'expo-haptics';
import { Feather } from '@expo/vector-icons';
import { Typography } from '@/constants/Typography';
import { Spacing, BorderRadius } from '@/constants/Spacing';

const { width: SW } = Dimensions.get('window');
const SCAN_SIZE = Math.min(SW * 0.72, 280);
const CORNER = 26;
const BORDER_W = 3;
const MONO_FONT = Platform.select({ ios: 'Courier', android: 'monospace', default: 'monospace' });

const OVERLAY_BG = 'rgba(0,0,0,0.68)';

type Props = {
  onScanSuccess: (data: string) => void;
  onClose: () => void;
};

export function QRScanner({ onScanSuccess, onClose }: Props) {
  const [permission, requestPermission] = useCameraPermissions();
  const [torchOn, setTorchOn] = useState(false);
  const [scanned, setScanned] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);
  const [manualVisible, setManualVisible] = useState(false);
  const [manualCode, setManualCode] = useState('');

  // Animated scanning line
  const scanY = useSharedValue(0);
  useEffect(() => {
    scanY.value = withRepeat(
      withTiming(SCAN_SIZE - 4, { duration: 1800, easing: Easing.inOut(Easing.quad) }),
      -1,
      true,
    );
  }, []);
  const lineStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: scanY.value }],
  }));

  // DEV mode: simulate a successful scan after 2 seconds
  const devTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  useEffect(() => {
    if (!__DEV__) return;
    devTimerRef.current = setTimeout(() => {
      fireSuccess(
        JSON.stringify({
          transactionId: 'ht-2024-0042',
          role: 'seller',
          hubId: 'h1',
          timestamp: Date.now(),
          orderId: 'ord-7891',
        }),
      );
    }, 2000);
    return () => {
      if (devTimerRef.current) clearTimeout(devTimerRef.current);
    };
  }, []);

  const fireSuccess = useCallback(
    async (data: string) => {
      if (scanned) return;
      setScanned(true);
      try {
        await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      } catch {}
      setShowSuccess(true);
      setTimeout(() => onScanSuccess(data), 900);
    },
    [scanned, onScanSuccess],
  );

  const onBarcode = useCallback(
    (result: BarcodeScanningResult) => fireSuccess(result.data),
    [fireSuccess],
  );

  // ── Permission screens ──────────────────────────────────────────────────
  if (!permission) {
    return <View style={styles.loading} />;
  }

  if (!permission.granted) {
    return (
      <View style={styles.permContainer}>
        <Feather name="camera-off" size={48} color="#9CA3AF" />
        <Text style={styles.permTitle}>Accès à la caméra requis</Text>
        <Text style={styles.permSub}>
          Pour scanner les QR codes de remise, autorisez l'accès à la caméra.
        </Text>
        <TouchableOpacity style={styles.permBtn} onPress={requestPermission}>
          <Text style={styles.permBtnText}>Autoriser la caméra</Text>
        </TouchableOpacity>
        <TouchableOpacity style={{ marginTop: Spacing.md }} onPress={onClose}>
          <Text style={[styles.manualLink, { color: '#9CA3AF' }]}>Retour</Text>
        </TouchableOpacity>
      </View>
    );
  }

  // ── Main scanner ────────────────────────────────────────────────────────
  return (
    <View style={styles.container}>
      <CameraView
        style={StyleSheet.absoluteFillObject}
        facing="back"
        enableTorch={torchOn}
        onBarcodeScanned={scanned ? undefined : onBarcode}
        barcodeScannerSettings={{ barcodeTypes: ['qr'] }}
      />

      {/* Overlay: 4 dark rectangles around transparent scan area */}
      <View style={styles.overlayTop} />
      <View style={styles.overlayMiddle}>
        <View style={styles.overlaySide} />

        {/* Scan frame */}
        <View style={[styles.scanFrame, showSuccess && styles.scanFrameSuccess]}>
          <View style={[styles.corner, styles.cTL]} />
          <View style={[styles.corner, styles.cTR]} />
          <View style={[styles.corner, styles.cBL]} />
          <View style={[styles.corner, styles.cBR]} />

          {showSuccess ? (
            <View style={styles.successOverlay}>
              <View style={styles.successCircle}>
                <Feather name="check" size={38} color="#FFF" />
              </View>
            </View>
          ) : (
            <Animated.View style={[styles.scanLine, lineStyle]} />
          )}
        </View>

        <View style={styles.overlaySide} />
      </View>
      <View style={styles.overlayBottom} />

      {/* Top instruction */}
      <View style={styles.topBanner} pointerEvents="none">
        <Text style={styles.instruction}>Scannez le QR code</Text>
        {__DEV__ && (
          <Text style={styles.devNote}>Mode dev — scan simulé dans 2s</Text>
        )}
      </View>

      {/* Close button */}
      <TouchableOpacity style={styles.closeBtn} onPress={onClose}>
        <Feather name="x" size={22} color="#FFF" />
      </TouchableOpacity>

      {/* Bottom controls */}
      <View style={styles.controls}>
        <TouchableOpacity
          style={styles.torchBtn}
          onPress={() => setTorchOn((v) => !v)}
        >
          <Feather name={torchOn ? 'zap-off' : 'zap'} size={20} color="#FFF" />
          <Text style={styles.torchLabel}>
            {torchOn ? 'Éteindre la lampe' : 'Lampe torche'}
          </Text>
        </TouchableOpacity>

        <TouchableOpacity onPress={() => setManualVisible(true)}>
          <Text style={styles.manualLink}>Entrer le code manuellement</Text>
        </TouchableOpacity>
      </View>

      {/* Manual entry modal */}
      <Modal visible={manualVisible} transparent animationType="slide">
        <View style={styles.manualOverlay}>
          <View style={styles.manualCard}>
            <Text style={styles.manualTitle}>Saisie manuelle</Text>
            <Text style={styles.manualSub}>
              Entrez le code à 6 caractères indiqué sur l'écran du destinataire
            </Text>
            <TextInput
              style={[styles.manualInput, { fontFamily: MONO_FONT }]}
              value={manualCode}
              onChangeText={(t) => setManualCode(t.toUpperCase())}
              maxLength={6}
              autoCapitalize="characters"
              autoFocus
              placeholder="XXXXXX"
              placeholderTextColor="#9CA3AF"
            />
            <TouchableOpacity
              style={[
                styles.manualConfirm,
                { opacity: manualCode.length === 6 ? 1 : 0.4 },
              ]}
              disabled={manualCode.length !== 6}
              onPress={() => {
                setManualVisible(false);
                fireSuccess(JSON.stringify({ code: manualCode, manual: true }));
              }}
            >
              <Text style={styles.manualConfirmText}>Confirmer</Text>
            </TouchableOpacity>
            <TouchableOpacity onPress={() => setManualVisible(false)}>
              <Text style={styles.manualCancel}>Annuler</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  loading: { flex: 1, backgroundColor: '#000' },

  // Camera container
  container: { flex: 1, backgroundColor: '#000' },

  // Permission
  permContainer: {
    flex: 1,
    backgroundColor: '#1A1A1A',
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.lg,
    padding: Spacing.xl,
  },
  permTitle: { ...Typography.h3, color: '#E5E7EB', textAlign: 'center' },
  permSub: {
    ...Typography.body,
    color: '#9CA3AF',
    textAlign: 'center',
    maxWidth: 280,
  },
  permBtn: {
    backgroundColor: '#14248A',
    paddingHorizontal: Spacing.xl,
    paddingVertical: Spacing.md,
    borderRadius: BorderRadius.md,
  },
  permBtnText: { ...Typography.button, color: '#FFF' },

  // Dark overlay panels
  overlayTop: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: '50%',
    marginBottom: SCAN_SIZE / 2,
    backgroundColor: OVERLAY_BG,
  },
  overlayMiddle: {
    position: 'absolute',
    top: '50%',
    left: 0,
    right: 0,
    height: SCAN_SIZE,
    marginTop: -(SCAN_SIZE / 2),
    flexDirection: 'row',
  },
  overlaySide: { flex: 1, backgroundColor: OVERLAY_BG },
  overlayBottom: {
    position: 'absolute',
    top: '50%',
    left: 0,
    right: 0,
    bottom: 0,
    marginTop: SCAN_SIZE / 2,
    backgroundColor: OVERLAY_BG,
  },

  // Transparent scan frame
  scanFrame: {
    width: SCAN_SIZE,
    height: SCAN_SIZE,
    overflow: 'hidden',
  },
  scanFrameSuccess: {},

  // Corner brackets
  corner: { position: 'absolute', width: CORNER, height: CORNER, borderColor: '#FFF' },
  cTL: { top: 0, left: 0, borderTopWidth: BORDER_W, borderLeftWidth: BORDER_W },
  cTR: { top: 0, right: 0, borderTopWidth: BORDER_W, borderRightWidth: BORDER_W },
  cBL: { bottom: 0, left: 0, borderBottomWidth: BORDER_W, borderLeftWidth: BORDER_W },
  cBR: { bottom: 0, right: 0, borderBottomWidth: BORDER_W, borderRightWidth: BORDER_W },

  // Animated scan line
  scanLine: {
    position: 'absolute',
    left: 10,
    right: 10,
    height: 2,
    borderRadius: 1,
    backgroundColor: '#14248A',
    shadowColor: '#14248A',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.9,
    shadowRadius: 5,
    elevation: 4,
  },

  // Success overlay inside scan frame
  successOverlay: {
    ...StyleSheet.absoluteFillObject,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(16,185,129,0.18)',
  },
  successCircle: {
    width: 74,
    height: 74,
    borderRadius: 37,
    backgroundColor: '#10B981',
    alignItems: 'center',
    justifyContent: 'center',
  },

  // Top instruction banner
  topBanner: {
    position: 'absolute',
    top: 80,
    left: 0,
    right: 0,
    alignItems: 'center',
    gap: 6,
  },
  instruction: { ...Typography.h3, color: '#FFF', textAlign: 'center' },
  devNote: { ...Typography.caption, color: '#F59E0B' },

  // Close
  closeBtn: {
    position: 'absolute',
    top: 56,
    right: Spacing.lg,
    width: 42,
    height: 42,
    borderRadius: 21,
    backgroundColor: 'rgba(0,0,0,0.55)',
    alignItems: 'center',
    justifyContent: 'center',
  },

  // Bottom controls
  controls: {
    position: 'absolute',
    bottom: 56,
    left: 0,
    right: 0,
    alignItems: 'center',
    gap: Spacing.lg,
  },
  torchBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
    backgroundColor: 'rgba(255,255,255,0.16)',
    paddingHorizontal: Spacing.xl,
    paddingVertical: Spacing.sm,
    borderRadius: BorderRadius.full,
  },
  torchLabel: { ...Typography.captionMedium, color: '#FFF' },
  manualLink: {
    ...Typography.body,
    color: 'rgba(255,255,255,0.72)',
    textDecorationLine: 'underline',
  },

  // Manual entry modal
  manualOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.55)',
    justifyContent: 'flex-end',
  },
  manualCard: {
    backgroundColor: '#FFF',
    padding: Spacing.xl,
    paddingBottom: 40,
    borderTopLeftRadius: BorderRadius.xl,
    borderTopRightRadius: BorderRadius.xl,
    gap: Spacing.md,
  },
  manualTitle: { ...Typography.h3, color: '#111' },
  manualSub: { ...Typography.body, color: '#6B7280' },
  manualInput: {
    borderWidth: 1.5,
    borderColor: '#E5E7EB',
    borderRadius: BorderRadius.md,
    padding: Spacing.md,
    fontSize: 26,
    letterSpacing: 10,
    textAlign: 'center',
    color: '#111',
  },
  manualConfirm: {
    backgroundColor: '#14248A',
    borderRadius: BorderRadius.md,
    padding: Spacing.md,
    alignItems: 'center',
  },
  manualConfirmText: { ...Typography.button, color: '#FFF' },
  manualCancel: {
    ...Typography.body,
    color: '#6B7280',
    textAlign: 'center',
    paddingVertical: Spacing.sm,
  },
});
