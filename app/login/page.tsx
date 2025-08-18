"use client";
import AuthPage from "../htbyjn/components/auth-page";
import Link from "next/link";

export default function LoginPage() {
  return (
    <>
      <div className="absolute top-6 left-6 z-20">
        <Link
          href="/"
          className="px-4 py-2 rounded-full bg-gray-100 text-green-700 font-semibold shadow hover:bg-green-100 transition-colors duration-200"
        >
          ← Back to Home
        </Link>
      </div>
      <AuthPage />
    </>
  );
}
