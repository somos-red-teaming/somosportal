# Netlify Environment Variables Setup

## 🔐 Required Environment Variables

To enable authentication in production, add these environment variables to your Netlify site:

### 1. Access Netlify Dashboard
1. Go to [Netlify Dashboard](https://app.netlify.com)
2. Select your `somos.website` site
3. Go to **Site Settings** → **Environment Variables**

### 2. Add Supabase Variables

Add the following environment variables (get values from your Supabase project):

```bash
NEXT_PUBLIC_SUPABASE_URL=your_supabase_project_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
```

**To get these values:**
1. Go to your Supabase project dashboard
2. Navigate to **Settings** → **API**
3. Copy the **Project URL** and **anon public** key

### 3. Configure OAuth Providers (Optional)

For Google and GitHub authentication, configure in Supabase:

#### Google OAuth Setup
1. Go to Supabase Dashboard → Authentication → Providers
2. Enable Google provider
3. Add your Google OAuth credentials
4. Set redirect URL: `https://somos.website/auth/callback`

#### GitHub OAuth Setup
1. Go to Supabase Dashboard → Authentication → Providers  
2. Enable GitHub provider
3. Add your GitHub OAuth credentials
4. Set redirect URL: `https://somos.website/auth/callback`

### 4. Deploy Changes

After adding environment variables:
1. Trigger a new deployment (push to main branch)
2. Verify authentication works on https://somos.website

## ✅ Verification Checklist

- [ ] Environment variables added to Netlify
- [ ] Site redeployed with new variables
- [ ] Registration form works (participant-only)
- [ ] Login form works
- [ ] Email verification works
- [ ] Password reset works
- [ ] Social authentication works (if configured)
- [ ] Protected routes redirect properly
- [ ] User dashboard accessible after login

## 🔧 Troubleshooting

### Common Issues

**Authentication not working in production:**
- Verify environment variables are set correctly
- Check Supabase project URL and keys
- Ensure site has been redeployed after adding variables

**OAuth redirect errors:**
- Verify redirect URLs in OAuth provider settings
- Check Supabase provider configuration
- Ensure callback URL matches: `https://somos.website/auth/callback`

**Email verification not working:**
- Check Supabase email templates
- Verify SMTP configuration in Supabase
- Check spam folder for verification emails
