"use client";

import { useFilePicker } from "use-file-picker";
import {
	ChevronDown,
	Download,
	Loader,
	MousePointerClick,
	Redo2,
	Undo2,
} from "lucide-react";
import { CiFileOn } from "react-icons/ci";
import { Separator } from "@/components/ui/separator";
import { BsCloudCheck, BsCloudSlash } from "react-icons/bs";
import { Logo } from "@/features/editor/components/logo";
import { Button } from "@/components/ui/button";
import { Hint } from "@/components/hint";
import {
	DropdownMenu,
	DropdownMenuItem,
	DropdownMenuContent,
	DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { ActiveTool, Editor } from "@/features/editor/types";
import { cn } from "@/lib/utils";
import { UserButton } from "@/features/auth/components/user-button";
import { useMutationState } from "@tanstack/react-query";
import { TiCloudStorage } from "react-icons/ti";
import { useSaveDescription } from "@/features/editor/hooks/use-save-description";
import { useRouter } from "next/navigation";
import { useCreateProject } from "@/features/projects/use-create-project";
import { toast } from "sonner";

const createInitialJson = (width: number, height: number) => {
	return JSON.stringify({
		version: "5.3.0",
		objects: [
			{
				type: "rect",
				version: "5.3.0",
				originX: "left",
				originY: "top",
				left: 266.5,
				top: -278.5,
				width: width,
				height: height,
				fill: "white",
				stroke: null,
				strokeWidth: 0,
				strokeDashArray: null,
				strokeLineCap: "butt",
				strokeDashOffset: 0,
				strokeLineJoin: "miter",
				strokeUniform: false,
				strokeMiterLimit: 4,
				scaleX: 1,
				scaleY: 1,
				angle: 0,
				flipX: false,
				flipY: false,
				opacity: 1,
				shadow: null,
				visible: true,
				backgroundColor: "",
				fillRule: "nonzero",
				paintFirst: "fill",
				globalCompositeOperation: "source-over",
				skewX: 0,
				skewY: 0,
				rx: 0,
				ry: 0,
				name: "clip",
			},
		],
		clipPath: {
			type: "rect",
			version: "5.3.0",
			originX: "left",
			originY: "top",
			left: 266.5,
			top: -278.5,
			width: width,
			height: height,
			fill: "white",
			stroke: null,
			strokeWidth: 0,
			strokeDashArray: null,
			strokeLineCap: "butt",
			strokeDashOffset: 0,
			strokeLineJoin: "miter",
			strokeUniform: false,
			strokeMiterLimit: 4,
			scaleX: 1,
			scaleY: 1,
			angle: 0,
			flipX: false,
			flipY: false,
			opacity: 1,
			shadow: null,
			visible: true,
			backgroundColor: "",
			fillRule: "nonzero",
			paintFirst: "fill",
			globalCompositeOperation: "source-over",
			skewX: 0,
			skewY: 0,
			rx: 0,
			ry: 0,
		},
	});
};

interface NavbarProps {
	id: string;
	editor: Editor | undefined;
	activeTool: ActiveTool;
	onChangeActiveTool: (tool: ActiveTool) => void;
}

export const Navbar = ({
	id,
	editor,
	activeTool,
	onChangeActiveTool,
}: NavbarProps) => {
	const router = useRouter();
	const createProject = useCreateProject();
	const saveDescription = useSaveDescription();

	const data = useMutationState({
		filters: {
			mutationKey: ["project", { id }],
			exact: true,
		},
		select: (mutation) => mutation.state.data,
	});

	const currentStatus = data[data.length - 1];

	const isError = currentStatus === "error";
	const isPending = currentStatus === "pending";

	const { openFilePicker } = useFilePicker({
		accept: ".json",
		onFilesSuccessfullySelected: ({ plainFiles }: any) => {
			if (plainFiles && plainFiles.length > 0) {
				const file = plainFiles[0];
				const reader = new FileReader();
				reader.readAsText(file, "UTF-8");
				reader.onload = () => {
					editor?.loadJson(reader.result as string);
				};
			}
		},
	});

	const handleCreateNew = async () => {
		const width = 900;
		const height = 1200;

		try {
			createProject.mutate(
				{
					name: "Untitled project",
					json: createInitialJson(width, height),
					width,
					height,
				},
				{
					onSuccess: ({ data }) => {
						router.push(`/editor/${data.id}`);
					},
					onError: (error) => {
						toast.error("Failed to create project. Please try again.");
					},
				}
			);
		} catch (error) {
			toast.error("An unexpected error occurred");
		}
	};

	const handleSaveDescription = () => {
		if (!editor) return;

		saveDescription.mutate({
			id,
			editor,
		});
	};

	return (
		<nav className="w-full flex items-center p-4 h-[68px] gap-x-8 border-b lg:pl-[34px]">
			<Logo />
			<div className="w-full flex items-center gap-x-1 h-full">
				<DropdownMenu modal={false}>
					<DropdownMenuTrigger asChild>
						<Button size="sm" variant="ghost">
							File
							<ChevronDown className="size-4 ml-2" />
						</Button>
					</DropdownMenuTrigger>
					<DropdownMenuContent align="start" className="min-2-60">
						<DropdownMenuItem
							className="flex items-center gap-x-2"
							onClick={handleCreateNew}
						>
							<CiFileOn className="size-8" />
							<div>
								<p>Create new project</p>
								<p className="text-xs text-muted-foreground">
									Start a new design
								</p>
							</div>
						</DropdownMenuItem>
						<DropdownMenuItem
							className="flex items-center gap-x-2"
							onClick={() => openFilePicker()}
						>
							<CiFileOn className="size-8" />
							<div>
								<p>Open</p>
								<p className="text-xs text-muted-foreground">
									Open a JSON file
								</p>
							</div>
						</DropdownMenuItem>
					</DropdownMenuContent>
				</DropdownMenu>
				<Separator orientation="vertical" className="mx-2" />
				<Hint label="Select" side="bottom" sideOffset={10}>
					<Button
						variant="ghost"
						size="icon"
						onClick={() => onChangeActiveTool("select")}
						className={cn(activeTool === "select" && "bg-gray-100")}
					>
						<MousePointerClick className="size-4" />
					</Button>
				</Hint>
				<Hint label="Undo" side="bottom" sideOffset={10}>
					<Button
						disabled={!editor?.canUndo()}
						variant="ghost"
						size="icon"
						onClick={() => editor?.onUndo()}
					>
						<Undo2 className="size-4" />
					</Button>
				</Hint>
				<Hint label="Redo" side="bottom" sideOffset={10}>
					<Button
						disabled={!editor?.canRedo()}
						variant="ghost"
						size="icon"
						onClick={() => editor?.onRedo()}
					>
						<Redo2 className="size-4" />
					</Button>
				</Hint>
				<Separator orientation="vertical" className="mx-2" />
				{isPending && (
					<div className="flex items-center gap-x-2">
						<Loader className="size-4 animate-spin text-muted-foreground" />
						<div className="text-xs text-muted-foreground">Saving...</div>
					</div>
				)}
				{!isPending && isError && (
					<div className="flex items-center gap-x-2">
						<BsCloudSlash className="size-[20px] text-muted-foreground" />
						<div className="text-xs text-muted-foreground">Failed to save</div>
					</div>
				)}
				{!isPending && !isError && (
					<div className="flex items-center gap-x-2">
						<BsCloudCheck className="size-[20px] text-muted-foreground" />
						<div className="text-xs text-muted-foreground">Saved</div>
					</div>
				)}
				<div className="flex items-center gap-x-2">
					<Button
						size="sm"
						variant="ghost"
						onClick={handleSaveDescription}
						disabled={saveDescription.isPending}
						className="flex items-center gap-x-2"
					>
						<TiCloudStorage className="size-4" />
						{saveDescription.isPending ? "Saving..." : "Save description"}
					</Button>
				</div>
				<div className="ml-auto flex items-center gap-x-4">
					<DropdownMenu modal={false}>
						<DropdownMenuTrigger asChild>
							<Button size="sm" variant="ghost">
								Export
								<Download className="size-4 ml-4" />
							</Button>
						</DropdownMenuTrigger>
						<DropdownMenuContent align="end" className="min-w-60">
							<DropdownMenuItem
								className="flex items-center gap-x-2"
								onClick={() => editor?.saveJson(id)}
							>
								<CiFileOn className="size-8" />
								<div>
									<p>JSON</p>
									<p className="text-xs text-muted-foreground">
										Save for later editing
									</p>
								</div>
							</DropdownMenuItem>
							<DropdownMenuItem
								className="flex items-center gap-x-2"
								onClick={() => editor?.savePng(id)}
							>
								<CiFileOn className="size-8" />
								<div>
									<p>PNG</p>
									<p className="text-xs text-muted-foreground">
										Best for sharing on the web
									</p>
								</div>
							</DropdownMenuItem>
							<DropdownMenuItem
								className="flex items-center gap-x-2"
								onClick={() => editor?.saveJpg(id)}
							>
								<CiFileOn className="size-8" />
								<div>
									<p>JPG</p>
									<p className="text-xs text-muted-foreground">
										Best for printing
									</p>
								</div>
							</DropdownMenuItem>
							<DropdownMenuItem
								className="flex items-center gap-x-2"
								onClick={() => editor?.saveSvg(id)}
							>
								<CiFileOn className="size-8" />
								<div>
									<p>SVG</p>
									<p className="text-xs text-muted-foreground">
										Best for editing in vector software
									</p>
								</div>
							</DropdownMenuItem>
						</DropdownMenuContent>
					</DropdownMenu>
					<UserButton />
				</div>
			</div>
		</nav>
	);
};
