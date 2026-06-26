import { NativeTabs } from 'expo-router/unstable-native-tabs';

export default function AppTabs() {
  return (
    <NativeTabs
      backgroundColor="#fffffff0"
      blurEffect="systemChromeMaterialLight"
      iconColor={{ selected: '#000000', default: '#000000' }}
      indicatorColor="#dbeafe"
      labelStyle={{
        selected: { color: '#000000', fontWeight: '700' },
        default: { color: '#000000', fontWeight: '600' },
      }}
      shadowColor="#dbe3ec"
      tintColor="#000000">
      <NativeTabs.Trigger name="index">
        <NativeTabs.Trigger.Label>Planner</NativeTabs.Trigger.Label>
        <NativeTabs.Trigger.Icon
          src={require('@/assets/images/tabIcons/home.png')}
          renderingMode="template"
        />
      </NativeTabs.Trigger>

      <NativeTabs.Trigger name="explore">
        <NativeTabs.Trigger.Label>Insights</NativeTabs.Trigger.Label>
        <NativeTabs.Trigger.Icon
          src={require('@/assets/images/tabIcons/explore.png')}
          renderingMode="template"
        />
      </NativeTabs.Trigger>
    </NativeTabs>
  );
}
