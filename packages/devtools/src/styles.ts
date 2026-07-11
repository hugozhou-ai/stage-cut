export const devtoolsStyles = `
.stagecut-devtools-root, .stagecut-devtools-root * { box-sizing: border-box; }
.stagecut-devtools-root { color: #e9ecf5; font-family: Inter, ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif; }
.stagecut-devtools-launcher { position: fixed; z-index: 2147483646; right: 24px; bottom: 24px; display: grid; gap: 8px; justify-items: end; }
.stagecut-devtools-launcher button { width: 58px; height: 58px; border: 1px solid rgba(255,255,255,.22); border-radius: 50%; color: white; background: #6d7ff5; box-shadow: 0 16px 48px rgba(32,38,72,.42); cursor: pointer; font-size: 22px; font-weight: 800; }
.stagecut-devtools-launcher button:hover { transform: translateY(-2px); }
.stagecut-devtools-launcher span { max-width: 260px; border-radius: 8px; padding: 8px 10px; color: #ffd8d8; background: #4b1e27; font-size: 12px; }
.stagecut-devtools-studio { position: fixed; z-index: 2147483645; inset: 0; display: grid; grid-template-rows: 58px minmax(0, 1fr); color: #e9ecf5; background: #0b0d13; }
.stagecut-devtools-topbar { display: flex; align-items: center; justify-content: space-between; gap: 20px; padding: 0 18px; border-bottom: 1px solid #292d39; background: #11141d; }
.stagecut-devtools-brand { display: flex; align-items: center; gap: 12px; min-width: 0; }
.stagecut-devtools-brand i { width: 10px; height: 10px; border-radius: 50%; background: #6d7ff5; box-shadow: 0 0 18px #6d7ff5; }
.stagecut-devtools-brand strong { display: block; font-size: 14px; }
.stagecut-devtools-brand small { display: block; overflow: hidden; color: #8f96aa; font-size: 11px; text-overflow: ellipsis; white-space: nowrap; }
.stagecut-devtools-actions { display: flex; align-items: center; gap: 8px; }
.stagecut-devtools-button { min-height: 32px; border: 1px solid #343948; border-radius: 7px; padding: 0 11px; color: #d8dceb; background: #1a1e29; cursor: pointer; font: inherit; font-size: 12px; }
.stagecut-devtools-button:hover:not(:disabled) { border-color: #6d7ff5; color: white; }
.stagecut-devtools-button:disabled { cursor: not-allowed; opacity: .45; }
.stagecut-devtools-button.primary { border-color: #6d7ff5; color: white; background: #596be3; }
.stagecut-devtools-layout { min-height: 0; display: grid; grid-template-columns: 260px minmax(420px, 1fr) 330px; }
.stagecut-devtools-panel { min-height: 0; overflow: auto; background: #11141b; }
.stagecut-devtools-sidebar { border-right: 1px solid #292d39; }
.stagecut-devtools-inspector { border-left: 1px solid #292d39; }
.stagecut-devtools-section { padding: 16px; border-bottom: 1px solid #252936; }
.stagecut-devtools-label { display: flex; align-items: center; justify-content: space-between; margin-bottom: 10px; color: #8f96aa; font-size: 10px; font-weight: 800; letter-spacing: .12em; text-transform: uppercase; }
.stagecut-devtools-select, .stagecut-devtools-input, .stagecut-devtools-textarea { width: 100%; border: 1px solid #343948; border-radius: 7px; color: #e9ecf5; background: #171a23; font: inherit; font-size: 12px; outline: none; }
.stagecut-devtools-select, .stagecut-devtools-input { height: 34px; padding: 0 9px; }
.stagecut-devtools-textarea { min-height: 92px; resize: vertical; padding: 9px; font-family: "SFMono-Regular", Consolas, monospace; line-height: 1.45; }
.stagecut-devtools-select:focus, .stagecut-devtools-input:focus, .stagecut-devtools-textarea:focus { border-color: #6d7ff5; box-shadow: 0 0 0 2px rgba(109,127,245,.15); }
.stagecut-devtools-field { display: grid; gap: 6px; margin-bottom: 12px; }
.stagecut-devtools-field > span { color: #9ba2b5; font-size: 11px; }
.stagecut-devtools-field-row { display: grid; grid-template-columns: 1fr 1fr; gap: 8px; }
.stagecut-devtools-scene-list { display: grid; gap: 5px; }
.stagecut-devtools-scene { width: 100%; display: grid; grid-template-columns: 1fr auto; align-items: center; gap: 6px; border: 1px solid transparent; border-radius: 7px; padding: 8px; color: #bbc1d1; background: #171a23; cursor: pointer; font: inherit; text-align: left; }
.stagecut-devtools-scene.active { border-color: #596be3; color: white; background: #22283c; }
.stagecut-devtools-scene.dragging { opacity: .45; }
.stagecut-devtools-scene strong { display: block; overflow: hidden; font-size: 12px; text-overflow: ellipsis; white-space: nowrap; }
.stagecut-devtools-scene small { color: #777f94; font-size: 10px; }
.stagecut-devtools-scene-handle { color: #656d82; font-size: 16px; }
.stagecut-devtools-inline-actions { display: flex; gap: 6px; margin-top: 10px; }
.stagecut-devtools-inline-actions .stagecut-devtools-button { flex: 1; }
.stagecut-devtools-workspace { min-width: 0; min-height: 0; display: grid; grid-template-rows: minmax(280px, 1fr) auto 190px; background: #0b0d13; }
.stagecut-devtools-preview { min-height: 0; display: grid; place-items: center; overflow: auto; padding: 24px; background-color: #0c0e14; background-image: linear-gradient(45deg,#11151f 25%,transparent 25%),linear-gradient(-45deg,#11151f 25%,transparent 25%),linear-gradient(45deg,transparent 75%,#11151f 75%),linear-gradient(-45deg,transparent 75%,#11151f 75%); background-position: 0 0,0 8px,8px -8px,-8px 0; background-size: 16px 16px; }
.stagecut-devtools-player-shell { width: min(100%, 1100px); border: 1px solid #303646; border-radius: 8px; overflow: hidden; background: black; box-shadow: 0 24px 60px rgba(0,0,0,.42); }
.stagecut-devtools-empty { max-width: 520px; padding: 28px; border: 1px solid #3d2930; border-radius: 10px; color: #edc7ce; background: #1b1217; }
.stagecut-devtools-empty strong { display: block; margin-bottom: 8px; color: #ff9eac; }
.stagecut-devtools-error-list { margin: 0; padding-left: 18px; font-family: "SFMono-Regular", Consolas, monospace; font-size: 11px; line-height: 1.6; }
.stagecut-devtools-transport { display: grid; grid-template-columns: auto minmax(180px, 1fr) auto; align-items: center; gap: 12px; padding: 10px 16px; border-top: 1px solid #252936; border-bottom: 1px solid #252936; background: #12151e; }
.stagecut-devtools-transport-buttons { display: flex; gap: 6px; }
.stagecut-devtools-range { width: 100%; accent-color: #6d7ff5; }
.stagecut-devtools-time { color: #a5acbd; font-family: "SFMono-Regular", Consolas, monospace; font-size: 11px; white-space: nowrap; }
.stagecut-devtools-debug { min-height: 0; overflow: auto; display: grid; grid-template-columns: repeat(5, minmax(100px, 1fr)); gap: 1px; background: #282c38; }
.stagecut-devtools-stat { min-width: 0; padding: 14px; background: #12151d; }
.stagecut-devtools-stat span { display: block; margin-bottom: 8px; color: #777f93; font-size: 9px; font-weight: 800; letter-spacing: .1em; text-transform: uppercase; }
.stagecut-devtools-stat strong { display: block; overflow: hidden; color: #eef0f7; font-family: "SFMono-Regular", Consolas, monospace; font-size: 13px; text-overflow: ellipsis; white-space: nowrap; }
.stagecut-devtools-stat small { display: block; margin-top: 5px; color: #888fa2; font-size: 10px; }
.stagecut-devtools-notice { margin: 12px 16px 0; border: 1px solid #5e4b29; border-radius: 7px; padding: 10px; color: #e5c98c; background: #211c11; font-size: 11px; line-height: 1.45; }
.stagecut-devtools-error { margin-top: 6px; color: #ff9aaa; font-size: 10px; line-height: 1.4; }
.stagecut-devtools-layer { margin-bottom: 10px; border: 1px solid #303543; border-radius: 8px; padding: 10px; background: #151821; }
.stagecut-devtools-layer-head { display: flex; align-items: center; justify-content: space-between; gap: 8px; margin-bottom: 10px; }
.stagecut-devtools-layer-head strong { overflow: hidden; font-size: 11px; text-overflow: ellipsis; white-space: nowrap; }
.stagecut-devtools-mini-actions { display: flex; gap: 4px; }
.stagecut-devtools-mini-actions button { width: 26px; height: 25px; border: 1px solid #343948; border-radius: 5px; color: #aeb5c5; background: #1c202b; cursor: pointer; }
.stagecut-devtools-mini-actions button:disabled { opacity: .35; cursor: not-allowed; }
.stagecut-devtools-status { max-width: 340px; overflow: hidden; color: #9fa6b8; font-size: 11px; text-overflow: ellipsis; white-space: nowrap; }
@media (max-width: 1050px) {
  .stagecut-devtools-layout { grid-template-columns: 220px minmax(360px, 1fr); }
  .stagecut-devtools-inspector { position: fixed; z-index: 2; top: 58px; right: 0; bottom: 0; width: 330px; box-shadow: -16px 0 40px rgba(0,0,0,.35); }
  .stagecut-devtools-workspace { padding-right: 330px; }
}
`;
