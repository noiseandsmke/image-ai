"use client";

import {
  DropdownMenu,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuContent,
} from "@/components/ui/dropdown-menu";
import { 
  Table,
  TableRow,
  TableCell,
  TableBody,
} from "@/components/ui/table";
import { formatDistanceToNow } from "date-fns";
import { useGetProjects } from "@/features/projects/use-get-projects";
import { AlertTriangle, CopyIcon, FileIcon, Loader, MoreHorizontal, Search, Trash } from "lucide-react";
import { useRouter } from "next/navigation";
import React from "react";
import { Button } from "@/components/ui/button";
import { useDuplicateProject } from "@/features/projects/use-duplicate-project";
import { useDeleteProject } from "@/features/projects/use-delete-project";
import { useConfirm } from "@/hooks/use-confirm";

export const ProjectsSection = () => {
  const [ConfirmationDialog, confirm] = useConfirm(
    'Are you sure?',
    'You are about to delete this project.'
  );
  const duplicateMutation = useDuplicateProject();
  const removeMutation = useDeleteProject();
  const router = useRouter();

  const onCopy = (id: string) => {
    duplicateMutation.mutate({ id });
  };

  const onDelete = async (id: string) => {
    const ok = await confirm();

    if (ok) removeMutation.mutate({ id });
  };

  const {
    data,
    status,
    fetchNextPage,
    isFetchingNextPage,
    hasNextPage,
  } = useGetProjects();

  if (status === "pending") 
    return (
      <div className="sapce-y-4">
        <h3 className="font-semibold text-lg">
        Recent projects
        </h3>
        <div className="flex flex-col gap-y-4 items-center justify-center h-32">
          <Loader className="size-6 animate-spin text-muted-foreground"/>
        </div>
      </div>
    )

  if (status === "error") 
    return (
      <div className="sapce-y-4">
        <h3 className="font-semibold text-lg">
        Recent projects
        </h3>
        <div className="flex flex-col gap-y-4 items-center justify-center h-32">
          <AlertTriangle className="size-6 text-muted-foreground"/>
          <p className="text-muted-foreground text-sm">
            Failed to load projects
          </p>
        </div>
      </div>
    )

  if (!data.pages.length || !data.pages[0].data.length) 
    return (
      <div className="sapce-y-4">
        <h3 className="font-semibold text-lg">
        Recent projects
        </h3>
        <div className="flex flex-col gap-y-4 items-center justify-center h-32">
          <Search className="size-6 text-muted-foreground"/>
          <p className="text-muted-foreground text-sm">
            No projects found
          </p>
        </div>
      </div>
    )

  return (
    <div>
      <ConfirmationDialog />
      <h3 className="font-semibold text-lg">
        Recent projects
      </h3>
      <Table>
        <TableBody>
          {data.pages.map((group, index) => (
            <React.Fragment key={index}>
              {group.data.map((project) => (
                <TableRow key={project.id}>
                  <TableCell onClick={() => router.push(`/editor/${project.id}`)}
                  className="font-medium flex items-center gap-x-2 cursor-pointer">
                    <FileIcon className="size-6"/>
                    {project.name}
                  </TableCell>
                  <TableCell onClick={() => router.push(`/editor/${project.id}`)}
                  className="hidden md:table-cell cursor-pointer">
                    {project.width} x {project.height} px
                  </TableCell>
                  <TableCell onClick={() => router.push(`/editor/${project.id}`)}
                  className="hidden md:table-cell cursor-pointer">
                    {formatDistanceToNow(project.updatedAt, { addSuffix: true })}
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
