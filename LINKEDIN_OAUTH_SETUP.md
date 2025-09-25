# LinkedIn OAuth 2.0 Setup Guide

## 🔐 **LinkedIn App Setup**

### **1. Create LinkedIn App**

1. Go to [LinkedIn Developer Portal](https://www.linkedin.com/developers/)
2. Click **"Create App"**
3. Fill in app details:
   - **App name**: Your App Name
   - **LinkedIn Page**: Select your company page
   - **Privacy Policy URL**: Your privacy policy
   - **App logo**: Upload a logo
4. Click **"Create app"**

### **2. Configure OAuth Settings**

1. In your app dashboard, go to **"Auth"** tab
2. Add redirect URL: `http://localhost:3000/linkedin-connect/callback`
3. Request these scopes:
   - `w_member_social` (for posting)
4. Note down your **Client ID** and **Client Secret**

### **3. Set Environment Variables**

Add to your backend `.env` file:

```bash
LINKEDIN_CLIENT_ID=your_client_id_here
LINKEDIN_CLIENT_SECRET=your_client_secret_here
LINKEDIN_REDIRECT_URI=http://localhost:3000/linkedin-connect/callback
```

### **4. Test the OAuth Flow**

1. Start backend: `uvicorn main:app --reload --port 8000`
2. Start frontend: `npm run dev`
3. Go to `http://localhost:3000/linkedin-connect`
4. Click "Connect to LinkedIn"
5. Authorize the app
6. You'll be redirected back and authenticated!

## **OAuth Flow**

1. **User clicks "Connect"** → Frontend calls `/api/linkedin/auth`
2. **Backend generates OAuth URL** → User redirected to LinkedIn
3. **User authorizes** → LinkedIn redirects to `/linkedin-connect/callback`
4. **Callback exchanges code for token** → Token stored securely
5. **User can now post** → Backend uses stored token for API calls

## **Troubleshooting**

- **CORS errors**: Make sure backend is running on port 8000
- **OAuth errors**: Check your redirect URI matches exactly
- **API errors**: Verify your LinkedIn app has the right permissions
- **Token errors**: Check that your client ID/secret are correct

## **Production Notes**

- Use environment variables for secrets
- Store tokens in Supabase database
- Add proper error handling
- Implement token refresh logic
- Add user session management
