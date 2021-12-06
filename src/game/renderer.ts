//@ts-ignore
import Texture from '../gfx/texture.png';
//@ts-ignore
import Mappings from '../gfx/env_mappings.json';
import { BaseEnemy, CollectibleTypes, CollisionInfo, Directions, EnemyType, LevelElem, LevelElemType, Vec2, Vec2Interface, WallTypes, Weapons } from "../utils";
import Dog from "./AI/Dog";
import Soldier from "./AI/Soldier";
import HandUI from './HandUI';

interface LevelFile {
	data: (LevelElem | null)[][],
	width: number,
	height: number
}

export default class Renderer {
	canvas: HTMLCanvasElement; //obszar renderowania gry
	fadeoutCanvas: HTMLCanvasElement;
	canvasSize: Vec2Interface;
	context: CanvasRenderingContext2D;
	fadeoutContext: CanvasRenderingContext2D;
	// assety itp
	texture: HTMLImageElement;
	levelData: LevelFile; // poziom można wczytać, nie jest zapisany na twardo
	// sprite'y
	sprites: (LevelElem | BaseEnemy)[] = [];
	// drzwi
	doors: LevelElem[] = [];
	// sekrety
	secrets: LevelElem[] = [];
	// wyjścia
	exits: LevelElem[] = [];
	// przeciwnicy
	enemies: BaseEnemy[] = [];
	// znajdźki
	collectibles: LevelElem[] = [];
	// wynik
	score: number = 0;
	// amunicja
	ammo: number = 8;
	// HP
	HP: number = 100;
	// kamera
	playerPos: Vec2; // pozycja gracza
	playerDirNormalized: Vec2; // znormalizowany kierunek gracza
	fovVector: Vec2; // wektor symbolizujący pole widzenia kamery
	// ruch gracza
	playerMovement = {
		forward: 0,
		rotate: 0,
		interaction: false,
		shooting: false
	}
	playerLinearVelocity = 0.05
	playerAngularVelocity = 0.03

	// strzelanie
	currentWeapon: Weapons = Weapons.Pistol;
	hasRifle: boolean = false;
	hasMachinegun: boolean = false;
	weaponCooldown: number = 0;
	waitForReady: boolean = false;
	waitForTriggerRelease: boolean = false;
	handUI: HandUI;

	logger: HTMLDivElement

	constructor(canvasSize: Vec2) {
		//html
		this.canvas = document.createElement("canvas");
		this.canvas.classList.add("game-canvas");
		this.canvas.width = canvasSize.x;
		this.canvas.height = canvasSize.y;
		this.canvasSize = canvasSize;
		this.context = this.canvas.getContext("2d")!;
		this.context.imageSmoothingEnabled = false;

		// canvas dodatkowy
		this.fadeoutCanvas = document.createElement("canvas");
		this.fadeoutCanvas.classList.add("fadeout-canvas");
		this.fadeoutCanvas.style.position = 'absolute';
		this.fadeoutContext = this.fadeoutCanvas.getContext("2d")!;
		this.fadeoutContext.imageSmoothingEnabled = false;

		//assety	
		this.texture = new Image();
		this.texture.src = Texture;
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

		this.handUI = new HandUI(this.context, this.canvasSize as Vec2);
		this.handUI.setWeapon(Weapons.Pistol);

		// kiedy przeciwnik trafia
		addEventListener("shotPlayer", ((e: CustomEvent) => {
			if (this.HP > 1 && this.HP - e.detail <= 0) {
				this.HP = 1;
			}
			else {
				this.HP -= e.detail;
			}
			dispatchEvent(new CustomEvent("healthChanged", { detail: this.HP }));
		}) as EventListener);
	}

