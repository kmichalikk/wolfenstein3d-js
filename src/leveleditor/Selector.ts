//@ts-ignore
import { CollectibleTypes, Directions, LevelElem, LevelElemType, Vec2Interface, WallTypes } from '../utils';
//@ts-ignore
import Texture from './textures/texture.png';
//@ts-ignore
import EraserTex from './textures/erase.png';
//@ts-ignore
import mappings from "./textures/mappings.json";

export default class Selector {
	dom: HTMLDivElement;
	currSelected: HTMLDivElement;
	currTemplate: (LevelElem | null) = null;
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

		//###gracz
		let you = document.createElement("div");
		this.currSelected = you;
		you.classList.add("le-button");
		you.style.backgroundImage = `url(${Texture})`;
		you.style.backgroundPosition = `left ${-mappings["you"].x}px top 0px`;
		you.onclick = () => {
			this.currTemplate = {
				type: LevelElemType.Player,
				config: {},
				position: { x: 0, y: 0 },
				texCoord: mappings["you"]
			};
			this.currSelected.classList.remove("le-button-selected");
			you.classList.add("le-button-selected");
			this.currSelected = you;
		}
		this.dom.append(you);

		//###drzwi
		let door = document.createElement("div");
		door.classList.add("le-button");
		door.style.backgroundImage = `url(${Texture})`;
		door.style.backgroundPosition = `left ${-mappings["door"].x}px top 0px`;
		door.onclick = () => {
			this.currTemplate = {
				type: LevelElemType.Door,
				config: {},
				position: { x: 0, y: 0 },
				texCoord: mappings["door"]
			}
			this.currSelected.classList.remove("le-button-selected");
			door.classList.add("le-button-selected");
			this.currSelected = door;
		}
		this.dom.append(door);

		//###ściana z kostki
		let brickwall = document.createElement("div");
		this.currSelected = brickwall;
		brickwall.classList.add("le-button", "le-button-selected");
		brickwall.style.backgroundImage = `url(${Texture})`;
		brickwall.style.backgroundPosition = `left ${-mappings["brickwall"].x}px top 0px`;
		brickwall.onclick = () => {
			this.currTemplate = {
				type: LevelElemType.Wall,
				config: { wallType: WallTypes.Brick },
				position: { x: 0, y: 0 },
				texCoord: mappings["brickwall"]
			}
			this.currSelected.classList.remove("le-button-selected");
			brickwall.classList.add("le-button-selected");
			this.currSelected = brickwall;
		}
		brickwall.click();
		this.dom.append(brickwall);
		//###ściana z kostki - sekrety
		let brickwallLeftSecret = document.createElement("div");
		brickwallLeftSecret.classList.add("le-button");
		brickwallLeftSecret.style.backgroundImage = `url(${Texture})`;
		brickwallLeftSecret.style.backgroundPosition = `left ${-mappings["brickwall-secret-left"].x}px top 0px`;
		brickwallLeftSecret.onclick = () => {
			this.currTemplate = {
				type: LevelElemType.Secret,
				config: { wallType: WallTypes.Brick, direction: Directions.West },
				position: { x: 0, y: 0 },
				texCoord: mappings["brickwall-secret-left"]
			}
			this.currSelected.classList.remove("le-button-selected");
			brickwallLeftSecret.classList.add("le-button-selected");
			this.currSelected = brickwallLeftSecret;
		}
		this.dom.append(brickwallLeftSecret);
		let brickwallRightSecret = document.createElement("div");
		brickwallRightSecret.classList.add("le-button");
		brickwallRightSecret.style.backgroundImage = `url(${Texture})`;
		brickwallRightSecret.style.backgroundPosition = `left ${-mappings["brickwall-secret-right"].x}px top 0px`;
		brickwallRightSecret.onclick = () => {
			this.currTemplate = {
				type: LevelElemType.Secret,
				config: { wallType: WallTypes.Brick, direction: Directions.East },
				position: { x: 0, y: 0 },
				texCoord: mappings["brickwall-secret-right"]
			}
			this.currSelected.classList.remove("le-button-selected");
			brickwallRightSecret.classList.add("le-button-selected");
			this.currSelected = brickwallRightSecret;
		}
		this.dom.append(brickwallRightSecret);
		let brickwallSecretTop = document.createElement("div");
		brickwallSecretTop.classList.add("le-button");
		brickwallSecretTop.style.backgroundImage = `url(${Texture})`;
		brickwallSecretTop.style.backgroundPosition = `left ${-mappings["brickwall-secret-top"].x}px top 0px`;
		brickwallSecretTop.onclick = () => {
			this.currTemplate = {
				type: LevelElemType.Secret,
				config: { wallType: WallTypes.Brick, direction: Directions.North },
				position: { x: 0, y: 0 },
				texCoord: mappings["brickwall-secret-top"]
			}
			this.currSelected.classList.remove("le-button-selected");
			brickwallSecretTop.classList.add("le-button-selected");
			this.currSelected = brickwallSecretTop;
		}
		this.dom.append(brickwallSecretTop);
		let brickwallSecretBottom = document.createElement("div");
		brickwallSecretBottom.classList.add("le-button");
		brickwallSecretBottom.style.backgroundImage = `url(${Texture})`;
		brickwallSecretBottom.style.backgroundPosition = `left ${-mappings["brickwall-secret-bottom"].x}px top 0px`;
		brickwallSecretBottom.onclick = () => {
			this.currTemplate = {
				type: LevelElemType.Secret,
				config: { wallType: WallTypes.Brick, direction: Directions.South },
				position: { x: 0, y: 0 },
				texCoord: mappings["brickwall-secret-bottom"]
			}
			this.currSelected.classList.remove("le-button-selected");
			brickwallSecretBottom.classList.add("le-button-selected");
			this.currSelected = brickwallSecretBottom;
		}
		this.dom.append(brickwallSecretBottom);

