import { compileStagecutVideo, defineStagecutProject } from "@stage-cut/core";
import { defineSurfaceRegistry } from "@stage-cut/react-player";
import { BeadPromoSurface } from "./cases/BeadPromoSurface";

const scenes = [
  { durationInFrames: 90, id: "hook", name: "A photo becomes a bead pattern", variant: "hook" },
  { durationInFrames: 150, id: "generate", name: "Generate locally from an image", variant: "generate" },
  { durationInFrames: 120, id: "size", name: "Linked dimensions and presets", variant: "size" },
  { durationInFrames: 150, id: "edit", name: "Batch selection and editing", variant: "edit" },
  { durationInFrames: 120, id: "zoom", name: "Sharp canvas zoom on every device", variant: "zoom" },
  { durationInFrames: 120, id: "materials", name: "Material counts and exports", variant: "materials" },
  { durationInFrames: 105, id: "private", name: "Private local autosave", variant: "private" },
  { durationInFrames: 105, id: "outro", name: "Bead Grid call to action", variant: "outro" },
] as const;

export const promoProject = defineStagecutProject({
  description: "Vertical product promo for Bead Grid, rendered with StageCut.",
  id: "bead-grid-promo",
  name: "Bead Grid Product Promo",
  schemaVersion: 1,
  stages: [{ background: "#f5f0e6", height: 1920, id: "vertical-stage", name: "Vertical 1080 × 1920", width: 1080 }],
  surfaces: [{ id: "bead-promo", name: "Bead Grid Promo Surface" }],
  videos: [
    {
      defaultTransition: { durationInFrames: 10, kind: "fade" },
      description: "From image upload to an editable, printable fuse-bead pattern.",
      fps: 30,
      id: "promo",
      name: "Bead Grid Vertical Promo",
      playback: { autoPlay: false, defaultStatus: "paused", loop: false },
      scenes: scenes.map((scene) => ({
        durationInFrames: scene.durationInFrames,
        id: scene.id,
        layers: [{ id: `${scene.id}-layer`, inputProps: { variant: scene.variant }, surfaceId: "bead-promo" }],
        name: scene.name,
      })),
      stageId: "vertical-stage",
    },
  ],
});

export const promoSurfaces = defineSurfaceRegistry(promoProject, { "bead-promo": BeadPromoSurface });
export const promoVideo = compileStagecutVideo(promoProject, "promo");
