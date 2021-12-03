import './style.css';
//@ts-ignore
import Texture from '../gfx/texture.png';
//@ts-ignore
import Mappings from '../gfx/env_mappings.json';
import { CollectibleTypes, Directions, LevelElem, LevelElemType, Vec2, Vec2Interface, WallTypes } from '../utils';

export default class Selectors {
	objects: LevelElem[] = [];
	DOM: HTMLDivElement;

	constructor() {
		this.DOM = document.createElement("div");
		this.DOM.classList.add('le-selector');

		for (let [k, o] of Object.entries(Mappings)) {
			switch (k) {
				case 'woodwall':
				case 'brickwall':
				case 'rockwall':
					this.objects.push({
						type: LevelElemType.Wall,
						config: {},
						position: { x: 0, y: 0 },
						texCoords: [o as Vec2Interface, o as Vec2Interface, o as Vec2Interface, o as Vec2Interface],
						collidable: true
					});
					break;
				case 'doors':
					this.objects.push({
						type: LevelElemType.Door,
						config: {
							openness: 0,
							perpOffset: 0.5
						},
						position: { x: 0, y: 0 },
						texCoords: [o as Vec2Interface, o as Vec2Interface, o as Vec2Interface, o as Vec2Interface],
						collidable: true
					});
					break;
				case 'barrel':
				case 'table-set':
				case 'column':
				case 'washbasin':
				case 'dry-plant':
				case 'plant':
				case 'pot':
				case 'armor':
				case 'bed':
				case 'wooden-barrel':
				case 'well-full':
				case 'well-empty':
				case 'furnace':
					this.objects.push({
						type: LevelElemType.ObjectCollidable,
						config: {},
						position: { x: 0, y: 0 },
						texCoords: [o as Vec2Interface],
						collidable: true
					});
					break;
				case 'beam-of-light':
				case 'chandelier':
				case 'skeleton-hanging':
				case 'dog-food':
				case 'skeleton-lying':
				case 'lamp':
				case 'kitchen':
				case 'empty-cage':
				case 'skeleton-cage':
				case 'bones':
				case 'bucket':
				case 'skeleton-flesh':
				case 'blood':
				case 'flag':
				case 'powder1':
				case 'powder2':
				case 'powder3':
				case 'kitchen2':
				case 'spears':
				case 'vine':
					this.objects.push({
						type: LevelElemType.ObjectNonCollidable,
						config: {},
						position: { x: 0, y: 0 },
						texCoords: [o as Vec2Interface],
						collidable: false
					});
					break;
				case 'health-sm':
					this.objects.push({
						type: LevelElemType.Collectible,
						config: {
							typeExtended: CollectibleTypes.HealthSm
						},
						position: { x: 0, y: 0 },
						texCoords: [o as Vec2Interface],
						collidable: false
					});
					break;
				case 'health-lg':
					this.objects.push({
						type: LevelElemType.Collectible,
						config: {
							typeExtended: CollectibleTypes.HealthLg
						},
						position: { x: 0, y: 0 },
						texCoords: [o as Vec2Interface],
						collidable: false
					});
					break;
				case 'ammo':
					this.objects.push({
						type: LevelElemType.Collectible,
						config: {
							typeExtended: CollectibleTypes.Ammo
						},
						position: { x: 0, y: 0 },
						texCoords: [o as Vec2Interface],
						collidable: false
					});
					break;
				case 'rifle':
					this.objects.push({
						type: LevelElemType.Collectible,
						config: {
							typeExtended: CollectibleTypes.Rifle
						},
						position: { x: 0, y: 0 },
						texCoords: [o as Vec2Interface],
						collidable: false
					});
					break;
				case 'machinegun':
					this.objects.push({
						type: LevelElemType.Collectible,
						config: {
							typeExtended: CollectibleTypes.Machinegun
						},
						position: { x: 0, y: 0 },
						texCoords: [o as Vec2Interface],
						collidable: false
					});
					break;
				case 'gold1':
				case 'gold2':
				case 'gold3':
				case 'gold4':
					this.objects.push({
						type: LevelElemType.Collectible,
						config: {
							typeExtended: CollectibleTypes.Gold
						},
						position: { x: 0, y: 0 },
						texCoords: [o as Vec2Interface],
						collidable: false
					});
					break;
				case 'life':
					this.objects.push({
						type: LevelElemType.Collectible,
						config: {
							typeExtended: CollectibleTypes.Life
						},
						position: { x: 0, y: 0 },
						texCoords: [o as Vec2Interface],
						collidable: false
					});
					break;
				case 'key-yellow':
				case 'key-blue':
					this.objects.push({
						type: LevelElemType.Collectible,
						config: {
							typeExtended: CollectibleTypes.Other
						},
						position: { x: 0, y: 0 },
						texCoords: [o as Vec2Interface],
						collidable: false
					});
					break;
				case 'you':
					this.objects.push({
						type: LevelElemType.Player,
						config: {},
						position: { x: 0, y: 0 },
						texCoords: [o as Vec2Interface],
						collidable: false
					});
					break;
			}
		}

		for (let obj of this.objects) {
			let div = document.createElement("div");
			div.classList.add('le-button');
			div.style.backgroundImage = `url(${Texture})`;
			div.style.backgroundPosition = `left ${-obj.texCoords[0].x}px top ${-obj.texCoords[0].y}px`;
			div.onclick = () => {
				this.DOM.childNodes.forEach(el => (el as HTMLDivElement).classList.remove("le-button-selected"));
				div.classList.add("le-button-selected");
				dispatchEvent(new CustomEvent('selectorChanged', { detail: obj }))
			}
			this.DOM.append(div);
		}
	}
}