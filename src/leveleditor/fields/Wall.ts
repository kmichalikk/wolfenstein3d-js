import { LevelElem, LevelElemType, Vec2, Vec2Interface, WallTypes } from "../../utils";
//@ts-ignore
import mappings from "../textures/mappings.json";

export default class Wall {
	type: WallTypes;
	pos: Vec2Interface;
	texCoord: Vec2Interface;

	constructor(type: WallTypes, pos: Vec2Interface) {
		this.type = type;
		this.pos = pos;
		switch (this.type) {
			case WallTypes.Brick:
				this.texCoord = mappings["brickwall"];
				break;
			case WallTypes.Wood:
				this.texCoord = mappings["woodwall"];
				break;
			case WallTypes.Rock:
				this.texCoord = mappings["rockwall"];
				break;
		}
	}

	getSerializableData: () => LevelElem = () => {
		return {
			type: LevelElemType.Wall,
			typeExtended: this.type,
			position: this.pos,
			texCoord: this.texCoord
		}
	}
}