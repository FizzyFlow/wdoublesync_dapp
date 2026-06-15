<template>
    <div class="jShowcase_row jShowcase_column isoShowcase_root">

        <div class="jShowcase_info">
            <code>IsoStack</code> is the isometric scene container. It renders an SVG, sets up the
            projection (<code>scale</code>, <code>angle</code>), atmospheric <code>fog</code> and outer
            <code>glow</code>, and provides that context to any <code>IsoBox</code> children via its
            default slot. With no slot it draws a sample scene (three platforms + a vault).
            See <strong>IsoBox</strong> for the per-brick parameters.
        </div>

        <!-- Stack-level props -->
        <div class="jShowcase_group">
            <span class="jShowcase_title">Container props</span>
            <div class="isoDemo_grid">
                <div class="isoDemo_mini">
                    <IsoStack />
                    <div class="isoDemo_caption">Default scene (no slot)</div>
                </div>
                <div class="isoDemo_mini">
                    <IsoStack :glow="0">
                        <IsoBox :x="0" :y="0" :z="0" :w="6" :d="6" :h="0.7" :grid="3" />
                        <IsoBox :x="0" :y="0" :z="0.7" :w="2" :d="2" :h="2" />
                    </IsoStack>
                    <div class="isoDemo_caption">glow = 0</div>
                </div>
                <div class="isoDemo_mini">
                    <IsoStack :glow="14" color="#7fe3ff">
                        <IsoBox :x="0" :y="0" :z="0" :w="6" :d="6" :h="0.7" />
                        <IsoBox :x="0" :y="0" :z="0.7" :w="2" :d="2" :h="2" />
                    </IsoStack>
                    <div class="isoDemo_caption">glow = 14</div>
                </div>
                <div class="isoDemo_mini">
                    <IsoStack :fog="0.85" color="#7fe3ff">
                        <IsoBox :x="0" :y="0" :z="0" :w="10" :d="10" :h="0.85" />
                        <IsoBox :x="0" :y="0" :z="0.85" :w="6.4" :d="6.4" :h="1.0" />
                        <IsoBox :x="0" :y="0" :z="1.85" :w="3.5" :d="3.5" :h="1.35" />
                    </IsoStack>
                    <div class="isoDemo_caption">fog = 0.85 · far side dissolves</div>
                </div>
                <div class="isoDemo_mini">
                    <IsoStack solid :fog="0.4" color="#5ad1a0">
                        <IsoBox :x="-1.5" :y="-1.5" :z="0" :w="3" :d="3" :h="3" :fill-opacity="0.1" />
                        <IsoBox :x="1.5" :y="1.5" :z="0" :w="3" :d="3" :h="2" :fill-opacity="0.1" />
                    </IsoStack>
                    <div class="isoDemo_caption">solid · front hides back</div>
                </div>
                <div class="isoDemo_mini">
                    <IsoStack :scale="34">
                        <IsoBox :x="0" :y="0" :z="0" :w="4" :d="4" :h="0.7" />
                        <IsoBox :x="0" :y="0" :z="0.7" :w="1.6" :d="1.6" :h="1.6" />
                    </IsoStack>
                    <div class="isoDemo_caption">scale = 34 (zoomed in)</div>
                </div>
                <div class="isoDemo_mini">
                    <IsoStack :angle="15" color="var(--q-accent)">
                        <IsoBox :x="0" :y="0" :z="0" :w="6" :d="6" :h="0.7" />
                        <IsoBox :x="0" :y="0" :z="0.7" :w="2.5" :d="2.5" :h="2" />
                    </IsoStack>
                    <div class="isoDemo_caption">angle = 15° (flatter)</div>
                </div>
                <div class="isoDemo_mini">
                    <IsoStack color="#ff8aa0" :stroke-width="2.4">
                        <IsoBox :x="0" :y="0" :z="0" :w="6" :d="6" :h="0.7" />
                        <IsoBox :x="0" :y="0" :z="0.7" :w="2.5" :d="2.5" :h="2" />
                    </IsoStack>
                    <div class="isoDemo_caption">strokeWidth = 2.4 · custom color</div>
                </div>
            </div>
        </div>

        <!-- Scene composition -->
        <div class="jShowcase_group">
            <span class="jShowcase_title">Scene composition</span>
            <div class="isoDemo_grid">
                <div class="isoDemo_mini">
                    <IsoStack color="#5b8fd6" :stroke-width="1.3" :scale="22" :glow="6">
                        <IsoBox :x="0" :y="0" :z="-3.0" :w="7" :d="7" :h="0.5" :opacity="0.16" :fill-opacity="0" />
                        <IsoBox :x="0" :y="0" :z="-1.5" :w="7" :d="7" :h="0.6" :opacity="0.38" :fill-opacity="0.03" />
                        <IsoBox :x="0" :y="0" :z="0" :w="7" :d="7" :h="0.85" :grid="4" :fill-opacity="0.06" />
                        <IsoBox :x="0" :y="0" :z="0.85" :w="1.7" :d="1.7" :h="1.7" :fill-opacity="0.12" />
                    </IsoStack>
                    <div class="isoDemo_caption">Grid platform · cube · reflection</div>
                </div>
                <div class="isoDemo_mini">
                    <IsoStack color="var(--q-accent)" :stroke-width="1.4" :scale="26">
                        <IsoBox :x="0" :y="0" :z="0" :w="8" :d="8" :h="0.7" />
                        <IsoBox :x="0" :y="0" :z="0.7" :w="5" :d="5" :h="0.7" />
                        <IsoBox :x="0" :y="0" :z="1.4" :w="2.5" :d="2.5" :h="0.7" />
                    </IsoStack>
                    <div class="isoDemo_caption">Stepped pyramid · 3× IsoBox</div>
                </div>
                <div class="isoDemo_mini">
                    <IsoStack color="var(--q-positive)" :stroke-width="1.4" :scale="24">
                        <IsoBox :x="-2.4" :y="0" :z="0" :w="3" :d="3" :h="3.2" />
                        <IsoBox :x="1.6" :y="0" :z="0" :w="3" :d="3" :h="1.8" />
                        <IsoBox :x="1.6" :y="-2.4" :z="0" :w="3" :d="3" :h="2.6" />
                    </IsoStack>
                    <div class="isoDemo_caption">City blocks · arbitrary placement</div>
                </div>
                <div class="isoDemo_mini">
                    <IsoStack color="#5ad1a0" :stroke-width="1.3" :scale="23" :fog="0.4" solid>
                        <IsoBox :x="0" :y="0" :z="0" :w="7" :d="7" :h="0.5" :grid="3" :fill-opacity="0.04" />
                        <IsoBox :x="-2" :y="-2" :z="0.5" :w="1.4" :d="1.4" :h="1.2" :fill-opacity="0.1" />
                        <IsoBox :x="0" :y="-2" :z="0.5" :w="1.4" :d="1.4" :h="2.4" :fill-opacity="0.1" />
                        <IsoBox :x="-2" :y="0" :z="0.5" :w="1.4" :d="1.4" :h="3.0" :fill-opacity="0.1" />
                        <IsoBox :x="2" :y="-2" :z="0.5" :w="1.4" :d="1.4" :h="1.8" :fill-opacity="0.1" />
                        <IsoBox :x="0" :y="0" :z="0.5" :w="1.4" :d="1.4" :h="2.0" :fill-opacity="0.1" />
                        <IsoBox :x="-2" :y="2" :z="0.5" :w="1.4" :d="1.4" :h="2.6" :fill-opacity="0.1" />
                        <IsoBox :x="2" :y="0" :z="0.5" :w="1.4" :d="1.4" :h="1.0" :fill-opacity="0.1" />
                        <IsoBox :x="0" :y="2" :z="0.5" :w="1.4" :d="1.4" :h="1.5" :fill-opacity="0.1" />
                        <IsoBox :x="2" :y="2" :z="0.5" :w="1.4" :d="1.4" :h="2.2" :fill-opacity="0.1" />
                    </IsoStack>
                    <div class="isoDemo_caption">Data towers · grid + columns</div>
                </div>
                <div class="isoDemo_mini">
                    <IsoStack color="#5b8fd6" :stroke-width="1.3" :scale="15" :fog="0.4" solid>
                        <IsoBox :x="-3.5" :y="-3" :z="-2.8" :w="1.3" :d="1.3" :h="4.2" :fill-opacity="0.08" />
                        <IsoBox :x="0" :y="-3.5" :z="-2.8" :w="1.2" :d="1.2" :h="5.5" :fill-opacity="0.08" />
                        <IsoBox :x="-3" :y="2.5" :z="-2.8" :w="1.3" :d="1.3" :h="2.8" :fill-opacity="0.08" />
                        <IsoBox :x="3" :y="-2.5" :z="-2.8" :w="1.4" :d="1.4" :h="3.0" :fill-opacity="0.08" />
                        <IsoBox :x="0.5" :y="0.5" :z="-2.8" :w="1.3" :d="1.3" :h="6.2" :fill-opacity="0.08" />
                        <IsoBox :x="-0.5" :y="3.5" :z="-2.8" :w="1.2" :d="1.2" :h="4.6" :fill-opacity="0.08" />
                        <IsoBox :x="3.5" :y="2.5" :z="-2.8" :w="1.4" :d="1.4" :h="3.6" :fill-opacity="0.08" />
                    </IsoStack>
                    <div class="isoDemo_caption">Skyscrapers · spread towers</div>
                </div>
            </div>
        </div>

        <!-- Tiles & cards -->
        <div class="jShowcase_group">
            <span class="jShowcase_title">Tiles &amp; cards</span>
            <div class="isoDemo_grid">
                <div class="isoDemo_mini">
                    <IsoStack color="#a06bff" :stroke-width="1.4" :scale="22">
                        <IsoBox :x="0" :y="0" :z="0" :w="7" :d="7" :h="0.7" />
                        <IsoBox :x="0" :y="0" :z="0.7" :w="2.6" :d="1.2" :h="3.2" :radius="0.5" folder icon="code" :fill-opacity="0.1" />
                    </IsoStack>
                    <div class="isoDemo_caption">Folder tile · rounded IsoBox</div>
                </div>
                <div class="isoDemo_mini">
                    <IsoStack color="#6ea8ff" :stroke-width="1.3" :scale="22" :fog="0.3">
                        <IsoBox :x="0" :y="0" :z="0" :w="8.5" :d="4" :h="0.6" :grid="0" :fill-opacity="0.04" />
                        <IsoBox :x="-2.6" :y="0" :z="0.6" :w="2" :d="0.7" :h="2" :radius="0.35" icon="code" :fill-opacity="0.1" />
                        <IsoBox :x="0" :y="0" :z="0.6" :w="2" :d="0.7" :h="2" :radius="0.35" icon="bolt" :fill-opacity="0.1" />
                        <IsoBox :x="2.6" :y="0" :z="0.6" :w="2" :d="0.7" :h="2" :radius="0.35" icon="lock" :fill-opacity="0.1" />
                    </IsoStack>
                    <div class="isoDemo_caption">Icon tiles · row of cards</div>
                </div>
                <div class="isoDemo_mini">
                    <IsoStack color="#b07cff" :stroke-width="1.3" :scale="22" :fog="0.3">
                        <IsoBox :x="0" :y="0" :z="0" :w="6" :d="6" :h="0.6" :grid="3" :fill-opacity="0.04" />
                        <IsoBox :x="0" :y="0" :z="0.6" :w="2.4" :d="1.0" :h="0.08" :opacity="0.4" :fill-opacity="0.04" />
                        <IsoBox :x="0" :y="0" :z="2.6" :w="2.4" :d="1.0" :h="2.6" :radius="0.45" folder icon="cloud" :fill-opacity="0.12" />
                    </IsoStack>
                    <div class="isoDemo_caption">Floating tile · z-gap</div>
                </div>
                <div class="isoDemo_mini">
                    <IsoStack color="#5ad1a0" :stroke-width="1.3" :scale="22" :fog="0.3">
                        <IsoBox :x="0" :y="0" :z="0" :w="8" :d="5" :h="0.6" :grid="0" :fill-opacity="0.04" />
                        <IsoBox :x="-1.9" :y="0" :z="0.6" :w="2.4" :d="0.9" :h="2.4" :radius="0.4" icon="code" :fill-opacity="0.1" />
                        <IsoBox :x="1.9" :y="0" :z="0.6" :w="0.9" :d="2.4" :h="2.4" :radius="0.4" icon="bolt" :fill-opacity="0.1" />
                    </IsoStack>
                    <div class="isoDemo_caption">Two-way tiles · depth vs width flips facing</div>
                </div>
                <div class="isoDemo_mini">
                    <IsoStack color="#e0b15a" :stroke-width="1.3" :scale="22" :fog="0.35">
                        <IsoBox :x="0" :y="0" :z="0" :w="8" :d="3.6" :h="0.5" :grid="0" :fill-opacity="0.04" />
                        <IsoBox :x="-2.4" :y="0" :z="0.5" :w="0.8" :d="2.6" :h="2.6" :radius="0.32" folder :fill-opacity="0.08" />
                        <IsoBox :x="-0.8" :y="0" :z="0.5" :w="0.8" :d="2.6" :h="2.2" :radius="0.32" folder :fill-opacity="0.08" />
                        <IsoBox :x="0.8" :y="0" :z="0.5" :w="0.8" :d="2.6" :h="2.9" :radius="0.32" folder :fill-opacity="0.08" />
                        <IsoBox :x="2.4" :y="0" :z="0.5" :w="0.8" :d="2.6" :h="2.0" :radius="0.32" folder :fill-opacity="0.08" />
                    </IsoStack>
                    <div class="isoDemo_caption">Bookshelf · flipped folder cards</div>
                </div>
                <div class="isoDemo_mini">
                    <IsoStack color="#ff8aa0" :stroke-width="1.3" :scale="24" :fog="0.25">
                        <IsoBox :x="0" :y="0" :z="0" :w="6" :d="6" :h="0.5" :grid="2" :fill-opacity="0.04" />
                        <IsoBox :x="0" :y="0" :z="0.5" :w="0.9" :d="3.6" :h="2.6" :radius="0.4" :fill-opacity="0.07" />
                        <IsoBox :x="0" :y="0" :z="0.5" :w="3.6" :d="0.9" :h="2.6" :radius="0.4" :fill-opacity="0.07" />
                    </IsoStack>
                    <div class="isoDemo_caption">Crossed slabs · both directions</div>
                </div>
                <div class="isoDemo_mini">
                    <IsoStack color="#7fe3ff" :stroke-width="1.4" :scale="30">
                        <IsoBox :x="0" :y="0" :z="-1.4" :w="2.6" :d="0.9" :h="2.8" :radius="0.45" folder icon="code" :fill-opacity="0.12" />
                    </IsoStack>
                    <div class="isoDemo_caption">Standalone tile · no base</div>
                </div>
            </div>
        </div>

        <!-- Arrangements -->
        <div class="jShowcase_group">
            <span class="jShowcase_title">Arrangements</span>
            <div class="isoDemo_grid">
                <div class="isoDemo_mini">
                    <IsoStack color="#6ea8ff" :stroke-width="1.3" :scale="16" :fog="0.3">
                        <IsoBox :x="-2.83" :y="-2.83" :z="1.8" :w="1.3" :d="1.3" :h="0.4" :fill-opacity="0.08" />
                        <IsoBox :x="0" :y="-4.0" :z="-1.7" :w="1.3" :d="1.3" :h="0.4" :fill-opacity="0.08" />
                        <IsoBox :x="-4.0" :y="0" :z="1.3" :w="1.3" :d="1.3" :h="0.4" :fill-opacity="0.08" />
                        <IsoBox :x="2.83" :y="-2.83" :z="-1.2" :w="1.3" :d="1.3" :h="0.4" :fill-opacity="0.08" />
                        <IsoBox :x="-2.83" :y="2.83" :z="0.8" :w="1.3" :d="1.3" :h="0.4" :fill-opacity="0.08" />
                        <IsoBox :x="4.0" :y="0" :z="-0.7" :w="1.3" :d="1.3" :h="0.4" :fill-opacity="0.08" />
                        <IsoBox :x="0" :y="4.0" :z="0.3" :w="1.3" :d="1.3" :h="0.4" :fill-opacity="0.08" />
                        <IsoBox :x="2.83" :y="2.83" :z="-0.2" :w="1.3" :d="1.3" :h="0.4" :fill-opacity="0.08" />
                    </IsoStack>
                    <div class="isoDemo_caption">Spiral staircase · rotating steps</div>
                </div>
                <div class="isoDemo_mini">
                    <IsoStack color="#ff9e64" :stroke-width="1.3" :scale="15" :fog="0.25">
                        <IsoBox :x="-3.39" :y="-3.39" :z="-0.45" :w="1.5" :d="1.5" :h="0.9" icon="filter_2" :panel="false" :icon-size="0.7" :fill-opacity="0.08" />
                        <IsoBox :x="0" :y="-4.8" :z="-0.45" :w="1.5" :d="1.5" :h="0.9" icon="filter_1" :panel="false" :icon-size="0.7" :fill-opacity="0.08" />
                        <IsoBox :x="-4.8" :y="0" :z="-0.45" :w="1.5" :d="1.5" :h="0.9" icon="filter_3" :panel="false" :icon-size="0.7" :fill-opacity="0.08" />
                        <IsoBox :x="-3.39" :y="3.39" :z="-0.45" :w="1.5" :d="1.5" :h="0.9" icon="filter_4" :panel="false" :icon-size="0.7" :fill-opacity="0.08" />
                        <IsoBox :x="3.39" :y="-3.39" :z="-0.45" :w="1.5" :d="1.5" :h="0.9" icon="filter_8" :panel="false" :icon-size="0.7" :fill-opacity="0.08" />
                        <IsoBox :x="0" :y="4.8" :z="-0.45" :w="1.5" :d="1.5" :h="0.9" icon="filter_5" :panel="false" :icon-size="0.7" :fill-opacity="0.08" />
                        <IsoBox :x="4.8" :y="0" :z="-0.45" :w="1.5" :d="1.5" :h="0.9" icon="filter_7" :panel="false" :icon-size="0.7" :fill-opacity="0.08" />
                        <IsoBox :x="3.39" :y="3.39" :z="-0.45" :w="1.5" :d="1.5" :h="0.9" icon="filter_6" :panel="false" :icon-size="0.7" :fill-opacity="0.08" />
                    </IsoStack>
                    <div class="isoDemo_caption">Numbered circle · ring of blocks</div>
                </div>
            </div>
        </div>

        <!-- Hexagons -->
        <div class="jShowcase_group">
            <span class="jShowcase_title">Hexagons (shape="hex")</span>
            <div class="isoDemo_grid">
                <div class="isoDemo_mini">
                    <IsoStack color="#4fc3e8" :stroke-width="1.4" :scale="24" :glow="7">
                        <IsoBox shape="hex" :x="0" :y="0" :z="-2.2" :w="4.4" :d="0.8" :h="4.4" :radius="0.3" icon="pets" :icon-size="1.5" :fill-opacity="0.12" />
                    </IsoStack>
                    <div class="isoDemo_caption">IsoHexagon · upright hex card</div>
                </div>
                <div class="isoDemo_mini">
                    <IsoStack color="#9b8cff" :stroke-width="1.3" :scale="18" :fog="0.25">
                        <IsoBox shape="hex" :x="-1.7" :y="0" :z="-2.4" :w="3.1" :d="0.7" :h="3.1" :radius="0.25" icon="bolt" :icon-size="1.1" :fill-opacity="0.1" />
                        <IsoBox shape="hex" :x="1.7" :y="0" :z="-2.4" :w="3.1" :d="0.7" :h="3.1" :radius="0.25" icon="lock" :icon-size="1.1" :fill-opacity="0.1" />
                        <IsoBox shape="hex" :x="0" :y="0" :z="0.0" :w="3.1" :d="0.7" :h="3.1" :radius="0.25" icon="hub" :icon-size="1.1" :fill-opacity="0.1" />
                    </IsoStack>
                    <div class="isoDemo_caption">Honeycomb · hex cluster</div>
                </div>
                <div class="isoDemo_mini">
                    <IsoStack color="#4fc3e8" :stroke-width="1.3" :scale="19" :fog="0.3">
                        <IsoBox :x="0" :y="0" :z="0" :w="6.5" :d="6.5" :h="0.7" :fill-opacity="0.05" />
                        <IsoBox :x="0" :y="0" :z="0.7" :w="4" :d="4" :h="0.8" :fill-opacity="0.05" />
                        <IsoBox shape="hex" :x="0" :y="0" :z="1.5" :w="3.4" :d="0.8" :h="3.4" :radius="0.3" icon="hub" :icon-size="1.2" :fill-opacity="0.12" />
                    </IsoStack>
                    <div class="isoDemo_caption">Hex on pedestal · box + hex</div>
                </div>
                <div class="isoDemo_mini">
                    <IsoStack color="#9b8cff" :stroke-width="1.3" :scale="17" :fog="0.3">
                        <IsoBox :x="0" :y="0" :z="0" :w="9" :d="4" :h="0.6" :grid="0" :fill-opacity="0.04" />
                        <IsoBox :x="-2.8" :y="0" :z="0.6" :w="2" :d="0.7" :h="2.2" :radius="0.35" icon="code" :icon-size="1.0" :fill-opacity="0.1" />
                        <IsoBox :x="0" :y="0" :z="0.6" :w="2" :d="0.7" :h="2.2" :radius="0.35" folder icon="folder" :icon-size="1.0" :fill-opacity="0.1" />
                        <IsoBox shape="hex" :x="2.8" :y="0" :z="0.6" :w="2.4" :d="0.7" :h="2.4" :radius="0.25" icon="bolt" :icon-size="1.0" :fill-opacity="0.1" />
                    </IsoStack>
                    <div class="isoDemo_caption">Mixed shapes · box · folder · hex</div>
                </div>
                <div class="isoDemo_mini">
                    <IsoStack color="#ff9e64" :stroke-width="1.3" :scale="16" :fog="0.35">
                        <IsoBox :x="-2.2" :y="-1" :z="0" :w="2.4" :d="2.4" :h="3.0" :fill-opacity="0.06" />
                        <IsoBox shape="hex" :x="-2.2" :y="-1" :z="3.0" :w="2.2" :d="0.6" :h="2.2" :radius="0.2" icon="star" :icon-size="0.9" :fill-opacity="0.1" />
                        <IsoBox :x="1.6" :y="1.2" :z="0" :w="2.4" :d="2.4" :h="4.2" :fill-opacity="0.06" />
                        <IsoBox shape="hex" :x="1.6" :y="1.2" :z="4.2" :w="2.2" :d="0.6" :h="2.2" :radius="0.2" icon="bolt" :icon-size="0.9" :fill-opacity="0.1" />
                    </IsoStack>
                    <div class="isoDemo_caption">Hex-capped towers · box + hex</div>
                </div>
                <div class="isoDemo_mini">
                    <IsoStack color="#4fc3e8" :stroke-width="1.4" :scale="22" :glow="7">
                        <IsoBox shape="hex" :x="0" :y="0" :z="0" :w="6" :d="6" :h="0.9" :radius="0.25" icon="grid_view" :icon-size="2" :fill-opacity="0.12" />
                    </IsoStack>
                    <div class="isoDemo_caption">Hex floor tile · h &lt; w,d</div>
                </div>
                <div class="isoDemo_mini">
                    <IsoStack color="#9b8cff" :stroke-width="1.3" :scale="15" :fog="0.3">
                        <IsoBox shape="hex" :x="-2.6" :y="-2.6" :z="0" :w="4.4" :d="4.4" :h="0.7" :radius="0.2" icon="hexagon" :icon-size="1.4" :fill-opacity="0.1" />
                        <IsoBox shape="hex" :x="2.6" :y="-2.6" :z="0" :w="4.4" :d="4.4" :h="0.7" :radius="0.2" icon="bolt" :icon-size="1.4" :fill-opacity="0.1" />
                        <IsoBox shape="hex" :x="0" :y="2.6" :z="0" :w="4.4" :d="4.4" :h="0.7" :radius="0.2" icon="hub" :icon-size="1.4" :fill-opacity="0.1" />
                    </IsoStack>
                    <div class="isoDemo_caption">Hex tile floor · laid flat</div>
                </div>
            </div>
        </div>

    </div>
