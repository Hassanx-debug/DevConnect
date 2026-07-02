# Hugging Face Spaces Deployment - Step by Step

This guide will walk you through deploying your DevConnect MERN backend to Hugging Face Spaces.

---

## 📋 Prerequisites

- Hugging Face account: `hassan5858`
- Space name: `devconnect`
- Hugging Face Access Token with **Write** permissions
- Git installed locally

---

## 🚀 Step 1: Install Hugging Face CLI (Optional but Recommended)

### Option A: Install via PowerShell (Windows)

```powershell
powershell -ExecutionPolicy ByPass -c "irm [https://hf.co/cli/install.ps1](https://hf.co/cli/install.ps1) | iex"
```

After installation, verify:
```bash
hf --version
```

### Option B: Use Git Directly (No CLI Required)

You can skip the CLI installation and use Git directly (see Step 2B).

---

## 📥 Step 2: Download/Clone the Blank Space Repository

### Option A: Using Hugging Face CLI (Recommended)

```bash
# Create a new directory for your Space
mkdir devconnect-space
cd devconnect-space

# Download the blank Space repository
hf download hassan5858/devconnect --repo-type=space
```

**Note:** This will download the default template files. You'll replace them with your backend code.

### Option B: Using Git (Alternative Method)

```bash
# Create a new directory for your Space
mkdir devconnect-space
cd devconnect-space

# Clone the blank Space repository
# When prompted for password, use your Hugging Face Access Token (not your account password)
git clone https://huggingface.co/spaces/hassan5858/devconnect .
```

**Important:** 
- The `.` at the end clones into the current directory
- Use your **Write Access Token** as the password (not your HF account password)
- Username: `hassan5858`
- Password: `your_hf_write_access_token_here`

---

## 📂 Step 3: Prepare Your Backend Files

### 3.1 Copy Your Backend Code

From your main project directory (`c:/Users/Administrator/Desktop/DevConnect-main`), copy these files to the `devconnect-space` directory:

**Files to copy:**
- `server.ts` (root level)
- `package.json`
- `package-lock.json` (if exists)
- `tsconfig.json`
- `vite.config.ts`
- `Dockerfile` (already created)
- `.gitignore` (if exists)
- Entire `server/` folder

**Command to copy (Windows):**
```bash
# From your main project directory
cd c:/Users/Administrator/Desktop/DevConnect-main

# Copy files to the Space directory
xcopy server.ts C:\Users\Administrator\Desktop\devconnect-space\ /Y
xcopy package.json C:\Users\Administrator\Desktop\devconnect-space\ /Y
xcopy package-lock.json C:\Users\Administrator\Desktop\devconnect-space\ /Y
xcopy tsconfig.json C:\Users\Administrator\Desktop\devconnect-space\ /Y
xcopy vite.config.ts C:\Users\Administrator\Desktop\devconnect-space\ /Y
xcopy Dockerfile C:\Users\Administrator\Desktop\devconnect-space\ /Y
xcopy .gitignore C:\Users\Administrator\Desktop\devconnect-space\ /Y

# Copy the entire server folder
xcopy server C:\Users\Administrator\Desktop\devconnect-space\server\ /E /I /Y
```

**Or manually copy using File Explorer:**
1. Open `C:\Users\Administrator\Desktop\DevConnect-main`
2. Select and copy the files listed above
3. Open `C:\Users\Administrator\Desktop\devconnect-space`
4. Paste the files

### 3.2 Verify File Structure

Your `devconnect-space` directory should look like this:

```
devconnect-space/
├── server.ts
├── package.json
├── package-lock.json
├── tsconfig.json
├── vite.config.ts
├── Dockerfile
├── .gitignore
└── server/
    ├── db.ts
    ├── middleware.ts
    ├── models.ts
    ├── routes.ts
    ├── services.ts
    └── authUtils.ts
```

---

## 🔧 Step 4: Configure Git and Push to Hugging Face

### 4.1 Initialize Git (if not already done)

```bash
cd devconnect-space

# Initialize git repository
git init

# Add all files
git add .

# Create initial commit
git commit -m "Initial commit: DevConnect MERN backend for Hugging Face Spaces"
```

### 4.2 Add Hugging Face Remote

```bash
# Add the Hugging Face remote
git remote add hf https://huggingface.co/spaces/hassan5858/devconnect

# Verify the remote was added
git remote -v
```

You should see:
```
hf  https://huggingface.co/spaces/hassan5858/devconnect (fetch)
hf  https://huggingface.co/spaces/hassan5858/devconnect (push)
```

### 4.3 Push to Hugging Face Spaces

```bash
# Push code to Hugging Face
git push hf main
```

**When prompted:**
- **Username:** `hassan5858`
- **Password:** `your_hf_write_access_token_here`

**Note:** If your local branch is `master` instead of `main`, use:
```bash
git push hf master
```

---

## ⚙️ Step 5: Configure Hugging Face Space Settings

