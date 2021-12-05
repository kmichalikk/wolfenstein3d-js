//@ts-ignore
import BackgroundSound from './sounds/background.mp3';
//@ts-ignore
import CollectGunSound from './sounds/collectgun.mp3';
//@ts-ignore
import DeathSound from './sounds/death.wav';
//@ts-ignore
import DogAttackSound from './sounds/dog-attack.wav';
//@ts-ignore
import DogDeathSound from './sounds/dog-death.wav';
//@ts-ignore
import DoorSlideSound from './sounds/doorslide.wav';
//@ts-ignore
import GunSound from './sounds/gun.mp3';
//@ts-ignore
import HealSound from './sounds/heal.wav';
//@ts-ignore
import InteractSound from './sounds/interact.wav';
//@ts-ignore
import KnifeSound from './sounds/knife.wav';
//@ts-ignore
import Money1Sound from './sounds/money1.wav';
//@ts-ignore
import Money2Sound from './sounds/money2.wav';
export default class AudioManager {
	backgroundAudio: HTMLAudioElement;
	collectGunAudio: HTMLAudioElement;
	deathAudio: HTMLAudioElement;
	dogAttackAudio: HTMLAudioElement;
	dogDeathAudio: HTMLAudioElement;
	doorSlideAudio: HTMLAudioElement;
	gunAudio: HTMLAudioElement;
	healAudio: HTMLAudioElement;
	interactAudio: HTMLAudioElement;
	knifeAudio: HTMLAudioElement;
	money1Audio: HTMLAudioElement;
	money2Audio: HTMLAudioElement;
	constructor() {
		this.backgroundAudio = document.createElement("audio");
		this.backgroundAudio.src = BackgroundSound;
		this.backgroundAudio.loop = true;
		addEventListener("playBackgroundSound", (() => {
			this.backgroundAudio.currentTime = 0;
			this.backgroundAudio.play();
		}) as EventListener);
		addEventListener("stopBackgroundSound", (() => {
			this.backgroundAudio.pause();
		}) as EventListener);

		this.collectGunAudio = document.createElement("audio");
		this.collectGunAudio.src = CollectGunSound;
		addEventListener("playCollectGunSound", (() => {
			this.collectGunAudio.currentTime = 0;
			this.collectGunAudio.play();
		}) as EventListener);

		this.deathAudio = document.createElement("audio");
		this.deathAudio.src = DeathSound;
		addEventListener("playDeathSound", (() => {
			this.deathAudio.currentTime = 0;
			this.deathAudio.play();
		}) as EventListener);

		this.dogAttackAudio = document.createElement("audio");
		this.dogAttackAudio.src = DogAttackSound;
		addEventListener("playDogAttackSound", (() => {
			this.dogAttackAudio.currentTime = 0;
			this.dogAttackAudio.play();
		}) as EventListener);

		this.dogDeathAudio = document.createElement("audio");
		this.dogDeathAudio.src = DogDeathSound;
		addEventListener("playDogDeathSound", (() => {
			this.dogDeathAudio.currentTime = 0;
			this.dogDeathAudio.play();
		}) as EventListener);

		this.doorSlideAudio = document.createElement("audio");
		this.doorSlideAudio.src = DoorSlideSound;
		addEventListener("playDoorSlideSound", (() => {
			this.doorSlideAudio.currentTime = 0;
			this.doorSlideAudio.play();
		}) as EventListener);

		this.gunAudio = document.createElement("audio");
		this.gunAudio.src = GunSound;
		addEventListener("playGunSound", (() => {
			this.gunAudio.currentTime = 0;
			this.gunAudio.play();
		}) as EventListener);

		this.healAudio = document.createElement("audio");
		this.healAudio.src = HealSound;
		addEventListener("playHealSound", (() => {
			this.healAudio.currentTime = 0;
			this.healAudio.play();
		}) as EventListener);

		this.interactAudio = document.createElement("audio");
		this.interactAudio.src = InteractSound;
		addEventListener("playInteractSound", (() => {
			this.interactAudio.currentTime = 0;
			this.interactAudio.play();
		}) as EventListener);

		this.knifeAudio = document.createElement("audio");
		this.knifeAudio.src = KnifeSound;
		addEventListener("playKnifeSound", (() => {
			this.knifeAudio.currentTime = 0;
			this.knifeAudio.play();
		}) as EventListener);

		this.money1Audio = document.createElement("audio");
		this.money1Audio.src = Money1Sound;
		addEventListener("playMoney1Sound", (() => {
			this.money1Audio.currentTime = 0;
			this.money1Audio.play();
		}) as EventListener);

		this.money2Audio = document.createElement("audio");
		this.money2Audio.src = Money2Sound;
		addEventListener("playMoney2Sound", (() => {
			this.money2Audio.currentTime = 0;
			this.money2Audio.play();
		}) as EventListener);
	}
}