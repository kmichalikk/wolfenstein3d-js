import { Directions, LevelElem, LevelElemType, Vec2Interface } from "../../utils";
//@ts-ignore
import mappings from "../textures/mappings.json";

export default class Secret {
	pos: Vec2Interface;
	direction: Directions;
	texCoord: Vec2Interface;
	constructor(pos: Vec2Interface, dir: Directions) {
		this.pos = pos;
		this.direction = dir;
		switch (this.direction) {
			case Directions.North:
				this.texCoord = mappings["secretup"];
				break;
			case Directions.East:
				this.texCoord = mappings["secretright"];
				break;
			case Directions.South:
				this.texCoord = mappings["secretdown"];
				break;
			case Directions.West:
				this.texCoord = mappings["secretleft"];
				break;
		}
	}

	getSerializableData: () => LevelElem = () => {
		return {
			type: LevelElemType.Secret,
			typeExtended: this.direction,
			position: this.pos,
			texCoord: this.texCoord,
			facingDirection: this.direction
		};
	}
}