import { Renderer } from './renderer';
import { Vec2 } from './utils';
// @ts-ignore
import img from './gfx/texture.png';

let texture = new Image;
texture.src = img;
texture.onload = () => {
	let renderer = new Renderer(new Vec2(480, 320), texture);
	document.body.append(renderer.getDOM());

	fetch('../../levels/1.json')
		.then(res => res.json())
		.then(data => {
			renderer.loadLevel(data);
			renderer.startGameLoop();
		})

}



// class Raycaster {
// 	level: Object;
// 	cameraPosition: Vec2;
// 	cameraDirection: Vec2;
// 	screenPlane: Vec2;
// 	screenDimensions: Vec2;
// 	constructor(levelData: Object, screenDimensions: Vec2) {
// 		this.screenDimensions = screenDimensions;
// 		this.level = levelData;
// 		this.cameraPosition = new Vec2(8, 8);
// 		this.cameraDirection = new Vec2(-1, 0);
// 		this.screenPlane = new Vec2(0, -0.66);
// 	}

// 	raycastRender() {
// 		drawContext.clearRect(0, 0, canvasSidePx, canvasSidePx);
// 		drawContext.lineWidth = 1;
// 		for (let x = 0; x < canvasSidePx; x++) { // x od zera do <szerokość ekranu/canvasa>
// 			let screenLine: number = 2 * x / canvasSidePx - 1; // linia ekranu, dla której aktualnie wykonujemy raycast
// 			let rayDirection: Vec2 = this.cameraDirection.addVec(this.screenPlane.multiplyScalar(screenLine));
// 			// pozycja pola, na którym jesteśmy
// 			let currTile: Vec2 = new Vec2(Math.floor(this.cameraPosition.x), Math.floor(this.cameraPosition.y));
// 			// droga, jaką promień musi pokonać do następnej ściany (czyli x całk. lub y całk.)
// 			let sideDist: Vec2 = new Vec2(0, 0);
// 			// długość jaką przejdzie promień w x-ach przy y = 1
// 			let deltaDistanceX: number = Math.sqrt(1 + (rayDirection.y / rayDirection.x) ** 2);
// 			// długość jaką przejdzie promień w y-ach przy x = 1
// 			let deltaDistanceY: number = Math.sqrt(1 + (rayDirection.x / rayDirection.y) ** 2);
// 			// kierunek kroku (-1 / 1)
// 			let step: Vec2 = new Vec2(1, 1);
// 			// czy trafiono w ścianę?
// 			let isHit: Boolean = false;
// 			// od której strony trafiono w ścianę - NS = 1 czy EW = 0
// 			let hitOrientation: number;

// 			if (rayDirection.x < 0) {
// 				step.x = -1;
// 				// cameraPosition nie zawsze (najczęściej nie) na pozycjach całkowitych, dlatego odejmujemy
// 				// np. |<--->o    |
// 				sideDist.x = (this.cameraPosition.x - currTile.x) * deltaDistanceX;
// 			}
// 			else {
// 				step.x = 1;
// 				// podchodzimy od "prawej" strony dlatego + 1
// 				//               +1
// 				// np. |    o<--->|
// 				sideDist.x = (currTile.x + 1 - this.cameraPosition.x) * deltaDistanceX;
// 			}
// 			if (rayDirection.y < 0) {
// 				step.y = -1;
// 				sideDist.y = (this.cameraPosition.y - currTile.y) * deltaDistanceY;
// 			}
// 			else {
// 				step.y = 1;
// 				sideDist.y = (currTile.y + 1 - this.cameraPosition.y) * deltaDistanceY;
// 			}
// 			// algorytm DDA
// 			while (!isHit) {
// 				if (sideDist.x < sideDist.y) {
// 					sideDist.x += deltaDistanceX;
// 					currTile.x += step.x;
// 					hitOrientation = 0;
// 				}
// 				else {
// 					sideDist.y += deltaDistanceY;
// 					currTile.y += step.y;
// 					hitOrientation = 1;
// 				}
// 				if (this.level[currTile.x][currTile.y] > 0)
// 					isHit = true;
// 				viewDrawContext.fillStyle = "white";
// 				viewDrawContext.fillRect(currTile.x * tileSizePx, currTile.y * tileSizePx, 10, 10);
// 			}
// 			let distance: number;
// 			if (hitOrientation == 0)
// 				distance = sideDist.x - deltaDistanceX;
// 			else
// 				distance = sideDist.y - deltaDistanceY;
// 			// rysowanie
// 			let lineHeight = Math.round(canvasSidePx / distance);
// 			drawContext.strokeStyle = mapColor(this.level[currTile.x][currTile.y]);
// 			let lineStartY = (canvasSidePx - lineHeight) / 2;
// 			drawContext.beginPath();
// 			drawContext.moveTo(x, lineStartY);
// 			drawContext.lineTo(x, lineStartY + lineHeight);
// 			drawContext.stroke();
// 		}
// 	}
// }

// let movement = {
// 	forward: 0,
// 	backward: 0,
// 	rotate: 0,
// }

// fetch('levels/1.json')
// 	.then(data => data.json())
// 	.then(levelData => {
// 		let raycaster = new Raycaster(levelData);
// 		window.addEventListener("keydown", (event: KeyboardEvent) => {
// 			switch (event.key) {
// 				case 'w': movement.forward = 1; break;
// 				case 's': movement.backward = 1; break;
// 				case 'a': movement.rotate = -1; break;
// 				case 'd': movement.rotate = 1; break;
// 			}
// 		})
// 		window.addEventListener("keyup", (event: KeyboardEvent) => {
// 			switch (event.key) {
// 				case 'w': movement.forward = 0; break;
// 				case 's': movement.backward = 0; break;
// 				case 'a':
// 				case 'd': movement.rotate = 0; break;
// 			}
// 		})
// 		let loop = () => {
// 			for (let row in levelData) {
// 				for (let tile in levelData[row]) {
// 					viewDrawContext.fillStyle = mapColor(levelData[row][tile]);
// 					viewDrawContext.fillRect(parseInt(row) * tileSizePx, parseInt(tile) * tileSizePx, tileSizePx, tileSizePx)
// 				}
// 			}
// 			viewDrawContext.fillRect(raycaster.cameraPosition.x * tileSizePx - 5, raycaster.cameraPosition.y * tileSizePx - 5, 10, 10);
// 			viewDrawContext.strokeStyle = "magenta";
// 			viewDrawContext.lineWidth = 5;
// 			viewDrawContext.beginPath();
// 			viewDrawContext.moveTo(raycaster.cameraPosition.x * tileSizePx, raycaster.cameraPosition.y * tileSizePx);
// 			viewDrawContext.lineTo(raycaster.cameraPosition.x * tileSizePx + raycaster.cameraDirection.x * 100, raycaster.cameraPosition.y * tileSizePx + raycaster.cameraDirection.y * 100);
// 			viewDrawContext.stroke();
// 			raycaster.raycast();
// 			raycaster.cameraDirection.rotate(movement.rotate * 0.01);
// 			raycaster.screenPlane.rotate(movement.rotate * 0.01);
// 			if (movement.forward == 1)
// 				raycaster.cameraPosition = raycaster.cameraPosition.addVec(raycaster.cameraDirection.multiplyScalar(0.01));
// 			requestAnimationFrame(loop);
// 		}
// 		requestAnimationFrame(loop);
// 	})