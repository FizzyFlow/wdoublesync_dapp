<template>
    <section class="useCases">
        <div class="useCases_inner">

            <!-- ── Web App ── -->
            <article class="ucCard">
                <h3 class="ucCard_title">Web App</h3>
                <p class="ucCard_desc">Manage your files with a clean in-app experience.</p>

                <div class="ucCard_art">
                    <div class="ucPanel ucFiles">
                        <div class="ucFiles_cloud">
                            <q-icon name="cloud_upload" size="22px" />
                        </div>
                        <div
                            v-for="row in files"
                            :key="row.name"
                            class="ucFile"
                        >
                            <q-icon
                                :name="row.icon"
                                size="16px"
                                class="ucFile_icon"
                                :class="row.folder ? 'ucFile_icon--folder' : 'ucFile_icon--file'"
                            />
                            <span class="ucFile_name">{{ row.name }}</span>
                            <q-icon name="check" size="14px" class="ucFile_check" />
                            <q-icon
                                v-if="row.version"
                                name="restore"
                                size="14px"
                                class="ucFile_restore"
                            />
                        </div>
                    </div>
                </div>

                <ul class="ucCard_list">
                    <li v-for="f in webAppFeatures" :key="f">
                        <q-icon name="check" size="15px" class="ucCard_listIcon" />{{ f }}
                    </li>
                </ul>
            </article>

            <!-- ── CLI Sync ── -->
            <article class="ucCard">
                <h3 class="ucCard_title">CLI Sync</h3>
                <p class="ucCard_desc">Rsync-like performance for your terminal.</p>

                <div class="ucCard_art">
                    <div class="ucPanel ucTerm">
                        <div class="ucTerm_bar">
                            <span class="ucDot ucDot--r"></span>
                            <span class="ucDot ucDot--y"></span>
                            <span class="ucDot ucDot--g"></span>
                        </div>
                        <pre class="ucTerm_body"><span class="ucTerm_cmd">$ wdoublesync push</span>
  scanning... 12 files, 3 folders
  created: 0xabc1...
<span class="ucTerm_ok">  version 1 pushed (full snapshot)</span>
<span class="ucTerm_cmd">$ wdoublesync push 0xabc1...</span>
  scanning... 12 files, 3 folders
<span class="ucTerm_ok">  version 2 pushed (diff)</span></pre>
                    </div>
                </div>

                <ul class="ucCard_list">
                    <li v-for="f in cliFeatures" :key="f">
                        <q-icon name="check" size="15px" class="ucCard_listIcon" />{{ f }}
                    </li>
                </ul>
            </article>

            <!-- ── Developer SDK ── -->
            <article class="ucCard">
                <h3 class="ucCard_title">Developer SDK</h3>
                <p class="ucCard_desc">Integrate WDoubleSync into your apps, agents, and workflows.</p>

                <div class="ucCard_art">
                    <div class="ucPanel ucCode">
<pre class="ucCode_body"><span class="tok-kw">import</span> <span class="tok-type">WDoubleSync</span> <span class="tok-kw">from</span> <span class="tok-str">'wdoublesync'</span>

<span class="tok-kw">const</span> w = <span class="tok-kw">new</span> <span class="tok-type">WDoubleSync</span>({ <span class="tok-prop">endlessVector</span>: ev })
<span class="tok-kw">await</span> w.<span class="tok-fn">initialize</span>()

<span class="tok-comment">// push — full patch first, diff on every next push</span>
<span class="tok-kw">await</span> w.<span class="tok-fn">push</span>(root)

