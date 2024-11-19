"use client";

import { FailModel } from "@/features/subscriptions/components/fail-model";
import { SuccessModel } from "@/features/subscriptions/components/success-model";
import { SubscriptionModel } from "@/features/subscriptions/components/subscription-model";
import { useState, useEffect } from "react";

export const Models = () => {
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    setIsMounted(true);
  }, []);

  if (!isMounted) {
    return null;
  }

  return (
    <>
      <FailModel />
      <SuccessModel />
      <SubscriptionModel />
    </>
  )
};