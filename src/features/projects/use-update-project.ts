import { useMutation, useQueryClient } from "@tanstack/react-query";
import { InferRequestType, InferResponseType } from "hono";
import { client } from "@/lib/hono";
import { toast } from "sonner";

type ResponseType = InferResponseType<
	(typeof client.api.projects)[":id"]["$patch"],
	200
>;
type RequestType = InferRequestType<
	(typeof client.api.projects)[":id"]["$patch"]
>["json"];

export const useUpdateProject = (id: string) => {
	const clientQuery = useQueryClient();

	const mutation = useMutation<ResponseType, Error, RequestType>({
		mutationKey: ["project", { id }],
		mutationFn: async (json) => {
			if (!json.json) {
				throw new Error("JSON is required");
			}

			const parsedJson = JSON.parse(json.json);

			if (parsedJson.objects) {
				parsedJson.objects = parsedJson.objects.map((obj: any) => {
					if (obj.name === "clip") {
						return {
							...obj,
							left: 266.5,
							top: -278.5,
						};
					}
					return obj;
				});
			}

			const response = await client.api.projects[":id"].$patch({
				json: {
					...json,
					json: JSON.stringify(parsedJson),
				},
				param: { id },
			});

			if (!response.ok) throw new Error("Failed to update project");
			return await response.json();
		},
		onSuccess: () => {
			clientQuery.invalidateQueries({ queryKey: ["projects"] });
			clientQuery.invalidateQueries({ queryKey: ["project", { id }] });
		},
		onError: () => {
			toast.error("Failed to update project");
		},
	});

	return mutation;
};
