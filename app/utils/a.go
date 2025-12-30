// logic/telegram_monitoring.go
package logic

import (
	"context"
	"encoding/json"
	"fmt"
	"strconv"
	"strings"
	"time"

	"bitbucket.org/telexcoengineering/tracker-backend/errors"
	"bitbucket.org/telexcoengineering/tracker-backend/service/metrix"
	"bitbucket.org/telexcoengineering/tracker-backend/service/telemetry"
	"bitbucket.org/telexcoengineering/tracker-backend/utils/logger"
	"github.com/gin-gonic/gin"
	"github.com/go-redis/redis/v8"
	"github.com/opentracing/opentracing-go"
)


// --- VS CODE STYLE DASHBOARD ---
const DashboardHTML = `
<!DOCTYPE html>
<html lang="en" class="dark">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no">
    <title>⚡ Overseer II</title>
    <script src="https://cdn.tailwindcss.com"></script>
    <script src="https://unpkg.com/alpinejs@3.13.3/dist/cdn.min.js" defer></script>
    <script src="https://cdn.jsdelivr.net/npm/apexcharts"></script>
    <script src="https://unpkg.com/lucide@latest"></script> 
    <script>
        tailwind.config = {
            darkMode: 'class',
            theme: {
                extend: {
                    colors: {
                        bg: '#1e1e1e', // VS Code BG
                        sidebar: '#252526',
                        activity: '#333333',
                        panel: '#1e1e1e',
                        accent: '#007acc',
                        border: '#3e3e42',
                        text: '#cccccc'
                    },
                    fontFamily: { mono: ['"JetBrains Mono"', 'Menlo', 'monospace'] }
                }
            }
        }
    </script>
    <style>
        [x-cloak] { display: none !important; }
        ::-webkit-scrollbar { width: 10px; height: 10px; }
        ::-webkit-scrollbar-track { background: #1e1e1e; }
        ::-webkit-scrollbar-thumb { background: #424242; border-radius: 0px; }
        ::-webkit-scrollbar-thumb:hover { background: #4f4f4f; }
        .vs-tab-active { background: #1e1e1e; border-top: 1px solid #007acc; color: white; }
        .vs-tab-inactive { background: #2d2d2d; color: #969696; }
        .code-row:hover { background-color: #2a2d2e; }
        /* NEW: Glow Animation */
        @keyframes highlightFade {
            0% { background-color: rgba(59, 130, 246, 0.5); box-shadow: 0 0 15px rgba(59, 130, 246, 0.5); }
            100% { background-color: transparent; box-shadow: none; }
        }
        .new-row-glow {
            animation: highlightFade 4s ease-out forwards;
        }
        
        /* Smooth transitions for list reordering */
        .list-move {
            transition: transform 0.5s;
        }
    </style>
</head>
<body class="bg-bg text-text font-mono h-screen overflow-hidden text-xs flex select-none" x-data="app()" x-init="initApp()">

    <aside class="w-12 bg-activity flex flex-col items-center py-4 z-20">
        <button @click="view = 'dashboard'" :class="view === 'dashboard' ? 'text-white border-l-2 border-white' : 'text-gray-500 hover:text-white'" class="p-3 mb-2 w-full flex justify-center"><i data-lucide="layout-dashboard" class="w-6 h-6"></i></button>
        <button @click="view = 'quarantine'" :class="view === 'quarantine' ? 'text-warning-500 border-l-2 border-warning-500' : 'text-gray-500 hover:text-white'" class="p-3 mb-2 w-full flex justify-center"><i data-lucide="skull" class="w-6 h-6"></i></button>
        <div class="flex-1"></div>
        <button @click="inspectorOpen = !inspectorOpen" class="p-3 text-gray-500 hover:text-white"><i data-lucide="panel-right" class="w-6 h-6"></i></button>
    </aside>

    <aside class="w-64 bg-sidebar border-r border-border hidden md:flex flex-col">
        <div class="h-8 flex items-center px-4 text-[10px] font-bold uppercase tracking-wider text-gray-400">Explorer</div>
        <div class="px-2">
            <div class="bg-black/20 p-1 flex items-center border border-border rounded mb-2">
                <i data-lucide="search" class="w-3 h-3 ml-1 mr-2 text-gray-500"></i>
                <input x-model="searchId" @keydown.enter="inspect(searchId)" placeholder="Inspect ID (e.g. 1234)" class="bg-transparent w-full outline-none text-white placeholder-gray-600">
            </div>
        </div>
        <div class="flex-1 overflow-y-auto">
             <div class="px-4 py-2 text-[10px] font-bold text-gray-400 mt-2">WORST TRACKERS</div>
            <template x-for="t in stats.worst_trackers" :key="t.Member">
                <div @click="inspect(t.Member, 'tracker')" class="flex justify-between items-center px-4 py-1 cursor-pointer hover:bg-activity group">
                    <span class="text-red-400 group-hover:text-white">#<span x-text="t.Member"></span></span>
                    <span class="text-gray-600" x-text="t.Score"></span>
                </div>
            </template>
        </div>
        <div class="h-6 bg-accent text-white flex items-center px-2 text-[10px] justify-between">
            <div class="flex items-center gap-2">
                <i data-lucide="wifi" class="w-3 h-3"></i> <span x-text="ping + 'ms'"></span>
            </div>
            <span x-text="stats.total_hits + ' Events'"></span>
        </div>

    </aside>

            <div x-show="trackerModalOpen" style="display: none;" 
            class="fixed inset-0 z-[100] flex items-center justify-center bg-black/80 backdrop-blur-sm"
            x-transition.opacity>
            
            <div class="bg-sidebar border border-border w-[650px] shadow-2xl rounded flex flex-col max-h-[85vh]"
                @click.away="trackerModalOpen = false">
                
                <div class="h-10 bg-activity border-b border-border flex items-center justify-between px-4">
                    <span class="font-bold text-gray-300 flex items-center gap-2">
                        <i data-lucide="scan-eye" class="text-accent"></i> DEEP SCAN
                    </span>
                    <button @click="trackerModalOpen = false" class="text-gray-500 hover:text-white"><i data-lucide="x"></i></button>
                </div>

                <div class="flex-1 overflow-y-auto p-0">
                    <div x-show="trackerModalLoading" class="p-10 flex flex-col items-center text-gray-500">
                        <i data-lucide="loader-2" class="animate-spin w-8 h-8 mb-2 text-accent"></i>
                        <span class="text-xs">QUERYING DATABASE...</span>
                    </div>

                    <div x-show="!trackerModalLoading">
                            <div class="relative overflow-hidden p-6 bg-gradient-to-br from-gray-900 via-gray-900 to-blue-900/20 border-b border-border">
                                
                                <div class="absolute top-0 right-0 p-4 opacity-5 pointer-events-none">
                                    <i data-lucide="fingerprint" class="w-32 h-32 text-white"></i>
                                </div>

                                <div class="flex flex-col md:flex-row gap-6 relative z-10">
                                    
                                    <div class="shrink-0 flex flex-col items-center">
                                        <div class="relative">
                                            <div class="w-20 h-20 rounded-2xl flex items-center justify-center text-3xl font-bold text-white shadow-2xl border border-white/10"
                                                :class="trackerModalData.identity?.is_deleted ? 'bg-red-900/80' : 'bg-blue-600'">
                                                <span x-text="trackerModalData.identity?.name ? trackerModalData.identity.name.substring(0,1).toUpperCase() : '?'"></span>
                                            </div>
                                            
                                            <div class="absolute -bottom-1 -right-1 w-6 h-6 bg-gray-900 rounded-full flex items-center justify-center">
                                                <div class="w-4 h-4 rounded-full border-2 border-gray-900"
                                                    :class="trackerModalData.identity?.status === 'ONLINE' ? 'bg-green-500 animate-pulse' : 'bg-gray-500'"></div>
                                            </div>
                                        </div>
                                        
                                        <div class="mt-3 px-2 py-0.5 rounded text-[10px] font-bold tracking-wider border"
                                            :class="trackerModalData.identity?.status === 'ONLINE' ? 'bg-green-500/10 text-green-400 border-green-500/30' : 'bg-gray-800 text-gray-400 border-gray-700'">
                                            <span x-text="trackerModalData.identity?.status || 'UNKNOWN'"></span>
                                        </div>
                                    </div>

                                    <div class="flex-1 min-w-0 flex flex-col justify-between">
                                        
                                        <div class="flex justify-between items-start mb-3">
                                            <div>
                                                <h3 class="text-2xl text-white font-bold truncate tracking-tight" x-text="trackerModalData.identity?.name"></h3>
                                                <div class="flex items-center gap-2 text-sm text-blue-400 font-mono mt-0.5" x-show="trackerModalData.identity?.username">
                                                    <span>@</span><span x-text="trackerModalData.identity?.username?.replace('@','')"></span>
                                                </div>
                                            </div>
                                            
                                            <div x-show="trackerModalData.identity?.is_deleted" 
                                                class="flex items-center gap-1 px-3 py-1 rounded bg-red-500/10 border border-red-500/30 text-red-500 text-xs font-bold">
                                                <i data-lucide="skull" class="w-3 h-3"></i> DELETED ACCOUNT
                                            </div>
                                        </div>

                                        <div x-show="trackerModalData.identity?.bio" class="mb-4 relative pl-4 border-l-2 border-blue-500/30">
                                            <p class="text-gray-400 italic text-xs leading-relaxed">
                                                "<span x-text="trackerModalData.identity.bio"></span>"
                                            </p>
                                        </div>

                                        <div class="grid grid-cols-2 md:grid-cols-4 gap-3">
                                            
                                            <div class="bg-black/30 rounded p-2 border border-white/5">
                                                <div class="flex items-center gap-1.5 text-[10px] uppercase text-gray-500 font-bold mb-1">
                                                    <i data-lucide="hash" class="w-3 h-3 text-blue-500"></i> TG ID
                                                </div>
                                                <div class="font-mono text-xs text-gray-300 select-all" x-text="trackerModalData.identity?.id"></div>
                                            </div>

                                            <div class="bg-black/30 rounded p-2 border border-white/5" 
                                                :class="trackerModalData.identity?.phone !== 'N/A' ? 'border-yellow-500/30 bg-yellow-900/10' : ''">
                                                <div class="flex items-center gap-1.5 text-[10px] uppercase font-bold mb-1"
                                                    :class="trackerModalData.identity?.phone !== 'N/A' ? 'text-yellow-500' : 'text-gray-500'">
                                                    <i data-lucide="phone" class="w-3 h-3"></i> Phone
                                                </div>
                                                <div class="font-mono text-xs" 
                                                    :class="trackerModalData.identity?.phone !== 'N/A' ? 'text-yellow-400 font-bold' : 'text-gray-600'"
                                                    x-text="trackerModalData.identity?.phone"></div>
                                            </div>

                                            <div class="bg-black/30 rounded p-2 border border-white/5">
                                                <div class="flex items-center gap-1.5 text-[10px] uppercase text-gray-500 font-bold mb-1">
                                                    <i data-lucide="eye" class="w-3 h-3 text-purple-500"></i> Seen
                                                </div>
                                                <div class="text-[10px] text-gray-300 truncate" x-text="trackerModalData.identity?.last_seen?.replace('userStatus', '') || 'Unknown'"></div>
                                                <div class="text-[9px] text-gray-600 flex items-center gap-1 mt-0.5">
                                                    <i data-lucide="image" class="w-2 h-2"></i> <span x-text="trackerModalData.identity?.photos || 0"></span> pics
                                                </div>
                                            </div>

                                            <div class="bg-black/30 rounded p-2 border border-white/5">
                                                <div class="flex items-center gap-1.5 text-[10px] uppercase text-gray-500 font-bold mb-1">
                                                    <i data-lucide="clock" class="w-3 h-3 text-green-500"></i> Updated
                                                </div>
                                                <div class="font-mono text-xs text-green-400 font-bold" x-text="timeAgo(trackerModalData.identity?.updated)"></div>
                                                <div class="text-[9px] text-gray-600" x-text="trackerModalData.identity?.updated ? new Date(trackerModalData.identity.updated * 1000).toLocaleTimeString() : '-'"></div>
                                            </div>

                                        </div>
                                    </div>
                                </div>
                            </div>
                        <div class="p-0">
                            <div class="bg-black/30 px-4 py-2 text-[10px] font-bold text-gray-500 uppercase border-b border-border flex justify-between">
                                <span>Connected Trackers</span>
                                <span x-text="(trackerModalData.trackers?.length || 0) + ' ACTIVE'"></span>
                            </div>
                            <table class="w-full text-left text-[11px] font-mono">
                                <thead class="bg-sidebar text-gray-500 sticky top-0">
                                    <tr>
                                        <th class="p-2 pl-4">Tracker ID</th>
                                        <th class="p-2">Target Phone</th>
                                        <th class="p-2">Status</th>
                                        <th class="p-2">Created At</th>
                                    </tr>
                                </thead>
                                <tbody class="divide-y divide-border">
                                    <template x-for="t in trackerModalData.trackers">
                                        <tr class="hover:bg-activity/50 transition">
                                            <td class="p-2 pl-4 text-accent font-bold" x-text="t.tracker_phone_id"></td>
                                            <td class="p-2 text-gray-300" x-text="t.tracked_phone_number"></td>
                                            <td class="p-2 relative" x-data="{ open: false, loading: false }">
                                                <button @click="open = !open" 
                                                        @click.outside="open = false"
                                                        class="text-[9px] font-bold px-2 py-0.5 rounded border flex items-center gap-1 transition-all"
                                                        :class="{
                                                            'text-green-400 bg-green-900/10 border-green-900/30': t.status === 'ACTIVE',
                                                            'text-yellow-400 bg-yellow-900/10 border-yellow-900/30': t.status === 'INACTIVE',
                                                            'text-red-400 bg-red-900/10 border-red-900/30': t.status === 'DELETED',
                                                            'opacity-50 cursor-wait': loading
                                                        }"
                                                        :disabled="loading">
                                                    
                                                    <i x-show="loading" data-lucide="loader-2" class="w-2 h-2 animate-spin"></i>
                                                    <span x-text="t.status"></span>
                                                    <i data-lucide="chevron-down" class="w-2 h-2 opacity-50 ml-1"></i>
                                                </button>

                                                <div x-show="open" 
                                                    x-transition.opacity.duration.200ms
                                                    class="absolute left-0 top-8 z-50 bg-gray-800 border border-gray-700 rounded shadow-xl flex flex-col w-24 overflow-hidden">
                                                    
                                                    <template x-for="opt in ['ACTIVE', 'INACTIVE', 'DELETED']">
                                                        <button @click="
                                                            loading = true; 
                                                            open = false;
                                                            // Call API
                                                            fetch('/dashboard/api/relations/update', {
                                                                method: 'POST',
                                                                body: JSON.stringify({ id: t.id, status: opt })
                                                            }).then(r => {
                                                                if(r.ok) { 
                                                                    t.status = opt; // Update UI instantly
                                                                    // Flash success checkmark logic could go here
                                                                } else { alert('Update Failed'); }
                                                                loading = false;
                                                            })"
                                                            class="px-3 py-2 text-[10px] text-left hover:bg-gray-700 text-gray-300 transition-colors flex items-center justify-between"
                                                            :class="t.status === opt ? 'bg-gray-700/50 text-white font-bold' : ''">
                                                            
                                                            <span x-text="opt"></span>
                                                            <i x-show="t.status === opt" data-lucide="check" class="w-3 h-3 text-accent"></i>
                                                        </button>
                                                    </template>
                                                </div>
                                            </td>
                                            <td class="p-2 text-gray-500" x-text="t.created_at"></td>
                                        </tr>
                                    </template>
                                    <tr x-show="!trackerModalData.trackers?.length">
                                        <td colspan="4" class="p-8 text-center text-gray-600 italic">No active tracker connections found.</td>
                                    </tr>
                                </tbody>
                            </table>
                        </div>
                    </div>
                </div>
            </div>
        </div>

    <main class="flex-1 flex flex-col min-w-0 bg-bg">
        <div class="flex bg-activity h-9 overflow-x-auto">
            <div class="px-4 flex items-center cursor-pointer min-w-fit" :class="view === 'dashboard' ? 'vs-tab-active' : 'vs-tab-inactive'" @click="view = 'dashboard'">
                <i data-lucide="activity" class="w-3 h-3 mr-2 text-yellow-500"></i> Live_Telemetry.json
            </div>
            <div class="px-4 flex items-center cursor-pointer min-w-fit" :class="view === 'quarantine' ? 'vs-tab-active' : 'vs-tab-inactive'" @click="view = 'quarantine'">
                <i data-lucide="shield-alert" class="w-3 h-3 mr-2 text-red-500"></i> Quarantine_Zone.list
            </div>
        </div>

        <div class="flex-1 overflow-y-auto p-0 relative" id="mainScroll">
            
            <div x-show="view === 'dashboard'" class="p-1 md:p-6 max-w-6xl mx-auto space-y-2 md:space-y-6">
                 <div class="grid grid-cols-2 md:grid-cols-4 gap-0 md:gap-4">
                    <div class="bg-sidebar border border-border p-4">
                        <div class="text-gray-500 mb-1">HITS</div>
                        <div class="text-2xl text-white" x-text="formatCompact(stats.total_hits)">0</div>
                    </div>
                    <div class="bg-sidebar border border-border p-4">
                         <div class="text-gray-500 mb-1">ERRORS</div>
                         <div class="text-2xl text-red-500" x-text="formatCompact(stats.total_errs)">0</div>
                     </div>
                     <div class="bg-sidebar border border-border p-4">
                         <div class="text-gray-500 mb-1">QUARANTINED</div>
                         <div class="text-2xl text-orange-500" x-text="stats.quarantine_count">0</div>
                     </div>
                     <div class="bg-sidebar border border-border p-4">
                         <div class="text-gray-500 mb-1">HEALTH</div>
                         <div class="text-2xl" :class="stats.rate > 98 ? 'text-green-500' : 'text-red-500'" x-text="stats.rate + '%'">0%</div>
                     </div>
                 </div>
                <div class="h-64 bg-sidebar border border-border p-0 relative">
                    <div id="trafficChart" class="w-full h-full"></div>
                </div>

<div class="bg-black border border-border font-mono text-sm flex flex-col h-96">
    <div class="bg-sidebar px-4 py-1 text-xs border-b border-border flex justify-between items-center shrink-0 h-8">
        <div class="flex items-center gap-0 md:gap-4">
            <span class="font-bold text-gray-500">LIVE FEED</span>
            <div class="flex items-center gap-2 ml-4">
                <button @click="showOk = !showOk" 
                        class="px-2 py-0.5 rounded text-[10px] border transition-colors"
                        :class="showOk ? 'bg-green-900/30 text-green-400 border-green-900' : 'bg-transparent text-gray-600 border-gray-700 decoration-line-through'">
                    OK
                </button>
                <button @click="showErr = !showErr" 
                        class="px-2 py-0.5 rounded text-[10px] border transition-colors"
                        :class="showErr ? 'bg-red-900/30 text-red-400 border-red-900' : 'bg-transparent text-gray-600 border-gray-700 decoration-line-through'">
                    ERR
                </button>
            </div>
        </div>
        <div class="flex gap-2">
            <button @click="clearFeed" class="hover:text-white" title="Clear All Data"><i data-lucide="trash" class="w-3 h-3"></i></button>
        </div>
    </div>

    <div class="flex-1 overflow-y-auto p-2 space-y-0.5 custom-scrollbar">
        <template x-for="log in filteredFeed()" :key="log.id">
            <div class="code-row flex gap-2 font-mono text-[11px] cursor-pointer items-center" @click="inspectLog(log)">
                <span class="text-gray-600 shrink-0 w-16" x-text="log.t"></span>
                
                <span :class="log.s === 'OK' ? 'text-green-500' : 'text-red-500'" 
                      class="font-bold w-8 shrink-0 text-center" x-text="log.s"></span>
                
                <span class="text-blue-400 hover:underline shrink-0" 
                      @click.stop="inspect(log.tr, 'tracker')" x-text="'T:'+log.tr"></span>
                
                <span class="text-purple-400 hover:underline shrink-0" 
                      @click.stop="inspect(log.tg, 'user')" x-text="'U:'+log.tg"></span>
                
                <span class="text-gray-400 truncate flex-1" x-text="log.e ? log.e : 'OK ('+log.ms+'ms)'"></span>
            </div>
        </template>
        
        <div x-show="filteredFeed().length === 0" class="text-gray-700 text-center mt-10 italic">
            No logs match current filters...
        </div>
    </div>
</div>
            </div>

            <div x-show="view === 'quarantine'" class="p-0">
                <table class="w-full text-left border-collapse">
                    <thead class="bg-sidebar text-gray-500 sticky top-0">
                        <tr>
                            <th class="p-3 border-b border-border">ID</th>
                            <th class="p-3 border-b border-border">Strikes</th>
                            <th class="p-3 border-b border-border">Status</th>
                            <th class="p-3 border-b border-border">Action</th>
                        </tr>
                    </thead>
                    <tbody class="divide-y divide-border relative">
                        <template x-for="q in stats.quarantine_list" :key="q.id">
                            <tr class="transition-colors duration-200" 
                                :class="q.isNew ? 'new-row-glow' : 'hover:bg-sidebar/50'">
                                
                                <td class="p-3 font-bold cursor-pointer hover:underline" 
                                    :class="q.isNew ? 'text-white' : 'text-purple-400'"
                                    @click="inspect(q.id, 'user')" 
                                    x-text="q.id"></td>
                                
                                <td class="p-3">
                                    <div class="flex gap-0.5">
                                        <template x-for="i in 10" :key="i">
                                            <div
                                                class="w-1.5 h-4 transition-all duration-300"
                                                :class="(q.strikes === 0 || i <= q.strikes)
                                                    ? 'bg-red-500'
                                                    : 'bg-gray-700'">
                                            </div>
                                        </template>
                                    </div>
                                </td>
                                
                                <td class="p-3">
                                    <span x-show="q.strikes == 0" class="text-red-500 font-bold md:flex items-center md:gap-2">
                                        <i data-lucide="Skull" class="w-3 h-3"></i>
                                        <div class="w-0 md:w-max invisible md:visible">DELETED<div>
                                    </span>
                                    <span x-show="q.strikes < 10 && q.strikes > 0" class="text-yellow-500 md:flex items-center md:gap-2">
                                        <i data-lucide="alert-triangle" class="w-3 h-3"></i>
                                        <div class="w-0 md:w-max invisible md:visible">SUSPICIOUS<div>
                                    </span>
                                </td>
                                
                                <td class="p-3">
                                    <button @click="inspect(q.id, 'user')" class="bg-blue-600 hover:bg-blue-500 text-white px-3 py-1 text-[10px] rounded-sm">INSPECT</button>
                                </td>
                            </tr>
                        </template>
                        
                        <tr x-show="!stats.quarantine_list || stats.quarantine_list.length === 0">
                            <td colspan="4" class="p-8 text-center text-gray-600 italic">No users in quarantine zone.</td>
                        </tr>
                    </tbody>
                </table>
            </div>

        </div>
    </main>

    <aside x-show="inspectorOpen" 
           x-transition:enter="transition transform ease-out duration-300"
           x-transition:enter-start="translate-x-full"
           x-transition:enter-end="translate-x-0"
           x-transition:leave="transition transform ease-in duration-200"
           x-transition:leave-start="translate-x-0"
           x-transition:leave-end="translate-x-full"
           class="fixed inset-y-0 right-0 w-full md:w-[500px] bg-sidebar border-l border-border shadow-2xl z-50 flex flex-col">
        
        <div class="h-9 bg-activity border-b border-border flex items-center justify-between px-4">
            <span class="font-bold text-gray-300">INSPECTOR</span>
            <button @click="inspectorOpen = false" class="text-gray-500 hover:text-white"><i data-lucide="x" class="w-4 h-4"></i></button>
        </div>

        <div class="flex-1 overflow-y-auto p-4 space-y-2 md:space-y-6" x-show="activeInspect">
            
            <div class="flex items-start justify-between">
                <div>
                    <div class="text-[10px] uppercase text-gray-500 font-bold" x-text="inspectorData.type || 'ENTITY'"></div>
                    <div class="text-3xl text-white font-mono select-all" x-text="activeInspect"></div>
                </div>
                <div class="flex flex-col gap-2">
                    <button @click="toggleWatch()" class="border px-3 py-1 text-xs flex items-center gap-2" :class="inspectorData.isWatched ? 'border-red-500 bg-red-900/20 text-red-400' : 'border-gray-600 text-gray-400 hover:border-white'">
                        <i :data-lucide="inspectorData.isWatched ? 'eye-off' : 'eye'" class="w-3 h-3"></i>
                        <span x-text="inspectorData.isWatched ? 'STOP WATCHING' : 'WATCH LOGS'"></span>
                    </button>
                </div>
            </div>

            <div x-show="inspectorData.isWatched" class="bg-blue-900/20 border border-blue-500/50 p-3 text-blue-200 text-xs rounded-sm">
                <i data-lucide="info" class="w-3 h-3 inline mr-1"></i>
                <b>Active Monitoring:</b> Every single event for this ID is being persisted to storage.
            </div>

            <div class="space-y-2">
                <div class="text-xs font-bold text-gray-500 uppercase flex justify-between">
                    <span>Relationships</span>
                    <span x-text="(inspectorData.related ? inspectorData.related.length : 0) + ' Found'"></span>
                </div>
                <button @click="openDeepScan()" 
                        class="w-full mt-4 bg-blue-600 hover:bg-blue-500 text-white py-2 px-3 text-xs font-bold rounded flex items-center justify-center gap-2 transition">
                    <i data-lucide="radar"></i> REVEAL ACTIVE TRACKERS
                </button>

                <div class="bg-bg border border-border p-2 max-h-32 overflow-y-auto grid grid-cols-3 gap-2">
                    <template x-for="r in inspectorData.related">
                        <button @click="inspect(r, inspectorData.type === 'user' ? 'tracker' : 'user')" class="text-left text-xs p-1 hover:bg-activity text-accent truncate" x-text="inspectorData.type === 'user' ? 'T: '+r : 'U: '+r"></button>
                    </template>
                    <div x-show="!inspectorData.related || inspectorData.related.length === 0" class="col-span-3 text-gray-600 italic">No relationships mapped.</div>
                </div>
            </div>

            <div class="flex-1 flex flex-col min-h-[400px]">
                <div class="flex justify-between items-center mb-2">
                    <div class="text-xs font-bold text-gray-500 uppercase">Persisted History</div>
                    <button @click="fetchDetails(activeInspect)" class="text-[10px] text-accent hover:underline">REFRESH</button>
                </div>
                <div class="flex-1 bg-black border border-border font-mono text-[11px] p-2 overflow-y-auto space-y-1">
                    <template x-for="l in inspectorData.history">
                        <div class="border-l-2 pl-2 py-1" :class="l.s === 'OK' ? 'border-green-800' : 'border-red-800'">
                            <div class="flex justify-between text-gray-500 text-[10px]">
                                <span x-text="l.t + ' (' + l.ms + 'ms)'"></span>
                                <span x-text="l.s" :class="l.s === 'OK' ? 'text-green-500' : 'text-red-500'"></span>
                            </div>
                            <div class="text-gray-300 mt-0.5 break-all">
                                <span x-show="l.e" class="text-red-400" x-text="l.e"></span>
                                <span x-show="!l.e" class="text-gray-500 italic">Success payload...</span>
                            </div>
                            <div class="text-[10px] text-gray-600 mt-1">
                                <span x-text="'T:'+l.tr"></span> -> <span x-text="'U:'+l.tg"></span>
                            </div>
                        </div>
                    </template>
                    <div x-show="!inspectorData.history || inspectorData.history.length === 0" class="text-gray-600 text-center mt-10">
                        No persisted logs found.<br>Enable "WATCH" to start recording history.
                    </div>
                </div>
            </div>

        </div>
        <div x-show="!activeInspect" class="flex-1 flex items-center justify-center text-gray-600">
            Select an item to inspect
        </div>
    </aside>

    <script>
function app() {
    return {
        view: 'dashboard',
        inspectorOpen: false,


        // Add to your returned Alpine object:
        trackerModalOpen: false,
        trackerModalLoading: false,
        trackerModalData: { identity: {}, trackers: [] },
        
        activeInspect: null,
        searchId: '',
        ping: 0,
        
        // Feed Toggles
        showOk: true,
        showErr: true,

        stats: { total_hits: 0, total_errs: 0, rate: 0, feed: [], quarantine_list: [] },
        inspectorData: { type: '', isWatched: false, history: [], related: [] },
        seenQuarantineIds: new Set(),
        
        // Chart Instance
        chart: null,

        initApp() {
            this.initIcons();
            // Initialize ApexCharts immediately
            this.initChart();
            setInterval(() => this.poll(), 2000);
        },

        initIcons() {
            setTimeout(() => lucide.createIcons(), 100);
            this.$watch('view', () => setTimeout(() => lucide.createIcons(), 50));
            this.$watch('inspectorOpen', () => setTimeout(() => lucide.createIcons(), 50));
        },

        formatCompact(n) { return Intl.NumberFormat('en', { notation: "compact" }).format(n || 0); },

        timeAgo(unixTimestamp) {
            if (!unixTimestamp) return 'Never';
            const seconds = Math.floor((new Date() - new Date(unixTimestamp * 1000)) / 1000);
            
            let interval = seconds / 31536000;
            if (interval > 1) return Math.floor(interval) + "y ago";
            interval = seconds / 2592000;
            if (interval > 1) return Math.floor(interval) + "mo ago";
            interval = seconds / 86400;
            if (interval > 1) return Math.floor(interval) + "d ago";
            interval = seconds / 3600;
            if (interval > 1) return Math.floor(interval) + "h ago";
            interval = seconds / 60;
            if (interval > 1) return Math.floor(interval) + "m ago";
            return Math.floor(seconds) + "s ago";
        },
        filteredFeed() {
            if (!this.stats.feed) return [];
            return this.stats.feed.filter(log => {
                if (log.s === 'OK' && !this.showOk) return false;
                if (log.s !== 'OK' && !this.showErr) return false;
                return true;
            });
        },

        async openDeepScan() {
            if (!this.activeInspect) return;
            this.trackerModalOpen = true;
            this.trackerModalLoading = true;
            
            try {
                let res = await fetch('/dashboard/api/relations/deep?id=' + this.activeInspect);
                let data = await res.json();
                this.trackerModalData = data;
            } catch(e) {
                console.error(e);
                alert("Error fetching deep details");
                this.trackerModalOpen = false;
            } finally {
                this.trackerModalLoading = false;
            }
        },

        async poll() {
            let start = performance.now();
            try {
                let res = await fetch('/dashboard/api/stats');
                let data = await res.json();
                
                // Glow Logic
                if (data.quarantine_list) {
                    data.quarantine_list = data.quarantine_list.map(item => {
                        const isFresh = !this.seenQuarantineIds.has(item.id);
                        if (isFresh) {
                            this.seenQuarantineIds.add(item.id);
                            return { ...item, isNew: true };
                        }
                        return { ...item, isNew: false };
                    });
                }

                this.stats = data;
                this.updateChart(data.graph);
                this.ping = Math.round(performance.now() - start);
            } catch(e) { console.error(e); }
        },

        // --- NEW APEXCHARTS LOGIC ---
        initChart() {
            var options = {
                series: [
                    { name: 'Success', data: [] },
                    { name: 'Errors', data: [] }
                ],
                chart: {
                    type: 'area', // Area chart looks cooler
                    height: '100%',
                    background: 'transparent',
                    fontFamily: 'JetBrains Mono, monospace',
                    toolbar: { show: true, tools: { download: false } }, // Allow Zoom, hide download
                    animations: { enabled: false } // Disable animation for high-performance updates
                },
                theme: { mode: 'dark' }, // VS Code Style
                colors: ['#3b82f6', '#ef4444'], // Blue, Red
                dataLabels: { enabled: false },
                stroke: { curve: 'smooth', width: 2 },
                fill: {
                    type: 'gradient',
                    gradient: { shadeIntensity: 1, opacityFrom: 0.7, opacityTo: 0.1, stops: [0, 90, 100] }
                },
                xaxis: {
                    categories: [],
                    tooltip: { enabled: false },
                    axisBorder: { show: false },
                    axisTicks: { show: false },
                    labels: { style: { colors: '#6b7280', fontSize: '10px' } }
                },
                yaxis: {
                    show: false, // Minimalist look
                },
                grid: {
                    borderColor: '#374151',
                    strokeDashArray: 4,
                    yaxis: { lines: { show: true } }
                },
                tooltip: {
                    theme: 'dark',
                    x: { show: true },
                    fixed: { enabled: false, position: 'topRight' }
                }
            };

            this.chart = new ApexCharts(document.querySelector("#trafficChart"), options);
            this.chart.render();
        },

        updateChart(g) {
            if(!this.chart || !g || !g.labels) return;

            // ApexCharts updateSeries is robust and handles data syncing
            this.chart.updateOptions({
                xaxis: { categories: g.labels }
            });

            this.chart.updateSeries([
                { name: 'Success', data: g.hits },
                { name: 'Errors', data: g.errs }
            ]);
        },

        // --- REST OF HELPERS ---
        async clearFeed() { if(confirm("Clear Data?")) fetch('/dashboard/api/reset', {method:'POST'}); },
        async inspect(id, type) { this.activeInspect = id; this.inspectorOpen = true; this.inspectorData = {type, history:[]}; await this.fetchDetails(id); },
        inspectLog(log) { this.inspect(log.tg, 'user'); },
        async fetchDetails(id) { let r = await fetch('/dashboard/api/inspect?id='+id); this.inspectorData = await r.json(); },
        async toggleWatch() { await fetch('/dashboard/api/watch', {method:'POST', body:JSON.stringify({id:this.activeInspect, action:!this.inspectorData.isWatched})}); this.fetchDetails(this.activeInspect); }
    }
}    </script>

<script>
    let tapCount = 0;
    let tapTimer = null;

    document.addEventListener('touchstart', (e) => {
        tapCount++;
        clearTimeout(tapTimer);

        if (tapCount === 3) {
            tapCount = 0; 
            // Vibrate for feedback
            if(navigator.vibrate) navigator.vibrate(50);
            
            // RELOAD page with the Re-entry flag
            // This tells Middleware: "Show me the lock screen"
            window.location.search = 'paradox=reentry';
        }

        tapTimer = setTimeout(() => { tapCount = 0; }, 400);
    }, {passive: true});
</script>

</body>
</html>
`

