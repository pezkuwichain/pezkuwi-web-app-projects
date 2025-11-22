import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  ScrollView,
  TouchableOpacity,
  FlatList,
  ActivityIndicator,
  RefreshControl,
  Alert,
} from 'react-native';
import { useTranslation } from 'react-i18next';
import { Card, Button, Badge } from '../components';
import { KurdistanColors, AppColors } from '../theme/colors';
import { usePolkadot } from '../contexts/PolkadotContext';

// Import from shared library
import {
  getAllCourses,
  getStudentEnrollments,
  enrollInCourse,
  completeCourse,
  type Course,
  type Enrollment,
} from '../../../shared/lib/perwerde';

type TabType = 'all' | 'my-courses';

const EducationScreen: React.FC = () => {
  const { t } = useTranslation();
  const { api, isApiReady, selectedAccount, getKeyPair } = usePolkadot();

  const [activeTab, setActiveTab] = useState<TabType>('all');
  const [courses, setCourses] = useState<Course[]>([]);
  const [enrollments, setEnrollments] = useState<Enrollment[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [enrolling, setEnrolling] = useState<number | null>(null);

  const fetchCourses = useCallback(async () => {
    if (!api || !isApiReady) return;

    try {
      setLoading(true);
      const allCourses = await getAllCourses(api);
      setCourses(allCourses);
    } catch (error) {
      if (__DEV__) console.error('Failed to fetch courses:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [api, isApiReady]);

  const fetchEnrollments = useCallback(async () => {
    if (!selectedAccount) {
      setEnrollments([]);
      return;
    }

    try {
      const studentEnrollments = await getStudentEnrollments(selectedAccount.address);
      setEnrollments(studentEnrollments);
    } catch (error) {
      if (__DEV__) console.error('Failed to fetch enrollments:', error);
    }
  }, [selectedAccount]);

  useEffect(() => {
    fetchCourses();
    fetchEnrollments();
  }, [fetchCourses, fetchEnrollments]);

  const handleRefresh = () => {
    setRefreshing(true);
    fetchCourses();
    fetchEnrollments();
  };

  const handleEnroll = async (courseId: number) => {
    if (!api || !selectedAccount) {
      Alert.alert('Error', 'Please connect your wallet');
      return;
    }

    try {
      setEnrolling(courseId);

      const keyPair = await getKeyPair(selectedAccount.address);
      if (!keyPair) {
        throw new Error('Failed to load keypair');
      }

      await enrollInCourse(api, {
        address: selectedAccount.address,
        meta: {},
        type: 'sr25519',
      } as any, courseId);

      Alert.alert('Success', 'Successfully enrolled in course!');
      fetchEnrollments();
    } catch (error: any) {
      if (__DEV__) console.error('Enrollment failed:', error);
      Alert.alert('Enrollment Failed', error.message || 'Failed to enroll in course');
    } finally {
      setEnrolling(null);
    }
  };

  const handleCompleteCourse = async (courseId: number) => {
    if (!api || !selectedAccount) {
      Alert.alert('Error', 'Please connect your wallet');
      return;
    }

    Alert.alert(
      'Complete Course',
      'Are you sure you want to mark this course as completed?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Complete',
          onPress: async () => {
            try {
              const keyPair = await getKeyPair(selectedAccount.address);
              if (!keyPair) {
                throw new Error('Failed to load keypair');
              }

              await completeCourse(api, {
                address: selectedAccount.address,
                meta: {},
                type: 'sr25519',
              } as any, courseId);

              Alert.alert('Success', 'Course completed! Certificate issued.');
              fetchEnrollments();
            } catch (error: any) {
              if (__DEV__) console.error('Completion failed:', error);
              Alert.alert('Error', error.message || 'Failed to complete course');
            }
          },
        },
      ]
    );
  };

  const isEnrolled = (courseId: number) => {
    return enrollments.some((e) => e.course_id === courseId);
  };

  const isCompleted = (courseId: number) => {
    return enrollments.some((e) => e.course_id === courseId && e.is_completed);
  };

  const getEnrollmentProgress = (courseId: number) => {
    const enrollment = enrollments.find((e) => e.course_id === courseId);
    return enrollment?.points_earned || 0;
  };

  const renderCourseCard = ({ item }: { item: Course }) => {
    const enrolled = isEnrolled(item.id);
    const completed = isCompleted(item.id);
    const progress = getEnrollmentProgress(item.id);
    const isEnrollingThis = enrolling === item.id;

    return (
      <Card style={styles.courseCard}>
        {/* Course Header */}
        <View style={styles.courseHeader}>
          <View style={styles.courseIcon}>
            <Text style={styles.courseIconText}>📚</Text>
          </View>
          <View style={styles.courseInfo}>
            <Text style={styles.courseName}>{item.name}</Text>
            <Text style={styles.courseInstructor}>
              By: {item.owner.slice(0, 6)}...{item.owner.slice(-4)}
            </Text>
          </View>
          {completed && (
            <Badge
              text="✓ Completed"
              variant="success"
              style={{ backgroundColor: KurdistanColors.kesk }}
            />
          )}
          {enrolled && !completed && (
            <Badge text="Enrolled" variant="outline" />
          )}
        </View>

        {/* Course Description */}
        <Text style={styles.courseDescription} numberOfLines={3}>
          {item.description}
        </Text>

        {/* Progress (if enrolled) */}
        {enrolled && !completed && (
          <View style={styles.progressContainer}>
            <Text style={styles.progressLabel}>Progress</Text>
            <View style={styles.progressBar}>
              <View
                style={[
                  styles.progressFill,
                  { width: `${Math.min(progress, 100)}%` },
                ]}
              />
            </View>
            <Text style={styles.progressText}>{progress} points</Text>
          </View>
        )}

        {/* Course Metadata */}
        <View style={styles.courseMetadata}>
          <View style={styles.metadataItem}>
            <Text style={styles.metadataIcon}>🎓</Text>
            <Text style={styles.metadataText}>Certificate upon completion</Text>
          </View>
          <View style={styles.metadataItem}>
            <Text style={styles.metadataIcon}>📅</Text>
            <Text style={styles.metadataText}>
              Created: {new Date(item.created_at).toLocaleDateString()}
            </Text>
          </View>
        </View>

        {/* Action Button */}
        {!enrolled && (
          <Button
            variant="primary"
            onPress={() => handleEnroll(item.id)}
            disabled={isEnrollingThis || !isApiReady}
            style={styles.enrollButton}
          >
            {isEnrollingThis ? (
              <ActivityIndicator color="#FFFFFF" />
            ) : (
              'Enroll Now'
            )}
          </Button>
        )}

        {enrolled && !completed && (
          <Button
            variant="primary"
            onPress={() => handleCompleteCourse(item.id)}
            style={styles.enrollButton}
          >
            Mark as Completed
          </Button>
        )}

        {completed && (
          <Button
            variant="outline"
            onPress={() => {
              Alert.alert(
                'Certificate',
                `Congratulations! You've completed "${item.name}".\n\nYour certificate is stored on the blockchain.`
              );
            }}
            style={styles.enrollButton}
          >
            View Certificate
          </Button>
        )}
      </Card>
    );
  };

  const displayCourses =
    activeTab === 'all'
      ? courses
      : courses.filter((c) => isEnrolled(c.id));

  const renderEmptyState = () => (
    <View style={styles.emptyState}>
      <Text style={styles.emptyIcon}>
        {activeTab === 'all' ? '📚' : '🎓'}
      </Text>
      <Text style={styles.emptyTitle}>
        {activeTab === 'all' ? 'No Courses Available' : 'No Enrolled Courses'}
      </Text>
      <Text style={styles.emptyText}>
        {activeTab === 'all'
          ? 'Check back later for new courses'
          : 'Browse available courses and enroll to start learning'}
      </Text>
      {activeTab === 'my-courses' && (
        <Button
          variant="primary"
          onPress={() => setActiveTab('all')}
          style={styles.browseButton}
        >
          Browse Courses
        </Button>
      )}
    </View>
  );

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <View>
          <Text style={styles.title}>Perwerde 🎓</Text>
          <Text style={styles.subtitle}>Decentralized Education Platform</Text>
        </View>
      </View>

      {/* Connection Warning */}
      {!isApiReady && (
        <View style={styles.warningBanner}>
          <Text style={styles.warningText}>Connecting to blockchain...</Text>
        </View>
      )}

      {/* Tabs */}
      <View style={styles.tabs}>
        <TouchableOpacity
          style={[styles.tab, activeTab === 'all' && styles.activeTab]}
          onPress={() => setActiveTab('all')}
        >
          <Text
            style={[styles.tabText, activeTab === 'all' && styles.activeTabText]}
          >
            All Courses
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.tab, activeTab === 'my-courses' && styles.activeTab]}
          onPress={() => setActiveTab('my-courses')}
        >
          <Text
            style={[
              styles.tabText,
              activeTab === 'my-courses' && styles.activeTabText,
            ]}
          >
            My Courses ({enrollments.length})
          </Text>
        </TouchableOpacity>
      </View>

      {/* Course List */}
      {loading && !refreshing ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={KurdistanColors.kesk} />
          <Text style={styles.loadingText}>Loading courses...</Text>
        </View>
      ) : (
        <FlatList
          data={displayCourses}
          renderItem={renderCourseCard}
          keyExtractor={(item) => item.id.toString()}
          contentContainerStyle={styles.listContent}
          ListEmptyComponent={renderEmptyState}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={handleRefresh}
              tintColor={KurdistanColors.kesk}
            />
          }
        />
      )}
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: AppColors.background,
  },
  header: {
    padding: 16,
    paddingBottom: 12,
  },
  title: {
    fontSize: 28,
    fontWeight: '700',
    color: '#000',
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 14,
    color: '#666',
  },
  warningBanner: {
    backgroundColor: '#FFF3CD',
    padding: 12,
    marginHorizontal: 16,
    marginBottom: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#FFE69C',
  },
  warningText: {
    fontSize: 14,
    color: '#856404',
    textAlign: 'center',
  },
  tabs: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#E0E0E0',
    marginBottom: 16,
  },
  tab: {
    flex: 1,
    paddingVertical: 12,
    alignItems: 'center',
    borderBottomWidth: 2,
    borderBottomColor: 'transparent',
  },
  activeTab: {
    borderBottomColor: KurdistanColors.kesk,
  },
  tabText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#666',
  },
  activeTabText: {
    color: KurdistanColors.kesk,
  },
  listContent: {
    padding: 16,
    paddingTop: 0,
  },
  courseCard: {
    padding: 16,
    marginBottom: 16,
  },
  courseHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  courseIcon: {
    width: 56,
    height: 56,
    borderRadius: 12,
    backgroundColor: '#F0F9F4',
    justifyContent: 'center',
    alignItems: 'center',
  },
  courseIconText: {
    fontSize: 28,
  },
  courseInfo: {
    flex: 1,
    marginLeft: 12,
  },
  courseName: {
    fontSize: 18,
    fontWeight: '700',
    color: '#000',
    marginBottom: 4,
  },
  courseInstructor: {
    fontSize: 14,
    color: '#666',
  },
  courseDescription: {
    fontSize: 14,
    color: '#666',
    lineHeight: 20,
    marginBottom: 16,
  },
  progressContainer: {
    marginBottom: 16,
  },
  progressLabel: {
    fontSize: 12,
    color: '#666',
    marginBottom: 8,
  },
  progressBar: {
    height: 8,
    backgroundColor: '#E0E0E0',
    borderRadius: 4,
    overflow: 'hidden',
    marginBottom: 4,
  },
  progressFill: {
    height: '100%',
    backgroundColor: KurdistanColors.kesk,
    borderRadius: 4,
  },
  progressText: {
    fontSize: 12,
    color: KurdistanColors.kesk,
    fontWeight: '600',
  },
  courseMetadata: {
    borderTopWidth: 1,
    borderTopColor: '#F0F0F0',
    paddingTop: 12,
    marginBottom: 16,
  },
  metadataItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  metadataIcon: {
    fontSize: 16,
    marginRight: 8,
  },
  metadataText: {
    fontSize: 12,
    color: '#666',
  },
  enrollButton: {
    marginTop: 8,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 12,
    fontSize: 14,
    color: '#666',
  },
  emptyState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 60,
  },
  emptyIcon: {
    fontSize: 64,
    marginBottom: 16,
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#000',
    marginBottom: 8,
  },
  emptyText: {
    fontSize: 14,
    color: '#666',
    textAlign: 'center',
    marginBottom: 24,
    paddingHorizontal: 32,
  },
  browseButton: {
    minWidth: 150,
  },
});

export default EducationScreen;
