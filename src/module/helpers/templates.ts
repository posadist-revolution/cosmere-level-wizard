import { MODULE_ID } from "../constants";

const TEMPLATE_PATH_START = `modules/${MODULE_ID}/templates`
export const TEMPLATES = {
	LEVEL_WIZARD: TEMPLATE_PATH_START + '/level-wizard.hbs',
	ATTRIBUTE_INCREASE: TEMPLATE_PATH_START + '/attribute-increase.hbs',
	CHOOSE_SKILL_OR_TALENT: TEMPLATE_PATH_START + '/choose-skill-or-talent.hbs',
	HEALTH_INCREASE: TEMPLATE_PATH_START + '/health-increase.hbs',
	SKILL_INCREASE: TEMPLATE_PATH_START + '/skill-increase.hbs',
	TALENT_SELECTION: TEMPLATE_PATH_START + '/talent-selection.hbs',
} as const;

/**
 * Define a set of template paths to pre-load
 * Pre-loaded templates are compiled and cached for fast access when rendering
 * @return {Promise}
 */
export const preloadHandlebarsTemplates = async function () {
    const templates = Object.values(TEMPLATES).reduce(
        (partials, path) => {
            partials[path.split('/').pop()!.replace('.hbs', '')] =
                `${path}`;
            return partials;
        },
        {} as Record<string, string>,
    );

    return await foundry.applications.handlebars.loadTemplates(templates);
};