<span class="tok-comment">// restore any version</span>
<span class="tok-kw">const</span> folder = <span class="tok-kw">await</span> w.<span class="tok-fn">restore</span>()
<span class="tok-kw">const</span> v1 = <span class="tok-kw">await</span> w.<span class="tok-fn">restore</span>(<span class="tok-lit">1</span>)</pre>
                    </div>
                </div>

                <ul class="ucCard_list">
                    <li v-for="f in sdkFeatures" :key="f">
                        <q-icon name="check" size="15px" class="ucCard_listIcon" />{{ f }}
                    </li>
                </ul>
            </article>

            <!-- ── Built for AI Agents (accent card) ── -->
            <article class="ucCard ucCard--accent">
                <div class="ucCard_skillLink">
                    <BlobButton
                        text="Agent Skill"
                        href="https://github.com/FizzyFlow/wdoublesync_cli/blob/main/SKILL.md"
                        icon="open_in_new"
                        size="sm"
                        color="primary"
                    />
                </div>
                <h3 class="ucCard_title ucCard_title--accent">Built for<br>AI Agents</h3>
                <p class="ucCard_desc">
                    Give AI agents a persistent, private filesystem. Store
                    memories (pairs great with MemWal), knowledge, and artifacts
                    they can read, write, and version across sessions.
                </p>

                <div class="ucCard_art ucCard_art--agent">
                    <LandingAgentScene />
                </div>
            </article>

        </div>
    </section>
</template>

<script>
import LandingAgentScene from './LandingAgentScene.vue';
import BlobButton from '../Theme/BlobButton.vue';

export default {
    name: 'LandingUseCases',
    components: { LandingAgentScene, BlobButton },
    data() {
        return {
            files: [
                { name: 'Projects', icon: 'folder', folder: true, version: false },
                { name: 'Research', icon: 'folder', folder: true, version: true },
                { name: 'design-system.sketch', icon: 'description', folder: false, version: true },
                { name: 'report.pdf', icon: 'description', folder: false, version: true },
                { name: 'notes.txt', icon: 'description', folder: false, version: true },
            ],
            webAppFeatures: ['Upload and organize', 'Share securely', 'View versions', 'Restore instantly'],
            cliFeatures: ['Push diffs, not full folders', 'Watch: auto-sync on save', 'Pull any past version', 'Rebate to trim storage cost'],
            sdkFeatures: ['JavaScript SDK', 'Simple APIs', 'Use in agents & apps', 'Full control'],
        };
    },
};
</script>

<style scoped>
.useCases {
    padding: 24px 24px 24px;
}

.useCases_inner {
    display: grid;
    grid-template-columns: repeat(4, minmax(0, 1fr));
    gap: 20px;
    max-width: 1600px;
    margin: 0 auto;
}

/* ── card shell ── */
.ucCard {
    display: flex;
    flex-direction: column;
    padding: 26px 24px;
    border-radius: 16px;
    background: var(--lp-card-bg, linear-gradient(180deg, rgba(255, 255, 255, 0.035) 0%, rgba(255, 255, 255, 0.012) 100%));
    border: 1px solid var(--lp-card-border, rgba(130, 160, 210, 0.14));
    box-shadow: var(--lp-card-shadow, inset 0 1px 0 rgba(255, 255, 255, 0.04));
}

.ucCard--accent {
    position: relative;
    border-color: rgba(79, 142, 247, 0.45);
    background:
        radial-gradient(ellipse 80% 60% at 50% 100%, rgba(79, 142, 247, 0.16) 0%, transparent 70%),
        linear-gradient(180deg, rgba(79, 142, 247, 0.06) 0%, rgba(79, 142, 247, 0.02) 100%);
    box-shadow:
        inset 0 1px 0 rgba(255, 255, 255, 0.05),
        0 0 30px -8px rgba(79, 142, 247, 0.3);
}

.ucCard_skillLink {
    position: absolute;
    top: 14px;
    right: 14px;
}

.ucCard_title {
    font-family: var(--font-display, inherit);
    font-size: 22px;
    font-weight: 700;
    line-height: 1.1;
    color: var(--lp-text);
    margin: 0 0 10px;
}

.ucCard_title--accent {
    color: var(--lp-accent);
    font-size: 26px;
}

.ucCard_desc {
    font-size: 13.5px;
    line-height: 1.6;
    color: var(--lp-text-3);
    margin: 0 0 20px;
}

.ucCard_art {
    margin-bottom: 22px;
}

.ucCard_art--agent {
    /* fill the leftover card height (no checklist here) and center the robot,
       rather than pinning the art to the bottom and leaving a gap */
    flex: 1;
    min-height: 0;
    margin: 8px 0 0;
    display: flex;
    align-items: center;
    justify-content: center;
}

