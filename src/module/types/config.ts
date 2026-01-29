export interface AdvancementRuleConfig {
    /**
     * The level at which this rule applies.
     */
    level: number;

    /**
     * The tier the level falls into.
     */
    tier: number;

    /**
     * The maximum number of skill ranks that can be acquired for any
     * given skill at this level.
     */
    maxSkillRanks: number;

    /**
     * The amount of attribute points granted at this level.
     */
    attributePoints?: number;

    /**
     * The amount of health granted at this level.
     */
    health?: number;

    /**
     * Whether to include the strength attribute in the health granted.
     *
     * @default false
     */
    healthIncludeStrength?: boolean;

    /**
     * The amount of skill ranks granted at this level.
     */
    skillRanks?: number;

    /**
     * The amount of talents granted at this level.
     */
    talents?: number;

    /**
     * The amount of skill ranks OR talents granted at this level.
     * This is used when the character must choose between skill ranks and talents.
     */
    skillRanksOrTalents?: number;
}