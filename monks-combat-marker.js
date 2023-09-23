import { registerSettings } from "./settings.js";

export let debugEnabled = 0;

export let debug = (...args) => {
    if (debugEnabled > 1) console.log("DEBUG: monks-combat-marker | ", ...args);
};
export let log = (...args) => console.log("monks-combat-marker | ", ...args);
export let warn = (...args) => {
    if (debugEnabled > 0) console.warn("WARN: monks-combat-marker | ", ...args);
};
export let error = (...args) => console.error("monks-combat-marker | ", ...args);

export const setDebugLevel = (debugText) => {
    debugEnabled = { none: 0, warn: 1, debug: 2, all: 3 }[debugText] || 0;
    // 0 = none, warnings = 1, debug = 2, all = 3
    if (debugEnabled >= 3)
        CONFIG.debug.hooks = true;
};

export let i18n = key => {
    return game.i18n.localize(key);
};
export let setting = key => {
    if (MonksCombatMarker._setting.hasOwnProperty(key))
        return MonksCombatMarker._setting[key];
    else
        return game.settings.get("monks-combat-marker", key);
};

export let patchFunc = (prop, func, type = "WRAPPER") => {
    if (game.modules.get("lib-wrapper")?.active) {
        libWrapper.register("monks-combat-marker", prop, func, type);
    } else {
        const oldFunc = eval(prop);
        eval(`${prop} = function (event) {
            return func.call(this, oldFunc.bind(this), ...arguments);
        }`);
    }
}

export class MonksCombatMarker {
    static _setting = {};
    static markerCache = {};

    static init() {
        /*
        Object.defineProperty(Scene.prototype, "thumbnail", {
            get: function () {
                return this.getFlag('monks-combat-marker', 'thumb') || this.thumb;
            }
        });

        let oldUpdateObject = SceneConfig.prototype._updateObject;
        SceneConfig.prototype._updateObject = async function (event, formData) {
            let img = formData['flags.monks-combat-marker.thumbnail'];
            let td = (img ? await this.document.createThumbnail({ img: img }) : null);
            formData['flags.monks-combat-marker.thumb'] = td?.thumb;

            return oldUpdateObject.call(this, event, formData);
        }*/

        registerSettings();
        //MonksCombatMarker.registerHotKeys();

        let tokenDragStart = function (wrapped, ...args) {
            wrapped.call(this, ...args);

            if (this._original?.ldmarker?.transform != undefined) {
                this._original.ldmarker.visible = false;
            }
        }

        let tokenDragEnd = function (wrapped, ...args) {
            wrapped.call(this, ...args);

            if (this._original?.ldmarker?.transform != undefined) {
                this._original.ldmarker.visible = this._original.isVisible && !MonksCombatMarker.isDefeated(this._original);
            }
        }

        if (game.modules.get("lib-wrapper")?.active) {
            libWrapper.register("monks-combat-marker", "Token.prototype._onDragStart", tokenDragStart, "WRAPPER");
            libWrapper.register("monks-combat-marker", "Token.prototype._onDragEnd", tokenDragEnd, "WRAPPER");
        } else {
            const oldTokenDragStart = Token.prototype._onDragStart;
            Token.prototype._onDragStart = function () {
                return tokenDragStart.call(this, oldTokenDragStart.bind(this), ...arguments);
            }
            const oldTokenDragEnd = Token.prototype._onDragEnd;
            Token.prototype._onDragEnd = function () {
                return tokenDragEnd.call(this, oldTokenDragEnd.bind(this), ...arguments);
            }
        }
    }

    static async ready() {
        MonksCombatMarker._setting["token-highlight-animate"] = setting("token-highlight-animate");
        MonksCombatMarker._setting["token-combat-animation"] = setting("token-combat-animation");
        MonksCombatMarker._setting["token-combat-animation-hostile"] = setting("token-combat-animation-hostile");
        MonksCombatMarker._setting["token-combat-animation-neutral"] = setting("token-combat-animation-neutral");
        MonksCombatMarker._setting["token-highlight-scale"] = setting("token-highlight-scale");

        if (!setting("transfer-settings") && game.user.isGM && game.modules.get("monks-little-details")?.active) {
            MonksCombatMarker.transferSettings();
        }
    }

