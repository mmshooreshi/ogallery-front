<!-- app/pages/admin/db-explorer.vue -->
<script setup lang="ts">
import { ref, computed } from 'vue'
import { useLocalStorage, useDebounceFn } from '@vueuse/core'
import {
  useVueTable,
  getCoreRowModel,
  getSortedRowModel,
  getFilteredRowModel,
} from '@tanstack/vue-table'

type SavedQuery = {
  id: string
  name: string
  profile: string
  language: 'sql' | 'prisma'
  query: string
  cachedRows?: any[]
  updatedAt: number
}

const profiles = ref<string[]>(['Default'])
const activeProfile = ref('Default')

const savedQueries = useLocalStorage<SavedQuery[]>(
  'admin.dbExplorer.queries',
  []
)

const editorQuery = ref('')
const editorLang = ref<'sql' | 'prisma'>('sql')
const rows = ref<any[]>([])
const loading = ref(false)
const error = ref<string | null>(null)
const errorMsg = ref<string | null>(null)
const copied = ref<boolean>(false)

const columns = computed(() => {
  if (!rows.value.length) return []
  return Object.keys(rows.value[0]).map(key => ({
    accessorKey: key,
    header: key,
    cell: (info: any) => {
      const v = info.getValue()
      return typeof v === 'object'
        ? JSON.stringify(v)
        : String(v)
    },
  }))
})

const table = useVueTable({
  get data() { return rows.value },
  get columns() { return columns.value },
  getCoreRowModel: getCoreRowModel(),
  getSortedRowModel: getSortedRowModel(),
  getFilteredRowModel: getFilteredRowModel(),
})

function copyText(text: string) {
  return navigator.clipboard.writeText(text)
}
const copiedColumn = ref<string | null>(null)

function copyColumn(columnId: string) {
  const values = table.getRowModel().rows.map(r => r.getValue(columnId))
  navigator.clipboard.writeText(values.join(',\n'))
  copiedColumn.value = columnId
  setTimeout(() => copiedColumn.value = null, 1200)
}


function copyRow(row: any) {
  const obj = row.original
  copyText(JSON.stringify(obj, null, 2))
}

function copyAll() {
  copyText(JSON.stringify(rows.value, null, 2))
}

function copyAllTSV() {
  if (!rows.value.length) return

  const headers = Object.keys(rows.value[0])
  const lines = rows.value.map(r =>
    headers.map(h => JSON.stringify(r[h] ?? '')).join('\t')
  )

  copyText([headers.join('\t'), ...lines].join('\n'))
}

function removeSaved(id: string) {
  savedQueries.value = savedQueries.value.filter(q => q.id !== id)
}


const runQuery = useDebounceFn(async () => {
  loading.value = true
  error.value = null
  errorMsg.value = null
  try {
    const res = await $fetch<{ rows: any[] }>(
      '/_admin/db/query',
      {
        method: 'POST',
        body: {
          language: editorLang.value,
          query: editorQuery.value,
        },
      }
    )
    rows.value = res.rows
  } catch (e: any) {
    errorMsg.value = e?.data?.message || ""
    error.value = e?.data?.statusMessage || e.message
  } finally {
    loading.value = false
  }
}, 300)


async function copyToClipboard() {
    try {
    await navigator.clipboard.writeText(errorMsg.value || "");
    copied.value = true;
    setTimeout(() => {
        copied.value = false;
    }, 2000); // Reset after 2 seconds
    } catch (err) {
    console.error('Failed to copy: ', err);
    }
}

function saveCurrentQuery() {
  const id = crypto.randomUUID()
  savedQueries.value.push({
    id,
    name: `Query ${savedQueries.value.length + 1}`,
    profile: activeProfile.value,
    language: editorLang.value,
    query: editorQuery.value,
    cachedRows: rows.value,
    updatedAt: Date.now(),
  })
}

function loadSaved(q: SavedQuery) {
  editorLang.value = q.language
  editorQuery.value = q.query
  rows.value = q.cachedRows || []
}
</script>

