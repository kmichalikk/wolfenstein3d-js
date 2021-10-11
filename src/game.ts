import { Renderer } from './renderer';
import { Vec2 } from './utils';
// @ts-ignore
import img from './gfx/texture.png';

document.body.style.backgroundColor = "gray";

let texture = new Image;
texture.src = img;
texture.onload = () => {
	let renderer = new Renderer(new Vec2(480, 320), texture);
	document.body.append(renderer.getDOM());

	fetch('../../levels/1.json')
		.then(res => res.json())
		.then(data => {
			renderer.loadLevel(data);
			renderer.startGameLoop();
		})

}