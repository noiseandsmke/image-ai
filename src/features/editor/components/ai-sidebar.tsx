import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Textarea } from "@/components/ui/textarea";
import { useGenerateImage } from "@/features/ai/api/use-generate-image";
import { ToolSidebarClose } from "@/features/editor/components/tool-sidebar-close";
import { ToolSidebarHeader } from "@/features/editor/components/tool-sidebar-header";
import { ActiveTool, Editor } from "@/features/editor/types";
import { usePaywall } from "@/features/subscriptions/hooks/use-paywall";
import { cn } from "@/lib/utils";
import { useState } from "react";

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
			<ScrollArea>
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
			</ScrollArea>
			<ToolSidebarClose onClick={onClose} />
		</aside>
	);
};
