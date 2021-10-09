import { Vec2, TileColor, mapColor, Tile } from './utils';

const canvasSidePx = 512;
const canvasSideTiles = 16;
const tileSidePx = canvasSidePx / canvasSideTiles;

let canvas: HTMLCanvasElement = document.createElement("canvas");
canvas.width = canvasSidePx;
canvas.height = canvasSidePx;
let context: CanvasRenderingContext2D = canvas.getContext('2d')!;

let color: TileColor = TileColor.none;
let colorSelect: HTMLSelectElement = document.createElement("select");
for (let color = 0; color < 5; color++) {
	let opt = document.createElement("option") as HTMLOptionElement;
	opt.value = color.toString();
	opt.innerText = mapColor(color);
	colorSelect.append(opt);
}
colorSelect.addEventListener('change', (event) => {
	color = parseInt(colorSelect.value) as TileColor;
})

let exportButton: HTMLButtonElement = document.createElement("button");
exportButton.innerText = "Eksportuj";
exportButton.addEventListener("click", () => {
	let blob: Blob = new Blob([JSON.stringify({
		data: tiles.map(val => val.map(val => val.color)),
		width: 16,
		height: 16
	})], { type: "application/json" });
	let a: HTMLAnchorElement = document.createElement("a");
	let url: string = URL.createObjectURL(blob);
	a.download = "level.json";
	a.href = url;
	a.click();
});

document.body.append(colorSelect, canvas, exportButton);

let canvasSizeRatio: Vec2 = new Vec2(canvas.offsetWidth / canvasSidePx, canvas.offsetHeight / canvasSidePx);
window.addEventListener("resize", () => {
	canvasSizeRatio.x = canvas.offsetWidth / canvas.width;
	canvasSizeRatio.y = canvas.offsetHeight / canvas.height;
})

let tiles: Tile[][] = [];
for (let i = 0; i < canvasSideTiles; i++) {
	tiles.push([]);
	for (let j = 0; j < canvasSideTiles; j++) {
		tiles[i].push({ color: TileColor.none, pos: new Vec2(i * tileSidePx, j * tileSidePx) });
	}
}

let canvasMoveHandler = (event: MouseEvent) => {
	let cursorPos: Vec2 = new Vec2(event.pageX - canvas.offsetLeft, event.pageY - canvas.offsetTop);
	let adjustedCursorPos: Vec2 = cursorPos.divideVec(canvasSizeRatio);
	let tilePos: Vec2 = adjustedCursorPos.divideScalar(tileSidePx).floor();
	console.log(tilePos)
	tiles[tilePos.x][tilePos.y].color = color;
}
canvas.addEventListener('mousedown', () => canvas.addEventListener('mousemove', canvasMoveHandler));
canvas.addEventListener('mouseup', () => canvas.removeEventListener('mousemove', canvasMoveHandler));

let drawLoop = () => {
	context.clearRect(0, 0, canvasSidePx, canvasSidePx);
	for (let row of tiles) {
		for (let tile of row) {
			context.fillStyle = mapColor(tile.color);
			context.fillRect(tile.pos.x, tile.pos.y, tileSidePx, tileSidePx);
		}
	}
	requestAnimationFrame(drawLoop);
}

document.body.append(colorSelect, document.createElement("br"), canvas, document.createElement("br"), exportButton);
requestAnimationFrame(drawLoop);
