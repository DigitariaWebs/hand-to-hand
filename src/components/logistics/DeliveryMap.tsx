import React, { useEffect, useRef, useState } from 'react';
import { View, Text, StyleSheet, useColorScheme } from 'react-native';
import Mapbox, { Camera, MapView, MarkerView, ShapeSource, LineLayer } from '@rnmapbox/maps';
import { Feather } from '@expo/vector-icons';
import { Colors } from '@/constants/Colors';
import { Typography } from '@/constants/Typography';
import { Spacing, BorderRadius } from '@/constants/Spacing';

// Set EXPO_PUBLIC_MAPBOX_TOKEN in .env.local or EAS secrets
const MAPBOX_PUBLIC_TOKEN = process.env.EXPO_PUBLIC_MAPBOX_TOKEN ?? '';

Mapbox.setAccessToken(MAPBOX_PUBLIC_TOKEN);

type Props = {
  originCoords: [number, number]; // [lng, lat]
  destinationCoords: [number, number];
  originLabel: string;
  destinationLabel: string;
  simulateMovement?: boolean;
  progress?: number; // 0-1 along the route
};

// Interpolate between two points
function interpolate(a: [number, number], b: [number, number], t: number): [number, number] {
  return [a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t];
}

// Generate a simple curved route between two points
function generateRoute(origin: [number, number], dest: [number, number]): [number, number][] {
  const points: [number, number][] = [];
  const steps = 50;
  const midLng = (origin[0] + dest[0]) / 2;
  const midLat = (origin[1] + dest[1]) / 2;
  // Add a slight curve offset
  const dx = dest[0] - origin[0];
  const dy = dest[1] - origin[1];
  const offsetLng = midLng - dy * 0.08;
  const offsetLat = midLat + dx * 0.08;

  for (let i = 0; i <= steps; i++) {
    const t = i / steps;
    // Quadratic bezier
    const lng = (1 - t) * (1 - t) * origin[0] + 2 * (1 - t) * t * offsetLng + t * t * dest[0];
    const lat = (1 - t) * (1 - t) * origin[1] + 2 * (1 - t) * t * offsetLat + t * t * dest[1];
    points.push([lng, lat]);
  }
  return points;
}

export function DeliveryMap({
  originCoords,
  destinationCoords,
  originLabel,
  destinationLabel,
  simulateMovement = true,
  progress: externalProgress,
}: Props) {
  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';
  const theme = isDark ? Colors.dark : Colors.light;

  const route = useRef(generateRoute(originCoords, destinationCoords)).current;
  const [progress, setProgress] = useState(externalProgress ?? 0.3);

  // Simulate transporter movement
  useEffect(() => {
    if (!simulateMovement || externalProgress !== undefined) return;
    const interval = setInterval(() => {
      setProgress((p) => {
        if (p >= 0.95) return 0.3;
        return p + 0.003;
      });
    }, 100);
    return () => clearInterval(interval);
  }, [simulateMovement, externalProgress]);

  useEffect(() => {
    if (externalProgress !== undefined) setProgress(externalProgress);
  }, [externalProgress]);

  const transporterIndex = Math.min(Math.floor(progress * route.length), route.length - 1);
  const transporterPos = route[transporterIndex];

  // Calculate center and zoom
  const centerLng = (originCoords[0] + destinationCoords[0]) / 2;
  const centerLat = (originCoords[1] + destinationCoords[1]) / 2;

  const routeGeoJSON: GeoJSON.FeatureCollection = {
    type: 'FeatureCollection',
    features: [
      {
        type: 'Feature',
        properties: {},
        geometry: {
          type: 'LineString',
          coordinates: route,
        },
      },
    ],
  };

  // Completed portion of route
  const completedRoute = route.slice(0, transporterIndex + 1);
  const completedGeoJSON: GeoJSON.FeatureCollection = {
    type: 'FeatureCollection',
    features: [
      {
        type: 'Feature',
        properties: {},
        geometry: {
          type: 'LineString',
          coordinates: completedRoute,
        },
      },
    ],
  };

  return (
    <View style={[styles.container, { borderColor: theme.border }]}>
      <MapView
        style={styles.map}
        styleURL={isDark ? 'mapbox://styles/mapbox/dark-v11' : 'mapbox://styles/mapbox/light-v11'}
        logoEnabled={false}
        attributionEnabled={false}
        scaleBarEnabled={false}
      >
        <Camera
          centerCoordinate={[centerLng, centerLat]}
          zoomLevel={7.5}
          animationMode="flyTo"
          animationDuration={1000}
        />

        {/* Full route line (gray) */}
        <ShapeSource id="route" shape={routeGeoJSON}>
          <LineLayer
            id="routeLine"
            style={{
              lineColor: isDark ? '#555' : '#D1D5DB',
              lineWidth: 3,
              lineCap: 'round',
              lineJoin: 'round',
            }}
          />
        </ShapeSource>

        {/* Completed route (primary color) */}
        <ShapeSource id="completedRoute" shape={completedGeoJSON}>
          <LineLayer
            id="completedLine"
            style={{
              lineColor: theme.primary,
              lineWidth: 4,
              lineCap: 'round',
              lineJoin: 'round',
            }}
          />
        </ShapeSource>

        {/* Origin marker */}
        <MarkerView coordinate={originCoords}>
          <View style={[styles.marker, { backgroundColor: theme.success }]}>
            <Feather name="map-pin" size={12} color="#FFF" />
          </View>
        </MarkerView>

        {/* Destination marker */}
        <MarkerView coordinate={destinationCoords}>
          <View style={[styles.marker, { backgroundColor: theme.error }]}>
            <Feather name="flag" size={12} color="#FFF" />
          </View>
        </MarkerView>

        {/* Transporter marker (animated) */}
        <MarkerView coordinate={transporterPos} anchor={{ x: 0.5, y: 0.5 }}>
          <View style={[styles.transporterMarker, { backgroundColor: theme.primary }]}>
            <Feather name="truck" size={14} color="#FFF" />
          </View>
        </MarkerView>
      </MapView>

      {/* Legend overlay */}
      <View style={[styles.legend, { backgroundColor: isDark ? 'rgba(26,26,30,0.9)' : 'rgba(255,255,255,0.92)' }]}>
        <View style={styles.legendRow}>
          <View style={[styles.legendDot, { backgroundColor: theme.success }]} />
          <Text style={[styles.legendText, { color: theme.text }]} numberOfLines={1}>{originLabel}</Text>
        </View>
        <View style={styles.legendRow}>
          <View style={[styles.legendDot, { backgroundColor: theme.error }]} />
          <Text style={[styles.legendText, { color: theme.text }]} numberOfLines={1}>{destinationLabel}</Text>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    height: 220,
    borderRadius: BorderRadius.lg,
    borderWidth: 1,
    overflow: 'hidden',
  },
  map: {
    flex: 1,
  },
  marker: {
    width: 28,
    height: 28,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: '#FFF',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 3,
    elevation: 5,
  },
  transporterMarker: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2.5,
    borderColor: '#FFF',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 5,
  },
  legend: {
    position: 'absolute',
    bottom: Spacing.sm,
    left: Spacing.sm,
    paddingHorizontal: Spacing.sm,
    paddingVertical: Spacing.xs,
    borderRadius: BorderRadius.sm,
    gap: 2,
  },
  legendRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.xs,
  },
  legendDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  legendText: {
    ...Typography.caption,
    fontSize: 10,
    maxWidth: 140,
  },
});