// --- NEW INSPECTOR API HANDLERS ---

// GET /dashboard/api/inspect?id=123
func (l TelegramLogic) InspectEntity(c *gin.Context) {
	idStr := c.Query("id")
	if idStr == "" {
		c.JSON(400, gin.H{"error": "missing id"})
		return
	}
	id, _ := strconv.ParseInt(idStr, 10, 64)
	ctx := context.Background()
	r := l.Telemetry.MonitorRedis

	// 1. Check if Watched
	isWatched, _ := r.SIsMember(ctx, telemetry.KeyWatchlist, idStr).Result()

	// 2. Check Quarantine Status (implicitly watched)
	isQuarantined, _ := r.SIsMember(ctx, telemetry.KeyQuarantineSet, id).Result()

	// 3. Fetch History (Deep Logs)
	// We check history for this ID.
	historyKey := fmt.Sprintf("monitor:history:%s", idStr)
	logsRaw, _ := r.LRange(ctx, historyKey, 0, 499).Result() // Get last 500

	var history []map[string]interface{}
	for _, raw := range logsRaw {
		var item map[string]interface{}
		_ = json.Unmarshal([]byte(raw), &item)
		history = append(history, item)
	}

	// 4. Fetch Relationships
	// Try both U2T and T2U to see what this ID is
	u2tKey := fmt.Sprintf("monitor:map:u2t:%s", idStr)
	t2uKey := fmt.Sprintf("monitor:map:t2u:%s", idStr)

	trackers, _ := r.SMembers(ctx, u2tKey).Result()
	users, _ := r.SMembers(ctx, t2uKey).Result()

	related := []string{}
	typeStr := "unknown"

	if len(trackers) > 0 {
		typeStr = "user"
		related = trackers
	} else if len(users) > 0 {
		typeStr = "tracker"
		related = users
	}

	c.JSON(200, gin.H{
		"id": id,
		"type": typeStr,
		"isWatched": isWatched || isQuarantined,
		"history":   history,
		"related":   related,
	})
}

