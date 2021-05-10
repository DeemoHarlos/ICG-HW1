// TODO HERE:
// modify vertex shader or write another one
// to implement flat, gouraud and phong shading

// NOTE:
// if you want to write bonus part (texture mapping),
// only Teapot.json has extra attribute "vertexTextureCoords"
// which is used for texture mappping.

uniform int SHADING;
uniform mat4 Mmat;
uniform mat4 Pmat;

attribute vec3 srcPos;
attribute vec3 srcNorm;
attribute vec3 fColor;

varying vec3 color;
varying vec3 pos;
varying vec3 norm_n;
varying vec3 src2light_n;
varying vec3 lightPos_n;

void main(void) {

  // get position from pov
  pos = (Mmat * vec4(srcPos, 1.0)).xyz;
  gl_Position = Pmat * vec4(pos, 1.0);

  // get normal from pov
  vec3 norm = mat3(Mmat) * srcNorm;

  // Light source
  vec3 lightPos = vec3(30, 30, -30);
  vec3 lightC = vec3(1.0, .9, .65);

  // vectors
  vec3 pos_n = normalize(pos);
  norm_n = normalize(norm);
  src2light_n = normalize(lightPos - pos);
  lightPos_n = normalize(src2light_n - pos_n);

  if (SHADING == 0 || SHADING == 1) {
    color = fColor;
    return;
  }

  // intensities
  float dif_i = max(dot(src2light_n, norm_n), 0.0);
  float spc_i = max(dot( lightPos_n, norm_n), 0.0);

  // constants
  float amb_c =  0.1;
  float dif_c =  0.8;
  float spc_c =  0.4;
  float spc_p = 16.0;

  // Three Reflection Model
  vec3 amb = amb_c * lightC * fColor;
  vec3 dif = dif_c * lightC * dif_i;
  vec3 spc = spc_c * lightC * pow(spc_i, spc_p);

  // gouraud shading
  vec3 grd = amb + dif + spc;
  color = grd;

}
