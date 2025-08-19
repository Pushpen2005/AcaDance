"use client";

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '../../lib/supabaseClient';

const steps = [
  'Account',
  'Profile',
  'Preferences',
];

export default function SetupProfilePage() {
  const [step, setStep] = useState(1);
  const [fullName, setFullName] = useState('');
  const [role, setRole] = useState('student');
  const [department, setDepartment] = useState('');
  const [phone, setPhone] = useState('');
  const [avatarFile, setAvatarFile] = useState<File | null>(null);
  const [avatarUrl, setAvatarUrl] = useState('');
  const [theme, setTheme] = useState('light');
  const [notification, setNotification] = useState('email');
  const [errorMsg, setErrorMsg] = useState('');
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  // Progress bar calculation
  const progress = (step / steps.length) * 100;

  // Handle image upload to Supabase Storage
  const handleAvatarUpload = async () => {
    if (!avatarFile) return;
    setLoading(true);
    setErrorMsg('');
    try {
      const fileExt = avatarFile.name.split('.').pop();
      const fileName = `${Date.now()}.${fileExt}`;
      const { data, error } = await supabase.storage
        .from('avatars')
        .upload(fileName, avatarFile);
      if (error) throw error;
      if (data) {
        const url = supabase.storage.from('avatars').getPublicUrl(fileName).data.publicUrl;
        setAvatarUrl(url);
      }
    } catch (err: any) {
      setErrorMsg('Image upload failed. Try again.');
    } finally {
      setLoading(false);
    }
  };

  // Handle profile save
  const handleSaveProfile = async () => {
    setLoading(true);
    setErrorMsg('');
    try {
      await handleAvatarUpload();
      const user = await supabase.auth.getUser();
      const { error } = await supabase.from('profiles').upsert({
        id: user.data.user?.id,
        full_name: fullName,
        role,
        department,
        phone,
        avatar_url: avatarUrl,
        theme,
        notification,
      });
      if (error) throw error;
      router.push('/home');
    } catch (err: any) {
      setErrorMsg('Profile save failed. Try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-xl mx-auto mt-10 p-6 bg-white dark:bg-gray-900 rounded shadow">
      <div className="mb-6">
        <div className="flex items-center justify-between mb-2">
          <span className="font-bold text-lg">Profile Setup</span>
          <span className="text-sm">Step {step} of {steps.length}: {steps[step - 1]}</span>
        </div>
        <div className="w-full bg-gray-200 rounded-full h-2.5 dark:bg-gray-700">
          <div className="bg-blue-600 h-2.5 rounded-full" style={{ width: `${progress}%` }}></div>
        </div>
      </div>
      {errorMsg && <div className="mb-4 text-red-600">{errorMsg}</div>}
      {loading && <div className="mb-4 text-blue-600">Processing...</div>}
      {step === 1 && (
        <div>
          <p className="mb-4">Account created! Click Next to continue.</p>
          <button className="btn btn-primary w-full py-2" onClick={() => setStep(2)} aria-label="Next step">Next</button>
        </div>
      )}
      {step === 2 && (
        <form onSubmit={e => { e.preventDefault(); setStep(3); }}>
          <div className="mb-4">
            <label htmlFor="fullName" className="block mb-1 font-medium">Full Name</label>
            <input id="fullName" type="text" value={fullName} onChange={e => setFullName(e.target.value)} required className="input w-full px-3 py-2 rounded border" />
          </div>
          <div className="mb-4">
            <label htmlFor="role" className="block mb-1 font-medium">Role</label>
            <select id="role" value={role} onChange={e => setRole(e.target.value)} className="input w-full px-3 py-2 rounded border">
              <option value="student">Student</option>
              <option value="faculty">Faculty</option>
              <option value="admin">Admin</option>
            </select>
          </div>
          <div className="mb-4">
            <label htmlFor="department" className="block mb-1 font-medium">Department / Course</label>
            <input id="department" type="text" value={department} onChange={e => setDepartment(e.target.value)} className="input w-full px-3 py-2 rounded border" />
          </div>
          <div className="mb-4">
            <label htmlFor="phone" className="block mb-1 font-medium">Contact Number (optional)</label>
            <input id="phone" type="text" value={phone} onChange={e => setPhone(e.target.value)} className="input w-full px-3 py-2 rounded border" />
          </div>
          <div className="mb-4">
            <label htmlFor="avatar" className="block mb-1 font-medium">Profile Photo</label>
            <input id="avatar" type="file" accept="image/*" onChange={e => setAvatarFile(e.target.files?.[0] || null)} className="input w-full px-3 py-2 rounded border" />
          </div>
          <button className="btn btn-primary w-full py-2" type="submit" aria-label="Next step">Next</button>
        </form>
      )}
      {step === 3 && (
        <form onSubmit={e => { e.preventDefault(); handleSaveProfile(); }}>
          <div className="mb-4">
            <label htmlFor="theme" className="block mb-1 font-medium">Theme Preference</label>
            <select id="theme" value={theme} onChange={e => setTheme(e.target.value)} className="input w-full px-3 py-2 rounded border">
              <option value="light">Light</option>
              <option value="dark">Dark</option>
            </select>
          </div>
          <div className="mb-4">
            <label htmlFor="notification" className="block mb-1 font-medium">Notification Preference</label>
            <select id="notification" value={notification} onChange={e => setNotification(e.target.value)} className="input w-full px-3 py-2 rounded border">
              <option value="email">Email</option>
              <option value="push">Push</option>
              <option value="sms">SMS</option>
            </select>
          </div>
          <button className="btn btn-success w-full py-2" type="submit" aria-label="Finish setup">Finish & Go to Dashboard</button>
        </form>
      )}
    </div>
  );
}