### 5.1 Enable Docker SDK

1. Go to your Space: https://huggingface.co/spaces/hassan5858/devconnect
2. Click **"Settings"** tab
3. Under **"Docker SDK"**, select **"Docker"**
4. Click **"Save"**

### 5.2 Add Environment Variables (Secrets)

1. In the Space Settings, click **"Variables and secrets"**
2. Click **"New secret"** for each variable:

| Variable Name | Value | Description |
|--------------|-------|-------------|
| `MONGODB_URI` | `mongodb+srv://hassanair5858_db_user:374kANkeAn1nAORE@cluster0.9tk566w.mongodb.net/devconnect?appName=Cluster0` | MongoDB Atlas connection string |
| `JWT_ACCESS_SECRET` | `your-super-secret-access-key-change-this-in-production-12345` | JWT access token secret |
| `JWT_REFRESH_SECRET` | `your-super-secret-refresh-key-change-this-in-production-67890` | JWT refresh token secret |
| `CLIENT_URL` | `https://dev-connect-chi-six.vercel.app` | Frontend Vercel URL (update after Vercel deployment) |
| `NODE_ENV` | `production` | Environment mode |

**Generate secure secrets (Windows PowerShell):**
```powershell
-join ((48..57) + (65..90) + (97..122) | Get-Random -Count 32 | ForEach-Object {[char]$_})
```

---

## 🏗️ Step 6: Monitor the Build

1. Go to the **"Logs"** tab in your Hugging Face Space
2. Wait for the build to complete (first deployment takes 2-3 minutes)
3. Look for this success message:
   ```
   📡 DevConnect API server running on port 7860
   ```

### Build Process Explanation

The Dockerfile will:
1. Use `node:20-slim` as the base image
2. Install all dependencies (including devDependencies for build)
3. Copy your backend source code
4. Run `npm run build` to compile TypeScript
5. Start the server with `npm start` on port 7860

---

## ✅ Step 7: Verify Deployment

### 7.1 Test the API

Once deployed, test your API:

```bash
# Health check
curl https://hassan5858-devconnect.hf.space/api/v1/stats
```

You should get a JSON response with stats data.

### 7.2 Test Authentication Endpoints

```bash
# Test registration (example)
curl -X POST https://hassan5858-devconnect.hf.space/api/v1/auth/register \
  -H "Content-Type: application/json" \
  -d '{"name":"Test User","username":"testuser","email":"test@example.com","password":"password123","confirmPassword":"password123"}'
```

---

## 🔄 Step 8: Update Your Deployment

When you make changes to your backend code:

```bash
cd devconnect-space

# Stage changes
git add .

# Commit changes
git commit -m "Description of your changes"

# Push to Hugging Face (triggers automatic rebuild)
git push hf main
```

Hugging Face will automatically:
1. Detect the push
2. Rebuild the Docker container
3. Redeploy the updated application

---

## 🐛 Troubleshooting

### Issue: "Build fails"
**Solution:** 
- Check the Logs tab for specific error messages
- Ensure all dependencies are in `package.json`
- Verify `npm run build` works locally first

### Issue: "Cannot connect to MongoDB"
**Solution:**
- Verify MongoDB Atlas cluster is running
- Check IP whitelist includes `0.0.0.0/0`
- Verify connection string credentials in Secrets

### Issue: "Port already in use"
**Solution:** The configuration already handles this with `process.env.PORT || 7860`.

### Issue: "Git push asks for password repeatedly"
**Solution:**
- Use your Hugging Face **Access Token** (not account password)
- Token must have **Write** permissions
- Generate token at: https://huggingface.co/settings/tokens

---

## 📊 Your Production URLs

After successful deployment:

- **Backend API:** https://hassan5858-devconnect.hf.space
- **Frontend (Vercel):** https://dev-connect-chi-six.vercel.app (after Vercel deployment)
- **Database:** MongoDB Atlas (M0 Free Tier)

---

## 🎯 Next Steps

1. **Deploy Frontend to Vercel:**
   - Follow the Vercel deployment steps in `DEPLOYMENT_GUIDE.md`
   - Set `VITE_API_URL` to `https://hassan5858-devconnect.hf.space`

2. **Update CORS Configuration:**
   - After Vercel deployment, update `CLIENT_URL` in Hugging Face Secrets
   - Backend will automatically redeploy with new CORS settings

3. **Test Full Stack:**
   - Register a new user
   - Login
   - Create posts
   - Test all features

---

## 📝 Important Notes

- **Port:** Hugging Face Spaces requires port 7860 (already configured)
- **Host:** Must bind to `0.0.0.0` (already configured in server.ts)
- **Build Time:** First deployment takes 2-3 minutes
- **Auto-Deploy:** Every `git push` triggers automatic rebuild
- **Logs:** Monitor the Logs tab for build and runtime logs

---

**Ready to deploy! 🚀**

Follow the steps above in order, and your backend will be live on Hugging Face Spaces in minutes.