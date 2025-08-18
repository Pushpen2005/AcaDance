"use client";
import React from "react";

export default function Skeleton({ className = "", style = {} }) {
  return (
    <div
      className={`animate-pulse bg-gray-200 rounded ${className}`}
      style={style}
      aria-busy="true"
      aria-label="Loading..."
    />
  );
}
