import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import test from 'node:test';
import { clampSlide, nextSlideForKey, stepSlide, swipeStep } from '../src/lib/components/molecules/carousel-keyboard.js';

const source = await readFile(
	new URL('../src/lib/components/molecules/Carousel.svelte', import.meta.url),
	'utf8'
);
const index = await readFile(new URL('../src/lib/index.ts', import.meta.url), 'utf8');
const docs = await readFile(new URL('../src/routes/+page.svelte', import.meta.url), 'utf8');

test('index clamps to the edges without loop and wraps with loop', () => {
	assert.equal(clampSlide(-1, 3), 0);
	assert.equal(clampSlide(7, 3), 2);
	assert.equal(clampSlide(1.9, 3), 1);
	assert.equal(clampSlide(NaN, 3), 0);
	assert.equal(clampSlide(2, 0), 0);
	assert.equal(clampSlide(-1, 3, true), 2);
	assert.equal(clampSlide(3, 3, true), 0);
	assert.equal(clampSlide(-4, 3, true), 2);
});

test('stepping stalls at the edges without loop and wraps with loop', () => {
	assert.equal(stepSlide(2, 3, 1), 2);
	assert.equal(stepSlide(0, 3, -1), 0);
	assert.equal(stepSlide(1, 3, 1), 2);
	assert.equal(stepSlide(2, 3, 1, true), 0);
	assert.equal(stepSlide(0, 3, -1, true), 2);
});

test('arrow keys step, Home/End jump, other keys are left to the browser', () => {
	assert.equal(nextSlideForKey(0, 3, 'ArrowRight'), 1);
	assert.equal(nextSlideForKey(2, 3, 'ArrowRight'), 2);
	assert.equal(nextSlideForKey(2, 3, 'ArrowRight', true), 0);
	assert.equal(nextSlideForKey(0, 3, 'ArrowLeft'), 0);
	assert.equal(nextSlideForKey(0, 3, 'ArrowLeft', true), 2);
	assert.equal(nextSlideForKey(1, 3, 'Home'), 0);
	assert.equal(nextSlideForKey(1, 3, 'End'), 2);
	assert.equal(nextSlideForKey(1, 3, 'Enter'), undefined);
	assert.equal(nextSlideForKey(1, 3, 'ArrowDown'), undefined);
	assert.equal(nextSlideForKey(0, 0, 'ArrowRight'), undefined);
});

test('swipe needs the threshold and a horizontal-dominant gesture', () => {
	assert.equal(swipeStep(-60, 5), 1);
	assert.equal(swipeStep(60, -5), -1);
	assert.equal(swipeStep(-20, 0), 0);
	assert.equal(swipeStep(-60, 80), 0);
	assert.equal(swipeStep(-60, 60), 0);
	assert.equal(swipeStep(-10, 0, 10), 1);
});

test('Carousel prop surface and defaults', () => {
	assert.match(source, /index = \$bindable\(0\)/);
	assert.match(source, /slides: T\[\];/);
	assert.match(source, /slide\?: Snippet<\[T, number\]>;/);
	assert.match(source, /loop = false/);
	assert.match(source, /autoplay = 0/);
	assert.match(source, /dots = true/);
	assert.match(source, /controls = true/);
	assert.match(source, /counter = false/);
	assert.match(source, /label = 'Carousel'/);
	assert.match(source, /class: klass = ''/);
	assert.match(source, /style\?: string;/);
	assert.match(source, /slideClass\?: string;/);
	assert.match(source, /onchange\?: \(index: number\) => void;/);
});

test('Carousel follows the group flavour of the ARIA carousel pattern', () => {
	assert.match(source, /aria-roledescription="carousel"/);
	assert.match(source, /aria-label={label}/);
	assert.match(source, /role="group"\s+aria-roledescription="slide"\s+aria-label="{i \+ 1} of {count}"/s);
	assert.match(source, /aria-hidden={i !== index}/);
	assert.match(source, /inert={i !== index}/);
	assert.match(source, /aria-live={rotating \? 'off' : 'polite'}/);
	assert.doesNotMatch(source, /role="tablist"|role="tabpanel"/);
	assert.match(source, /icon="chevron-left" label="Previous slide"/);
	assert.match(source, /icon="chevron-right" label="Next slide"/);
	assert.match(source, /disabled={atStart}/);
	assert.match(source, /disabled={atEnd}/);
	assert.match(source, /aria-current={i === index \? 'true' : undefined}/);
	assert.match(source, /tabindex={i === index \? 0 : -1}/);
	assert.match(source, /The tablist flavour was rejected/);
});

test('Carousel wires the extracted keyboard and swipe logic', () => {
	assert.match(source, /import { clampSlide, nextSlideForKey, stepSlide, swipeStep } from '\.\/carousel-keyboard\.js';/);
	assert.match(source, /nextSlideForKey\(index, count, e\.key, loop\)/);
	assert.match(source, /swipeStep\(e\.clientX - startX, e\.clientY - startY\)/);
	assert.match(source, /touch-action: pan-y;/);
});

test('Carousel drops the slide transition under reduced motion', () => {
	assert.match(source, /\.track\s*{[^}]*transition: transform/s);
	assert.match(source, /@media \(prefers-reduced-motion: reduce\)\s*{\s*\.track,\s*\.dot\s*{\s*transition: none;/s);
});

test('Carousel autoplay is off by default, pauses on hover and focus, and is stoppable', () => {
	assert.match(source, /const rotating = \$derived\(playing && autoplay > 0 && count > 1 && !hovered && !focused\);/);
	assert.match(source, /onpointerenter={\(\) => \(hovered = true\)}/);
	assert.match(source, /onfocusin={\(\) => \(focused = true\)}/);
	assert.match(source, /icon={playing \? 'pause' : 'play'}/);
	assert.match(source, /onclick={\(\) => \(playing = !playing\)}/);
	assert.match(source, /clearInterval\(id\)/);
});

test('Carousel is exported and documented', () => {
	assert.match(index, /export { default as Carousel } from '\.\/components\/molecules\/Carousel\.svelte';/);
	assert.match(docs, /{ id: 'carousel', label: 'Carousel', keywords: '[^']*swipe[^']*' }/);
	assert.match(docs, /<section class="section" id="carousel">/);
	assert.match(docs, /<Carousel slides={demoSlides} bind:index={slideIndex}/);
});
