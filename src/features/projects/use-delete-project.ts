import { useMutation, useQueryClient } from "@tanstack/react-query";
import { InferRequestType, InferResponseType } from "hono";
import { client } from "@/lib/hono";
import { toast } from "sonner";
import { PineconeService } from "@/features/editor/hooks/use-pinecone";

type ResponseType = InferResponseType<
	(typeof client.api.projects)[":id"]["$delete"],
	200
>;
type RequestType = InferRequestType<
	(typeof client.api.projects)[":id"]["$delete"]
>["param"];

export const useDeleteProject = () => {
	const clientQuery = useQueryClient();
	const pineconeService = PineconeService.getInstance();

	const mutation = useMutation<ResponseType, Error, RequestType>({
		mutationFn: async (param) => {
			try {
				const response = await client.api.projects[":id"].$delete({
					param,
				});
				if (!response.ok) throw new Error("Failed to delete project");

				await pineconeService.deleteVector(param.id);

				return await response.json();
			} catch (error) {
				throw error;
			}
		},
		onSuccess: ({ data }) => {
			clientQuery.invalidateQueries({ queryKey: ["projects"] });
			clientQuery.invalidateQueries({
				queryKey: ["projects", { id: data.id }],
			});
			toast.success("Project deleted successfully");
		},
		onError: () => {
			toast.error("Failed to delete project");
		},
	});

	return mutation;
};
