import { GoogleGenerativeAI } from "@google/generative-ai";

export class GeminiService {
	private static instance: GeminiService;
	private client: GoogleGenerativeAI;

	private constructor() {
		this.client = new GoogleGenerativeAI(
			process.env.NEXT_PUBLIC_GEMINI_API_KEY!
		);
	}

	public static getInstance(): GeminiService {
		if (!GeminiService.instance) {
			GeminiService.instance = new GeminiService();
		}
		return GeminiService.instance;
	}

	async generateImageAnalysis(id: string, imageFile: File) {
		try {
			const imagePart = await this.imageToGenerativePart(imageFile);
			const imageModel = this.client.getGenerativeModel({
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

			const result = await imageModel.generateContent([imagePrompt, imagePart]);
			const finalText = result.response.text();
			return JSON.parse(
				finalText
					.trim()
					.replace(/```json\n?/g, "")
					.replace(/```\n?/g, "")
			);
		} catch (error) {
			throw error;
		}
	}

	async generateEmbedding(text: string) {
		try {
			const embeddingModel = this.client.getGenerativeModel({
				model: "text-embedding-004",
			});
			const embeddingResult = await embeddingModel.embedContent(text);
			return embeddingResult.embedding.values;
		} catch (error) {
			throw error;
		}
	}

	async analyzeSimilarProjects(
		searchDescription: string,
		projectDescriptions: string
	) {
		try {
			const model = this.client.getGenerativeModel({
				model: "gemini-1.5-flash",
			});

			const prompt = `
        Based on the provided descriptions, analyze and find similar projects.
        Compare the search description with the stored project descriptions and return projects with their EXACT similarity scores.

        Stored project descriptions:
        ${projectDescriptions}

        Search description:
        ${searchDescription}

        Instructions:
        1. First, find projects that DIRECTLY match the search criteria
        2. Then, find additional projects based on:
           - Related themes or elements
           - Similar visual style
           - Common color schemes
           - Comparable compositions
        3. IMPORTANT RULES:
           - If search term matches exactly (like searching "bee" and finding a bee image), that project should be first
           - MUST return ALL available projects if total count ≤ 5
           - MUST return EXACTLY 5 projects if total count > 5
           - Sort by similarity score in descending order
           - Use ONLY the exact similarity scores from descriptions
           - Include projects to meet the count requirement, even if less relevant

        Return a valid JSON array of objects with 'id' and 'similarity' properties.`;

			const result = await model.generateContent(prompt);
			const response = result.response.text();
			return JSON.parse(
				response
					.trim()
					.replace(/```json\n?/g, "")
					.replace(/```\n?/g, "")
			);
		} catch (error) {
			throw error;
		}
	}

	private async imageToGenerativePart(imageFile: File) {
		const buffer = await imageFile.arrayBuffer();
		return {
			inlineData: {
				data: Buffer.from(buffer).toString("base64"),
				mimeType: imageFile.type,
			},
		};
	}
}
