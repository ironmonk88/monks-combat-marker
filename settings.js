import { MonksCombatMarker, i18n } from "./monks-combat-marker.js";

export const registerSettings = function () {
    // Register any custom module settings here
	let modulename = "monks-combat-marker";

	let animation = {
		'none': i18n("MonksCombatMarker.animation.none"),
		'clockwise': i18n("MonksCombatMarker.animation.clockwise"),
		'counterclockwise': i18n("MonksCombatMarker.animation.counterclockwise"),
		'pulse': i18n("MonksCombatMarker.animation.pulse"),
		'fadeout': i18n("MonksCombatMarker.animation.fadeout"),
		'fadein': i18n("MonksCombatMarker.animation.fadein")
	};

	//Combat Token Highlight
	game.settings.register(modulename, "token-highlight-remove", {
		name: i18n("MonksCombatMarker.token-highlight-remove.name"),
		hint: i18n("MonksCombatMarker.token-highlight-remove.hint"),
		scope: "world",
		config: true,
		default: false,
		type: Boolean
	});
	game.settings.register(modulename, "token-highlight-animate", {
		name: i18n("MonksCombatMarker.token-highlight-animate.name"),
		hint: i18n("MonksCombatMarker.token-highlight-animate.hint"),
		scope: "client",
		config: true,
		default: 100,
		type: Number,
		range: {
			min: 0,
			max: 1000,
			step: 10
		}
	});
	game.settings.register(modulename, "token-highlight-picture", {
		name: i18n("MonksCombatMarker.token-highlight-picture.name"),
		hint: i18n("MonksCombatMarker.token-highlight-picture.hint"),
		scope: "world",
		config: true,
		default: "modules/monks-combat-marker/markers/marker02.webp",
		type: String,
		//filePicker: true,
		requiresReload: true
	});
	game.settings.register(modulename, "token-highlight-picture-hostile", {
		name: i18n("MonksCombatMarker.token-highlight-picture-hostile.name"),
		hint: i18n("MonksCombatMarker.token-highlight-picture-hostile.hint"),
		scope: "world",
		config: true,
		default: "modules/monks-combat-marker/markers/marker01.webp",
		type: String,
		//filePicker: true,
		requiresReload: true
	});
	game.settings.register(modulename, "token-highlight-picture-neutral", {
		name: i18n("MonksCombatMarker.token-highlight-picture-neutral.name"),
		hint: i18n("MonksCombatMarker.token-highlight-picture-neutral.hint"),
		scope: "world",
		config: true,
		default: "modules/monks-combat-marker/markers/marker05.webp",
		type: String,
		//filePicker: true,
		requiresReload: true
	});
	game.settings.register(modulename, "token-highlight-scale", {
		name: i18n("MonksCombatMarker.token-highlight-scale.name"),
		hint: i18n("MonksCombatMarker.token-highlight-scale.hint"),
		scope: "world",
		config: true,
		default: 1.5,
		type: Number,
		range: {
			min: 1,
			max: 2,
			step: 0.1
		},
		requiresReload: true
	});
	game.settings.register(modulename, "token-combat-animation", {
		name: i18n("MonksCombatMarker.token-combat-animation.name"),
		hint: i18n("MonksCombatMarker.token-combat-animation.hint"),
		scope: "world",
		default: 'clockwise',
		type: String,
		choices: animation,
		config: true
	});
	game.settings.register(modulename, "token-combat-animation-hostile", {
		name: i18n("MonksCombatMarker.token-combat-animation-hostile.name"),
		hint: i18n("MonksCombatMarker.token-combat-animation-hostile.hint"),
		scope: "world",
		default: 'clockwise',
		type: String,
		choices: animation,
		config: true
	});
	game.settings.register(modulename, "token-combat-animation-neutral", {
		name: i18n("MonksCombatMarker.token-combat-animation-neutral.name"),
		hint: i18n("MonksCombatMarker.token-combat-animation-neutral.hint"),
		scope: "world",
		default: 'clockwise',
		type: String,
		choices: animation,
		config: true
	});

	game.settings.register(modulename, "transfer-settings", {
		scope: "world",
		config: false,
		default: false,
	});
};