    static tokenHighlightScale(token) {
        let scale = getProperty(token.document.flags, "monks-combat-marker.token-highlight-scale") || setting("token-highlight-scale");
        return token.document.texture.scaleX < 1 ? scale * token.document.texture.scaleX : scale;
    }

    static tokenHighlightAnimation(token) {
        let animation = getProperty(token.document.flags, "monks-combat-marker.token-combat-animation");
        if (!animation) {
            switch (token.document.disposition) {
                case 1: animation = setting('token-combat-animation'); break;
                case -1: animation = setting('token-combat-animation-hostile'); break;
                case 0:
                default:
                    animation = setting('token-combat-animation-neutral'); break;
            }
        }
        return animation || "none";
    }

    static async transferSettings() {
        let swapFilename = function (value, name) {
            if (value && (name === "token-highlight-picture" || name === "token-highlight-picture-hostile" || name ===  true)) {
                if (value.startsWith("modules/monks-little-details/markers/marker") && value.endsWith(".png")) {
                    value = value.replace(".png", ".webp");
                }
                value = value.replace("monks-little-details", "monks-combat-marker");
            }

            return value;
        }
        let setSetting = async function (name) {
            let oldChange = game.settings.settings.get(`monks-combat-marker.${name}`).onChange;
            game.settings.settings.get(`monks-combat-marker.${name}`).onChange = null;
            let value = swapFilename(game.settings.get("monks-little-details", name), name);
            await game.settings.set("monks-combat-marker", name, value);
            game.settings.settings.get(`monks-combat-marker.${name}`).onChange = oldChange;
        }

        await setSetting("token-highlight-remove");
        await setSetting("token-highlight-animate");
        await setSetting("token-highlight-picture");
        await setSetting("token-highlight-picture-hostile");
        await setSetting("token-highlight-scale");
        await setSetting("token-combat-animation");
        await setSetting("token-combat-animation-hostile");

        for (let scene of game.scenes) {
            for (let token of scene.tokens) {
                if (getProperty(token, "flags.monks-little-details.token-highlight")) {
                    await token.update({ "flags.monks-combat-marker.token-highlight": swapFilename(getProperty(token, "flags.monks-little-details.token-highlight"), true) });
                }
                if (getProperty(token, "flags.monks-little-details.token-highlight-scale")) {
                    await token.update({ "flags.monks-combat-marker.token-highlight-scale": getProperty(token, "flags.monks-little-details.token-highlight-scale") });
                }
                if (getProperty(token, "flags.monks-little-details.token-combat-animation")) {
                    await token.update({ "flags.monks-combat-marker.token-combat-animation": getProperty(token, "flags.monks-little-details.token-combat-animation") });
                }
                if (getProperty(token, "flags.monks-little-details.token-combat-animation-hostile")) {
                    await token.update({ "flags.monks-combat-marker.token-combat-animation-hostile": getProperty(token, "flags.monks-little-details.token-combat-animation-hostile") });
                }
            }
        }

        for (let actor of game.actors) {
            if (getProperty(actor.prototypeToken, "flags.monks-little-details.token-highlight")) {
                await actor.prototypeToken.update({ "flags.monks-combat-marker.token-highlight": swapFilename(getProperty(actor.prototypeToken, "flags.monks-little-details.token-highlight"), true) });
            }
            if (getProperty(actor.prototypeToken, "flags.monks-little-details.token-highlight-scale")) {
                await actor.prototypeToken.update({ "flags.monks-combat-marker.token-highlight-scale": getProperty(actor.prototypeToken, "flags.monks-little-details.token-highlight-scale") });
            }
            if (getProperty(actor.prototypeToken, "flags.monks-little-details.token-combat-animation")) {
                await actor.prototypeToken.update({ "flags.monks-combat-marker.token-combat-animation": getProperty(actor.prototypeToken, "flags.monks-little-details.token-combat-animation") });
            }
            if (getProperty(actor.prototypeToken, "flags.monks-little-details.token-combat-animation-hostile")) {
                await actor.prototypeToken.update({ "flags.monks-combat-marker.token-combat-animation-hostile": getProperty(actor.prototypeToken, "flags.monks-little-details.token-combat-animation-hostile") });
            }
        }

        ui.notifications.warn("Monk's Combat Marker has transfered over settings from Monk's Little Details, you will need to refresh your browser for some settings to take effect.", { permanent: true });

        await game.settings.set("monks-combat-marker", "transfer-settings", true);
    }

