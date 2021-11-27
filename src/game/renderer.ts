import { BaseEnemy, CollectibleTypes, CollisionInfo, Directions, EnemyType, LevelElem, LevelElemType, Vec2, Vec2Interface, WallTypes } from "../utils";
import Dog from "./AI/Dog";
import Soldier from "./AI/Soldier";

//@ts-ignore
import mappings from './gfx/misc_mappings.json';

interface LevelFile {
	data: (LevelElem | null)[][],
	width: number,
	height: number
}

export default class Renderer {
	canvas: HTMLCanvasElement; //obszar renderowania gry
	canvasSize: Vec2Interface;
	context: CanvasRenderingContext2D;
	// assety itp
	texture: HTMLImageElement;
	levelData: LevelFile; // poziom można wczytać, nie jest zapisany na twardo
	// sprite'y
	collectibles: LevelElem[] = [];
	// drzwi
	doors: LevelElem[] = [];
	// sekrety
	secrets: LevelElem[] = [];
	// przeciwnicy
	enemies: BaseEnemy[] = [];
	// kamera
	playerPos: Vec2; // pozycja gracza
	playerDirNormalized: Vec2; // znormalizowany kierunek gracza
	fovVector: Vec2; // wektor symbolizujący pole widzenia kamery
	// ruch gracza
	playerMovement = {
		forward: 0,
		rotate: 0
	}
	playerLinearVelocity = 0.05
	playerAngularVelocity = 0.02

	logger: HTMLDivElement

	constructor(canvasSize: Vec2, texture: HTMLImageElement) {
		//html
		this.canvas = document.createElement("canvas");
		this.canvas.classList.add("game-canvas");
		this.canvas.width = canvasSize.x;
		this.canvas.height = canvasSize.y;
		this.canvasSize = canvasSize;
		this.context = this.canvas.getContext("2d")!;
		this.context.imageSmoothingEnabled = false;
		//assety	
		this.texture = texture;
		this.levelData = { width: 0, height: 0, data: [] };
		//kamera
		this.playerPos = new Vec2();
		this.playerDirNormalized = new Vec2(0, -1);
		// field of view - im |y| większy, tym większe FOV
		// kierunek ma być prostopadły do kierunku gracza powyżej
		this.fovVector = new Vec2((canvasSize.y / canvasSize.x), 0);

		window.addEventListener('keydown', this.handleKeyboardDown);
		window.addEventListener('keyup', this.handleKeyboardUp);

		this.logger = document.createElement("div")
		document.body.append(this.logger);
	}

	loadLevel = (data: LevelFile) => {
		this.levelData = data;
		let foundPlayer = false;
		this.collectibles = [];
		// patrzymy co jest w poziomie, zapełniamy właściwe tablice
		// szukamy gracza
		for (let col of this.levelData.data) {
			for (let d of col) {
				if (d && d.type == LevelElemType.Player) {
					this.playerPos = new Vec2(d.position.x, d.position.y);
					foundPlayer = true;
				}
				if (d && d.type == LevelElemType.Collectible) {
					this.collectibles.push(d);
				}
				if (d && d.type == LevelElemType.Door) {
					d.openness = 0;
					d.perpOffset = 0.5;
					this.doors.push(d);
				}
				else if (d && d.type == LevelElemType.Secret) {
					d.perpOffset = 0;
					this.secrets.push(d);
				}
				else if (d && d.type == LevelElemType.Enemy) {
					if (d.config.enemyType == EnemyType.Soldier)
						this.enemies.push(new Soldier(new Vec2(d.position.x, d.position.y), new Vec2(0, -1)));
					else if (d.config.enemyType == EnemyType.Dog)
						this.enemies.push(new Dog(new Vec2(d.position.x, d.position.y), new Vec2(0, -1)));
				}
			}
		}
		if (!foundPlayer) {
			console.error("Nie określono pola gracza");
		}
		else {
			// todo - restart gry
		}
	}

