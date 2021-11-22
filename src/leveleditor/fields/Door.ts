import { Directions, LevelElem, LevelElemType, Vec2Interface } from "../../utils";
//@ts-ignore
import mappings from "../textures/mappings.json";


export default class Door {
	pos: Vec2Interface;
	dir: Directions;
	texCoord: Vec2Interface;
	constructor(pos: Vec2Interface, dir: Directions) {
		this.pos = pos;
		this.dir = dir;
		switch (dir) {
			case Directions.North:
				this.texCoord = mappings["doorup"];
				break;
			case Directions.East:
				this.texCoord = mappings["doorright"];
				break;
			case Directions.South:
				this.texCoord = mappings["doordown"];
				break;
			case Directions.West:
				this.texCoord = mappings["doorleft"];
				break;
		}
	}

	getSerializableData: () => LevelElem = () => {
		return {
			type: LevelElemType.Door,
			typeExtended: this.dir,
			position: this.pos,
			texCoord: this.texCoord
		}
	}
}