<script setup lang="ts">
import type { HTMLAttributes } from 'vue';

defineOptions({
    inheritAttrs: false,
});

interface Props {
    className?: HTMLAttributes['class'];
}

defineProps<Props>();
</script>

<template>
    <svg viewBox="-2.4 -2.4 28.80 28.80" version="1.1" xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" fill="#000000"><g id="SVGRepo_bgCarrier" stroke-width="0"></g><g id="SVGRepo_tracerCarrier" stroke-linecap="round" stroke-linejoin="round"></g><g id="SVGRepo_iconCarrier"> <title></title> <g fill="none" fill-rule="evenodd" id="页面-1" stroke="none" stroke-linecap="round" stroke-linejoin="round" stroke-width="1"> <g id="导航图标" stroke="#212121" stroke-width="1.5" transform="translate(-102.000000, -15.000000)"> <g id="会议" transform="translate(102.000000, 15.000000)"> <g id="编组" transform="translate(2.500000, 5.000000)"> <path d="M0,0.95 C0,0.42532925 0.42532925,0 0.95,0 L14.25,0 C14.774685,0 15.2,0.42532925 15.2,0.95 L15.2,5.225 L19,2.375 L19,13.3 L15.2,10.45 L15.2,14.25 C15.2,14.774685 14.774685,15.2 14.25,15.2 L0.95,15.2 C0.42532925,15.2 0,14.774685 0,14.25 L0,0.95 Z" id="路径"></path> <line id="路径" x1="2.85" x2="2.85" y1="3.8" y2="5.7"></line> <line id="路径" x1="5.225" x2="5.225" y1="2.85" y2="6.65"></line> <line id="路径" x1="7.6" x2="7.6" y1="3.8" y2="5.7"></line> </g> </g> </g> </g> </g></svg>
</template>
