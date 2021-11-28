import Renderer from './renderer';
import { Vec2 } from '../utils';
// @ts-ignore
import level from '../../levels/1.json';

import "./style.css";
let renderer = new Renderer(new Vec2(360, 240));
document.body.append(renderer.canvas);
renderer.loadLevel(level);
renderer.startGameLoop();