<template>
	<div class="col px-2 align-items-center">
		<div class="d-flex flex-row">
			<label :for="label" class="form-label m-0 pe-2 align-right w-auto">
				{{ label }}
			</label>
			<input :name="label" class="flex-fill form-text m-0 me-3"
				type="text" v-model="value"
				style="min-width: 0; width: 0;"
			/>
		</div>
		<input type="range" class="form-range pe-3" v-model="value"
			:min="min" :max="max" :step="step"
		>
	</div>
</template>

<script>
export default {
	prop: {
		label: String,
		min: Number,
		max: Number,
		step: Number,
		value: Number,
	},
}
</script>

<style scoped>
</style>