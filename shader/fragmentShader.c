// TODO HERE: 
// modify fragment shader or write another one
// to implement flat, gouraud and phong shading

#extension GL_OES_standard_derivatives : enable

precision mediump float;

varying vec4 fragcolor;
varying vec3 frontColor;
varying vec3 V;
varying vec3 N;
varying vec3 L;
varying vec3 H;
varying vec3 vertex_view_space;

void main(void) {
  vec3 U = dFdx(vertex_view_space);                     
  vec3 V = dFdy(vertex_view_space);                 
  vec3 NN = normalize(cross(U,V));

  // Light source position and color
  vec3 lightPos = vec3(30, 30, -30);
  vec3 lightColor = vec3(1.0, .95, .85);

  // intensities
  float cos = max(dot(L,N), 0.0); // light intensity
  float cosAlpha = max(dot(H,N), 0.0); // specular intensity

  // constants
  float ambientConst  =  0.1;
  float diffuseConst  =  0.8;
  float specularConst =  0.4;
  float specularPower = 100.0;

  // Three Reflection Model
  vec3 ambient  = lightColor *  ambientConst * frontColor;
  vec3 diffuse  = lightColor *  diffuseConst * frontColor * cos;
  vec3 specular = lightColor * specularConst * pow(cosAlpha, specularPower);

  // gouraud shading
  vec3 gouraud = ambient + diffuse + specular;

  // gl_FragColor = fragcolor;
  gl_FragColor = vec4(gouraud, 1.0);
}
