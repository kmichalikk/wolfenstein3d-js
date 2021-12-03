//@ts-ignore
import Texture from '../gfx/texture.png';
//@ts-ignore
import Bg from "../gfx/hip-square.png";
//@ts-ignore
import "./style.css";
import { LevelElem, LevelElemType } from "../utils";
import Selectors from './Selector';

document.body.style.backgroundImage = `url(${Bg})`;
document.body.style.backgroundRepeat = "repeat";

let Config = {
	cellSize: 32,
	levelWidth: 20,
	levelHeight: 20,
	origin: {
		x: 0,
		y: 0
	}
}

Config.origin.x = 640 / 2 - Config.levelWidth / 2 * Config.cellSize;
Config.origin.y = 480 / 2 - Config.levelHeight / 2 * Config.cellSize;

// niepuste komórki na planszy
let data: LevelElem[] = [];
let currElem: (LevelElem | null) = null;
let selector: Selectors = new Selectors();
addEventListener('selectorChanged', ((e: CustomEvent) => {
	currElem = e.detail;
}) as EventListener)
document.body.append(selector.DOM)

let container = document.createElement("div");
container.classList.add("le-container");
document.body.append(container as HTMLDivElement);

// ustawienia dodatkowe
let settings = document.createElement("div");
settings.classList.add("le-settings");
container.append(settings);

//canvas
let canvas: HTMLCanvasElement = document.createElement("canvas");
canvas.classList.add("le-canvas");
canvas.width = 640;
canvas.height = 480;
container?.append(canvas);
// będziemy przerysowywać tylko wtedy, kiedy dane się zmienią
let canvasNeedsUpdate = true;

// przesuwanie planszy
let mouseX: number;
let mouseY: number;
let canvasMMBDownHandler = (e: MouseEvent) => {
	if (e.button == 1) {
		mouseX = e.pageX;
		mouseY = e.pageY;
		canvas.addEventListener("mousemove", canvasPanHandler);
	}
}
let canvasMMBUpHandler = (e: MouseEvent) => {
	if (e.button == 1) {
		canvas.removeEventListener("mousemove", canvasPanHandler);
	}
}
let canvasPanHandler = (e: MouseEvent) => {
	let diffX = e.pageX - mouseX;
	let diffY = e.pageY - mouseY;
	Config.origin.x += diffX;
	Config.origin.y += diffY;
	mouseX = e.pageX;
	mouseY = e.pageY;
	canvasNeedsUpdate = true;
}
canvas.addEventListener("mousedown", canvasMMBDownHandler);
canvas.addEventListener("mouseup", canvasMMBUpHandler);

// zoom in/out
canvas.onwheel = (e: WheelEvent) => {
	Config.cellSize -= e.deltaY > 0 ? 2 : -2;
	canvasNeedsUpdate = true;
}

// dodawanie elementów
let startDrawHandler = (e: MouseEvent) => {
	if (e.button == 0) {
		drawHandler(e);
		canvas.addEventListener("mousemove", drawHandler);
	}
}

let endDrawHandler = () => {
	canvas.removeEventListener("mousemove", drawHandler);
}

let drawHandler = (e: MouseEvent) => {
	let actualX = Math.round((e.clientX - canvas.offsetLeft) * 640 / canvas.offsetWidth) - Config.origin.x;
	let actualY = Math.round((e.clientY - canvas.offsetTop) * 480 / canvas.offsetHeight) - Config.origin.y;
	if (actualX >= 0 && actualX < Config.levelWidth * Config.cellSize
		&& actualY >= 0 && actualY < Config.levelHeight * Config.cellSize) {
		let x = Math.floor(actualX / Config.cellSize);
		let y = Math.floor(actualY / Config.cellSize);
		data = data.filter(val => (val.position.x != x || val.position.y != y));
		if (!e.shiftKey) {
			let newElem: LevelElem = JSON.parse(JSON.stringify(currElem));
			if (newElem) {
				newElem.position.x = Math.floor(actualX / Config.cellSize);
				newElem.position.y = Math.floor(actualY / Config.cellSize);
				if (newElem.type == LevelElemType.Player) {
					data = data.filter(val => val.type != LevelElemType.Player);
				}
				data.push(newElem);
			}
		}
		canvasNeedsUpdate = true;
	}
}

canvas.addEventListener("mousedown", startDrawHandler);
canvas.addEventListener("mouseup", endDrawHandler);

// rysowanie
let texture = new Image();
texture.src = Texture;
texture.onload = () => {
	let context = canvas.getContext("2d")!;
	let drawFunc = () => {
		if (canvasNeedsUpdate) {
			canvasNeedsUpdate = false;
			// dane się zmieniły, rysujemy od zera
			context.clearRect(0, 0, 640, 480);
			context.fillStyle = "#ffffff";
			for (let i = 0; i < Config.levelWidth; i++) {
				for (let j = 0; j < Config.levelHeight; j++) {
					context.fillRect(i * Config.cellSize + Config.origin.x, j * Config.cellSize + Config.origin.y, Config.cellSize, Config.cellSize);
					context.strokeRect(i * Config.cellSize + Config.origin.x, j * Config.cellSize + Config.origin.y, Config.cellSize, Config.cellSize);
				}
			}
		}
		for (let d of data) {
			context.drawImage(
				texture,
				d.texCoords[0].x,
				d.texCoords[0].y,
				64,
				64,
				d.position.x * Config.cellSize + Config.origin.x,
				d.position.y * Config.cellSize + Config.origin.y,
				Config.cellSize,
				Config.cellSize
			);
		}
		requestAnimationFrame(drawFunc);
	}
	requestAnimationFrame(drawFunc);
}

// eksportowanie
let exportButton = document.createElement("button");
exportButton.classList.add("le-export-button");
exportButton.innerText = "Eksportuj";
document.body.append(exportButton);

exportButton.onclick = () => {
	let exportedData: (LevelElem | null)[][] = [];
	for (let i = 0; i < Config.levelWidth; i++) {
		exportedData.push([]);
		for (let j = 0; j < Config.levelHeight; j++) {
			let elem = data.find(val => val.position.x == i && val.position.y == j);
			if (elem === undefined) {
				exportedData[i].push(null);
			}
			else {
				exportedData[i].push(elem);
			}
		}
	}
	let blob: Blob = new Blob([JSON.stringify({
		data: exportedData,
		width: Config.levelWidth,
		height: Config.levelHeight
	})], { type: "application/json" });
	let a: HTMLAnchorElement = document.createElement("a");
	let url: string = URL.createObjectURL(blob);
	a.download = "level.json";
	a.href = url;
	a.click();
}