    static isDefeated(token) {
        return (token && (token.combatant && token.combatant.defeated) || token.actor?.statuses.has(CONFIG.specialStatusEffects.DEFEATED) || token.document.overlayEffect == CONFIG.controlIcons.defeated);
    }

    static toggleTurnMarker(token, visible) {
        if (token && token.preventMarker !== true) {
            if (token?.ldmarker?.transform == undefined) {
                let highlightFile = token.document.getFlag('monks-combat-marker', 'token-highlight');
                if (!highlightFile) {
                    switch (token.document.disposition) {
                        case 1: highlightFile = setting("token-highlight-picture"); break;
                        case -1: highlightFile = setting("token-highlight-picture-hostile"); break;
                        case 0:
                        default:
                            highlightFile = setting("token-highlight-picture-neutral"); break;
                    }
                }
                highlightFile = highlightFile || "";
                if (highlightFile.startsWith("modules/monks-combat-marker/markers/marker") && highlightFile.endsWith("png"))
                    highlightFile = highlightFile.substring(0, highlightFile.length - 3) + "webp";

                const setHighlight = (tex) => { //"modules/monks-combat-marker/img/chest.png"
                    if (token.ldmarker != undefined) {
                        token.ldmarker.destroy();
                    }
                    const markericon = new PIXI.Sprite(tex);
                    if (highlightFile.endsWith('webm')) {
                        tex.baseTexture.resource.source.autoplay = true;
                        tex.baseTexture.resource.source.loop = true;
                        tex.baseTexture.resource.source.muted = true;
                        try {
                            tex.baseTexture.resource.source.play();
                        } catch {
                            window.setTimeout(function () { try { tex.baseTexture.resource.source.play(); } catch { } }, 100);
                        }
                    }
                    markericon.pivot.set(markericon.width / 2, markericon.height / 2);//.set(-(token.w / 2), -(token.h / 2));
                    const scale = MonksCombatMarker.tokenHighlightScale(token);
                    const size = Math.max(token.w, token.h) * scale;
                    markericon.width = markericon.height = size;
                    markericon.position.set(token.x + (token.w / 2), token.y + (token.h / 2));
                    markericon.alpha = 0.8;
                    markericon.pulse = { value: null, dir: 1 };
                    token.ldmarker = markericon;
                    canvas.grid.ldmarkers.addChild(token.ldmarker);
                    token.ldmarker.visible = visible && token.isVisible && !MonksCombatMarker.isDefeated(token);
                    token.ldmarker._visible = visible;
                }

                if (MonksCombatMarker.markerCache[highlightFile])
                    setHighlight(MonksCombatMarker.markerCache[highlightFile]);
                else {
                    loadTexture(highlightFile).then((tex) => {
                        setHighlight(tex);
                        MonksCombatMarker.markerCache[highlightFile] = tex
                    });
                }
            } else {
                token.ldmarker.visible = visible && token.isVisible && !MonksCombatMarker.isDefeated(token);
                token.ldmarker._visible = visible;
                const scale = MonksCombatMarker.tokenHighlightScale(token);
                const size = Math.max(token.w, token.h) * scale;
                token.ldmarker.width = token.ldmarker.height = size;
                token.ldmarker.alpha = 0.8;
            }

            if (visible)
                MonksCombatMarker.turnMarkerAnim[token.id] = token;
            else
                delete MonksCombatMarker.turnMarkerAnim[token.id];

            if (setting('token-highlight-animate') > 0) {
                if (!MonksCombatMarker._animate && Object.keys(MonksCombatMarker.turnMarkerAnim).length != 0) {
                    MonksCombatMarker._animate = MonksCombatMarker.animateMarkers.bind(this);
                    canvas.app.ticker.add(MonksCombatMarker._animate);
                } else if (MonksCombatMarker._animate != undefined && Object.keys(MonksCombatMarker.turnMarkerAnim).length == 0) {
                    canvas.app.ticker.remove(MonksCombatMarker._animate);
                    delete MonksCombatMarker._animate;
                }
            }
        }
    }

