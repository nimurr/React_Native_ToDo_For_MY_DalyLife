import { Image } from 'expo-image';
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
import { ThemedView } from './themed-view';

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
  return (
    <Pressable {...props} style={({ pressed }) => [styles.tabButton, pressed && styles.pressed]}>
      <ThemedView type={isFocused ? 'backgroundSelected' : 'backgroundElement'} style={styles.tabButtonView}>
        <Image source={iconSource} style={styles.tabIcon} contentFit="contain" />
        <ThemedText type="small" themeColor={isFocused ? 'text' : 'textSecondary'}>
          {children}
        </ThemedText>
      </ThemedView>
    </Pressable>
  );
}

export function CustomTabList(props: TabListProps) {
  return (
    <View {...props} style={styles.tabListContainer}>
      <ThemedView type="backgroundElement" style={styles.innerContainer}>
        {props.children}
      </ThemedView>
    </View>
  );
}

const styles = StyleSheet.create({
  tabListContainer: {
    position: 'absolute',
    width: '100%',
    padding: Spacing.three,
    justifyContent: 'center',
    alignItems: 'center',
    flexDirection: 'row',
    bottom: 0,
  },
  innerContainer: {
    paddingVertical: Spacing.two,
    paddingHorizontal: Spacing.three,
    borderRadius: Spacing.five,
    flexDirection: 'row',
    alignItems: 'center',
    flexGrow: 1,
    gap: Spacing.two,
    maxWidth: MaxContentWidth,
    justifyContent: 'center',
  },
  tabButton: {
    flex: 1,
    alignItems: 'center',
  },
  pressed: {
    opacity: 0.75,
  },
  tabButtonView: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.one,
    paddingVertical: Spacing.one,
    paddingHorizontal: Spacing.three,
    borderRadius: Spacing.three,
    minWidth: 100,
    justifyContent: 'center',
  },
  tabIcon: {
    width: 16,
    height: 16,
  },
});
