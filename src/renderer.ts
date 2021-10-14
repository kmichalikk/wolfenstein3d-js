const texture = require('./gfx/texture.png');
import { Vec2, Directions, Tile, TileType, WallData, CollectibleData } from './utils';

interface CollisionInfo {
	collides: Boolean,
	endTile: Vec2,
	sideXCoord: number,
	distance: number,
	renderDistance: number,
	hitDirection: Directions
}

interface Collectible {
	type: number,
	pos: Vec2
}

class Renderer {
	private canvas: HTMLCanvasElement;
	private dom: HTMLDivElement;
	private debugInfo: HTMLDivElement;
	private drawContext: CanvasRenderingContext2D;
	private texture: HTMLImageElement;
	private levelData: ({ width: number, height: number, data: Tile[][] } | null);
	private collectibleData: Collectible[];
	private cameraPosition: Vec2;
	private cameraDirectionNormalized: Vec2;
	private screenPlane: Vec2;
	private screenDimesions: Vec2;
	private playerMovement: { forward: number, rotate: number }
	private playerLinearVelocity: number;
	private playerAngularVelocity: number;
	// kontrolki - do komunikacji z pętlą renderingu
	private renderStop: Boolean = false;

	constructor(screenDimensions: Vec2, texture: HTMLImageElement) {
		this.screenDimesions = screenDimensions;
		this.canvas = document.createElement('canvas');
		this.canvas.width = this.screenDimesions.x;
		this.canvas.height = this.screenDimesions.y;
		this.canvas.style.width = "70%";
		this.canvas.style.height = "auto";
		this.drawContext = this.canvas.getContext('2d')!;
		this.drawContext.imageSmoothingEnabled = false;
		this.texture = texture;
		this.dom = document.createElement('div');
		this.debugInfo = document.createElement('div');
		this.dom.append(this.debugInfo, this.canvas);
		this.levelData = null;
		this.collectibleData = [];
		this.cameraPosition = new Vec2(8, 8);
		this.cameraDirectionNormalized = new Vec2(0, -1);
		// field of view - im |y| większy, tym większe FOV
		this.screenPlane = new Vec2((screenDimensions.y / screenDimensions.x), 0);
		this.playerMovement = {
			forward: 0,
			rotate: 0
		}
		this.playerLinearVelocity = 0.05;
		this.playerAngularVelocity = Math.PI / 2;
		window.addEventListener('keydown', this.handleKeyboardDown);
		window.addEventListener('keyup', this.handleKeyboardUp);
	}

	getDOM(): HTMLDivElement { return this.dom; }

	loadLevel = (levelData: { width: number, height: number, data: Tile[][] }) => {
		this.renderStop = true;
		// todo: sprawdzanie poprawności danych
		// todo: zmienny rozmiar planszy
		this.levelData = levelData;
		this.cameraPosition = new Vec2(8, 8);
		// załadowanie sprite-ów
		this.collectibleData = [];
		for (let rowId in this.levelData.data) {
			for (let colId in this.levelData.data[rowId]) {
				if (this.levelData!.data[rowId][colId].type == TileType.Collectible) {
					this.collectibleData.push({
						type: this.levelData!.data[rowId][colId].detail,
						pos: new Vec2(parseInt(rowId) + 0.5, parseInt(colId) + 0.5)
					});
				}
			}
		}
	}

	startGameLoop = () => {
		this.renderStop = false;
		requestAnimationFrame(this.gameLoop);
	}

