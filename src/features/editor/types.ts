import { fabric } from "fabric";
import { ITextboxOptions } from "fabric/fabric-impl";
import * as material from "material-colors";

export const JSON_KEYS = [
	"name",
	"gradientAngle",
	"selectable",
	"hasControls",
	"linkData",
	"editable",
	"extensionType",
	"extension",
];

export const filters = [
	"none",
	"poraloid",
	"sepia",
	"kodachrome",
	"contrast",
	"brightness",
	"greyscale",
	"brownie",
	"vintage",
	"technicolor",
	"pixelate",
	"invert",
	"blur",
	"sharpen",
	"emboss",
	"removecolor",
	"blacknwhite",
	"vibrance",
	"blendcolor",
	"huerotate",
	"saturation",
	"gamma",
];

export const fonts = [
	"Arial",
	"Arial Black",
	"Verdana",
	"Helvetica",
	"Tahoma",
	"Trebuchet MS",
	"Times New Roman",
	"Georgia",
	"Garamond",
	"Courier New",
	"Brush Script MT",
	"Palatino",
	"Bookman",
	"Comic Sans MS",
	"Impact",
	"Lucida Sans Unicode",
	"Geneva",
	"Lucida Console",
];

export const selectionDependentTools = [
	"fill",
	"font",
	"filter",
	"opacity",
	"remove-bg",
	"stroke-color",
	"stroke-width",
];

export const colors = [
	material.red["500"],
	material.pink["500"],
	material.purple["500"],
	material.deepPurple["500"],
	material.indigo["500"],
	material.blue["500"],
	material.lightBlue["500"],
	material.cyan["500"],
	material.teal["500"],
	material.green["500"],
	material.lightGreen["500"],
	material.lime["500"],
	material.yellow["500"],
	material.amber["500"],
	material.orange["500"],
	material.deepOrange["500"],
	material.brown["500"],
	material.blueGrey["500"],
	"transparent",
];

export type ActiveTool =
	| "select"
	| "shapes"
	| "text"
	| "images"
	| "draw"
	| "fill"
	| "stroke-color"
	| "stroke-width"
	| "font"
	| "opacity"
	| "filter"
	| "settings"
	| "ai"
	| "remove-bg"
	| "templates";

export const FILL_COLOR = "rgba(0, 0, 0, 1)";
export const STROKE_COLOR = "rgba(0, 0, 0, 1)";
export const STROKE_WIDTH = 2;
export const STROKE_DASH_ARRAY = [];
export const FONT_SIZE = 32;
export const FONT_FAMILY = "Arial";
export const FONT_WEIGHT = 400;

export const CIRCLE_OPTIONS = {
	radius: 150,
	left: 100,
	top: 100,
	fill: FILL_COLOR,
	stroke: STROKE_COLOR,
};

export const RECTANGLE_OPTIONS = {
	left: 100,
	top: 100,
	fill: FILL_COLOR,
	stroke: STROKE_COLOR,
	strokeWidth: STROKE_WIDTH,
	width: 400,
	height: 400,
	angle: 0,
};

export const TRIANGLE_OPTIONS = {
	left: 100,
	top: 100,
	fill: FILL_COLOR,
	stroke: STROKE_COLOR,
	strokeWidth: STROKE_WIDTH,
	width: 400,
	height: 400,
	angle: 0,
};

export const DIAMOND_OPTIONS = {
	left: 100,
	top: 100,
	fill: FILL_COLOR,
	stroke: STROKE_COLOR,
	strokeWidth: STROKE_WIDTH,
	width: 400,
	height: 400,
	angle: 0,
};

export const TEXT_OPTIONS = {
	type: "textbox",
	left: 100,
	top: 100,
	fill: FILL_COLOR,
	fontSize: FONT_SIZE,
	fontFamily: FONT_FAMILY,
};

export type EditorHookProps = {
	defaultState?: string;
	defaultWidth?: number;
	defaultHeight?: number;
	clearSelectionCallback?: () => void;
	saveCallback: (values: {
		json: string;
		height: number;
		width: number;
	}) => void;
};

export type BuildEditorProps = {
	save: (skip?: boolean) => void;
	undo: () => void;
	redo: () => void;
	copy: () => void;
	paste: () => void;
	canUndo: () => boolean;
	canRedo: () => boolean;
	autoZoom: () => void;
	setFillColor: (value: string) => void;
	setFontFamily: (value: string) => void;
	setStrokeColor: (value: string) => void;
	setStrokeWidth: (value: number) => void;
	setStrokeDashArray: (value: number[]) => void;
	fillColor: string;
	fontFamily: string;
	strokeColor: string;
	strokeWidth: number;
	canvas: fabric.Canvas;
	strokeDashArray: number[];
	selectedObjects: fabric.Object[];
};

export interface Editor {
	changeSize: (value: { width: number; height: number }) => void;
	changeOpacity: (value: number) => void;
	changeFontSize: (value: number) => void;
	changeTextAlign: (value: string) => void;
	changeFillColor: (value: string) => void;
	changeFontStyle: (value: string) => void;
	changeFontWeight: (value: number) => void;
	changeBackground: (value: string) => void;
	changeFontFamily: (value: string) => void;
	changeImageFilter: (value: string) => void;
	changeStrokeWidth: (value: number) => void;
	changeStrokeColor: (value: string) => void;
	changeFontUnderline: (value: boolean) => void;
	changeFontLinethrough: (value: boolean) => void;
	changeStrokeDashArray: (value: number[]) => void;

	addText: (value: string, options?: ITextboxOptions) => void;
	addImage: (value: string) => void;
	addCircle: () => void;
	addDiamond: () => void;
	addTriangle: () => void;
	addRectangle: () => void;
	addSoftRectangle: () => void;
	addInverseTriangle: () => void;

	getWorkSpace: () => fabric.Object | undefined;
	getActiveOpacity: () => number;
	getActiveFontSize: () => number;
	getActiveTextAlign: () => string;
	getActiveFillColor: () => string;
	getActiveFontStyle: () => string;
	getActiveFontFamily: () => string;
	getActiveFontWeight: () => number;
	getActiveStrokeColor: () => string;
	getActiveStrokeWidth: () => number;
	getActiveFontUnderline: () => boolean;
	getActiveFontLinethrough: () => boolean;
	getActiveStrokeDashArray: () => number[];

	onUndo: () => void;
	onRedo: () => void;
	onCopy: () => void;
	delete: () => void;
	zoomIn: () => void;
	zoomOut: () => void;
	canUndo: () => boolean;
	canRedo: () => boolean;
	onPaste: () => void;
	savePng: (projectId: string) => void;
	saveJpg: (projectId: string) => void;
	saveSvg: (projectId: string) => void;
	saveJson: (projectId: string) => void;
	loadJson: (json: string) => void;
	autoZoom: () => void;
	bringForward: () => void;
	sendBackwards: () => void;
	enableDrawingMode: () => void;
	disableDrawingMode: () => void;

	selectedObjects: fabric.Object[];
	canvas: fabric.Canvas;
}
