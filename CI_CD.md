# CI/CD Documentation

## Overview

This project uses GitHub Actions for Continuous Integration and Continuous Deployment (CI/CD). The pipeline automatically runs tests, security checks, and deploys the application when code is pushed.

## Workflows

### 1. CI/CD Pipeline (`.github/workflows/ci.yml`)

**Triggers:**
- Push to `main`, `develop`, or `claude/**` branches
- Pull requests to `main` or `develop`

**Jobs:**

#### Security Scan
- Runs Trivy vulnerability scanner
- Scans filesystem for security issues
- Uploads results to GitHub Security tab
- Generates SARIF reports

#### Backend Tests
- Sets up Python 3.11
- Installs dependencies from `requirements.txt`
- Runs linting (flake8)
- Runs type checking (mypy)
- Executes pytest with coverage
- Uploads coverage to Codecov

**Services:**
- PostgreSQL 15
- Redis 7

#### Frontend Tests
- Sets up Node.js 20.x
- Installs dependencies with npm ci
- Runs ESLint
- Runs TypeScript type checking
- Executes Vitest with coverage
- Uploads coverage to Codecov

#### Build Check
- Builds frontend production bundle
- Verifies build succeeds
- Uploads build artifacts

#### Docker Build
- Builds Docker image for backend
- Uses BuildKit with cache
- Verifies Docker configuration

#### Deploy (Production Only)
- Runs only on `main` branch pushes
- Executes deployment steps
- Requires all previous jobs to pass

### 2. Security Checks (`.github/workflows/security.yml`)

**Triggers:**
- Push to `main` or `develop`
- Pull requests
- Weekly scheduled scan (Sundays at midnight)

**Jobs:**

#### Dependency Check
- Python: Safety check for known vulnerabilities
- Bandit: Security issue scanner for Python code
- Generates security reports

#### NPM Audit
- Scans npm dependencies for vulnerabilities
- Fails on moderate+ severity issues

#### CodeQL Analysis
- Analyzes JavaScript and Python code
- Detects security vulnerabilities
- Creates alerts in GitHub Security

#### Secrets Scanning
- TruffleHog scans for exposed secrets
- Checks commit history
- Prevents credential leaks

## Setup Instructions

### Prerequisites

1. **GitHub Secrets** (Settings → Secrets and variables → Actions)
   ```
   SENTRY_DSN              # Sentry monitoring DSN
   CODECOV_TOKEN           # Codecov upload token (optional)
   DEPLOY_SSH_KEY          # SSH key for deployment
   PRODUCTION_HOST         # Production server hostname
   ```

2. **Branch Protection Rules**
   - Require status checks to pass before merging
   - Require branches to be up to date before merging
   - Require review from code owners
   - Include administrators in restrictions

### Local Setup for CI Testing

Run the same checks locally before pushing:

```bash
# Backend
cd server
flake8 .
mypy .
pytest --cov

# Frontend
cd client
npm run lint
npm run type-check
npm test
```

## Pipeline Stages

```
┌─────────────┐
│   Commit    │
└──────┬──────┘
       │
       ▼
┌─────────────────────────────────┐
│     Security Scan (Trivy)       │
└──────┬──────────────────┬───────┘
       │                  │
       ▼                  ▼
┌──────────────┐   ┌──────────────┐
│Backend Tests │   │Frontend Tests│
└──────┬───────┘   └──────┬───────┘
       │                  │
       └────────┬─────────┘
                ▼
       ┌────────────────┐
       │  Build Check   │
       └────────┬───────┘
                │
                ▼
       ┌────────────────┐
       │ Docker Build   │
       └────────┬───────┘
                │
                ▼
       ┌────────────────┐
       │Deploy(main only)│
       └────────────────┘
```

## Test Coverage Requirements

- **Backend**: Minimum 80% coverage
- **Frontend**: Minimum 80% coverage
- Coverage reports uploaded to Codecov
- Failing coverage fails the build

