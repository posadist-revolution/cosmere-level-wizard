
export interface BaseActorSheetRenderContext
    extends foundry.applications.sheets.ActorSheetV2.RenderContext {
    actor: CosmereActor;
    isEditMode: boolean;
}