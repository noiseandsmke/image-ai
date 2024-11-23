"use client";

import {
	DropdownMenu,
	DropdownMenuItem,
	DropdownMenuTrigger,
	DropdownMenuContent,
} from "@/components/ui/dropdown-menu";
import { Table, TableRow, TableCell, TableBody } from "@/components/ui/table";
import { Input } from "@/components/ui/input";
import { formatDistanceToNow } from "date-fns";
import { useGetProjects } from "@/features/projects/use-get-projects";
import {
	AlertTriangle,
	CopyIcon,
	FileIcon,
	Loader,
	MoreHorizontal,
	PencilIcon,
	Search,
	Trash,
} from "lucide-react";
import { useRouter } from "next/navigation";
import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { useRenameProject } from "@/features/projects/use-rename-project";
import { useDuplicateProject } from "@/features/projects/use-duplicate-project";
import { useDeleteProject } from "@/features/projects/use-delete-project";
import { useConfirm } from "@/hooks/use-confirm";

export const ProjectsSection = () => {
	const [editingId, setEditingId] = useState<string | null>(null);
	const [editingName, setEditingName] = useState("");

	const [ConfirmationDialog, confirm] = useConfirm(
		"Are you sure?",
		"You are about to delete this project."
	);
	const duplicateMutation = useDuplicateProject();
	const removeMutation = useDeleteProject();
	const renameMutation = useRenameProject();
	const router = useRouter();

	const onCopy = (id: string) => {
		duplicateMutation.mutate({ id });
	};

	const onDelete = async (id: string) => {
		const ok = await confirm();
		if (ok) removeMutation.mutate({ id });
	};

	const startEditing = (id: string, currentName: string) => {
		setEditingId(id);
		setEditingName(currentName);
	};

	const handleRename = (id: string, currentName: string) => {
		const newName = editingName.trim();
		if (newName && newName !== currentName) {
			renameMutation.mutate(
				{ id, name: newName },
				{
					onSuccess: () => {
						setEditingId(null);
						setEditingName("");
					},
				}
			);
		} else {
			setEditingId(null);
		}
	};

	const handleKeyDown = (
		e: React.KeyboardEvent,
		id: string,
		currentName: string
	) => {
		if (e.key === "Enter") {
			handleRename(id, currentName);
		} else if (e.key === "Escape") {
			setEditingId(null);
		}
	};

	const { data, status, fetchNextPage, isFetchingNextPage, hasNextPage } =
		useGetProjects();

	if (status === "pending")
		return (
			<div className="sapce-y-4">
				<h3 className="font-semibold text-lg">Recent projects</h3>
				<div className="flex flex-col gap-y-4 items-center justify-center h-32">
					<Loader className="size-6 animate-spin text-muted-foreground" />
				</div>
			</div>
		);

	if (status === "error")
		return (
			<div className="sapce-y-4">
				<h3 className="font-semibold text-lg">Recent projects</h3>
				<div className="flex flex-col gap-y-4 items-center justify-center h-32">
					<AlertTriangle className="size-6 text-muted-foreground" />
					<p className="text-muted-foreground text-sm">
						Failed to load projects
					</p>
				</div>
			</div>
		);

	if (!data.pages.length || !data.pages[0].data.length)
		return (
			<div className="sapce-y-4">
				<h3 className="font-semibold text-lg">Recent projects</h3>
				<div className="flex flex-col gap-y-4 items-center justify-center h-32">
					<Search className="size-6 text-muted-foreground" />
					<p className="text-muted-foreground text-sm">No projects found</p>
				</div>
			</div>
		);

	return (
		<div>
			<ConfirmationDialog />
			<h3 className="font-semibold text-lg">Recent projects</h3>
			<Table>
				<TableBody>
					{data.pages.map((group, index) => (
						<React.Fragment key={index}>
							{group.data.map((project) => (
								<TableRow key={project.id}>
									<TableCell className="font-medium flex items-center gap-x-2">
										<FileIcon className="size-6" />
										{editingId === project.id ? (
											<Input
												autoFocus
												value={editingName}
												onChange={(e) => setEditingName(e.target.value)}
												onBlur={() => handleRename(project.id, project.name)}
												onKeyDown={(e) =>
													handleKeyDown(e, project.id, project.name)
												}
												className="h-8"
											/>
										) : (
											<div
												onClick={() => router.push(`/editor/${project.id}`)}
												className="cursor-pointer flex-1"
											>
												{project.name}
											</div>
										)}
									</TableCell>
									<TableCell
										onClick={() => router.push(`/editor/${project.id}`)}
										className="hidden md:table-cell cursor-pointer"
									>
										{project.width} x {project.height} px
									</TableCell>
									<TableCell
										onClick={() => router.push(`/editor/${project.id}`)}
										className="hidden md:table-cell cursor-pointer"
									>
										{formatDistanceToNow(project.updatedAt, {
											addSuffix: true,
										})}
									</TableCell>
									<TableCell className="flex items-center justify-end">
										<DropdownMenu modal={false}>
											<DropdownMenuTrigger asChild>
												<Button disabled={false} size="icon" variant="ghost">
													<MoreHorizontal className="size-4" />
												</Button>
											</DropdownMenuTrigger>
											<DropdownMenuContent align="end" className="w-60">
												<DropdownMenuItem
													disabled={renameMutation.isPending}
													onClick={() => startEditing(project.id, project.name)}
													className="h-10 cursor-pointer"
												>
													<PencilIcon className="size-4 mr-2" /> Rename
												</DropdownMenuItem>
												<DropdownMenuItem
													disabled={duplicateMutation.isPending}
													onClick={() => onCopy(project.id)}
													className="h-10 cursor-pointer"
												>
													<CopyIcon className="size-4 mr-2" /> Make a copy
												</DropdownMenuItem>
												<DropdownMenuItem
													disabled={removeMutation.isPending}
													onClick={() => onDelete(project.id)}
													className="h-10 cursor-pointer"
												>
													<Trash className="size-4 mr-2" /> Delete
												</DropdownMenuItem>
											</DropdownMenuContent>
										</DropdownMenu>
									</TableCell>
								</TableRow>
							))}
						</React.Fragment>
					))}
				</TableBody>
			</Table>
			{hasNextPage && (
				<div className="w-full flex items-center justify-center pt-4">
					<Button
						variant="ghost"
						onClick={() => fetchNextPage()}
						disabled={isFetchingNextPage}
					>
						Load more
					</Button>
				</div>
			)}
		</div>
	);
};
