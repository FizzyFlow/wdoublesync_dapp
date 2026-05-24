<template>

	<RoutedPage />

</template>

<script>
import RoutedPage from './RoutedPage.vue';

export default {
	name: 'LayoutDefault',

	components: {
		RoutedPage,
	},

	methods: {
	},
}
</script>
<!-- Add "scoped" attribute to limit CSS to this component only -->
<style scoped>
	.overall_layout {
        background-color: var(--q-portal);
	}

</style>