<template>
  <section class="p-4 space-y-4">
    <header class="flex flex-col md:flex-row gap-4">
      <h1 class="text-xl font-semibold">Admin DB Explorer</h1>

      <select v-model="activeProfile" class="border px-2 py-1">
        <option v-for="p in profiles" :key="p">{{ p }}</option>
      </select>
    </header>

    <!-- QUERY EDITOR -->
    <div class="space-y-2">
      <div class="flex gap-2">
        <select v-model="editorLang" class="border px-2 py-1">
          <option value="sql">SQL</option>
          <option value="prisma">Prisma</option>
        </select>

        <button
          class="px-3 py-1 bg-black text-white rounded"
          :disabled="loading"
          @click="runQuery"
        >
          Run
        </button>

        <button
            class="px-3 py-1 border rounded"
            @click="copyAll"
            >
            Copy All
        </button>
        <button
            class="px-3 py-1 border rounded"
            @click="copyAllTSV"
            >
            copyAllTSV
        </button>

        <button
          class="px-3 py-1 border rounded"
          @click="saveCurrentQuery"
        >
          Save
        </button>
      </div>

      <textarea
        v-model="editorQuery"
        class="w-full h-32 border p-2 font-mono text-xs"
        placeholder="SELECT * FROM &quot;Entry&quot; LIMIT 10"
      />
    </div>

    <p v-if="error" class="text-red-600 text-xs">{{ error }}</p>
  <div class="flex-inline gap-2">
    <!-- Paragraph acts as the copy button -->
    <p
      id="error-msg"
      v-if="errorMsg"
      @click="copyToClipboard"
      class="cursor-pointer text-red-600 text-sm"
    >
      {{ errorMsg }}
    </p>

    <!-- Feedback message after copying -->
    <div v-show="copied" id="success-message">
      <div class="inline-flex items-center">
        <svg
          class="w-3 h-3 me-1"
          aria-hidden="true"
          xmlns="http://www.w3.org/2000/svg"
          width="24"
          height="24"
          fill="none"
          viewBox="0 0 24 24"
        >
          <path
            stroke="currentColor"
            stroke-linecap="round"
            stroke-linejoin="round"
            stroke-width="2"
            d="M5 11.917 9.724 16.5 19 7.5"
          />
        </svg>
        Copied!
      </div>
    </div>
  </div>


    <!-- RESULTS TABLE -->
    <div
      v-if="rows.length"
      class="overflow-auto border rounded"
    >
    
      <table class="min-w-full text-xs">
        <thead class="sticky top-0 bg-gray-100 z-10">
        <tr>
            <th
            v-for="h in table.getHeaderGroups()?.[0]?.headers || []"
            :key="h.id"
            class="px-2 py-1 text-left select-none"
            >
            <div class="flex items-center gap-1">
                <!-- COLUMN NAME -->
                <span class="font-medium truncate">
                {{ h.column.id }}
                </span>

                <!-- SORT BUTTON -->
                <button
                class="opacity-50 hover:opacity-100"
                title="Sort"
                @click="h.column.toggleSorting()"
                >
                <Icon
                    v-if="!h.column.getIsSorted()"
                    name="mdi:sort"
                    class="w-4 h-4"
                />
                <Icon
                    v-else-if="h.column.getIsSorted() === 'asc'"
                    name="mdi:sort-ascending"
                    class="w-4 h-4"
                />
                <Icon
                    v-else
                    name="mdi:sort-descending"
                    class="w-4 h-4"
                />
                </button>

                <!-- COPY COLUMN -->
                <button
                class="opacity-50 hover:opacity-100"
                title="Copy column"
                @click="copyColumn(h.column.id)"
                >
                    <Icon
                    v-if="copiedColumn === h.column.id"
                    name="mdi:check"
                    class="w-4 h-4 text-green-600"
                    />
                    <Icon
                    v-else
                    name="mdi:content-copy"
                    class="w-4 h-4"
                    />
                </button>
            </div>
            </th>
        </tr>
        </thead>
        <tbody>
          <tr
            v-for="row in table.getRowModel().rows"
            :key="row.id"
            class="border-t hover:bg-gray-50 group"
          >
            <td
            v-for="cell in row.getVisibleCells()"
            :key="cell.id"
            class="px-2 py-1 whitespace-nowrap cursor-copy hover:bg-gray-100"
            @click="copyText(String(cell.getValue()))"
            title="Click to copy cell"
            >
            {{ cell.renderValue() }}
            </td>
            <td class="px-1 py-1 text-[10px] opacity-50 group-hover:opacity-100">
                <button
                    class="underline"
                    @click.stop="copyRow(row)"
                >
                    Copy
                </button>
            </td>


          </tr>
        </tbody>
      </table>
    </div>

    <!-- SAVED QUERIES -->
    <section class="space-y-2">
    <h2 class="font-semibold">Saved Queries</h2>

    <div
        v-for="q in savedQueries.filter(q => q.profile === activeProfile)"
        :key="q.id"
        class="border p-2 rounded flex justify-between items-center"
    >
        <div>
        <strong>{{ q.name }}</strong>
        <div class="text-xs opacity-60">{{ q.language }}</div>
        </div>

        <div class="flex gap-2">
        <button
            class="text-xs underline"
            @click="loadSaved(q)"
        >
            Load
        </button>

        <button
            class="text-xs text-red-600 underline"
            @click="removeSaved(q.id)"
        >
            Remove
        </button>
        </div>
    </div>
    </section>

  </section>
</template>
