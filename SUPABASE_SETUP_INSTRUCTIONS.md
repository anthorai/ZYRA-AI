# Complete Supabase Setup for Zyra

## 🚀 Step 1: Execute SQL Setup Script

1. **Go to your Supabase Dashboard**
   - Visit [https://supabase.com/dashboard](https://supabase.com/dashboard)
   - Select your Zyra project
   - Navigate to **SQL Editor**

2. **Execute the Complete Schema**
   - Click **"New Query"**
   - Copy the entire contents of `scripts/complete-supabase-setup.sql`
   - Paste into the SQL Editor
   - Click **"Run"**

This script creates all necessary tables for Zyra including:
- ✅ Users, Products, Campaigns, Analytics
- ✅ Subscription plans with proper pricing ($49, $299, $999)
- ✅ Billing, Invoices, Payment methods
- ✅ AI generation history, Usage stats
- ✅ Row Level Security (RLS) policies
- ✅ Performance indexes

## 🔐 Step 2: Configure Google OAuth

### Google Cloud Console Setup:

1. **Create OAuth Credentials**
   - Go to [Google Cloud Console](https://console.cloud.google.com/)
   - Navigate to **APIs & Services** → **Credentials**
   - Create **OAuth client ID** → Choose **Web application**

2. **Configure Authorized URLs**
   - **Authorized origins**: `https://yourdomain.com`, `http://localhost:3000`
   - **Authorized redirect URIs**: `https://your-project.supabase.co/auth/v1/callback`

3. **OAuth Consent Screen**
   - Go to **OAuth consent screen** → Choose **External**
   - Fill in app name: "Zyra"
   - Add your Supabase project domain
   - Click **Publish**

### Supabase Configuration:

1. **Enable Google Provider**
   - In Supabase Dashboard → **Authentication** → **Providers**
   - Enable **Google** provider
   - Add your Google **Client ID** and **Client Secret**
   - Set **Site URL** to your app's URL

2. **Configure Redirect URLs**
   - Add `http://localhost:3000/auth/callback` for development
   - Add `https://yourdomain.com/auth/callback` for production

## 🔧 Step 3: Environment Variables

Ensure these environment variables are set in your Replit project:

```bash
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_KEY=your-anon-public-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
```

## ✅ Step 4: Test Authentication

1. **Start your application**
   - The app will now use Supabase Auth
   - Visit `/auth` to test the authentication flow

2. **Test Features**
   - ✅ Email/password signup
   - ✅ Email/password login
   - ✅ Google OAuth login
   - ✅ Automatic user profile creation
   - ✅ Protected routes

## 🎯 What's Included

### Authentication Features:
- **Email/Password Auth**: Traditional signup and login
- **Google OAuth**: One-click sign in with Google
- **Session Management**: Automatic session handling
- **Protected Routes**: Route-level authentication
- **User Profiles**: Auto-created user profiles

### Database Schema:
- **Complete Zyra Schema**: All tables for full functionality
- **Subscription Plans**: Starter ($49), Growth ($299), Pro ($999)
- **AI Tools**: Generation history, brand voice, SEO tools
- **E-commerce**: Products, campaigns, analytics
- **Billing**: Stripe integration ready

### Security:
- **Row Level Security**: All tables protected
- **Service Role Access**: Backend operations secured
- **User Data Isolation**: Users can only access their own data

## 🔄 OAuth Flow

1. User clicks "Continue with Google"
2. Redirects to Google OAuth
3. User authorizes Zyra
4. Google redirects to `/auth/callback`
5. Supabase processes the callback
6. User profile automatically created
7. Redirects to dashboard

## 🛠️ Troubleshooting

### Common Issues:

1. **OAuth Redirect Mismatch**
   - Ensure redirect URIs match exactly in Google Console
   - Check Site URL in Supabase settings

2. **CORS Errors**
   - Verify authorized origins in Google Console
   - Check Supabase Auth configuration

3. **Database Connection Issues**
   - Ensure environment variables are set correctly
   - Check Supabase project status

### Debug Steps:

1. Check browser console for authentication errors
2. Verify Supabase logs in Dashboard → Logs
3. Test database connection with provided test script
4. Ensure Google OAuth app is published

## 🎉 Success Indicators

When setup is complete, you should see:
- ✅ Login/signup forms working
- ✅ Google OAuth button functional
- ✅ User redirected to dashboard after auth
- ✅ Database tables populated
- ✅ User profiles created automatically

Your Zyra application now has complete authentication with Google OAuth and a full database schema ready for all features!