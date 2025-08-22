"use client"

import React from 'react';
import LoginPage3D from '@/components/LoginPage3D';
import { useRouter } from 'next/navigation';

export default function LoginPage() {
  const router = useRouter();

  const handleLogin = async (credentials: any) => {
    try {
      console.log('Login attempt:', credentials);
      // Add your login logic here
      // For now, redirect to main dashboard
      router.push('/');
    } catch (error) {
      console.error('Login error:', error);
    }
  };

  const handleRegister = () => {
    router.push('/signup');
  };

  return (
    <LoginPage3D 
      onLogin={handleLogin}
      onRegister={handleRegister}
    />
  );
}