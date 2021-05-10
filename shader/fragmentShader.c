// TODO HERE: 
// modify fragment shader or write another one
// to implement flat, gouraud and phong shading

#extension GL_OES_standard_derivatives : enable
precision mediump float;

uniform highp int SHADING;

varying vec3 color;
varying vec3 pos;
varying vec3 norm_n;
varying vec3 src2light_n;
varying vec3 lightPos_n;

void main(void) {

  if (SHADING == 0 || SHADING == 2) {
    gl_FragColor = vec4(color.rgb, 1.0);
    return;
  }

  vec3 norm = (SHADING == 1) ?
    normalize(cross(dFdx(pos), dFdy(pos))) :
    norm_n;

  // Light source position and color
  vec3 lightPos = vec3(30, 30, -30);
  vec3 lightC = vec3(1.0, .9, .65);

  // intensities
  float dif_i = max(dot(src2light_n, norm), 0.0);
  float spc_i = max(dot( lightPos_n, norm), 0.0);

  // constants
  float amb_c =  0.1;
  float dif_c =  0.8;
  float spc_c =  0.4;
  float spc_p = 16.0;

  // Three Reflection Model
  vec3 amb = amb_c * lightC * color;
  vec3 dif = dif_c * lightC * dif_i;
  vec3 spc = spc_c * lightC * pow(spc_i, spc_p);

  // phong shading
  vec3 fragColor = amb + dif + spc;
  gl_FragColor = vec4(fragColor, 1.0);

}
