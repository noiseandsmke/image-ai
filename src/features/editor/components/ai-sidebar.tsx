import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Textarea } from "@/components/ui/textarea";
import { Table, TableBody, TableCell, TableRow } from "@/components/ui/table";
import { ToolSidebarClose } from "@/features/editor/components/tool-sidebar-close";
import { ToolSidebarHeader } from "@/features/editor/components/tool-sidebar-header";
import { ActiveTool, Editor } from "@/features/editor/types";
import { useGetProjects } from "@/features/projects/use-get-projects";
import { fetchProject } from "@/features/projects/use-get-project";
import { cn } from "@/lib/utils";
import { FileIcon, Loader } from "lucide-react";
import { useState } from "react";
import { useRouter, useParams } from "next/navigation";
import { useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { useSearchProjects } from "@/features/projects/use-search-projects";

interface AiSidebarProps {
	editor: Editor | undefined;
	activeTool: ActiveTool;
	onChangeActiveTool: (tool: ActiveTool) => void;
}

export const AiSidebar = ({
	editor,
	activeTool,
	onChangeActiveTool,
}: AiSidebarProps) => {
	const [value, setValue] = useState("");
	const { data, status } = useGetProjects();
	const router = useRouter();
	const params = useParams();
	const queryClient = useQueryClient();
	const currentProjectId = params.projectId as string;
	const [isNavigating, setIsNavigating] = useState(false);
	const { searchProjects, isSearching } = useSearchProjects();
	const [searchResults, setSearchResults] = useState<string[]>([]);

	const onSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
		e.preventDefault();
		try {
			const projectIds = await searchProjects(value);
			setSearchResults(projectIds);
		} catch (error) {
			toast.error("Failed to process search");
		}
	};

	const onClose = () => {
		onChangeActiveTool("select");
	};

	const handleProjectClick = async (projectId: string) => {
		try {
			setIsNavigating(true);

			await queryClient.prefetchQuery({
				queryKey: ["project", { id: projectId }],
				queryFn: () => fetchProject(projectId),
			});

			await router.push(`/editor/${projectId}`);

			await Promise.all([
				queryClient.invalidateQueries({ queryKey: ["projects"] }),
				queryClient.invalidateQueries({
					queryKey: ["project", { id: projectId }],
				}),
			]);
		} catch (error) {
			toast.error("Navigation failed");
		} finally {
			setIsNavigating(false);
		}
	};

	const renderProjects = () => {
		if (status === "pending" || isSearching) {
			return (
				<div className="flex justify-center py-4">
					<Loader className="h-6 w-6 animate-spin text-muted-foreground" />
				</div>
			);
		}

		if (status === "error") {
			return (
				<div className="text-center text-sm text-muted-foreground">
					Failed to load projects
				</div>
			);
		}

		const filteredProjects = data?.pages[0]?.data.filter((project) => {
			if (searchResults.length > 0) {
				return (
					searchResults.includes(project.id) && project.id !== currentProjectId
				);
			}
			return project.id !== currentProjectId;
		});

		if (!filteredProjects?.length) {
			return (
				<div className="text-center text-sm text-muted-foreground">
					{searchResults.length > 0
						? "No matching projects found"
						: "No other projects available"}
				</div>
			);
		}

		return (
			<Table>
				<TableBody>
					{filteredProjects.map((project) => (
						<TableRow
							key={project.id}
							className="hover:bg-slate-50 transition-colors cursor-pointer"
							onClick={() => handleProjectClick(project.id)}
						>
							<TableCell className="flex items-center gap-x-3">
								{project.thumbnailUrl ? (
									<div className="relative w-10 h-10">
										<img
											src={project.thumbnailUrl}
											alt={project.name}
											className="absolute inset-0 rounded object-cover w-full h-full"
										/>
									</div>
								) : (
									<div className="h-10 w-10 rounded bg-muted flex items-center justify-center">
										<FileIcon className="h-5 w-5 text-muted-foreground" />
									</div>
								)}
								<span className="font-medium truncate max-w-[180px]">
									{project.name}
								</span>
							</TableCell>
						</TableRow>
					))}
				</TableBody>
			</Table>
		);
	};

	return (
		<>
			<aside
				className={cn(
					"bg-white relative border-r z-[40] w-[360px] h-full flex flex-col",
					activeTool === "ai" ? "visible" : "hidden"
				)}
			>
				<ToolSidebarHeader
					title="AI Search"
					description="Search projects by describing their content"
				/>
				<ScrollArea className="flex-1">
					<div className="p-4">
						<form className="space-y-6" onSubmit={onSubmit}>
							<Textarea
								disabled={isSearching}
								placeholder="Describe the project you're looking for..."
								cols={30}
								rows={10}
								required
								minLength={3}
								value={value}
								onChange={(e) => setValue(e.target.value)}
							/>
							<Button disabled={isSearching} type="submit" className="w-full">
								{isSearching ? (
									<div className="flex items-center gap-2">
										<Loader className="h-4 w-4 animate-spin" />
										Searching...
									</div>
								) : (
									"Search Projects"
								)}
							</Button>
						</form>
					</div>

					<div className="px-4 pt-2 pb-4">
						<h3 className="font-medium text-sm text-muted-foreground mb-4">
							{searchResults.length > 0 ? "Search Results" : "Other Projects"}
						</h3>
						{renderProjects()}
					</div>
				</ScrollArea>
				<ToolSidebarClose onClick={onClose} />
			</aside>

			{isNavigating && (
				<div className="fixed inset-0 bg-black/50 flex items-center justify-center z-[100]">
					<div className="bg-white p-4 rounded-lg shadow-lg flex items-center gap-2">
						<Loader className="h-5 w-5 animate-spin text-muted-foreground" />
						<span className="text-sm">Loading project...</span>
					</div>
				</div>
			)}
		</>
	);
};
