import './style.scss';
import { activateLevelUpHooks } from "./module/applications/level-wizard";
import { preloadHandlebarsTemplates } from "./module/helpers/templates";

Hooks.once('init', async function() {
	// Preload Handlebars templates.
	return preloadHandlebarsTemplates();
});

Hooks.once('ready', async function() {
    activateLevelUpHooks();
});