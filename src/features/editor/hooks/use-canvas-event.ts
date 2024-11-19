import { fabric } from 'fabric';
import { useEffect } from 'react';

interface UseCanvasEventProps {
  save: () => void;
  canvas: fabric.Canvas | null;
  clearSelectionCallback?: () => void;
  setSelectedObjects: (objects: fabric.Object[]) => void;
}

export const useCanvasEvents = ({
  save,
  canvas,
  setSelectedObjects,
  clearSelectionCallback,
}: UseCanvasEventProps) => {
  useEffect(() => {
    if (canvas) {
      canvas.on("object:added", () => save());
      canvas.on("object:removed", () => save());
      canvas.on("object:modified", () => save());
      canvas.on("selection:created", (e) => {
        setSelectedObjects(e.selected || []);
      });
      canvas.on("selection:updated", (e) => {
        setSelectedObjects(e.selected || []);
      });
      canvas.on("selection:cleared", () => {
        setSelectedObjects([]);
        clearSelectionCallback?.();
      });
    }

    return () => {
      if (canvas) {
        canvas.off("object:added");
        canvas.off("object:removed");
        canvas.off("object:modified");
        canvas.off("selected:created");
        canvas.off("selected:updated");
        canvas.off("selected:cleared");
      }
    }
  }, [
    save,
    canvas,
    clearSelectionCallback,
    setSelectedObjects, // no need for this, this is from setState
  ]);
};