		//###ściana z desek
		let woodwall = document.createElement("div");
		woodwall.classList.add("le-button");
		woodwall.style.backgroundImage = `url(${Texture})`;
		woodwall.style.backgroundPosition = `left ${-mappings["woodwall"].x}px top 0px`;
		woodwall.onclick = () => {
			this.currTemplate = {
				type: LevelElemType.Wall,
				config: { wallType: WallTypes.Wood },
				position: { x: 0, y: 0 },
				texCoord: mappings["woodwall"]
			}
			this.currSelected.classList.remove("le-button-selected");
			woodwall.classList.add("le-button-selected");
			this.currSelected = woodwall;
		}
		this.dom.append(woodwall);
		//###ściana z desek - sekrety
		let woodwallLeftSecret = document.createElement("div");
		woodwallLeftSecret.classList.add("le-button");
		woodwallLeftSecret.style.backgroundImage = `url(${Texture})`;
		woodwallLeftSecret.style.backgroundPosition = `left ${-mappings["woodwall-secret-left"].x}px top 0px`;
		woodwallLeftSecret.onclick = () => {
			this.currTemplate = {
				type: LevelElemType.Secret,
				config: { wallType: WallTypes.Wood, direction: Directions.West },
				position: { x: 0, y: 0 },
				texCoord: mappings["woodwall-secret-left"]
			}
			this.currSelected.classList.remove("le-button-selected");
			woodwallLeftSecret.classList.add("le-button-selected");
			this.currSelected = woodwallLeftSecret;
		}
		this.dom.append(woodwallLeftSecret);
		let woodwallRightSecret = document.createElement("div");
		woodwallRightSecret.classList.add("le-button");
		woodwallRightSecret.style.backgroundImage = `url(${Texture})`;
		woodwallRightSecret.style.backgroundPosition = `left ${-mappings["woodwall-secret-right"].x}px top 0px`;
		woodwallRightSecret.onclick = () => {
			this.currTemplate = {
				type: LevelElemType.Secret,
				config: { wallType: WallTypes.Wood, direction: Directions.East },
				position: { x: 0, y: 0 },
				texCoord: mappings["woodwall-secret-right"]
			}
			this.currSelected.classList.remove("le-button-selected");
			woodwallRightSecret.classList.add("le-button-selected");
			this.currSelected = woodwallRightSecret;
		}
		this.dom.append(woodwallRightSecret);
		let woodwallSecretTop = document.createElement("div");
		woodwallSecretTop.classList.add("le-button");
		woodwallSecretTop.style.backgroundImage = `url(${Texture})`;
		woodwallSecretTop.style.backgroundPosition = `left ${-mappings["woodwall-secret-top"].x}px top 0px`;
		woodwallSecretTop.onclick = () => {
			this.currTemplate = {
				type: LevelElemType.Secret,
				config: { wallType: WallTypes.Wood, direction: Directions.North },
				position: { x: 0, y: 0 },
				texCoord: mappings["woodwall-secret-top"]
			}
			this.currSelected.classList.remove("le-button-selected");
			woodwallSecretTop.classList.add("le-button-selected");
			this.currSelected = woodwallSecretTop;
		}
		this.dom.append(woodwallSecretTop);
		let woodwallSecretBottom = document.createElement("div");
		woodwallSecretBottom.classList.add("le-button");
		woodwallSecretBottom.style.backgroundImage = `url(${Texture})`;
		woodwallSecretBottom.style.backgroundPosition = `left ${-mappings["woodwall-secret-bottom"].x}px top 0px`;
		woodwallSecretBottom.onclick = () => {
			this.currTemplate = {
				type: LevelElemType.Secret,
				config: { wallType: WallTypes.Wood, direction: Directions.South },
				position: { x: 0, y: 0 },
				texCoord: mappings["woodwall-secret-bottom"]
			}
			this.currSelected.classList.remove("le-button-selected");
			woodwallSecretBottom.classList.add("le-button-selected");
			this.currSelected = woodwallSecretBottom;
		}
		this.dom.append(woodwallSecretBottom);

