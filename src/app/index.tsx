import AsyncStorage from '@react-native-async-storage/async-storage';
import { useEffect, useMemo, useRef, useState } from 'react';
import {
  Alert,
  Animated,
  Easing,
  Pressable,
  ScrollView,
  StyleSheet,
  TextInput,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { MaxContentWidth, Spacing } from '@/constants/theme';

type PlannerSection = 'university' | 'office' | 'personal';
type PlannerItemType = 'task' | 'meeting' | 'reminder' | 'exam' | 'expense' | 'income';

type PlannerItem = {
  id: string;
  section: PlannerSection;
  title: string;
  details: string;
  dueDate: string;
  completed: boolean;
  type: PlannerItemType;
  amount: string;
};

type SectionMeta = {
  label: string;
  subtitle: string;
  accent: [string, string];
  typeOptions: { label: string; value: PlannerItemType }[];
};

type ToastMessage = {
  text: string;
  type: 'success' | 'error';
};

const storageKey = 'personal-planner-v1';

const sectionMeta: Record<PlannerSection, SectionMeta> = {
  university: {
    label: 'University',
    subtitle: 'Study plans, deadlines, and course work',
    accent: ['#2563eb', '#4f46e5'],
    typeOptions: [
      { label: 'Task', value: 'task' },
      { label: 'Exam', value: 'exam' },
      { label: 'Reminder', value: 'reminder' },
    ],
  },
  office: {
    label: 'Office',
    subtitle: 'Meetings, work blocks, and follow-ups',
    accent: ['#7c3aed', '#4338ca'],
    typeOptions: [
      { label: 'Task', value: 'task' },
      { label: 'Meeting', value: 'meeting' },
      { label: 'Reminder', value: 'reminder' },
    ],
  },
  personal: {
    label: 'Personal',
    subtitle: 'Life notes and money management',
    accent: ['#0f766e', '#14b8a6'],
    typeOptions: [
      { label: 'Task', value: 'task' },
      { label: 'Expense', value: 'expense' },
      { label: 'Income', value: 'income' },
    ],
  },
};

const createEmptyDraft = (section: PlannerSection) => ({
  section,
  title: '',
  details: '',
  dueDate: '',
  amount: '',
  type: sectionMeta[section].typeOptions[0].value,
});

function padDatePart(value: number) {
  return `${value}`.padStart(2, '0');
}

function formatDateTime(date: Date) {
  return `${date.getFullYear()}-${padDatePart(date.getMonth() + 1)}-${padDatePart(date.getDate())} ${padDatePart(
    date.getHours(),
  )}:${padDatePart(date.getMinutes())}`;
}

function parseDateTime(value: string) {
  const fallback = new Date();
  fallback.setHours(9, 0, 0, 0);

  if (!value) {
    return fallback;
  }

  const [datePart, timePart = '09:00'] = value.split(' ');
  const [year, month, day] = datePart.split('-').map(Number);
  const [hour, minute] = timePart.split(':').map(Number);

  if (!year || !month || !day) {
    return fallback;
  }

  const parsed = new Date(year, month - 1, day, hour || 0, minute || 0, 0, 0);
  return Number.isNaN(parsed.getTime()) ? fallback : parsed;
}

export default function HomeScreen() {
  const [items, setItems] = useState<PlannerItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeSection, setActiveSection] = useState<PlannerSection>('university');
  const [draft, setDraft] = useState(createEmptyDraft('university'));
  const [editingId, setEditingId] = useState<string | null>(null);
  const [datePickerOpen, setDatePickerOpen] = useState(false);
  const [toast, setToast] = useState<ToastMessage | null>(null);
  const spinValue = useRef(new Animated.Value(0)).current;
  const toastTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const showToast = (text: string, type: ToastMessage['type'] = 'success') => {
    if (toastTimer.current) {
      clearTimeout(toastTimer.current);
    }

    setToast({ text, type });
    toastTimer.current = setTimeout(() => setToast(null), 2400);
  };

  useEffect(() => {
    const loadItems = async () => {
      try {
        const raw = await AsyncStorage.getItem(storageKey);
        if (raw) {
          setItems(JSON.parse(raw) as PlannerItem[]);
        }
      } catch (error) {
        console.warn('Unable to load planner data', error);
        showToast('Unable to load planner data.', 'error');
      } finally {
        setLoading(false);
      }
    };

    loadItems();
  }, []);

  useEffect(() => {
    if (!loading) {
      AsyncStorage.setItem(storageKey, JSON.stringify(items)).catch((error) => {
        console.warn('Unable to save planner data', error);
        showToast('Unable to save latest change.', 'error');
      });
    }
  }, [items, loading]);

  useEffect(() => {
    if (!loading) {
      return;
    }

    const animation = Animated.loop(
      Animated.timing(spinValue, {
        toValue: 1,
        duration: 850,
        easing: Easing.linear,
        useNativeDriver: true,
      }),
    );

    animation.start();
    return () => animation.stop();
  }, [loading, spinValue]);

  useEffect(() => {
    return () => {
      if (toastTimer.current) {
        clearTimeout(toastTimer.current);
      }
    };
  }, []);

  const visibleItems = useMemo(() => {
    return [...items]
      .filter((item) => item.section === activeSection)
      .sort((a, b) => Number(a.completed) - Number(b.completed) || a.dueDate.localeCompare(b.dueDate));
  }, [activeSection, items]);

  const sectionSummary = useMemo(() => {
    const sectionItems = items.filter((item) => item.section === activeSection);
    const completed = sectionItems.filter((item) => item.completed).length;
    const pending = sectionItems.length - completed;
    const amounts = sectionItems
      .filter((item) => item.section === 'personal' && item.amount)
      .map((item) => Number(item.amount))
      .filter((amount) => Number.isFinite(amount));
    const income = amounts.filter((amount) => amount > 0).reduce((sum, amount) => sum + amount, 0);
    const expense = Math.abs(amounts.filter((amount) => amount < 0).reduce((sum, amount) => sum + amount, 0));

    return { completed, pending, income, expense };
  }, [activeSection, items]);

  const resetForm = () => {
    setDraft(createEmptyDraft(activeSection));
    setEditingId(null);
    setDatePickerOpen(false);
  };

  const adjustDraftDateTime = (changeDate: (date: Date) => void) => {
    const nextDate = parseDateTime(draft.dueDate);
    changeDate(nextDate);
    setDraft((current) => ({ ...current, dueDate: formatDateTime(nextDate) }));
  };

  const handleSubmit = () => {
    if (!draft.title.trim()) {
      Alert.alert('Need a title', 'Please add a short title before saving.');
      showToast('Please add a title first.', 'error');
      return;
    }

    const normalizedAmount = draft.amount.trim();
    if (draft.section === 'personal' && draft.type !== 'task' && !normalizedAmount) {
      Alert.alert('Need an amount', 'Please add a value for this money entry.');
      showToast('Please add an amount first.', 'error');
      return;
    }

    const payload: PlannerItem = {
      id: editingId ?? `${Date.now()}`,
      section: draft.section,
      title: draft.title.trim(),
      details: draft.details.trim(),
      dueDate: draft.dueDate || formatDateTime(new Date()),
      completed: editingId ? items.find((item) => item.id === editingId)?.completed ?? false : false,
      type: draft.type,
      amount: draft.section === 'personal' && draft.type !== 'task' ? normalizedAmount : '',
    };

    if (editingId) {
      setItems((current) => current.map((item) => (item.id === editingId ? payload : item)));
      showToast('Item updated successfully.');
    } else {
      setItems((current) => [payload, ...current]);
      showToast('Item added successfully.');
    }

    resetForm();
  };

  const beginEdit = (item: PlannerItem) => {
    setEditingId(item.id);
    setActiveSection(item.section);
    setDraft({
      section: item.section,
      title: item.title,
      details: item.details,
      dueDate: item.dueDate,
      amount: item.amount,
      type: item.type,
    });
    setDatePickerOpen(false);
    showToast('Editing selected item.');
  };

  const toggleComplete = (itemId: string) => {
    setItems((current) =>
      current.map((item) => (item.id === itemId ? { ...item, completed: !item.completed } : item)),
    );
    showToast('Item status updated.');
  };

  const deleteItem = (itemId: string) => {
    Alert.alert('Delete this item?', 'This will remove it from your planner.', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: () => {
          let didDelete = false;

          setItems((current) => {
            if (!current.some((item) => item.id === itemId)) {
              return current;
            }

            didDelete = true;
            return current.filter((item) => item.id !== itemId);
          });

          if (editingId === itemId) {
            resetForm();
          }

          showToast(didDelete ? 'Item deleted successfully.' : 'Could not find that item.', didDelete ? 'success' : 'error');
        },
      },
    ]);
  };

  const selectSection = (section: PlannerSection) => {
    setActiveSection(section);
    setDraft(createEmptyDraft(section));
    setEditingId(null);
    setDatePickerOpen(false);
    showToast(`${sectionMeta[section].label} selected.`);
  };

  const currentMeta = sectionMeta[activeSection];
  const spin = spinValue.interpolate({ inputRange: [0, 1], outputRange: ['0deg', '360deg'] });

  if (loading) {
    return (
      <ThemedView style={styles.loadingContainer}>
        <Animated.View style={[styles.spinner, { transform: [{ rotate: spin }] }]} />
        <ThemedText type="subtitle" style={styles.loadingText}>
          Loading planner...
        </ThemedText>
      </ThemedView>
    );
  }

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.backgroundGradient}>
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
          contentInsetAdjustmentBehavior="automatic">
          <View style={styles.heroCard}>
            <ThemedText type="title" style={styles.heroTitle}>
              Personal Planner
            </ThemedText>
            <ThemedText type="small" style={styles.heroSubtitle}>
              Keep university priorities, office work, and personal finance in one calm, private place.
            </ThemedText>
          </View>

          <View style={styles.summaryRow}>
            <View style={styles.summaryCard}>
              <ThemedText type="smallBold" style={styles.cardLabel}>
                {currentMeta.label}
              </ThemedText>
              <ThemedText type="title" style={styles.summaryNumber}>
                {sectionSummary.pending}
              </ThemedText>
              <ThemedText type="small" style={styles.mutedText}>
                pending items
              </ThemedText>
            </View>

            <View style={styles.summaryCard}>
              <ThemedText type="smallBold" style={styles.cardLabel}>
                Completed
              </ThemedText>
              <ThemedText type="title" style={styles.summaryNumber}>
                {sectionSummary.completed}
              </ThemedText>
              <ThemedText type="small" style={styles.mutedText}>
                checked off
              </ThemedText>
            </View>

            {activeSection === 'personal' ? (
              <View style={styles.summaryCard}>
                <ThemedText type="smallBold" style={styles.cardLabel}>
                  Cash flow
                </ThemedText>
                <ThemedText type="title" style={styles.summaryNumber}>
                  {sectionSummary.income - sectionSummary.expense >= 0 ? '+' : '-'}
                  {Math.abs(sectionSummary.income - sectionSummary.expense).toFixed(0)}
                </ThemedText>
                <ThemedText type="small" style={styles.mutedText}>
                  income minus expenses
                </ThemedText>
              </View>
            ) : null}
          </View>

          <View style={styles.sectionSwitch}>
            {(Object.keys(sectionMeta) as PlannerSection[]).map((section) => {
              const meta = sectionMeta[section];
              const selected = activeSection === section;
              return (
                <Pressable
                  key={section}
                  onPress={() => selectSection(section)}
                  style={({ pressed }) => [
                    styles.sectionButton,
                    selected && { backgroundColor: meta.accent[0], borderColor: meta.accent[0] },
                    pressed && styles.sectionButtonPressed,
                  ]}>
                  <ThemedText
                    type="smallBold"
                    style={[styles.sectionButtonText, selected && styles.sectionButtonTextSelected]}>
                    {meta.label}
                  </ThemedText>
                </Pressable>
              );
            })}
          </View>

          <View style={styles.formCard}>
            <ThemedText type="smallBold" style={styles.formTitle}>
              {editingId ? 'Update' : 'Add'} {currentMeta.label} item
            </ThemedText>
            <ThemedText type="small" style={styles.formSubtitle}>
              {currentMeta.subtitle}
            </ThemedText>

            <TextInput
              style={styles.input}
              placeholder="Enter title"
              placeholderTextColor="#64748b"
              value={draft.title}
              onChangeText={(value) => setDraft((current) => ({ ...current, title: value }))}
            />

            <TextInput
              style={[styles.input, styles.textArea]}
              placeholder="Add details or notes"
              placeholderTextColor="#64748b"
              multiline
              value={draft.details}
              onChangeText={(value) => setDraft((current) => ({ ...current, details: value }))}
            />

            <View style={styles.formRow}>
              <View style={styles.formCell}>
                <ThemedText type="small" style={styles.fieldLabel}>
                  Date & time
                </ThemedText>
                <Pressable style={styles.pickerButton} onPress={() => setDatePickerOpen((current) => !current)}>
                  <ThemedText type="smallBold" style={styles.pickerButtonText}>
                    {draft.dueDate || 'Pick date & time'}
                  </ThemedText>
                </Pressable>
              </View>

              <View style={styles.formCell}>
                <ThemedText type="small" style={styles.fieldLabel}>
                  {activeSection === 'personal' ? 'Amount' : 'Tag'}
                </ThemedText>
                <TextInput
                  style={styles.input}
                  placeholder={activeSection === 'personal' ? '120 or -50' : 'Optional'}
                  placeholderTextColor="#64748b"
                  value={draft.amount}
                  onChangeText={(value) => setDraft((current) => ({ ...current, amount: value }))}
                />
              </View>
            </View>

            {datePickerOpen ? (
              <View style={styles.datePickerPanel}>
                <View style={styles.pickerHeader}>
                  <ThemedText type="smallBold" style={styles.pickerTitle}>
                    Calendar + time
                  </ThemedText>
                  <Pressable onPress={() => setDatePickerOpen(false)}>
                    <ThemedText type="smallBold" style={styles.pickerDoneText}>
                      Done
                    </ThemedText>
                  </Pressable>
                </View>
                <View style={styles.pickerRow}>
                  <PickerStepButton
                    label="- Day"
                    onPress={() => adjustDraftDateTime((date) => {
                      date.setDate(date.getDate() - 1);
                    })}
                  />
                  <View style={styles.datePreview}>
                    <ThemedText type="smallBold" style={styles.datePreviewText}>
                      {draft.dueDate || formatDateTime(parseDateTime(''))}
                    </ThemedText>
                  </View>
                  <PickerStepButton
                    label="+ Day"
                    onPress={() => adjustDraftDateTime((date) => {
                      date.setDate(date.getDate() + 1);
                    })}
                  />
                </View>
                <View style={styles.pickerGrid}>
                  <PickerStepButton
                    label="- Month"
                    onPress={() => adjustDraftDateTime((date) => {
                      date.setMonth(date.getMonth() - 1);
                    })}
                  />
                  <PickerStepButton
                    label="+ Month"
                    onPress={() => adjustDraftDateTime((date) => {
                      date.setMonth(date.getMonth() + 1);
                    })}
                  />
                  <PickerStepButton
                    label="- Hour"
                    onPress={() => adjustDraftDateTime((date) => {
                      date.setHours(date.getHours() - 1);
                    })}
                  />
                  <PickerStepButton
                    label="+ Hour"
                    onPress={() => adjustDraftDateTime((date) => {
                      date.setHours(date.getHours() + 1);
                    })}
                  />
                  <PickerStepButton
                    label="- 15m"
                    onPress={() => adjustDraftDateTime((date) => {
                      date.setMinutes(date.getMinutes() - 15);
                    })}
                  />
                  <PickerStepButton
                    label="+ 15m"
                    onPress={() => adjustDraftDateTime((date) => {
                      date.setMinutes(date.getMinutes() + 15);
                    })}
                  />
                </View>
              </View>
            ) : null}

            <View style={styles.typeRow}>
              {currentMeta.typeOptions.map((option) => {
                const selected = draft.type === option.value;
                return (
                  <Pressable
                    key={option.value}
                    onPress={() => setDraft((current) => ({ ...current, type: option.value }))}
                    style={({ pressed }) => [
                      styles.typeChip,
                      selected && { backgroundColor: currentMeta.accent[0] },
                      pressed && styles.sectionButtonPressed,
                    ]}>
                    <ThemedText
                      type="smallBold"
                      style={[styles.typeChipText, selected && styles.typeChipTextSelected]}>
                      {option.label}
                    </ThemedText>
                  </Pressable>
                );
              })}
            </View>

            <View style={styles.actionRow}>
              <Pressable style={styles.primaryButton} onPress={handleSubmit}>
                <ThemedText type="smallBold" style={styles.primaryButtonText}>
                  {editingId ? 'Save changes' : 'Add item'}
                </ThemedText>
              </Pressable>
              {editingId ? (
                <Pressable
                  style={styles.secondaryButton}
                  onPress={() => {
                    resetForm();
                    showToast('Edit cancelled.');
                  }}>
                  <ThemedText type="smallBold" style={styles.secondaryButtonText}>
                    Cancel
                  </ThemedText>
                </Pressable>
              ) : null}
            </View>
          </View>

          <View style={styles.listCard}>
            <View style={styles.listHeader}>
              <ThemedText type="subtitle" style={styles.listTitle}>
                {currentMeta.label} list
              </ThemedText>
              <ThemedText type="small" style={styles.mutedText}>
                {visibleItems.length} item{visibleItems.length === 1 ? '' : 's'}
              </ThemedText>
            </View>

            {visibleItems.length === 0 ? (
              <View style={styles.emptyState}>
                <ThemedText type="smallBold" style={styles.emptyStateTitle}>
                  No items yet
                </ThemedText>
                <ThemedText type="small" style={styles.mutedText}>
                  Add your first task to start building your local planner.
                </ThemedText>
              </View>
            ) : (
              visibleItems.map((item) => (
                <View key={item.id} style={styles.itemCard}>
                  <View style={styles.itemTopRow}>
                    <Pressable onPress={() => toggleComplete(item.id)} style={styles.checkButton} hitSlop={8}>
                      <ThemedText type="smallBold" style={styles.checkButtonText}>
                        {item.completed ? 'Done' : 'Todo'}
                      </ThemedText>
                    </Pressable>
                    <View style={styles.itemContent}>
                      <ThemedText type="smallBold" style={item.completed ? styles.completedText : styles.itemTitle}>
                        {item.title}
                      </ThemedText>
                      <ThemedText type="small" style={styles.mutedText}>
                        {item.details || 'No details added'}
                      </ThemedText>
                      <ThemedText type="small" style={styles.mutedText}>
                        {item.dueDate} | {item.type}
                        {item.amount ? ` | ${item.amount}` : ''}
                      </ThemedText>
                    </View>
                  </View>

                  <View style={styles.itemActions}>
                    <Pressable onPress={() => beginEdit(item)} style={styles.actionLink} hitSlop={8}>
                      <ThemedText type="smallBold" style={styles.actionLinkText}>
                        Edit
                      </ThemedText>
                    </Pressable>
                    <Pressable onPress={() => deleteItem(item.id)} style={styles.deleteActionLink} hitSlop={8}>
                      <ThemedText type="smallBold" style={styles.deleteActionLinkText}>
                        Delete
                      </ThemedText>
                    </Pressable>
                  </View>
                </View>
              ))
            )}
          </View>
        </ScrollView>

        {toast ? (
          <View style={[styles.toast, toast.type === 'error' && styles.toastError]}>
            <ThemedText type="smallBold" style={styles.toastText}>
              {toast.text}
            </ThemedText>
          </View>
        ) : null}
      </View>
    </SafeAreaView>
  );
}

