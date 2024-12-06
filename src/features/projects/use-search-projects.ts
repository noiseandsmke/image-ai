import { PineconeService } from "@/features/editor/hooks/use-pinecone";
import { GoogleGenerativeAI } from "@google/generative-ai";
import { useState } from "react";
import { toast } from "sonner";

const genAI = new GoogleGenerativeAI(process.env.NEXT_PUBLIC_GEMINI_API_KEY!);

const PROMPT_TEMPLATE = `
Based on the provided descriptions, analyze and find similar projects.
Compare the search description with the stored project descriptions and return projects with their EXACT similarity scores.

Stored project descriptions:
{context}

Search description:
{description}

Instructions:
1. First, find projects that DIRECTLY match the search criteria
2. Then, find additional projects based on:
   - Related themes or elements
   - Similar visual style
   - Common color schemes
   - Comparable compositions
3. IMPORTANT RULES:
   - If search term matches exactly (like searching "bee" and finding a bee image), that project should be first
   - MUST return ALL available projects if total count ≤ 4
   - MUST return EXACTLY 4 projects if total count > 4
   - Sort by similarity score in descending order
   - Use ONLY the exact similarity scores from descriptions
   - Include projects to meet the count requirement, even if less relevant

Return a valid JSON array following these rules:
- If > 4 projects available: Return exactly 4 projects
- If <= 4 projects available: Return all projects
- Never return empty array

Example response format:
[
  {"id": "project1", "similarity": score},  // Most relevant
  {"id": "project2", "similarity": score},  // Next relevant
  {"id": "project3", "similarity": score},  // Include less relevant
  {"id": "project4", "similarity": score}   // Include to meet maximum
]

CRITICAL: You MUST return either:
- ALL projects if total count is 4 or less
- EXACTLY 4 projects if total count is more than 4
- Sort by similarity score from highest to lowest
- Use exact similarity scores from descriptions
`;

export type SearchResult = {
  id: string;
  similarity: number;
};

export const useSearchProjects = () => {
  const [isSearching, setIsSearching] = useState(false);
  const pineconeService = PineconeService.getInstance();

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

      const embeddingModel = genAI.getGenerativeModel({
        model: "text-embedding-004",
      });
      const embeddingResult = await embeddingModel.embedContent(description);
      const searchEmbedding = embeddingResult.embedding.values;

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

      const model = genAI.getGenerativeModel({
        model: "gemini-1.5-flash",
      });

      const prompt = PROMPT_TEMPLATE.replace(
        "{context}",
        projectDescriptions,
      ).replace("{description}", description);

      console.log("Prompt:", prompt);

      toast.info("Analyzing similarities...");
      const result = await model.generateContent(prompt);
      const response = result.response.text();
      console.log("AI Response:", response);

      const projectResults = cleanAndParseResponse(response);

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
