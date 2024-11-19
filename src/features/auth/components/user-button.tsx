"use client";

import {
  Avatar,
  AvatarFallback,
  AvatarImage,
} from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";
import { useBilling } from "@/features/subscriptions/api/use-billing";
import { usePaywall } from "@/features/subscriptions/hooks/use-paywall";
import { CreditCard, Crown, Loader, LogOut } from "lucide-react";
import { signOut, useSession } from "next-auth/react";

export const UserButton = () => {
  const { shouldBlock, triggerPaywall, isLoading } = usePaywall();
  const mutation = useBilling();
  const session = useSession();

  const onClick = () => {
    if (shouldBlock) {
      triggerPaywall()
      return;
    }

    mutation.mutate();
  }

  if (session.status === "loading") 
    return <Loader className="size-4 animate-spin text-muted-foreground"/>; 

  if (session.status === "unauthenticated" || !session.data) return null;

  const name = session.data?.user?.name!;
  const imageUrl = session.data?.user?.image!;

  return (
    <DropdownMenu modal={false}>
      <DropdownMenuTrigger className="outline-none relative">
        {!isLoading && !shouldBlock && (
          <div className="absolute -top-1 -left-1 z-10 flex items-center justify-center">
            <div className="rounded-full bg-white flex items-center justify-center p-1 drop-shadow-sm">
              <Crown className="size-3 text-yellow-500 fill-yellow-500" />
            </div>
          </div>
        )}
        <Avatar className="size-10 hover:opacity-75 transition">
          <AvatarImage alt={name} src={imageUrl || ""}/>
          <AvatarFallback className="bg-blue-500 font-medium text-white
          flex items-center justify-center">
            {name.charAt(0).toUpperCase()}
          </AvatarFallback>
        </Avatar>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-60">
        <DropdownMenuItem className="h-10" disabled={mutation.isPending} onClick={onClick}>
          <CreditCard className="size-4 mr-2" /> 
          Billing
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuItem className="h-10" onClick={() => signOut()}>
          <LogOut className="size-4 mr-2" /> 
          Logout
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  )
};