import { AnyObject } from "@league-of-foundry-developers/foundry-vtt-types/utils";
import { advancement } from "../config";
import { AdvancementRuleConfig } from "../types/config";
import { TEMPLATES } from "../helpers/templates";
import { CharacterSheet } from "@src/declarations/cosmere-rpg/applications/actor/character-sheet";
import { BaseActorSheetRenderContext } from "@src/declarations/cosmere-rpg/applications/actor/base";
import { MODULE_ID } from "../constants";

declare global {
    interface CONFIG {
        COSMERE: {
            attributeGroups: Record<string, any>;
        };
    }
}

interface LevelUpChoices {
    attributes?: Record<string, number>;
    skills?: Record<string, number>;
    talent?: string;
    choiceSkills?: Record<string, number>;
    choice?: 'skillRanks' | 'talents';
}

export class LevelWizard extends foundry.applications.api.HandlebarsApplicationMixin(
    foundry.applications.api.ApplicationV2<AnyObject>
){
    declare actor: CharacterActor;
    declare advancementData: AdvancementRuleConfig;
    private submitted = false;
    private choices: LevelUpChoices = {};

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
            submit: this.onSubmit,
            cancel: this.onCancel,
        },
    };

    static PARTS = foundry.utils.mergeObject(
        foundry.utils.deepClone(super.PARTS),
        {
            form: {
                template: TEMPLATES.LEVEL_WIZARD,
                forms: {
                    form: {
                        closeOnSubmit: false,
                        handler: this.onFormEvent,
                        submitOnChange: false,
                    },
                },
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

        // Apply choice-based skill rank increases
        if (this.choices.choiceSkills && this.choices.choice == 'skillRanks') {
            for (const [key, increase] of Object.entries(this.choices.choiceSkills)) {
                if (increase > 0) {
                    const currentRank = this.actor.system.skills[key].rank;
                    updates[`system.skills.${key}.rank`] = currentRank + increase;
                }
            }
        }
        else if (this.choices.choice == 'talents')
        {
            //TODO: APPLY TALENT HERE
        }

        // Update the actor
        await this.actor.update(updates);

        // Show confirmation message
        ui.notifications?.info(`${this.actor.name} has advanced to level ${this.advancementData.level}!`);
    }

    async _prepareContext(){

        // Calculate new health total (TODO: may need updating for Hardy)
        let newHealthTotal = this.actor.system.resources.health?.max ?? 0;
        if (this.advancementData.health) {
            newHealthTotal += this.advancementData.health;
            if (this.advancementData.healthIncludeStrength) {
                newHealthTotal += this.actor.system.attributes.strength;
            }
        }

        return {
            actor: this.actor,
            skills: this.actor.system.skills,
            newLevel: this.advancementData.level,
            talents: this.advancementData.talents,
            attributePoints: this.advancementData.attributePoints,
            maxSkillRanks: this.advancementData.maxSkillRanks,
            skillRanks: this.advancementData.skillRanks,
            skillRanksOrTalents: this.advancementData.skillRanksOrTalents,
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