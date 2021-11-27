interface Vec2Interface {
	x: number;
	y: number;
}

class Vec2 {
	x: number;
	y: number;
	constructor(x: number = 0, y: number = 0) {
		this.x = x;
		this.y = y;
	}
	length(): number { return Math.sqrt(this.x ** 2 + this.y ** 2); }
	multiplyScalar(scalar: number): Vec2 {
		return new Vec2(this.x * scalar, this.y * scalar);
	}
	multiplyVec(vec2: Vec2): Vec2 {
		return new Vec2(this.x * vec2.x, this.y * vec2.y);
	}
	addScalar(scalar: number): Vec2 {
		return new Vec2(this.x + scalar, this.y + scalar);
	}
	addVec(vec2: Vec2): Vec2 {
		return new Vec2(this.x + vec2.x, this.y + vec2.y);
	}
	subtractVec(vec2: Vec2): Vec2 {
		return new Vec2(this.x - vec2.x, this.y - vec2.y);
	}
	divideScalar(scalar: number): Vec2 {
		if (scalar != 0)
			return new Vec2(this.x / scalar, this.y / scalar);
		else
			return new Vec2(Infinity, Infinity);
	}
	divideVec(vec2: Vec2): Vec2 {
		return new Vec2(
			vec2.x == 0 ? Infinity : this.x / vec2.x,
			vec2.y == 0 ? Infinity : this.y / vec2.y);
	}
	floor(): Vec2 {
		return new Vec2(Math.floor(this.x), Math.floor(this.y));
	}
	rotate(radians: number): void {
		let oldX: number = this.x;
		let oldY: number = this.y;
		this.x = Math.cos(radians) * oldX - Math.sin(radians) * oldY;
		this.y = Math.sin(radians) * oldX + Math.cos(radians) * oldY;
	}
	getRaw(): Vec2Interface {
		return { x: this.x, y: this.y };
	}
}

enum LevelElemType {
	Empty,
	Wall,
	Secret,
	Door,
	Collectible,
	Enemy,
	Player
}

interface LevelElem {
	type: LevelElemType;
	config: { [k: string]: any };
	position: Vec2Interface;
	texCoord: Vec2Interface;
	openness?: number;
	perpOffset?: number;
}

enum WallTypes {
	Rock,
	Brick,
	Wood
}

enum CollectibleTypes {
	Gold,
	Medkit
}

enum Directions {
	North,
	East,
	South,
	West
}

enum EnemyType {
	Soldier,
	Dog
}

class BaseEnemy {
	// AIFunc (thisObj: Enemy, playerPos: Vec2, playerRotation: Vec2, ) => number,
	nextDecisionCooldown: number = 10;
	position: Vec2;
	rotation: Vec2;
	texture: HTMLImageElement = new Image();
	type: EnemyType;
	texCoords: Vec2Interface = { x: 0, y: 0 };
	constructor(type: EnemyType, pos: Vec2, rot: Vec2) {
		this.type = type;
		this.position = pos;
		this.rotation = rot;
	}
	doSomething = (playerPos: Vec2, playerRotation: Vec2, raycastFunc: (startPos: Vec2, ray: Vec2) => CollisionInfo) => {
		console.error("You should override this function");
	}
}

interface CollisionInfo {
	distance: number,
	collidedWith: (LevelElem | null),
	collisionPos: Vec2,
	texOffset: number,
	facingDirection: Directions,
	softCollisions: CollisionInfo[],
}

export { Vec2, Directions, LevelElem, LevelElemType, Vec2Interface, WallTypes, CollectibleTypes, BaseEnemy, EnemyType, CollisionInfo };