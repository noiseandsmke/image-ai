import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Textarea } from "@/components/ui/textarea";
import { Table, TableBody, TableCell, TableRow } from "@/components/ui/table";
import { useGenerateImage } from "@/features/ai/api/use-generate-image";
import { ToolSidebarClose } from "@/features/editor/components/tool-sidebar-close";
import { ToolSidebarHeader } from "@/features/editor/components/tool-sidebar-header";
import { ActiveTool, Editor } from "@/features/editor/types";
import { usePaywall } from "@/features/subscriptions/hooks/use-paywall";
import { useGetProjects } from "@/features/projects/use-get-projects";
import { cn } from "@/lib/utils";
import { FileIcon, Loader } from "lucide-react";
import { useState } from "react";
import { useRouter, useParams } from "next/navigation";

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
	const { shouldBlock, triggerPaywall } = usePaywall();
	const mutation = useGenerateImage();
	const [value, setValue] = useState("");
	const { data, status } = useGetProjects();
	const router = useRouter();
	const params = useParams();
	const currentProjectId = params.projectId as string;

	const onSubmit = (e: React.FormEvent<HTMLFormElement>) => {
		e.preventDefault();

		if (shouldBlock) {
			triggerPaywall();
			return;
		}

		mutation.mutate(
			{ prompt: value },
			{
				onSuccess: ({ data }) => {
					editor?.addImage(data);
				},
			}
		);
	};

	const onClose = () => {
		onChangeActiveTool("select");
	};

	const handleProjectClick = (projectId: string) => {
		router.push(`/editor/${projectId}`);
	};

	const renderProjects = () => {
		if (status === "pending") {
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

		const filteredProjects = data?.pages[0]?.data.filter(
			(project) => project.id !== currentProjectId
		);

		if (!filteredProjects?.length) {
			return (
				<div className="text-center text-sm text-muted-foreground">
					No other projects available
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
		<aside
			className={cn(
				"bg-white relative border-r z-[40] w-[360px] h-full flex flex-col",
				activeTool === "ai" ? "visible" : "hidden"
			)}
		>
			<ToolSidebarHeader
				title="AI"
				description="Retrieve image project by using LLM"
			/>
			<ScrollArea className="flex-1">
				<form className="p-4 space-y-6" onSubmit={onSubmit}>
					<Textarea
						disabled={mutation.isPending}
						placeholder="Write your prompt here..."
						cols={30}
						rows={10}
						required
						minLength={3}
						value={value}
						onChange={(e) => setValue(e.target.value)}
					/>
					<Button
						disabled={mutation.isPending}
						type="submit"
						className="w-full"
					>
						Submit
					</Button>
				</form>

				<div className="px-4 pt-2 pb-4">
					<h3 className="font-medium text-sm text-muted-foreground mb-4">
						Other Projects
					</h3>
					{renderProjects()}
				</div>
			</ScrollArea>
			<ToolSidebarClose onClick={onClose} />
		</aside>
	);
};
