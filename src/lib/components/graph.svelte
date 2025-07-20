<script lang="ts">
	import { InternSet, hierarchy, pack, range, scaleOrdinal, schemeTableau10 } from 'd3';
	import data from './../../gaia-data.json'
	import type { GaiaResult } from '../../gaia-types';

	interface Props {
		selectedData: undefined | GaiaResult;
	};

	let { selectedData = $bindable() }: Props = $props();

	const width = 1000; //the margin top, bottom, left, right margin offset relative to the radius
	const padding = 3; // the all padding all around each circle, in pixels
	const margin = 1; // the all margin all around, in pixels
	const textColor = 'black'; //the color of the text
	const fill = '#ccc'; // a static fill color, if no group channel is specified
	const fillOpacity = 0.9; // the fill opacity of the bubbles
	const strokeColor = 'none'; // a static stroke around the bubbles
	const strokeWidth = 1; // the stroke width around the bubbles, if any
	const strokeOpacity = 1; // the stroke opacity around the bubbles, if any
	const height = width; // the outer height of the chart, in pixels
	const marginLeft = margin; // the left margin, in pixels
	const marginRight = margin; // the right margin, in pixels
	const marginTop = margin; // the top margin, in pixels
	const marginBottom = margin; // the bottom margin, in pixels


	/**
	 * Data preparation for visualization
	 */
	// Extract character counts from data for sizing the circles
	const vVals = data.map((el) => el.characterCount);

	// Create an array of indices for non-zero values
	const iVals = range(vVals.length).filter(i => vVals[i] > 0);

	// // Compute labels.
	// const lVals = data.map((el) => [...el.result.question.task_id.split('.').pop()!.split(/(?=[A-Z][a-z])/g), el.characterCount.toLocaleString('en')].join('\n'));
	// const tVals = data.map((el) => `${el.result.question.task_id}\n${el.characterCount.toLocaleString('en')}`);

	/**
	 * Create a hierarchical layout for the visualization
	 * 
	 * This uses D3's pack layout to create a circle packing visualization
	 * where each circle represents a data point with size proportional to its value.
	 */
	const root = pack()
		.size([width - marginLeft - marginRight, height - marginTop - marginBottom])
		.padding(padding)
		(hierarchy<{ children: number[] }>({ children: iVals })
			.sum(i => vVals[i as number]));

	/**
	 * Determine the color of a node based on the question level
	 *
	 * @param index - The index of the data point
	 * @returns The color as a string
	 */
	function color(index: number): string {
		let result = data[index].result;
		if (!result.isCorrect) {
			return "grey";
		}
		switch (result.question.Level) {
			case 1:
				return schemeTableau10[1];
			case 2:
				return schemeTableau10[3];
			case 3:
				return schemeTableau10[2];
			default:
				return "grey";
		}
	}

</script>

<svg {width} {height} viewBox="{-marginLeft} {-marginTop} {width} {height}" fill={textColor}>
	{#each root.leaves() as leaf, i}
		<g class='node' transform="translate({(leaf.x)},{(leaf.y)})">
			<circle id="node-{i}"
							stroke={strokeColor} stroke-width={strokeWidth} stroke-opacity={strokeOpacity}
							fill={color(i)}
							fill-opacity={fillOpacity}
							r={leaf.r}
							onclick={() => selectedData = data[i]}
			>
				<title>{data[i].result.question.task_id}</title>
			</circle>
<!--			<clipPath id={`${uid}-clip-${leaf.data}`}>-->
<!--				<circle r={leaf.r}></circle>-->
<!--			</clipPath>-->
			<text text-anchor="middle" y="0" x="0"
						onclick={() => selectedData = data[i]}>
				{#if leaf.r >= 20}
					<tspan font-size={leaf.r * 0.5}>
						{String(i).padStart(3, "0")}
					</tspan>
				{:else}
					<tspan font-size={leaf.r * 0.8}>
						{i}
					</tspan>
				{/if}
			</text>
		</g>
	{/each}
</svg>

<style>
    svg {
        max-width: 100%;
        height: auto;
        height: intrinsic;
        font-size: 10;
        font-family: sans-serif;
        text-anchor: middle;
    }

		svg > g > text {
				background-color: orange;
		}

    .node {
        cursor: pointer;
    }

    .node:hover {
        font-weight: 700;
    }
</style>
