import Renderer from './renderer';
import { Vec2 } from '../utils';
// @ts-ignore
import img from './gfx/texture.png';
// @ts-ignore
import level from '../../levels/1.json';

import "./style.css";

let texture = new Image;
texture.src = img;
texture.onload = () => {
	let renderer = new Renderer(new Vec2(360, 240), texture);
	document.body.append(renderer.canvas);
	renderer.loadLevel(level);
	renderer.startGameLoop();
}