	simpeRaycast = (startPos: Vec2, ray: Vec2): CollisionInfo => {
		let currentTile: Vec2 = startPos.floor();
		// ray to wektor jednostkowy - zawsze o długości 1
		// czyli x i y ray'a wyrażają proporcję ruchu OX / OY
		// długość jaką przejdzie promień w x-ach przy x = 1
		let unitDistanceX: number = Math.sqrt(1 + (ray.y / ray.x) ** 2);
		// długość jaką przejdzie promień w y-ach przy y = 1
		let unitDistanceY: number = Math.sqrt(1 + (ray.x / ray.y) ** 2);

		let unitSumX: number = 0;
		let unitSumY: number = 0;

		let stepX: number;
		let stepY: number;

		// startujemy z dowolnej pozycji, niekoniecznie na granicy komórek
		// dlatego na początku "dobijamy" do najbliższej całkowitej wartości
		// i obliczamy długość promienia do nabliższej granicy x/y
		if (ray.x < 0) {
			stepX = -1;
			unitSumX = (startPos.x - currentTile.x) * unitDistanceX;
		}
		else {
			stepX = 1;
			unitSumX = (currentTile.x + 1 - startPos.x) * unitDistanceX;
		}
		if (ray.y < 0) {
			stepY = -1;
			unitSumY = (startPos.y - currentTile.y) * unitDistanceY;
		}
		else {
			stepY = 1;
			unitSumY = (currentTile.y + 1 - startPos.y) * unitDistanceY;
		}

		// DDA
		let isHit = false;
		let hitFaceDirection: Directions = Directions.North;
		let isOutOfBounds = false;
		let softCollisions: CollisionInfo[] = [];
		while (!isHit && !isOutOfBounds) {
			if (
				currentTile.x < 0
				|| currentTile.x >= this.levelData.width
				|| currentTile.y < 0
				|| currentTile.y >= this.levelData.height) {
				isOutOfBounds = true;
			}
			else if (this.levelData.data[currentTile.x][currentTile.y] !== null) {
				// trafiliśmy na coś
				let obj = this.levelData.data[currentTile.x][currentTile.y]!;
				if (obj.type === LevelElemType.Wall) {
					isHit = true;
					continue;
				}
				else if ((obj.type === LevelElemType.Door && obj.openness != 1) || (obj.type === LevelElemType.Secret)) {
					let currDistance =
						(hitFaceDirection == Directions.East || hitFaceDirection == Directions.West)
							? unitSumX - unitDistanceX
							: unitSumY - unitDistanceY;
					// korekcja "rybiego oka"
					currDistance *= this.playerDirNormalized.length() / ray.length();
					// punkt kolizji
					let collisionPos =
						(hitFaceDirection == Directions.East || hitFaceDirection == Directions.West)
							? new Vec2(currentTile.x, currDistance * ray.y + startPos.y)
							: new Vec2(currDistance * ray.x + startPos.x, currentTile.y);
					// offset tekstury
					let texOffset =
						(hitFaceDirection == Directions.East || hitFaceDirection == Directions.West)
							? currDistance * ray.y + startPos.y
							: currDistance * ray.x + startPos.x;
					texOffset -= Math.floor(texOffset);

					softCollisions.push({
						distance: currDistance,
						collidedWith: this.levelData.data[currentTile.x][currentTile.y]!,
						collisionPos: collisionPos,
						texOffset: texOffset,
						facingDirection: hitFaceDirection,
						softCollisions: softCollisions
					})
				}
			}
			// pole jest puste
			// wydłużamy o jedną jednostkę długość względem osi, która aktualnie jest krótsza
			if (unitSumX < unitSumY) {
				unitSumX += unitDistanceX;
				currentTile.x += stepX;
				hitFaceDirection = stepX > 0 ? Directions.West : Directions.East;
			}
			else {
				unitSumY += unitDistanceY;
				currentTile.y += stepY;
				hitFaceDirection = stepY > 0 ? Directions.North : Directions.South;
			}
		}

		let finalDistance =
			(hitFaceDirection == Directions.East || hitFaceDirection == Directions.West)
				? unitSumX - unitDistanceX
				: unitSumY - unitDistanceY;
		// korekcja "rybiego oka"
		finalDistance *= this.playerDirNormalized.length() / ray.length();
		// punkt kolizji
		let collisionPos =
			(hitFaceDirection == Directions.East || hitFaceDirection == Directions.West)
				? new Vec2(currentTile.x, finalDistance * ray.y + startPos.y)
				: new Vec2(finalDistance * ray.x + startPos.x, currentTile.y);
		// offset tekstury
		let texOffset =
			(hitFaceDirection == Directions.East || hitFaceDirection == Directions.West)
				? finalDistance * ray.y + startPos.y
				: finalDistance * ray.x + startPos.x;
		texOffset -= Math.floor(texOffset);
		if (hitFaceDirection == Directions.North || hitFaceDirection == Directions.East)
			texOffset = 1 - texOffset;
		if (isHit) {
			return {
				distance: finalDistance,
				collidedWith: this.levelData.data[currentTile.x][currentTile.y]!,
				collisionPos: collisionPos,
				texOffset: texOffset,
				facingDirection: hitFaceDirection,
				softCollisions: softCollisions
			}
		}
		else {
			return {
				distance: finalDistance,
				collidedWith: null,
				collisionPos: collisionPos,
				texOffset: texOffset,
				facingDirection: hitFaceDirection,
				softCollisions: softCollisions
			}
		}
	}

