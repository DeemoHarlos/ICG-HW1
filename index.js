// alias
let listen = window.addEventListener
let getEle = sel => document.querySelector(sel)
let req = (url, type) => {
	return new Promise(resolve => {
		let request = new XMLHttpRequest()
		request.responseType = type
		request.open('GET', url)
		request.onreadystatechange = () => {
			if (request.readyState === 4) resolve(request.response)
		}
		request.send()
	})
}

// common variables
let gl
let sp

let shading = 3 // 0 NO shading 1 FLAT 2 GOURAUD 3 PHONG
let models = [
	{ src: 'model/Teapot.json' },
	// { src: 'model/Car_road.json' },
	// { src: 'model/Church_s.json' },
	// { src: 'model/Csie.json' },
	// { src: 'model/Easter.json' },
	// { src: 'model/Fighter.json' },
	// { src: 'model/Kangaroo.json' },
	// { src: 'model/Longteap.json' },
	// { src: 'model/Mercedes.json' },
	// { src: 'model/Mig27.json' },
	// { src: 'model/Patchair.json' },
	// { src: 'model/Plant.json' },
	// { src: 'model/Tomcat.json' }
]

// Light source
let lightPos = [30, 30, -30];
let lightC = [1.0, .9, .65];

// constants
let amb_c =  0.1
let dif_c =  0.8
let spc_c =  0.4
let spc_p = 16.0

let unis = [
	'shading',
	'Pmat', 'Mmat',
	'lightPos', 'lightC',
	'amb_c', 'dif_c', 'spc_c', 'spc_p'
]
let attrs = [
	{ src: 'vertexPositions'  , dst: 'srcPos'  },
	{ src: 'vertexNormals'    , dst: 'srcNorm' },
	{ src: 'vertexFrontcolors', dst: 'fColor'  }
]

let curTime = 0

// init GL
function initGL(canvas) {
	gl = canvas.getContext('webgl') || canvas.getContext('experimental-webgl')
	if (!gl) return console.error('Could not initialize WebGL!')
	if (!gl.getExtension('OES_standard_derivatives'))
		throw 'extension not support'
	gl.viewportWidth  = canvas.width
	gl.viewportHeight = canvas.height
}

// linking variables
function linkUni(prog, name) {
	prog[name] = gl.getUniformLocation(prog, name)
}

function linkAttr(prog, name) {
	prog[name] = gl.getAttribLocation(prog, name)
	gl.enableVertexAttribArray(prog[name])
}

function passUni(prog, name, type, value, mat) {
	mat = mat || false
	let uniform = `uniform${mat ? 'Matrix' : ''}${type}`
	if (typeof gl[uniform] !== 'function')
		throw console.error('Invalid type!')
	if (mat) gl[uniform](prog[name], false, value)
	else gl[uniform](prog[name], value)
}

function passAttr(prog, name, type, value, l) {
	gl.bindBuffer(gl.ARRAY_BUFFER, value)
	gl.vertexAttribPointer(prog[name], l, type, false, 0, 0)
}

// init shaders
async function getShader(url, shaderType) {
	let res = await req(url, 'text')
	if (!res) return
	let shader = gl.createShader(shaderType)
	if (!shader) return
	gl.shaderSource(shader, res)
	gl.compileShader(shader)
	if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS))
		return console.error('Error in getting shader parameter.\n' + gl.getShaderInfoLog(shader))
	return shader
}

async function initShaders() {
	let vertexShader   = await getShader('shader/vertexShader.c'  , gl.VERTEX_SHADER  )
	let fragmentShader = await getShader('shader/fragmentShader.c', gl.FRAGMENT_SHADER)

	sp = gl.createProgram()
	gl.attachShader(sp, vertexShader)
	gl.attachShader(sp, fragmentShader)
	gl.linkProgram(sp)
	if (!gl.getProgramParameter(sp, gl.LINK_STATUS))
		console.error('Could not initialise shaders')
	gl.useProgram(sp)

	unis .forEach(uni  => linkUni (sp, uni     ))
	attrs.forEach(attr => linkAttr(sp, attr.dst))
}

// load
async function loadModel(model) {
	model.buffer = {}
	model.data = await req(model.src, 'json')
	attrs.forEach(attr => {
		let src = model.data[attr.src]
		console.log(attr.src)
		if (src) {
			let buffer = gl.createBuffer()
			gl.bindBuffer(gl.ARRAY_BUFFER, buffer)
			gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(src), gl.STATIC_DRAW)
			buffer.itemSize = 3
			buffer.numItems = src.length / 3
			model.buffer[attr.src] = buffer
		} 
	})
	preProcess(model)
}

