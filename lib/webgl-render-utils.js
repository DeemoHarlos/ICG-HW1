// shader program binding variables
let unis = [
	{ name: 'Pmat',      type: '4fv', mat: true  },
	{ name: 'Mmat',      type: '4fv', mat: true  },
	{ name: 'shading',   type: '1i' , mat: false },
	{ name: 'light1Pos', type: '3fv', mat: false },
	{ name: 'light1C',   type: '3fv', mat: false },
	{ name: 'light2Pos', type: '3fv', mat: false },
	{ name: 'light2C',   type: '3fv', mat: false },
	{ name: 'light3Pos', type: '3fv', mat: false },
	{ name: 'light3C',   type: '3fv', mat: false },
	{ name: 'amb_c',     type: '1f' , mat: false },
	{ name: 'dif_c',     type: '1f' , mat: false },
	{ name: 'spc_c',     type: '1f' , mat: false },
	{ name: 'spc_p',     type: '1f' , mat: false },
]

let attrs = [
	{ src: 'vertexPositions'  , dst: 'srcPos'  },
	{ src: 'vertexNormals'    , dst: 'srcNorm' },
	{ src: 'vertexFrontcolors', dst: 'fColor'  }
]

let curTime, frame

// init GL
function initGL(canvas) {
	let gl = canvas.getContext('webgl') || canvas.getContext('experimental-webgl')
	if (!gl) return console.error('Could not initialize WebGL!')
	if (!gl.getExtension('OES_standard_derivatives'))
		throw 'OES_standard_derivatives extension not supported!'
	if (!gl.getExtension('WEBGL_debug_shaders'))
		throw 'WEBGL_debug_shaders extension not supported!'
	gl.viewportWidth  = canvas.width
	gl.viewportHeight = canvas.height
	return gl
}

// linking variables
function linkUni(gl, sp, name) {
	sp[name] = gl.getUniformLocation(sp, name)
}

function linkAttr(gl, sp, name) {
	sp[name] = gl.getAttribLocation(sp, name)
	gl.enableVertexAttribArray(sp[name])
}

function passUni(gl, prog, name, type, value, mat) {
	let uniform = `uniform${mat ? 'Matrix' : ''}${type}`
	if (typeof gl[uniform] !== 'function')
		throw console.error('Invalid type!')
	if (mat) gl[uniform](prog[name], false, value)
	else gl[uniform](prog[name], value)
}

function passAttr(gl, prog, name, type, value, l) {
	gl.bindBuffer(gl.ARRAY_BUFFER, value)
	gl.vertexAttribPointer(prog[name], l, type, false, 0, 0)
}

// init shaders
async function getShader(gl, url, shaderType) {
	let res = await req(url, 'text')
	if (!res) return
	let shader = gl.createShader(shaderType)
	if (!shader) return
	gl.shaderSource(shader, res)
	gl.compileShader(shader)
	if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS))
		throw 'Error in getting shader parameter.\n' + gl.getShaderInfoLog(shader)
	return shader
}

async function initShaders(gl) {
	let vertexShader   = await getShader(gl, 'shader/vertexShader.glsl'  , gl.VERTEX_SHADER  )
	let fragmentShader = await getShader(gl, 'shader/fragmentShader.glsl', gl.FRAGMENT_SHADER)

	let sp = gl.createProgram()
	gl.attachShader(sp, vertexShader)
	gl.attachShader(sp, fragmentShader)
	gl.linkProgram(sp)
	if (!gl.getProgramParameter(sp, gl.LINK_STATUS))
		console.error('Could not initialise shaders')
	gl.useProgram(sp)

	unis .forEach(uni  => linkUni (gl, sp, uni.name))
	attrs.forEach(attr => linkAttr(gl, sp, attr.dst))

	return sp
}

// bind model data
function bindModel(gl, model) {
	model.buffer = {}
	attrs.forEach(attr => {
		let src = model.data[attr.src]
		if (src) {
			let buffer = gl.createBuffer()
			gl.bindBuffer(gl.ARRAY_BUFFER, buffer)
			gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(src), gl.STATIC_DRAW)
			buffer.itemSize = 3
			buffer.numItems = src.length / 3
			model.buffer[attr.src] = buffer
		} 
	})
}

