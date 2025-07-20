<script lang="ts">
  import Graph from '$lib/components/graph.svelte';
  import ThreadView from '$lib/components/thread-view.svelte'
  import type { GaiaResult } from '../../gaia-types';
  import type { Message as MessageType, Thread } from '$lib/threads';
  import Button, { type ButtonProps } from '$lib/components/ui/button/button.svelte';

  let data: undefined | GaiaResult = $state()

  let selectedThread: Thread | undefined = $state();

  let messages: MessageType[] = $state([]);

  $effect(() => {
    let threads = data?.result?.threads;
    if (threads !== undefined) {
      let desiredThread = threads.find((t) => t.id == selectedThread?.id);
      if (desiredThread == undefined) {
        selectedThread = threads[0];
        desiredThread = selectedThread;
      }

      messages = desiredThread.messages.map((msg) => ({
        id: msg.id,
        threadId: msg.threadId,
        content: msg.content,
        senderId: msg.senderId,
        timestamp: new Date(msg.timestamp),
        mentions: msg.mentions || []
      }));
    }
  })
</script>

<main class="max-w-6xl mx-auto px-4 py-12 md:px-8">
  <header class="mb-12 text-center">
    <h1 class="text-4xl md:text-5xl font-bold tracking-tight mb-4">
      GAIA Benchmark Report
    </h1>
    <p class="text-xl text-muted-foreground max-w-3xl mx-auto">
      Performance analysis and visualization of AI systems on the GAIA benchmark
    </p>
  </header>

  <section class="mb-16">
    <h2 class="text-2xl font-bold mb-6 border-b pb-2">GAIA Benchmark Overview</h2>
    <p class="text-lg leading-relaxed mb-8">
      The GAIA benchmark is a collection of tasks designed to evaluate the performance of AI systems in reasoning, planning, and problem-solving. It consists of various tasks that require different cognitive abilities, such as logical reasoning, spatial reasoning, and mathematical problem-solving.
    </p>

    <div class="grid grid-cols-2 md:grid-cols-4 gap-6 my-10">
      <div class="text-center">
        <span class="block text-3xl font-bold">42</span>
        <span class="text-muted-foreground">Total Tasks</span>
      </div>
      <div class="text-center">
        <span class="block text-3xl font-bold">78%</span>
        <span class="text-muted-foreground">Success Rate</span>
      </div>
      <div class="text-center">
        <span class="block text-3xl font-bold">1.2s</span>
        <span class="text-muted-foreground">Avg. Response Time</span>
      </div>
      <div class="text-center">
        <span class="block text-3xl font-bold">92%</span>
        <span class="text-muted-foreground">Completion</span>
      </div>
    </div>
  </section>

  <section class="mb-16">
    <h2 class="text-2xl font-bold mb-6 border-b pb-2">Performance Visualization</h2>
    <p class="text-lg leading-relaxed mb-8">
      Task performance across different categories of the GAIA benchmark, visualized to highlight patterns and insights.
    </p>

    <div class="min-h-[600px] border rounded-lg bg-card/20 p-6">
      <div class="h-full flex items-center justify-center">
        <Graph bind:selectedData={data} />
      </div>
    </div>
  </section>

  <section class="mb-16">
    {#if data !== undefined}      
      <h2 class="text-2xl font-bold mb-6 border-b pb-2">GAIA Question - {data.result.question.task_id}</h2>

      <p class="text-lg leading-relaxed mb-8">
        {data.result.question.Question}
      </p>

      <table class="mb-8">
        <tbody>
          <tr>
            <td style="padding-right: 1rem;">Correct answer</td>
            <td><span style="color: green;">{data.result.question["Final answer"]}</span></td>
          </tr>
          <tr>
            <td>Our answer</td>
            <td>
              {#if data.result.answerAttempt?.answer !== undefined}
                <span style="color: {data.result.question["Final answer"] == data.result.answerAttempt.answer ? "green" : "red"};">{data.result.answerAttempt.answer}</span>
              {:else}
                <span style="color: red; font-style: italic;">No answer provided</span>
              {/if}
            </td>
          </tr>
        </tbody>
      </table>

      <h2 class="text-2xl font-bold mb-6 border-b pb-2">Annotated metadata</h2>
      <p class="text-lg leading-relaxed mb-8">
        {#each data.result.question["Annotator Metadata"].Steps.split("\n") as step, i}
          <span class="block mb-2">
            {step}
          </span>
        {/each}
      </p>

      <h2 class="text-2xl font-bold mb-6 border-b pb-2">Threads</h2>
      {#each data.result?.threads as thread}
        <div class="mb-8">
          <Button
            variant="link"
            onclick={() => {
              console.log("selected " + thread.id);
              selectedThread = thread;
            }}
          >
            {thread.name}
          </Button>
        </div>
      {/each}
      <ThreadView thread={selectedThread} {messages} />
    {/if}
  </section>

  <section class="mb-16">
    <h2 class="text-2xl font-bold mb-6 border-b pb-2">Task Categories Analysis</h2>
    <p class="text-lg leading-relaxed mb-8">
      The GAIA benchmark tasks are divided into three main categories, each testing different aspects of AI capabilities.
    </p>

    <div class="grid grid-cols-1 md:grid-cols-3 gap-8">
      <div>
        <h3 class="text-xl font-bold mb-3">Reasoning Tasks</h3>
        <p class="text-lg leading-relaxed mb-4">
          Logical and analytical reasoning tasks evaluate the AI system's ability to draw conclusions from given premises and identify patterns.
        </p>
        <div class="h-40 bg-card/30 rounded-lg flex items-center justify-center text-muted-foreground">
          Graph placeholder
        </div>
      </div>

      <div>
        <h3 class="text-xl font-bold mb-3">Planning Tasks</h3>
        <p class="text-lg leading-relaxed mb-4">
          Strategic planning tasks assess the AI system's ability to formulate sequences of actions to achieve specific goals.
        </p>
        <div class="h-40 bg-card/30 rounded-lg flex items-center justify-center text-muted-foreground">
          Graph placeholder
        </div>
      </div>

      <div>
        <h3 class="text-xl font-bold mb-3">Problem-Solving Tasks</h3>
        <p class="text-lg leading-relaxed mb-4">
          Complex problem-solving tasks evaluate the AI system's ability to identify solutions to multi-step problems requiring diverse cognitive skills.
        </p>
        <div class="h-40 bg-card/30 rounded-lg flex items-center justify-center text-muted-foreground">
          Graph placeholder
        </div>
      </div>
    </div>
  </section>
</main>
