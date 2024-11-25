import { Pinecone } from "@pinecone-database/pinecone";

const PINECONE_INDEX_NAME = "projects";
const PINECONE_DIMENSION = 768;

export class PineconeService {
	private static instance: PineconeService;
	private client: Pinecone;

	private constructor() {
		this.client = new Pinecone({
			apiKey: process.env.NEXT_PUBLIC_PINECONE_API_KEY!,
		});
	}

	public static getInstance(): PineconeService {
		if (!PineconeService.instance) {
			PineconeService.instance = new PineconeService();
		}
		return PineconeService.instance;
	}

	async createIndexIfNotExists() {
		try {
			const indexes = await this.client.listIndexes();
			const indexExists = indexes.indexes?.some(
				(index) => index.name === PINECONE_INDEX_NAME
			);

			if (!indexExists) {
				await this.client.createIndex({
					name: PINECONE_INDEX_NAME,
					dimension: PINECONE_DIMENSION,
					metric: "cosine",
					spec: {
						serverless: {
							cloud: "aws",
							region: "us-east-1",
						},
					},
				});
			}
		} catch (error) {
			throw error;
		}
	}

	async vectorExists(id: string): Promise<boolean> {
		try {
			const index = this.client.index(PINECONE_INDEX_NAME);
			const fetchResponse = await index.fetch([id]);
			return fetchResponse.records[id] !== undefined;
		} catch (error) {
			return false;
		}
	}

	async updateVector(id: string, description: string, embedding?: number[]) {
		try {
			const index = this.client.index(PINECONE_INDEX_NAME);

			const updateData: {
				id: string;
				values?: number[];
				metadata?: { id: string; description: string };
			} = {
				id,
			};

			if (embedding) {
				updateData.values = embedding;
			}

			updateData.metadata = {
				id,
				description,
			};

			await index.update(updateData);
		} catch (error) {
			throw error;
		}
	}

	async upsertVector(id: string, description: string, embedding: number[]) {
		try {
			const exists = await this.vectorExists(id);

			if (exists) {
				await this.updateVector(id, description, embedding);
			} else {
				const index = this.client.index(PINECONE_INDEX_NAME);
				await index.upsert([
					{
						id,
						values: embedding,
						metadata: {
							id,
							description,
						},
					},
				]);
			}
		} catch (error) {
			throw error;
		}
	}

	async deleteVector(id: string) {
		try {
			const index = this.client.index(PINECONE_INDEX_NAME);
			await index.deleteOne(id);
		} catch (error) {
			throw error;
		}
	}

	async createEmptyVector(id: string) {
		try {
			const index = this.client.index(PINECONE_INDEX_NAME);
			const initialEmbedding = Array.from(
				{ length: PINECONE_DIMENSION },
				() => Math.random() * 0.01
			);

			await index.upsert([
				{
					id,
					values: initialEmbedding,
					metadata: {
						id,
						description: "",
					},
				},
			]);
		} catch (error) {
			throw error;
		}
	}

	async deleteIndex() {
		try {
			const indexes = await this.client.listIndexes();
			const indexExists = indexes.indexes?.some(
				(index) => index.name === PINECONE_INDEX_NAME
			);

			if (indexExists) {
				await this.client.deleteIndex(PINECONE_INDEX_NAME);
			}
		} catch (error) {
			throw error;
		}
	}

	async queryVectors(queryEmbedding: number[], topK: number = 5) {
		try {
			const index = this.client.index(PINECONE_INDEX_NAME);

			const queryResponse = await index.query({
				vector: queryEmbedding,
				topK,
				includeMetadata: true,
			});

			return queryResponse.matches;
		} catch (error) {
			throw error;
		}
	}
}
