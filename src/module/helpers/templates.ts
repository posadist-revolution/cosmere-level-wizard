import { AttributeGroup, Skill } from "@src/declarations/cosmere-rpg/types/cosmere";
import { MODULE_ID } from "../constants";
import { AttributeGroupConfig } from "@src/declarations/cosmere-rpg/types/config";
import { AnyRecord } from "dns";

const TEMPLATE_PATH_START = `modules/${MODULE_ID}/templates`
export const TEMPLATES = {
	LEVEL_WIZARD: TEMPLATE_PATH_START + '/level-wizard.hbs',
	ATTRIBUTE_INCREASE: TEMPLATE_PATH_START + '/attribute-increase.hbs',
	CHOOSE_SKILL_OR_TALENT: TEMPLATE_PATH_START + '/choose-skill-or-talent.hbs',
	HEALTH_INCREASE: TEMPLATE_PATH_START + '/health-increase.hbs',
	SKILL_INCREASE: TEMPLATE_PATH_START + '/skill-increase.hbs',
	TALENT_SELECTION: TEMPLATE_PATH_START + '/talent-selection.hbs',
    COSMERE_SKILLS_GROUP: TEMPLATE_PATH_START + '/cosmere-rpg/cosmere-skills-group.hbs',
    COSMERE_SKILL: TEMPLATE_PATH_START + '/cosmere-rpg/cosmere-skill.hbs',
    COSMERE_ATTRIBUTES: TEMPLATE_PATH_START + '/cosmere-rpg/cosmere-attributes.hbs',
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

Handlebars.registerHelper('levelingSkillsGroupContext', (actor: CosmereActor, groupId: AttributeGroup) => {

    console.log(`${MODULE_ID}: Group ID`);
    console.log(groupId);
    // Get the attribute group config
    const groupConfig: AttributeGroupConfig = CONFIG.COSMERE.attributeGroups[groupId];

    // Get the skill ids
    const skillIds = groupConfig.attributes
        .map((attrId) => CONFIG.COSMERE.attributes[attrId])
        .map((attr) => attr.skills)
        .flat()
        .filter(
            (skillId) =>
                CONFIG.COSMERE.skills[skillId].core,
        )
        .sort((a, b) => a.localeCompare(b)); // Sort alphabetically

    const skillContext = {
        skills: skillIds
            .map((skillId) => {
                // Get skill
                const skill = actor.system.skills[skillId];

                // Get config
                const config = CONFIG.COSMERE.skills[skillId];

                // Get attribute config
                const attrConfig =
                    CONFIG.COSMERE.attributes[config.attribute];

                return {
                    id: skillId,
                    config: {
                        ...config,
                        attrLabel: attrConfig.labelShort,
                    },
                    ...skill,
                    active: !config.hiddenUntilAcquired || skill.rank >= 1,
                };
            })
            .sort((a, b) => {
                const _a = a.config.hiddenUntilAcquired ? 1 : 0;
                const _b = b.config.hiddenUntilAcquired ? 1 : 0;
                return _a - _b;
            }),
    }
    return skillContext;
});

Handlebars.registerHelper('levelingSkillContext', (actor: CosmereActor, skillId: Skill) =>{
        // Get skill
        const skill = actor.system.skills[skillId];

        // Get skill config
        const config = CONFIG.COSMERE.skills[skillId];

        // Get attribute config
        const attributeConfig = CONFIG.COSMERE.attributes[config.attribute];

        return {
            skill: {
                ...skill,
                id: skillId,
                label: config.label,
                attribute: config.attribute,
                attributeLabel: attributeConfig.labelShort,
            },

            pips: true,
        }
});

Handlebars.registerHelper('levelingGetFromKey', (record: Record<string, any>, key: string) => {
    return record[key];
})