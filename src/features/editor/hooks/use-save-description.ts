import { PineconeService } from "@/features/editor/hooks/use-pinecone";
import { GeminiService } from "@/features/editor/hooks/use-gemini";
import { Editor } from "@/features/editor/types";
import { client } from "@/lib/hono";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { InferResponseType } from "hono";
import { toast } from "sonner";

type ResponseType = InferResponseType<
  (typeof client.api.projects)[":id"]["$patch"],
  200
>;

export const useSaveDescription = () => {
  const queryClient = useQueryClient();
  const pineconeService = PineconeService.getInstance();
  const geminiService = GeminiService.getInstance();

  const mutation = useMutation<
    ResponseType,
    Error,
    { id: string; editor: Editor }
  >({
    mutationFn: async ({ id, editor }) => {
      try {
        const jsonData = editor.canvas.toJSON();
        const workspace = editor.getWorkSpace();

        const options = {
          name: "Image",
          format: "png",
          quality: 1,
          width: workspace?.width,
          height: workspace?.height,
          left: workspace?.left,
          top: workspace?.top,
        };

        const currentTransform = editor.canvas.viewportTransform;
        editor.canvas.setViewportTransform([1, 0, 0, 1, 0, 0]);
        const dataUrl = editor.canvas.toDataURL(options);
        const pngBlob = await fetch(dataUrl).then((res) => res.blob());
        const imageFile = new File([pngBlob], `${id}.png`, {
          type: "image/png",
        });

        toast.info("Analyzing image...");
        const analysisResult = await geminiService.generateImageAnalysis(
          id,
          imageFile,
        );
        toast.success("Image analysis completed");

        toast.info("Creating embedding...");
        const embedding = await geminiService.generateEmbedding(
          analysisResult.description,
        );
        toast.success("Embedding created successfully");

        try {
          toast.info("Saving to Pinecone...");
          await pineconeService.createIndexIfNotExists();
          await pineconeService.upsertVector(
            id,
            analysisResult.description,
            embedding,
          );
          toast.success("Saved to Pinecone successfully");
        } catch (error) {
          toast.error("Failed to save to Pinecone database");
          if (error instanceof Error) {
            toast.error(error.message);
          }
        }

        toast.info("Saving description...");
        const response = await client.api.projects[":id"].$patch({
          param: { id },
          json: {
            description: analysisResult.description,
            json: JSON.stringify(jsonData),
            thumbnailUrl: URL.createObjectURL(imageFile),
          },
        });

        if (!response.ok) throw new Error("Failed to save description");

        if (currentTransform) {
          editor.canvas.setViewportTransform(currentTransform);
        }
        editor.autoZoom();

        return await response.json();
      } catch (error) {
        if (error instanceof Error) {
          toast.error(`Error: ${error.message}`);
        } else {
          toast.error("An unexpected error occurred");
        }
        throw error;
      }
    },
    onSuccess: ({ data }) => {
      queryClient.invalidateQueries({ queryKey: ["projects"] });
      queryClient.invalidateQueries({
        queryKey: ["projects", { id: data.id }],
      });
      toast.success("All operations completed successfully");
    },
    onError: () => {
      toast.error("Failed to complete all operations");
    },
  });

  return mutation;
};
