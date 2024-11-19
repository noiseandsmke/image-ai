import { create } from "zustand";

type SuccessModelState = {
  isOpen: boolean;
  onOpen: () => void;
  onClose: () => void;
}

export const useSuccessModel = create<SuccessModelState>((set) => ({
  isOpen: false,
  onOpen: () => set({ isOpen: true }),
  onClose: () => set({ isOpen: false }),
}))