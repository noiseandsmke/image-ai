import { Editor } from "@/features/editor/types";
import { client } from "@/lib/hono";
import { GoogleGenerativeAI } from "@google/generative-ai";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { InferResponseType } from "hono";
import { toast } from "sonner";

const genAI = new GoogleGenerativeAI("AIzaSyAgxZESiRWUrDBXfO1bU1a38O-oYUsd_nE");

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

				const jsonModel = genAI.getGenerativeModel({
					model: "gemini-1.5-flash",
				});

				const combinedPrompt = `Analyze these visual and technical elements:

          Visual elements: ${imageAnalysis}
          Technical elements: ${JSON.stringify(jsonData)}

          IMPORTANT: You must return a valid JSON object with exactly this structure, no additional text and provide only descriptive adjectives and nouns. No sentences.:
          {
            "id": "${id}",
            "description": "descriptive words here"
          }`;

				const finalResult = await jsonModel.generateContent(combinedPrompt);
				const finalText = finalResult.response.text();

				let cleanText = finalText
					.trim()
					.replace(/```json\n?/g, "")
					.replace(/```\n?/g, "");
				const analysisResult = JSON.parse(cleanText);

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
				console.error("Error in save description:", error);
				throw error;
			}
		},
		onSuccess: ({ data }) => {
			queryClient.invalidateQueries({ queryKey: ["projects"] });
			queryClient.invalidateQueries({
				queryKey: ["projects", { id: data.id }],
			});
			toast.success("Description saved successfully");
		},
		onError: () => {
			toast.error("Failed to save description");
		},
	});

	return mutation;
};
