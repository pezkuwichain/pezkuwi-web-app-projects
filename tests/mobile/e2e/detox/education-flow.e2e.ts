/**
 * Detox E2E Test: Education Platform Flow (Mobile)
 * Based on pallet-perwerde integration tests
 *
 * Flow:
 * 1. Browse Courses → 2. Enroll → 3. Complete Course → 4. Earn Certificate
 */

describe('Education Platform Flow (Mobile E2E)', () => {
  const testUser = {
    address: '5GrwvaEF5zXb26Fz9rcQpDWS57CtERHpNehXCPcNoHGKutQY',
    name: 'Test Student',
  };

  beforeAll(async () => {
    await device.launchApp({
      newInstance: true,
      permissions: { notifications: 'YES' },
    });
  });

  beforeEach(async () => {
    await device.reloadReactNative();

    // Navigate to Education tab
    await element(by.id('bottom-tab-education')).tap();
  });

  describe('Course Browsing', () => {
    it('should display list of available courses', async () => {
      // Wait for courses to load
      await waitFor(element(by.id('course-list')))
        .toBeVisible()
        .withTimeout(5000);

      // Should have at least one course
      await expect(element(by.id('course-card-0'))).toBeVisible();
    });

    it('should show course details on tap', async () => {
      await element(by.id('course-card-0')).tap();

      // Should show course detail screen
      await expect(element(by.id('course-detail-screen'))).toBeVisible();

      // Should display course information
      await expect(element(by.id('course-title'))).toBeVisible();
      await expect(element(by.id('course-description'))).toBeVisible();
      await expect(element(by.id('course-content-url'))).toBeVisible();
    });

    it('should filter courses by status', async () => {
      // Tap Active filter
      await element(by.text('Active')).tap();

      // Should show only active courses
      await expect(element(by.id('course-status-active'))).toBeVisible();

      // Tap Archived filter
      await element(by.text('Archived')).tap();

      // Should show archived courses
      await expect(element(by.id('course-status-archived'))).toBeVisible();
    });

    it('should show empty state when no courses', async () => {
      // Mock empty course list
      await device.setURLBlacklist(['.*courses.*']);

      await element(by.id('refresh-courses')).swipe('down');

      await expect(element(by.text('No courses available yet'))).toBeVisible();
    });
  });

  describe('Course Enrollment', () => {
    it('should enroll in an active course', async () => {
      // Open course detail
      await element(by.id('course-card-0')).tap();

      // Tap enroll button
      await element(by.id('enroll-button')).tap();

      // Confirm enrollment
      await element(by.text('Confirm')).tap();

      // Wait for transaction
      await waitFor(element(by.text('Enrolled successfully')))
        .toBeVisible()
        .withTimeout(10000);

      // Button should change to "Continue Learning"
      await expect(element(by.text('Continue Learning'))).toBeVisible();
    });

    it('should show "Already Enrolled" state', async () => {
      // Mock enrolled state
      await element(by.id('course-card-0')).tap();

      // If already enrolled, should show different button
      await expect(element(by.text('Enrolled'))).toBeVisible();
      await expect(element(by.text('Continue Learning'))).toBeVisible();

      // Enroll button should not be visible
      await expect(element(by.text('Enroll'))).not.toBeVisible();
    });

    it('should disable enroll for archived courses', async () => {
      // Filter to archived courses
      await element(by.text('Archived')).tap();

      await element(by.id('course-card-0')).tap();

      // Enroll button should be disabled or show "Archived"
      await expect(element(by.id('enroll-button'))).not.toBeVisible();
      await expect(element(by.text('Archived'))).toBeVisible();
    });

    it('should show enrolled courses count', async () => {
      // Navigate to profile or "My Courses"
      await element(by.id('my-courses-tab')).tap();

      // Should show count
      await expect(element(by.text('Enrolled: 3/100 courses'))).toBeVisible();
    });

    it('should warn when approaching course limit', async () => {
      // Mock 98 enrolled courses
      // (In real app, this would be fetched from blockchain)

      await element(by.id('my-courses-tab')).tap();

      await expect(element(by.text('Enrolled: 98/100 courses'))).toBeVisible();
      await expect(element(by.text(/can enroll in 2 more/i))).toBeVisible();
    });
  });

  describe('Course Completion', () => {
    it('should complete an enrolled course', async () => {
      // Navigate to enrolled course
      await element(by.id('my-courses-tab')).tap();
      await element(by.id('enrolled-course-0')).tap();

      // Tap complete button
      await element(by.id('complete-course-button')).tap();

      // Enter completion points (e.g., quiz score)
      await element(by.id('points-input')).typeText('85');

      // Submit completion
      await element(by.text('Submit')).tap();

      // Wait for transaction
      await waitFor(element(by.text('Course completed!')))
        .toBeVisible()
        .withTimeout(10000);

      // Should show completion badge
      await expect(element(by.text('Completed'))).toBeVisible();
      await expect(element(by.text('85 points earned'))).toBeVisible();
    });

    it('should show certificate for completed course', async () => {
      // Open completed course
      await element(by.id('my-courses-tab')).tap();
      await element(by.id('completed-course-0')).tap();

      // Should show certificate button
      await expect(element(by.id('view-certificate-button'))).toBeVisible();

      await element(by.id('view-certificate-button')).tap();

      // Certificate modal should open
      await expect(element(by.id('certificate-modal'))).toBeVisible();
      await expect(element(by.text(testUser.name))).toBeVisible();
      await expect(element(by.text(/certificate of completion/i))).toBeVisible();
    });

    it('should prevent completing course twice', async () => {
      // Open already completed course
      await element(by.id('my-courses-tab')).tap();
      await element(by.id('completed-course-0')).tap();

      // Complete button should not be visible
      await expect(element(by.id('complete-course-button'))).not.toBeVisible();

      // Should show "Completed" status
      await expect(element(by.text('Completed'))).toBeVisible();
    });

    it('should prevent completing without enrollment', async () => {
      // Browse courses (not enrolled)
      await element(by.text('All Courses')).tap();
      await element(by.id('course-card-5')).tap(); // Unenrolled course

      // Complete button should not be visible
      await expect(element(by.id('complete-course-button'))).not.toBeVisible();

      // Only enroll button should be visible
      await expect(element(by.id('enroll-button'))).toBeVisible();
    });
  });

  describe('Course Progress Tracking', () => {
    it('should show progress for enrolled courses', async () => {
      await element(by.id('my-courses-tab')).tap();

      // Should show progress indicator
      await expect(element(by.id('course-progress-0'))).toBeVisible();

      // Progress should be between 0-100%
      // (Mock or check actual progress value)
    });

    it('should update progress as lessons are completed', async () => {
      // This would require lesson-by-lesson tracking
      // For now, test that progress exists
      await element(by.id('my-courses-tab')).tap();
      await element(by.id('enrolled-course-0')).tap();

      await expect(element(by.text(/In Progress/i))).toBeVisible();
    });
  });

  describe('Pull to Refresh', () => {
    it('should refresh course list on pull down', async () => {
      // Initial course count
      const initialCourses = await element(by.id('course-card-0')).getAttributes();

      // Pull to refresh
      await element(by.id('course-list')).swipe('down', 'fast', 0.8);

      // Wait for refresh to complete
      await waitFor(element(by.id('course-card-0')))
        .toBeVisible()
        .withTimeout(5000);

      // Courses should be reloaded
    });
  });

  describe('Admin: Create Course', () => {
    it('should create a new course as admin', async () => {
      // Mock admin role
      // (In real app, check if user has admin rights)

      // Tap FAB to create course
      await element(by.id('create-course-fab')).tap();

      // Fill course creation form
      await element(by.id('course-title-input')).typeText('New Blockchain Course');
      await element(by.id('course-description-input')).typeText(
        'Learn about blockchain technology'
      );
      await element(by.id('course-content-url-input')).typeText(
        'https://example.com/course'
      );

      // Submit
      await element(by.id('submit-course-button')).tap();

      // Wait for transaction
      await waitFor(element(by.text('Course created successfully')))
        .toBeVisible()
        .withTimeout(10000);

      // New course should appear in list
      await expect(element(by.text('New Blockchain Course'))).toBeVisible();
    });

    it('should prevent non-admins from creating courses', async () => {
      // Mock non-admin user
      // Create course FAB should not be visible
      await expect(element(by.id('create-course-fab'))).not.toBeVisible();
    });
  });

  describe('Admin: Archive Course', () => {
    it('should archive a course as owner', async () => {
      // Open course owned by user
      await element(by.id('my-created-courses-tab')).tap();
      await element(by.id('owned-course-0')).tap();

      // Open course menu
      await element(by.id('course-menu-button')).tap();

      // Tap archive
      await element(by.text('Archive Course')).tap();

      // Confirm
      await element(by.text('Confirm')).tap();

      // Wait for transaction
      await waitFor(element(by.text('Course archived')))
        .toBeVisible()
        .withTimeout(10000);

      // Course status should change to Archived
      await expect(element(by.text('Archived'))).toBeVisible();
    });
  });

  describe('Course Categories', () => {
    it('should filter courses by category', async () => {
      // Tap category filter
      await element(by.id('category-filter-blockchain')).tap();

      // Should show only blockchain courses
      await expect(element(by.text('Blockchain'))).toBeVisible();

      // Other categories should be filtered out
    });

    it('should show category badges on course cards', async () => {
      await expect(element(by.id('course-category-badge-0'))).toBeVisible();
    });
  });

  describe('Error Handling', () => {
    it('should handle enrollment failure gracefully', async () => {
      // Mock API failure
      await device.setURLBlacklist(['.*enroll.*']);

      await element(by.id('course-card-0')).tap();
      await element(by.id('enroll-button')).tap();
      await element(by.text('Confirm')).tap();

      // Should show error message
      await waitFor(element(by.text(/failed to enroll/i)))
        .toBeVisible()
        .withTimeout(5000);

      // Retry button should be available
      await expect(element(by.text('Retry'))).toBeVisible();
    });

    it('should handle completion failure gracefully', async () => {
      await element(by.id('my-courses-tab')).tap();
      await element(by.id('enrolled-course-0')).tap();
      await element(by.id('complete-course-button')).tap();

      // Mock transaction failure
      await device.setURLBlacklist(['.*complete.*']);

      await element(by.id('points-input')).typeText('85');
      await element(by.text('Submit')).tap();

      // Should show error
      await waitFor(element(by.text(/failed to complete/i)))
        .toBeVisible()
        .withTimeout(5000);
    });
  });
});