function PickerStepButton({ label, onPress }: { label: string; onPress: () => void }) {
  return (
    <Pressable style={styles.pickerStepButton} onPress={onPress}>
      <ThemedText type="smallBold" style={styles.pickerStepText}>
        {label}
      </ThemedText>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#f8fafc',
  },
  backgroundGradient: {
    flex: 1,
    backgroundColor: '#f8fafc',
  },
  scrollContent: {
    paddingTop: Spacing.three,
    paddingBottom: Spacing.five,
    gap: Spacing.three,
    maxWidth: MaxContentWidth,
    width: '100%',
    alignSelf: 'center',
    paddingHorizontal: Spacing.two,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    gap: Spacing.three,
    backgroundColor: '#f8fafc',
  },
  loadingText: {
    color: '#0f172a',
  },
  spinner: {
    width: 46,
    height: 46,
    borderRadius: 23,
    borderWidth: 5,
    borderColor: '#bfdbfe',
    borderTopColor: '#2563eb',
  },
  heroCard: {
    padding: Spacing.four,
    borderRadius: Spacing.four,
    gap: Spacing.one,
    backgroundColor: '#ffffff',
    borderWidth: 1,
    borderColor: '#e2e8f0',
    shadowColor: '#94a3b8',
    shadowOpacity: 0.14,
    shadowRadius: 18,
    shadowOffset: { width: 0, height: 8 },
    elevation: 3,
  },
  heroTitle: {
    fontSize: 32,
    lineHeight: 36,
    color: '#0f172a',
  },
  heroSubtitle: {
    maxWidth: 560,
    color: '#64748b',
  },
  summaryRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.two,
  },
  summaryCard: {
    flex: 1,
    minWidth: 160,
    padding: Spacing.three,
    borderRadius: Spacing.three,
    gap: Spacing.one,
    backgroundColor: '#ffffff',
    borderWidth: 1,
    borderColor: '#e2e8f0',
    shadowColor: '#94a3b8',
    shadowOpacity: 0.12,
    shadowRadius: 14,
    shadowOffset: { width: 0, height: 6 },
    elevation: 2,
  },
  cardLabel: {
    color: '#64748b',
  },
  summaryNumber: {
    fontSize: 28,
    lineHeight: 32,
    color: '#0f172a',
  },
  mutedText: {
    color: '#64748b',
  },
  sectionSwitch: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.two,
    padding: Spacing.one,
  },
  sectionButton: {
    borderWidth: 1,
    borderColor: '#dbeafe',
    borderRadius: 999,
    paddingHorizontal: Spacing.three,
    paddingVertical: Spacing.two,
    backgroundColor: '#f8fbff',
  },
  sectionButtonPressed: {
    opacity: 0.85,
  },
  sectionButtonText: {
    color: '#334155',
  },
  sectionButtonTextSelected: {
    color: '#ffffff',
  },
  formCard: {
    padding: Spacing.three,
    borderRadius: Spacing.four,
    gap: Spacing.two,
    backgroundColor: '#ffffff',
    borderWidth: 1,
    borderColor: '#e2e8f0',
    shadowColor: '#94a3b8',
    shadowOpacity: 0.12,
    shadowRadius: 14,
    shadowOffset: { width: 0, height: 6 },
    elevation: 2,
  },
  formTitle: {
    fontSize: 20,
    color: '#0f172a',
  },
  formSubtitle: {
    marginBottom: Spacing.one,
    color: '#64748b',
  },
  fieldLabel: {
    color: '#64748b',
  },
  input: {
    borderWidth: 1,
    borderColor: '#dbe3ec',
    borderRadius: Spacing.two,
    paddingHorizontal: Spacing.two,
    paddingVertical: Spacing.two,
    minHeight: 44,
    color: '#0f172a',
    backgroundColor: '#f8fafc',
  },
  textArea: {
    minHeight: 88,
    textAlignVertical: 'top',
  },
  formRow: {
    flexDirection: 'row',
    gap: Spacing.two,
  },
  formCell: {
    flex: 1,
    gap: Spacing.one,
  },
  pickerButton: {
    borderWidth: 1,
    borderColor: '#dbe3ec',
    borderRadius: Spacing.two,
    minHeight: 44,
    justifyContent: 'center',
    paddingHorizontal: Spacing.two,
    backgroundColor: '#f8fafc',
  },
  pickerButtonText: {
    color: '#0f172a',
  },
  datePickerPanel: {
    padding: Spacing.two,
    borderRadius: Spacing.three,
    gap: Spacing.two,
    borderWidth: 1,
    borderColor: '#dbeafe',
    backgroundColor: '#f8fbff',
  },
  pickerHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  pickerTitle: {
    color: '#0f172a',
  },
  pickerDoneText: {
    color: '#2563eb',
  },
  pickerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.two,
  },
  pickerGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.two,
  },
  pickerStepButton: {
    minHeight: 36,
    minWidth: 84,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 999,
    backgroundColor: '#ffffff',
    borderWidth: 1,
    borderColor: '#dbeafe',
  },
  pickerStepText: {
    color: '#2563eb',
  },
  datePreview: {
    flex: 1,
    minHeight: 38,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: Spacing.two,
    backgroundColor: '#dbeafe',
  },
  datePreviewText: {
    color: '#1e3a8a',
  },
  typeRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.two,
  },
  typeChip: {
    borderRadius: 999,
    borderWidth: 1,
    borderColor: '#dbe3ec',
    paddingHorizontal: Spacing.two,
    paddingVertical: Spacing.two,
    backgroundColor: '#f8fafc',
  },
  typeChipText: {
    color: '#0f172a',
  },
  typeChipTextSelected: {
    color: '#ffffff',
  },
  actionRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.two,
    marginTop: Spacing.one,
  },
  primaryButton: {
    paddingVertical: Spacing.two,
    paddingHorizontal: Spacing.three,
    borderRadius: 999,
    backgroundColor: '#2563eb',
    shadowColor: '#2563eb',
    shadowOpacity: 0.2,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 6 },
    elevation: 2,
  },
  primaryButtonText: {
    color: '#ffffff',
  },
  secondaryButton: {
    paddingVertical: Spacing.two,
    paddingHorizontal: Spacing.three,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: '#dbe3ec',
    backgroundColor: '#ffffff',
  },
  secondaryButtonText: {
    color: '#0f172a',
  },
  listCard: {
    padding: Spacing.three,
    borderRadius: Spacing.four,
    gap: Spacing.two,
    backgroundColor: '#ffffff',
    borderWidth: 1,
    borderColor: '#e2e8f0',
    shadowColor: '#94a3b8',
    shadowOpacity: 0.12,
    shadowRadius: 14,
    shadowOffset: { width: 0, height: 6 },
    elevation: 2,
  },
  listHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  listTitle: {
    fontSize: 22,
    color: '#0f172a',
  },
  emptyState: {
    padding: Spacing.three,
    borderRadius: Spacing.three,
    backgroundColor: '#f8fafc',
    gap: Spacing.one,
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  emptyStateTitle: {
    color: '#0f172a',
  },
  itemCard: {
    padding: Spacing.three,
    borderRadius: Spacing.three,
    gap: Spacing.two,
    backgroundColor: '#f8fafc',
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  itemTopRow: {
    flexDirection: 'row',
    gap: Spacing.two,
  },
  checkButton: {
    minWidth: 52,
    height: 32,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#cbd5e1',
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#ffffff',
  },
  checkButtonText: {
    color: '#0f172a',
    fontSize: 12,
  },
  itemContent: {
    flex: 1,
    gap: Spacing.one,
  },
  itemTitle: {
    color: '#0f172a',
  },
  completedText: {
    textDecorationLine: 'line-through',
    opacity: 0.7,
    color: '#64748b',
  },
  itemActions: {
    marginLeft: 60,
    flexDirection: 'row',
    gap: Spacing.three,
  },
  actionLink: {
    paddingVertical: Spacing.one,
  },
  actionLinkText: {
    color: '#2563eb',
  },
  deleteActionLink: {
    paddingVertical: Spacing.one,
  },
  deleteActionLinkText: {
    color: '#dc2626',
  },
  toast: {
    position: 'absolute',
    left: Spacing.three,
    right: Spacing.three,
    bottom: Spacing.three,
    minHeight: 46,
    borderRadius: 999,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: Spacing.three,
    backgroundColor: '#16a34a',
    shadowColor: '#0f172a',
    shadowOpacity: 0.18,
    shadowRadius: 18,
    shadowOffset: { width: 0, height: 10 },
    elevation: 8,
  },
  toastError: {
    backgroundColor: '#dc2626',
  },
  toastText: {
    color: '#ffffff',
    textAlign: 'center',
  },
});
