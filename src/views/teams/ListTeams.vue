<template>
	<div class="content loader-container is-max-width-desktop" :class="{ 'is-loading': teamService.loading}">
		<h1>{{ $t('team.title') }}</h1>	
		<x-button
			:to="{name:'teams.create'}"
			class="is-pulled-right"
			icon="plus"
		>
		<span class="padding-right10" >	{{ $t('team.create.title') }}</span>
		</x-button>
<div style="padding-right: 210px;"> 
		
		<ul class="teams box " v-if="teams.length > 0">
			<li :key="t.id" v-for="t in teams">
				<router-link :to="{name: 'teams.edit', params: {id: t.id}}">
					{{ t.name }}
				</router-link>
			</li>
		</ul>
		<p v-else-if="!teamService.loading" class="has-text-centered has-text-grey is-italic">
			{{ $t('team.noTeams') }}
			<router-link :to="{name: 'teams.create'}">
				{{ $t('team.create.title') }}.
			</router-link>
		</p>
	</div>
	</div>
</template>

<script setup lang="ts">
import {ref, shallowReactive} from 'vue'
import { useI18n } from 'vue-i18n'

import TeamService from '@/services/team'
import { useTitle } from '@/composables/useTitle'

const { t } = useI18n({useScope: 'global'})
useTitle(() => t('team.title'))

const teams = ref([])
const teamService = shallowReactive(new TeamService())
teamService.getAll().then((result) => {
	teams.value = result
})
</script>

<style lang="scss" scoped>

ul.teams {
  padding: 0;
  margin-right: 0;
  overflow: hidden;

  li {
    list-style: none;
    margin: 0;
    border-bottom: 1px solid $border;

    a {
      color: var(--text);
      display: block;
      padding: 0.5rem 1rem;
      transition: background-color $transition;

      &:hover {
        background: var(--grey-100);
      }
    }
  }

  li:last-child {
    border-bottom: none;
  }
}
</style>