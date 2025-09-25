# LinkedIn OAuth Setup Guide

## 🔐 **OAuth 2.0 Setup Steps**

### **1. Create LinkedIn App**

1. Go to [LinkedIn Developer Portal](https://www.linkedin.com/developers/)
2. Click "Create App"
3. Fill in app details:
   - **App name**: Your App Name
   - **LinkedIn Page**: Select your company page
   - **Privacy Policy URL**: Your privacy policy
   - **App logo**: Upload a logo
4. Click "Create app"

### **2. Configure OAuth Settings**

1. In your app dashboard, go to "Auth" tab
2. Add redirect URL: `http://localhost:3000/linkedin/callback`
3. Request these scopes:
   - `w_member_social` (for posting)
4. Note down your **Client ID** and **Client Secret**

### **3. Set Environment Variables**

Create a `.env` file in the project root:

```bash
LINKEDIN_ACCESS_TOKEN=your_access_token
AUTHOR_PERSON_URI=your_profile_id
```

### **4. Test the Flow**

1. Start backend: `uvicorn backend.main:app --reload --port 8000`
2. Start frontend: `npm run dev`
3. Go to `http://localhost:3000/linkedin`
4. Enter text
5. Click post

## 🚀 **Testing Commands**

```bash
# Backend
cd backend
source venv/bin/activate
uvicorn main:app --reload --port 8000

# Frontend
cd frontend
npm run dev
```

## 🔧 **Troubleshooting**

- **CORS errors**: Make sure backend is running on port 8000
- **OAuth errors**: Check your redirect URI matches exactly
- **API errors**: Verify your LinkedIn app has the right permissions
- **Token errors**: Check that your client ID/secret are correct

## 📝 **Production Notes**

- Use environment variables for secrets
- Store tokens in a database (not in-memory)
- Add proper error handling
- Implement token refresh logic
- Add user session management