    static clearTurnMarker() {
        MonksCombatMarker.turnMarkerAnim = {};
        canvas.app.ticker.remove(MonksCombatMarker._animate);
        delete MonksCombatMarker._animate;
    }

    static removeTurnMarker(token) {
        if (token == undefined)
            return;

        if (token?.ldmarker) {
            token.ldmarker.destroy();
            delete token.ldmarker;
        }
        delete MonksCombatMarker.turnMarkerAnim[token.id];

        if (Object.keys(MonksCombatMarker.turnMarkerAnim).length == 0) {
            canvas.app.ticker.remove(MonksCombatMarker._animate);
            delete MonksCombatMarker._animate;
        }
    }

    static animateMarkers(dt) {
        let interval = setting('token-highlight-animate');
        for (const token of Object.values(MonksCombatMarker.turnMarkerAnim)) {
            if (token?.ldmarker?.transform) {
                let delta = interval / 10000;
                try {
                    let animation = MonksCombatMarker.tokenHighlightAnimation(token);
                    if (animation == 'clockwise') {
                        token.ldmarker.rotation += (delta * dt);
                        if (token.ldmarker.rotation > (Math.PI * 2))
                            token.ldmarker.rotation = token.ldmarker.rotation - (Math.PI * 2);
                    }
                    else if (animation == 'counterclockwise') {
                        token.ldmarker.rotation -= (delta * dt);
                    }
                    else if (animation == 'pulse') {
                        let tokenscale = MonksCombatMarker.tokenHighlightScale(token);
                        let change = tokenscale / 6;
                        const maxval = tokenscale + change;
                        const minval = Math.max(tokenscale - change, 0);

                        if (token.ldmarker.pulse.value == undefined) token.ldmarker.pulse.value = minval;
                        let adjust = (delta * dt);

                        token.ldmarker.pulse.value = Math.max(token.ldmarker.pulse.value + (token.ldmarker.pulse.dir * adjust), 0);
                        if (token.ldmarker.pulse.value > maxval) {
                            token.ldmarker.pulse.value = (tokenscale + change) + ((tokenscale + change) - token.ldmarker.pulse.value);
                            token.ldmarker.pulse.dir = -1;
                        } else if (token.ldmarker.pulse.value < minval) {
                            token.ldmarker.pulse.value = (tokenscale - change) + ((tokenscale - change) - token.ldmarker.pulse.value);
                            token.ldmarker.pulse.dir = 1;
                        }

                        let perc = ((token.ldmarker.pulse.value - minval) / (maxval - minval));
                        let ease = (perc < 0.5 ? 2 * perc * perc : 1 - Math.pow(-2 * perc + 2, 2) / 2);

                        const size = (Math.max(token.w, token.h) * (minval + ((maxval - minval) * ease)));
                        token.ldmarker.width = token.ldmarker.height = size;
                    }
                    else if (animation == 'fadeout') {
                        let tokenscale = MonksCombatMarker.tokenHighlightScale(token);
                        token.ldmarker.pulse.value = token.ldmarker.pulse.value + (delta * dt);
                        let change = tokenscale / 6;
                        if (token.ldmarker.pulse.value > tokenscale + change) {
                            token.ldmarker.pulse.value = 0;
                            token.ldmarker.alpha = 1
                        } else if (token.ldmarker.pulse.value > tokenscale) {
                            token.ldmarker.alpha = 1 - ((token.ldmarker.pulse.value - tokenscale) / change);
                        }
                        const size = (Math.max(token.w, token.h) * token.ldmarker.pulse.value);
                        token.ldmarker.width = token.ldmarker.height = size;
                        //token.ldmarker.alpha = 1 - (token.ldmarker.pulse.value / tokenscale);
                    } else if (animation == 'fadein') {
                        let tokenscale = MonksCombatMarker.tokenHighlightScale(token);
                        token.ldmarker.pulse.value = token.ldmarker.pulse.value - (delta * dt);
                        let change = tokenscale / 4;
                        if (token.ldmarker.pulse.value > tokenscale - change) {
                            token.ldmarker.alpha = ((tokenscale - token.ldmarker.pulse.value) / change);
                        } else
                            token.ldmarker.alpha = 1
                        if (token.ldmarker.pulse.value < 0) {
                            token.ldmarker.pulse.value = tokenscale;
                            token.ldmarker.alpha = 0;
                        }
                        const size = (Math.max(token.w, token.h) * token.ldmarker.pulse.value);
                        token.ldmarker.width = token.ldmarker.height = size;
                        //token.ldmarker.alpha = (token.ldmarker.pulse.value / tokenscale);
                    }
                } catch (err) {
                    // skip lost frames if the tile is being updated by the server
                    error(err);
                    //delete CombatMarker.turnMarkerAnim[key];
                }
            }
        }
    }
}

