"use client";

import { useEffect } from "react";
import { useSearchParams } from "next/navigation";
import { useFailModel } from "@/features/subscriptions/store/use-fail-model";
import { useSuccessModel } from "@/features/subscriptions/store/use-successs-model";
import { on } from "events";

export const SubscriptionAlert = () => {
  const params = useSearchParams();

  const { onOpen: onOpenFail } = useFailModel();
  const { onOpen: onOpenSuccess } = useSuccessModel();

  const canceled = params.get('canceled');
  const success = params.get('success');

  useEffect(() => {
    if (canceled) {
      onOpenFail();
    }
    if (success) {
      onOpenSuccess();
    }
  }, [canceled, onOpenFail, success, onOpenSuccess]);

  return null;
};