	raycast = (ray: Vec2, fishEyeCorr: number = 1): CollisionInfo => {
		let currentTile: Vec2 = this.cameraPosition.floor();
		// długość jaką przejdzie promień w x-ach przy y = 1
		let deltaDistanceX: number = Math.sqrt(1 + (ray.y / ray.x) ** 2);
		// długość jaką przejdzie promień w y-ach przy x = 1
		let deltaDistanceY: number = Math.sqrt(1 + (ray.x / ray.y) ** 2);

		// sumy długości kroków wykonanych po x i po y
		// czyli deltaDistance * ilość pól w x / y
		let deltaSumX: number;
		let deltaSumY: number;

		// krok = 1 polu ( +/- w zależności od kierunku wektora)
		let step: Vec2 = new Vec2();

		// określenie kroku i dojście do najbliższej wartości całkowitej w x i y
		if (ray.x < 0) {
			step.x = -1;
			// cameraPosition nie zawsze (najczęściej nie) na pozycjach całkowitych, dlatego odejmujemy
			// np. |<--->o    |
			deltaSumX = (this.cameraPosition.x - currentTile.x) * deltaDistanceX;
		}
		else {
			step.x = 1;
			// podchodzimy od "prawej" strony dlatego  odejmujemy ale + 1
			//               +1
			// np. |    o<--->|
			deltaSumX = (currentTile.x + 1 - this.cameraPosition.x) * deltaDistanceX;
		}

		if (ray.y < 0) {
			step.y = -1;
			deltaSumY = (this.cameraPosition.y - currentTile.y) * deltaDistanceY;
		}
		else {
			step.y = 1;
			deltaSumY = (currentTile.y + 1 - this.cameraPosition.y) * deltaDistanceY;
		}

		let isHit: Boolean = false;
		let isTooLong: Boolean = false;
		let hitDirection: Directions;

		let doorCollisionDistance: number = Infinity;
		// algorytm DDA
		while (!isHit && !isTooLong) {
			if (
				currentTile.x < 0
				|| currentTile.x >= this.levelData!.width
				|| currentTile.y < 0
				|| currentTile.y >= this.levelData!.height) {
				// nie liczymy dalej, jeśli promień wykracza za planszę
				// inaczej mielibyśmy nieskończoną pętlę
				isTooLong = true;
				// jeśli już jesteśmy na ostatnim nie osłoniętym polu, algorytm idzie dalej w świat
				// promień wskazywałby na miejsce oddalone od planszy o cały wymiar tej planszy
				// ustawiamy znalezione pole na pole, na którym jesteśmy
				currentTile = this.cameraPosition.floor();
			}
			else if (this.levelData!.data[currentTile.x][currentTile.y].type == TileType.Wall) {
				isHit = true;
			}
			else if (this.levelData!.data[currentTile.x][currentTile.y].type == TileType.Door) {
				// let openness = this.levelData!.data[currentTile.x][currentTile.y].detail;
				let openness = 0.5; // 0 do 1 1=otwarte
				if (hitDirection! == Directions.East || hitDirection! == Directions.West) {
					doorCollisionDistance = (deltaSumX - deltaDistanceX) * fishEyeCorr;
					let doorCoord = this.cameraPosition.y + ray.y * ((deltaSumX - deltaDistanceX / 2) * fishEyeCorr);
					doorCoord -= Math.floor(doorCoord);
					if (hitDirection == Directions.West) doorCoord = 1 - doorCoord;
					if (deltaSumX - deltaDistanceX / 2 < deltaSumY && doorCoord > openness) {
						deltaSumX += deltaDistanceX / 2;
						hitDirection = step.x > 0 ? Directions.East : Directions.West;
						isHit = true;
					}
					else if (deltaSumY < deltaSumX) {
						deltaSumY += deltaDistanceY;
						hitDirection = step.y > 0 ? Directions.South : Directions.North;
						isHit = true;
					}
				}
				else {
					doorCollisionDistance = (deltaSumY - deltaDistanceY) * fishEyeCorr;
					let doorCoord = this.cameraPosition.x + ray.x * ((deltaSumY - deltaDistanceY / 2) * fishEyeCorr);
					doorCoord -= Math.floor(doorCoord);
					if (hitDirection! == Directions.South) doorCoord = 1 - doorCoord;
					if (deltaSumY - deltaDistanceY / 2 < deltaSumX && doorCoord > openness) {
						deltaSumY += deltaDistanceY / 2;
						hitDirection = step.y > 0 ? Directions.South : Directions.North;
						isHit = true;
					}
					else if (deltaSumX < deltaSumY) {
						deltaSumX += deltaDistanceX;
						hitDirection = step.x > 0 ? Directions.East : Directions.West;
						isHit = true;
					}
				}
			}
			// jeśli odległość po y jest większa niż po x,
			// to aktualnie poruszamy się po x => dotykamy ścian horyzontalnie
			if (!isHit && !isTooLong) {
				if (deltaSumX < deltaSumY) {
					deltaSumX += deltaDistanceX;
					currentTile.x += step.x;
					hitDirection = step.x > 0 ? Directions.East : Directions.West;
				}
				// odwrotnie jak wyżej
				else {
					deltaSumY += deltaDistanceY;
					currentTile.y += step.y;
					hitDirection = step.y > 0 ? Directions.South : Directions.North;
				}
			}
		}

		let renderDistance;
		let sideXCoord;
		switch (hitDirection!) {
			case Directions.North:
				renderDistance = (deltaSumY - deltaDistanceY) * fishEyeCorr;
				sideXCoord = this.cameraPosition.x + ray.x * renderDistance;
				sideXCoord -= Math.floor(sideXCoord);
				break;
			case Directions.South:
				renderDistance = (deltaSumY - deltaDistanceY) * fishEyeCorr;
				sideXCoord = this.cameraPosition.x + ray.x * renderDistance;
				sideXCoord -= Math.floor(sideXCoord);
				sideXCoord = 1 - sideXCoord;
				break;
			case Directions.West:
				renderDistance = (deltaSumX - deltaDistanceX) * fishEyeCorr;
				sideXCoord = this.cameraPosition.y + ray.y * renderDistance;
				sideXCoord -= Math.floor(sideXCoord);
				sideXCoord = 1 - sideXCoord;
				break;
			case Directions.East:
				renderDistance = (deltaSumX - deltaDistanceX) * fishEyeCorr;
				sideXCoord = this.cameraPosition.y + ray.y * renderDistance;
				sideXCoord -= Math.floor(sideXCoord);
				break;
		}
		return {
			collides: true,
			endTile: currentTile,
			sideXCoord: sideXCoord,
			distance: doorCollisionDistance != Infinity ? doorCollisionDistance : renderDistance, renderDistance: renderDistance,
			hitDirection: hitDirection
		};
	}

