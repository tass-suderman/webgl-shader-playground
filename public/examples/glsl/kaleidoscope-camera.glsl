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
  vec2 pos = gl_FragCoord.xy / iResolution.xy;


  pos -= .5;

 float symmetry_count = 8.0;
    float radius = sqrt(pow(pos.x, 2.0) + pow(pos.y, 2.0));
    float angle = atan(pos.y, pos.x);
    float wedge_size = (2.0 * 3.14) / symmetry_count;
    float angle_r = mod(angle, wedge_size);
    float angle_folded = abs(angle_r - (wedge_size/2.0));
    float x_folded = radius * cos(angle_folded);
    float y_folded = radius * sin(angle_folded);

    float sound = 0.;
    float freq = 0.;
    if(iChannel1Enabled)
    {
        sound = texture2D(iChannel1, vec2(x_folded, 0.25)).x;
        freq = texture2D(iChannel1, vec2(x_folded, 0.75)).x;
    } else if (iChannel2Enabled)
    {
        sound = texture2D(iChannel2, vec2(x_folded, 0.25)).x;
        freq = texture2D(iChannel2, vec2(x_folded, 0.75)).x;
    }

    vec4 cam = texture2D(iChannel0, vec2((sin(x_folded + sound/2.)), (1.-y_folded - freq/3.)));

  gl_FragColor = cam;
}
