import { Vec2, CollisionInfo, BaseEnemy, EnemyType } from "../../utils";
//@ts-ignore
import Texture from '../gfx/dogtex.png';

export default class Dog extends BaseEnemy {
	speed: number;
	frame: string = "run0";
	animClock: number = 0;
	agression: number;
	stands: boolean = false;
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
		this.animClock++;
		this.nextDecisionCooldown--;
		if (this.HP > 0) {
			// wykonuje się, kiedy jest czas na nową decyzję
			if (this.nextDecisionCooldown <= 0) {
				//console.log('am thinking');
				this.nextDecisionCooldown = Math.round(Math.random() * 10) + 20;

				if (!this.stands) {
					if (this.agression > 0.7) {
						let angle = this.position.angleFromAngleArm(playerPos);
						angle -= Math.atan2(this.rotation.y, this.rotation.x) + Math.PI;
						if (angle < 0) angle += 2 * Math.PI;
						angle += Math.random() - 0.5;
						this.rotation.rotate(angle);
						this.nextDecisionCooldown -= 10;
						//console.log('me angry!');
					}
					else {
						if (Math.random() > 0.8)
							this.rotation.rotate(Math.random() * Math.PI * 2);
						else
							this.rotation.rotate(Math.random() * Math.PI * 1.5 - 0.75);
						//console.log('me ok with you');
					}

					if (this.distanceToPlayer < 1 && this.agression > 0.4) {
						this.speed = 0.03;
						//console.log('me biting you!');
						this.stands = true;
						this.speed = 0;
						this.frame = "attack0";
						this.nextDecisionCooldown = 24;
					}
				}
				else {
					this.stands = false;
					this.frame = "run0";
					this.speed = 0.04;
					this.rotation = playerRotation.clone();
					this.rotation.rotate(Math.random() - 0.5);
				}
			}

			this.distanceToPlayer = this.position.subtractVec(playerPos).length();
			let rayToPlayer = raycastFunc(this.position, playerPos.subtractVec(this.position).normalize());
			let playerInSight = rayToPlayer.softCollisions.length > 0
				? this.distanceToPlayer < rayToPlayer.softCollisions[0].distance
				: this.distanceToPlayer < rayToPlayer.distance;

			if (playerInSight && this.agression < 1) {
				// jeśli gracz jest blisko, robi się bardziej agresywny
				this.agression += 1 / this.distanceToPlayer / 10;
			}
			else if (this.agression > 0) {
				this.agression -= 1 / this.distanceToPlayer / 10;
			}
			if (this.distanceToPlayer < 1 && !this.stands)
				this.nextDecisionCooldown = 0;

			// ruch
			let collisionTest = raycastFunc(this.position, this.rotation);
			if (collisionTest.softCollisions.length > 0 ? collisionTest.softCollisions[0].distance > 0.3 : collisionTest.distance > 0.3) {
				this.position = this.position.addVec(this.rotation.multiplyScalar(this.speed));
			}
			else if (this.nextDecisionCooldown > 5)
				this.nextDecisionCooldown = 5;

		}
		else if (!this.frame.match(/death./)) {
			this.frame = "death0";
			this.stands = true;
		}
		// animacje
		if (this.animClock % 8 == 0) {
			switch (this.frame) {
				case "run0": this.frame = "run1"; break;
				case "run1": this.frame = "run2"; break;
				case "run2": this.frame = "run3"; break;
				case "run3": this.frame = "run0"; break;
				case "attack0": this.frame = "attack1"; break;
				case "attack1": this.frame = "attack2"; break;
				case "death0": this.frame = "death1"; break;
				case "death1": this.frame = "death2"; break;
				case "death2": this.frame = "death3"; break;
			}
		}

		// ustawienie odpowiedniej tekstury w zależności od kierunku patrzenia gracza
		if (this.HP > 0)
			this.adjustTexture(playerPos, this.frame, !this.stands);
		else
			this.adjustTexture(playerPos, this.frame, false);
	}
}