Hooks.once('init', MonksCombatMarker.init);
Hooks.on("ready", MonksCombatMarker.ready);


Hooks.on("renderSettingsConfig", (app, html, data) => {
    let btn = $('<button>')
        .addClass('file-picker')
        .attr('type', 'button')
        .attr('data-type', "imagevideo")
        .attr('data-target', "img")
        .attr('title', "Browse Files")
        .attr('tabindex', "-1")
        .html('<i class="fas fa-file-import fa-fw"></i>')
        .click(function (event) {
            const fp = new FilePicker({
                type: "imagevideo",
                current: $(event.currentTarget).prev().val(),
                callback: path => {
                    $(event.currentTarget).prev().val(path);
                }
            });
            return fp.browse();
        });

    btn.clone(true).insertAfter($('input[name="monks-combat-marker.token-highlight-picture"]', html).css({ 'flex-basis': 'unset', 'flex-grow': 1 }));
    btn.clone(true).insertAfter($('input[name="monks-combat-marker.token-highlight-picture-hostile"]', html).css({ 'flex-basis': 'unset', 'flex-grow': 1 }));
    btn.clone(true).insertAfter($('input[name="monks-combat-marker.token-highlight-picture-neutral"]', html).css({ 'flex-basis': 'unset', 'flex-grow': 1 }));
});

Hooks.on("updateSetting", (setting, data, options, userid) => {
    if (setting.key.startsWith("monks-combat-marker")) {
        const key = setting.key.replace("monks-combat-marker.", "");
        if (MonksCombatMarker._setting.hasOwnProperty(key))
            MonksCombatMarker._setting[key] = data.value;
    }
});

Hooks.on("updateCombatant", function (combatant, data, options, userId) {
    const combat = combatant.parent;
    if (combat && combat.started && combatant.token) {
        //const combatant = combat.combatants.find((o) => o.id === data.id);
        //let token = canvas.tokens.get(combatant.token._id);
        let token = combatant.token.object;
        MonksCombatMarker.toggleTurnMarker(token, token.id == combat.current.tokenId);
    }
});

/**
 * Handle combatant delete
 */