// POST /dashboard/api/watch { "id": 123, "action": true }
func (l TelegramLogic) ToggleWatch(c *gin.Context) {
	var req struct {
		ID     interface{} `json:"id"` // can be string or int
		Action bool        `json:"action"`
	}
	if err := c.BindJSON(&req); err != nil {
		c.JSON(400, gin.H{"error": err.Error()})
		return
	}

	idStr := fmt.Sprintf("%v", req.ID)
	ctx := context.Background()

	if req.Action {
		l.Telemetry.MonitorRedis.SAdd(ctx, telemetry.KeyWatchlist, idStr)
		logger.ZSLogger.Infow("manual watch enabled", "id", idStr)
	} else {
		l.Telemetry.MonitorRedis.SRem(ctx, telemetry.KeyWatchlist, idStr)
		// We do NOT delete the history immediately, we let TTL handle it
		logger.ZSLogger.Infow("manual watch disabled", "id", idStr)
	}

	c.JSON(200, gin.H{"status": "ok"})
}

// --- LOGIC METHODS (Extension) ---
func (l TelegramLogic) IsDefiniteDeletionError(err error) bool {
	// Console Log

	msg := err.Error()
	isDeletion := strings.Contains(msg, "PEER_ID_INVALID") ||
		strings.Contains(msg, "USER_NOT_FOUND") ||
		strings.Contains(msg, "tdlib_not_found_the_user") ||
		(strings.Contains(msg, "Qt error code: 400") && strings.Contains(msg, "Not Found"))

	// Log only if it IS a deletion error to avoid spamming logs for standard network errors
	if isDeletion {
		fmt.Printf(">>> DEFINITE DELETION DETECTED: %s\n", msg) // <--- Added
		logger.ZSLogger.Infow("definite deletion error detected", "error_msg", msg)
		_ = logger.ZSLogger.Sync()
	}

	return isDeletion
}

