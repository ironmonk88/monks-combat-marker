import { MonksLittleDetails, i18n } from "./monks-little-details.js";

export const registerSettings = function () {
    // Register any custom module settings here
	let modulename = "monks-combat-marker";

	const debouncedReload = foundry.utils.debounce(function () { window.location.reload(); }, 500);

	let animation = {
		'none': i18n("MonksCombatMarker.animation.none"),
		'clockwise': i18n("MonksCombatMarker.animation.clockwise"),
		'counterclockwise': i18n("MonksCombatMarker.animation.counterclockwise"),
		'pulse': i18n("MonksCombatMarker.animation.pulse"),
		'fadeout': i18n("MonksCombatMarker.animation.fadeout"),
		'fadein': i18n("MonksCombatMarker.animation.fadein")
	};

	//Combat Token Highlight
	game.settings.register(modulename, "token-combat-highlight", {
		name: i18n("MonksCombatMarker.token-combat-highlight.name"),
		hint: i18n("MonksCombatMarker.token-combat-highlight.hint"),
		scope: "world",
		config: true,
		default: true,
		type: Boolean
	});
	game.settings.register(modulename, "token-highlight-remove", {
		name: i18n("MonksBloodsplats.token-highlight-remove.name"),
		hint: i18n("MonksBloodsplats.token-highlight-remove.hint"),
		scope: "world",
		config: true,
		default: false,
		type: Boolean
	});
	game.settings.register(modulename, "token-highlight-animate", {
		name: i18n("MonksBloodsplats.token-highlight-animate.name"),
		hint: i18n("MonksBloodsplats.token-highlight-animate.hint"),
		scope: "world",
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
		name: i18n("MonksBloodsplats.token-highlight-picture.name"),
		hint: i18n("MonksBloodsplats.token-highlight-picture.hint"),
		scope: "world",
		config: true,
		default: "modules/monks-combat-marker/markers/marker02.webp",
		type: String,
		//filePicker: true,
		onChange: debouncedReload
	});
	game.settings.register(modulename, "token-highlight-picture-hostile", {
		name: i18n("MonksBloodsplats.token-highlight-picture-hostile.name"),
		hint: i18n("MonksBloodsplats.token-highlight-picture-hostile.hint"),
		scope: "world",
		config: true,
		default: "modules/monks-combat-marker/markers/marker01.webp",
		type: String,
		//filePicker: true,
		onChange: debouncedReload
	});
	game.settings.register(modulename, "token-highlight-scale", {
		name: i18n("MonksBloodsplats.token-highlight-scale.name"),
		hint: i18n("MonksBloodsplats.token-highlight-scale.hint"),
		scope: "world",
		config: true,
		default: 1.5,
		type: Number,
		range: {
			min: 1,
			max: 2,
			step: 0.1
		},
		onChange: debouncedReload
	});
	game.settings.register(modulename, "token-combat-animation", {
		name: i18n("MonksBloodsplats.token-combat-animation.name"),
		hint: i18n("MonksBloodsplats.token-combat-animation.hint"),
		scope: "world",
		default: 'clockwise',
		type: String,
		choices: animation,
		config: true
	});
	game.settings.register(modulename, "token-combat-animation-hostile", {
		name: i18n("MonksBloodsplats.token-combat-animation-hostile.name"),
		hint: i18n("MonksBloodsplats.token-combat-animation-hostile.hint"),
		scope: "world",
		default: 'clockwise',
		type: String,
		choices: animation,
		config: true
	});
};