	_fixTexOffset = (ray: Vec2, coll: CollisionInfo, perpendicularFaceOffset: number = 0.5) => {
		// poprawienie offsetu tekstury żeby uwzględnić boki sąsiednich ścian
		// rysowanych w miejscu gdzie normalnie byłaby zwykła ściana
		if (coll.facingDirection == Directions.North || coll.facingDirection == Directions.South) {
			coll.texOffset += perpendicularFaceOffset / Math.abs(ray.y) * ray.x;
		}
		else {
			coll.texOffset += perpendicularFaceOffset / Math.abs(ray.x) * ray.y;
		}
		if (coll.facingDirection == Directions.North || coll.facingDirection == Directions.East) {
			coll.texOffset = 1 - coll.texOffset;
		}
	}

	extendedRaycast = (startPos: Vec2, ray: Vec2): CollisionInfo => {
		let take1 = this.simpeRaycast(startPos, ray);
		// softCollision = drzwi / sekrety itp
		for (let softCollision of take1.softCollisions) {
			if (softCollision.facingDirection == Directions.North || softCollision.facingDirection == Directions.South) {
				if (ray.y > 0) {
					// if (take1.collisionPos.y - softCollision.collisionPos.y < softCollision.collidedWith!.perpOffset!) {
					if (Math.floor(Math.abs(softCollision.collisionPos.x)) != Math.floor(softCollision.collidedWith?.perpOffset! / ray.y * ray.x + softCollision.collisionPos.x)) {
						return take1;
					}
					else {
						let collision = softCollision;
						collision.collisionPos.y += softCollision.collidedWith!.perpOffset!;
						collision.distance += softCollision.collidedWith!.perpOffset! / ray.y;
						this._fixTexOffset(ray, collision, softCollision.collidedWith!.perpOffset!);
						if (collision.collidedWith!.type == LevelElemType.Door && collision.texOffset > collision.collidedWith!.openness!) {
							collision.texOffset -= collision.collidedWith!.openness!;
							return collision;
						}
						else if (collision.collidedWith!.type == LevelElemType.Secret) {
							return collision;
						}
					}
				}
				else {
					// if (softCollision.collisionPos.y - take1.collisionPos.y < softCollision.collidedWith!.perpOffset! - 1) {
					if (Math.floor(Math.abs(softCollision.collisionPos.x)) != Math.floor(softCollision.collidedWith?.perpOffset! / ray.y * -ray.x + softCollision.collisionPos.x)) {
						return take1;
					}
					else {
						let collision = softCollision;
						collision.collisionPos.y -= softCollision.collidedWith!.perpOffset!;
						collision.distance += softCollision.collidedWith!.perpOffset! / -ray.y;
						this._fixTexOffset(ray, collision, softCollision.collidedWith!.perpOffset!);
						if (collision.collidedWith!.type == LevelElemType.Door && collision.texOffset > collision.collidedWith!.openness!) {
							collision.texOffset -= collision.collidedWith!.openness!;
							return collision;
						}
						else if (collision.collidedWith!.type == LevelElemType.Secret) {
							return collision;
						}
					}
				}
			}
			else if (softCollision.facingDirection == Directions.East || softCollision.facingDirection == Directions.West) {
				if (ray.x > 0) {
					// if (take1.collisionPos.x - softCollision.collisionPos.x < softCollision.collidedWith!.perpOffset!) {
					if (Math.floor(Math.abs(softCollision.collisionPos.y)) != Math.floor(softCollision.collidedWith?.perpOffset! / ray.x * ray.y + softCollision.collisionPos.y)) {
						return take1;
					}
					else {
						let collision = softCollision;
						collision.collisionPos.x += softCollision.collidedWith!.perpOffset!;
						collision.distance += softCollision.collidedWith!.perpOffset! / ray.x;
						this._fixTexOffset(ray, collision, softCollision.collidedWith!.perpOffset!);
						if (collision.collidedWith!.type == LevelElemType.Door && collision.texOffset > collision.collidedWith!.openness!) {
							collision.texOffset -= collision.collidedWith!.openness!;
							return collision;
						}
						else if (collision.collidedWith!.type == LevelElemType.Secret) {
							return collision;
						}
					}
				}
				else {
					// if (softCollision.collisionPos.x - take1.collisionPos.x < softCollision.collidedWith!.perpOffset! - 1) {
					if (Math.floor(Math.abs(softCollision.collisionPos.y)) != Math.floor(softCollision.collidedWith?.perpOffset! / ray.x * -ray.y + softCollision.collisionPos.y)) {
						return take1;
					}
					else {
						let collision = softCollision;
						collision.collisionPos.x -= softCollision.collidedWith!.perpOffset!;
						collision.distance += softCollision.collidedWith!.perpOffset! / -ray.x;
						this._fixTexOffset(ray, collision, softCollision.collidedWith!.perpOffset!);
						if (collision.texOffset > collision.collidedWith!.openness!) {
							collision.texOffset -= collision.collidedWith!.openness!;
							return collision;
						}
						else if (collision.collidedWith!.type == LevelElemType.Secret) {
							return collision;
						}
					}
				}
			}
		}
		return take1;
	}