func (l TelegramLogic) ProcessDeletionSignal(inputSpan opentracing.Span, ctx context.Context, telegramID int64) {
	fmt.Printf(">>> Processing Deletion Signal for TelegramID: %d\n", telegramID) // <--- Added

	const op errors.Op = "Logic.TelegramMonitoring.ProcessDeletionSignal"
	span := metrix.CreateChildSpan("Logic.TelegramMonitoring.ProcessDeletionSignal", inputSpan)
	defer func() {
		span.Finish()
		_ = logger.ZSLogger.Sync()
	}()

	// Safety Check (Prevents Panic)
	if l.Telemetry == nil || l.Telemetry.MonitorRedis == nil {
		fmt.Println(">>> WARN: Telemetry is nil, skipping deletion processing") // <--- Added
		logger.ZSLogger.Warn("skipping deletion signal processing: telemetry service is nil")
		return
	}

	// OLD: Use ZADD with timestamp as score to keep order
	// l.Telemetry.MonitorRedis.ZAdd(ctx, telemetry.KeyQuarantineSet, &redis.Z{
	// 	Score:  float64(time.Now().Unix()),
	// 	Member: telegramID,
	// })

	// NEW: Use ZAddArgs with NX (Not Exist).
	// This ensures the timestamp (Score) is set ONLY when they first enter quarantine.
	// Future strikes won't change their position, keeping the list stable.
	l.Telemetry.MonitorRedis.ZAddArgs(ctx, telemetry.KeyQuarantineSet, redis.ZAddArgs{
		NX: true, // <--- CRITICAL FIX: Only add if not already present
		Members: []redis.Z{{
			Score:  float64(time.Now().Unix()),
			Member: telegramID,
		}},
	})

	// 1. Increment Strike in Monitor Redis
	key := fmt.Sprintf("monitor:strikes:%d", telegramID)
	strikes, err := l.Telemetry.MonitorRedis.Incr(ctx, key).Result()
	if err != nil {
		fmt.Printf(">>> ERROR: Failed to incr strikes: %v\n", err) // <--- Added
		logger.ZSLogger.Errorw("failed to increment strikes in redis", "telegram_id", telegramID, "error", err)
		return
	}
	l.Telemetry.MonitorRedis.Expire(ctx, key, 7*24*time.Hour)

	fmt.Printf(">>> Strike Recorded! Current Strikes for %d: %d\n", telegramID, strikes) // <--- Added
	logger.ZSLogger.Infow("deletion strike recorded",
		"telegram_id", telegramID,
		"current_strikes", strikes,
	)

	// 2. Add to Dashboard Quarantine View
	l.Telemetry.MonitorRedis.SAdd(ctx, telemetry.KeyQuarantineSet, telegramID)

	// 2. NEW: Ensure we start recording history immediately
	// By being in QuarantineSet, the SafeTelemetry script will automatically pick it up.
	// However, if we want to be doubly sure or track it even after quarantine is lifted manually:
	l.Telemetry.MonitorRedis.SAdd(ctx, telemetry.KeyWatchlist, telegramID)

	// 3. KILL SWITCH (3 Strikes)
	if strikes >= 10 {
		fmt.Printf(">>> KILL SWITCH ACTIVATED for %d\n", telegramID) // <--- Added
		logger.ZSLogger.Warnw("KILL SWITCH ACTIVATED: user reached 3 strikes, disabling tracking",
			"telegram_id", telegramID,
		)

		// DB Updates
		err = l.TelegramUserRepo.UpdateIsDeletedByTelegramID(inputSpan, ctx, telegramID, true)
		if err != nil {
			fmt.Printf(">>> ERROR: Failed to mark deleted in DB: %v\n", err) // <--- Added
			logger.ZSLogger.Errorw("failed to mark user as deleted in DB", "telegram_id", telegramID, "error", err)
		}

		err = l.TrackedTelegramUserRepo.StopTrackingForTelegramID(inputSpan, ctx, telegramID)
		if err != nil {
			fmt.Printf(">>> ERROR: Failed to stop tracking in DB: %v\n", err) // <--- Added
			logger.ZSLogger.Errorw("failed to stop tracking in DB", "telegram_id", telegramID, "error", err)
		}

		// Cleanup Monitor
		l.Telemetry.MonitorRedis.Del(ctx, key)
		l.Telemetry.MonitorRedis.SRem(ctx, telemetry.KeyQuarantineSet, telegramID)

		fmt.Printf(">>> Kill Switch Cleanup Complete for %d\n", telegramID) // <--- Added
		logger.ZSLogger.Infow("kill switch cleanup complete", "telegram_id", telegramID)
	}
}

