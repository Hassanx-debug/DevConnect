# DevConnect Deployment Guide

This guide provides step-by-step instructions for deploying the DevConnect MERN stack application across MongoDB Atlas, Hugging Face Spaces (backend), and Vercel (frontend).

---

## 📋 Prerequisites

Before starting, ensure you have:
- Git installed and configured
- Node.js 20+ installed locally
- A Hugging Face account (https://huggingface.co)
- A Vercel account (https://vercel.com)
- MongoDB Atlas account with cluster created

---

## 🗄️ 1. MongoDB Atlas Configuration

Your MongoDB Atlas connection string is already configured:
```
mongodb+srv://hassanair5858_db_user:374kANkeAn1nAORE@cluster0.9tk566w.mongodb.net/devconnect?appName=Cluster0
```

**Verify:**
- Cluster is running (M0 Free Tier)
- Database user `hassanair5858_db_user` exists with correct password
- IP whitelist includes `0.0.0.0/0` (or your specific IP) for testing
- Database name is `devconnect`

---

## 🚀 2. Backend Deployment to Hugging Face Spaces

### 2.1 Initialize Git Repository

```bash
# Navigate to your project root
cd c:/Users/Administrator/Desktop/DevConnect-main

# Initialize git repository (if not already done)
git init

# Add all files
git add .

# Create initial commit
git commit -m "Initial commit for DevConnect backend"
```

### 2.2 Add Hugging Face Remote

```bash
# Replace with your actual Hugging Face username
git remote add hf https://huggingface.co/spaces/hassan5858/devconnect

# Verify remote was added
git remote -v
```

### 2.3 Create Hugging Face Access Token

1. Go to https://huggingface.co/settings/tokens
2. Click **"New token"**
3. Name: `devconnect-deploy`
4. Type: **Write** (required for pushing code)
5. Copy the token (save it securely, you won't see it again)

### 2.4 Push to Hugging Face Spaces

```bash
# Push code to Hugging Face
git push hf main

# When prompted:
# Username: hassan5858
# Password: <paste-your-hf-access-token-here>
```

**Note:** If your local branch is `master` instead of `main`, use:
```bash
git push hf master
```

### 2.5 Configure Hugging Face Space Settings

After pushing, go to your Space dashboard: `https://huggingface.co/spaces/hassan5858/devconnect`

#### Enable Docker SDK:
1. Click **"Settings"** tab
2. Under **"Docker SDK"**, select **"Docker"**
3. Save changes

#### Add Environment Variables (Secrets):
Click **"Settings"** → **"Variables and secrets"** → **"New secret"**

Add the following secrets:

| Variable Name | Value | Description |
|--------------|-------|-------------|
| `MONGODB_URI` | `mongodb+srv://hassanair5858_db_user:374kANkeAn1nAORE@cluster0.9tk566w.mongodb.net/devconnect?appName=Cluster0` | MongoDB Atlas connection string |
| `JWT_ACCESS_SECRET` | `your-super-secret-access-key-change-this-in-production-12345` | JWT access token secret (generate a strong random string) |
| `JWT_REFRESH_SECRET` | `your-super-secret-refresh-key-change-this-in-production-67890` | JWT refresh token secret (generate a strong random string) |
| `CLIENT_URL` | `https://dev-connect-chi-six.vercel.app` | Frontend Vercel URL (update after Vercel deployment) |
| `NODE_ENV` | `production` | Environment mode |

**Generate secure secrets:**
```bash
# On Windows PowerShell
-join ((48..57) + (65..90) + (97..122) | Get-Random -Count 32 | ForEach-Object {[char]$_})

# On Linux/Mac
openssl rand -hex 32
```

### 2.6 Monitor Deployment

- Go to **"Logs"** tab in Hugging Face Space
- Wait for build to complete (first deployment takes 2-3 minutes)
- Look for: `📡 DevConnect API server running on port 7860`

### 2.7 Your Backend URL

After successful deployment, your API will be available at:
```
https://hassan5858-devconnect.hf.space
```

**Test the API:**
```bash
# Health check
curl https://hassan5858-devconnect.hf.space/api/v1/stats
```

---

## 🎨 3. Frontend Deployment to Vercel

### 3.1 Update Frontend Environment Variables

Before deploying to Vercel, update your frontend API URL configuration.

**Check your frontend API configuration file** (likely `src/api.ts` or similar):

```typescript
// Update this to point to your Hugging Face backend
export const API_URL = import.meta.env.VITE_API_URL || 
  "https://hassan5858-devconnect.hf.space";
```

### 3.2 Deploy to Vercel

#### Option A: Via Vercel Dashboard (Recommended)

1. Go to https://vercel.com/new
2. Import your Git repository (GitHub/GitLab/Bitbucket)
3. Configure project:
   - **Framework Preset:** Vite
   - **Root Directory:** `./` (or `frontend` if you have a separate frontend folder)
   - **Build Command:** `npm run build`
   - **Output Directory:** `dist`
4. Add Environment Variables:
   - Click **"Environment Variables"**
   - Add: `VITE_API_URL` = `https://hassan5858-devconnect.hf.space`
5. Click **"Deploy"**

#### Option B: Via Vercel CLI

```bash
# Install Vercel CLI
npm i -g vercel

# Login
vercel login

# Deploy (run from project root)
vercel

# Follow prompts:
# - Set up and deploy? Yes
# - Which scope? Your account
# - Link to existing project? No
# - Project name? devconnect
# - Directory? ./
# - Override settings? No

# For production deployment
vercel --prod
```

### 3.3 Configure Vercel Environment Variables

After initial deployment:

1. Go to https://vercel.com/your-username/devconnect/settings/environment-variables
2. Add the following:

| Variable | Value | Environment |
|----------|-------|-------------|
| `VITE_API_URL` | `https://hassan5858-devconnect.hf.space` | Production, Preview, Development |

3. Click **"Save"**
4. Redeploy for changes to take effect: **"Deployments"** → **"Redeploy"**

### 3.4 Your Frontend URL

After deployment, your frontend will be available at:
```
https://dev-connect-chi-six.vercel.app
```

---

## 🔄 4. Update Backend CORS Configuration

After Vercel deployment is complete:

1. Go back to Hugging Face Space Settings
2. Update the `CLIENT_URL` secret:
   ```
   https://dev-connect-chi-six.vercel.app
   ```
3. The backend will automatically redeploy with the new CORS configuration

---

## ✅ 5. Verification Checklist

### Backend (Hugging Face)
- [ ] Space builds successfully without errors
- [ ] Logs show: `📡 DevConnect API server running on port 7860`
- [ ] Health check passes: `curl https://hassan5858-devconnect.hf.space/api/v1/stats`
- [ ] CORS allows requests from Vercel domain
- [ ] MongoDB connection successful (check logs for MongoDB connection message)

### Frontend (Vercel)
- [ ] Site loads at https://dev-connect-chi-six.vercel.app
- [ ] No console errors related to API calls
- [ ] Can register a new user
- [ ] Can login with existing credentials
- [ ] API calls reach the backend (check network tab)

### Database (MongoDB Atlas)
- [ ] Connection established
- [ ] Users can be created
- [ ] Posts can be created
- [ ] Data persists across deployments

---

## 🔧 6. Common Issues & Troubleshooting

### Issue: "CORS Error"
**Solution:** Ensure `CLIENT_URL` in Hugging Face matches your Vercel domain exactly (including `https://` and no trailing slash).

### Issue: "Cannot connect to MongoDB"
**Solution:** 
- Verify MongoDB Atlas cluster is running
- Check IP whitelist includes `0.0.0.0/0`
- Verify connection string credentials

### Issue: "Cookies not working in production"
**Solution:** 
- Ensure `sameSite: "none"` is set for production (already configured)
- Ensure `secure: true` is set for production (already configured)
- Frontend must use `https://` (not `http://`)

### Issue: "Build fails on Hugging Face"
**Solution:**
- Check logs for specific error
- Ensure all dependencies are in `package.json`
- Verify `npm run build` works locally first

### Issue: "Port already in use"
**Solution:** Hugging Face Spaces requires port 7860. The configuration already handles this with `process.env.PORT || 7860`.

---

## 🔄 7. Updating Deployments

### Update Backend
```bash
# Make your code changes
git add .
git commit -m "Description of changes"
git push hf main  # or master
```

Hugging Face will automatically rebuild and redeploy.

### Update Frontend
```bash
# Push to your Git repository (GitHub/GitLab)
git add .
git commit -m "Description of changes"
git push origin main

# Vercel will automatically detect and deploy
```

---

## 📊 8. Environment Variables Summary

### Hugging Face Secrets
```
MONGODB_URI=mongodb+srv://hassanair5858_db_user:374kANkeAn1nAORE@cluster0.9tk566w.mongodb.net/devconnect?appName=Cluster0
JWT_ACCESS_SECRET=<generate-secure-random-string>
JWT_REFRESH_SECRET=<generate-secure-random-string>
CLIENT_URL=https://dev-connect-chi-six.vercel.app
NODE_ENV=production
```

### Vercel Environment Variables
```
VITE_API_URL=https://hassan5858-devconnect.hf.space
```

---

## 🎯 9. Production URLs

After complete deployment:

- **Frontend:** https://dev-connect-chi-six.vercel.app
- **Backend API:** https://hassan5858-devconnect.hf.space
- **Database:** MongoDB Atlas (M0 Free Tier)

---

## 📝 10. Next Steps

1. **Custom Domain (Optional):**
   - Vercel: Add custom domain in project settings
   - Update `CLIENT_URL` in Hugging Face to match

2. **Monitoring:**
   - Enable Hugging Face Space monitoring
   - Set up Vercel Analytics
   - Monitor MongoDB Atlas metrics

3. **Security:**
   - Rotate JWT secrets periodically
   - Enable MongoDB Atlas IP whitelist (remove `0.0.0.0/0` after testing)
   - Enable rate limiting (already configured)

4. **Scaling:**
   - Upgrade Hugging Face Space to paid tier for always-on
   - Consider MongoDB Atlas M2+ tier for production
   - Enable Vercel Pro for advanced features

---

## 🆘 Support

If you encounter issues:
1. Check Hugging Face Space logs
2. Check Vercel deployment logs
3. Check MongoDB Atlas logs
4. Verify all environment variables are set correctly
5. Test API endpoints individually with curl/Postman

---

**Deployment completed! 🎉**