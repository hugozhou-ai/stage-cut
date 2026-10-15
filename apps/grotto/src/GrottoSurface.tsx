import { StagecutResource, type SurfaceComponentProps } from "@stage-cut/react-player";
import { useLayoutEffect, useRef } from "react";
import { staticFile } from "remotion";
import { fragmentShader, vertexShader } from "./shaders";

interface Engine {
  draw(time: number): void;
  dispose(): void;
}

function createEngine(canvas: HTMLCanvasElement, images: HTMLImageElement[]): Engine {
  const gl = canvas.getContext("webgl2", { alpha: false, antialias: false, preserveDrawingBuffer: true });
  if (!gl) throw new Error("Grotto requires WebGL2");
  const compile = (source: string, type: number) => {
    const shader = gl.createShader(type);
    if (!shader) throw new Error("Shader allocation failed");
    gl.shaderSource(shader, source);
    gl.compileShader(shader);
    if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS))
      throw new Error(gl.getShaderInfoLog(shader) ?? "Shader compile failed");
    return shader;
  };
  const vertex = compile(vertexShader, gl.VERTEX_SHADER);
  const fragment = compile(fragmentShader, gl.FRAGMENT_SHADER);
  const program = gl.createProgram();
  if (!program) throw new Error("Program allocation failed");
  gl.attachShader(program, vertex);
  gl.attachShader(program, fragment);
  gl.linkProgram(program);
  if (!gl.getProgramParameter(program, gl.LINK_STATUS))
    throw new Error(gl.getProgramInfoLog(program) ?? "Shader link failed");
  // biome-ignore lint/correctness/useHookAtTopLevel: WebGLRenderingContext.useProgram is not a React hook.
  gl.useProgram(program);
  const buffer = gl.createBuffer();
  gl.bindBuffer(gl.ARRAY_BUFFER, buffer);
  gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 1, -1, -1, 1, -1, 1, 1, -1, 1, 1]), gl.STATIC_DRAW);
  const position = gl.getAttribLocation(program, "position");
  gl.enableVertexAttribArray(position);
  gl.vertexAttribPointer(position, 2, gl.FLOAT, false, 0, 0);
  const textures = images.map((image, index) => {
    const texture = gl.createTexture();
    gl.activeTexture(gl.TEXTURE0 + index);
    gl.bindTexture(gl.TEXTURE_2D, texture);
    gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, image);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.REPEAT);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
    return texture;
  });
  const clock = gl.getUniformLocation(program, "time");
  gl.uniform1i(gl.getUniformLocation(program, "mural"), 0);
  gl.uniform1i(gl.getUniformLocation(program, "statueTexture"), 1);
  gl.uniform2f(gl.getUniformLocation(program, "resolution"), canvas.width, canvas.height);
  console.log(
    `[grotto] ${JSON.stringify({ event: "engine-ready", width: canvas.width, height: canvas.height, renderer: gl.getParameter(gl.RENDERER) })}`,
  );
  return {
    draw(time) {
      gl.viewport(0, 0, canvas.width, canvas.height);
      gl.uniform1f(clock, time);
      gl.drawArrays(gl.TRIANGLES, 0, 6);
      gl.finish();
    },
    dispose() {
      for (const texture of textures) gl.deleteTexture(texture);
      gl.deleteBuffer(buffer);
      gl.deleteProgram(program);
      gl.deleteShader(vertex);
      gl.deleteShader(fragment);
    },
  };
}

function GrottoCanvas({ context, images }: SurfaceComponentProps & { images: HTMLImageElement[] }) {
  const canvas = useRef<HTMLCanvasElement>(null);
  const engine = useRef<Engine | null>(null);
  useLayoutEffect(() => {
    if (!canvas.current) throw new Error("Missing grotto canvas");
    engine.current = createEngine(canvas.current, images);
    return () => {
      engine.current?.dispose();
      engine.current = null;
    };
  }, [images]);
  useLayoutEffect(() => {
    engine.current?.draw(context.globalFrame / context.fps);
  }, [context.globalFrame, context.fps]);
  return (
    <canvas
      ref={canvas}
      width={1440}
      height={660}
      style={{ position: "absolute", top: 100, left: 0, width: 1920, height: 880 }}
    />
  );
}
function loadImage(name: string, signal: AbortSignal) {
  return new Promise<HTMLImageElement>((resolve, reject) => {
    const image = new Image();
    const cleanup = () => signal.removeEventListener("abort", abort);
    const abort = () => {
      image.onload = null;
      image.onerror = null;
      image.src = "";
      reject(new Error(`Aborted image: ${name}`));
    };
    signal.addEventListener("abort", abort, { once: true });
    image.onload = () => {
      cleanup();
      resolve(image);
    };
    image.onerror = () => {
      cleanup();
      reject(new Error(`Cannot load grotto asset: ${name}`));
    };
    image.src = staticFile(name);
  });
}
export function GrottoSurface(props: SurfaceComponentProps) {
  return (
    <StagecutResource
      id="grotto-textures"
      load={(signal) => Promise.all([loadImage("mural.png", signal), loadImage("statue.png", signal)])}
    >
      {(images) => <GrottoCanvas {...props} images={images} />}
    </StagecutResource>
  );
}
