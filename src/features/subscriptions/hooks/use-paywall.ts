import { useSubscriptionModel } from "@/features/subscriptions/store/use-subscription-model";
import { useGetSubscription } from "@/features/subscriptions/api/use-get-subscription";

export const usePaywall = () => {
  const {
    data: subscription,
    isLoading: isLoadingSubscription,
  } = useGetSubscription();
  const subscriptionModel = useSubscriptionModel();

  const shouldBlock = isLoadingSubscription || !subscription?.active;

  return {
    isLoading: isLoadingSubscription,
    shouldBlock,
    triggerPaywall: () => {
      subscriptionModel.onOpen();
    }
  }
};