import { Vec2, CollisionInfo, BaseEnemy, EnemyType } from "../../utils";
//@ts-ignore
import Texture from '../gfx/soldiertex.png';

export default class Soldier extends BaseEnemy {
	animClock: number = 0;
	frame: string = "run1";
	speed: number = 0.02;
	alerted: boolean = false;
	shooting: boolean = false;
	playerLastPos: (Vec2 | null) = null;
	playerInSight: boolean = false;
	constructor(pos: Vec2, rot: Vec2) {
		super(EnemyType.Soldier, pos, rot);
		this.rotation = new Vec2(0, -1);
		let image = new Image();
		image.src = Texture;
		image.onload = () => { this.texture = image };
	}

	doSomething = (playerPos: Vec2, playerRotation: Vec2, raycastFunc: (startPos: Vec2, ray: Vec2) => CollisionInfo) => {
		this.animClock++;
		this.nextDecisionCooldown--;
		// wykonuje się, kiedy jest czas na nową decyzję
		if (this.nextDecisionCooldown <= 0) {
			if (this.shooting) {
				this.shooting = false;
				this.frame = "run0";
			}
			if (!this.alerted) {
				// jeśli nie jest zaalarmowany, porusza się na zmianę do przodu/do tyłu
				// szukamy kierunku, gdzie ma najbliżej do ściany
				let rayN = raycastFunc(this.position, new Vec2(0, -1));
				let rayE = raycastFunc(this.position, new Vec2(1, 0));
				let rayS = raycastFunc(this.position, new Vec2(0, 1));
				let rayW = raycastFunc(this.position, new Vec2(-1, 0));

				let directionTests = [rayN, rayE, rayS, rayW].map(val => val.softCollisions.length > 0 ? val.softCollisions[0] : val);

				let distances = directionTests.map(val => val.distance);
				let minIndex: number = 0;
				for (let i in distances) {
					if (distances[i] < distances[minIndex]) minIndex = parseInt(i);
				}
				// bierzemy kierunek odwrotny do najbliższego ścianie
				this.rotation = directionTests[minIndex].collisionPos.subtractVec(this.position).normalize().multiplyScalar(-1);
				this.nextDecisionCooldown = Math.round(Math.random() * 40) + 60;
			}
			else {
				this.nextDecisionCooldown = Math.round(Math.random() * 10) + 20;
				if (this.playerInSight) {
					if (Math.random() > 0.2) {
						//console.log('Ich sehe dich!');

						let distanceToPlayer = playerPos.subtractVec(this.position).length();
						if (distanceToPlayer >= 5) {
							this.speed = 0.02;
							this.rotation = playerPos.subtractVec(this.position).normalize();
						}
						else if (distanceToPlayer > 1.5 && distanceToPlayer < 5) {
							this.speed = 0.02;
							// nie idzie prosto na gracza, tylko utrzymuje dystans
							// idąc mniej więce pod kątem prostym od niego
							let strafeLeftDir = this.rotation.clone().rotate(Math.PI / 2);
							let strafeRightDir = this.rotation.clone().rotate(-Math.PI / 2);
							let rayL = raycastFunc(this.position, strafeLeftDir);
							let rayR = raycastFunc(this.position, strafeRightDir);
							let collisionDistanceL = rayL.softCollisions.length > 0 ? rayL.softCollisions[0].distance : rayL.distance;
							let collisionDistanceR = rayR.softCollisions.length > 0 ? rayR.softCollisions[0].distance : rayR.distance;
							if (Math.random() > 0.5) {
								if (collisionDistanceL > 0.5) this.rotation = strafeLeftDir;
								else this.rotation = strafeLeftDir;
							}
							else {
								if (collisionDistanceR > 0.5) this.rotation = strafeRightDir;
								else this.rotation = strafeLeftDir;
							}
						}
						else {
							// teraz to już albo on albo gracz - stoi i strzela
							////console.log("*shooting*");
							this.speed = 0;
							this.nextDecisionCooldown = 24;
							this.frame = "attack0";
							this.shooting = true;
						}
						// lekkie odchylenie od prostych kątów
						this.rotation.rotate(Math.random() * 0.5 - 0.25);
					}
					else {
						//console.log('*shooting*');
						this.speed = 0;
						this.nextDecisionCooldown = 24;
						this.frame = "attack0";
						this.shooting = true;
					}
				}
				else if (this.playerLastPos) {
					// już nie widzimy gracza - ale wiemy gdzie był wcześniej
					//console.log("Wo bist du?");
					let vecToLastPlayerPos = this.playerLastPos.subtractVec(this.position);
					if (vecToLastPlayerPos.length() > 1) {
						this.rotation = vecToLastPlayerPos.normalize();
					}
					else {
						this.playerLastPos = null;
					}
				}
				else {
					// hmm? to chyba był wiatr...
					this.alerted = false;
					this.nextDecisionCooldown = 0;
				}
			}
		}
		// sprawdzamy, czy widzimy gracza
		let distanceToPlayer = playerPos.subtractVec(this.position).length();
		let res = raycastFunc(this.position, playerPos.subtractVec(this.position).normalize());
		let distanceToCollision = res.softCollisions.length > 0 ? res.softCollisions[0].distance : res.distance;

		if (distanceToPlayer < distanceToCollision) {
			// widzimy gracza
			this.alerted = true;
			this.playerLastPos = playerPos;
			this.playerInSight = true;
		}
		else {
			this.playerInSight = false;
		}
		// ruch
		let collisionTest = raycastFunc(this.position, this.rotation);
		if (collisionTest.softCollisions.length > 0 ? collisionTest.softCollisions[0].distance > 0.3 : collisionTest.distance > 0.3) {
			this.position = this.position.addVec(this.rotation.multiplyScalar(this.speed));
		}
		else if (this.nextDecisionCooldown > 5)
			this.nextDecisionCooldown = 5;
		// animacje
		if (this.animClock % 8 == 0) {
			switch (this.frame) {
				case "run0": this.frame = "run1"; break;
				case "run1": this.frame = "run2"; break;
				case "run2": this.frame = "run3"; break;
				case "run3": this.frame = "run0"; break;
				case "attack0": this.frame = "attack1"; break;
				case "attack1": this.frame = "attack2"; break;
			}
		}

		// ustawienie odpowiedniej tekstury w zależności od kierunku patrzenia gracza
		this.adjustTexture(playerPos, this.frame, !this.shooting);
	}
}