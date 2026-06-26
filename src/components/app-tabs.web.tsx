import { Image } from 'expo-image';
import { GlassView } from 'expo-glass-effect';
import {
  TabList,
  TabListProps,
  Tabs,
  TabSlot,
  TabTrigger,
  TabTriggerSlotProps,
} from 'expo-router/ui';
import { Pressable, StyleSheet, View } from 'react-native';

import { ThemedText } from './themed-text';

import { MaxContentWidth, Spacing } from '@/constants/theme';

export default function AppTabs() {
  return (
    <Tabs>
      <TabSlot style={{ height: '100%' }} />
      <TabList asChild>
        <CustomTabList>
          <TabTrigger name="home" href="/" asChild>
            <TabButton iconSource={require('@/assets/images/tabIcons/home.png')}>Planner</TabButton>
          </TabTrigger>
          <TabTrigger name="explore" href="/explore" asChild>
            <TabButton iconSource={require('@/assets/images/tabIcons/explore.png')}>Insights</TabButton>
          </TabTrigger>
        </CustomTabList>
      </TabList>
    </Tabs>
  );
}

export function TabButton({
  children,
  isFocused,
  iconSource,
  ...props
}: TabTriggerSlotProps & { iconSource: any }) {
  const isActive = Boolean(isFocused);

  return (
    <Pressable {...props} style={({ pressed }) => [styles.tabButton, pressed && styles.pressed]}>
      <View style={[styles.tabButtonView, isActive && styles.tabButtonViewActive]}>
        <Image
          source={iconSource}
          style={styles.tabIcon}
          contentFit="contain"
          tintColor="#000000"
        />
        <ThemedText type="smallBold" style={styles.tabLabel}>
          {children}
        </ThemedText>
      </View>
    </Pressable>
  );
}

export function CustomTabList(props: TabListProps) {
  return (
    <View {...props} style={styles.tabListContainer}>
      <GlassView
        colorScheme="light"
        glassEffectStyle="regular"
        tintColor="rgba(255,255,255,0.72)"
        style={styles.innerContainer}>
        {props.children}
      </GlassView>
    </View>
  );
}

const styles = StyleSheet.create({
  tabListContainer: {
    position: 'absolute',
    width: '100%',
    paddingHorizontal: Spacing.three,
    paddingBottom: Spacing.four,
    justifyContent: 'center',
    alignItems: 'center',
    flexDirection: 'row',
    bottom: 0,
  },
  innerContainer: {
    paddingVertical: 10,
    paddingHorizontal: Spacing.three,
    borderRadius: 999,
    flexDirection: 'row',
    alignItems: 'center',
    flexGrow: 1,
    gap: Spacing.two,
    maxWidth: MaxContentWidth,
    justifyContent: 'center',
    backgroundColor: 'rgba(255,255,255,0.72)',
    borderWidth: 1,
    borderColor: 'rgba(15,23,42,0.08)',
    shadowColor: '#0f172a',
    shadowOpacity: 0.12,
    shadowRadius: 22,
    shadowOffset: { width: 0, height: 12 },
    elevation: 8,
  },
  tabButton: {
    flex: 1,
    alignItems: 'center',
  },
  pressed: {
    opacity: 0.8,
  },
  tabButtonView: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.one,
    paddingVertical: 10,
    paddingHorizontal: Spacing.three,
    borderRadius: 999,
    minWidth: 100,
    justifyContent: 'center',
  },
  tabButtonViewActive: {
    backgroundColor: 'rgba(219,234,254,0.9)',
    borderWidth: 1,
    borderColor: 'rgba(37,99,235,0.16)',
    transform: [{ scale: 1.02 }],
  },
  tabIcon: {
    width: 16,
    height: 16,
  },
  tabLabel: {
    color: '#000000',
    fontSize: 13,
  },
});
