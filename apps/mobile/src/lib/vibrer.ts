type Haptics = typeof import('expo-haptics');

// A build made before expo-haptics has no native module, so the import throws and haptics stay off.
let haptics: Haptics | null = null;
try {
  haptics = require('expo-haptics') as Haptics;
} catch {
  haptics = null;
}

export const vibrer = {
  succes: () => {
    haptics?.notificationAsync(haptics.NotificationFeedbackType.Success).catch(() => {});
  },
  leger: () => {
    haptics?.impactAsync(haptics.ImpactFeedbackStyle.Light).catch(() => {});
  },
  selection: () => {
    haptics?.selectionAsync().catch(() => {});
  },
};
