"use client";

import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { ArrowRight, Sparkles } from "lucide-react";
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
	});
};

export const Banner = () => {
	const router = useRouter();
	const mutation = useCreateProject();

	const onClick = async () => {
		const width = 900;
		const height = 1200;

		try {
			mutation.mutate(
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

	return (
		<div
			className="text-white aspect-[5/1] min-h-[248px] flex gap-x-6 p-6 items-center
    rounded-xl bg-gradient-to-r from-[#2e62cb] via-[#0073ff] to-[#3faff5]"
		>
			<div className="rounded-full size-28 items-center justify-center bg-white/50 hidden md:flex">
				<div className="rounded-full size-20 flex items-center justify-center bg-white">
					<Sparkles className="h-20 text-[#0073ff] fill-[#0073ff]" />
				</div>
			</div>
			<div className="flex flex-col gap-y-2">
				<h1 className="text-xl md:text-3xl font-semibold">
					Visualize your ideas with us
				</h1>
				<p className="text-xs md:text-sm mb-2">
					Turn inspiration into design in no time. Simply upload an image and
					let AI do the rest.
				</p>
				<Button
					variant="secondary"
					className="w-[160px]"
					onClick={onClick}
					disabled={mutation.isPending}
				>
					{mutation.isPending ? "Creating..." : "Start creating"}
					<ArrowRight className="size-4 ml-2" />
				</Button>
			</div>
		</div>
	);
};
