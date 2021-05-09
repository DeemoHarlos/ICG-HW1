// TODO HERE: 
// modify fragment shader or write another one
// to implement flat, gouraud and phong shading

precision mediump float;

varying vec4 fragcolor;

void main(void) {
  gl_FragColor = fragcolor;
}
