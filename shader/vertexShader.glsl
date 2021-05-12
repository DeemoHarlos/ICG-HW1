// TODO HERE:
// modify vertex shader or write another one
// to implement flat, gouraud and phong shading

// NOTE:
// if you want to write bonus part (texture mapping),
// only Teapot.json has extra attribute "vertexTextureCoords"
// which is used for texture mappping.

uniform int shading;

uniform mat4 Mmat;
uniform mat4 Pmat;
uniform mat4 Lmat;

uniform vec3 light1Pos;
uniform vec3 light1C;
uniform vec3 light2Pos;
uniform vec3 light2C;
uniform vec3 light3Pos;
uniform vec3 light3C;

uniform float amb_c;
uniform float dif_c;
uniform float spc_c;
uniform float spc_p;

attribute vec3 srcPos;
attribute vec3 srcNorm;
attribute vec3 fColor;

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

  // get position from pov
  pos = (Mmat * vec4(srcPos, 1.0)).xyz;
  gl_Position = Pmat * vec4(pos, 1.0);

  // light pos
  l1pos = (Lmat * vec4(light1Pos, 1.0)).xyz;
  l2pos = (Lmat * vec4(light2Pos, 1.0)).xyz;
  l3pos = (Lmat * vec4(light3Pos, 1.0)).xyz;

  // get normal from pov
  norm = mat3(Mmat) * srcNorm;

  color = (shading != 2) ? fColor : ( amb_c * fColor + 
    // Gouraud shading
    getReflect(pos, norm, fColor, l1pos, light1C) +
    getReflect(pos, norm, fColor, l2pos, light2C) +
    getReflect(pos, norm, fColor, l3pos, light3C)
  );

}
