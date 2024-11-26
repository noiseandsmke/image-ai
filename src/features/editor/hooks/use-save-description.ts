import { Editor } from "@/features/editor/types";
import { client } from "@/lib/hono";
import { GoogleGenerativeAI } from "@google/generative-ai";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { InferResponseType } from "hono";
import { toast } from "sonner";
import { PineconeService } from "./use-pinecone";

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
					model: "gemini-1.5-flash-8b",
				});
				const imagePrompt = `Analyze this image and describe:
          - Main visual elements (objects)
          - Their distribution
          - Colors present
          - Overall composition

          Provide only descriptive adjectives and nouns. No sentences.`;

				const imageResult = await imageModel.generateContent([
					imagePrompt,
					imagePart,
				]);
				const imageAnalysis = imageResult.response.text();
				toast.success("Image analysis completed");

				toast.info("Generating description...");

				const jsonModel = genAI.getGenerativeModel({
					model: "gemini-1.5-flash",
				});
				const combinedPrompt = `Analyze the design content from both visual and technical data:

				Visual analysis: ${imageAnalysis}
				
				Technical analysis: Extract from JSON:
				1. Find all text content in "text" fields: ${JSON.stringify(
					jsonData.objects
						.filter((obj) => obj.type === "textbox")
						.map((obj) => (obj as any).text)
				)}
				2. Analyze object properties and numerical values
				3. Note any percentages, measurements, or specific numbers
				
				IMPORTANT: Create a comprehensive description that preserves:
				- All exact text content
				- All numerical values (especially percentages)
				- Key visual elements
				- Color schemes
				- Layout characteristics
				
				Return a valid JSON object with this exact structure:
				{
					"id": "${id}",
					"description": "text fields from JSON, design:[key visual elements], colors:[color scheme], layout:[composition details]"
				}
				
				Ensure that:
				1. All text content is preserved exactly as written
				2. All numbers and percentages are included
				3. Key design elements are described
				4. Color information is accurate`;

				const finalResult = await jsonModel.generateContent(combinedPrompt);
				const finalText = finalResult.response.text();
				let cleanText = finalText
					.trim()
					.replace(/```json\n?/g, "")
					.replace(/```\n?/g, "");
				const analysisResult = JSON.parse(cleanText);
				toast.success("Description generated successfully");

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
