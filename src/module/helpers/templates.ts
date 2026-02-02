import { Attribute, AttributeGroup, Resource, Skill } from "@src/declarations/cosmere-rpg/types/cosmere";
import { MODULE_ID } from "../constants";
import { AttributeGroupConfig } from "@src/declarations/cosmere-rpg/types/config";
import { ActorAttrSecondaryTable, awarenessToSensesRange, getHealthIncreaseFromStrIncreaseAndLevel, speedToMovementRate, strengthToCarryingCapacity, strengthToLiftingCapacity, strengthToUnarmedDamage, willpowerToRecoveryDie } from "./actor";

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
    SECONDARY_ALL: TEMPLATE_PATH_START + '/secondary-attribute-effects/secondary-all.hbs',
    SECONDARY_SOME: TEMPLATE_PATH_START + '/secondary-attribute-effects/secondary-some.hbs',
    SECONDARY_STR: TEMPLATE_PATH_START + '/secondary-attribute-effects/secondary-str.hbs',
    SECONDARY_SPD: TEMPLATE_PATH_START + '/secondary-attribute-effects/secondary-spd.hbs',
    SECONDARY_INT: TEMPLATE_PATH_START + '/secondary-attribute-effects/secondary-int.hbs',
    SECONDARY_WIL: TEMPLATE_PATH_START + '/secondary-attribute-effects/secondary-wil.hbs',
    SECONDARY_AWA: TEMPLATE_PATH_START + '/secondary-attribute-effects/secondary-awa.hbs',
    SECONDARY_PRE: TEMPLATE_PATH_START + '/secondary-attribute-effects/secondary-pre.hbs',
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

    // console.log(`${MODULE_ID}: Group ID`);
    // console.log(groupId);
    // Get the attribute group config
    const groupConfig: AttributeGroupConfig = CONFIG.COSMERE.attributeGroups[groupId];

    // Get the skill ids
    const skillIds = groupConfig.attributes
        .map((attrId) => CONFIG.COSMERE.attributes[attrId])
        .map((attr) => attr.skills)
        .flat()
        .filter(
            (skillId) =>
                (CONFIG.COSMERE.skills[skillId].core ||
                actor.system.skills[skillId].unlocked),
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

Handlebars.registerHelper('levelingAttributesContext', (actor: CosmereActor, skillId: Skill) =>{
    return {
        attributeGroups: (Object.keys(CONFIG.COSMERE.attributeGroups) as AttributeGroup[]).map((attrId) => prepareAttributeGroup(actor, attrId)),
    }
});

function prepareAttributeGroup(actor: CosmereActor, groupId: AttributeGroup) {
    // Get the attribute group config
    const groupConfig = CONFIG.COSMERE.attributeGroups[groupId];
    groupConfig.attributes.map((attrId) => prepareAttribute(actor, attrId))
    return {
        id: groupId,
        config: groupConfig,
        defense: actor.system.defenses[groupId],
        attributes: groupConfig.attributes.map((attrId) => prepareAttribute(actor, attrId)),
    };
}

function prepareAttribute(actor: CosmereActor, attrId: Attribute) {
    // Get the attribute config
    const attrConfig = CONFIG.COSMERE.attributes[attrId];

    const attr = actor.system.attributes[attrId];
    const source = (
        actor._source as {
            system: {
                attributes: Record<
                    Attribute,
                    { value: number; bonus: number }
                >;
            };
        }
    ).system.attributes[attrId];

    const total = source.value;
    const sourceTotal = source.value;

    return {
        id: attrId,
        config: attrConfig,
        ...attr,
        total,
        source: source,
        modified: total !== sourceTotal,
    };
}

Handlebars.registerHelper('levelingAttrSecondaryContext', (attrId: Attribute, actor: CharacterActor, choices: any) => {
    return {
        actor: actor,
        attrVal: actor.system.attributes[attrId].value,
        attrInc: choices.attributes[attrId]
    }
});

Handlebars.registerHelper('levelingGetFromKey', (record: Record<string, any>, key: string) => {
    return record[key];
});

Handlebars.registerHelper('levelComplete', (context) => {
    // console.log(`${MODULE_ID}: Checking level complete. Context:`);
    // console.log(context);
    let levelComplete: Boolean = context.attributePointsRemaining == 0;
    if(!context.advancementData.skillRanksOrTalents)
    {
        // If we don't have to choose between skill ranks or talents, we should check that all remaining items have been used
        levelComplete = levelComplete && context.skillRanksRemaining == 0;
        // levelComplete = levelComplete && context.talentsRemaining == 0;
        // levelComplete = levelComplete && context.ancestryBonusTalentsRemaining == 0;
    }
    else{
        //If we do have to choose between skill ranks or talents, we should only check one of the two
        if(context.choices.choice == "skillRanks"){
            levelComplete = levelComplete && (context.skillRanksRemaining == 0);
        }
        else{
            // levelComplete = levelComplete && context.talentsRemaining == 0;
        }
    }
    // console.log(`${MODULE_ID}: Level complete = ${levelComplete}`);
    return levelComplete
});

Handlebars.registerHelper('shouldRenderAttrSecondary', (attrId: Attribute, attrChoices: Record<Attribute, number>, actor: CharacterActor ) => {
    // If we didn't increase this attribute, default to false
    if(attrChoices[attrId] == 0){
        return false;
    }

    let attrIncrease = attrChoices[attrId];

    switch(attrId){
        case Attribute.Strength: // Strength changes health, so always display it
            return true;

        case Attribute.Speed: // Display if movement rate changes
            let speedValue = actor.system.attributes[attrId].value;

            return doesAttrTableChange(speedValue, attrIncrease);

        case Attribute.Intellect: // Intellect grants an expertise, so always display it
            return true;

        case Attribute.Willpower: // Willpower changes focus, so always display it when it's changed
            return true;

        case Attribute.Awareness: // Display if investiture increases or senses range changes
            let awarenessValue = actor.system.attributes[attrId].value;

            // Return whether either the attribute table or the investiture value has changed
            return (doesAttrTableChange(awarenessValue, attrIncrease) ||
                    doesInvestitureChange(actor, attrId, attrIncrease));

        case Attribute.Presence: // Display if investiture increases
            return doesInvestitureChange(actor, attrId, attrIncrease);

        default:
            return false;
    }
});

function doesInvestitureChange(actor: CharacterActor, attr: Attribute, attrIncrease: number){
    // If the actor doesn't have investiture enabled, always return false
    if (actor.system.resources[Resource.Investiture].max.override > 0){
        let presenceValue = actor.system.attributes[Attribute.Presence].value;
        let awarenessValue = actor.system.attributes[Attribute.Awareness].value;
        if(attr == Attribute.Presence){
            return (presenceValue + attrIncrease > awarenessValue);
        }
        else{
            return (awarenessValue + attrIncrease > presenceValue);
        }
    }
    else return false;
}

function doesAttrTableChange(attrValue: number, attrIncrease: number){
    if(attrValue >= 9){
        return false;
    }
    return ((attrValue + attrIncrease) % 2 == 1)
}

Handlebars.registerHelper('doesAttrTableChange', doesAttrTableChange);

Handlebars.registerHelper('doesInvestitureChange', doesInvestitureChange);

Handlebars.registerHelper('doesUnarmedDmgChange', (attrValue, attrIncrease) => {
    return (strengthToUnarmedDamage(attrValue) != strengthToUnarmedDamage(attrValue + attrIncrease));
})

Handlebars.registerHelper("attrTableNewValue", (table: ActorAttrSecondaryTable, attrValue) => {
    switch(table){
        case ActorAttrSecondaryTable.RecoveryDie:
            return willpowerToRecoveryDie(attrValue);
        case ActorAttrSecondaryTable.LiftingCapacity:
            return strengthToLiftingCapacity(attrValue);
        case ActorAttrSecondaryTable.CarryingCapacity:
            return strengthToCarryingCapacity(attrValue);
        case ActorAttrSecondaryTable.MovementRate:
            return speedToMovementRate(attrValue);
        case ActorAttrSecondaryTable.SensesRange:
            return awarenessToSensesRange(attrValue);
        case ActorAttrSecondaryTable.UnarmedDmg:
            return strengthToUnarmedDamage(attrValue);
        default:
            throw Error(`${MODULE_ID}: Invalid secondary attribute table: ${table}`);
    }
});

Handlebars.registerHelper("currentLevelHealthIncFromStrInc", (currentLevel: number, strInc: number) => {
    return getHealthIncreaseFromStrIncreaseAndLevel(currentLevel, strInc);
});