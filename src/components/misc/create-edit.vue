<template>
	<modal @close="$router.back()" :overflow="true" :wide="wide">
		<card
			:title="title"
			:shadow="false"
			:padding="false"
			class="has-text-right"
			:has-close="true"
			@close="$router.back()"
			:loading="loading"
		>
			<div class="p-4">
				<slot/>
			</div>

			<template #footer>
				<slot name="footer">
					<x-button
						v-if="tertiary !== ''"
						:shadow="false"
						variant="tertiary"
						@click.prevent.stop="$emit('tertiary')"
					>
						{{ tertiary }}
					</x-button>
					<x-button
						variant="secondary"
						@click.prevent.stop="$router.back()"
						class="ml-2 padding-right10"
					>
						{{ $t('misc.cancel') }}
					</x-button>
					<x-button
						v-if="hasPrimaryAction"
						variant="primary"
						@click.prevent.stop="primary()"
						:icon="primaryIcon"
						:disabled="primaryDisabled || loading"
						class="ml-2 padding-right10"
						
					>
					<span class="padding-right10">	{{ primaryLabel || $t('misc.create') }}</span>
					</x-button>
				</slot>
			</template>
		</card>
	</modal>
</template>

<script setup lang="ts">
import type {PropType} from 'vue'
import type {IconProp} from '@fortawesome/fontawesome-svg-core'

defineProps({
	title: {
		type: String,
		default: '',
	},
	primaryLabel: {
		type: String,
	},
	primaryIcon: {
		type: String as PropType<IconProp>,
		default: 'plus',
	},
	primaryDisabled: {
		type: Boolean,
		default: false,
	},
	hasPrimaryAction: {
		type: Boolean,
		default: true,
	},
	tertiary: {
		type: String,
		default: '',
	},
	wide: {
		type: Boolean,
		default: false,
	},
	loading: {
		type: Boolean,
		default: false,
	},
})

const emit = defineEmits(['create', 'primary', 'tertiary'])

function primary() {
	emit('create')
	emit('primary')
}
</script>
