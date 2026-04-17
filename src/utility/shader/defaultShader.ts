export const DEFAULT_SHADER = `// WebGL Shader Playground
// Compatible with ShaderToy uniforms:
//   iTime       - shader playback time (in seconds)
//   iResolution - viewport resolution (in pixels)
//   iMouse      - mouse pixel coords (xy: current, zw: click)
//   iFrame      - shader playback frame
//   iChannel0   - webcam texture (if enabled)
//   iChannel1   - microphone / system audio frequency texture (if enabled)
//   iChannel2   - Strudel live-coding audio frequency texture (if enabled)

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

void main() {
  vec2 uv = gl_FragCoord.xy / iResolution.xy;
  
  // Animated gradient
  vec3 col = 0.5 + 0.5 * cos(iTime + uv.xyx + vec3(0.0, 2.0, 4.0));
  
  // Add some wave distortion
  float wave = sin(uv.x * 10.0 + iTime * 2.0) * 0.05;
  col += vec3(wave, wave * 0.5, wave * 2.0);
  
  // Sample webcam if enabled (iChannel0)
  if (iChannel0Enabled) {
    vec2 camUV = vec2(uv.x, 1.0 - uv.y);
    vec4 camColor = texture2D(iChannel0, camUV);
    col = mix(col, camColor.rgb, 0.5);
  }
  
  // Sample audio frequency data if enabled (iChannel1)
  // iChannel1 is a 1D texture where each texel's red channel is a frequency bin
  if (iChannel1Enabled) {
    float freq = texture2D(iChannel1, vec2(uv.x, 0.5)).r;
    col += vec3(0.0, freq * 0.3, freq * 0.6);
  }
  
  // Sample Strudel audio frequency data if enabled (iChannel2)
  // iChannel2 works the same as iChannel1 – 1D frequency texture from Strudel
  if (iChannel2Enabled) {
    float freq2 = texture2D(iChannel2, vec2(uv.x, 0.5)).r;
    col += vec3(freq2 * 0.6, freq2 * 0.1, freq2 * 0.4);
  }
  
  gl_FragColor = vec4(col, 1.0);
}
`
