import { AnyObject } from "@league-of-foundry-developers/foundry-vtt-types/utils";
import { advancement } from "../config";
import { AdvancementRuleConfig } from "../types/config";
import { TEMPLATES } from "../helpers/templates";
import { CharacterSheet } from "@src/declarations/cosmere-rpg/applications/actor/character-sheet";
import { BaseActorSheetRenderContext } from "@src/declarations/cosmere-rpg/applications/actor/base";
import { MODULE_ID } from "../constants";
import { Attribute, AttributeGroup, Resource, Skill } from "@src/declarations/cosmere-rpg/types/cosmere";
import { MouseButton } from '@src/declarations/cosmere-rpg/types/utils';
import { getSystemSetting, SETTINGS } from "../settings";

interface LevelUpChoices {
    attributes?: Record<string, number>;
    skills?: Record<string, number>;
    talent?: string;
    choice?: 'skillRanks' | 'talents';
}

export class LevelWizard extends foundry.applications.api.HandlebarsApplicationMixin(
    foundry.applications.api.ApplicationV2<AnyObject>
){
    declare actor: CharacterActor;
    declare advancementData: AdvancementRuleConfig;
    private submitted = false;
    private choices: LevelUpChoices = {};
    private skillRanksRemaining: number;
    private attributePointsRemaining: number;
    private talentsRemaining: number;

    static DEFAULT_OPTIONS = {
        window: {
            minimizable: false,
            resizable: false,
            positioned: true,
            title: "cosmere-level-wizard.Title",
        },
        classes: ['dialog', 'level-up', 'cosmere-level-wizard'],
        tag: 'dialog',
        position: {
            width: 600,
        },
        actions: {
            'adjust-skill-rank': {
                handler: this.onAdjustSkillRank,
                buttons: [MouseButton.Primary, MouseButton.Secondary],
            },
            submit: this.onSubmit,
            cancel: this.onCancel,
        },
    };

    static PARTS = foundry.utils.mergeObject(
        foundry.utils.deepClone(super.PARTS),
        {
            form: {
                template: TEMPLATES.LEVEL_WIZARD,
                scrollable: [""],
                forms: {
                    form: {
                        closeOnSubmit: false,
                        handler: this.onFormEvent,
                        submitOnChange: false,
                    },
                },
                // templates: [
                //     TEMPLATES.ATTRIBUTE_INCREASE,
                //     TEMPLATES.CHOOSE_SKILL_OR_TALENT,
                //     TEMPLATES.COSMERE_ATTRIBUTES,
                //     TEMPLATES.COSMERE_SKILL,
                //     TEMPLATES.COSMERE_SKILLS_GROUP,
                //     TEMPLATES.HEALTH_INCREASE,
                //     TEMPLATES.SKILL_INCREASE,
                //     TEMPLATES.TALENT_SELECTION,
                // ]
            },

        },
    );

    private constructor(characterActor: CharacterActor) {
        super({
            id: `${characterActor.uuid}.level-wizard`,
        });
        this.actor = characterActor;
        if(this.actor.system.level > 20){
            this.advancementData = advancement[20];
        }
        else{
            this.advancementData = advancement[this.actor.system.level];
        }

        // console.log(`${MODULE_ID}: `);
        // Find starting skillRanksRemaining
        this.skillRanksRemaining = 0;
        if(this.advancementData.skillRanks){
            this.skillRanksRemaining += this.advancementData.skillRanks;
            this.choices.skills = {};
            for(const skillId in this.actor.system.skills){
                this.choices.skills[skillId] = 0;
            }
        }
        if(this.advancementData.skillRanksOrTalents){
            this.skillRanksRemaining += this.advancementData.skillRanksOrTalents;
            this.choices.skills = {};
            for(const skillId in this.actor.system.skills){
                this.choices.skills[skillId] = 0;
            }
        }
        // console.log(`${MODULE_ID}: Skill ranks remaining: ${this.skillRanksRemaining}`);
        // console.log(`${MODULE_ID}: Choice skills:`);
        // console.log(this.choices.skills);

        // Find starting attributePointsRemaining
        this.attributePointsRemaining = 0;
        if(this.advancementData.attributePoints){
            this.attributePointsRemaining += this.advancementData.attributePoints;
            this.choices.attributes = {};
            for(const attrId in this.actor.system.attributes){
                this.choices.attributes[attrId] = 0;
            }
        }
        // console.log(`${MODULE_ID}: Attribute points remaining: ${this.attributePointsRemaining}`);

        // Find starting talentsRemaining
        this.talentsRemaining = 0;
        if(this.advancementData.talents){
            this.talentsRemaining += this.advancementData.talents;
            this.choices.talent = "";
        }
        // console.log(`${MODULE_ID}: Talents remaining: ${this.talentsRemaining}`);

    }

    /* --- Actions --- */
    public static async onAdjustSkillRank(
        this: LevelWizard,
        event: Event,
    ) {
        event.preventDefault();

        // Check if click is left or right mouse button
        const isLeftClick: boolean = event.type === 'click' ? true : false;

        // Get skill id
        const skillId = $(event.target!)
            .closest('[data-id]')
            .data('id');

        if (!skillId) return;

        // Increment/Decrement the skill rank based on click type
        if (isLeftClick) {
            if(this.skillRanksRemaining > 0 && this.advancementData.maxSkillRanks > (this.actor.system.skills[skillId].rank + this.choices.skills![skillId])){
                this.choices.skills![skillId] += 1;
                this.skillRanksRemaining -= 1;
            }
        }
        else {
            if(this.choices.skills && this.choices.skills[skillId] > 0){
                this.choices.skills[skillId] -= 1;
                this.skillRanksRemaining += 1;
            }
        }
        this.render();
    }

    /* --- Statics --- */

    public static async show(actor: CharacterActor) {
        await new LevelWizard(actor).render(true);
    }

    /* --- Lifecycle --- */

    protected async _onRender(context: AnyObject, options: AnyObject) {
        await super._onRender(context, options);

        $(this.element).prop('open', true);

        // Add event listener for choice radio buttons
        const choiceRadios = $(this.element).find('input[name="choice"]');
        for (const radio of choiceRadios){
            radio.addEventListener('change', (event) => {
                const target = event.target as HTMLInputElement;
                const choiceContents = $(this.element).find('.choice-content');
                for(const content of choiceContents){
                    if (content.dataset.choice == target.value) {
                        content.classList.remove('hidden');
                    } else {
                        content.classList.add('hidden');
                    }
                }
            });
        }
    }

    protected async _onFirstRender(context: AnyObject, options: AnyObject) {
        await super._onFirstRender(context, options);

        // TODO: Resolve foundry-vtt-types typing issues
        this.actor.apps[this.id] = this;
    }

    /* --- Form Event Handling --- */

    private static onFormEvent(
        this: LevelWizard,
        event: Event,
        form: HTMLFormElement,
        formData: FormDataExtended,
    ) {
        if (event instanceof SubmitEvent) return;
        //TODO: Update choices
    }

    /* --- Actions --- */

    protected static onSubmit(this: LevelWizard, event: Event) {
        event.preventDefault();

        const form = this.element.querySelector('form')! as HTMLFormElement;
        const formData = new FormDataExtended(form);

        // Update choices one final time
        LevelWizard.onFormEvent.call(this, event, form, formData);

        // Apply the level up
        this.applyLevelUp();

        this.submitted = true;
        void this.close();
    }

    protected static onCancel(this: LevelWizard) {
        this.submitted = false;
        void this.close();
    }

    private async applyLevelUp() {
        const updates: any = {
            'system.level': this.advancementData.level,
        };

        // Apply new talents
        if(this.choices.talent){
            //TODO: APPLY TALENT HERE
        }

        // Apply attribute increases
        if (this.choices.attributes) {
            for (const [key, increase] of Object.entries(this.choices.attributes)) {
                if (increase > 0) {
                    const currentValue = this.actor.system.attributes[key].value;
                    updates[`system.attributes.${key}.value`] = currentValue + increase;
                }
            }
        }

        // Apply skill rank increases
        if (this.choices.skills) {
            for (const [key, increase] of Object.entries(this.choices.skills)) {
                if (increase > 0) {
                    const currentRank = this.actor.system.skills[key].rank;
                    updates[`system.skills.${key}.rank`] = currentRank + increase;
                }
            }
        }

        // Update the actor
        await this.actor.update(updates);

        // Show confirmation message
        ui.notifications?.info(`${this.actor.name} has advanced to level ${this.advancementData.level}!`);
    }

    async _prepareContext(){

        // Calculate new health total (TODO: may need updating for Hardy)
        let newHealthTotal = this.actor.system.resources[Resource.Health].max.value ?? 0;
        if (this.advancementData.health) {
            newHealthTotal += this.advancementData.health;
            if (this.advancementData.healthIncludeStrength) {
                newHealthTotal += this.actor.system.attributes[Attribute.Strength].value;
            }
        }

        return {
            advancementData: this.advancementData,
            choices: this.choices,
            actor: this.actor,
            newLevel: this.advancementData.level,
            talentsRemaining: this.talentsRemaining,
            attributePointsRemaining: this.attributePointsRemaining,
            maxSkillRanks: this.advancementData.maxSkillRanks,
            skillRanksRemaining: this.skillRanksRemaining,
            health: this.advancementData.health,
            healthIncludeStrength: this.advancementData.healthIncludeStrength,
            newHealthTotal,
            attributeGroups: Object.keys(CONFIG.COSMERE.attributeGroups),
        };
    }
}

export function activateLevelUpHooks(){
    Hooks.on("renderCharacterSheet", (
        characterSheet: CharacterSheet,
        element: HTMLElement,
    ) => {
        // console.log(`${MODULE_ID}: Rendering Character Sheet`);
        const levelUpButton = $('<button type="button" class="level-up-button">Level Up</button>');

        // Finding level div
        const header = $(element).find("header.sheet-header");
        const levelDiv = header.find("div.sheet-stack.level");
        // console.log(`${MODULE_ID}: Found level div:`);
        // console.log(levelDiv);

        // Insert button after the level element
        // console.log(`${MODULE_ID}: Inserting button`);
        levelDiv.after(levelUpButton);

        // Add onClick handler
        // console.log(`${MODULE_ID}: Adding click handler`);
        levelUpButton.on('click', () => {
            const wizard = LevelWizard.show(characterSheet.actor);
        });

        return true;
    });
}

type RenderCharacterSheet = (
    sheet: CharacterSheet,
    element: HTMLElement,
    context: BaseActorSheetRenderContext
) => boolean;

declare module "@league-of-foundry-developers/foundry-vtt-types/configuration" {
    namespace Hooks {
        interface HookConfig {
            "renderCharacterSheet": RenderCharacterSheet
        }
    }
}