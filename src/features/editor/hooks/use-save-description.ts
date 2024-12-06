import { PineconeService } from "@/features/editor/hooks/use-pinecone";
import { Editor } from "@/features/editor/types";
import { client } from "@/lib/hono";
import { GoogleGenerativeAI } from "@google/generative-ai";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { InferResponseType } from "hono";
import { toast } from "sonner";

const genAI = new GoogleGenerativeAI(process.env.NEXT_PUBLIC_GEMINI_API_KEY!);

type ResponseType = InferResponseType<
	(typeof client.api.projects)[":id"]["$patch"],
	200
>;

async function imageToGenerativePart(imageFile: File) {
	const buffer = await imageFile.arrayBuffer();
	return {
		inlineData: {
			data: Buffer.from(buffer).toString("base64"),
			mimeType: imageFile.type,
		},
	};
}

export const useSaveDescription = () => {
	const queryClient = useQueryClient();
	const pineconeService = PineconeService.getInstance();

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

				const imagePart = await imageToGenerativePart(imageFile);
				const imageModel = genAI.getGenerativeModel({
					model: "gemini-1.5-flash",
				});

				const imagePrompt = `Analyze this image and return a single JSON object with this exact structure:
        {
          "id": "${id}",
          "description": "[detected objects: list all visual objects like animals, mountains, houses, sun, people, etc.], [object positions and relationships], [text content if any], [colors used], [overall layout]"
        }

        Focus on identifying and listing:
        1. Every visual object in the image (natural elements, buildings, creatures, people, symbols)
        2. Their positions and how they relate to each other
        3. Any text content present
        4. Colors and visual style
        5. Overall composition

        Important:
        - List ALL objects you can identify, no matter how small
        - Describe spatial relationships between objects
        - Include exact text if present
        - Note color schemes and artistic style
        - Keep descriptions precise and factual`;

				const result = await imageModel.generateContent([
					imagePrompt,
					imagePart,
				]);
				const finalText = result.response.text();
				const analysisResult = JSON.parse(
					finalText
						.trim()
						.replace(/```json\n?/g, "")
						.replace(/```\n?/g, "")
				);

				toast.success("Image analysis completed");
				toast.info("Creating embedding...");

				const embeddingModel = genAI.getGenerativeModel({
					model: "text-embedding-004",
				});
				const embeddingResult = await embeddingModel.embedContent(
					analysisResult.description
				);
				const embedding = embeddingResult.embedding.values;
				toast.success("Embedding created successfully");

				try {
					toast.info("Saving to Pinecone...");
					await pineconeService.createIndexIfNotExists();
					await pineconeService.upsertVector(
						id,
						analysisResult.description,
						embedding
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