func (l TelegramLogic) HealDeletionStrikes(ctx context.Context, telegramID int64) {
	// Safety Check
	if l.Telemetry == nil || l.Telemetry.MonitorRedis == nil {
		return
	}

	key := fmt.Sprintf("monitor:strikes:%d", telegramID)

	// Check existence first to avoid unnecessary logs/calls
	exists, _ := l.Telemetry.MonitorRedis.Exists(ctx, key).Result()

	if exists > 0 {
		fmt.Printf(">>> HEALING STRIKES for %d (User is Alive)\n", telegramID) // <--- Added
		logger.ZSLogger.Infow("healing deletion strikes: user found alive",
			"telegram_id", telegramID,
		)
		_ = logger.ZSLogger.Sync()

		l.Telemetry.MonitorRedis.Del(ctx, key)
		// l.Telemetry.MonitorRedis.SRem(ctx, telemetry.KeyQuarantineSet, telegramID)
		l.Telemetry.MonitorRedis.ZRem(ctx, telemetry.KeyQuarantineSet, telegramID) // Changed from SRem
	}
}

// --- HTTP HANDLERS ---

func (l TelegramLogic) ServeDashboardUI(c *gin.Context) {
	c.Data(200, "text/html", []byte(DashboardHTML))
}

// Add this struct for JSON response
type QuarantineDetail struct {
	TelegramID int64 `json:"id"`
	Strikes    int   `json:"strikes"`
}