Hooks.on("deleteCombatant", function (combatant, data, options, userId) {
    let combat = combatant.parent;
    if (combat && combat.started && combatant.token) {
        //token may have been deleted before the combatant
        let token = combatant.token._object;
        MonksCombatMarker.removeTurnMarker(token);
    }
});

/**
 * Handle combatant added
 */
Hooks.on("createCombatant", function (combatant, options, userId) {
    let combat = combatant.parent;
    if (combat && combat.started && combatant.token) {
        //let combatant = combat.combatants.find((o) => o.id === data.id);
        //let token = canvas.tokens.get(combatant.token._id);
        let token = combatant.token.object;
        MonksCombatMarker.toggleTurnMarker(token, token.id == combat.current.tokenId);
    }
});

Hooks.on("updateToken", function (document, data, options, userid) {
    let token = document.object;
    if (!token)
        return;

    if (data.texture?.src != undefined ||
        data.width != undefined ||
        data.height != undefined ||
        data.texture?.scaleX != undefined ||
        data.texture?.scaleY != undefined ||
        foundry.utils.getProperty(data, 'flags.monks-combat-marker.token-highlight-scale') != undefined ||
        foundry.utils.getProperty(data, 'flags.monks-combat-marker.token-highlight') != undefined ||
        foundry.utils.getProperty(data, 'flags.monks-combat-marker.token-combat-animation') != undefined ||
        foundry.utils.getProperty(data, 'flags.monks-combat-marker.token-combat-animation-hostile') != undefined ||
        foundry.utils.getProperty(data, 'flags.monks-combat-marker.token-combat-animation-neutral') != undefined) {
        let activeCombats = game.combats.filter(c => {
            return c?.scene?.id == game.scenes.viewed.id && c.started;
        });
        let activeTokens = activeCombats.map(c => { return c.current.tokenId });

        if (activeTokens.includes(token?.id)) {
            setTimeout(function () {
                MonksCombatMarker.removeTurnMarker(token);
                MonksCombatMarker.toggleTurnMarker(token, true);
            }, 100);
        }
    }
    if (setting('token-highlight-remove') && (data.x != undefined || data.y != undefined)) {
        token.preventMarker = true;
        MonksCombatMarker.removeTurnMarker(token);
    }
});

Hooks.on("refreshToken", function (token) {
    if (token?.ldmarker?.transform != undefined) {
        token.ldmarker.position.set(token.x + (token.w / 2), token.y + (token.h / 2));
        token.ldmarker.visible = token.ldmarker._visible && (!token._animation && token.isVisible && !MonksCombatMarker.isDefeated(token));
    }
});

Hooks.on("sightRefresh", function () {
    //clear all previous combat markers
    MonksCombatMarker.clearTurnMarker();

    //check for current combats
    let activeCombats = game.combats.filter(c => {
        return c?.scene?.id == canvas.scene.id && c.started;
    });

    if (activeCombats.length) {
        //add a combat marker for each active combatant
        for (let combat of activeCombats) {
            MonksCombatMarker.toggleTurnMarker(combat.combatant?.token?._object, true);
        }
    }
});

//check on the turn marker if the scene changes
Hooks.on("canvasReady", function (canvas) {
    //clear all previous combat markers
    MonksCombatMarker.clearTurnMarker();

    //check for current combats
    let activeCombats = game.combats.filter(c => {
        return c?.scene?.id == canvas.scene.id && c.started;
    });

    if (activeCombats.length) {
        //add a combat marker for each active combatant
        for (let combat of activeCombats) {
            MonksCombatMarker.toggleTurnMarker(combat.combatant?.token?._object, true);
        }
    }
});

Hooks.on("deleteCombat", function (combat) {
    //remove the combat highlight from any token in this combat
    if (combat.started == true) {
        for (let combatant of combat.combatants) {
            let token = combatant.token; //canvas.tokens.get(combatant.token._id);
            if (token)
                MonksCombatMarker.removeTurnMarker(token._object);
        }
    }
});

