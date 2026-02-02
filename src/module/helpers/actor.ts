export enum ActorAttrSecondaryTable{
    RecoveryDie = "rec",
    SensesRange = "sen",
    MovementRate = "mov",
    LiftingCapacity = "lif",
    CarryingCapacity = "car",
    UnarmedDmg = "una"
}

const RECOVERY_DICE = ["d4", "d6", "d8", "d10", "d12", "d20"];
export function willpowerToRecoveryDie(attrValue: number) {
    const willpower = attrValue;
    return RECOVERY_DICE[
        Math.min(Math.ceil(willpower / 2), RECOVERY_DICE.length)
    ];
}

const SENSES_RANGES = [5, 10, 20, 50, 100, Number.MAX_SAFE_INTEGER];
export function awarenessToSensesRange(attrValue: number) {
    const awareness = attrValue;
    return SENSES_RANGES[
        Math.min(Math.ceil(awareness / 2), SENSES_RANGES.length)
    ];
}

const MOVEMENT_RATES = [20, 25, 30, 40, 60, 80];
export function speedToMovementRate(attrValue: number) {
    const speed = attrValue;
    return MOVEMENT_RATES[
        Math.min(Math.ceil(speed / 2), MOVEMENT_RATES.length)
    ];
}

const LIFTING_CAPACITIES = [100, 200, 500, 1000, 5000, 10000];
export function strengthToLiftingCapacity(attrValue: number) {
    const strength = attrValue;
    return LIFTING_CAPACITIES[
        Math.min(Math.ceil(strength / 2), LIFTING_CAPACITIES.length)
    ];
}

const CARRYING_CAPACITIES = [50, 100, 250, 500, 2500, 5000];
export function strengthToCarryingCapacity(attrValue: number) {
    const strength = attrValue;
    return CARRYING_CAPACITIES[
        Math.min(Math.ceil(strength / 2), CARRYING_CAPACITIES.length)
    ];
}

const UNARMED_DMG = ["1", "1", "1", "1d4", "1d4", "1d8", "1d8", "2d6", "2d6", "2d10"];
export function strengthToUnarmedDamage(attrValue: number) {
    const strength = attrValue;
    return UNARMED_DMG[
        Math.min(strength, UNARMED_DMG.length)
    ];
}

export function getHealthIncreaseFromStrIncreaseAndLevel(currentLevel: number, strInc: number){
    //TODO: Change to respect changes in AdvancementData
    return (Math.ceil(currentLevel/5) * strInc);
}