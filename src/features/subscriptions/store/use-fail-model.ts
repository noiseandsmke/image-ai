import { create } from "zustand";

type FailModelState = {
  isOpen: boolean;
  onOpen: () => void;
  onClose: () => void;
}

export const useFailModel = create<FailModelState>((set) => ({
  isOpen: false,
  onOpen: () => set({ isOpen: true }),
  onClose: () => set({ isOpen: false }),
}))