## Build Artifacts

Build artifacts are stored for:
- Frontend production builds (7 days retention)
- Security scan reports (90 days retention)
- Test coverage reports (30 days retention)

Access artifacts:
1. Go to Actions tab
2. Select workflow run
3. Scroll to "Artifacts" section

## Deployment

### Automatic Deployment

Pushes to `main` branch automatically deploy to production if all tests pass.

### Manual Deployment

Trigger manual deployment:
```bash
gh workflow run ci.yml --ref main
```

### Deployment Checklist

Before deploying:
- [ ] All tests passing
- [ ] Security scans clean
- [ ] Coverage requirements met
- [ ] Documentation updated
- [ ] Database migrations ready
- [ ] Environment variables configured

## Monitoring

### Build Status Badges

Add to README.md:
```markdown
![CI/CD](https://github.com/username/aoe2-web/workflows/CI%2FCD%20Pipeline/badge.svg)
![Security](https://github.com/username/aoe2-web/workflows/Security%20Checks/badge.svg)
[![codecov](https://codecov.io/gh/username/aoe2-web/branch/main/graph/badge.svg)](https://codecov.io/gh/username/aoe2-web)
```

### Notifications

Configure notifications in `.github/workflows/`:
- Slack integration
- Email notifications
- Discord webhooks

Example Slack notification:
```yaml
- name: Slack Notification
  uses: 8398a7/action-slack@v3
  with:
    status: ${{ job.status }}
    text: 'Deployment completed'
    webhook_url: ${{ secrets.SLACK_WEBHOOK }}
  if: always()
```

## Troubleshooting

### Common Issues

**1. Tests failing in CI but passing locally**
- Check Python/Node versions match
- Verify environment variables
- Check database/Redis availability

**2. Docker build failures**
- Clear Docker cache: `docker builder prune`
- Check Dockerfile syntax
- Verify base image availability

**3. Security scan false positives**
- Review Trivy/Bandit reports
- Add exceptions in configuration
- Update dependencies

**4. Slow builds**
- Use caching for dependencies
- Parallelize jobs where possible
- Optimize test suite

### Debugging

View detailed logs:
```bash
# Via GitHub CLI
gh run view <run-id> --log

# Or view in browser
# Actions → Select workflow run → View logs
```

Re-run failed jobs:
```bash
gh run rerun <run-id>
```

## Performance Optimization

### Caching

**Backend dependencies:**
```yaml
- uses: actions/setup-python@v4
  with:
    cache: 'pip'
```

**Frontend dependencies:**
```yaml
- uses: actions/setup-node@v4
  with:
    cache: 'npm'
```

**Docker layers:**
```yaml
cache-from: type=gha
cache-to: type=gha,mode=max
```

### Matrix Strategy

Run tests on multiple versions:
```yaml
strategy:
  matrix:
    python-version: [3.10, 3.11, 3.12]
    node-version: [18.x, 20.x]
```

## Best Practices

1. **Keep workflows DRY**
   - Use reusable workflows
   - Share common steps

2. **Fast feedback**
   - Run fastest tests first
   - Fail fast on errors

3. **Security first**
   - Scan before deploy
   - Never commit secrets
   - Use environment secrets

4. **Monitor everything**
   - Track build times
   - Monitor failure rates
   - Set up alerts

5. **Document changes**
   - Update this file
   - Add workflow comments
   - Document new steps

## Resources

- [GitHub Actions Documentation](https://docs.github.com/en/actions)
- [Codecov Integration](https://docs.codecov.io/docs)
- [Trivy Scanner](https://github.com/aquasecurity/trivy)
- [CodeQL](https://codeql.github.com/)

## Maintenance

### Weekly Tasks
- Review security scan results
- Update dependencies
- Check build performance

### Monthly Tasks
- Audit secrets and rotate if needed
- Review and update workflows
- Clean up old artifacts

### Quarterly Tasks
- Update base images
- Review and optimize pipeline
- Update documentation