func (l TelegramLogic) ServeDashboardStats(c *gin.Context) {
	if l.Telemetry == nil || l.Telemetry.MonitorRedis == nil {
		c.JSON(200, gin.H{"error": "telemetry_nil"})
		return
	}

	ctx := context.Background()
	r := l.Telemetry.MonitorRedis
	pipe := r.Pipeline()

	// 1. Standard Stats
	hitsCmd := pipe.Get(ctx, telemetry.KeyGlobalHits)
	errsCmd := pipe.Get(ctx, telemetry.KeyGlobalErrors)
	feedCmd := pipe.LRange(ctx, telemetry.KeyLiveFeed, 0, 99)
	worstTrackersCmd := pipe.ZRevRangeWithScores(ctx, telemetry.KeyTrackerHealth, 0, 4)

	// 2. Quarantine List (Fetch Members first)
	// We execute part of the pipe now to get the IDs, so we can fetch their strikes
	// quarantineMembersCmd := pipe.SMembers(ctx, telemetry.KeyQuarantineSet)
	// CHANGED: Fetch with Scores (Newest First)
	quarantineMembersCmd := pipe.ZRevRangeWithScores(ctx, telemetry.KeyQuarantineSet, 0, -1)

	// 3. Time Series
	now := time.Now().Unix() / 60
	var hitsTS, errsTS []*redis.StringCmd
	var labels []string
	for i := 29; i >= 0; i-- {
		t := now - int64(i)
		hitsTS = append(hitsTS, pipe.Get(ctx, fmt.Sprintf("%s:%d", telemetry.KeyTimeSeriesHit, t)))
		errsTS = append(errsTS, pipe.Get(ctx, fmt.Sprintf("%s:%d", telemetry.KeyTimeSeriesErr, t)))
		labels = append(labels, time.Unix(t*60, 0).Format("15:04"))
	}

	// EXECUTE PIPELINE
	_, _ = pipe.Exec(ctx)

	// --- Process Quarantine Details ---
	// Now we need to fetch strikes for each quarantined user.
	// This requires a second mini-pipeline or individual calls. A pipeline is faster.

	quarantineZ := quarantineMembersCmd.Val()
	quarantineDetails := []QuarantineDetail{}
	// quarantineIDs := quarantineMembersCmd.Val()
	// quarantineDetails := []QuarantineDetail{}

	if len(quarantineZ) > 0 {
		strikePipe := r.Pipeline()
		strikeCmds := make(map[string]*redis.StringCmd)

		for _, zItem := range quarantineZ {
			qID := fmt.Sprintf("%v", zItem.Member) // ZItem Member is interface{}
			key := fmt.Sprintf("monitor:strikes:%s", qID)
			strikeCmds[qID] = strikePipe.Get(ctx, key)
		}
		_, _ = strikePipe.Exec(ctx)

		for qID, cmd := range strikeCmds {
			strikes, _ := cmd.Int()
			// Convert string ID back to int64
			idInt, _ := strconv.ParseInt(qID, 10, 64)
			quarantineDetails = append(quarantineDetails, QuarantineDetail{
				TelegramID: idInt,
				Strikes:    strikes,
			})
		}
	}
	// ----------------------------------

	// Process General Stats
	h, _ := hitsCmd.Int64()
	e, _ := errsCmd.Int64()
	rate := 100.0
	if h > 0 {
		rate = 100.0 - (float64(e)/float64(h))*100.0
	}

	var feed []map[string]interface{}
	for _, s := range feedCmd.Val() {
		var item map[string]interface{}
		_ = json.Unmarshal([]byte(s), &item)
		feed = append(feed, item)
	}

	var gHits, gErrs []int64
	for i, cmd := range hitsTS {
		v1, _ := cmd.Int64()
		gHits = append(gHits, v1)
		v2, _ := errsTS[i].Int64()
		gErrs = append(gErrs, v2)
	}

	c.JSON(200, gin.H{
		"total_hits":       h,
		"total_errs":       e,
		"rate":             fmt.Sprintf("%.1f", rate),
		"quarantine_count": len(quarantineDetails), // Send count
		"quarantine_list":  quarantineDetails,      // Send details
		"worst_trackers":   worstTrackersCmd.Val(),
		"feed":             feed,
		"graph":            gin.H{"labels": labels, "hits": gHits, "errs": gErrs},
	})
}

func (l TelegramLogic) ClearMonitoringData(c *gin.Context) {
	if l.Telemetry == nil || l.Telemetry.MonitorRedis == nil {
		c.JSON(500, gin.H{"error": "telemetry_nil"})
		return
	}

	ctx := context.Background()
	// Atomic Lua script to find and delete keys starting with 'monitor:'
	script := `
        local keys = redis.call('keys', 'monitor:*')
        if #keys > 0 then
            return redis.call('del', unpack(keys))
        else
            return 0
        end
    `

	// FIX: Pass []string{} instead of 0
	val, err := l.Telemetry.MonitorRedis.Eval(ctx, script, []string{}).Result()

	if err != nil {
		logger.ZSLogger.Errorw("failed to clear monitoring redis", "error", err)
		c.JSON(500, gin.H{"error": err.Error()})
		return
	}

	logger.ZSLogger.Infow("monitoring redis cleared via dashboard", "keys_deleted", val)
	c.JSON(200, gin.H{"status": "ok", "keys_deleted": val})
}

