# Remotion dependency and licensing

`@stagecut/react` uses `@remotion/player` and `remotion` as its internal playback adapter. Those packages have licensing requirements independent from Stagecut's MIT License, and some companies may need a Remotion license.

Stagecut does not acknowledge those terms on behalf of consumers. `StagecutPlayer` exposes `acknowledgeRemotionLicense`; pass it only after your organization has reviewed the current Remotion license. Omitting it preserves Remotion's own license notice.
