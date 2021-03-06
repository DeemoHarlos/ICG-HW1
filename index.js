const v = x => x.value

const Options = Vue.createApp({
	async mounted() {
		this.camera.angle[0].anim = false
		await Promise.all(this.models.map(async model => {
			model.data = await req(model.src, 'json')
		}))
		this.models.forEach(this.preProcess);
		this.models.forEach(this.initModel);
		await startWebGL('#ICG-canvas', [0.0, 0.1, 0.1, 1.0], this.models, (gl, sp, dt, dbg) => {
			let thisList = [
				...this.camera.pos,
				...this.camera.angle,
				...[].concat.apply([], this.lights.map(x => x.pos)),
				...[].concat.apply([], this.lights.map(x => x.color))
			]
			thisList.forEach(x => this.animate(x, dt))
			this.objects.forEach(obj => {
				let objList = [
					obj.shading.amb_c,
					obj.shading.dif_c,
					obj.shading.spc_c,
					obj.shading.spc_p_log,
					...obj.transform.scale,
					...obj.transform.pos,
					...obj.transform.angle,
				]
				objList.forEach(x => this.animate(x, dt))
				drawModel(gl, sp, obj.model, this.getParmas(obj), dbg)
				objList.forEach(this.round)
			})
			thisList.forEach(this.round)
		})
	},
	data() { return {
		models: [
			{ name: 'Teapot',   src: 'model/Teapot.json'   },
			{ name: 'Car_road', src: 'model/Car_road.json' },
			{ name: 'Church_s', src: 'model/Church_s.json' },
			{ name: 'Csie',     src: 'model/Csie.json'     },
			{ name: 'Easter',   src: 'model/Easter.json'   },
			{ name: 'Fighter',  src: 'model/Fighter.json'  },
			{ name: 'Kangaroo', src: 'model/Kangaroo.json' },
			{ name: 'Longteap', src: 'model/Longteap.json' },
			{ name: 'Mercedes', src: 'model/Mercedes.json' },
			{ name: 'Mig27',    src: 'model/Mig27.json'    },
			{ name: 'Patchair', src: 'model/Patchair.json' },
			{ name: 'Plant',    src: 'model/Plant.json'    },
			{ name: 'Tomcat',   src: 'model/Tomcat.json'   }
		],
		shadings: [
			{ v: 0, name: 'No Shading' },
			{ v: 1, name: 'Flat Shading' },
			{ v: 2, name: 'Gouraud Shading' },
			{ v: 3, name: 'Phong Shading' },
		],
		lights: [
			{ pos: this.ctrlPos([ 60, 160, 30]), color: this.ctrlColor([10,  9,  7])	 },
			{ pos: this.ctrlPos([180, 160,  0]), color: this.ctrlColor([ 9,  7, 10])	 },
			{ pos: this.ctrlPos([240, 160,-30]), color: this.ctrlColor([ 7, 10,  9])	 },
		],
		camera: { pos: this.ctrlPos([180, 25, 40]), angle: this.ctrlAngle([0, -30, 0]) },
		objects: []
	}},
	methods: {
		preProcess(model) {
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
		},
		initModel(model, i) {
			this.objects.push({
				model: model,
				shading: {
					type: 3,
					amb_c: this.ctrl('Ambient' , .1, false, false, 0, 1, .01),
					dif_c: this.ctrl('Diffuse' , .8, false, false, 0, 1, .01),
					spc_c: this.ctrl('Specular', .2, false, false, 0, 1, .01),
					spc_p: this.power(2.0),
					spc_p_log: this.ctrl('Spec Pow', 2.0, false, false, -3, 7, .1),
				},
				transform: {
					scale: this.ctrlScale([1, 1, 1]),
					pos: this.ctrlPos([30 * i, 0, 0]),
					angle: this.ctrlAngle([0, i ? -90 : 0, 0]),
				}
			})
		},
		animate(e, dt) {
			if (e.anim) {
				e.t += dt * 0.0001
				let range = e.max - e.min
				if (e.loop) e.value = (range * ((e.t + 1.5) % 1) + e.min)
				else e.value = (range * (Math.sin(e.t * 2 * Math.PI) + 1) / 2 + e.min)
			}
		},
		round(e) {
			e.value = (Math.round(e.value / e.step) * e.step).toFixed(2) / 1
		},
		getParmas(obj) {
			obj.shading.spc_p = this.power(obj.shading.spc_p_log.value)
			let sh = obj.shading
			let tr = obj.transform
			let params = {
				shading: {
					type: sh.type,
					amb_c: sh.amb_c.value,
					dif_c: sh.dif_c.value,
					spc_c: sh.spc_c.value,
					spc_p: sh.spc_p,
					spc_p_log: sh.spc_p_log.value,
				},
				transform: { scale: tr.scale.map(v), pos: tr.pos.map(v), angle: tr.angle.map(v) },
				camera: { pos: this.camera.pos.map(v), angle: this.camera.angle.map(v) },
				lights: this.lights.map(x => ({ pos: x.pos.map(v), color: x.color.map(v)})),
			}
			return params
		},
		// utils
		power(log) {
			return Math.pow(2, log).toFixed(2)
		},
		log(power) {
			return Math.log2(power).toFixed(2)
		},
		ctrl(name, value, anim, loop, min, max, step) {
			return { name, value, anim, loop, min, max, step, t: 0 }
		},
		ctrlPos(pos) {
			return [
				this.ctrl('X', pos[0], false, false, pos[0] - 200, pos[0] + 200, 10),
				this.ctrl('Y', pos[1], false, false, pos[1] -  30, pos[1] +  30,  1),
				this.ctrl('Z', pos[2], false, false, pos[1] -  30, pos[1] +  30,  1)
			]
		},
		ctrlScale(scale) {
			return [
				this.ctrl('X', scale[0], false, false, 0.1, 5, .01),
				this.ctrl('Y', scale[1], false, false, 0.1, 5, .01),
				this.ctrl('Z', scale[2], false, false, 0.1, 5, .01)
			]
		},
		ctrlColor(color) {
			return [
				this.ctrl('R', color[0], false, false, 0, 10, .1),
				this.ctrl('G', color[1], false, false, 0, 10, .1),
				this.ctrl('B', color[2], false, false, 0, 10, .1)
			]
		},
		ctrlAngle(angle) {
			return [
				this.ctrl('Yaw'  , angle[0],  true, true, -180, 180, 1),
				this.ctrl('Pitch', angle[1], false, true, -180, 180, 1),
				this.ctrl('Roll' , angle[2], false, true, -180, 180, 1)
			]
		},
	},
}).mount('#options')
