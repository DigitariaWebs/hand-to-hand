import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, useColorScheme, Platform } from 'react-native';
import QRCode from 'react-native-qrcode-svg';
import { Colors } from '@/constants/Colors';
import { Typography } from '@/constants/Typography';
import { Spacing, BorderRadius } from '@/constants/Spacing';
import type { QRPayload, HandoffRole } from '@/types/logistics';

type Props = {
  payload: QRPayload;
  validitySeconds?: number;
};

const ROLE_LABELS: Record<HandoffRole, string> = {
  seller: 'Présentez ce code au transporteur',
  transporter_pickup: 'En attente du vendeur',
  transporter_delivery: "Présentez ce code à l'acheteur",
};

const MONO_FONT = Platform.select({ ios: 'Courier', android: 'monospace', default: 'monospace' });

export function QRGenerator({ payload, validitySeconds = 600 }: Props) {
  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';
  const theme = isDark ? Colors.dark : Colors.light;
  const [remaining, setRemaining] = useState(validitySeconds);

  useEffect(() => {
    if (remaining <= 0) return;
    const id = setInterval(() => setRemaining((prev) => Math.max(0, prev - 1)), 1000);
    return () => clearInterval(id);
  }, [remaining]);

  const mins = Math.floor(remaining / 60);
  const secs = remaining % 60;
  const isExpiring = remaining > 0 && remaining < 60;
  const isExpired = remaining === 0;

  const qrValue = JSON.stringify(payload);
  const ref = `#HTH-${payload.transactionId.replace(/[^A-Z0-9]/gi, '').slice(-8).toUpperCase()}`;

  return (
    <View style={[styles.card, { backgroundColor: theme.surface, borderColor: theme.border }]}>
      {/* QR code always on white background for scannability */}
      <View style={[styles.qrBox, { opacity: isExpired ? 0.25 : 1 }]}>
        <QRCode
          value={qrValue}
          size={200}
          color="#111111"
          backgroundColor="#FFFFFF"
        />
      </View>

      <Text style={[styles.instruction, { color: theme.text }]}>
        {ROLE_LABELS[payload.role]}
      </Text>

      <Text style={[styles.ref, { color: theme.textSecondary, fontFamily: MONO_FONT }]}>
        {ref}
      </Text>

      <View
        style={[
          styles.timerPill,
          {
            backgroundColor: isExpired
              ? `${theme.error}18`
              : isExpiring
              ? `${theme.warning}18`
              : `${theme.primary}12`,
          },
        ]}
      >
        {isExpired ? (
          <Text style={[styles.timerText, { color: theme.error }]}>
            QR expiré — veuillez rafraîchir
          </Text>
        ) : (
          <Text
            style={[
              styles.timerText,
              { color: isExpiring ? theme.warning : theme.primary },
            ]}
          >
            Valide pendant {mins}:{String(secs).padStart(2, '0')}
          </Text>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    alignItems: 'center',
    padding: Spacing.xl,
    borderRadius: BorderRadius.lg,
    borderWidth: 1,
    gap: Spacing.md,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 3,
  },
  qrBox: {
    padding: Spacing.md,
    borderRadius: BorderRadius.md,
    backgroundColor: '#FFFFFF',
  },
  instruction: {
    ...Typography.bodyMedium,
    textAlign: 'center',
    marginTop: Spacing.xs,
  },
  ref: {
    fontSize: 13,
    letterSpacing: 2,
  },
  timerPill: {
    paddingHorizontal: Spacing.lg,
    paddingVertical: 6,
    borderRadius: BorderRadius.full,
  },
  timerText: {
    ...Typography.captionMedium,
  },
});
