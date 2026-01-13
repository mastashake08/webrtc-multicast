<script setup lang="ts">
import { dashboard, login, register } from '@/routes';
import { Head, Link } from '@inertiajs/vue3';

withDefaults(
    defineProps<{
        canRegister: boolean;
    }>(),
    {
        canRegister: true,
    },
);
</script>

<template>
    <Head title="Welcome">
        <link rel="preconnect" href="https://rsms.me/" />
        <link rel="stylesheet" href="https://rsms.me/inter/inter.css" />
    </Head>
    <div
        class="flex min-h-screen flex-col items-center bg-[#FDFDFC] p-6 text-[#1b1b18] lg:justify-center lg:p-8 dark:bg-[#0a0a0a]"
    >
        <header
            class="mb-6 w-full max-w-[335px] text-sm not-has-[nav]:hidden lg:max-w-4xl"
        >
            <nav class="flex items-center justify-end gap-4">
                <Link
                    v-if="$page.props.auth.user"
                    :href="dashboard()"
                    class="inline-block rounded-sm border border-[#19140035] px-5 py-1.5 text-sm leading-normal text-[#1b1b18] hover:border-[#1915014a] dark:border-[#3E3E3A] dark:text-[#EDEDEC] dark:hover:border-[#62605b]"
                >
                    Dashboard
                </Link>
                <template v-else>
                    <Link
                        :href="login()"
                        class="inline-block rounded-sm border border-transparent px-5 py-1.5 text-sm leading-normal text-[#1b1b18] hover:border-[#19140035] dark:text-[#EDEDEC] dark:hover:border-[#3E3E3A]"
                    >
                        Log in
                    </Link>
                    <Link
                        v-if="canRegister"
                        :href="register()"
                        class="inline-block rounded-sm border border-[#19140035] px-5 py-1.5 text-sm leading-normal text-[#1b1b18] hover:border-[#1915014a] dark:border-[#3E3E3A] dark:text-[#EDEDEC] dark:hover:border-[#62605b]"
                    >
                        Register
                    </Link>
                </template>
            </nav>
        </header>
        <div
            class="flex w-full items-center justify-center opacity-100 transition-opacity duration-750 lg:grow starting:opacity-0"
        >
            <main
                class="flex w-full max-w-[335px] flex-col-reverse overflow-hidden rounded-lg lg:max-w-4xl lg:flex-row"
            >
                <div
                    class="flex-1 rounded-br-lg rounded-bl-lg bg-white p-6 pb-12 text-[13px] leading-[20px] shadow-[inset_0px_0px_0px_1px_rgba(26,26,0,0.16)] lg:rounded-tl-lg lg:rounded-br-none lg:p-20 dark:bg-[#161615] dark:text-[#EDEDEC] dark:shadow-[inset_0px_0px_0px_1px_#fffaed2d]"
                >
                    <h1 class="mb-4 text-3xl font-semibold">WebRTC Multicast Streaming</h1>
                    <p class="mb-6 text-[#706f6c] dark:text-[#A1A09A]">
                        Stream your camera or screen to multiple RTMP destinations simultaneously using WebRTC technology.
                    </p>
                    
                    <div class="mb-6 rounded-lg border border-[#e3e3e0] bg-[#FDFDFC] p-4 dark:border-[#3E3E3A] dark:bg-[#0a0a0a]">
                        <p class="mb-2 text-sm font-medium text-[#1b1b18] dark:text-[#EDEDEC]">⚡️ Requires Backend Server</p>
                        <p class="mb-2 text-sm text-[#706f6c] dark:text-[#A1A09A]">
                            This application works with the 
                            <a 
                                href="https://github.com/mastashake08/webrtc-rtmp" 
                                target="_blank"
                                class="font-medium text-[#f53003] underline underline-offset-2 dark:text-[#FF4433]"
                            >
                                webrtc-rtmp server package
                            </a>
                        </p>
                        <p class="text-sm text-[#706f6c] dark:text-[#A1A09A]">
                            Deploy the Python backend server first, then connect using its Peer ID in your dashboard.
                        </p>
                    </div>
                    
                    <div class="mb-6 space-y-4">
                        <div class="flex items-start gap-3">
                            <svg class="mt-1 h-5 w-5 text-[#f53003] dark:text-[#FF4433]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7" />
                            </svg>
                            <div>
                                <h3 class="font-medium">Multi-Platform Streaming</h3>
                                <p class="text-[#706f6c] dark:text-[#A1A09A]">Stream to YouTube, Twitch, Facebook Live, and custom RTMP servers simultaneously</p>
                            </div>
                        </div>
                        
                        <div class="flex items-start gap-3">
                            <svg class="mt-1 h-5 w-5 text-[#f53003] dark:text-[#FF4433]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7" />
                            </svg>
                            <div>
                                <h3 class="font-medium">WebRTC Technology</h3>
                                <p class="text-[#706f6c] dark:text-[#A1A09A]">Low-latency peer-to-peer streaming using modern WebRTC protocols</p>
                            </div>
                        </div>
                        
                        <div class="flex items-start gap-3">
                            <svg class="mt-1 h-5 w-5 text-[#f53003] dark:text-[#FF4433]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7" />
                            </svg>
                            <div>
                                <h3 class="font-medium">Real-Time Control</h3>
                                <p class="text-[#706f6c] dark:text-[#A1A09A]">Manage streams, add/remove destinations, and control settings in real-time</p>
                            </div>
                        </div>
                    </div>

                    <ul class="mb-4 flex flex-col lg:mb-6">
                        <li
                            class="relative flex items-center gap-4 py-2 before:absolute before:top-1/2 before:bottom-0 before:left-[0.4rem] before:border-l before:border-[#e3e3e0] dark:before:border-[#3E3E3A]"
                        >
                            <span
                                class="relative bg-white py-1 dark:bg-[#161615]"
                            >
                                <span
                                    class="flex h-3.5 w-3.5 items-center justify-center rounded-full border border-[#e3e3e0] bg-[#FDFDFC] shadow-[0px_0px_1px_0px_rgba(0,0,0,0.03),0px_1px_2px_0px_rgba(0,0,0,0.06)] dark:border-[#3E3E3A] dark:bg-[#161615]"
                                >
                                    <span
                                        class="h-1.5 w-1.5 rounded-full bg-[#dbdbd7] dark:bg-[#3E3E3A]"
                                    />
                                </span>
                            </span>
                            <span>
                                Get started by
                                <Link
                                    v-if="$page.props.auth.user"
                                    :href="dashboard()"
                                    class="ml-1 font-medium text-[#f53003] underline underline-offset-4 dark:text-[#FF4433]"
                                >
                                    going to your dashboard
                                </Link>
                                <Link
                                    v-else
                                    :href="login()"
                                    class="ml-1 font-medium text-[#f53003] underline underline-offset-4 dark:text-[#FF4433]"
                                >
                                    logging in
                                </Link>
                            </span>
                        </li>
                        <li
                            class="relative flex items-center gap-4 py-2 before:absolute before:top-0 before:bottom-1/2 before:left-[0.4rem] before:border-l before:border-[#e3e3e0] dark:before:border-[#3E3E3A]"
                        >
                            <span
                                class="relative bg-white py-1 dark:bg-[#161615]"
                            >
                                <span
                                    class="flex h-3.5 w-3.5 items-center justify-center rounded-full border border-[#e3e3e0] bg-[#FDFDFC] shadow-[0px_0px_1px_0px_rgba(0,0,0,0.03),0px_1px_2px_0px_rgba(0,0,0,0.06)] dark:border-[#3E3E3A] dark:bg-[#161615]"
                                >
                                    <span
                                        class="h-1.5 w-1.5 rounded-full bg-[#dbdbd7] dark:bg-[#3E3E3A]"
                                    />
                                </span>
                            </span>
                            <span>
                                Watch video tutorials at
                                <a
                                    href="https://laracasts.com"
                                    target="_blank"
                                    class="ml-1 inline-flex items-center space-x-1 font-medium text-[#f53003] underline underline-offset-4 dark:text-[#FF4433]"
                                >
                                    <span>Laracasts</span>
                                    <svg
                                        width="10"
                                        height="11"
                                        viewBox="0 0 10 11"
                                        fill="none"
                                        xmlns="http://www.w3.org/2000/svg"
                                        class="h-2.5 w-2.5"
                                    >
                                        <path
                                            d="M7.70833 6.95834V2.79167H3.54167M2.5 8L7.5 3.00001"
                                            stroke="currentColor"
                                            stroke-linecap="square"
                                        />
                                    </svg>
                                </a>
                            </span>
                        </li>
                    </ul>
                    <ul class="flex gap-3 text-sm leading-normal">
                        <li>
                            <a
                                href="https://cloud.laravel.com"
                                target="_blank"
                                class="inline-block rounded-sm border border-black bg-[#1b1b18] px-5 py-1.5 text-sm leading-normal text-white hover:border-black hover:bg-black dark:border-[#eeeeec] dark:bg-[#eeeeec] dark:text-[#1C1C1A] dark:hover:border-white dark:hover:bg-white"
                            >
                                Deploy now
                            </a>
                        </li>
                    </ul>
                </div>
                <div
                    class="relative -mb-px aspect-335/376 w-full shrink-0 overflow-hidden rounded-t-lg bg-[#fff2f2] lg:mb-0 lg:-ml-px lg:aspect-auto lg:w-[438px] lg:rounded-t-none lg:rounded-r-lg dark:bg-[#1D0002] flex items-center justify-center"
                >
                    <svg
                        class="w-64 h-64 translate-y-0 opacity-100 transition-all duration-750 starting:translate-y-6 starting:opacity-0"
                        version="1.2" 
                        xmlns="http://www.w3.org/2000/svg" 
                        viewBox="0 0 833 833"
                    >
                        <style>
                            .s0 { fill: none;stroke: #212121;stroke-linecap: round;stroke-linejoin: round;stroke-width: 41.7 } 
                        </style>
                        <g id="SVGRepo_bgCarrier">
                        </g>
                        <g id="SVGRepo_tracerCarrier">
                        </g>
                        <g id="SVGRepo_iconCarrier">
                            <g id="页面-1">
                                <g id="导航图标">
                                    <g id="会议">
                                        <g id="编组">
                                            <path id="路径" fill-rule="evenodd" class="s0" d="m152.78 248.61c0-14.57 11.81-26.39 26.39-26.39h369.44c14.58 0 26.39 11.82 26.39 26.39v118.75l105.56-79.17v303.48l-105.56-79.17v105.56c0 14.57-11.81 26.38-26.39 26.38h-369.44c-14.58 0-26.39-11.81-26.39-26.38z"/>
                                            <path id="路径" fill-rule="evenodd" class="s0" d="m231.94 327.78v52.78"/>
                                            <path id="路径" fill-rule="evenodd" class="s0" d="m297.92 301.39v105.55"/>
                                            <path id="路径" fill-rule="evenodd" class="s0" d="m363.89 327.78v52.78"/>
                                        </g>
                                    </g>
                                </g>
                            </g>
                        </g>
                    </svg>
                    <div
                        class="absolute inset-0 rounded-t-lg shadow-[inset_0px_0px_0px_1px_rgba(26,26,0,0.16)] lg:overflow-hidden lg:rounded-t-none lg:rounded-r-lg dark:shadow-[inset_0px_0px_0px_1px_#fffaed2d]"
                    />
                </div>
            </main>
        </div>
        <div class="hidden h-14.5 lg:block"></div>
    </div>
</template>