async function initModels() {
	await Promise.all(models.map(loadModel))
}

// util
function degToRad(deg) {
	return deg * Math.PI / 180
}

function preProcess(model) {
	let positions = []
	let index = 0
	model.data.vertexPositions.forEach((e, i) => {
		if (i % 3 === 0) index = positions.push({}) - 1
		     if (i % 3 === 0) positions[index].x = e
		else if (i % 3 === 1) positions[index].y = e
		else if (i % 3 === 2) positions[index].z = e
	})
	let max = positions.reduce((r, e) => { return {
		x: Math.max(r.x, e.x),
		y: Math.max(r.y, e.y),
		z: Math.max(r.z, e.z)
	}})
	let min = positions.reduce((r, e) => { return {
		x: Math.min(r.x, e.x),
		y: Math.min(r.y, e.y),
		z: Math.min(r.z, e.z)
	}})
	model.data.bound = {
		max: max,
		min: min
	}
	model.data.center = {
		x: (max.x + min.x) / 2,
		y: (max.y + min.y) / 2,
		z: (max.z + min.z) / 2
	}
	model.data.size = {
		x: max.x - min.x,
		y: max.y - min.y,
		z: max.z - min.z
	}
}

/*
	TODO HERE:
	add two or more objects showing on the canvas
	(it needs at least three objects showing at the same time)
*/
function drawScene() {
	gl.viewport(0, 0, gl.viewportWidth, gl.viewportHeight)
	gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT)

	// Setup Projection Matrix
	let pMatrix  = mat4.create()
	mat4.perspective(45, gl.viewportWidth / gl.viewportHeight, 0.1, 100.0, pMatrix)
	gl.uniformMatrix4fv(sp.pMatrixUniform, false, pMatrix)

	models.forEach(drawModel)
}

function drawModel(model) {
	for (attr of attrs) if (!model.buffer[attr.src]) return

	// Setup Projection Matrix
  let Pmat = mat4.create();
	mat4.perspective(45, gl.viewportWidth / gl.viewportHeight, 0.1, 100.0, Pmat);

	// Setup Model-View Matrix
	// Note that glMatrix uses the OpenGL/Web GL convention of Post-Multiplication.
	// Therefore the the code order is the opposite of the actual geometry operation.
	let Mmat = mat4.create()
	mat4.identity(Mmat)
	mat4.translate(Mmat, [0, 0, -40])
	mat4.rotate(Mmat, degToRad(model.angle), [0, 1, 0])
	mat4.translate(Mmat, [
		model.data.center.x,
		model.data.center.y,
		model.data.center.z
	])

	passUni(sp, 'shading',  '1i' , shading)
	passUni(sp, 'Pmat',     '4fv', Pmat, true)
	passUni(sp, 'Mmat',     '4fv', Mmat, true)
	passUni(sp, 'lightPos', '3fv', lightPos)
	passUni(sp, 'lightC',   '3fv', lightC)
	passUni(sp, 'amb_c',    '1f' , amb_c)
	passUni(sp, 'dif_c',    '1f' , dif_c)
	passUni(sp, 'spc_c',    '1f' , spc_c)
	passUni(sp, 'spc_p',    '1f' , spc_p)

	// Setup teapot data
	attrs.forEach(attr => {
		let buf = model.buffer[attr.src]
		if (buf) passAttr(sp, attr.dst, gl.FLOAT, buf, buf.itemSize, true)
	})

	gl.drawArrays(gl.TRIANGLES, 0, model.buffer.vertexPositions.numItems)
}

function animate(dt) {
	models.forEach(model => {
		model.angle += 0.05 * dt
	})
}

function tick(ms) {
	let dt = ms - curTime || 0
	animate(dt)
	drawScene(dt)
	curTime = ms
	requestAnimFrame(tick)
}

function webGLStart() {
	let canvas = document.getElementById('ICG-canvas')
	scaleToWindow(canvas)
	listen('resize', e=>{ scaleToWindow(canvas) })

	initGL(canvas)
	initShaders().then(async () => {
		await initModels()
		models.forEach(model => { model.angle = 180 })
		gl.clearColor(0.0, 0.1, 0.1, 1.0)
		gl.enable(gl.DEPTH_TEST)
		tick()
	})
}