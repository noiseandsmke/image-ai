import { Pinecone } from "@pinecone-database/pinecone";

// const PINECONE_API_KEY = process.env.PINECONE_API_KEY!;
const PINECONE_INDEX_NAME = "projects";
const PINECONE_DIMENSION = 768;

export class PineconeService {
	private static instance: PineconeService;
	private client: Pinecone;

	private constructor() {
		this.client = new Pinecone({
			apiKey:
				"pcsk_4pd7z3_SkwMV7kckWeZ1GwQW7jLi6QazwYRD6VN7krdKAPR7167qmoL6kFPm4zsGJ4PC9e",
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
				console.log(`Created new Pinecone index: ${PINECONE_INDEX_NAME}`);
			} else {
				console.log(`Pinecone index ${PINECONE_INDEX_NAME} already exists`);
			}
		} catch (error) {
			console.error("Error creating Pinecone index:", error);
			throw error;
		}
	}

	async upsertVector(id: string, description: string, embedding: number[]) {
		try {
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

			console.log(`Successfully upserted vector for project ${id}`);
		} catch (error) {
			console.error("Error upserting vector:", error);
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
				console.log(`Deleted Pinecone index: ${PINECONE_INDEX_NAME}`);
			} else {
				console.log(`Index ${PINECONE_INDEX_NAME} does not exist`);
			}
		} catch (error) {
			console.error("Error deleting Pinecone index:", error);
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
			console.error("Error querying vectors:", error);
			throw error;
		}
	}
}
