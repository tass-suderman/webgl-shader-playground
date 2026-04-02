export const DEFAULT_SHADER = `// WebGL Shader Playground
// Compatible with ShaderToy uniforms:
//   iTime       - shader playback time (in seconds)
//   iResolution - viewport resolution (in pixels)
//   iMouse      - mouse pixel coords (xy: current, zw: click)
//   iFrame      - shader playback frame
//   iChannel0   - webcam/mic texture (if enabled)

precision highp float;

uniform vec2 iResolution;
uniform float iTime;
uniform vec4 iMouse;
uniform int iFrame;
uniform sampler2D iChannel0;
uniform bool iChannel0Enabled;

void main() {
  vec2 uv = gl_FragCoord.xy / iResolution.xy;
  
  // Animated gradient
  vec3 col = 0.5 + 0.5 * cos(iTime + uv.xyx + vec3(0.0, 2.0, 4.0));
  
  // Add some wave distortion
  float wave = sin(uv.x * 10.0 + iTime * 2.0) * 0.05;
  col += vec3(wave, wave * 0.5, wave * 2.0);
  
  // Sample webcam if enabled
  if (iChannel0Enabled) {
    vec2 camUV = vec2(uv.x, 1.0 - uv.y);
    vec4 camColor = texture2D(iChannel0, camUV);
    col = mix(col, camColor.rgb, 0.5);
  }
  
  gl_FragColor = vec4(col, 1.0);
}
`
