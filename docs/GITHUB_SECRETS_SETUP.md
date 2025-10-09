# GitHub Secrets Configuration Guide

This document outlines all the required GitHub Secrets and environment variables needed for the CI/CD pipelines.

## Required GitHub Secrets

### Vercel Deployment Secrets
Add these secrets in your GitHub repository settings (`Settings > Secrets and variables > Actions`):

| Secret Name | Description | How to Get |
|-------------|-------------|------------|
| `VERCEL_TOKEN` | Vercel authentication token | 1. Go to [Vercel Dashboard](https://vercel.com/dashboard)<br>2. Click on your avatar → Settings<br>3. Go to "Tokens" tab<br>4. Create a new token |
| `VERCEL_ORG_ID` | Your Vercel organization ID | 1. Run `npx vercel` in your project<br>2. Link to your Vercel project<br>3. Check `.vercel/project.json` for `orgId` |
| `VERCEL_PROJECT_ID` | Your Vercel project ID | 1. Run `npx vercel` in your project<br>2. Link to your Vercel project<br>3. Check `.vercel/project.json` for `projectId` |

### Application Secrets (Add as needed)
| Secret Name | Description | Example Value |
|-------------|-------------|---------------|
| `API_KEY_COVID_DATA` | COVID-19 data API key (if needed) | `abc123def456` |
| `DATABASE_URL` | Database connection URL | `postgresql://user:pass@host:5432/db` |
| `NEXTAUTH_SECRET` | NextAuth.js secret key | `your-secret-key-here` |
| `NEXTAUTH_URL` | NextAuth.js URL | `https://your-app.vercel.app` |

## GitHub Environments

Configure these environments in your repository settings (`Settings > Environments`):

### 1. `staging` Environment
- **Protection rules**: None (auto-deploy)
- **Environment secrets**: Same as repository secrets
- **Deployment branches**: `main`, `develop`

### 2. `production-approval` Environment
- **Protection rules**: 
  - ✅ Required reviewers (add team members)
  - ✅ Wait timer: 0 minutes
- **Environment secrets**: None needed
- **Deployment branches**: `main` only

### 3. `production` Environment
- **Protection rules**: 
  - ✅ Required reviewers (add team members)
  - ✅ Wait timer: 5 minutes (optional)
- **Environment secrets**: Production-specific secrets if different
- **Deployment branches**: `main` only

## Setup Instructions

### Step 1: Create Vercel Project
```bash
cd covid-19-dataviz
npx vercel
# Follow prompts to link/create project
```

### Step 2: Get Vercel Credentials
```bash
# This creates .vercel/project.json with orgId and projectId
cat .vercel/project.json
```

### Step 3: Add GitHub Secrets
1. Go to your GitHub repository
2. Navigate to `Settings > Secrets and variables > Actions`
3. Click "New repository secret"
4. Add each secret from the table above

### Step 4: Configure Environments
1. Go to `Settings > Environments`
2. Click "New environment"
3. Create each environment with the specified protection rules

### Step 5: Test Deployments
```bash
# Trigger staging deployment
git push origin main

# Trigger production deployment (manual)
# Go to Actions tab > Deploy to Production > Run workflow
```

## Environment Variables in Code

Access secrets in your Next.js application:

```javascript
// In your Next.js API routes or components
const apiKey = process.env.API_KEY_COVID_DATA;
const dbUrl = process.env.DATABASE_URL;
```

## Security Best Practices

1. **Never commit secrets** to your repository
2. **Use different secrets** for staging and production
3. **Rotate secrets regularly** (every 90 days)
4. **Limit access** to production environment
5. **Use environment-specific configurations**

## Troubleshooting

### Common Issues

1. **Vercel deployment fails**: Check `VERCEL_TOKEN`, `VERCEL_ORG_ID`, and `VERCEL_PROJECT_ID`
2. **Permission denied**: Ensure Vercel token has correct permissions
3. **Environment not found**: Create the required environments in GitHub settings
4. **Manual approval not working**: Check environment protection rules

### Debug Commands
```bash
# Test Vercel authentication
vercel whoami --token $VERCEL_TOKEN

# Test project linking
vercel --token $VERCEL_TOKEN --debug
```

## Next Steps

After setting up secrets:
1. Push code to trigger staging deployment
2. Create a release to trigger production deployment
3. Monitor deployments in GitHub Actions and Vercel dashboard
4. Set up monitoring and alerts for production environment