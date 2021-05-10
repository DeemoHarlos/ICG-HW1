// TODO HERE: 
// modify fragment shader or write another one
// to implement flat, gouraud and phong shading

#extension GL_OES_standard_derivatives : enable
precision mediump float;

varying vec4 color;
varying vec3 frontColor;

varying vec3 pos;

varying vec3 pos_n;
varying vec3 norm_n;
varying vec3 src2light_n;
varying vec3 lightPos_n;

void main(void) {
  vec3 U = dFdx(pos);                     
  vec3 V = dFdy(pos);                 
  vec3 phong_norm_n = normalize(cross(U, V));

  // Light source position and color
  vec3 lightPos = vec3(30, 30, -30);
  vec3 lightC = vec3(1.0, .95, .85);

  // intensities
  float dif_i = max(dot(src2light_n, norm_n), 0.0); //  diffuse intensity
  float spc_i = max(dot( lightPos_n, norm_n), 0.0); // specular intensity

  // constants
  float amb_c =  0.1;
  float dif_c =  0.8;
  float spc_c =  0.4;
  float spc_p = 16.0;

  // Three Reflection Model
  vec3 amb = amb_c * lightC * frontColor;
  vec3 dif = dif_c * lightC * dif_i;
  vec3 spc = spc_c * lightC * pow(spc_i, spc_p);

  // phong shading
  vec3 phong = amb + dif + spc;

  // gl_FragColor = color;
  gl_FragColor = vec4(phong, 1.0);
}
