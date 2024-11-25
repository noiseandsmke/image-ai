import { PineconeService } from "@/features/editor/hooks/use-pinecone";
import { GoogleGenerativeAI } from "@google/generative-ai";
import { useState } from "react";
import { toast } from "sonner";

const genAI = new GoogleGenerativeAI(process.env.NEXT_PUBLIC_GEMINI_API_KEY!);

const PROMPT_TEMPLATE = `
Based on the provided descriptions, analyze and find the most similar projects.
Compare the search description with the stored project descriptions and return the IDs of matching projects.

Stored Project Descriptions:
{context}

Search Description:
{description}

Instructions:
1. Compare the visual elements, style, and composition between the search description and stored descriptions
2. Consider semantic similarity rather than exact matches
3. Return only the most relevant project IDs

Return a valid JSON array of project IDs that match the search description: ["id1", "id2", "id3"]
`;

export const useSearchProjects = () => {
	const [isSearching, setIsSearching] = useState(false);
	const pineconeService = PineconeService.getInstance();

	const cleanAndParseResponse = (response: string): string[] => {
		try {
			const cleanResponse = response
				.trim()
				.replace(/```json\n?/g, "")
				.replace(/```\n?/g, "")
				.replace(/[\n\r]/g, "")
				.trim();

			const parsed = JSON.parse(cleanResponse);

			if (Array.isArray(parsed)) {
				return parsed;
			} else if (typeof parsed === "string") {
				return [parsed];
			} else if (typeof parsed === "object" && parsed !== null) {
				return parsed.id ? [parsed.id] : [];
			}

			const idMatches = cleanResponse.match(/"([^"]+)"/g);
			if (idMatches) {
				return idMatches.map((match) => match.replace(/"/g, ""));
			}

			return [];
		} catch (error) {
			return [];
		}
	};

	const searchProjects = async (description: string) => {
		try {
			setIsSearching(true);
			toast.info("Analyzing your description...");

			const embeddingModel = genAI.getGenerativeModel({
				model: "text-embedding-004",
			});
			const embeddingResult = await embeddingModel.embedContent(description);
			const searchEmbedding = embeddingResult.embedding.values;

			toast.info("Finding similar projects...");
			const searchResults = await pineconeService.queryVectors(
				searchEmbedding,
				20
			);

			if (!searchResults?.length) {
				toast.info("No similar projects found");
				return [];
			}

			const projectDescriptions = searchResults
				.map((match) => ({
					id: match.metadata?.id,
					description: match.metadata?.description,
					score: match.score,
				}))
				.filter((item) => item.id && item.description)
				.map(
					(item) =>
						`Project ${item.id}:\n${item.description}\nSimilarity: ${
							item.score?.toFixed(2) || 0
						}`
				)
				.join("\n\n");

			const model = genAI.getGenerativeModel({
				model: "gemini-1.5-flash-8b",
			});

			const prompt = PROMPT_TEMPLATE.replace(
				"{context}",
				projectDescriptions
			).replace("{description}", description);

			toast.info("Analyzing similarities...");
			const result = await model.generateContent(prompt);
			const response = result.response.text();

			const projectIds = cleanAndParseResponse(response);

			if (projectIds.length > 0) {
				toast.success(`Found ${projectIds.length} matching projects`);
				return projectIds;
			}

			const fallbackIds = searchResults
				.slice(0, 5)
				.map((match) => match.metadata?.id)
				.filter(Boolean) as string[];

			return fallbackIds;
		} catch (error) {
			if (error instanceof Error) {
				toast.error(`Search failed: ${error.message}`);
			} else {
				toast.error("An unexpected error occurred during search");
			}
			return [];
		} finally {
			setIsSearching(false);
		}
	};

	return {
		searchProjects,
		isSearching,
	};
};
