import { Vec2, CollisionInfo, BaseEnemy, EnemyType } from "../../utils";
//@ts-ignore
import Texture from '../gfx/dogtex.png';
//@ts-ignore
import mappings from '../gfx/enemy_mappings.json';

export default class Dog extends BaseEnemy {
	constructor(pos: Vec2, rot: Vec2) {
		super(EnemyType.Dog, pos, rot);
		this.rotation = new Vec2(0, -1);
		let image = new Image();
		image.src = Texture;
		image.onload = () => { this.texture = image; }
	}
	doSomething = (playerPos: Vec2, playerRotation: Vec2, raycastFunc: (startPos: Vec2, ray: Vec2) => CollisionInfo) => {
		this.nextDecisionCooldown--;
		// wykonuje się, kiedy jest czas na nową decyzję
		if (this.nextDecisionCooldown <= 0) {
			this.rotation.rotate(0.1);
			this.nextDecisionCooldown = 4;
		}

		let vec = this.position.subtractVec(playerPos);
		let angle = Math.atan2(vec.y, vec.x)
		if (angle < 0) angle += 2 * Math.PI;
		angle -= Math.atan2(this.rotation.y, this.rotation.x) + Math.PI;
		if (angle < 0) angle += 2 * Math.PI;

		if (angle < Math.PI * 0.125 || angle >= Math.PI * 1.875)
			this.texCoords = mappings["stand-front"];
		else if (angle < Math.PI * 0.375 && angle >= Math.PI * 0.125)
			this.texCoords = mappings["stand-front-right"];
		else if (angle < Math.PI * 0.625 && angle >= Math.PI * 0.375)
			this.texCoords = mappings["stand-right"];
		else if (angle < Math.PI * 0.875 && angle >= Math.PI * 0.625)
			this.texCoords = mappings["stand-back-right"];
		else if (angle < Math.PI * 1.125 && angle >= Math.PI * 0.875)
			this.texCoords = mappings["stand-back"];
		else if (angle < Math.PI * 1.375 && angle >= Math.PI * 1.125)
			this.texCoords = mappings["stand-back-left"];
		else if (angle < Math.PI * 1.625 && angle >= Math.PI * 1.375)
			this.texCoords = mappings["stand-left"];
		else if (angle < Math.PI * 1.875 && angle >= Math.PI * 1.625)
			this.texCoords = mappings["stand-front-left"];
	}
}