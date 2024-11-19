"use client";

import { QueryProviders } from "@/components/query-provider";

interface ProviderProps {
  children: React.ReactNode;
}

export const Provider = ({ children }: ProviderProps) => {
  return (
    <QueryProviders>
      {children}
    </QueryProviders>
  )
};