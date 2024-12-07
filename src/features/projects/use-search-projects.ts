import { PineconeService } from "@/features/editor/hooks/use-pinecone";
import { GeminiService } from "@/features/editor/hooks/use-gemini";
import { useState } from "react";
import { toast } from "sonner";

export type SearchResult = {
  id: string;
  similarity: number;
};

export const useSearchProjects = () => {
  const [isSearching, setIsSearching] = useState(false);
  const pineconeService = PineconeService.getInstance();
  const geminiService = GeminiService.getInstance();

  const cleanAndParseResponse = (response: string): SearchResult[] => {
    try {
      const cleanResponse = response
        .trim()
        .replace(/```json\n?/g, "")
        .replace(/```\n?/g, "")
        .replace(/[\n\r]/g, "")
        .trim();

      const parsed = JSON.parse(cleanResponse);

      if (Array.isArray(parsed)) {
        return parsed.map((item) => ({
          id: item.id,
          similarity: Number(item.similarity),
        }));
      }

      return [];
    } catch (error) {
      console.error("Error parsing response:", error);
      return [];
    }
  };

  const searchProjects = async (description: string) => {
    try {
      setIsSearching(true);
      toast.info("Analyzing your description...");

      const searchEmbedding =
        await geminiService.generateEmbedding(description);

      toast.info("Finding similar projects...");
      const searchResults = await pineconeService.queryVectors(
        searchEmbedding,
        20,
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
            }`,
        )
        .join("\n\n");

      toast.info("Analyzing similarities...");
      const response = await geminiService.analyzeSimilarProjects(
        description,
        projectDescriptions,
      );
      console.log("AI Response:", JSON.stringify(response));

      const projectResults = cleanAndParseResponse(JSON.stringify(response));

      if (projectResults.length > 0) {
        toast.success(`Found ${projectResults.length} matching projects`);
        return projectResults;
      }

      const fallbackResults = searchResults
        .slice(0, 5)
        .map((match) => ({
          id: match.metadata?.id as string,
          similarity: match.score || 0,
        }))
        .filter((item) => item.id);

      return fallbackResults;
    } catch (error) {
      if (error instanceof Error) {
        toast.error(`Search failed: ${error.message}`);
        console.error("Search error:", error);
      } else {
        toast.error("An unexpected error occurred during search");
        console.error("Unexpected error:", error);
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
