import { Vec2, CollisionInfo, BaseEnemy, EnemyType } from "../../utils";
//@ts-ignore
import Texture from '../gfx/dogtex.png';

export default class Dog extends BaseEnemy {
	speed: number;
	agression: number;
	distanceToPlayer: number;
	constructor(pos: Vec2, rot: Vec2) {
		super(EnemyType.Dog, pos, rot);
		this.rotation = new Vec2(0, -1);
		this.speed = 0.04;
		this.agression = 0.2;
		this.distanceToPlayer = 9999;
		let image = new Image();
		image.src = Texture;
		image.onload = () => { this.texture = image; }
	}
	doSomething = (playerPos: Vec2, playerRotation: Vec2, raycastFunc: (startPos: Vec2, ray: Vec2) => CollisionInfo) => {
		this.nextDecisionCooldown--;
		// wykonuje się, kiedy jest czas na nową decyzję
		if (this.nextDecisionCooldown <= 0) {
			console.log('am thinking');
			this.nextDecisionCooldown = Math.round(Math.random() * 10) + 20;

			if (this.agression > 0.7) {
				let angle = this.position.angleFromAngleArm(playerPos);
				angle -= Math.atan2(this.rotation.y, this.rotation.x) + Math.PI;
				if (angle < 0) angle += 2 * Math.PI;
				angle += Math.random() - 0.5;
				this.rotation.rotate(angle);
				this.nextDecisionCooldown -= 10;
				console.log('me angry!');
			}
			else {
				if (Math.random() > 0.8)
					this.rotation.rotate(Math.random() * Math.PI * 2);
				else
					this.rotation.rotate(Math.random() * Math.PI * 1.5 - 0.75);
				console.log('me ok with you');
			}

			if (this.distanceToPlayer < 0.5 && this.agression > 0.4) {
				this.speed = 0.03;
				this.rotation = playerRotation.clone();
				this.rotation.rotate(Math.random() - 0.5);
				console.log('me biting you!');
				this.nextDecisionCooldown = 60;
			}
		}

		this.distanceToPlayer = this.position.subtractVec(playerPos).length();
		if (this.distanceToPlayer > 4 && this.agression > 0) {
			// jeśli gracz jest daleko, powoli uspokaja się
			this.agression -= 0.01;
		}
		else if (this.distanceToPlayer <= 4 && this.distanceToPlayer > 1.5 && this.agression < 1) {
			// jeśli gracz jest blisko, robi się bardziej agresywny
			this.agression += 0.02;
		}
		if (this.distanceToPlayer <= 0.5 && this.agression > 0.5)
			this.nextDecisionCooldown = 0;

		console.log(this.agression);
		// ruch
		let collisionTest = raycastFunc(this.position, this.rotation);
		if (collisionTest.softCollisions.length > 0 ? collisionTest.softCollisions[0].distance > 0.3 : collisionTest.distance > 0.3) {
			this.position = this.position.addVec(this.rotation.multiplyScalar(this.speed));
		}
		else if (this.nextDecisionCooldown > 5)
			this.nextDecisionCooldown = 5;
		// ustawienie odpowiedniej tekstury w zależności od kierunku patrzenia gracza
		this.adjustTexture(playerPos, "stand");
	}
}