	movePlayer = () => {
		if (this.playerMovement.forward != 0) {
			// simpleRaycast nie wykrywa kolizji z drzwiami, jeśli są całkiem otwarte
			// wtedy możemy przez nie przejść
			let res = this.simpeRaycast(this.playerPos, this.playerMovement.forward > 0 ? this.playerDirNormalized : this.playerDirNormalized.multiplyScalar(-1));
			// ruch gracza
			// kolizje z drzwiami są w softCollisions
			if (res.softCollisions.length > 0 ? res.softCollisions[0].distance > 0.3 : res.distance > 0.3) {
				// idziemy do przodu tylko jeśli nie ma kolizji
				this.playerPos = this.playerPos.addVec(
					this.playerDirNormalized.multiplyScalar(this.playerMovement.forward));
			}
		}
	}

	autoOpenDoors = () => {
		for (let door of this.doors) {
			if (this.playerPos.subtractVec(door.position as Vec2).length() < 1.5 && door.openness! == 0) {
				let interval = setInterval(() => {
					door.openness! += 0.01;
					if (door.openness! >= 1) {
						clearInterval(interval);
						door.openness = 1;
					}
				}, 20);
			}
			else if (this.playerPos.subtractVec(door.position as Vec2).length() >= 1.5 && door.openness! == 1) {
				let interval = setInterval(() => {
					door.openness! -= 0.01;
					if (door.openness! <= 0) {
						clearInterval(interval);
						door.openness = 0;
					}
				}, 20);
			}
		}
	}

