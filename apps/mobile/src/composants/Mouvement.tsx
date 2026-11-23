import { type ReactNode, useState } from 'react';
import { Pressable, type PressableProps } from 'react-native';
import Animated, { cubicBezier, Easing, Keyframe } from 'react-native-reanimated';

export const EASE_OUT = Easing.bezier(0.23, 1, 0.32, 1);
const CSS_EASE_OUT = cubicBezier(0.23, 1, 0.32, 1);

// A message or card that rises into place, never from nothing.
export const entreeDouce = new Keyframe({
  0: { opacity: 0, transform: [{ translateY: 12 }, { scale: 0.96 }] },
  100: { opacity: 1, transform: [{ translateY: 0 }, { scale: 1 }], easing: EASE_OUT },
}).duration(280);

// A status or a success mark that lands with a short overshoot.
export const entreePop = new Keyframe({
  0: { opacity: 0, transform: [{ scale: 0.6 }] },
  60: { opacity: 1, transform: [{ scale: 1.08 }], easing: EASE_OUT },
  100: { opacity: 1, transform: [{ scale: 1 }], easing: EASE_OUT },
}).duration(420);

// Press feedback: a 0.97 scale on press-in, back on release.
export function Appui({ children, style, ...props }: PressableProps & { children: ReactNode }) {
  const [enfonce, setEnfonce] = useState(false);
  return (
    <Pressable
      {...props}
      onPressIn={(e) => {
        setEnfonce(true);
        props.onPressIn?.(e);
      }}
      onPressOut={(e) => {
        setEnfonce(false);
        props.onPressOut?.(e);
      }}
    >
      <Animated.View
        style={[
          style as object,
          {
            transform: [{ scale: enfonce ? 0.94 : 1 }],
            transitionProperty: 'transform',
            transitionDuration: 140,
            transitionTimingFunction: CSS_EASE_OUT,
          },
        ]}
      >
        {children}
      </Animated.View>
    </Pressable>
  );
}

// Three dots that rise in turn while Yosr writes.
export function PointsEcriture({ couleur }: { couleur: string }) {
  return (
    <Animated.View style={{ flexDirection: 'row', gap: 5, paddingVertical: 6 }}>
      {[0, 1, 2].map((i) => (
        <Animated.View
          key={i}
          style={{
            width: 7,
            height: 7,
            borderRadius: 4,
            backgroundColor: couleur,
            animationName: {
              '0%': { opacity: 0.3, transform: [{ translateY: 0 }] },
              '30%': { opacity: 1, transform: [{ translateY: -4 }] },
              '60%': { opacity: 0.3, transform: [{ translateY: 0 }] },
              '100%': { opacity: 0.3, transform: [{ translateY: 0 }] },
            },
            animationDuration: 1000,
            animationDelay: i * 160,
            animationIterationCount: 'infinite',
            animationTimingFunction: 'ease-in-out',
          }}
        />
      ))}
    </Animated.View>
  );
}
