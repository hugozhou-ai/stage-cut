const renderers = new Set(["angle", "swangle", "egl", "swiftshader", "vulkan", "angle-egl"]);

export function validateOptions(options) {
  if (!options.entry || !options.id) throw new Error("entry and id are required");
  if (!/^[a-zA-Z0-9_-]+$/.test(options.id)) throw new Error("id must be a composition ID, not a file path");
  const values = { out: ".artifacts/render", scale: 1, concurrency: 2, gl: "angle", ...options };
  if (!Number.isFinite(values.scale) || values.scale <= 0 || values.scale > 1)
    throw new Error("scale must be in (0, 1]");
  if (!Number.isSafeInteger(values.concurrency) || values.concurrency < 1)
    throw new Error("concurrency must be a positive integer");
  if (!renderers.has(values.gl)) throw new Error("unsupported GL renderer");
  if (values.frames !== undefined && (!Array.isArray(values.frames) || values.frames.length === 0))
    throw new Error("frames must be a non-empty array");
  return values;
}

export function validateFrameSelection(options, duration) {
  const frame = (value) => {
    if (!Number.isSafeInteger(value) || value < 0 || value >= duration)
      throw new Error(`Frame outside composition: ${value}`);
    return value;
  };
  let frameRange;
  if (options.frameRange !== undefined) {
    if (!Array.isArray(options.frameRange) || options.frameRange.length !== 2)
      throw new Error("frameRange must contain start and inclusive end");
    frameRange = options.frameRange.map(frame);
    if (frameRange[0] > frameRange[1]) throw new Error("Range start must not exceed end");
  }
  return {
    frameRange,
    frames: [...new Set((options.frames ?? []).map(frame))],
    ...(options.checkFrame === undefined ? {} : { checkFrame: frame(options.checkFrame) }),
  };
}

export function fromCli(values) {
  const numeric = (value, label) => {
    if (typeof value !== "string" || !/^\d+(?:\.\d+)?$/.test(value)) throw new Error(`${label} must be numeric`);
    return Number(value);
  };
  let frameRange;
  if (values.range !== undefined) {
    if (!/^\d+-\d+$/.test(values.range)) throw new Error("--range must be inclusive start-end");
    frameRange = values.range.split("-").map(Number);
  }
  return validateOptions({
    entry: values.entry,
    id: values.id,
    out: values.out ?? ".artifacts/render",
    scale: numeric(values.scale ?? "1", "scale"),
    concurrency: numeric(values.concurrency ?? "2", "concurrency"),
    gl: values.gl ?? "angle",
    stillsOnly: values["stills-only"] ?? false,
    ...(values.frames === undefined
      ? {}
      : { frames: values.frames.split(",").map((value) => numeric(value, "frames")) }),
    ...(frameRange === undefined ? {} : { frameRange }),
    ...(values["check-frame"] === undefined ? {} : { checkFrame: numeric(values["check-frame"], "check-frame") }),
  });
}
