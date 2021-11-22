//@ts-ignore
import { Directions, LevelElem, LevelElemType, Vec2Interface, WallTypes } from '../utils';
//@ts-ignore
import Texture from './textures/texture.png';
//@ts-ignore
import EraserTex from './textures/erase.png';
//@ts-ignore
import mappings from "./textures/mappings.json";

export default class Selector {
	dom: HTMLDivElement;
	currSelected: HTMLDivElement;
	currTemplate: (LevelElem | null) = {
		type: LevelElemType.Wall,
		typeExtended: WallTypes.Brick,
		position: { x: 0, y: 0 },
		texCoord: { x: 640, y: 0 }
	};
	constructor() {
		this.dom = document.createElement("div");
		this.dom.classList.add("le-selector");
		//###gumka
		let eraser = document.createElement("div");
		this.currSelected = eraser;
		eraser.classList.add("le-button");
		eraser.style.backgroundImage = `url(${EraserTex})`;
		eraser.onclick = () => {
			this.currTemplate = null;
			this.currSelected.classList.remove("le-button-selected");
			eraser.classList.add("le-button-selected");
			this.currSelected = eraser;
		}
		this.dom.append(eraser);

		//###gumka
		let you = document.createElement("div");
		this.currSelected = you;
		you.classList.add("le-button");
		you.style.backgroundImage = `url(${Texture})`;
		you.style.backgroundPosition = `left ${-mappings["you"].x}px top 0px`;
		you.onclick = () => {
			this.currTemplate = {
				type: LevelElemType.Player,
				typeExtended: 0,
				position: { x: 0, y: 0 },
				texCoord: mappings["you"]
			};
			this.currSelected.classList.remove("le-button-selected");
			you.classList.add("le-button-selected");
			this.currSelected = you;
		}
		this.dom.append(you);

		//###ściany
		// z kostki
		let brickwall = document.createElement("div");
		this.currSelected = brickwall;
		brickwall.classList.add("le-button", "le-button-selected");
		brickwall.style.backgroundImage = `url(${Texture})`;
		brickwall.style.backgroundPosition = `left ${-mappings["brickwall"].x}px top 0px`;
		brickwall.onclick = () => {
			this.currTemplate = {
				type: LevelElemType.Wall,
				typeExtended: WallTypes.Brick,
				position: { x: 0, y: 0 },
				texCoord: mappings["brickwall"]
			}
			this.currSelected.classList.remove("le-button-selected");
			brickwall.classList.add("le-button-selected");
			this.currSelected = brickwall;
		}
		this.dom.append(brickwall);
		// drewniania
		let woodwall = document.createElement("div");
		woodwall.classList.add("le-button");
		woodwall.style.backgroundImage = `url(${Texture})`;
		woodwall.style.backgroundPosition = `left ${-mappings["woodwall"].x}px top 0px`;
		woodwall.onclick = () => {
			this.currTemplate = {
				type: LevelElemType.Wall,
				typeExtended: WallTypes.Wood,
				position: { x: 0, y: 0 },
				texCoord: mappings["woodwall"]
			}
			this.currSelected.classList.remove("le-button-selected");
			woodwall.classList.add("le-button-selected");
			this.currSelected = woodwall;
		}
		this.dom.append(woodwall);
		// kamienna
		let rockwall = document.createElement("div");
		rockwall.classList.add("le-button");
		rockwall.style.backgroundImage = `url(${Texture})`;
		rockwall.style.backgroundPosition = `left ${-mappings["rockwall"].x}px top 0px`;
		rockwall.onclick = () => {
			this.currTemplate = {
				type: LevelElemType.Wall,
				typeExtended: WallTypes.Rock,
				position: { x: 0, y: 0 },
				texCoord: mappings["rockwall"]
			}
			this.currSelected.classList.remove("le-button-selected");
			rockwall.classList.add("le-button-selected");
			this.currSelected = rockwall;
		}
		this.dom.append(rockwall);

		//###drzwi
		// lewe
		let ldoor = document.createElement("div");
		ldoor.classList.add("le-button");
		ldoor.style.backgroundImage = `url(${Texture})`;
		ldoor.style.backgroundPosition = `left ${-mappings["doorleft"].x}px top 0px`;
		ldoor.onclick = () => {
			this.currTemplate = {
				type: LevelElemType.Door,
				typeExtended: Directions.West,
				position: { x: 0, y: 0 },
				texCoord: mappings["doorleft"]
			}
			this.currSelected.classList.remove("le-button-selected");
			ldoor.classList.add("le-button-selected");
			this.currSelected = ldoor;
		}
		this.dom.append(ldoor);
		// prawe
		let rdoor = document.createElement("div");
		rdoor.classList.add("le-button");
		rdoor.style.backgroundImage = `url(${Texture})`;
		rdoor.style.backgroundPosition = `left ${-mappings["doorright"].x}px top 0px`;
		rdoor.onclick = () => {
			this.currTemplate = {
				type: LevelElemType.Door,
				typeExtended: Directions.East,
				position: { x: 0, y: 0 },
				texCoord: mappings["doorright"]
			}
			this.currSelected.classList.remove("le-button-selected");
			rdoor.classList.add("le-button-selected");
			this.currSelected = rdoor;
		}
		this.dom.append(rdoor);
		// góra
		let udoor = document.createElement("div");
		udoor.classList.add("le-button");
		udoor.style.backgroundImage = `url(${Texture})`;
		udoor.style.backgroundPosition = `left ${-mappings["doorup"].x}px top 0px`;
		udoor.onclick = () => {
			this.currTemplate = {
				type: LevelElemType.Door,
				typeExtended: Directions.North,
				position: { x: 0, y: 0 },
				texCoord: mappings["doorup"]
			}
			this.currSelected.classList.remove("le-button-selected");
			udoor.classList.add("le-button-selected");
			this.currSelected = udoor;
		}
		this.dom.append(udoor);
		// dół
		let ddoor = document.createElement("div");
		ddoor.classList.add("le-button");
		ddoor.style.backgroundImage = `url(${Texture})`;
		ddoor.style.backgroundPosition = `left ${-mappings["doordown"].x}px top 0px`;
		ddoor.onclick = () => {
			this.currTemplate = {
				type: LevelElemType.Door,
				typeExtended: Directions.South,
				position: { x: 0, y: 0 },
				texCoord: mappings["doordown"]
			}
			this.currSelected.classList.remove("le-button-selected");
			ddoor.classList.add("le-button-selected");
			this.currSelected = ddoor;
		}
		this.dom.append(ddoor);

		//###sekrety
		//lewe
		let lsecret = document.createElement("div");
		lsecret.classList.add("le-button");
		lsecret.style.backgroundImage = `url(${Texture})`;
		lsecret.style.backgroundPosition = `left ${-mappings["secretleft"].x}px top 0px`;
		lsecret.onclick = () => {
			this.currTemplate = {
				type: LevelElemType.Secret,
				typeExtended: Directions.West,
				position: { x: 0, y: 0 },
				texCoord: mappings["secretleft"]
			}
			this.currSelected.classList.remove("le-button-selected");
			lsecret.classList.add("le-button-selected");
			this.currSelected = lsecret;
		}
		this.dom.append(lsecret);
		//prawe
		let rsecret = document.createElement("div");
		rsecret.classList.add("le-button");
		rsecret.style.backgroundImage = `url(${Texture})`;
		rsecret.style.backgroundPosition = `left ${-mappings["secretright"].x}px top 0px`;
		rsecret.onclick = () => {
			this.currTemplate = {
				type: LevelElemType.Secret,
				typeExtended: Directions.East,
				position: { x: 0, y: 0 },
				texCoord: mappings["secretright"]
			}
			this.currSelected.classList.remove("le-button-selected");
			rsecret.classList.add("le-button-selected");
			this.currSelected = rsecret;
		}
		this.dom.append(rsecret);
		//góra
		let usecret = document.createElement("div");
		usecret.classList.add("le-button");
		usecret.style.backgroundImage = `url(${Texture})`;
		usecret.style.backgroundPosition = `left ${-mappings["secretup"].x}px top 0px`;
		usecret.onclick = () => {
			this.currTemplate = {
				type: LevelElemType.Secret,
				typeExtended: Directions.North,
				position: { x: 0, y: 0 },
				texCoord: mappings["secretup"]
			}
			this.currSelected.classList.remove("le-button-selected");
			usecret.classList.add("le-button-selected");
			this.currSelected = usecret;
		}
		this.dom.append(usecret);
		//dół
		let dsecret = document.createElement("div");
		dsecret.classList.add("le-button");
		dsecret.style.backgroundImage = `url(${Texture})`;
		dsecret.style.backgroundPosition = `left ${-mappings["secretdown"].x}px top 0px`;
		dsecret.onclick = () => {
			this.currTemplate = {
				type: LevelElemType.Secret,
				typeExtended: Directions.South,
				position: { x: 0, y: 0 },
				texCoord: mappings["secretdown"]
			}
			this.currSelected.classList.remove("le-button-selected");
			dsecret.classList.add("le-button-selected");
			this.currSelected = dsecret;
		}
		this.dom.append(dsecret);

		//###inne
		//znajdźka
		let collectible = document.createElement("div");
		collectible.classList.add("le-button");
		collectible.style.backgroundImage = `url(${Texture})`;
		collectible.style.backgroundPosition = `left ${-mappings["collectible"].x}px top 0px`;
		collectible.onclick = () => {
			this.currTemplate = {
				type: LevelElemType.Secret,
				typeExtended: Directions.South,
				position: { x: 0, y: 0 },
				texCoord: mappings["collectible"]
			}
			this.currSelected.classList.remove("le-button-selected");
			collectible.classList.add("le-button-selected");
			this.currSelected = collectible;
		}
		this.dom.append(collectible);
		//apteczka
		let medkit = document.createElement("div");
		medkit.classList.add("le-button");
		medkit.style.backgroundImage = `url(${Texture})`;
		medkit.style.backgroundPosition = `left ${-mappings["medkit"].x}px top 0px`;
		medkit.onclick = () => {
			this.currTemplate = {
				type: LevelElemType.Secret,
				typeExtended: Directions.South,
				position: { x: 0, y: 0 },
				texCoord: mappings["medkit"]
			}
			this.currSelected.classList.remove("le-button-selected");
			medkit.classList.add("le-button-selected");
			this.currSelected = medkit;
		}
		this.dom.append(medkit);
		//przeciwnik
		let enemy = document.createElement("div");
		enemy.classList.add("le-button");
		enemy.style.backgroundImage = `url(${Texture})`;
		enemy.style.backgroundPosition = `left ${-mappings["enemy"].x}px top 0px`;
		enemy.onclick = () => {
			this.currTemplate = {
				type: LevelElemType.Secret,
				typeExtended: Directions.South,
				position: { x: 0, y: 0 },
				texCoord: mappings["enemy"]
			}
			this.currSelected.classList.remove("le-button-selected");
			enemy.classList.add("le-button-selected");
			this.currSelected = enemy;
		}
		this.dom.append(enemy);
	}

	getNewLevelElem(pos: Vec2Interface) {
		let elem = JSON.parse(JSON.stringify(this.currTemplate));
		if (elem)
			elem.position = pos;
		return elem;
	}
}