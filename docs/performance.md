# Performance

The reference target is 1920×1080 at 60 fps with 500 Scenes and up to eight Layers per Scene.

Stagecut guarantees algorithmic bounds rather than the rendering cost of application-owned Surface components:

- active Scene selection is O(log n);
- one Scene is mounted normally and at most two during a transition;
- the reference limit is therefore eight mounted Surfaces normally and sixteen during a transition;
- repeated frame values do not notify controller subscribers;
- package builds keep React and Remotion external.

The Gallery Performance Lab reports browser animation frames and the actual mounted Scene/Surface counts. A release candidate should average at least 58 fps on the maintainer reference device with the included lightweight surfaces. Profile real Surface components independently because layout, images, fonts, and effects can dominate runtime cost.
