const Options = Vue.createApp({
	async mounted() {
		await Promise.all(this.models.map(async model => {
			model.data = await req(model.src, 'json')
		}))
		this.models.forEach(this.preProcess);
		this.models.forEach((model, i) => {
			let ct = model.data.center
			let sz = model.data.size
			let scaling = (25 / Math.max(sz.x, sz.y, sz.z)).toFixed(1)
			this.objects.push({
				model: model,
				shading: {
					type: 3,
					amb_c:  0.1,
					dif_c:  0.8,
					spc_c:  0.4,
					spc_p: 16.0,
					spc_p_log: 4.0,
				},
				transform: {
					scale: [scaling, scaling, scaling],
					pos: [
						(-ct.x * scaling + 30 * i).toFixed(0),
						(-ct.y * scaling).toFixed(0),
						(-ct.z * scaling).toFixed(0)
					],
					angle: [0, 0, 0],
				}
			})
		});
		await startWebGL('#ICG-canvas', [0.0, 0.1, 0.1, 1.0], this.models, (gl, sp, dt, dbg) => {
			this.objects.forEach(obj => {
				// obj.transform.angle[0] += 0.05 * dt
			})
			this.objects.forEach(obj => {
				let params = {
					shading: obj.shading,
					transform: obj.transform,
					camera: { pos: this.camera.pos, angle: this.camera.angle },
					light: { pos: this.light.pos, color: this.light.color },
				}
				drawModel(gl, sp, obj.model, params, dbg)
			})
		})
	},
	data() { return {
		models: [
			{ name: 'Teapot',   src: 'model/Teapot.json'   },
			{ name: 'Car_road', src: 'model/Car_road.json' },
			{ name: 'Church_s', src: 'model/Church_s.json' },
			// { name: 'Csie',     src: 'model/Csie.json'     },
			// { name: 'Easter',   src: 'model/Easter.json'   },
			// { name: 'Fighter',  src: 'model/Fighter.json'  },
			// { name: 'Kangaroo', src: 'model/Kangaroo.json' },
			// { name: 'Longteap', src: 'model/Longteap.json' },
			// { name: 'Mercedes', src: 'model/Mercedes.json' },
			// { name: 'Mig27',    src: 'model/Mig27.json'    },
			// { name: 'Patchair', src: 'model/Patchair.json' },
			// { name: 'Plant',    src: 'model/Plant.json'    },
			// { name: 'Tomcat',   src: 'model/Tomcat.json'   }
		],
		shadings: [
			{ v: 0, name: 'No Shading' },
			{ v: 1, name: 'Flat Shading' },
			{ v: 2, name: 'Gouraud Shading' },
			{ v: 3, name: 'Phong Shading' },
		],
		light: {
			pos: [30, 30, -30],
			color: [1.0, .9, .65],
		},
		camera: {
			pos: [0, 25, 40],
			angle: [0, -30, 0],
		},
		objects: []
	}},
	methods: {
		// some utils
		degToRad(deg) {
			return deg * Math.PI / 180
		},
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
	},
	watch: {
		'opt.spc_p_log'(v) {
			this.opt.spc_p = Math.pow(2, v).toFixed(2)
		},
	},
}).mount('#options')