Hooks.on("updateCombat", async function (combat, delta) {
    if (combat.started) {
        for (let combatant of combat.combatants) {
            let token = combatant.token; //canvas.tokens.get(combatant.token.id);
            delete token?._object?.preventMarker;
            if (token)
                MonksCombatMarker.toggleTurnMarker(token._object, token.id == combat?.current?.tokenId);
        }
        //let token = canvas?.tokens.get(combat?.current?.tokenId);
        //MonksCombatMarker.removeTurnMarker(token);
        //MonksCombatMarker.toggleTurnMarker(token, true);
    }
});

Hooks.on("renderTokenConfig", (app, html, data) => {
    if (game.user.isGM) {
        let tokenhighlight = getProperty(app?.object?.flags, "monks-combat-marker.token-highlight");
        $('<div>')
            .addClass('form-group')
            .append($('<label>').html(i18n("MonksCombatMarker.token-highlight-picture.name")))
            .append($('<div>').addClass('form-fields')
                .append($('<button>')
                    .addClass('file-picker')
                    .attr('type', 'button')
                    .attr('data-type', "imagevideo")
                    .attr('data-target', "img")
                    .attr('title', "Browse Files")
                    .attr('tabindex', "-1")
                    .html('<i class="fas fa-file-import fa-fw"></i>')
                    .click(function (event) {
                        const fp = new FilePicker({
                            type: "imagevideo",
                            current: $(event.currentTarget).next().val(),
                            callback: path => {
                                $(event.currentTarget).next().val(path);
                            }
                        });
                        return fp.browse();
                    }))
                .append($('<input>').addClass('token-highlight').attr({ 'type': 'text', 'name': 'flags.monks-combat-marker.token-highlight', 'placeholder': 'path/image.png' }).val(tokenhighlight))
            )
            .insertAfter($('[name="alpha"]', html).closest('.form-group'));

        let tokenanimation = getProperty(app?.object?.flags, "monks-combat-marker.token-combat-animation");
        let animation = {
            '': '',
            'none': i18n("MonksCombatMarker.animation.none"),
            'clockwise': i18n("MonksCombatMarker.animation.clockwise"),
            'counterclockwise': i18n("MonksCombatMarker.animation.counterclockwise"),
            'pulse': i18n("MonksCombatMarker.animation.pulse"),
            'fadeout': i18n("MonksCombatMarker.animation.fadeout"),
            'fadein': i18n("MonksCombatMarker.animation.fadein")
        };
        $('<div>')
            .addClass('form-group')
            .append($('<label>').html(i18n("MonksCombatMarker.token-combat-animation.name")))
            .append($('<div>').addClass('form-fields')
                .append($('<select>').attr({ 'name': 'flags.monks-combat-marker.token-combat-animation' }).append(Object.entries(animation).map(([k, v]) => `<option value="${k}">${v}</option>`).join("")).val(tokenanimation))
            )
            .insertAfter($('[name="alpha"]', html).closest('.form-group'));

        let highlightscale = getProperty(app?.object?.flags, "monks-combat-marker.token-highlight-scale") || setting("token-highlight-scale");
        $('<div>')
            .addClass('form-group')
            .append($('<label>').html(i18n("MonksCombatMarker.token-highlight-scale.name")))
            .append($('<div>').addClass('form-fields')
                .append($('<input>').attr({ 'type': 'range', 'name': 'flags.monks-combat-marker.token-highlight-scale', 'min': '0.2', max: '3', step: "0.05" }).val(highlightscale))
                .append($('<span>').addClass("range-value").html(highlightscale))
            )
            .insertAfter($('[name="alpha"]', html).closest('.form-group'));

        app.setPosition();
    }
});

Hooks.on("destroyToken", (token) => {
    if (token.ldmarker) {
        token.ldmarker.destroy();
        delete token.ldmarker;
    }
});

Hooks.on("drawGridLayer", function (layer) {
    layer.ldmarkers = layer.addChildAt(new PIXI.Container(), layer.getChildIndex(layer.borders));
});