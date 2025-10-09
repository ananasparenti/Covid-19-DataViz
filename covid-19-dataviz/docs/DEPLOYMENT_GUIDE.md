# Deployment Guide

This guide explains how to deploy the COVID-19 DataViz application using the configured CI/CD pipelines.

## 🚀 Deployment Workflows

### 1. Automatic Staging Deployment
**Triggers**: Push to `main` or `develop` branches, or Pull Requests to `main`

```bash
# Deploy to staging
git push origin main
# or
git push origin develop
```

**What happens**:
- ✅ Installs dependencies with caching
- ✅ Builds the application 
- ✅ Deploys to Vercel staging environment
- ✅ Comments on PR with preview URL (for PRs)

### 2. Production Deployment with Approval
**Triggers**: Creating a release or manual workflow dispatch

#### Option A: Release-based deployment
```bash
# Create and push a tag
git tag v1.0.0
git push origin v1.0.0

# Create a release on GitHub
# Go to: Releases > Create a new release > Select your tag
```

#### Option B: Manual deployment
1. Go to GitHub Actions tab
2. Select "Deploy to Production" workflow
3. Click "Run workflow"
4. Enter deployment reason
5. Click "Run workflow" button

**What happens**:
1. 🔍 **Pre-deployment checks** - Full CI pipeline (lint, test, build)
2. ⏳ **Manual approval** - Requires team approval
3. 🚀 **Production deployment** - Deploys to production Vercel

## 🔧 Environment Configuration

### Staging Environment
- **URL**: `https://your-project-staging.vercel.app`
- **Auto-deployment**: ✅ Enabled
- **Branch**: `main`, `develop`

### Production Environment  
- **URL**: `https://your-project.vercel.app`
- **Manual approval**: ✅ Required
- **Branch**: `main` only

## 📊 Monitoring Deployments

### GitHub Actions
1. Go to your repository
2. Click "Actions" tab
3. Monitor workflow runs in real-time

### Vercel Dashboard
1. Visit [Vercel Dashboard](https://vercel.com/dashboard)
2. Select your project
3. View deployment history and logs

## 🛠️ Troubleshooting

### Common Issues

#### Deployment Fails
```bash
# Check logs in GitHub Actions
# Verify secrets are configured correctly
# Ensure Vercel token is valid
```

#### Build Errors
```bash
# Run locally first
cd covid-19-dataviz
npm ci
npm run lint
npm run build
```

#### Environment Variables Missing
```bash
# Check .env.example for required variables
# Verify GitHub Secrets are set
# Ensure Vercel environment variables match
```

### Debug Commands
```bash
# Test build locally
npm run build

# Test with production environment
NODE_ENV=production npm run build

# Check deployment status
vercel --token $VERCEL_TOKEN
```

## 🔄 Rollback Strategy

### Immediate Rollback (Vercel)
1. Go to Vercel Dashboard
2. Select your project
3. Click on previous successful deployment
4. Click "Promote to Production"

### Code Rollback (GitHub)
```bash
# Revert to previous commit
git revert HEAD
git push origin main

# Or reset to specific commit
git reset --hard <previous-commit-hash>
git push origin main --force-with-lease
```

## 📈 Performance Optimizations

### Build Caching
- ✅ Node.js modules cached
- ✅ Next.js build cache enabled  
- ✅ ESLint cache configured
- ✅ NPM cache optimized

### Expected Build Times
- **First build**: ~3-5 minutes
- **Cached builds**: ~1-2 minutes
- **Cache hit ratio**: ~80-90%

## 🔒 Security Checklist

Before deploying to production:

- [ ] All secrets configured in GitHub
- [ ] Environment-specific variables set
- [ ] Production environment protected with approvals
- [ ] No sensitive data in logs
- [ ] HTTPS enabled (automatic with Vercel)
- [ ] Security headers configured

## 📝 Deployment Checklist

### Pre-deployment
- [ ] All tests passing locally
- [ ] Linting passes without errors
- [ ] Build completes successfully
- [ ] Environment variables updated
- [ ] Database migrations run (if applicable)

### Post-deployment
- [ ] Application loads correctly
- [ ] All features working as expected
- [ ] Performance within acceptable limits
- [ ] Error monitoring active
- [ ] Analytics tracking (if configured)

## 🎯 Next Steps

1. **Set up monitoring** - Configure alerts for deployment failures
2. **Add E2E tests** - Implement Playwright or Cypress tests
3. **Database deployments** - Add database migration workflows
4. **Feature flags** - Implement feature toggle system
5. **Load testing** - Test application under load before major releases