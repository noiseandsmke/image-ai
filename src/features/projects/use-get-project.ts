import { useQuery }  from  '@tanstack/react-query';
import { client } from '@/lib/hono';
import { InferResponseType } from 'hono';

export type ResponseType = InferResponseType<typeof client.api.projects[":id"]["$get"], 200>;

export const useGetProject = (id: string) => {
  const query = useQuery({
    enabled: !!id,
    queryKey: ["project", { id }],
    queryFn: async () => {
      const response = await client.api.projects[":id"].$get({
        param: { id }
      });

      if (!response.ok) {
        throw new Error('An error occurred while fetching the project');
      }

      const { data } = await response.json();
      return data;
    },
  });

  return query;
}