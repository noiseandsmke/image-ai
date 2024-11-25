import { PineconeService } from "@/features/editor/hooks/use-pinecone";
import { GoogleGenerativeAI } from "@google/generative-ai";
import { useState } from "react";
import { toast } from "sonner";

const genAI = new GoogleGenerativeAI("AIzaSyAgxZESiRWUrDBXfO1bU1a38O-oYUsd_nE");

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
			// Remove code blocks and clean the string
			const cleanResponse = response
				.trim()
				.replace(/```json\n?/g, "")
				.replace(/```\n?/g, "")
				.replace(/[\n\r]/g, "")
				.trim();

			console.log("=== Cleaned Response ===");
			console.log("Cleaned response:", cleanResponse);

			// Try parsing as JSON array first
			const parsed = JSON.parse(cleanResponse);

			// Handle different response formats
			if (Array.isArray(parsed)) {
				return parsed;
			} else if (typeof parsed === "string") {
				return [parsed];
			} else if (typeof parsed === "object" && parsed !== null) {
				// If it's an object with an id property
				return parsed.id ? [parsed.id] : [];
			}

			// Try regex extraction as fallback
			const idMatches = cleanResponse.match(/"([^"]+)"/g);
			if (idMatches) {
				return idMatches.map((match) => match.replace(/"/g, ""));
			}

			return [];
		} catch (error) {
			console.error("Cleaning and parsing failed:", error);
			return [];
		}
	};

	const searchProjects = async (description: string) => {
		try {
			setIsSearching(true);
			toast.info("Analyzing your description...");

			// Log search input
			console.log("=== Search Started ===");
			console.log("Search description:", description);

			// Generate embedding for the description
			const embeddingModel = genAI.getGenerativeModel({
				model: "text-embedding-004",
			});
			const embeddingResult = await embeddingModel.embedContent(description);
			const searchEmbedding = embeddingResult.embedding.values;

			console.log("=== Embedding Info ===");
			console.log("Embedding vector length:", searchEmbedding.length);
			console.log("First few values:", searchEmbedding.slice(0, 5));

			// Search similar vectors in Pinecone
			toast.info("Finding similar projects...");
			const searchResults = await pineconeService.queryVectors(
				searchEmbedding,
				20
			);

			console.log("=== Pinecone Search Results ===");
			console.log("Total results found:", searchResults?.length || 0);
			console.log("Raw Pinecone response:", searchResults);

			if (!searchResults?.length) {
				console.log("No results found in Pinecone");
				toast.info("No similar projects found");
				return [];
			}

			// Log detailed match information
			console.log("=== Matched Projects Details ===");
			searchResults.forEach((match, index) => {
				console.log(`Match ${index + 1}:`, {
					id: match.metadata?.id,
					description: match.metadata?.description,
					similarity: match.score?.toFixed(4),
				});
			});

			// Prepare context from search results
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

			console.log("=== Context Preparation ===");
			console.log("Prepared context for LLM:", projectDescriptions);

			// Use Gemini to analyze and find best matches
			const model = genAI.getGenerativeModel({
				model: "gemini-1.5-flash-8b",
			});

			const prompt = PROMPT_TEMPLATE.replace(
				"{context}",
				projectDescriptions
			).replace("{description}", description);

			console.log("=== Gemini Prompt ===");
			console.log("Final prompt sent to Gemini:", prompt);

			toast.info("Analyzing similarities...");
			const result = await model.generateContent(prompt);
			const response = result.response.text();

			console.log("=== Gemini Response ===");
			console.log("Raw response from Gemini:", response);

			// Clean and parse the response
			const projectIds = cleanAndParseResponse(response);

			if (projectIds.length > 0) {
				console.log("=== Final Results ===");
				console.log("Successfully extracted project IDs:", projectIds);
				toast.success(`Found ${projectIds.length} matching projects`);
				return projectIds;
			}

			// Fallback to Pinecone results if no IDs were extracted
			console.log("=== Using Fallback Results ===");
			const fallbackIds = searchResults
				.slice(0, 5)
				.map((match) => match.metadata?.id)
				.filter(Boolean) as string[];

			console.log("Fallback IDs:", fallbackIds);
			return fallbackIds;
		} catch (error) {
			console.error("=== Search Error ===");
			console.error("Full error details:", error);

			if (error instanceof Error) {
				console.error("Error message:", error.message);
				console.error("Error stack:", error.stack);
				toast.error(`Search failed: ${error.message}`);
			} else {
				console.error("Unknown error type:", error);
				toast.error("An unexpected error occurred during search");
			}
			return [];
		} finally {
			console.log("=== Search Completed ===");
			setIsSearching(false);
		}
	};

	return {
		searchProjects,
		isSearching,
	};
};