// drawing
function initScene(gl) {
	gl.viewport(0, 0, gl.viewportWidth, gl.viewportHeight)
	gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT)
}

function drawModel(gl, sp, model, params) {
	for (attr of attrs) if (!model.buffer[attr.src]) return

	let shading = params.shading
	let transform = params.transform
	let cam = params.camera
	let lights = params.lights

	// Setup Projection Matrix
  let Pmat = mat4.create();
	mat4.perspective(45, gl.viewportWidth / gl.viewportHeight, 0.1, 1000.0, Pmat);

	// Setup Model-View Matrix
	// Note that glMatrix uses the OpenGL/Web GL convention of Post-Multiplication.
	// Therefore the the code order is the opposite of the actual geometry operation.
	let Mmat = mat4.create()
	mat4.identity(Mmat)

	// Camera view
	mat4.rotate(Mmat,  cam.angle[2] * Math.PI / 180, [0, 0, 1])
	mat4.rotate(Mmat,  cam.angle[0] * Math.PI / 180, [0, 1, 0])
	mat4.rotate(Mmat, -cam.angle[1] * Math.PI / 180, [1, 0, 0])
	mat4.translate(Mmat, cam.pos.map(x => -x))

	// transform
	mat4.translate(Mmat, transform.pos)
	mat4.scale(Mmat, transform.scale)
	mat4.rotate(Mmat, -transform.angle[2] * Math.PI / 180, [0, 0, 1])
	mat4.rotate(Mmat, -transform.angle[0] * Math.PI / 180, [0, 1, 0])
	mat4.rotate(Mmat,  transform.angle[1] * Math.PI / 180, [1, 0, 0])

	// normalize
	let ct = model.data.center
	let sz = model.data.size
	let scaling = 25 / Math.max(sz.x, sz.y, sz.z)
	let pos = [ -ct.x, -ct.y, -ct.z ]
	mat4.scale(Mmat, [scaling, scaling, scaling])
	mat4.translate(Mmat, pos)

	let uniValues = {
		Pmat     : Pmat,
		Mmat     : Mmat,
		shading  : shading.type,
		light1Pos: lights[0].pos,
		light1C  : lights[0].color,
		light2Pos: lights[1].pos,
		light2C  : lights[1].color,
		light3Pos: lights[2].pos,
		light3C  : lights[2].color,
		amb_c    : shading.amb_c,
		dif_c    : shading.dif_c,
		spc_c    : shading.spc_c,
		spc_p    : shading.spc_p,
	}

	// pass in the variables and data
	unis.forEach(uni => {
		passUni(gl, sp, uni.name, uni.type, uniValues[uni.name], uni.mat)
	})

	attrs.forEach(attr => {
		let buf = model.buffer[attr.src]
		if (buf) passAttr(gl, sp, attr.dst, gl.FLOAT, buf, buf.itemSize)
	})

	gl.drawArrays(gl.TRIANGLES, 0, model.buffer.vertexPositions.numItems)
}

function tick(gl, sp, ms, f) {
	let dt = (ms - curTime) || 0
	frame ++

	gl.viewport(0, 0, gl.viewportWidth, gl.viewportHeight)
	gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT)

	f(gl, sp, dt, frame % 60 === 0)

	let fps = (1000 / dt).toFixed(2)
	if (frame % 60 === 0) console.log(`FPS: ${fps}`)
	curTime = ms

	requestAnimFrame(ms => tick(gl, sp, ms, f))
}

async function startWebGL(sel, color, models, f) {
	let canvas = getEle(sel)
	scaleToWindow(canvas)
	listen('resize', e=>{ scaleToWindow(canvas) })

	let gl = initGL(canvas)
	let sp = await initShaders(gl)

	models.forEach(model => { bindModel(gl, model) })

	gl.clearColor(...color)
	gl.enable(gl.DEPTH_TEST)

	curTime = 0
	frame = 0

	tick(gl, sp, 0, f)
}
