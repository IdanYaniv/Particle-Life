// WebGL2 Renderer — watercolor blobs with gaussian falloff + FBO trail system
// Instanced quad rendering: one draw call for all particles
//
// Pipeline per frame:
//   1. Fade fboA → fboB (trail persistence toward background)
//   2. Draw particles onto fboB (instanced, premultiplied alpha blend)
//   3. Blit fboB to screen
//   4. Swap fboA ↔ fboB

const VERT_SRC = `#version 300 es
precision highp float;

in vec2 a_quad;
in vec2 a_position;
in vec2 a_velocity;
in vec3 a_color;
in float a_size;

uniform vec2 u_resolution;

out vec2 v_uv;
out vec3 v_color;

void main() {
  float speed = length(a_velocity);
  float stretch = 1.0 + min(speed * 0.15, 0.6);

  float angle = speed > 0.1 ? atan(a_velocity.y, a_velocity.x) : 0.0;
  float cs = cos(angle);
  float sn = sin(angle);

  vec2 scaled = a_quad * a_size;
  scaled.x *= stretch;

  vec2 rotated = vec2(
    scaled.x * cs - scaled.y * sn,
    scaled.x * sn + scaled.y * cs
  );

  vec2 pos = a_position + rotated;
  vec2 ndc = (pos / u_resolution) * 2.0 - 1.0;
  ndc.y = -ndc.y;

  gl_Position = vec4(ndc, 0.0, 1.0);
  v_uv = a_quad;
  v_color = a_color;
}
`;

const FRAG_SRC = `#version 300 es
precision highp float;

in vec2 v_uv;
in vec3 v_color;

out vec4 fragColor;

void main() {
  float dist = length(v_uv);
  if (dist > 1.0) discard;

  // Gaussian falloff
  float gauss = exp(-dist * dist * 3.0);

  // Dark core in center
  float coreRadius = 0.15;
  float coreMask = smoothstep(0.0, coreRadius, dist);

  vec3 coreColor = vec3(0.08, 0.06, 0.05);
  vec3 color = mix(coreColor, v_color, coreMask);

  float alpha = gauss * smoothstep(1.0, 0.7, dist);

  // Premultiplied alpha output
  fragColor = vec4(color * alpha, alpha);
}
`;

const FULLSCREEN_VERT = `#version 300 es
precision highp float;
in vec2 a_pos;
out vec2 v_uv;
void main() {
  v_uv = a_pos * 0.5 + 0.5;
  gl_Position = vec4(a_pos, 0.0, 1.0);
}
`;

const FADE_FRAG = `#version 300 es
precision highp float;
in vec2 v_uv;
uniform sampler2D u_texture;
uniform float u_fade;
uniform vec3 u_bgColor;
out vec4 fragColor;
void main() {
  vec4 prev = texture(u_texture, v_uv);
  vec3 faded = mix(prev.rgb, u_bgColor, u_fade);
  fragColor = vec4(faded, 1.0);
}
`;

const BLIT_FRAG = `#version 300 es
precision highp float;
in vec2 v_uv;
uniform sampler2D u_texture;
out vec4 fragColor;
void main() {
  fragColor = texture(u_texture, v_uv);
}
`;

function compileShader(gl, type, source) {
  const shader = gl.createShader(type);
  gl.shaderSource(shader, source);
  gl.compileShader(shader);
  if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
    const log = gl.getShaderInfoLog(shader);
    gl.deleteShader(shader);
    throw new Error('Shader compile error: ' + log);
  }
  return shader;
}

function linkProgram(gl, vertSrc, fragSrc) {
  const vert = compileShader(gl, gl.VERTEX_SHADER, vertSrc);
  const frag = compileShader(gl, gl.FRAGMENT_SHADER, fragSrc);
  const prog = gl.createProgram();
  gl.attachShader(prog, vert);
  gl.attachShader(prog, frag);
  gl.linkProgram(prog);
  if (!gl.getProgramParameter(prog, gl.LINK_STATUS)) {
    throw new Error('Program link error: ' + gl.getProgramInfoLog(prog));
  }
  return prog;
}

function createFBO(gl, w, h) {
  const tex = gl.createTexture();
  gl.bindTexture(gl.TEXTURE_2D, tex);
  gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA8, w, h, 0, gl.RGBA, gl.UNSIGNED_BYTE, null);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);

  const fbo = gl.createFramebuffer();
  gl.bindFramebuffer(gl.FRAMEBUFFER, fbo);
  gl.framebufferTexture2D(gl.FRAMEBUFFER, gl.COLOR_ATTACHMENT0, gl.TEXTURE_2D, tex, 0);
  gl.bindFramebuffer(gl.FRAMEBUFFER, null);
  return { fbo, tex };
}

function destroyFBO(gl, f) {
  gl.deleteTexture(f.tex);
  gl.deleteFramebuffer(f.fbo);
}

