// TODO HERE:
// modify vertex shader or write another one
// to implement flat, gouraud and phong shading

// NOTE:
// if you want to write bonus part (texture mapping),
// only Teapot.json has extra attribute "vertexTextureCoords"
// which is used for texture mappping.

attribute vec3 aVertexPosition;
attribute vec3 aFrontColor;
attribute vec3 aVertexNormal;

uniform mat4 uMVMatrix;
uniform mat4 uPMatrix;

varying vec4 fragcolor;
varying vec3 frontColor;
varying vec3 V;
varying vec3 N;
varying vec3 L;
varying vec3 H;
varying vec3 vertex_view_space;

void main(void) {
  // Light source position and color
  vec3 lightPos = vec3(30, 30, -30);
  vec3 lightColor = vec3(1.0, .95, .85);

  // get position from pov
  vec3 mvVertex = (uMVMatrix * vec4(aVertexPosition, 1.0)).xyz;
  // get normal from pov
  vec3 mvNormal = mat3(uMVMatrix) * aVertexNormal;

  // vectors
  V = -normalize(mvVertex); // target to pov
  N = normalize(mvNormal); // normal of trangle
  L = normalize(lightPos - mvVertex); // triangle to light
  H = normalize(L+V); // pov to light

  // intensities
  float cos = max(dot(L,N), 0.0); // light intensity
  float cosAlpha = max(dot(H,N), 0.0); // specular intensity

  // constants
  float ambientConst  =  0.1;
  float diffuseConst  =  0.8;
  float specularConst =  0.4;
  float specularPower = 16.0;

  // Three Reflection Model
  vec3 ambient  = lightColor *  ambientConst * aFrontColor;
  vec3 diffuse  = lightColor *  diffuseConst * aFrontColor * cos;
  vec3 specular = lightColor * specularConst * pow(cosAlpha, specularPower);

  // gouraud shading
  vec3 gouraud = ambient + diffuse + specular;

  // fragcolor = vec4(aFrontColor.rgb, 1.0);
  frontColor = aFrontColor;
  fragcolor = vec4(gouraud, 1.0);
  N = mvNormal;
  // gl_Position = uPMatrix * uMVMatrix * vec4(aVertexPosition, 1.0);

  vertex_view_space = (uMVMatrix * vec4(aVertexPosition, 1.0)).xyz;  
  gl_Position = uPMatrix * vec4(vertex_view_space, 1.0);  
}
