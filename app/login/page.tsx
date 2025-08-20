"use client";
import EnhancedAuthSystem from "@/components/EnhancedAuthSystem";
import Link from "next/link";

export default function LoginPage() {
  return (
    <>
      <div className="absolute top-6 left-6 z-20">
        <Link
          href="/"
          className="px-4 py-2 rounded-full bg-green-50/90 backdrop-blur-sm text-green-700 font-semibold shadow-lg hover:bg-green-100 hover:shadow-xl transition-all duration-200 border border-green-200"
        >
          ← Back to Home
        </Link>
      </div>
      <EnhancedAuthSystem />
    </>
  );
}
