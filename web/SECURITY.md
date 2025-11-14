# Security Policy - PezkuwiChain Web Application

## = Overview

This document outlines security practices and policies for the PezkuwiChain web application. We take security seriously and encourage responsible disclosure of vulnerabilities.

---

## =Ë Supported Versions

| Version | Supported          | Status |
| ------- | ------------------ | ------ |
| main    |  Yes             | Active Development |
| < 1.0   |   Use at own risk | Pre-release |

---

## =¨ Reporting a Vulnerability

**Please DO NOT report security vulnerabilities through public GitHub issues.**

Instead, please report them to: **security@pezkuwichain.io**

You should receive a response within 48 hours. If the issue is confirmed, we will:
1. Acknowledge receipt of your report
2. Provide an estimated timeline for a fix
3. Notify you when the issue is resolved
4. Credit you in our security acknowledgments (if desired)

---

## = Security Best Practices

### For Developers

#### 1. Environment Variables
- L **NEVER** commit `.env` files to git
-  **ALWAYS** use `.env.example` as a template
-  Use environment variables for all sensitive data
-  Rotate secrets regularly

```bash
# BAD - Never do this
git add .env
git commit -m "Add config"

# GOOD - Use example file
cp .env.example .env
# Then edit .env locally
```

#### 2. Credentials Management
- L **NEVER** hardcode passwords, API keys, or secrets
-  Use environment variables: `import.meta.env.VITE_API_KEY`
-  Use secret management tools (Vault, AWS Secrets Manager)
-  Enable demo mode only for development: `VITE_ENABLE_DEMO_MODE=false` in production

#### 3. Git Hygiene
```bash
# Before committing, check for secrets
git diff

# Use pre-commit hooks (see .git-hooks/)
git secrets --scan

# Check git history for leaked secrets
git log --all --full-history --source -- .env
```

#### 4. Code Review Checklist
- [ ] No hardcoded credentials
- [ ] Environment variables used correctly
- [ ] No sensitive data in logs
- [ ] Input validation implemented
- [ ] XSS protection in place
- [ ] CSRF tokens used where needed

---

## =á Security Measures Implemented

### 1. Environment Variable Protection
- `.env` is gitignored
- `.gitattributes` prevents merge conflicts
- Example file (`.env.example`) provided with safe defaults

### 2. Wallet Security
- Polkadot.js extension integration (secure key management)
- No private keys stored in application
- Transaction signing happens in extension
- Message signing with user confirmation

### 3. Authentication
- Supabase Auth integration
- Demo mode controllable via environment flag
- Session management
- Admin role verification

### 4. API Security
- WebSocket connections to trusted endpoints only
- RPC call validation
- Rate limiting (TODO: implement)
- Input sanitization

### 5. Frontend Security
- Content Security Policy (TODO: implement)
- XSS protection via React
- HTTPS only in production
- Secure cookie settings

---

##   Known Security Considerations

### Current State (Development)

#### =á Medium Priority
1. **Demo Mode Credentials**
   - Located in `.env` file
   - Should be disabled in production: `VITE_ENABLE_DEMO_MODE=false`
   - Credentials should be rotated before mainnet launch

2. **Mock Data**
   - Some components still use placeholder data
   - See TODO comments in code
   - Will be replaced with real blockchain queries

3. **Endpoint Security**
   - WebSocket endpoints are configurable
   - Ensure production endpoints use WSS (secure WebSocket)
   - Validate SSL certificates

#### =â Low Priority
1. **Transaction Simulation**
   - Some swap/staking transactions are simulated
   - Marked with TODO comments
   - Safe for development, not for production

---

## = Security Checklist Before Production

### Pre-Launch Requirements

- [ ] **Environment Variables**
  - [ ] All secrets in environment variables
  - [ ] Demo mode disabled
  - [ ] Founder credentials removed or rotated
  - [ ] Production endpoints configured

- [ ] **Code Audit**
  - [ ] No TODO comments with security implications
  - [ ] All mock data removed
  - [ ] Real blockchain queries implemented
  - [ ] Error messages don't leak sensitive info

- [ ] **Infrastructure**
  - [ ] HTTPS/WSS enforced
  - [ ] CORS configured properly
  - [ ] Rate limiting enabled
  - [ ] DDoS protection in place
  - [ ] Monitoring and alerting configured

- [ ] **Testing**
  - [ ] Security penetration testing completed
  - [ ] Wallet connection tested
  - [ ] Transaction signing tested
  - [ ] Error handling tested

- [ ] **Documentation**
  - [ ] Security policy updated
  - [ ] Deployment guide includes security steps
  - [ ] Incident response plan documented

---

## =€ Deployment Security

### Production Environment

```bash
# Production .env example
VITE_NETWORK=mainnet
VITE_ENABLE_DEMO_MODE=false  #  CRITICAL
VITE_MAINNET_WS=wss://mainnet.pezkuwichain.io
VITE_DEBUG_MODE=false
```

### Environment Validation Script

```typescript
// src/config/validate-env.ts
export function validateProductionEnv() {
  if (import.meta.env.PROD) {
    // Ensure demo mode is disabled
    if (import.meta.env.VITE_ENABLE_DEMO_MODE === 'true') {
      throw new Error('Demo mode must be disabled in production!');
    }

    // Ensure secure endpoints
    if (!import.meta.env.VITE_MAINNET_WS?.startsWith('wss://')) {
      throw new Error('Production must use secure WebSocket (wss://)');
    }

    // Add more checks...
  }
}
```

---

## =Ú Resources

### Security Tools
- [git-secrets](https://github.com/awslabs/git-secrets) - Prevents committing secrets
- [gitleaks](https://github.com/zricethezav/gitleaks) - Detects hardcoded secrets
- [TruffleHog](https://github.com/trufflesecurity/trufflehog) - Scans for secrets in git history

### Substrate Security
- [Polkadot Security Best Practices](https://wiki.polkadot.network/docs/learn-security)
- [Substrate Security](https://docs.substrate.io/learn/runtime-development/#security)

### Web3 Security
- [Smart Contract Security Best Practices](https://consensys.github.io/smart-contract-best-practices/)
- [OWASP Top 10](https://owasp.org/www-project-top-ten/)

---

## <˜ Incident Response

If a security incident occurs:

1. **Immediate Actions**
   - Assess the scope and impact
   - Contain the incident (disable affected features)
   - Preserve evidence (logs, screenshots)

2. **Notification**
   - Notify security@pezkuwichain.io
   - Inform affected users (if applicable)
   - Report to relevant authorities (if required)

3. **Remediation**
   - Apply security patches
   - Rotate compromised credentials
   - Update security measures

4. **Post-Incident**
   - Conduct root cause analysis
   - Update security policies
   - Implement preventive measures

---

##  Security Acknowledgments

We thank the following individuals for responsibly disclosing security issues:

*(List will be updated as vulnerabilities are reported and fixed)*

---

## =Ý Version History

| Date       | Version | Changes                          |
|------------|---------|----------------------------------|
| 2024-10-28 | 1.0     | Initial security policy created  |

---

**Last Updated:** October 28, 2024
**Contact:** security@pezkuwichain.io
