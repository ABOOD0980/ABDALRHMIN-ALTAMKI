export const CARD_VERTEX_SHADER = `
varying vec2 vUv;
void main() {
  vUv = uv;
  gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
}
`;

export const CARD_FRAGMENT_SHADER = `
uniform sampler2D map;
uniform vec2 cover;
uniform float aspect;
uniform float ready;
uniform float radius;
varying vec2 vUv;

void main() {
  vec2 q = (abs(vUv - 0.5) - 0.5) * vec2(aspect, 1.0) + radius;
  float d = length(max(q, 0.0)) + min(max(q.x, q.y), 0.0) - radius;
  float px = max(fwidth(d), 0.0005);
  float a = 1.0 - smoothstep(-px, px, d);
  if (a < 0.01) discard;
  vec2 uv = vUv;
  if (!gl_FrontFacing) uv.x = 1.0 - uv.x;
  vec3 c = mix(vec3(0.075), texture2D(map, (uv - 0.5) * cover + 0.5).rgb, ready);
  float edge = smoothstep(-0.012 - px, -0.012, d);
  gl_FragColor = vec4(mix(c, vec3(1.0), edge * 0.1), a);
}
`;