	gameLoop = () => {
		if (this.renderStop) {
			// jeśli requestowano przerwanie renderowania,
			// następne requestAnimationFrame się nie wykona = stop
			this.renderStop = false;
			return;
		}
		else {
			// ########################
			// ### obsługa ruchu gracza
			// ########################
			console.clear();
			this.cameraDirectionNormalized.rotate(this.playerMovement.rotate * 0.01);
			this.screenPlane.rotate(this.playerMovement.rotate * 0.01);
			let collisionInfo = this.raycast(this.playerMovement.forward > 0
				? this.cameraDirectionNormalized : this.cameraDirectionNormalized.multiplyScalar(-1));
			if (this.playerMovement.forward != 0) {
				if (collisionInfo.distance > 0.2) {
					// idziemy do przodu tylko jeśli nie ma kolizji
					this.cameraPosition = this.cameraPosition.addVec(
						this.cameraDirectionNormalized.multiplyScalar(this.playerMovement.forward));
				}
			}
			this.debugInfo.innerText = `(${this.cameraPosition.x.toFixed(2)}, ${this.cameraPosition.y.toFixed(2)}) / (${this.cameraDirectionNormalized.x.toFixed(2)}, ${this.cameraDirectionNormalized.y.toFixed(2)}) / (${this.screenPlane.x.toFixed(2)}, ${this.screenPlane.y.toFixed(2)})`;

			// ################
			// ### renderowanie
			// ################
			this.drawContext.clearRect(0, 0, this.screenDimesions.x, this.screenDimesions.y);
			let wallDistanceByScreenLine: number[] = [];
			// narysowanie ścian
			for (let screenLine = 0; screenLine < this.screenDimesions.x; screenLine++) {
				// promienie nie wychodzą zawsze od pozycji gracza, tylko mapowane są wg FOV
				// lewej stronie ekranu odpowiada promień na lewo od gracza
				// prawej stronie ekranu ten na prawo od gracza
				// przesuwamy się od lewej do prawej
				let screenLineNormalized: number = 2 * screenLine / this.screenDimesions.x - 1;
				let currentRay: Vec2 = this.cameraDirectionNormalized.addVec(
					this.screenPlane.multiplyScalar(screenLineNormalized));
				let collisionInfo = this.raycast(currentRay, this.cameraDirectionNormalized.length() / currentRay.length());
				// zapamiętujemy odległość od ściany do późniejszego rozstrzygania, czy sprite
				// jest przed czy za ścianą
				wallDistanceByScreenLine.push(collisionInfo.distance);
				// nawet jeśli collisionInfo.collides byłoby false, nie ma problemu
				// ponieważ wtedy narysuje to co jest pod graczem, czyli nic
				let tile = this.levelData!.data[collisionInfo.endTile.x][collisionInfo.endTile.y];
				if (tile.type == TileType.Wall) {
					let p = WallData[tile.detail].pos;
					let s = WallData[tile.detail].size;
					let lineHeight = Math.round(this.screenDimesions.y / collisionInfo.renderDistance);
					let lineStartY = (this.screenDimesions.y - lineHeight) / 2;
					this.drawContext.drawImage(this.texture, p.x + collisionInfo.sideXCoord * s.x, 0, 1, 256,
						screenLine, lineStartY, 1, lineHeight);
				}
				else if (tile.type == TileType.Door) {
					let lineHeight = Math.round(this.screenDimesions.y / collisionInfo.renderDistance);
					let lineStartY = (this.screenDimesions.y - lineHeight) / 2;
					this.drawContext.drawImage(this.texture, 768 + collisionInfo.sideXCoord * 256, 0, 1, 256,
						screenLine, lineStartY, 1, lineHeight);
				}
			}
			// narysowanie znajdziek
			// tymczasowa tablica na przechowanie dystansów od gracza
			let collectiblesDistance: { i: number, distance: number }[] = [];
			for (let cb in this.collectibleData) {
				collectiblesDistance.push({
					i: parseInt(cb),
					distance: (this.cameraPosition.x - this.collectibleData[cb].pos.x) ** 2
						+ (this.cameraPosition.y - this.collectibleData[cb].pos.y) ** 2
				});
			}
			// same indeksy, posortowane
			let collectibleIndexes: number[] = collectiblesDistance.sort((a, b) => b.distance - a.distance).map(val => val.i);
			for (let cbi of collectibleIndexes) {
				// pozycja znajdźki względem gracza
				let cbPosRelative: Vec2 = this.collectibleData[cbi].pos.subtractVec(this.cameraPosition);

				let invDet: number = 1 / (this.screenPlane.x * this.cameraDirectionNormalized.y - this.cameraDirectionNormalized.x * this.screenPlane.y);

				let transform: Vec2 = new Vec2(
					invDet * (this.cameraDirectionNormalized.y * cbPosRelative.x - this.cameraDirectionNormalized.x * cbPosRelative.y),
					invDet * (-this.screenPlane.y * cbPosRelative.x + this.screenPlane.x * cbPosRelative.y)
				);

				let spriteScreenX = Math.floor((this.screenDimesions.x / 2) * (1 + transform.x / transform.y));

				let spriteHeight = Math.abs(Math.floor(this.screenDimesions.y / transform.y));
				let drawStartY = Math.floor(-spriteHeight / 2 + this.screenDimesions.y / 2);
				if (drawStartY < 0) drawStartY = 0;
				let drawEndY = Math.floor(spriteHeight / 2 + this.screenDimesions.y / 2);
				if (drawEndY >= this.screenDimesions.y) drawEndY = this.screenDimesions.y - 1;

				let spriteWidth = Math.abs(this.screenDimesions.y / transform.y);
				let drawStartX = Math.floor(spriteScreenX - spriteWidth / 2);
				let drawEndX = Math.floor(spriteScreenX + spriteWidth / 2);
				if (drawEndX >= this.screenDimesions.x) drawEndX = this.screenDimesions.x - 1;

				let s = CollectibleData[this.collectibleData[cbi].type].size;
				let p = CollectibleData[this.collectibleData[cbi].type].pos;
				let texWidthRatio = s.x / spriteWidth;
				for (let line = drawStartX > 0 ? drawStartX : 0; line < drawEndX; line++) {
					let texX = line - drawStartX;
					texX *= texWidthRatio;
					if (transform.y > 0 && line > 0 && line < this.screenDimesions.x && transform.y < wallDistanceByScreenLine[line]) {
						this.drawContext.drawImage(this.texture, p.x + texX, s.y, 1, s.y, line, drawStartY, 1, spriteHeight);
					}
				}
			}
			requestAnimationFrame(this.gameLoop);
		}
	}

	handleKeyboardDown = (event: KeyboardEvent) => {
		switch (event.key) {
			case 'w': this.playerMovement.forward = this.playerLinearVelocity; break;
			case 's': this.playerMovement.forward = -this.playerLinearVelocity; break;
			case 'a': this.playerMovement.rotate = -this.playerAngularVelocity; break;
			case 'd': this.playerMovement.rotate = this.playerAngularVelocity; break;
		}
	}

	handleKeyboardUp = (event: KeyboardEvent) => {
		switch (event.key) {
			case 'w': this.playerMovement.forward = 0; break;
			case 's': this.playerMovement.forward = 0; break;
			case 'a': this.playerMovement.rotate = 0; break;
			case 'd': this.playerMovement.rotate = 0; break;
		}
	}
}

export { Renderer };