	uncoverSecrets = () => {
		for (let secret of this.secrets) {
			let subtractVec = this.playerPos.subtractVec(secret.position as Vec2);
			if (subtractVec.length() <= 1.5) {
				switch (secret.config.direction) {
					case Directions.East:
						if (subtractVec.x < 0) {
							this.secrets = this.secrets.filter(val => val != secret);
							let step = 0;
							let interval = setInterval(() => {
								secret.perpOffset! += 0.01;
								if (secret.perpOffset! >= 1) {
									if (step == 0) {
										secret.perpOffset = 0;
										step = 1;
										secret.position.x++;
										this.levelData.data[secret.position.x][secret.position.y] = secret;
										this.levelData.data[secret.position.x - 1][secret.position.y] = null;
									}
									else {
										clearInterval(interval);
										this.levelData.data[secret.position.x][secret.position.y] = null;
									}
								}
							}, 20)
						}
						break;
					case Directions.West:
						if (subtractVec.x > 0) {
							this.secrets = this.secrets.filter(val => val != secret);
							let step = 0;
							let interval = setInterval(() => {
								secret.perpOffset! += 0.01;
								if (secret.perpOffset! >= 1) {
									if (step == 0) {
										secret.perpOffset = 0;
										step = 1;
										secret.position.x--;
										this.levelData.data[secret.position.x][secret.position.y] = secret;
										this.levelData.data[secret.position.x + 1][secret.position.y] = null;
									}
									else {
										clearInterval(interval);
										this.levelData.data[secret.position.x][secret.position.y] = null;
									}
								}
							}, 20)
						}
						break;
					case Directions.North:
						if (subtractVec.y > 0) {
							this.secrets = this.secrets.filter(val => val != secret);
							let step = 0;
							let interval = setInterval(() => {
								secret.perpOffset! += 0.01;
								if (secret.perpOffset! >= 1) {
									if (step == 0) {
										secret.perpOffset = 0;
										step = 1;
										secret.position.y--;
										this.levelData.data[secret.position.x][secret.position.y] = secret;
										this.levelData.data[secret.position.x][secret.position.y + 1] = null;
									}
									else {
										clearInterval(interval);
										this.levelData.data[secret.position.x][secret.position.y] = null;
									}
								}
							}, 20)
						}
						break;
					case Directions.South:
						if (subtractVec.y < 0) {
							this.secrets = this.secrets.filter(val => val != secret);
							let step = 0;
							let interval = setInterval(() => {
								secret.perpOffset! += 0.01;
								if (secret.perpOffset! >= 1) {
									if (step == 0) {
										secret.perpOffset = 0;
										step = 1;
										secret.position.y++;
										this.levelData.data[secret.position.x][secret.position.y] = secret;
										this.levelData.data[secret.position.x][secret.position.y - 1] = null;
									}
									else {
										clearInterval(interval);
										this.levelData.data[secret.position.x][secret.position.y] = null;
									}
								}
							}, 20)
						}
						break;
				}
			}
		}
	}

