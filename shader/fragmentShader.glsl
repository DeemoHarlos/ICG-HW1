// TODO HERE: 
// modify fragment shader or write another one
// to implement flat, gouraud and phong shading

#extension GL_OES_standard_derivatives : enable
precision highp float;

uniform highp int shading;

uniform highp vec3 light1C;
uniform highp vec3 light2C;
uniform highp vec3 light3C;

uniform highp float amb_c;
uniform highp float dif_c;
uniform highp float spc_c;
uniform highp float spc_p;

varying vec3 pos;
varying vec3 l1pos;
varying vec3 l2pos;
varying vec3 l3pos;
varying vec3 norm;
varying vec3 color;

vec3 getReflect(vec3 vPos, vec3 vNorm, vec3 vColor, vec3 lPos, vec3 lColor) {
  // vectors
  vec3 pos_n = normalize(vPos);
  vec3 norm_n = normalize(vNorm);
  vec3 src2light_n = normalize(lPos - vPos);
  vec3 lightPos_n = normalize(src2light_n - pos_n);

  // intensities
  float lightDist = dot(lPos - vPos, lPos - vPos);
  float light_i = 2500.0 / lightDist;
  float dif_i = max(dot(src2light_n, norm_n), 0.0);
  float spc_i = max(dot( lightPos_n, norm_n), 0.0);

  // Reflection Model
  vec3 dif = dif_c * lColor * vColor * dif_i * light_i;
  vec3 spc = spc_c * lColor * pow(spc_i, spc_p) * light_i;
  return dif + spc;
}

void main(void) {

  if (shading == 0 || shading == 2) {
    gl_FragColor = vec4(color.rgb, 1.0);
    return;
  }

  vec3 norm = (shading == 1) ? cross(dFdx(pos), dFdy(pos)) : norm;

  // phong shading
  vec3 fragColor = amb_c * color + 
    getReflect(pos, norm, color, l1pos, light1C) +
    getReflect(pos, norm, color, l2pos, light2C) +
    getReflect(pos, norm, color, l3pos, light3C);
  gl_FragColor = vec4(fragColor, 1.0);

}