</template>

<script>
import IsoStack from './IsoStack.vue';
import IsoBox from './IsoBox.vue';

const apiJson = {
    props: {
        color: {
            type: 'String',
            desc: 'Stroke colour for the whole scene. Any CSS colour or theme var. Inherited by child IsoBoxes that do not set their own color.',
            default: 'var(--q-primary)',
        },
        strokeWidth: {
            type: 'Number',
            desc: 'Stroke width in screen pixels (non-scaling). Inherited by children.',
            default: '1.4',
        },
        fillOpacity: {
            type: 'Number',
            desc: 'Faint face-fill opacity (0 = pure wireframe). Inherited by children.',
            default: '0.06',
        },
        glow: {
            type: 'Number',
            desc: 'Soft outer glow radius in px (0 disables).',
            default: '7',
        },
        fog: {
            type: 'Number',
            desc: 'Atmospheric fade strength (0 = off, 1 = far side dissolves fully).',
            default: '0',
        },
        fogNear: {
            type: 'Number',
            desc: 'Grid-depth (x + y) treated as nearest for the fog ramp.',
            default: '6',
        },
        fogFar: {
            type: 'Number',
            desc: 'Grid-depth (x + y) treated as farthest for the fog ramp.',
            default: '-8',
        },
        scale: {
            type: 'Number',
            desc: 'Pixels per grid unit (zoom).',
            default: '20',
        },
        angle: {
            type: 'Number',
            desc: 'Isometric projection angle in degrees.',
            default: '30',
        },
        solid: {
            type: 'Boolean',
            desc: 'When true, boxes fill their faces opaquely (with surface) so front blocks hide what is behind them. Inherited by children.',
            default: 'false',
        },
        surface: {
            type: 'String',
            desc: 'Opaque colour used for occlusion fills in solid mode.',
            default: 'var(--q-surface-1)',
        },
        viewBox: {
            type: 'String',
            desc: 'SVG viewBox framing the scene. Override for taller / wider compositions that the default frame would clip.',
            default: '-190 -150 380 270',
        },
        ariaLabel: {
            type: 'String',
            desc: 'Accessible label for the SVG.',
            default: 'Isometric vault illustration',
        },
    },
    slots: {
        default: {
            desc: 'The scene content — one or more IsoBox children. When omitted, a sample scene (three stacked platforms) is drawn.',
        },
    },
};

