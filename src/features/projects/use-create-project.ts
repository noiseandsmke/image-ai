import { useMutation, useQueryClient } from "@tanstack/react-query";
import { client } from "@/lib/hono";
import { PineconeService } from "@/features/editor/hooks/use-pinecone";
import { toast } from "sonner";

interface CreateProjectInput {
	name: string;
	json: string;
	width: number;
	height: number;
}

interface CreateProjectPayload extends CreateProjectInput {
	createdAt: string;
	updatedAt: string;
}

export const useCreateProject = () => {
	const queryClient = useQueryClient();
	const pineconeService = PineconeService.getInstance();

	const mutation = useMutation({
		mutationFn: async (values: CreateProjectInput) => {
			try {
				const payload: CreateProjectPayload = {
					...values,
					createdAt: new Date().toISOString(),
					updatedAt: new Date().toISOString(),
				};

				const response = await client.api.projects.$post({
					json: payload,
				});

				if (!response.ok) {
					throw new Error("Failed to create project");
				}

				const data = await response.json();

				await pineconeService.createEmptyVector(data.data.id);

				return data;
			} catch (error) {
				if (error instanceof Error) {
					toast.error(error.message);
				}
				throw error;
			}
		},
		onSuccess: () => {
			queryClient.invalidateQueries({ queryKey: ["projects"] });
		},
	});

	return mutation;
};
