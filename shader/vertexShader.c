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

attribute vec3 srcPos;
attribute vec3 srcNorm;
attribute vec3 fColor;

varying vec4 color;
varying vec3 frontColor;

varying vec3 pos;

varying vec3 pos_n;
varying vec3 norm_n;
varying vec3 src2light_n;
varying vec3 lightPos_n;

void main(void) {
  // Light source position and color
  vec3 lightPos = vec3(30, 30, -30);
  vec3 lightC = vec3(1.0, .95, .85);

  // get position from pov
  pos = (Mmat * vec4(srcPos, 1.0)).xyz;
  // get normal from pov
  vec3 norm = mat3(Mmat) * srcNorm;

  // vectors
  pos_n = normalize(pos); // normal of view to src
  norm_n = normalize(norm); // trangle normal
  src2light_n = normalize(lightPos - pos); // triangle to light
  lightPos_n = normalize(src2light_n - pos_n); // pov to light

  // intensities
  float dif_i = max(dot(src2light_n, norm_n), 0.0); //  diffuse intensity
  float spc_i = max(dot( lightPos_n, norm_n), 0.0); // specular intensity

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

  // color = vec4(fColor.rgb, 1.0);
  frontColor = fColor;
  color = vec4(grd, 1.0);
  norm_n = norm;
  // gl_Position = Pmat * Mmat * vec4(srcPos, 1.0);

  gl_Position = Pmat * vec4(pos, 1.0);  
}
