# 🚀 Real-Time Setup & Testing Guide

Follow these steps to enable and test real-time functionality in your Academic System.

## Step 1: Enable Realtime in Supabase Dashboard

### 🗄️ Database Replication Setup

1. **Go to your Supabase project dashboard**
   - Open [app.supabase.com](https://app.supabase.com)
   - Select your project

2. **Navigate to Database → Replication**
   - In the left sidebar, click **Database**
   - Click on **Replication** tab

3. **Enable Realtime for these tables:**
   ```
   ✅ profiles
   ✅ timetables  
   ✅ attendance_sessions
   ✅ attendance_records
   ✅ notifications
   ✅ courses
   ```

4. **Enable each table:**
   - Find each table in the list
   - Click the **Enable** button next to each table
   - You should see a green checkmark when enabled

## Step 2: Run Database Setup

### 📋 Execute SQL Policies

1. **Open Supabase SQL Editor**
   - In your Supabase dashboard, go to **SQL Editor**

2. **Copy and run the SQL script**
   ```bash
   # Copy the content from this file:
   cat database/realtime-policies.sql
   ```

3. **Execute the script**
   - Paste the entire content into the SQL editor
   - Click **Run** to execute
   - You should see success messages for each statement

## Step 3: Test Real-Time Features

### 🧪 Start Development Server & Test

```bash
# Start your development server
npm run dev

# Open the real-time test page
open http://localhost:3000/realtime-test
```

### 🔥 Multi-Window Testing Steps

1. **Open multiple browser windows/tabs**
2. **Test real-time updates by clicking test buttons**
3. **Watch for immediate updates across all windows**
4. **Check browser console for real-time logs with 📌 and 📡 emojis**

🎉 **Success!** Your real-time academic system is now live with instant updates across all users!