function hexToRGB(hex) {
  return [
    parseInt(hex.slice(1, 3), 16) / 255,
    parseInt(hex.slice(3, 5), 16) / 255,
    parseInt(hex.slice(5, 7), 16) / 255,
  ];
}

export function createWebGLRenderer(canvas) {
  const gl = canvas.getContext('webgl2', {
    alpha: false,
    antialias: false,
    premultipliedAlpha: false,
    preserveDrawingBuffer: true,
  });
  if (!gl) throw new Error('WebGL2 not supported');

  let W = canvas.width;
  let H = canvas.height;
  let bgColor = [0.961, 0.941, 0.922]; // #f5f0eb
  let trailFade = 0.03;

  // --- Programs ---
  const particleProg = linkProgram(gl, VERT_SRC, FRAG_SRC);
  const fadeProg = linkProgram(gl, FULLSCREEN_VERT, FADE_FRAG);
  const blitProg = linkProgram(gl, FULLSCREEN_VERT, BLIT_FRAG);

  // --- Uniforms ---
  const u_resolution = gl.getUniformLocation(particleProg, 'u_resolution');
  const u_fadeTex = gl.getUniformLocation(fadeProg, 'u_texture');
  const u_fadeAmount = gl.getUniformLocation(fadeProg, 'u_fade');
  const u_fadeBg = gl.getUniformLocation(fadeProg, 'u_bgColor');
  const u_blitTex = gl.getUniformLocation(blitProg, 'u_texture');

  // --- Quad geometry ---
  const quadVerts = new Float32Array([-1,-1, 1,-1, -1,1, -1,1, 1,-1, 1,1]);
  const quadBuf = gl.createBuffer();
  gl.bindBuffer(gl.ARRAY_BUFFER, quadBuf);
  gl.bufferData(gl.ARRAY_BUFFER, quadVerts, gl.STATIC_DRAW);

  // --- Instance buffers ---
  const positionBuf = gl.createBuffer();
  const velocityBuf = gl.createBuffer();
  const colorBuf = gl.createBuffer();
  const sizeBuf = gl.createBuffer();

  // --- Particle VAO ---
  const particleVAO = gl.createVertexArray();
  gl.bindVertexArray(particleVAO);

  const a_quad = gl.getAttribLocation(particleProg, 'a_quad');
  gl.bindBuffer(gl.ARRAY_BUFFER, quadBuf);
  gl.enableVertexAttribArray(a_quad);
  gl.vertexAttribPointer(a_quad, 2, gl.FLOAT, false, 0, 0);

  const a_position = gl.getAttribLocation(particleProg, 'a_position');
  gl.bindBuffer(gl.ARRAY_BUFFER, positionBuf);
  gl.enableVertexAttribArray(a_position);
  gl.vertexAttribPointer(a_position, 2, gl.FLOAT, false, 0, 0);
  gl.vertexAttribDivisor(a_position, 1);

  const a_velocity = gl.getAttribLocation(particleProg, 'a_velocity');
  gl.bindBuffer(gl.ARRAY_BUFFER, velocityBuf);
  gl.enableVertexAttribArray(a_velocity);
  gl.vertexAttribPointer(a_velocity, 2, gl.FLOAT, false, 0, 0);
  gl.vertexAttribDivisor(a_velocity, 1);

  const a_color = gl.getAttribLocation(particleProg, 'a_color');
  gl.bindBuffer(gl.ARRAY_BUFFER, colorBuf);
  gl.enableVertexAttribArray(a_color);
  gl.vertexAttribPointer(a_color, 3, gl.FLOAT, false, 0, 0);
  gl.vertexAttribDivisor(a_color, 1);

  const a_size = gl.getAttribLocation(particleProg, 'a_size');
  gl.bindBuffer(gl.ARRAY_BUFFER, sizeBuf);
  gl.enableVertexAttribArray(a_size);
  gl.vertexAttribPointer(a_size, 1, gl.FLOAT, false, 0, 0);
  gl.vertexAttribDivisor(a_size, 1);

  gl.bindVertexArray(null);

  // --- Fullscreen VAO (shared by fade + blit) ---
  const fsVAO = gl.createVertexArray();
  gl.bindVertexArray(fsVAO);
  gl.bindBuffer(gl.ARRAY_BUFFER, quadBuf);

  const a_fadePos = gl.getAttribLocation(fadeProg, 'a_pos');
  gl.enableVertexAttribArray(a_fadePos);
  gl.vertexAttribPointer(a_fadePos, 2, gl.FLOAT, false, 0, 0);

  gl.bindVertexArray(null);

  // --- FBOs (ping-pong) ---
  let fboA = createFBO(gl, W, H);
  let fboB = createFBO(gl, W, H);

  function clearFBOs() {
    for (const f of [fboA, fboB]) {
      gl.bindFramebuffer(gl.FRAMEBUFFER, f.fbo);
      gl.clearColor(bgColor[0], bgColor[1], bgColor[2], 1.0);
      gl.clear(gl.COLOR_BUFFER_BIT);
    }
    gl.bindFramebuffer(gl.FRAMEBUFFER, null);
  }
  clearFBOs();

  // Reusable typed arrays
  let posData = new Float32Array(0);
  let velData = new Float32Array(0);
  let colorData = new Float32Array(0);
  let sizeData = new Float32Array(0);

  function resize(w, h) {
    W = canvas.width = w;
    H = canvas.height = h;
    gl.viewport(0, 0, W, H);
    destroyFBO(gl, fboA);
    destroyFBO(gl, fboB);
    fboA = createFBO(gl, W, H);
    fboB = createFBO(gl, W, H);
    clearFBOs();
  }

  function render(physics, colors) {
    const { x, y, vx, vy, species, sizeTier, particleCount: N, SIZE_TIERS } = physics;

    // Grow typed arrays if needed
    if (posData.length < N * 2) {
      posData = new Float32Array(N * 2);
      velData = new Float32Array(N * 2);
      colorData = new Float32Array(N * 3);
      sizeData = new Float32Array(N);
    }

    // Pre-compute palette RGB
    const rgbs = colors.map(hexToRGB);

    // Pack per-instance data
    const baseSize = 12;
    for (let i = 0; i < N; i++) {
      const i2 = i * 2;
      const i3 = i * 3;
      posData[i2] = x[i];
      posData[i2 + 1] = y[i];
      velData[i2] = vx[i];
      velData[i2 + 1] = vy[i];
      const rgb = rgbs[species[i]];
      colorData[i3] = rgb[0];
      colorData[i3 + 1] = rgb[1];
      colorData[i3 + 2] = rgb[2];
      sizeData[i] = baseSize * SIZE_TIERS[sizeTier[i]];
    }

    // --- Pass 1: Fade fboA → fboB ---
    gl.bindFramebuffer(gl.FRAMEBUFFER, fboB.fbo);
    gl.viewport(0, 0, W, H);
    gl.disable(gl.BLEND);

    gl.useProgram(fadeProg);
    gl.activeTexture(gl.TEXTURE0);
    gl.bindTexture(gl.TEXTURE_2D, fboA.tex);
    gl.uniform1i(u_fadeTex, 0);
    gl.uniform1f(u_fadeAmount, trailFade);
    gl.uniform3fv(u_fadeBg, bgColor);

    gl.bindVertexArray(fsVAO);
    gl.drawArrays(gl.TRIANGLES, 0, 6);

    // --- Pass 2: Draw particles onto fboB ---
    // Keep fboB bound, enable blending
    gl.enable(gl.BLEND);
    gl.blendFunc(gl.ONE, gl.ONE_MINUS_SRC_ALPHA);

    gl.useProgram(particleProg);
    gl.uniform2f(u_resolution, W, H);

    gl.bindBuffer(gl.ARRAY_BUFFER, positionBuf);
    gl.bufferData(gl.ARRAY_BUFFER, posData.subarray(0, N * 2), gl.DYNAMIC_DRAW);
    gl.bindBuffer(gl.ARRAY_BUFFER, velocityBuf);
    gl.bufferData(gl.ARRAY_BUFFER, velData.subarray(0, N * 2), gl.DYNAMIC_DRAW);
    gl.bindBuffer(gl.ARRAY_BUFFER, colorBuf);
    gl.bufferData(gl.ARRAY_BUFFER, colorData.subarray(0, N * 3), gl.DYNAMIC_DRAW);
    gl.bindBuffer(gl.ARRAY_BUFFER, sizeBuf);
    gl.bufferData(gl.ARRAY_BUFFER, sizeData.subarray(0, N), gl.DYNAMIC_DRAW);

    gl.bindVertexArray(particleVAO);
    gl.drawArraysInstanced(gl.TRIANGLES, 0, 6, N);

    // --- Pass 3: Blit fboB to screen ---
    gl.bindFramebuffer(gl.FRAMEBUFFER, null);
    gl.viewport(0, 0, W, H);
    gl.disable(gl.BLEND);

    gl.useProgram(blitProg);
    gl.activeTexture(gl.TEXTURE0);
    gl.bindTexture(gl.TEXTURE_2D, fboB.tex);
    gl.uniform1i(u_blitTex, 0);

    gl.bindVertexArray(fsVAO);
    gl.drawArrays(gl.TRIANGLES, 0, 6);

    // --- Swap ---
    const tmp = fboA;
    fboA = fboB;
    fboB = tmp;
  }

  function setBgColor(hex) {
    bgColor = hexToRGB(hex);
    clearFBOs();
  }

  function setTrailFade(value) {
    trailFade = value;
  }

  return { resize, render, setBgColor, setTrailFade };
}
