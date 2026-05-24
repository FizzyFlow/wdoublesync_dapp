<template>

		<router-view v-slot="{ Component }" ref="routerView">
			<component ref="view" :is="Component" v-if="isComponentVisible" />
		</router-view>

</template>

<script>
import Log from 'shared/classes/Log.js';

export default {
	name: 'RoutedPage',
	data() {
		return {
			title: '',
			pageTitle: '',
			currentRoute: window.location.pathname,
			authRequired: false,

			requiredAuthLevel: null,
			isComponentVisible: true,
			contentViewEnabled: true,
		}
	},
	computed: {
	},
	components: {
	},
	watch:{
		'$route' (){
			Log.tag('RoutedPage').info('$route is updated');
			this.authRequired = false;

			const component = this.$route?.matched[0]?.components?.default;
			if (component) {
				this.authRequired = component.authRequired;
				this.requiredAuthLevel = component.requiredAuthLevel || null;
				this.pageTitle = component.title || '';

				const headerType = component.headerType || null;
				// this.$store.header.setType(headerType);

				this.checkAccess();
				this.refreshTitle();
			}
		},
		'$store.sessionUser.me' () {
			this.checkAccess();
			// this.checkIfCompnentVisible();
		},
		'$store.portal.selectedPageTitle' () {
			this.refreshTitle();
		},
	},
	mounted() {
		this.title = this.$q.config.brand.title;

		const component = this.$route?.matched[0]?.components?.default;
		if (component) {
			const headerType = component.headerType || null;
			// this.$store.header.setType(headerType);
		}
	},
	methods: {
		refreshTitle: function() {
			const title = (this.pageTitle ? ('' + this.pageTitle + ' @ ') : '') + this.title;
			document.title = title;
		},
		checkAccess: function() {
			this.isComponentVisible = true;
			this.contentViewEnabled = true;
			return true;
		},
		enoughAccessLevel: function() {
			return true;
		},
		signIn() {
			this.$store.sessionUser.doSignIn();
		},
	},
	beforeCreate() {
	}
}
</script>

<style scoped>

.scroll-area {
	/*height: 500px;*/
}

.page_content {
}

.page_content .ps {
}

.page_content_container {
}


.page_transition {
}

.fade-enter-active,
.fade-leave-active {
	transition: opacity 0.05s ease;
}
/*
.fade-enter-to,
.fade-leave-e {
	opacity: 0;
}*/

.fade-enter-to,
.fade-leave-from {
	opacity: 0.7;
}

.fade-enter-from,
.fade-leave-to {
	opacity: 0;
}



</style>