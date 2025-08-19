"use client";
export const dynamic = 'force-dynamic'
import AuthPage from "../htbyjn/components/auth-page";

export default function SignupPage() {
  // Directly render the AuthPage, no redirect
  return <AuthPage />;
}