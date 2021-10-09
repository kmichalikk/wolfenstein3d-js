import { Vec2, Directions, mapColor } from './utils';

interface CollisionInfo {
	collides: Boolean,
	endTile: Vec2,
	distance: number
}

class Renderer {
	private canvas: HTMLCanvasElement;
	private dom: HTMLDivElement;
	private debugInfo: HTMLDivElement;
	private drawContext: CanvasRenderingContext2D;
	private levelData: ({ width: number, height: number, data: number[][] } | null);
	private cameraPosition: Vec2;
	private cameraDirectionNormalized: Vec2;
	private screenPlane: Vec2;
	private screenDimesions: Vec2;
	private playerMovement: { forward: number, rotate: number }
	private playerLinearVelocity: number;
	private playerAngularVelocity: number;
	// kontrolki - do komunikacji z pętlą renderingu
	private renderStop: Boolean = false;

	constructor(screenDimensions: Vec2) {
		this.screenDimesions = screenDimensions;
		this.canvas = document.createElement('canvas');
		this.canvas.width = this.screenDimesions.x;
		this.canvas.height = this.screenDimesions.y;
		this.canvas.style.width = "70%";
		this.canvas.style.height = "auto";
		this.drawContext = this.canvas.getContext('2d')!;
		this.dom = document.createElement('div');
		this.debugInfo = document.createElement('div');
		this.dom.append(this.debugInfo, this.canvas);
		this.levelData = null;
		this.cameraPosition = new Vec2(8, 8);
		this.cameraDirectionNormalized = new Vec2(-1, 0);
		// field of view - im |y| większy, tym większe FOV
		this.screenPlane = new Vec2(0, -(screenDimensions.y / screenDimensions.x) / 1.5);
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

	loadLevel = (levelData: { width: number, height: number, data: number[][] }) => {
		this.renderStop = true;
		// todo: sprawdzanie poprawności danych
		// todo: zmienny rozmiar planszy
		this.levelData = levelData;
		this.cameraPosition = new Vec2(8, 8);
		this.cameraDirectionNormalized = new Vec2(-1, 0);
	}

	startGameLoop = () => {
		this.renderStop = false;
		requestAnimationFrame(this.gameLoop);
	}

	raycast = (ray: Vec2): CollisionInfo => {
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
		// algorytm DDA
		while (!isHit && !isTooLong) {
			// jeśli odległość po y jest większa niż po x,
			// to aktualnie poruszamy się po x => dotykamy ścian horyzontalnie
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
			if (
				currentTile.x < 0
				|| currentTile.x >= this.levelData!.width
				|| currentTile.y < 0
				|| currentTile.y >= this.levelData!.height) {
				// nie liczymy dalej, jeśli promień wykracza za planszę
				// inaczej mieli byśmy nieskończoną pętlę
				isTooLong = true;
				// jeśli już jesteśmy na ostatnim nie osłoniętym polu, algorytm idzie dalej w świat
				// promień wskazywałby na miejsce oddalone od planszy o cały wymiar tej planszy
				// ustawiamy znalezione pole na pole, na którym jesteśmy
				currentTile = this.cameraPosition.floor();
			}
			else if (this.levelData!.data[currentTile.x][currentTile.y] > 0) {
				isHit = true;
			}
		}

		switch (hitDirection!) {
			case Directions.North:
			case Directions.South: return { collides: true, endTile: currentTile, distance: deltaSumY - deltaDistanceY }; break;
			case Directions.West:
			case Directions.East: return { collides: true, endTile: currentTile, distance: deltaSumX - deltaDistanceX }; break;
		}
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
			let collisionInfo = this.raycast(this.playerMovement.forward > 0
				? this.cameraDirectionNormalized : this.cameraDirectionNormalized.multiplyScalar(-1));
			if (this.playerMovement.forward != 0) {
				if (collisionInfo.distance > 0.2) {
					// idziemy do przodu tylko jeśli nie ma kolizji
					this.cameraPosition = this.cameraPosition.addVec(
						this.cameraDirectionNormalized.multiplyScalar(this.playerMovement.forward));
				}
			}
			this.cameraDirectionNormalized.rotate(this.playerMovement.rotate * 0.01);
			this.screenPlane.rotate(this.playerMovement.rotate * 0.01);
			this.debugInfo.innerText = `(${this.cameraPosition.x.toFixed(2)}, ${this.cameraPosition.y.toFixed(2)}) / ${collisionInfo.distance.toFixed(2)}`;

			// ################
			// ### renderowanie
			// ################
			this.drawContext.clearRect(0, 0, this.screenDimesions.x, this.screenDimesions.y);
			for (let screenLine = 0; screenLine < this.screenDimesions.x; screenLine++) {
				// promienie nie wychodzą zawsze od pozycji gracza, tylko mapowane są wg FOV
				// lewej stronie ekranu odpowiada promień na lewo od gracza
				// prawej stronie ekranu ten na prawo od gracza
				// przesuwamy się od lewej do prawej
				let screenLineNormalized: number = 2 * screenLine / this.screenDimesions.x - 1;
				let currentRay: Vec2 = this.cameraDirectionNormalized.addVec(
					this.screenPlane.multiplyScalar(screenLineNormalized));
				let collisionInfo = this.raycast(currentRay);
				// nawet jeśli collisionInfo.collides byłoby false, nie ma problemu
				// ponieważ wtedy narysuje to co jest pod graczem, czyli nic
				this.drawContext.strokeStyle = mapColor(this.levelData!.data[collisionInfo.endTile.x][collisionInfo.endTile.y]);
				let lineHeight = Math.round(this.screenDimesions.y / collisionInfo.distance * 1.5);
				let lineStartY = (this.screenDimesions.y - lineHeight) / 2;
				this.drawContext.beginPath();
				this.drawContext.moveTo(screenLine, lineStartY);
				this.drawContext.lineTo(screenLine, lineStartY + lineHeight);
				this.drawContext.stroke();
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