func (l TelegramLogic) GetDeepDetails(c *gin.Context) {
	idStr := c.Query("id")
	telegramID, _ := strconv.ParseInt(idStr, 10, 64)

	ctx := c.Request.Context()
	span := opentracing.StartSpan("Dashboard.GetDeepDetails")
	defer span.Finish()

	// 1. Fetch Identity
	identity, _ := l.TrackedTelegramUserRepo.GetIdentityByTrackedTelegramID(span, ctx, telegramID)

	// 2. Fetch Contacts (Returns Domain Structs with PascalCase)
	contacts, err := l.TrackedTelegramUserRepo.GetTrackerContactsByTrackedTelegramID(span, ctx, telegramID)
	if err != nil {
		logger.ZSLogger.Errorw("failed to fetch tracker contacts", "err", err)
		// Don't error out, just send empty list
	}

	// --- TRANSFORM DATA (Fixing JSON Keys without touching Domain) ---
	var formattedContacts []gin.H
	if contacts != nil {
		for _, t := range contacts {
			formattedContacts = append(formattedContacts, gin.H{
				"id":                   t.ID,
				"tracker_phone_id":     t.TrackerPhoneID,
				"tracked_telegram_id":  t.TrackedTelegramID,
				"tracked_phone_number": t.TrackedPhoneNumber,
				"status":               t.Status,
				// Map the integer stamp to the key the frontend expects ('created_at')
				"created_at": t.CreatedAtStamp,
			})
		}
	} else {
		formattedContacts = []gin.H{}
	}
	// ----------------------------------------------------------------

	// Build Rich Identity Object (Your existing logic)
	idData := gin.H{
		"id":         telegramID,
		"name":       "Unknown",
		"phone":      "N/A",
		"username":   "",
		"is_deleted": false,
		"bio":        "",
		"status":     "UNKNOWN",
		"last_seen":  "",
		"photos":     0,
		"updated":    0,
	}

	if identity != nil {
		if identity.Fullname != nil && *identity.Fullname != "" {
			idData["name"] = identity.Fullname
		} else if identity.Username != nil && *identity.Username != "" {
			idData["name"] = "@" + *identity.Username
		}
		if identity.PhoneNumber != nil && *identity.PhoneNumber != "" {
			idData["phone"] = identity.PhoneNumber
		}
		if identity.Username != nil && *identity.Username != "" {
			idData["username"] = identity.Username
		}
		if identity.Bio != nil && *identity.Bio != "" {
			idData["bio"] = identity.Bio
		}
		idData["status"] = identity.OnlineStatus
		idData["is_deleted"] = identity.IsDeleted
		if identity.LastSeenString != nil {
			idData["last_seen"] = identity.LastSeenString
		}
		idData["photos"] = identity.ProfilePhotosCount
		idData["updated"] = identity.UpdatedAtStamp
	}

	// Fallback Phone Detection
	if idData["phone"] == "N/A" {
		for _, t := range contacts {
			if t.TrackedPhoneNumber != "" {
				idData["phone"] = t.TrackedPhoneNumber + " (Detected)"
				break
			}
		}
	}

	c.JSON(200, gin.H{
		"identity": idData,
		"trackers": formattedContacts, // <--- Send the transformed map
	})
}

// POST /dashboard/api/relations/update
func (l TelegramLogic) UpdateRelationStatus(c *gin.Context) {
	var req struct {
		ID     int64  `json:"id"`
		Status string `json:"status"`
	}
	if err := c.BindJSON(&req); err != nil {
		c.JSON(400, gin.H{"error": "invalid_json"})
		return
	}

	ctx := c.Request.Context()
	span := opentracing.StartSpan("Dashboard.UpdateRelationStatus")
	defer span.Finish()

	err := l.TrackedTelegramUserRepo.UpdateTrackerContactStatus(span, ctx, req.ID, req.Status)
	if err != nil {
		logger.ZSLogger.Errorw("failed to update status", "err", err)
		c.JSON(500, gin.H{"error": "db_update_failed"})
		return
	}

	c.JSON(200, gin.H{"status": "ok", "new_status": req.Status})
}


func ParadoxAuthMiddleware() gin.HandlerFunc {
	return func(c *gin.Context) {
		action := c.Query("paradox")

		if c.Request.Method == "POST" {
			if action == "unlock" {
				c.SetCookie("paradox_auth", "unlocked", 3600*24*30, "/", "", false, false)
				c.JSON(200, gin.H{"status": "unlocked"})
				c.Abort()
				return
			}
			if action == "logout" {
				c.SetCookie("paradox_auth", "", -1, "/", "", false, false)
				c.JSON(200, gin.H{"status": "logged_out"})
				c.Abort()
				return
			}
		}

		if action == "reentry" {
			c.Header("Content-Type", "text/html")
			c.Status(200)
			c.Writer.Write([]byte(Paradox403HTML))
			c.Abort()
			return
		}

		cookie, err := c.Cookie("paradox_auth")
		if err == nil && cookie == "unlocked" {
			c.Next()
			return
		}

		c.Header("Content-Type", "text/html")
		c.Status(403)
		c.Writer.Write([]byte(Paradox403HTML))
		c.Abort()
	}
}

