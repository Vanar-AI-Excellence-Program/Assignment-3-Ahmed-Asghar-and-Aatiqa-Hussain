<script lang="ts">
  export let variant: 'default' | 'elevated' | 'outlined' = 'default';
  export let padding: 'none' | 'sm' | 'md' | 'lg' = 'md';
  export let className: string = '';
  
  const baseClasses = 'rounded-xl transition-all duration-200';
  const variants = {
    default: 'bg-white dark:bg-gray-800 shadow-sm',
    elevated: 'bg-white dark:bg-gray-800 shadow-lg hover:shadow-xl',
    outlined: 'bg-transparent border border-gray-200 dark:border-gray-700'
  };
  
  const paddings = {
    none: '',
    sm: 'p-4',
    md: 'p-6',
    lg: 'p-8'
  };
  
  $: classes = `${baseClasses} ${variants[variant]} ${paddings[padding]} ${className}`;
</script>

<div class={classes}>
  <slot />
</div>