		//###ściana z kamieni
		let rockwall = document.createElement("div");
		rockwall.classList.add("le-button");
		rockwall.style.backgroundImage = `url(${Texture})`;
		rockwall.style.backgroundPosition = `left ${-mappings["rockwall"].x}px top 0px`;
		rockwall.onclick = () => {
			this.currTemplate = {
				type: LevelElemType.Wall,
				config: { wallType: WallTypes.Rock },
				position: { x: 0, y: 0 },
				texCoord: mappings["rockwall"]
			}
			this.currSelected.classList.remove("le-button-selected");
			rockwall.classList.add("le-button-selected");
			this.currSelected = rockwall;
		}
		this.dom.append(rockwall);
		//###ściana z kamieni - sekrety
		let rockwallLeftSecret = document.createElement("div");
		rockwallLeftSecret.classList.add("le-button");
		rockwallLeftSecret.style.backgroundImage = `url(${Texture})`;
		rockwallLeftSecret.style.backgroundPosition = `left ${-mappings["rockwall-secret-left"].x}px top 0px`;
		rockwallLeftSecret.onclick = () => {
			this.currTemplate = {
				type: LevelElemType.Secret,
				config: { wallType: WallTypes.Rock, direction: Directions.West },
				position: { x: 0, y: 0 },
				texCoord: mappings["rockwall-secret-left"]
			}
			this.currSelected.classList.remove("le-button-selected");
			rockwallLeftSecret.classList.add("le-button-selected");
			this.currSelected = rockwallLeftSecret;
		}
		this.dom.append(rockwallLeftSecret);
		let rockwallRightSecret = document.createElement("div");
		rockwallRightSecret.classList.add("le-button");
		rockwallRightSecret.style.backgroundImage = `url(${Texture})`;
		rockwallRightSecret.style.backgroundPosition = `left ${-mappings["rockwall-secret-right"].x}px top 0px`;
		rockwallRightSecret.onclick = () => {
			this.currTemplate = {
				type: LevelElemType.Secret,
				config: { wallType: WallTypes.Rock, direction: Directions.East },
				position: { x: 0, y: 0 },
				texCoord: mappings["rockwall-secret-right"]
			}
			this.currSelected.classList.remove("le-button-selected");
			rockwallRightSecret.classList.add("le-button-selected");
			this.currSelected = rockwallRightSecret;
		}
		this.dom.append(rockwallRightSecret);
		let rockwallSecretTop = document.createElement("div");
		rockwallSecretTop.classList.add("le-button");
		rockwallSecretTop.style.backgroundImage = `url(${Texture})`;
		rockwallSecretTop.style.backgroundPosition = `left ${-mappings["rockwall-secret-top"].x}px top 0px`;
		rockwallSecretTop.onclick = () => {
			this.currTemplate = {
				type: LevelElemType.Secret,
				config: { wallType: WallTypes.Rock, direction: Directions.North },
				position: { x: 0, y: 0 },
				texCoord: mappings["rockwall-secret-top"]
			}
			this.currSelected.classList.remove("le-button-selected");
			rockwallSecretTop.classList.add("le-button-selected");
			this.currSelected = rockwallSecretTop;
		}
		this.dom.append(rockwallSecretTop);
		let rockwallSecretBottom = document.createElement("div");
		rockwallSecretBottom.classList.add("le-button");
		rockwallSecretBottom.style.backgroundImage = `url(${Texture})`;
		rockwallSecretBottom.style.backgroundPosition = `left ${-mappings["rockwall-secret-bottom"].x}px top 0px`;
		rockwallSecretBottom.onclick = () => {
			this.currTemplate = {
				type: LevelElemType.Secret,
				config: { wallType: WallTypes.Rock, direction: Directions.South },
				position: { x: 0, y: 0 },
				texCoord: mappings["rockwall-secret-bottom"]
			}
			this.currSelected.classList.remove("le-button-selected");
			rockwallSecretBottom.classList.add("le-button-selected");
			this.currSelected = rockwallSecretBottom;
		}
		this.dom.append(rockwallSecretBottom);
		//###inne
		//znajdźka
		let collectible = document.createElement("div");
		collectible.classList.add("le-button");
		collectible.style.backgroundImage = `url(${Texture})`;
		collectible.style.backgroundPosition = `left ${-mappings["collectible-gold"].x}px top 0px`;
		collectible.onclick = () => {
			this.currTemplate = {
				type: LevelElemType.Collectible,
				config: { collectibleType: CollectibleTypes.Gold },
				position: { x: 0, y: 0 },
				texCoord: mappings["collectible-gold"]
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
		medkit.style.backgroundPosition = `left ${-mappings["collectible-medkit"].x}px top 0px`;
		medkit.onclick = () => {
			this.currTemplate = {
				type: LevelElemType.Collectible,
				config: { collectibleType: CollectibleTypes.Medkit },
				position: { x: 0, y: 0 },
				texCoord: mappings["collectible-medkit"]
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
				type: LevelElemType.Enemy,
				config: {},
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