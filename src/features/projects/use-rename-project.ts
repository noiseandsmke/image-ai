import { client } from "@/lib/hono";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { InferResponseType } from "hono";
import { toast } from "sonner";

type ResponseType = InferResponseType<
	(typeof client.api.projects)[":id"]["$patch"],
	200
>;

export const useRenameProject = () => {
	const queryClient = useQueryClient();

	const mutation = useMutation<
		ResponseType,
		Error,
		{ id: string; name: string }
	>({
		mutationFn: async ({ id, name }) => {
			const response = await client.api.projects[":id"].$patch({
				param: { id },
				json: { name },
			});

			if (!response.ok) throw new Error("Failed to rename project");
			return await response.json();
		},
		onSuccess: ({ data }) => {
			queryClient.invalidateQueries({ queryKey: ["projects"] });
			queryClient.invalidateQueries({
				queryKey: ["projects", { id: data.id }],
			});
			toast.success("Project renamed successfully");
		},
		onError: () => {
			toast.error("Failed to rename project");
		},
	});

	return mutation;
};
