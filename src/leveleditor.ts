import { Vec2, WallData, TileType, Tile, CollectibleData } from './utils';

const canvasSidePx = 512;
const canvasSideTiles = 16;
const tileSidePx = canvasSidePx / canvasSideTiles;

let canvas: HTMLCanvasElement = document.createElement("canvas");
canvas.width = canvasSidePx;
canvas.height = canvasSidePx;
let context: CanvasRenderingContext2D = canvas.getContext('2d')!;

let buttonsDiv = document.createElement("div") as HTMLDivElement;
let tileTemplate: Tile = { type: TileType.Empty, detail: 0 };
// buttony do wyboru ściany
let emptyButton = document.createElement("button") as HTMLButtonElement;
emptyButton.innerText = "Wyczyść";
emptyButton.onclick = () => { tileTemplate = { type: TileType.Empty, detail: 0 } };
buttonsDiv.append(emptyButton);
for (let i in WallData) {
	let button = document.createElement("button") as HTMLButtonElement;
	button.innerText = WallData[i].name;
	button.onclick = () => { tileTemplate = { type: TileType.Wall, detail: parseInt(i) } };
	buttonsDiv.append(button);
}
for (let i in CollectibleData) {
	let button = document.createElement("button") as HTMLButtonElement;
	button.innerText = CollectibleData[i].name;
	button.onclick = () => { tileTemplate = { type: TileType.Collectible, detail: parseInt(i) } };
	buttonsDiv.append(button);
}

let exportButton: HTMLButtonElement = document.createElement("button");
exportButton.innerText = "Eksportuj";
exportButton.addEventListener("click", () => {
	let blob: Blob = new Blob([JSON.stringify({
		data: tiles,
		width: 16,
		height: 16
	})], { type: "application/json" });
	let a: HTMLAnchorElement = document.createElement("a");
	let url: string = URL.createObjectURL(blob);
	a.download = "level.json";
	a.href = url;
	a.click();
});

document.body.append(buttonsDiv, document.createElement("br"), canvas, document.createElement("br"), exportButton);

let canvasSizeRatio: Vec2 = new Vec2(canvas.offsetWidth / canvasSidePx, canvas.offsetHeight / canvasSidePx);
window.addEventListener("resize", () => {
	canvasSizeRatio.x = canvas.offsetWidth / canvas.width;
	canvasSizeRatio.y = canvas.offsetHeight / canvas.height;
})

let tiles: Tile[][] = [];
for (let i = 0; i < canvasSideTiles; i++) {
	tiles.push([]);
	for (let j = 0; j < canvasSideTiles; j++) {
		tiles[i].push({ type: TileType.Empty, detail: 0 });
	}
}

let canvasMoveHandler = (event: MouseEvent) => {
	let cursorPos: Vec2 = new Vec2(event.pageX - canvas.offsetLeft, event.pageY - canvas.offsetTop);
	let adjustedCursorPos: Vec2 = cursorPos.divideVec(canvasSizeRatio);
	let tilePos: Vec2 = adjustedCursorPos.divideScalar(tileSidePx).floor();
	tiles[tilePos.x][tilePos.y] = tileTemplate;
}
canvas.addEventListener('mousedown', () => canvas.addEventListener('mousemove', canvasMoveHandler));
canvas.addEventListener('mouseup', () => canvas.removeEventListener('mousemove', canvasMoveHandler));

let drawLoop = () => {
	context.clearRect(0, 0, canvasSidePx, canvasSidePx);
	for (let i in tiles) {
		for (let j in tiles[i]) {
			context.fillStyle = tiles[i][j].type == TileType.Empty ? 'lightgray' : WallData[tiles[i][j].detail].color;
			context.fillRect(parseInt(i) * tileSidePx, parseInt(j) * tileSidePx, tileSidePx, tileSidePx);
		}
	}
	requestAnimationFrame(drawLoop);
}

requestAnimationFrame(drawLoop);
