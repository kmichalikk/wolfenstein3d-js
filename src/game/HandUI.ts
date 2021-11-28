//@ts-ignore
import WeaponTexture from './gfx/weapontex.png';
//@ts-ignore
import mappings from './gfx/weapon_mappings.json';
import { Vec2, Vec2Interface, Weapons } from "../utils";

export default class HandUI {
	context: CanvasRenderingContext2D;
	canvasSize: Vec2Interface;
	clock: number;
	drawStart: Vec2;
	texture: HTMLImageElement;
	frameName: string = "";
	frameNum: number = 0;
	mapping: Vec2Interface = { x: 0, y: 0 };
	attackCount: number = 0;
	stopping: boolean = false;
	currentCallback = () => { };
	constructor(context: CanvasRenderingContext2D, canvasSize: Vec2Interface) {
		this.context = context;
		this.canvasSize = canvasSize;
		this.clock = 0;
		this.texture = new Image();
		this.texture.src = WeaponTexture;
		this.drawStart = new Vec2(Math.round((canvasSize.x - canvasSize.y) / 2), 0);
	}

	setWeapon(w: Weapons) {
		switch (w) {
			case Weapons.Knife: this.frameName = "knife"; break;
			case Weapons.Pistol: this.frameName = "pistol"; break;
			case Weapons.Rifle: this.frameName = "rifle"; break;
			case Weapons.Machinegun: this.frameName = "machinegun"; break;
		}
		this.frameNum = 0;
		this.mapping = mappings[this.frameName + this.frameNum];
	}

	shootOnce = (callback: () => void) => {
		this.currentCallback = callback;
		this.attackCount = 1;
	}

	shootStart = (callback: () => void) => {
		this.currentCallback = callback;
		// będzie w nieskończoność
		this.attackCount = -1;
	}

	shootStop = () => {
		this.stopping = true;
	}

	draw = () => {
		this.clock++;
		if (this.clock % 4 == 0) {
			if (this.attackCount != 0) {
				if (this.frameNum < 4) {
					this.frameNum++;
				}
				else {
					this.frameNum = 1;
					if (this.stopping)
						this.attackCount = 0;
					else
						this.attackCount--;
					this.currentCallback();
				}
			}
			else {
				this.frameNum = 0;
			}
			this.mapping = mappings[this.frameName + this.frameNum];
		}
		this.context.drawImage(this.texture,
			this.mapping.x, this.mapping.y, 64, 64,
			this.drawStart.x, this.drawStart.y, this.canvasSize.y, this.canvasSize.y
		);
	}
}