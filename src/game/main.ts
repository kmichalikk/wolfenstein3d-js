import Renderer from './renderer';
import { Vec2, Weapons } from '../utils';
// @ts-ignore
import level from '../../levels/1.json';

import "./style.css";
let renderer = new Renderer(new Vec2(360, 240));

let container = document.createElement("div");
container.classList.add("game-container");
document.body.append(container);
container.append(renderer.canvas);

let infoBar = document.createElement("div");
infoBar.classList.add('info-bar');
container.append(infoBar);

let infoLevel = document.createElement("div");
infoLevel.classList.add('info-tile', 'info-level');
infoLevel.innerHTML = "<b>LEVEL</b>1";
addEventListener("levelChanged", ((e: CustomEvent) => {
	infoLevel.innerHTML = "<b>LEVEL</b>" + e.detail;
}) as EventListener);
infoBar.append(infoLevel);

let infoScore = document.createElement("div");
infoScore.classList.add('info-tile', 'info-score');
infoScore.innerHTML = "<b>SCORE</b>0";
addEventListener("scoreChanged", ((e: CustomEvent) => {
	infoScore.innerHTML = "<b>SCORE</b>" + e.detail;
}) as EventListener);
infoBar.append(infoScore);

let infoLives = document.createElement("div");
infoLives.classList.add('info-tile', 'info-lives');
infoLives.innerHTML = "<b>LIVES</b>3";
addEventListener("livesChanged", ((e: CustomEvent) => {
	infoLives.innerHTML = "<b>LIVES</b>" + e.detail;
}) as EventListener);
infoBar.append(infoLives);

let infoFace = document.createElement("div");
infoFace.classList.add('info-tile', 'info-face');
infoBar.append(infoFace);

let infoHealth = document.createElement("div");
infoHealth.classList.add('info-tile', 'info-health');
infoHealth.innerHTML = "<b>HEALTH</b>100%";
addEventListener("healthChanged", ((e: CustomEvent) => {
	infoHealth.innerHTML = "<b>HEALTH</b>" + e.detail + "%";
}) as EventListener);
infoBar.append(infoHealth);

let infoAmmo = document.createElement("div");
infoAmmo.classList.add('info-tile', 'info-ammo');
infoAmmo.innerHTML = "<b>AMMO</b>8";
addEventListener("ammoChanged", ((e: CustomEvent) => {
	infoAmmo.innerHTML = "<b>AMMO</b>" + e.detail;
}) as EventListener);
infoBar.append(infoAmmo);

let infoWeapon = document.createElement("div");
infoWeapon.classList.add('info-tile', 'info-weapon');
infoWeapon.innerHTML = "<b>PISTOL</b>";
addEventListener("weaponChanged", ((e: CustomEvent) => {
	switch (e.detail) {
		case Weapons.Knife:
			infoWeapon.innerHTML = "KNIFE"; break;
		case Weapons.Pistol:
			infoWeapon.innerHTML = "PISTOL"; break;
		case Weapons.Rifle:
			infoWeapon.innerHTML = "RIFLE"; break;
		case Weapons.Machinegun:
			infoWeapon.innerHTML = "MACHINEGUN"; break;
	}
}) as EventListener);
infoBar.append(infoWeapon);

renderer.loadLevel(level);
renderer.startGameLoop();