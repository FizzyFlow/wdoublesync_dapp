<template>
    <LandingShell class="landingPage" @home="goHome">
        <section class="hero">
            <div class="hero_inner">

                <!-- left: copy + actions -->
                <div class="hero_content">
                    <div class="hero_badge">
                        <q-icon name="water_drop" size="16px" class="hero_badge_icon" />
                        <span class="hero_badge_strong">Built on Sui</span>
                        <span class="hero_badge_dot">•</span>
                        <span>Powered by Walrus &amp; Seal</span>
                    </div>

                    <h1 class="hero_title">
                        Private, versioned file sync —
                        <span class="hero_title--accent">built on-chain</span>
                    </h1>

                    <p class="hero_lead">
                        Keep files encrypted, versioned, and portable with
                        a Sui-native diff sync layer powered by Walrus and Seal.
                    </p>

                    <p class="hero_body">
                        DoubleSync is a decentralized filesystem for users,
                        apps, and AI agents — private by default, recoverable
                        by design, and accessible from the web, the CLI,
                        or your own code.
                    </p>

                    <p class="hero_highlight">
                        For apps, agents, creators, and teams that need
                        private, portable, recoverable data.
                    </p>

                    <div class="hero_actions">
                        <BlobButton
                            text="Launch Web App"
                            icon="arrow_forward"
                            color="var(--lp-accent)"
                            @click="launchApp"
                        />
                        <BlobButton
                            text="Get Started with CLI"
                            icon="terminal"
                            color="var(--lp-text-3)"
                            href="https://github.com/FizzyFlow/wdoublesync_cli"
                        />
                    </div>

                    <p class="hero_footer">
                        <a href="https://github.com/FizzyFlow/wdoublesync" target="_blank" rel="noopener noreferrer">
                            Open source</a> · Built for the decentralized future
                        
                    </p>
                </div>

                <!-- right: isometric architecture (wallet bar centred above its apex) -->
                <div class="hero_art">
                    <WalletStatusBar :show-dark-changer="true" />
                    <div class="hero_artScene">
                        <LandingArchitecture />
                    </div>
                </div>

            </div>
        </section>


        <LandingUseCases />
        <LandingFeatures />

        <LandingCallToAction @launch="launchApp" />
    </LandingShell>
</template>

<script>
import LandingShell from 'shared/components/Landing/LandingShell.vue';
import LandingArchitecture from 'shared/components/Landing/LandingArchitecture.vue';
import LandingFeatures from 'shared/components/Landing/LandingFeatures.vue';
import LandingUseCases from 'shared/components/Landing/LandingUseCases.vue';
import LandingCallToAction from 'shared/components/Landing/LandingCallToAction.vue';
import BlobButton from 'shared/components/Theme/BlobButton.vue';
import WalletStatusBar from '../components/WalletStatusBar.vue';

export default {
    name: 'Landing',
    path: '/',
    components: {
        LandingShell,
        LandingArchitecture,
        LandingFeatures,
        LandingUseCases,
        LandingCallToAction,
        BlobButton,
        WalletStatusBar,
    },
    methods: {
        launchApp() {
            this.$router.push('/select');
        },
        goHome() {
            this.$router.push('/');
        },
    },
};
</script>

<style scoped>
/* theme tokens, background & header come from LandingShell (the root element,
   which also carries the .landingPage class for the rules below). */

/* centre the (globally bottom-left) wallet bar above the architecture apex,
   styled as a pill like the hero badge */
.landingPage :deep(.walletStatusBar) {
    position: absolute;
    top: -4px;
    left: 50%;
    right: auto;
    bottom: auto;
    transform: translateX(-50%);
    z-index: 100;
    gap: 4px;
    padding: 3px 8px;
    border-radius: 999px;
    border: 1px solid var(--lp-badge-border);
    background: var(--lp-badge-bg);
    backdrop-filter: blur(6px);
}

/* ── hero: two columns, copy left / architecture right ── */
.hero {
    padding: 24px 24px 16px;
}

.hero_inner {
    display: grid;
    grid-template-columns: minmax(0, 1.25fr) minmax(0, 1fr);
    align-items: center;
    gap: 48px;
    max-width: 1600px;
    margin: 0 auto;
}

.hero_content {
    max-width: 720px;
    /* pin the copy to the top of the row; the architecture stays centred */
    align-self: start;
}

.hero_badge {
    display: inline-flex;
    align-items: center;
    gap: 8px;
    padding: 7px 14px;
    border-radius: 999px;
    border: 1px solid var(--lp-badge-border);
    background: var(--lp-badge-bg);
    font-size: 13px;
    color: var(--lp-text-3);
    margin-bottom: 26px;
}

.hero_badge_icon {
    color: var(--lp-accent);
}

.hero_badge_strong {
    color: var(--lp-text);
    font-weight: 600;
}

.hero_badge_dot {
    color: var(--lp-text-faint);
}

.hero_title {
    font-family: var(--font-display, inherit);
    font-size: 52px;
    font-weight: 700;
    line-height: 1.08;
    margin: 0 0 22px;
    letter-spacing: -0.5px;
}

.hero_title--accent {
    color: var(--lp-accent);
}

.hero_lead,
.hero_body {
    font-size: 16px;
    line-height: 1.6;
    color: var(--lp-text-2);
    margin: 0 0 16px;
}

.hero_highlight {
    font-size: 16px;
    line-height: 1.6;
    font-weight: 600;
    color: var(--lp-accent);
    margin: 0 0 30px;
}

.hero_actions {
    display: flex;
    flex-wrap: wrap;
    gap: 14px;
    margin-bottom: 26px;
}

.hero_footer {
    font-size: 13px;
    color: var(--lp-text-faint);
    margin: 0;
}

.hero_art {
    min-width: 0;
    /* positioning anchor for the wallet bar centred above the apex */
    position: relative;
}

.hero_artScene {
    /* render the architecture ~15% larger than its column without disturbing
       the grid layout (there's whitespace in the wider hero to absorb it) */
    transform: scale(1.15);
    transform-origin: center;
}

/* drop the architecture's own outer padding inside the hero grid */
.hero_art :deep(.arch) {
    padding: 0;
}

@media (max-width: 1023px) {
    .hero_inner {
        grid-template-columns: 1fr;
        gap: 24px;
    }

    /* stacked layout — keep the architecture within its own width */
    .hero_artScene {
        transform: none;
    }

    .hero_content {
        max-width: 640px;
        margin: 0 auto;
        text-align: center;
    }

    .hero_badge {
        margin-left: auto;
        margin-right: auto;
    }

    .hero_actions {
        justify-content: center;
    }

    .hero_title {
        font-size: 40px;
    }
}
</style>
