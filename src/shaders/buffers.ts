// Default GLSL code for the three buffer passes (iChannel3, iChannel4, iChannel6).
// Each buffer has the same uniform interface as the main shader and can read
// from iChannel0–iChannel2 (webcam / audio / strudel) as well as the other
// buffer pass outputs from the previous frame.

const BUFFER_SHADER_HEADER = `// Buffer pass – renders every frame to an offscreen texture.
// The result is available as iChannelN in all other passes and in the main shader.
//
// Available uniforms:
//   iTime       - shader playback time (in seconds)
//   iResolution - viewport resolution (in pixels)
//   iMouse      - mouse pixel coords (xy: current, zw: click)
//   iFrame      - shader playback frame
//   iChannel0   - webcam texture (if enabled)
//   iChannel1   - microphone / system audio frequency texture (if enabled)
//   iChannel2   - Strudel live-coding audio frequency texture (if enabled)
//   iChannel3   - Buffer A output (previous frame of this buffer for self-reference)
//   iChannel4   - Buffer B output (previous frame of this buffer for self-reference)
//   iChannel6   - Buffer C output (previous frame of this buffer for self-reference)

precision highp float;

uniform vec2 iResolution;
uniform float iTime;
uniform vec4 iMouse;
uniform int iFrame;
uniform sampler2D iChannel0;
uniform bool iChannel0Enabled;
uniform sampler2D iChannel1;
uniform bool iChannel1Enabled;
uniform sampler2D iChannel2;
uniform bool iChannel2Enabled;
uniform sampler2D iChannel3;
uniform sampler2D iChannel4;
uniform sampler2D iChannel6;

`

export const DEFAULT_BUFFER3_SHADER = BUFFER_SHADER_HEADER + `void main() {
  vec2 uv = gl_FragCoord.xy / iResolution.xy;
  // Buffer A (iChannel3) – output a simple animated pattern
  vec3 col = 0.5 + 0.5 * cos(iTime * 0.5 + uv.xyx * 6.28 + vec3(0.0, 2.0, 4.0));
  gl_FragColor = vec4(col, 1.0);
}
`

export const DEFAULT_BUFFER4_SHADER = BUFFER_SHADER_HEADER + `void main() {
  vec2 uv = gl_FragCoord.xy / iResolution.xy;
  // Buffer B (iChannel4) – sample Buffer A and add a ripple
  vec3 bufA = texture2D(iChannel3, uv).rgb;
  float wave = sin(uv.x * 20.0 + iTime * 3.0) * 0.05;
  vec2 distUV = vec2(uv.x, uv.y + wave);
  vec3 col = texture2D(iChannel3, distUV).rgb;
  gl_FragColor = vec4(col, 1.0);
}
`

export const DEFAULT_BUFFER6_SHADER = BUFFER_SHADER_HEADER + `void main() {
  vec2 uv = gl_FragCoord.xy / iResolution.xy;
  // Buffer C (iChannel6) – blend Buffer A and Buffer B
  vec3 bufA = texture2D(iChannel3, uv).rgb;
  vec3 bufB = texture2D(iChannel4, uv).rgb;
  vec3 col = mix(bufA, bufB, 0.5 + 0.5 * sin(iTime * 0.7));
  gl_FragColor = vec4(col, 1.0);
}
`
