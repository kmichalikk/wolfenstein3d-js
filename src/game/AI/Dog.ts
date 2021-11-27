import { Vec2, CollisionInfo, BaseEnemy, EnemyType } from "../../utils";
//@ts-ignore
import Texture from '../gfx/dogtex.png';

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
		this.adjustTexture(playerPos, "stand");
	}
}