export default {
    name: 'IsoStackShowcase',
    label: 'Iso Stack',
    icon: 'deployed_code',
    components: { IsoStack, IsoBox },
    apiJson,
    importName: 'IsoStack',
    importFrom: 'shared/components/Theme/IsoBox/IsoStack.vue',
};
</script>

<style scoped>
/*
 * GOTCHA — huge empty vertical gap below the first section.
 *
 * The showcase host (Varmory JComponentShowcase) renders this descriptor inside
 * a Quasar 50/50 row: the live demos on the left, the API/code panel on the
 * right (see JComponentShowcase.vue). Quasar's `.row` uses align-items:stretch,
 * so the demo column is stretched to match the (usually taller) API/code column.
 *
 * Varmory's `.jShowcase_row.jShowcase_column` makes our root a FLEX COLUMN. When
 * that flex column is stretched tall, the extra height is absorbed by the first
 * flex child (the first `.jShowcase_group`), which balloons and pushes the next
 * section way down — looking like a giant gap "between sections".
 *
 * FIX: take the root out of flex (`display: block`) so its children size to
 * their own content and can't be stretched. The `.isoShowcase_root` class is
 * only here to win specificity over Varmory's global `.jShowcase_row.jShowcase_column`
 * rule. Block flow has no `gap`, so re-add section spacing via margin-bottom.
 */
.jShowcase_row.jShowcase_column.isoShowcase_root {
    display: block;
}

.isoShowcase_root .jShowcase_group {
    margin-bottom: 20px;
}

.isoDemo_grid {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(150px, 1fr));
    gap: 16px;
    width: 100%;
}

.isoDemo_mini {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 6px;
    padding: 8px;
    border-radius: 10px;
    border: 1px solid color-mix(in srgb, var(--q-primary) 12%, transparent);
    background: color-mix(in srgb, var(--q-primary) 3%, transparent);
}

.isoDemo_mini :deep(.isoStack) {
    height: 150px;
}

.isoDemo_caption {
    font-size: 11px;
    line-height: 1.3;
    text-align: center;
    opacity: 0.75;
}
</style>
