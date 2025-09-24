<script lang="ts">
  import LandingHero from '$lib/components/sections/LandingHero.svelte';
  
  /** @type {import('./$types').PageData} */
  export let data;
</script>

<LandingHero user={data.user} />