/* ── feature checklist ── */
.ucCard_list {
    list-style: none;
    margin: auto 0 0;
    padding: 0;
    display: flex;
    flex-direction: column;
    gap: 11px;
}

.ucCard_list li {
    display: flex;
    align-items: center;
    gap: 9px;
    font-size: 13.5px;
    color: var(--lp-text-2);
}

.ucCard_listIcon {
    flex: none;
    color: var(--lp-accent);
}

/* ── shared mini-UI panel ── */
.ucPanel {
    border-radius: 12px;
    border: 1px solid var(--lp-panel-border);
    background: var(--lp-panel-bg);
    overflow: hidden;
}

/* terminal & code stay editor-dark in both light and dark mode */
.ucTerm,
.ucCode {
    border-color: rgba(130, 160, 210, 0.16);
    background: #0b1018;
}

/* ── Web App: file list ── */
.ucFiles {
    position: relative;
    padding: 10px 12px;
}

.ucFiles_cloud {
    position: absolute;
    top: -10px;
    right: -6px;
    width: 46px;
    height: 46px;
    display: flex;
    align-items: center;
    justify-content: center;
    border-radius: 50%;
    color: var(--lp-accent);
    background: radial-gradient(circle at 50% 45%, rgba(79, 142, 247, 0.28) 0%, rgba(79, 142, 247, 0.05) 70%, transparent 100%);
    filter: drop-shadow(0 0 10px rgba(79, 142, 247, 0.4));
}

.ucFile {
    display: flex;
    align-items: center;
    gap: 9px;
    padding: 6px 2px;
}

.ucFile + .ucFile {
    border-top: 1px solid var(--lp-divider);
}

.ucFile_icon--folder {
    color: var(--lp-accent);
}

.ucFile_icon--file {
    color: var(--lp-text-3);
}

.ucFile_name {
    flex: 1;
    min-width: 0;
    font-size: 12px;
    color: var(--lp-text-2);
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
}

.ucFile_check {
    flex: none;
    color: var(--lp-teal);
}

.ucFile_restore {
    flex: none;
    color: var(--lp-text-faint);
}

/* ── CLI: terminal ── */
.ucTerm_bar {
    display: flex;
    align-items: center;
    gap: 7px;
    padding: 9px 12px;
    background: rgba(255, 255, 255, 0.03);
    border-bottom: 1px solid rgba(130, 160, 210, 0.12);
}

.ucDot {
    width: 9px;
    height: 9px;
    border-radius: 50%;
}

.ucDot--r { background: #ff5f57; }
.ucDot--y { background: #febc2e; }
.ucDot--g { background: #28c840; }

.ucTerm_body {
    margin: 0;
    padding: 14px 14px 16px;
    font-family: var(--font-mono, ui-monospace, SFMono-Regular, Menlo, monospace);
    font-size: 11.5px;
    line-height: 1.7;
    color: #aab6c8;
    white-space: pre-wrap;
    word-break: break-word;
}

.ucTerm_cmd { color: #e8edf5; }
.ucTerm_ok { color: #37e0c8; }

/* ── SDK: code block ── */
.ucCode_body {
    margin: 0;
    padding: 14px 14px 16px;
    font-family: var(--font-mono, ui-monospace, SFMono-Regular, Menlo, monospace);
    font-size: 11.5px;
    line-height: 1.7;
    color: #aab6c8;
    white-space: pre-wrap;
    word-break: break-word;
}

.tok-kw { color: #c08cff; }
.tok-type { color: #4f8ef7; }
.tok-str { color: #37e0c8; }
.tok-prop { color: #7fb0ff; }
.tok-lit { color: #febc2e; }
.tok-fn { color: #e8edf5; }

/* the robot scene fills the centered art area */
.ucCard_art--agent :deep(.isoStack) {
    width: 100%;
    height: 100%;
    min-height: 240px;
}

/* ── responsive ── */
@media (max-width: 1023px) {
    .useCases_inner {
        grid-template-columns: repeat(2, minmax(0, 1fr));
    }
}

@media (max-width: 599px) {
    .useCases_inner {
        grid-template-columns: minmax(0, 1fr);
    }
}
</style>
