import { useInfiniteQuery, useQueryClient } from "@tanstack/react-query";
import { client } from "@/lib/hono";
import { InferResponseType } from "hono";

export type ResponseType = InferResponseType<
	(typeof client.api.projects)["$get"],
	200
>;

export const useGetProjects = () => {
	const queryClient = useQueryClient();

	const query = useInfiniteQuery<ResponseType, Error>({
		initialPageParam: 1,
		getNextPageParam: (lastPage) => lastPage.nextPage,
		queryKey: ["projects"],
		queryFn: async ({ pageParam }) => {
			const response = await client.api.projects.$get({
				query: {
					page: (pageParam as number).toString(),
					limit: "5",
				},
			});

			if (!response.ok) {
				throw new Error("An error occurred while fetching the projects");
			}

			return response.json();
		},
	});

	const invalidateProjects = () => {
		return queryClient.invalidateQueries({ queryKey: ["projects"] });
	};

	return { ...query, invalidateProjects };
};
