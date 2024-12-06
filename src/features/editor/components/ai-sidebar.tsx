import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Table, TableBody, TableCell, TableRow } from "@/components/ui/table";
import { Textarea } from "@/components/ui/textarea";
import { ToolSidebarClose } from "@/features/editor/components/tool-sidebar-close";
import { ToolSidebarHeader } from "@/features/editor/components/tool-sidebar-header";
import { ActiveTool, Editor } from "@/features/editor/types";
import { useGetProjects } from "@/features/projects/use-get-projects";
import {
  useSearchProjects,
  SearchResult,
} from "@/features/projects/use-search-projects";
import { useConfirm } from "@/hooks/use-confirm";
import { cn } from "@/lib/utils";
import { FileIcon, Loader } from "lucide-react";
import { useParams, useRouter } from "next/navigation";
import { useState } from "react";
import { toast } from "sonner";
import Image from "next/image";

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
  const { data, status, fetchNextPage, isFetchingNextPage, hasNextPage } =
    useGetProjects();
  const router = useRouter();
  const params = useParams();
  const currentProjectId = params.projectId as string;
  const [searchResults, setSearchResults] = useState<SearchResult[]>([]);
  const { searchProjects, isSearching } = useSearchProjects();
  const [imageErrors, setImageErrors] = useState<Record<string, boolean>>({});
  const [ConfirmationDialog, confirm] = useConfirm(
    "Switch Project",
    "Are you sure you want to switch to this project? Any unsaved changes will be lost.",
  );

  const onSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    try {
      const results = await searchProjects(value);
      setSearchResults(results);
    } catch (error) {
      toast.error("Failed to process search");
    }
  };

  const onClose = () => {
    onChangeActiveTool("select");
  };

  const handleProjectClick = async (projectId: string) => {
    try {
      const ok = await confirm();
      if (!ok) return;

      router.push(`/editor/${projectId}`);
      onClose();
    } catch (error) {
      toast.error("Navigation failed");
    }
  };

  const handleImageError = (projectId: string) => {
    setImageErrors((prev) => ({ ...prev, [projectId]: true }));
  };

  const renderThumbnail = (project: any) => (
    <div className="relative w-10 h-10">
      {project.thumbnailUrl && !imageErrors[project.id] ? (
        <div className="relative h-10 w-10">
          <div className="absolute inset-0 rounded bg-muted flex items-center justify-center">
            <FileIcon className="h-5 w-5 text-muted-foreground" />
          </div>
          <Image
            src={project.thumbnailUrl}
            alt={project.name}
            fill
            sizes="40px"
            className="rounded object-cover"
            style={{ objectFit: "cover" }}
            onError={() => handleImageError(project.id)}
          />
        </div>
      ) : (
        <div className="h-10 w-10 rounded bg-muted flex items-center justify-center">
          <FileIcon className="h-5 w-5 text-muted-foreground" />
        </div>
      )}
    </div>
  );

  const getAllProjects = () => {
    if (!data?.pages) return [];
    return data.pages.reduce<any[]>((acc, page) => {
      if (page?.data) {
        return [...acc, ...page.data];
      }
      return acc;
    }, []);
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

    if (searchResults.length > 0) {
      const projects = searchResults
        .map((result) => {
          const project = getAllProjects().find((p) => p.id === result.id);
          return project ? { ...project, similarity: result.similarity } : null;
        })
        .filter((project): project is NonNullable<typeof project> =>
          Boolean(project),
        );

      if (!projects.length) {
        return (
          <div className="text-center text-sm text-muted-foreground">
            No matching projects found
          </div>
        );
      }

      return (
        <Table>
          <TableBody>
            {projects.map((project) => (
              <TableRow
                key={project.id}
                className="hover:bg-slate-50 transition-colors cursor-pointer"
                onClick={() => handleProjectClick(project.id)}
              >
                <TableCell className="flex items-center gap-x-3">
                  {renderThumbnail(project)}
                  <div className="flex-1 flex items-center justify-between">
                    <span className="font-medium truncate max-w-[180px]">
                      {project.name}
                    </span>
                    <span className="text-sm text-muted-foreground ml-2 bg-slate-100 px-2 py-1 rounded">
                      {project.similarity.toFixed(2)}
                    </span>
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      );
    }

    const otherProjects = getAllProjects().filter(
      (project) => project.id !== currentProjectId,
    );

    if (!otherProjects?.length) {
      return (
        <div className="text-center text-sm text-muted-foreground">
          No other projects available
        </div>
      );
    }

    return (
      <div>
        <Table>
          <TableBody>
            {otherProjects.map((project) => (
              <TableRow
                key={project.id}
                className="hover:bg-slate-50 transition-colors cursor-pointer"
                onClick={() => handleProjectClick(project.id)}
              >
                <TableCell className="flex items-center gap-x-3">
                  {renderThumbnail(project)}
                  <div className="flex-1 flex items-center justify-between">
                    <span className="font-medium truncate max-w-[180px]">
                      {project.name}
                    </span>
                  </div>
                </TableCell>
              </TableRow>
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
              {isFetchingNextPage ? (
                <div className="flex items-center gap-2">
                  <Loader className="h-4 w-4 animate-spin" />
                  Loading...
                </div>
              ) : (
                "Load more"
              )}
            </Button>
          </div>
        )}
      </div>
    );
  };

  return (
    <>
      <ConfirmationDialog />
      <aside
        className={cn(
          "bg-white relative border-r z-[40] w-[360px] h-full flex flex-col",
          activeTool === "ai" ? "visible" : "hidden",
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
    </>
  );
};
