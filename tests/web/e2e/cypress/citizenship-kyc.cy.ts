/**
 * Cypress E2E Test: Full Citizenship & KYC Flow
 * Based on pallet-identity-kyc integration tests
 *
 * Flow:
 * 1. Set Identity → 2. Apply for KYC → 3. Admin Approval → 4. Citizen NFT Minted
 * Alternative: Self-Confirmation flow
 */

describe('Citizenship & KYC Flow (E2E)', () => {
  const testUser = {
    name: 'Test Citizen',
    email: 'testcitizen@pezkuwi.com',
    wallet: '5GrwvaEF5zXb26Fz9rcQpDWS57CtERHpNehXCPcNoHGKutQY',
  };

  const testAdmin = {
    wallet: '5GNJqTPyNqANBkUVMN1LPPrxXnFouWXoe2wNSmmEoLctxiZY',
  };

  beforeEach(() => {
    // Visit the citizenship page
    cy.visit('/citizenship');

    // Mock wallet connection
    cy.window().then((win) => {
      (win as any).mockPolkadotWallet = {
        address: testUser.wallet,
        connected: true,
      };
    });
  });

  describe('Happy Path: Full KYC Approval Flow', () => {
    it('should complete full citizenship flow', () => {
      // STEP 1: Set Identity
      cy.log('Step 1: Setting identity');
      cy.get('[data-testid="identity-name-input"]').type(testUser.name);
      cy.get('[data-testid="identity-email-input"]').type(testUser.email);
      cy.get('[data-testid="submit-identity-btn"]').click();

      // Wait for transaction confirmation
      cy.contains('Identity set successfully', { timeout: 10000 }).should('be.visible');

      // STEP 2: Apply for KYC
      cy.log('Step 2: Applying for KYC');
      cy.get('[data-testid="kyc-cid-input"]').type('QmYwAPJzv5CZsnA625s3Xf2nemtYgPpHdWEz79ojWnPbdG');
      cy.get('[data-testid="kyc-notes-input"]').type('My citizenship documents');

      // Check deposit amount is displayed
      cy.contains('Deposit required: 10 HEZ').should('be.visible');

      cy.get('[data-testid="submit-kyc-btn"]').click();

      // Wait for transaction
      cy.contains('KYC application submitted', { timeout: 10000 }).should('be.visible');

      // Verify status changed to Pending
      cy.get('[data-testid="kyc-status-badge"]').should('contain', 'Pending');

      // STEP 3: Admin Approval (switch to admin account)
      cy.log('Step 3: Admin approving KYC');
      cy.window().then((win) => {
        (win as any).mockPolkadotWallet.address = testAdmin.wallet;
      });

      cy.visit('/admin/kyc-applications');
      cy.get(`[data-testid="approve-kyc-${testUser.wallet}"]`).click();

      // Confirm approval
      cy.get('[data-testid="confirm-approval-btn"]').click();

      cy.contains('KYC approved successfully', { timeout: 10000 }).should('be.visible');

      // STEP 4: Verify Citizen Status
      cy.log('Step 4: Verifying citizenship status');
      cy.window().then((win) => {
        (win as any).mockPolkadotWallet.address = testUser.wallet;
      });

      cy.visit('/citizenship');

      // Should show Approved status
      cy.get('[data-testid="kyc-status-badge"]').should('contain', 'Approved');

      // Should show Citizen NFT
      cy.contains('Citizen NFT').should('be.visible');

      // Should show Welati role
      cy.contains('Welati').should('be.visible');

      // Deposit should be refunded (check balance increased)
    });
  });

  describe('Alternative: Self-Confirmation Flow', () => {
    it('should allow self-confirmation for Welati NFT holders', () => {
      // User already has Welati NFT (mock this state)
      cy.window().then((win) => {
        (win as any).mockPolkadotState = {
          hasWelatiNFT: true,
        };
      });

      // STEP 1: Set Identity
      cy.get('[data-testid="identity-name-input"]').type(testUser.name);
      cy.get('[data-testid="identity-email-input"]').type(testUser.email);
      cy.get('[data-testid="submit-identity-btn"]').click();

      cy.wait(2000);

      // STEP 2: Apply for KYC
      cy.get('[data-testid="kyc-cid-input"]').type('QmYwAPJzv5CZsnA625s3Xf2nemtYgPpHdWEz79ojWnPbdG');
      cy.get('[data-testid="submit-kyc-btn"]').click();

      cy.wait(2000);

      // STEP 3: Self-Confirm (should be available for Welati holders)
      cy.get('[data-testid="self-confirm-btn"]').should('be.visible');
      cy.get('[data-testid="self-confirm-btn"]').click();

      // Confirm action
      cy.contains('Self-confirm citizenship?').should('be.visible');
      cy.get('[data-testid="confirm-self-confirm"]').click();

      // Wait for confirmation
      cy.contains('Citizenship confirmed!', { timeout: 10000 }).should('be.visible');

      // Verify status
      cy.get('[data-testid="kyc-status-badge"]').should('contain', 'Approved');
    });
  });

  describe('Error Cases', () => {
    it('should prevent KYC application without identity', () => {
      // Try to submit KYC without setting identity first
      cy.get('[data-testid="kyc-cid-input"]').should('be.disabled');

      // Should show message
      cy.contains('Please set your identity first').should('be.visible');
    });

    it('should prevent duplicate KYC application', () => {
      // Mock existing pending application
      cy.window().then((win) => {
        (win as any).mockPolkadotState = {
          kycStatus: 'Pending',
        };
      });

      cy.reload();

      // KYC form should be disabled
      cy.get('[data-testid="submit-kyc-btn"]').should('be.disabled');

      // Should show current status
      cy.contains('Application already submitted').should('be.visible');
      cy.get('[data-testid="kyc-status-badge"]').should('contain', 'Pending');
    });

    it('should show insufficient balance error', () => {
      // Mock low balance
      cy.window().then((win) => {
        (win as any).mockPolkadotState = {
          balance: 5_000_000_000_000n, // 5 HEZ (less than 10 required)
        };
      });

      // Set identity first
      cy.get('[data-testid="identity-name-input"]').type(testUser.name);
      cy.get('[data-testid="identity-email-input"]').type(testUser.email);
      cy.get('[data-testid="submit-identity-btn"]').click();

      cy.wait(2000);

      // Try to submit KYC
      cy.get('[data-testid="kyc-cid-input"]').type('QmYwAPJzv5CZsnA625s3Xf2nemtYgPpHdWEz79ojWnPbdG');
      cy.get('[data-testid="submit-kyc-btn"]').click();

      // Should show error
      cy.contains('Insufficient balance').should('be.visible');
      cy.contains('You need at least 10 HEZ').should('be.visible');
    });

    it('should validate identity name length (max 50 chars)', () => {
      const longName = 'a'.repeat(51);

      cy.get('[data-testid="identity-name-input"]').type(longName);
      cy.get('[data-testid="submit-identity-btn"]').click();

      // Should show validation error
      cy.contains(/name must be 50 characters or less/i).should('be.visible');
    });

    it('should validate IPFS CID format', () => {
      // Set identity first
      cy.get('[data-testid="identity-name-input"]').type(testUser.name);
      cy.get('[data-testid="identity-email-input"]').type(testUser.email);
      cy.get('[data-testid="submit-identity-btn"]').click();

      cy.wait(2000);

      // Enter invalid CID
      const invalidCIDs = ['invalid', 'Qm123', 'notacid'];

      invalidCIDs.forEach((cid) => {
        cy.get('[data-testid="kyc-cid-input"]').clear().type(cid);
        cy.get('[data-testid="submit-kyc-btn"]').click();

        cy.contains(/invalid IPFS CID/i).should('be.visible');
      });
    });
  });

  describe('Citizenship Renunciation', () => {
    it('should allow approved citizens to renounce', () => {
      // Mock approved citizen state
      cy.window().then((win) => {
        (win as any).mockPolkadotState = {
          kycStatus: 'Approved',
          citizenNFTId: 123,
        };
      });

      cy.visit('/citizenship');

      // Should show renounce button
      cy.get('[data-testid="renounce-btn"]').should('be.visible');
      cy.get('[data-testid="renounce-btn"]').click();

      // Confirm renunciation (should show strong warning)
      cy.contains(/are you sure/i).should('be.visible');
      cy.contains(/this action cannot be undone/i).should('be.visible');
      cy.get('[data-testid="confirm-renounce"]').click();

      // Wait for transaction
      cy.contains('Citizenship renounced', { timeout: 10000 }).should('be.visible');

      // Status should reset to NotStarted
      cy.get('[data-testid="kyc-status-badge"]').should('contain', 'Not Started');
    });

    it('should allow reapplication after renunciation', () => {
      // After renouncing (status: NotStarted)
      cy.window().then((win) => {
        (win as any).mockPolkadotState = {
          kycStatus: 'NotStarted',
          previouslyRenounced: true,
        };
      });

      cy.visit('/citizenship');

      // Identity and KYC forms should be available again
      cy.get('[data-testid="identity-name-input"]').should('not.be.disabled');
      cy.contains(/you can reapply/i).should('be.visible');
    });
  });

  describe('Admin KYC Management', () => {
    beforeEach(() => {
      // Switch to admin account
      cy.window().then((win) => {
        (win as any).mockPolkadotWallet.address = testAdmin.wallet;
      });

      cy.visit('/admin/kyc-applications');
    });

    it('should display pending KYC applications', () => {
      cy.get('[data-testid="kyc-application-row"]').should('have.length.greaterThan', 0);

      // Each row should show:
      cy.contains(testUser.name).should('be.visible');
      cy.contains('Pending').should('be.visible');
    });

    it('should approve KYC application', () => {
      cy.get(`[data-testid="approve-kyc-${testUser.wallet}"]`).first().click();
      cy.get('[data-testid="confirm-approval-btn"]').click();

      cy.contains('KYC approved', { timeout: 10000 }).should('be.visible');

      // Application should disappear from pending list
      cy.get(`[data-testid="approve-kyc-${testUser.wallet}"]`).should('not.exist');
    });

    it('should reject KYC application', () => {
      cy.get(`[data-testid="reject-kyc-${testUser.wallet}"]`).first().click();

      // Enter rejection reason
      cy.get('[data-testid="rejection-reason"]').type('Incomplete documents');
      cy.get('[data-testid="confirm-rejection-btn"]').click();

      cy.contains('KYC rejected', { timeout: 10000 }).should('be.visible');
    });
  });
});
