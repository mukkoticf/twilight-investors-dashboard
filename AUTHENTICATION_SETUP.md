# Authentication Setup Guide

## ✅ What Has Been Implemented

### Frontend Components Created:
1. **AuthContext** (`src/contexts/AuthContext.tsx`) - Manages user authentication state
2. **LoginPage** (`src/pages/LoginPage.tsx`) - Login form for users
3. **ProtectedRoute** (`src/components/ProtectedRoute.tsx`) - Guards routes requiring authentication
4. **Updated App.tsx** - Added AuthProvider and login route
5. **Updated Navbar** - Shows logged-in user info and logout button

## 📋 Steps to Complete Setup

### Step 1: Run SQL Script in Supabase

1. Go to **Supabase Dashboard** → **SQL Editor**
2. Open the file `link_investors_to_auth.sql` (created in your project root)
3. **IMPORTANT**: Update the email mappings in the SQL script to match your actual data:
   - Check your `investors` table email addresses
   - Check your `auth.users` table email addresses
   - Update the UPDATE statements accordingly

4. Run the SQL script. It will:
   - Add `user_id` column to `investors` table
   - Link investors to auth users by matching emails
   - Enable Row Level Security (RLS)
   - Create RLS policies for data isolation

### Step 2: Verify Email Mappings

Your investors table has:
- `rahul@example.com` → Should link to `rahul@mail.com` in auth.users
- `akhil@example.com` → Should link to `akhil@mail.com` in auth.users  
- `vinod@example.com` → Should link to `vinod@mail.com` in auth.users

**Update the SQL script** if your emails don't match exactly!

### Step 3: Test the Setup

1. **Start your development server**
2. **Navigate to** `http://localhost:8080/login`
3. **Test login with:**
   - Admin: `admin@mail.com` (or whatever password you set)
   - Investor 1: `rahul@mail.com` (or whatever password you set)
   - Investor 2: `akhil@mail.com` (or whatever password you set)

## 🔒 How Data Isolation Works

### Row Level Security (RLS)

Once RLS is enabled, Supabase automatically filters data based on the logged-in user:

1. **When an investor logs in:**
   - Their `user_id` is stored in the session
   - All queries to `investors`, `investor_investments`, and `investor_quarterly_payments` tables are automatically filtered
   - They can ONLY see their own data

2. **When admin logs in:**
   - Admin email is `admin@mail.com` (you can customize this in `AuthContext.tsx`)
   - Admin can see all data (no RLS restrictions for admin - you may need to add a policy for this)

### Example Query Behavior:

**Before (without RLS):**
```typescript
// This would return ALL investors
const { data } = await supabase.from('investors').select('*');
```

**After (with RLS enabled):**
```typescript
// This automatically returns ONLY the logged-in investor's data
// No code changes needed! RLS handles it automatically
const { data } = await supabase.from('investors').select('*');
```

## 🎯 Key Features

1. **Automatic Data Filtering**: RLS handles data isolation automatically
2. **Protected Routes**: All pages except `/login` require authentication
3. **User Context**: Access user info anywhere with `useAuth()` hook
4. **Role Detection**: Automatically detects if user is admin or investor
5. **Session Persistence**: User stays logged in across page refreshes

## 🔧 Customization

### Change Admin Email
Edit `src/contexts/AuthContext.tsx`:
```typescript
const isAdmin = user?.email === 'your-admin-email@example.com';
```

### Add More Admin Users
```typescript
const adminEmails = ['admin@mail.com', 'admin2@mail.com'];
const isAdmin = user?.email && adminEmails.includes(user.email);
```

### Customize Login Page
Edit `src/pages/LoginPage.tsx` to change styling, add features, etc.

## 🐛 Troubleshooting

### Issue: "No investor record found"
- **Solution**: Make sure you've run the SQL script and linked investors to auth users correctly
- Check that `user_id` column exists and is populated in `investors` table

### Issue: "RLS policy violation"
- **Solution**: Make sure RLS policies are created correctly in the SQL script
- Check Supabase Dashboard → Table Editor → Policies tab

### Issue: "User can see all data"
- **Solution**: Verify RLS is enabled on the tables
- Check that RLS policies are active in Supabase Dashboard

### Issue: "Login redirects to login page"
- **Solution**: Check browser console for errors
- Verify Supabase client configuration in `src/integrations/supabase/client.ts`

## 📝 Next Steps

1. ✅ Run the SQL script in Supabase
2. ✅ Test login with different users
3. ✅ Verify data isolation (investor should only see their data)
4. ✅ Test admin access (admin should see all data)
5. ✅ Customize admin detection logic if needed

## 🎉 You're Done!

Once you've run the SQL script and tested login, your multi-user authentication system is complete. Each investor will only see their own data automatically thanks to Row Level Security!

