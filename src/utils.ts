
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
}

interface TextureInfo {
	name: string;
	color: string;
	pos: Vec2;
	size: Vec2;
}


let WallData: TextureInfo[] = [
	{ name: "cobblestone", color: "blue", pos: new Vec2(0, 0), size: new Vec2(256, 256) },
	{ name: "bricks", color: "gray", pos: new Vec2(256, 0), size: new Vec2(256, 256) },
	{ name: "wood", color: "brown", pos: new Vec2(512, 0), size: new Vec2(256, 256) },
]

enum TileType {
	Empty,
	Wall,
	Collectible,
	Enemy
}

interface Tile {
	type: TileType;
	detail: number;
}

enum Directions {
	North,
	East,
	South,
	West
}

export { Vec2, TextureInfo, WallData, TileType, Tile, Directions };