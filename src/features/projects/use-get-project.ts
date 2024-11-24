import { useQuery } from "@tanstack/react-query";
import { client } from "@/lib/hono";
import { InferResponseType } from "hono";

export type ResponseType = InferResponseType<
	(typeof client.api.projects)[":id"]["$get"],
	200
>;

// Tách logic fetch thành function riêng
export const fetchProject = async (id: string) => {
	const response = await client.api.projects[":id"].$get({
		param: { id },
	});

	if (!response.ok) {
		throw new Error("An error occurred while fetching the project");
	}

	const { data } = await response.json();
	return data;
};

export const useGetProject = (id: string) => {
	return useQuery({
		queryKey: ["project", { id }],
		queryFn: () => fetchProject(id),
		enabled: !!id,
	});
};
