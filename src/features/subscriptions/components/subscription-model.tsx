"use client";

import Image  from "next/image";
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
} from "@/components/ui/dialog";
import { useSubscriptionModel } from "@/features/subscriptions/store/use-subscription-model";
import { Separator } from "@radix-ui/react-separator";
import { CheckCircle2 } from "lucide-react";
import { useCheckout } from "@/features/subscriptions/api/use-checkout";
import { Button } from "@/components/ui/button";

export const SubscriptionModel = () => {
  const mutation = useCheckout();
  const { isOpen, onClose } = useSubscriptionModel();

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent>
        <DialogHeader className="flex items-center space-y-4">
          <Image 
            src="./logo.svg"
            alt="Logo"
            width={36}
            height={36}
          />
          <DialogTitle className="text-center">
            Upgrade to a paid plan
          </DialogTitle>
          <DialogDescription className="text-center">
            Upgrade to a paid plan to unlock more features
          </DialogDescription>
        </DialogHeader>
        <Separator />
        <ul className="space-y-2">
          <li className="flex items-center">
            <CheckCircle2 className="size-5 mr-2 fill-blue-500 text-white"/>
            <p className="text-sm text-muted-foreground">
              Unlimited projects
            </p>
          </li>
          <li className="flex items-center">
            <CheckCircle2 className="size-5 mr-2 fill-blue-500 text-white"/>
            <p className="text-sm text-muted-foreground">
              Unlimited template
            </p>
          </li>
          <li className="flex items-center">
            <CheckCircle2 className="size-5 mr-2 fill-blue-500 text-white"/>
            <p className="text-sm text-muted-foreground">
              AI remove background
            </p>
          </li>
          <li className="flex items-center">
            <CheckCircle2 className="size-5 mr-2 fill-blue-500 text-white"/>
            <p className="text-sm text-muted-foreground">
              AI generation image
            </p>
          </li>
        </ul>
        <DialogFooter className="pt-2 mt-4 gap-y-2">
          <Button
            className="w-full"
            onClick={() => mutation.mutate()}
            disabled={mutation.isPending}
          >
            Upgrade
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
};