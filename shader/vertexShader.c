// TODO HERE:
// modify vertex shader or write another one
// to implement flat, gouraud and phong shading

// NOTE:
// if you want to write bonus part (texture mapping),
// only Teapot.json has extra attribute "vertexTextureCoords"
// which is used for texture mappping.

attribute vec3 aVertexPosition;
attribute vec3 aFrontColor;

uniform mat4 uMVMatrix;
uniform mat4 uPMatrix;

varying vec4 fragcolor;

void main(void) {
  fragcolor = vec4(aFrontColor.rgb, 1.0);
  gl_Position = uPMatrix * uMVMatrix * vec4(aVertexPosition, 1.0);
}