	drawFunc = (delta: number) => {
		this.movePlayer();
		this.autoOpenDoors();
		this.uncoverSecrets();
		for (let enemy of this.enemies)
			enemy.doSomething(this.playerPos, this.playerDirNormalized, this.simpeRaycast);

		this.playerDirNormalized.rotate(this.playerMovement.rotate);
		this.fovVector.rotate(this.playerMovement.rotate);
		this.context.clearRect(0, 0, this.canvasSize.x, this.canvasSize.y);
		let lineHeight: number = 0;
		let lineStart: number = 0;
		let wallDistanceByScreenLine: number[] = [];
		for (let hline = 0; hline < this.canvasSize.x; hline++) {
			let relFromCenter = 2 * hline / this.canvasSize.x - 1;
			let rayForCurrLine = this.playerDirNormalized.addVec(
				this.fovVector.multiplyScalar(relFromCenter)
			);
			let res = this.extendedRaycast(this.playerPos, rayForCurrLine);
			wallDistanceByScreenLine.push(res.distance);
			if (res.collidedWith) {
				let texCoords: Vec2Interface = { x: 0, y: 0 };
				if (res.collidedWith!.type == LevelElemType.Wall) {
					switch (res.collidedWith!.config.wallType) {
						case WallTypes.Wood:
							texCoords = mappings["woodwall"]
							break;
						case WallTypes.Brick:
							texCoords = mappings["brickwall"]
							break;
						case WallTypes.Rock:
							texCoords = mappings["rockwall"]
							break;
					}
				}
				else if (res.collidedWith!.type == LevelElemType.Door) {
					texCoords = mappings["door"];
				}
				else if (res.collidedWith!.type == LevelElemType.Secret) {
					switch (res.collidedWith!.config.wallType) {
						case WallTypes.Wood:
							texCoords = mappings["woodwall"]
							break;
						case WallTypes.Brick:
							texCoords = mappings["brickwall"]
							break;
						case WallTypes.Rock:
							texCoords = mappings["rockwall"]
							break;
					}
				}
				lineHeight = Math.round((this.canvasSize.y / res.distance));
				lineStart = (this.canvasSize.y - lineHeight) / 2;
				this.context.drawImage(this.texture, texCoords.x + res.texOffset * 256, texCoords.y, 1, 256,
					hline, lineStart, 1, lineHeight);
			}
		}
		// narysowanie znajdziek
		let collectiblesDistance: { i: number, distance: number }[] = [];
		for (let cb in this.collectibles) {
			collectiblesDistance.push({
				i: parseInt(cb),
				distance: (this.playerPos.x - this.collectibles[cb].position.x + .5) ** 2
					+ (this.playerPos.y - this.collectibles[cb].position.y + .5) ** 2
			});
		}
		// same indeksy, posortowane
		let collectibleIndexes: number[] = collectiblesDistance.sort((a, b) => b.distance - a.distance).map(val => val.i);
		for (let cbi of collectibleIndexes) {
			// pozycja znajdźki względem gracza
			let cbPosRelative: Vec2 = new Vec2(this.collectibles[cbi].position.x + .5, this.collectibles[cbi].position.y + .5).subtractVec(this.playerPos);

			let invDet: number = 1 / (this.fovVector.x * this.playerDirNormalized.y - this.playerDirNormalized.x * this.fovVector.y);

			let transform: Vec2 = new Vec2(
				invDet * (this.playerDirNormalized.y * cbPosRelative.x - this.playerDirNormalized.x * cbPosRelative.y),
				invDet * (-this.fovVector.y * cbPosRelative.x + this.fovVector.x * cbPosRelative.y)
			);

			let spriteScreenX = Math.floor((this.canvasSize.x / 2) * (1 + transform.x / transform.y));

			let spriteHeight = Math.abs(Math.floor(this.canvasSize.y / transform.y));
			let drawStartY = Math.floor(-spriteHeight / 2 + this.canvasSize.y / 2);
			if (drawStartY < 0) drawStartY = 0;
			let drawEndY = Math.floor(spriteHeight / 2 + this.canvasSize.y / 2);
			if (drawEndY >= this.canvasSize.y) drawEndY = this.canvasSize.y - 1;

			let spriteWidth = Math.abs(this.canvasSize.y / transform.y);
			let drawStartX = Math.floor(spriteScreenX - spriteWidth / 2);
			let drawEndX = Math.floor(spriteScreenX + spriteWidth / 2);
			if (drawEndX >= this.canvasSize.x) drawEndX = this.canvasSize.x - 1;

			let p: Vec2Interface = mappings["collectible"];
			switch (this.collectibles[cbi].config.collectibleType) {
				case CollectibleTypes.Gold:
					p = mappings["collectible"];
					break;
				case CollectibleTypes.Medkit:
					p = mappings["medkit"];
					break;
			}
			let texWidthRatio = 256 / spriteWidth;
			for (let line = drawStartX > 0 ? drawStartX : 0; line < drawEndX; line++) {
				let texX = line - drawStartX;
				texX *= texWidthRatio;
				if (transform.y > 0 && line > 0 && line < this.canvasSize.x && transform.y < wallDistanceByScreenLine[line]) {
					this.context.drawImage(this.texture, p.x + texX, 256, 1, 256, line, drawStartY, 1, spriteHeight);
				}
			}
		}

		// narysowanie przeciwników
		let enemiesDistance: { i: number, distance: number }[] = [];
		for (let cb in this.enemies) {
			enemiesDistance.push({
				i: parseInt(cb),
				distance: (this.playerPos.x - this.enemies[cb].position.x) ** 2
					+ (this.playerPos.y - this.enemies[cb].position.y) ** 2
			});
		}
		// same indeksy, posortowane
		let enemiesIndexes: number[] = enemiesDistance.sort((a, b) => b.distance - a.distance).map(val => val.i);
		for (let cbi of enemiesIndexes) {
			// pozycja znajdźki względem gracza
			let cbPosRelative: Vec2 = new Vec2(this.enemies[cbi].position.x, this.enemies[cbi].position.y).subtractVec(this.playerPos);

			let invDet: number = 1 / (this.fovVector.x * this.playerDirNormalized.y - this.playerDirNormalized.x * this.fovVector.y);

			let transform: Vec2 = new Vec2(
				invDet * (this.playerDirNormalized.y * cbPosRelative.x - this.playerDirNormalized.x * cbPosRelative.y),
				invDet * (-this.fovVector.y * cbPosRelative.x + this.fovVector.x * cbPosRelative.y)
			);

			let spriteScreenX = Math.floor((this.canvasSize.x / 2) * (1 + transform.x / transform.y));

			let spriteHeight = Math.abs(Math.floor(this.canvasSize.y / transform.y));
			let drawStartY = Math.floor(-spriteHeight / 2 + this.canvasSize.y / 2);
			if (drawStartY < 0) drawStartY = 0;
			let drawEndY = Math.floor(spriteHeight / 2 + this.canvasSize.y / 2);
			if (drawEndY >= this.canvasSize.y) drawEndY = this.canvasSize.y - 1;

			let spriteWidth = Math.abs(this.canvasSize.y / transform.y);
			let drawStartX = Math.floor(spriteScreenX - spriteWidth / 2);
			let drawEndX = Math.floor(spriteScreenX + spriteWidth / 2);
			if (drawEndX >= this.canvasSize.x) drawEndX = this.canvasSize.x - 1;
			let p = this.enemies[cbi].texCoords;
			let texWidthRatio = 64 / spriteWidth;
			for (let line = drawStartX > 0 ? drawStartX : 0; line < drawEndX; line++) {
				let texX = line - drawStartX;
				texX *= texWidthRatio;
				if (transform.y > 0 && line > 0 && line < this.canvasSize.x && transform.y < wallDistanceByScreenLine[line]) {
					this.context.drawImage(this.enemies[cbi].texture, p.x + texX, p.y, 1, 64, line, drawStartY, 1, spriteHeight);
				}
			}
		}

		requestAnimationFrame(this.drawFunc);
	}

	startGameLoop = () => {
		requestAnimationFrame(this.drawFunc);
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