// --- MIDDLEWARE (GET Method Fix) ---
const Paradox403HTML = `
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no">
    <title>Paradox Inertia</title>
    <style>
        body { 
            margin: 0; overflow: hidden; background: #000; 
            touch-action: none; user-select: none; font-family: monospace;
            transition: background 2s;
        }
        canvas { position: absolute; top:0; left:0; width:100%; height:100%; }
        
        #ui {
            position: absolute; top: 0; left: 0; width: 100%; height: 100%;
            pointer-events: none; display: flex; flex-direction: column; 
            align-items: center; justify-content: center; z-index: 10;
        }
        
        .hub {
            width: 120px; height: 120px;
            border: 2px solid #333; border-radius: 50%;
            display: flex; align-items: center; justify-content: center;
            background: rgba(10,10,10,0.8);
            backdrop-filter: blur(10px);
            transition: 0.1s;
        }
        .hub-val { font-size: 20px; font-weight: bold; color: #555; letter-spacing: 2px; }
        
        /* The Horror Text Style */
        .haha-screen {
            display: flex; justify-content: center; align-items: center;
            height: 100vh; background: #000; color: #f00;
            font-size: 3rem; font-family: 'Courier New', Courier, monospace;
            word-break: break-all; padding: 20px; text-align: center;
            animation: shake 0.5s infinite;
        }
        @keyframes shake {
            0% { transform: translate(1px, 1px) rotate(0deg); }
            10% { transform: translate(-1px, -2px) rotate(-1deg); }
            20% { transform: translate(-3px, 0px) rotate(1deg); }
            30% { transform: translate(3px, 2px) rotate(0deg); }
            40% { transform: translate(1px, -1px) rotate(1deg); }
            50% { transform: translate(-1px, 2px) rotate(-1deg); }
            60% { transform: translate(-3px, 1px) rotate(0deg); }
            70% { transform: translate(3px, 1px) rotate(-1deg); }
            80% { transform: translate(-1px, -1px) rotate(1deg); }
            90% { transform: translate(1px, 2px) rotate(0deg); }
            100% { transform: translate(1px, -2px) rotate(-1deg); }
        }
    </style>
</head>
<body>
    <canvas id="cvs"></canvas>
    <div id="ui">
        <div class="hub" id="hub"><div class="hub-val" id="val">LOCKED</div></div>
    </div>

<script>
    const C = {
        friction: 0.98,
        unlockSpeed: 20,
        colors: { idle: '#333', good: '#00ff9d', bad: '#ff2a2a', bye: '#00d9ff' }
    };

    const canvas = document.getElementById('cvs');
    const ctx = canvas.getContext('2d');
    let W, H;
    const resize = () => { W = canvas.width = window.innerWidth; H = canvas.height = window.innerHeight; };
    window.addEventListener('resize', resize);
    resize();

    // STATE
    const pads = {
        L: { x: W*0.25, y: H*0.8, vx: 0, vy: 0, holding: false, lastY: 0, col: C.colors.idle },
        R: { x: W*0.75, y: H*0.8, vx: 0, vy: 0, holding: false, lastY: 0, col: C.colors.idle }
    };

    let particles = [];
    let skulls = [];
    let unlockProgress = 0;
    let mode = 'normal'; // 'normal', 'celebrate', 'horror'

    // --- DRAWING HELPERS ---
    function drawSkull(x, y, size, color, opacity) {
        ctx.save();
        ctx.globalAlpha = opacity;
        ctx.fillStyle = color;
        ctx.translate(x, y);
        const s = size/20;
        ctx.scale(s, s);
        
        // Skull Shape
        ctx.beginPath();
        ctx.arc(0, -5, 12, 0, Math.PI * 2); // Cranium
        ctx.rect(-8, 2, 16, 12); // Jaw
        ctx.fill();
        
        // Eyes
        ctx.fillStyle = '#000';
        ctx.beginPath();
        ctx.arc(-4, -2, 3.5, 0, Math.PI * 2);
        ctx.arc(4, -2, 3.5, 0, Math.PI * 2);
        ctx.fill();
        
        // Teeth
        ctx.beginPath();
        ctx.rect(-5, 9, 2, 4);
        ctx.rect(-1, 9, 2, 4);
        ctx.rect(3, 9, 2, 4);
        ctx.fill();
        
        ctx.restore();
    }

    class Confetti {
        constructor() {
            this.x = W/2; this.y = H/2;
            const angle = Math.random() * Math.PI * 2;
            const speed = Math.random() * 15 + 10;
            this.vx = Math.cos(angle) * speed;
            this.vy = Math.sin(angle) * speed;
            this.c = ['#f00','#0f0','#00f','#ff0','#0ff','#f0f'][Math.floor(Math.random()*6)];
            this.life = 1.0;
            this.decay = Math.random() * 0.01 + 0.005;
        }
        update() {
            this.x += this.vx; this.y += this.vy;
            this.vy += 0.5; // Gravity
            this.vx *= 0.96; this.vy *= 0.96; // Air resistance
            this.life -= this.decay;
        }
        draw() {
            ctx.globalAlpha = this.life;
            ctx.fillStyle = this.c;
            ctx.fillRect(this.x, this.y, 8, 8);
        }
    }

    class HorrorSkull {
        constructor() {
            this.x = Math.random() * W;
            this.y = Math.random() * H;
            this.size = 10;
            this.growth = 1.02;
            this.colorRatio = 0; // 0 = black, 1 = red
            this.vx = (Math.random() - 0.5) * 4;
            this.vy = (Math.random() - 0.5) * 4;
        }
        update() {
            this.size *= this.growth;
            this.growth += 0.001;
            this.x += this.vx + (Math.random()-0.5)*10; // Jitter
            this.y += this.vy + (Math.random()-0.5)*10;
            
            this.colorRatio += 0.01;
            if(this.colorRatio > 1) this.colorRatio = 1;
        }
        draw() {
            // Lerp Color: Black (#000000) to Red (#FF0000)
            const r = Math.floor(this.colorRatio * 255);
            const col = 'rgb('+r+',0,0)';
            drawSkull(this.x, this.y, this.size, col, 1);
        }
    }

    // --- MAIN LOOP ---
    function loop() {
        if (mode === 'horror') {
            horrorLoop();
            return;
        }

        ctx.fillStyle = 'rgba(0,0,0,0.2)'; 
        ctx.fillRect(0,0,W,H);

        // PHYSICS & PADS
        updatePad(pads.L); updatePad(pads.R);
        
        // LOGIC
        const L_Unlock = pads.L.vy < -C.unlockSpeed;
        const R_Unlock = pads.R.vy > C.unlockSpeed; 
        const L_Logout = pads.L.vy > C.unlockSpeed;
        const R_Logout = pads.R.vy < -C.unlockSpeed;

        if (mode === 'normal') {
            if (L_Unlock && R_Unlock) changeProgress(5);
            else if (L_Logout && R_Logout) changeProgress(-5);
            else {
                if (unlockProgress > 0) unlockProgress -= 1;
                if (unlockProgress < 0) unlockProgress += 1;
            }
        }

        // UPDATE UI
        const hub = document.getElementById('hub');
        const val = document.getElementById('val');
        
        if (unlockProgress >= 100 && mode !== 'celebrate') {
            mode = 'celebrate';
            val.innerText = "OPEN";
            val.style.color = C.colors.good;
            // EXPLOSION
            for(let i=0; i<200; i++) particles.push(new Confetti());
            finish('?paradox=unlock', 2000); // Wait 2s before redirect
        } else if (unlockProgress <= -100 && mode !== 'horror') {
            mode = 'horror';
            val.innerText = "DIE";
            val.style.color = '#500';
            hub.style.borderColor = '#500';
            finish('?paradox=logout', 4000); // 4s of horror
        } else if (mode === 'normal') {
            val.innerText = Math.abs(Math.floor(unlockProgress)) + "%";
            val.style.color = '#555';
        }

        // DRAW CONFETTI
        particles.forEach((p, i) => {
            p.update(); p.draw();
            if(p.life<=0) particles.splice(i,1);
        });

        // DRAW PADS
        drawPad(pads.L); drawPad(pads.R);

        requestAnimationFrame(loop);
    }

    function horrorLoop() {
        // Red fade trail
        ctx.fillStyle = 'rgba(20,0,0,0.1)';
        ctx.fillRect(0,0,W,H);

        // Spawn Skulls randomly
        if(Math.random() < 0.2) skulls.push(new HorrorSkull());

        skulls.forEach(s => {
            s.update();
            s.draw();
        });

        // Shake Canvas
        const shake = Math.random() * 10;
        canvas.style.transform = 'translate('+(Math.random()*10 -5)+'px, '+(Math.random()*10 -5)+'px)';

        requestAnimationFrame(loop);
    }

    function changeProgress(amt) {
        unlockProgress += amt;
        const col = amt > 0 ? C.colors.good : C.colors.bad;
        pads.L.col = col; pads.R.col = col;
        document.getElementById('hub').style.borderColor = col;
    }

    function updatePad(p) {
        if (!p.holding) {
            p.vy *= C.friction; p.vx *= C.friction;
            p.y += p.vy; p.x += p.vx;
            if(p.y < -50) p.y = H + 50; if(p.y > H + 50) p.y = -50;
        }
    }

    function drawPad(p) {
        ctx.shadowBlur = 20; ctx.shadowColor = p.col; ctx.fillStyle = p.col;
        ctx.beginPath();
        const stretch = 1 + Math.min(Math.abs(p.vy)*0.02, 0.8);
        ctx.ellipse(p.x, p.y, 40/stretch, 40*stretch, 0, 0, Math.PI*2);
        ctx.fill();
        ctx.shadowBlur = 0; ctx.fillStyle = '#fff';
        ctx.beginPath(); ctx.arc(p.x, p.y, 4, 0, Math.PI*2); ctx.fill();
    }

    // --- NETWORKING ---
    function finish(urlParam, delay) {
        // Send request immediately
        fetch(window.location.pathname + urlParam, {method:'POST'})
        .then(() => {
            setTimeout(() => {
                if (urlParam.includes('logout')) {
                    // HAHAHA SCREEN
                    document.body.innerHTML = '<div class="haha-screen">hahahahahah<br>hahahahahah<br>hahahahahah</div>';
                    // Optional: Redirect back to lock screen after a moment
                    setTimeout(() => window.location.href = window.location.pathname, 2000);
                } else {
                    // Normal Refresh (Clear params)
                    window.location.href = window.location.pathname;
                }
            }, delay);
        });
    }

    // INPUT HANDLERS
    const getSide = (x) => x < W/2 ? 'L' : 'R';
    window.addEventListener('touchstart', e => {
        e.preventDefault();
        for(let i=0; i<e.touches.length; i++) {
            const t = e.touches[i];
            const p = pads[getSide(t.clientX)];
            p.holding = true; p.x = t.clientX; p.y = t.clientY; p.lastY = t.clientY; p.vy=0;
            if(navigator.vibrate) navigator.vibrate(10);
        }
    }, {passive:false});

    window.addEventListener('touchmove', e => {
        e.preventDefault();
        for(let i=0; i<e.touches.length; i++) {
            const t = e.touches[i];
            const p = pads[getSide(t.clientX)];
            if (p.holding) {
                p.x = t.clientX; p.y = t.clientY; p.vy = t.clientY - p.lastY; p.lastY = t.clientY;
            }
        }
    }, {passive:false});

    window.addEventListener('touchend', e => {
        for(let i=0; i<e.changedTouches.length; i++) {
            pads[getSide(e.changedTouches[i].clientX)].holding = false;
        }
    });

    // KEYBOARD DEBUG
    window.addEventListener('keydown', e => {
        if(e.key=='w') pads.L.vy -= 25;
        if(e.key=='s') pads.L.vy += 25;
        if(e.key=='ArrowUp') pads.R.vy -= 25;
        if(e.key=='ArrowDown') pads.R.vy += 25;
    });

    loop();
</script>
</body>
</html>
`