	resizeFadeoutCanvas = () => {
		this.fadeoutCanvas.width = this.canvas.width;
		this.fadeoutCanvas.height = this.canvas.height;
		this.fadeoutCanvas.style.width = this.canvas.clientWidth + "px";
		this.fadeoutCanvas.style.height = this.canvas.clientHeight + "px";
		this.fadeoutCanvas.style.left = this.canvas.offsetLeft + 4 + "px";
		this.fadeoutCanvas.style.top = this.canvas.offsetTop + 4 + "px";
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
				if (d && (d.type == LevelElemType.ObjectCollidable || d.type == LevelElemType.ObjectNonCollidable || d.type == LevelElemType.Collectible)) {
					this.sprites.push(d);
				}
				if (d && d.type == LevelElemType.Collectible) {
					this.collectibles.push(d);
				}
				if (d && d.type == LevelElemType.Door) {
					d.config.openness = 0;
					d.config.perpOffset = 0.5;
					this.doors.push(d);
				}
				else if (d && d.type == LevelElemType.Secret) {
					d.config.perpOffset = 0;
					this.secrets.push(d);
				}
				else if (d && d.type == LevelElemType.Exit) {
					this.exits.push(d);
				}
				else if (d && d.type == LevelElemType.Enemy) {
					if (d.config.enemyType == EnemyType.Soldier) {
						let soldier = new Soldier(new Vec2(d.position.x, d.position.y), new Vec2(0, -1));
						this.sprites.push(soldier);
						this.enemies.push(soldier);
					}
					else if (d.config.enemyType == EnemyType.Dog) {
						let dog = new Dog(new Vec2(d.position.x, d.position.y), new Vec2(0, -1));
						this.sprites.push(dog);
						this.enemies.push(dog);
					}
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

	simpleRaycast = (startPos: Vec2, ray: Vec2): CollisionInfo => {
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
				if (obj.type === LevelElemType.Wall || obj.type === LevelElemType.Exit) {
					isHit = true;
					continue;
				}
				else if ((obj.type === LevelElemType.Door && obj.config.openness != 1) || (obj.type === LevelElemType.Secret)
					|| (obj.type === LevelElemType.ObjectCollidable)) {
					let currDistance =
						(hitFaceDirection == Directions.East || hitFaceDirection == Directions.West)
							? unitSumX - unitDistanceX
							: unitSumY - unitDistanceY;
					// korekcja "rybiego oka"
					currDistance *= this.playerDirNormalized.length() / ray.length();
					// punkt kolizji
					let collisionPos = new Vec2;
					switch (hitFaceDirection) {
						case Directions.East:
							collisionPos = new Vec2(currentTile.x + 0.01, currDistance * ray.y + startPos.y);
							break;
						case Directions.West:
							collisionPos = new Vec2(currentTile.x + 0.99, currDistance * ray.y + startPos.y);
							break;
						case Directions.North:
							collisionPos = new Vec2(currDistance * ray.x + startPos.x, currentTile.y + 0.99);
							break;
						case Directions.South:
							collisionPos = new Vec2(currDistance * ray.x + startPos.x, currentTile.y + 0.01);
							break;
					}
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
		let take1 = this.simpleRaycast(startPos, ray);
		// softCollision = drzwi / sekrety itp
		for (let softCollision of take1.softCollisions) {
			if (softCollision.collidedWith!.type == LevelElemType.Door || softCollision.collidedWith!.type == LevelElemType.Secret) {
				if (softCollision.facingDirection == Directions.North || softCollision.facingDirection == Directions.South) {
					if (ray.y > 0) {
						// if (take1.collisionPos.y - softCollision.collisionPos.y < softCollision.collidedWith!.perpOffset!) {
						if (Math.floor(Math.abs(softCollision.collisionPos.x)) != Math.floor(softCollision.collidedWith?.config.perpOffset! / ray.y * ray.x + softCollision.collisionPos.x)) {
							continue;
						}
						else {
							let collision = softCollision;
							collision.collisionPos.y += softCollision.collidedWith!.config.perpOffset!;
							collision.distance += softCollision.collidedWith!.config.perpOffset! / ray.y;
							this._fixTexOffset(ray, collision, softCollision.collidedWith!.config.perpOffset!);
							if (collision.collidedWith!.type == LevelElemType.Door && collision.texOffset > collision.collidedWith!.config.openness!) {
								collision.texOffset -= collision.collidedWith!.config.openness!;
								return collision;
							}
							else if (collision.collidedWith!.type == LevelElemType.Secret) {
								return collision;
							}
						}
					}
					else {
						// if (softCollision.collisionPos.y - take1.collisionPos.y < softCollision.collidedWith!.perpOffset! - 1) {
						if (Math.floor(Math.abs(softCollision.collisionPos.x)) != Math.floor(softCollision.collidedWith?.config.perpOffset! / ray.y * -ray.x + softCollision.collisionPos.x)) {
							continue;
						}
						else {
							let collision = softCollision;
							collision.collisionPos.y -= softCollision.collidedWith!.config.perpOffset!;
							collision.distance += softCollision.collidedWith!.config.perpOffset! / -ray.y;
							this._fixTexOffset(ray, collision, softCollision.collidedWith!.config.perpOffset!);
							if (collision.collidedWith!.type == LevelElemType.Door && collision.texOffset > collision.collidedWith!.config.openness!) {
								collision.texOffset -= collision.collidedWith!.config.openness!;
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
						if (Math.floor(Math.abs(softCollision.collisionPos.y)) != Math.floor(softCollision.collidedWith?.config.perpOffset! / ray.x * ray.y + softCollision.collisionPos.y)) {
							continue;
						}
						else {
							let collision = softCollision;
							collision.collisionPos.x += softCollision.collidedWith!.config.perpOffset!;
							collision.distance += softCollision.collidedWith!.config.perpOffset! / ray.x;
							this._fixTexOffset(ray, collision, softCollision.collidedWith!.config.perpOffset!);
							if (collision.collidedWith!.type == LevelElemType.Door && collision.texOffset > collision.collidedWith!.config.openness!) {
								collision.texOffset -= collision.collidedWith!.config.openness!;
								return collision;
							}
							else if (collision.collidedWith!.type == LevelElemType.Secret) {
								return collision;
							}
						}
					}
					else {
						// if (softCollision.collisionPos.x - take1.collisionPos.x < softCollision.collidedWith!.perpOffset! - 1) {
						if (Math.floor(Math.abs(softCollision.collisionPos.y)) != Math.floor(softCollision.collidedWith?.config.perpOffset! / ray.x * -ray.y + softCollision.collisionPos.y)) {
							continue;
						}
						else {
							let collision = softCollision;
							collision.collisionPos.x -= softCollision.collidedWith!.config.perpOffset!;
							collision.distance += softCollision.collidedWith!.config.perpOffset! / -ray.x;
							this._fixTexOffset(ray, collision, softCollision.collidedWith!.config.perpOffset!);
							if (collision.texOffset > collision.collidedWith!.config.openness!) {
								collision.texOffset -= collision.collidedWith!.config.openness!;
								return collision;
							}
							else if (collision.collidedWith!.type == LevelElemType.Secret) {
								return collision;
							}
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
			let res = this.simpleRaycast(this.playerPos, this.playerMovement.forward > 0 ? this.playerDirNormalized : this.playerDirNormalized.multiplyScalar(-1));
			// ruch gracza
			// kolizje z drzwiami są w softCollisions
			if (res.softCollisions.length > 0 ? res.softCollisions[0].distance > 0.3 : res.distance > 0.3) {
				// idziemy do przodu tylko jeśli nie ma kolizji
				this.playerPos = this.playerPos.addVec(
					this.playerDirNormalized.multiplyScalar(this.playerMovement.forward));
			}
			else if (this.playerMovement.forward > 0) {
				// "śliskie" kolizje
				switch (res.softCollisions.length > 0 ? res.softCollisions[0].facingDirection : res.facingDirection) {
					case Directions.North:
					case Directions.South:
						if (this.playerDirNormalized.x > 0) {
							let res = this.simpleRaycast(this.playerPos, new Vec2(1, 0));
							if (res.softCollisions.length > 0 ? res.softCollisions[0].distance > 0.3 : res.distance > 0.3) {
								this.playerPos.x += this.playerDirNormalized.x * 0.02;
							}
						}
						else {
							let res = this.simpleRaycast(this.playerPos, new Vec2(-1, 0));
							if (res.softCollisions.length > 0 ? res.softCollisions[0].distance > 0.3 : res.distance > 0.3) {
								this.playerPos.x += this.playerDirNormalized.x * 0.02;
							}
						}
						break;
					case Directions.East:
					case Directions.West:
						if (this.playerDirNormalized.y > 0) {
							let res = this.simpleRaycast(this.playerPos, new Vec2(0, 1));
							if (res.softCollisions.length > 0 ? res.softCollisions[0].distance > 0.3 : res.distance > 0.3) {
								this.playerPos.y += this.playerDirNormalized.y * 0.02;
							}
						}
						else {
							let res = this.simpleRaycast(this.playerPos, new Vec2(0, -1));
							if (res.softCollisions.length > 0 ? res.softCollisions[0].distance > 0.3 : res.distance > 0.3) {
								this.playerPos.y += this.playerDirNormalized.y * 0.02;
							}
						}
						break;
				}
			}
		}
	}

	openDoors = () => {
		for (let door of this.doors) {
			if (this.playerPos.subtractVec(new Vec2(door.position.x + 0.5, door.position.y + 0.5)).length() < 1
				&& door.config.openness! == 0
				&& this.playerMovement.interaction) {
				dispatchEvent(new CustomEvent("playDoorSlideSound"));
				let interval = setInterval(() => {
					door.config.openness! += 0.01;
					if (door.config.openness! >= 1) {
						clearInterval(interval);
						door.config.openness = 1;
					}
				}, 20);
			}
		}
	}

	uncoverSecrets = () => {
		for (let secret of this.secrets) {
			let subtractVec = this.playerPos.subtractVec(new Vec2(secret.position.x + 0.5, secret.position.y + 0.5));
			if (subtractVec.length() <= 1 && this.playerMovement.interaction) {
				switch (secret.config.direction) {
					case Directions.East:
						if (subtractVec.x < 0) {
							this.secrets = this.secrets.filter(val => val != secret);
							let step = 0;
							dispatchEvent(new CustomEvent("playDoorSlideSound"));
							let interval = setInterval(() => {
								secret.config.perpOffset! += 0.01;
								if (secret.config.perpOffset! >= 1) {
									if (step == 0) {
										secret.config.perpOffset = 0;
										step = 1;
										secret.position.x++;
										this.levelData.data[secret.position.x][secret.position.y] = secret;
										this.levelData.data[secret.position.x - 1][secret.position.y] = null;
									}
									else {
										clearInterval(interval);
										this.levelData.data[secret.position.x + 1][secret.position.y] = {
											type: LevelElemType.Wall,
											config: {},
											position: { x: secret.position.x + 1, y: secret.position.y },
											collidable: true,
											texCoords: secret.texCoords
										}
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
							dispatchEvent(new CustomEvent("playDoorSlideSound"));
							let interval = setInterval(() => {
								secret.config.perpOffset! += 0.01;
								if (secret.config.perpOffset! >= 1) {
									if (step == 0) {
										secret.config.perpOffset = 0;
										step = 1;
										secret.position.x--;
										this.levelData.data[secret.position.x][secret.position.y] = secret;
										this.levelData.data[secret.position.x + 1][secret.position.y] = null;
									}
									else {
										clearInterval(interval);
										this.levelData.data[secret.position.x - 1][secret.position.y] = {
											type: LevelElemType.Wall,
											config: {},
											position: { x: secret.position.x - 1, y: secret.position.y },
											collidable: true,
											texCoords: secret.texCoords
										}
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
							dispatchEvent(new CustomEvent("playDoorSlideSound"));
							let interval = setInterval(() => {
								secret.config.perpOffset! += 0.01;
								if (secret.config.perpOffset! >= 1) {
									if (step == 0) {
										secret.config.perpOffset = 0;
										step = 1;
										secret.position.y--;
										this.levelData.data[secret.position.x][secret.position.y] = secret;
										this.levelData.data[secret.position.x][secret.position.y + 1] = null;
									}
									else {
										clearInterval(interval);
										this.levelData.data[secret.position.x][secret.position.y - 1] = {
											type: LevelElemType.Wall,
											config: {},
											position: { x: secret.position.x, y: secret.position.y - 1 },
											collidable: true,
											texCoords: secret.texCoords
										}
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
							dispatchEvent(new CustomEvent("playDoorSlideSound"));
							let interval = setInterval(() => {
								secret.config.perpOffset! += 0.01;
								if (secret.config.perpOffset! >= 1) {
									if (step == 0) {
										secret.config.perpOffset = 0;
										step = 1;
										secret.position.y++;
										this.levelData.data[secret.position.x][secret.position.y] = secret;
										this.levelData.data[secret.position.x][secret.position.y - 1] = null;
									}
									else {
										clearInterval(interval);
										this.levelData.data[secret.position.x][secret.position.y + 1] = {
											type: LevelElemType.Wall,
											config: {},
											position: { x: secret.position.x, y: secret.position.y + 1 },
											collidable: true,
											texCoords: secret.texCoords
										}
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

	handleFinish = () => {
		for (let exit of this.exits) {
			let subtractVec = this.playerPos.subtractVec(new Vec2(exit.position.x + 0.5, exit.position.y + 0.5));
			if (subtractVec.length() <= 1.2 && this.playerMovement.interaction) {
				exit.texCoords = exit.texCoords.map(val => Mappings["exit-on"]);
				setTimeout(() => {
					location.reload();
				}, 500)
				// koniec
			}
		}
	}

	handleCollectibles = () => {
		for (let c of this.collectibles) {
			if (this.playerPos.subtractVec(c.position as Vec2).length() < 0.5) {
				switch (c.config.typeExtended) {
					case CollectibleTypes.Ammo:
						this.ammo += Math.round(Math.random() * 4 + 4);
						dispatchEvent(new CustomEvent("ammoChanged", { detail: this.ammo }));
						dispatchEvent(new CustomEvent("playCollectGunSound"));
						this.collectibles = this.collectibles.filter(val => val != c);
						this.sprites = this.sprites.filter(val => val != c);
						break;
					case CollectibleTypes.Gold:
						this.score += 100;
						dispatchEvent(new CustomEvent("scoreChanged", { detail: this.score }));
						if (Math.random() > 0.5)
							dispatchEvent(new CustomEvent("playMoney1Sound"));
						else
							dispatchEvent(new CustomEvent("playMoney2Sound"));
						this.collectibles = this.collectibles.filter(val => val != c);
						this.sprites = this.sprites.filter(val => val != c);
						break;
					case CollectibleTypes.HealthSm:
						if (this.HP < 100) {
							this.HP += 30;
							if (this.HP > 100) this.HP = 100;
							dispatchEvent(new CustomEvent("healthChanged", { detail: this.HP }));
							dispatchEvent(new CustomEvent("playHealSound"));
							this.collectibles = this.collectibles.filter(val => val != c);
							this.sprites = this.sprites.filter(val => val != c);
						}
						break;
					case CollectibleTypes.HealthLg:
						if (this.HP < 100) {
							this.HP = 100;
							dispatchEvent(new CustomEvent("healthChanged", { detail: this.HP }));
							dispatchEvent(new CustomEvent("playHealSound"));
							this.collectibles = this.collectibles.filter(val => val != c);
							this.sprites = this.sprites.filter(val => val != c);
						}
						break;
					case CollectibleTypes.Rifle:
						dispatchEvent(new CustomEvent("playCollectGunSound"));
						this.hasRifle = true;
						this.collectibles = this.collectibles.filter(val => val.config.typeExtended != CollectibleTypes.Rifle);
						this.sprites = this.sprites.filter(val => val != c);
						break;
					case CollectibleTypes.Machinegun:
						dispatchEvent(new CustomEvent("playCollectGunSound"));
						this.hasMachinegun = true;
						this.collectibles = this.collectibles.filter(val => val.config.typeExtended != CollectibleTypes.Machinegun);
						this.sprites = this.sprites.filter(val => val != c);
						break;
				}
			}
		}
	}

	handleShooting = () => {
		if ((this.ammo > 0 || this.currentWeapon == Weapons.Knife)
			&& this.playerMovement.shooting && !this.waitForReady && !this.waitForTriggerRelease) {
			if (this.currentWeapon == Weapons.Knife || this.currentWeapon == Weapons.Pistol) {
				this.waitForReady = true;
				if (this.currentWeapon == Weapons.Pistol)
					dispatchEvent(new CustomEvent("playGunSound"));
				else if (this.currentWeapon == Weapons.Knife)
					dispatchEvent(new CustomEvent("playKnifeSound"));
				this.handUI.shootOnce(() => {
					if (this.currentWeapon == Weapons.Pistol) {
						this.ammo--;
						dispatchEvent(new CustomEvent("ammoChanged", { detail: this.ammo }));
					}
					this.checkHit();
					this.waitForReady = false;
				});
				this.waitForTriggerRelease = true;
			}
			else {
				this.waitForReady = true;
				this.handUI.shootStart(() => {
					this.ammo--;
					dispatchEvent(new CustomEvent("ammoChanged", { detail: this.ammo }));
					dispatchEvent(new CustomEvent("playGunSound"));
					this.checkHit();
					this.waitForReady = false;
					if (this.ammo <= 0)
						this.handUI.shootStop();
				});
			}
		}
		else if (!this.playerMovement.shooting) {
			this.waitForTriggerRelease = false;
			if (this.currentWeapon == Weapons.Rifle || this.currentWeapon == Weapons.Machinegun)
				this.handUI.shootStop();
		}
	}

	checkHit = () => {
		for (let enemy of this.enemies) {
			if (enemy.HP > 0) {
				let shootAngle = this.playerDirNormalized.angle();
				let enemyAngle = enemy.position.angleFromAngleArm(this.playerPos);
				let diff = Math.abs(shootAngle - enemyAngle);
				let diff2 = Math.abs(2 * Math.PI - diff);
				diff = diff < diff2 ? diff : diff2;
				let allowedAngle = Math.atan2(0.18, enemy.position.subtractVec(this.playerPos).length())
				let distanceToEnemy = this.playerPos.subtractVec(enemy.position).length();
				if (diff < allowedAngle && (this.currentWeapon != Weapons.Knife || distanceToEnemy < 1.2)) {
					let damage: number = 0;
					switch (this.currentWeapon) {
						case Weapons.Knife: damage = 40; break;
						case Weapons.Pistol: damage = 60; break;
						case Weapons.Rifle: damage = 80; break;
						case Weapons.Machinegun: damage = 120; break;
					}
					enemy.HP -= damage;
					if (enemy.HP <= 0) {
						if (enemy.type == EnemyType.Soldier)
							dispatchEvent(new CustomEvent("playDeathSound"));
						else if (enemy.type == EnemyType.Dog)
							dispatchEvent(new CustomEvent("playDogDeathSound"));
						this.score += 100;
						// gdy przeciwnik umiera, czasem zostawia magazynek
						if (Math.random() > 0.5 && enemy.type == EnemyType.Soldier) {
							let ammo: LevelElem = {
								type: LevelElemType.Collectible,
								config: {
									typeExtended: CollectibleTypes.Ammo
								},
								collidable: false,
								position: {
									x: enemy.position.x + Math.random() - 0.5,
									y: enemy.position.y + Math.random() - 0.5
								},
								texCoords: [Mappings["ammo"]]
							}
							this.collectibles.push(ammo);
							this.sprites.push(ammo);
						}
						dispatchEvent(new CustomEvent("scoreChanged", { detail: this.score }))
					}
				}
			}
		}
	}

	drawFunc = (delta: number) => {
		this.movePlayer();
		this.openDoors();
		this.uncoverSecrets();
		this.handleFinish();
		this.handleCollectibles();
		this.handleShooting();
		for (let enemy of this.enemies)
			enemy.doSomething(this.playerPos, this.playerDirNormalized, this.simpleRaycast);

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
				let texCoords: Vec2Interface;
				switch (res.facingDirection) {
					case Directions.North:
						texCoords = res.collidedWith.texCoords[0];
						break;
					case Directions.East:
						texCoords = res.collidedWith.texCoords[1];
						break;
					case Directions.South:
						texCoords = res.collidedWith.texCoords[2];
						break;
					case Directions.West:
						texCoords = res.collidedWith.texCoords[3];
						break;
					default:
						texCoords = res.collidedWith.texCoords[0];
						break;
				}
				lineHeight = Math.round((this.canvasSize.y / res.distance));
				lineStart = (this.canvasSize.y - lineHeight) / 2;
				this.context.drawImage(this.texture, texCoords.x + res.texOffset * 64, texCoords.y, 1, 64,
					hline, lineStart, 1, lineHeight);
			}
		}
		// narysowanie spritów: przeciwników, znajdziek i innych obiektów
		let spritesDistance: { i: number, distance: number }[] = [];
		for (let sp in this.sprites) {
			spritesDistance.push({
				i: parseInt(sp),
				distance: (this.playerPos.x - this.sprites[sp].position.x) ** 2
					+ (this.playerPos.y - this.sprites[sp].position.y) ** 2
			});
		}
		// same indeksy, posortowane
		let spritesIndexes: number[] = spritesDistance.sort((a, b) => b.distance - a.distance).map(val => val.i);
		for (let spi of spritesIndexes) {
			// pozycja znajdźki względem gracza
			let spPosRelative: Vec2 = new Vec2(this.sprites[spi].position.x, this.sprites[spi].position.y).subtractVec(this.playerPos);

			let invDet: number = 1 / (this.fovVector.x * this.playerDirNormalized.y - this.playerDirNormalized.x * this.fovVector.y);

			let transform: Vec2 = new Vec2(
				invDet * (this.playerDirNormalized.y * spPosRelative.x - this.playerDirNormalized.x * spPosRelative.y),
				invDet * (-this.fovVector.y * spPosRelative.x + this.fovVector.x * spPosRelative.y)
			);

			let spriteScreenX = Math.floor((this.canvasSize.x / 2) * (1 + transform.x / transform.y));

			let spriteHeight = Math.abs(Math.floor(this.canvasSize.y / transform.y));
			let drawStartY = Math.floor(-spriteHeight / 2 + this.canvasSize.y / 2);

			let spriteWidth = Math.abs(this.canvasSize.y / transform.y);
			let drawStartX = Math.floor(spriteScreenX - spriteWidth / 2);
			let drawEndX = Math.floor(spriteScreenX + spriteWidth / 2);

			let texture = this.texture;
			let p: Vec2Interface = { x: 0, y: 0 };
			if (Object.getPrototypeOf(this.sprites[spi].constructor).name == BaseEnemy.name) {
				texture = (this.sprites[spi] as BaseEnemy).texture;
				p = (this.sprites[spi] as BaseEnemy).texCoords;
			}
			else {
				p = (this.sprites[spi] as LevelElem).texCoords[0];
			}
			let texWidthRatio = 64 / spriteWidth;
			for (let line = drawStartX > 0 ? drawStartX : 0; line < drawEndX; line++) {
				let texX = line - drawStartX;
				texX *= texWidthRatio;
				if (transform.y > 0 && line > 0 && line < this.canvasSize.x && transform.y < wallDistanceByScreenLine[line]) {
					this.context.drawImage(texture, p.x + texX, p.y, 1, 64, line, drawStartY, 1, spriteHeight);
				}
			}
		}

		this.handUI.draw();
		if (this.HP > 0) {
			requestAnimationFrame(this.drawFunc);
		}
		else {
			this.HP = 0;
			dispatchEvent(new CustomEvent("healthChanged", { detail: this.HP }));
			this.fadeInDeathScreen().then(() => {
				setTimeout(() => {
					location.reload();
				}, 1000);
			});
		}
	}

	fadeInDeathScreen = () => {
		this.fadeoutContext.fillStyle = "#ff0000";
		return new Promise((resolve, reject) => {
			let i = 0;
			let interval = setInterval(() => {
				for (let i = 0; i < 1000; i++) {
					let x = Math.round(Math.random() * this.canvasSize.x);
					let y = Math.round(Math.random() * this.canvasSize.y);
					this.fadeoutContext.fillRect(x, y, 2, 2);
				}
				i++;
				if (i > 100) {
					clearInterval(interval);
					this.fadeoutContext.fillRect(0, 0, this.canvasSize.x, this.canvasSize.y);
					resolve(true);
				}
			})
		})
	}

	startGameLoop = () => {
		requestAnimationFrame(this.drawFunc);
		setTimeout(() => {
			this.resizeFadeoutCanvas();
		}, 1000)
	}

	handleKeyboardDown = (event: KeyboardEvent) => {
		switch (event.key) {
			case 'ArrowUp': this.playerMovement.forward = this.playerLinearVelocity; break;
			case 'ArrowDown': this.playerMovement.forward = -this.playerLinearVelocity; break;
			case 'ArrowLeft': this.playerMovement.rotate = -this.playerAngularVelocity; break;
			case 'ArrowRight': this.playerMovement.rotate = this.playerAngularVelocity; break;
			case ' ': this.playerMovement.interaction = true; break;
			case 'Control':
			case 'Meta':
				this.playerMovement.shooting = true; break;
		}
	}

	handleKeyboardUp = (event: KeyboardEvent) => {
		switch (event.key) {
			case 'ArrowUp': this.playerMovement.forward = 0; break;
			case 'ArrowDown': this.playerMovement.forward = 0; break;
			case 'ArrowLeft': this.playerMovement.rotate = 0; break;
			case 'ArrowRight': this.playerMovement.rotate = 0; break;
			case ' ': this.playerMovement.interaction = false; break;
			case 'Control':
			case 'Meta':
				this.playerMovement.shooting = false; break;
			case '1':
				this.currentWeapon = Weapons.Knife;
				this.handUI.setWeapon(Weapons.Knife);
				dispatchEvent(new CustomEvent("weaponChanged", { detail: Weapons.Knife }))
				break;
			case '2':
				this.currentWeapon = Weapons.Pistol;
				this.handUI.setWeapon(Weapons.Pistol);
				dispatchEvent(new CustomEvent("weaponChanged", { detail: Weapons.Pistol }))
				break;
			case '3':
				if (this.hasRifle) {
					this.currentWeapon = Weapons.Rifle;
					this.handUI.setWeapon(Weapons.Rifle);
					dispatchEvent(new CustomEvent("weaponChanged", { detail: Weapons.Rifle }))
				}
				break;
			case '4':
				if (this.hasMachinegun) {
					this.currentWeapon = Weapons.Machinegun;
					this.handUI.setWeapon(Weapons.Machinegun);
					dispatchEvent(new CustomEvent("weaponChanged", { detail: Weapons.Machinegun }))
				}
				break;
		}
	}
}