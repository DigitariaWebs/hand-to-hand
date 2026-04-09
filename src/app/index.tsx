import { View, StyleSheet, Dimensions } from "react-native";
import { useVideoPlayer, VideoView } from "expo-video";
import { useEventListener } from "expo";
import { Image } from "expo-image";
import { useRouter } from "expo-router";
import { useRef, useState, useEffect } from "react";
import Animated, {
  useSharedValue,
  withTiming,
  useAnimatedStyle,
} from "react-native-reanimated";
import { storage, StorageKeys } from "@/utils/storage";

const { width: W } = Dimensions.get("window");

export default function SplashScreen() {
  const router = useRouter();
  const hasNavigated = useRef(false);
  const [videoError, setVideoError] = useState(false);
  const logoOpacity = useSharedValue(0);

  // Destination defaults to onboarding; updated async once storage is read.
  // SecureStore resolves in < 50 ms — well before `playToEnd` fires.
  const destinationRef = useRef<"/(tabs)" | "/(onboarding)">("/(onboarding)");

  useEffect(() => {
    // DEV: uncomment next line to always show onboarding
    storage.remove(StorageKeys.HAS_ONBOARDED).then(() => {});
    storage.getBoolean(StorageKeys.HAS_ONBOARDED).then((hasOnboarded) => {
      destinationRef.current = hasOnboarded ? "/(tabs)" : "/(onboarding)";
    });
  }, []);

  // Called exactly once — guard prevents duplicate navigation if both events fire.
  const navigate = () => {
    if (hasNavigated.current) return;
    hasNavigated.current = true;
    router.replace(destinationRef.current);
  };

  const player = useVideoPlayer(
    require("../../assets/videos/logo.mp4"),
    (p) => {
      p.loop = false;
      p.muted = true;
      p.playbackRate = 2.0;
      p.play();
    },
  );

  // Video played all the way through — short pause then navigate.
  useEventListener(player, "playToEnd", () => {
    setTimeout(navigate, 500);
  });

  // Status changes — catch errors and show logo.png fallback.
  useEventListener(player, "statusChange", ({ status, error }) => {
    if (status === "error" || error) {
      setVideoError(true);
      logoOpacity.value = withTiming(1, { duration: 800 });
      setTimeout(navigate, 2000);
    }
  });

  const logoStyle = useAnimatedStyle(() => ({
    opacity: logoOpacity.value,
  }));

  return (
    <View style={styles.container}>
      {!videoError ? (
        <VideoView
          player={player}
          style={styles.video}
          contentFit="contain"
          nativeControls={false}
        />
      ) : (
        <Animated.View style={logoStyle}>
          <Image
            source={require("../../assets/images/logo.png")}
            style={styles.logo}
            contentFit="contain"
          />
        </Animated.View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#FFFFFF",
    alignItems: "center",
    justifyContent: "center",
  },
  video: {
    width: W * 0.6,
    height: W * 0.6,
  },
  logo: {
    width: W * 0.5,
    height: W * 0.5,
  },
});
